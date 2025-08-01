import axios from 'axios';
import mongoose from 'mongoose'; // Import mongoose for transactions
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// 1. INITIATE PAYMENT
export const initiateKhaltiPayment = async (req, res) => {
    // --- Read environment variables inside the function to avoid module-loading race conditions ---
    const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
    const KHALTI_API_URL = process.env.KHALTI_URL;
    const CLIENT_URL = process.env.CLIENT_URL;

    // --- Add a server configuration check ---
    if (!KHALTI_SECRET_KEY || !KHALTI_API_URL || !CLIENT_URL) {
        console.error("Server configuration error: Critical environment variables (Khalti or Client URL) are missing.");
        return res.status(500).json({ success: false, message: "Server configuration error. Please contact support." });
    }

    const { items, address, phone, applyDiscount } = req.body;
    const deliveryFee = 50;

    // Basic validation
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: "Cart is empty." });
    if (!address || !phone) return res.status(400).json({ success: false, message: "Address and phone are required." });

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        let itemsTotal = 0;
        const orderItems = [];

        // Validate all products and calculate total *before* creating the order
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(400).json({ success: false, message: `Product with ID ${item.product} not found.` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Product "${product.name}" is out of stock.` });
            }
            itemsTotal += product.price * item.quantity;
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                imageUrl: product.imageUrl,
            });
        }

        let finalAmount = itemsTotal + deliveryFee;
        let discountAppliedFlag = false;
        if (applyDiscount && user.groceryPoints >= 150) {
            finalAmount -= itemsTotal * 0.25; // Apply 25% discount
            discountAppliedFlag = true;
        }

        // Create a new order with a 'Pending Payment' status
        const newOrder = new Order({
            customer: req.user._id,
            items: orderItems,
            amount: finalAmount,
            address,
            phone,
            paymentMethod: 'Khalti',
            status: 'Pending Payment',
            discountApplied: discountAppliedFlag,
            pointsAwarded: 0,
        });
        await newOrder.save();
        
        // --- FIX: Add the REQUIRED return_url and website_url fields ---
        const khaltiData = {
            return_url: `${CLIENT_URL}/payment-success`, // URL user is redirected to
            website_url: CLIENT_URL,                    // Your main client URL
            amount: Math.round(finalAmount * 100),      // Amount in paisa
            purchase_order_id: newOrder._id.toString(), // Your internal order ID
            purchase_order_name: `Order from Hamro Grocery`,
            customer_info: {
                name: user.fullName,
                email: user.email,
                phone: phone,
            },
        };

        // Call Khalti's Initiation API
        const khaltiResponse = await axios.post(
            `${KHALTI_API_URL}/epayment/initiate/`,
            khaltiData,
            { headers: { 'Authorization': `Key ${KHALTI_SECRET_KEY}` } }
        );

        // Save the payment identifier (pidx) from Khalti to our order
        newOrder.pidx = khaltiResponse.data.pidx;
        await newOrder.save();

        // Send the pidx to the Flutter app so it can launch the Khalti widget
        res.status(200).json({
            success: true,
            message: "Payment initiated successfully.",
            pidx: khaltiResponse.data.pidx,
        });

    } catch (error) {
        // This log is critical. It will show the real error in your backend terminal.
        console.error("Khalti initiation failed:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Payment initiation failed." });
    }
};

// 2. VERIFY PAYMENT
export const verifyKhaltiPayment = async (req, res) => {
    const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
    const KHALTI_API_URL = process.env.KHALTI_URL;
    const { pidx } = req.body;

    if (!pidx) {
        return res.status(400).json({ success: false, message: "Payment identifier (pidx) is required." });
    }

    try {
        // Verify the payment status with Khalti's server
        const verificationResponse = await axios.post(
            `${KHALTI_API_URL}/epayment/lookup/`,
            { pidx },
            { headers: { 'Authorization': `Key ${KHALTI_SECRET_KEY}` } }
        );

        if (verificationResponse.data.status !== 'Completed') {
            return res.status(400).json({ success: false, message: `Payment not completed. Status: ${verificationResponse.data.status}` });
        }
        
        const order = await Order.findOne({ pidx });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found for this payment." });
        }
        
        // Security Check: Verify that the amount paid matches the order amount
        const paidAmountInPaisa = verificationResponse.data.total_amount;
        if (paidAmountInPaisa !== Math.round(order.amount * 100)) {
            console.error(`TAMPERING DETECTED! Khalti Amount: ${paidAmountInPaisa}, Order Amount: ${order.amount * 100}`);
            return res.status(400).json({ success: false, message: "Amount mismatch. Payment rejected." });
        }
        
        // --- FIX: Use a database transaction to ensure all updates succeed or none do ---
        if (order.status === 'Pending Payment') {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                // Find the user within the transaction session
                const user = await User.findById(order.customer).session(session);

                // Update order status
                order.status = 'Processing';
                
                // Prepare stock updates
                const productUpdates = order.items.map(item => ({
                    updateOne: {
                        filter: { _id: item.product },
                        update: { $inc: { stock: -item.quantity } },
                    }
                }));
                // Execute all stock updates
                await Product.bulkWrite(productUpdates, { session });
                
                // Update user points if a discount was applied
                if (order.discountApplied && user) {
                    user.groceryPoints -= 150;
                    await user.save({ session });
                }

                // Save the final order status
                await order.save({ session });

                // If all operations succeed, commit the transaction
                await session.commitTransaction();

            } catch (transactionError) {
                // If any operation fails, abort the entire transaction
                await session.abortTransaction();
                console.error("Payment verification transaction failed:", transactionError);
                throw new Error("Failed to update order details after payment."); // This will be caught by the outer catch
            } finally {
                // Always end the session
                session.endSession();
            }
        }

        res.status(200).json({ success: true, message: "Payment verified and order placed successfully!" });

    } catch (error) {
        console.error("Khalti verification failed:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Payment verification failed." });
    }
};
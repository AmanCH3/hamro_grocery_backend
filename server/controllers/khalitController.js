import axios from 'axios';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// --- CONFIGURATION ---
// Use Khalti's official endpoint. 'a.khalti.com' is for both test and live modes.
const KHALTI_API_URL = "https://a.khalti.com/api/v2"; 
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;

// URLs for redirection after payment
const FRONTEND_SUCCESS_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success`;
const FRONTEND_FAILURE_URL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`;

// Fail-fast check: The server should not start if critical keys are missing.
if (!KHALTI_SECRET_KEY) {
    console.error("FATAL ERROR: KHALTI_SECRET_KEY is not defined in the .env file.");
    process.exit(1);
}

/**
 * @description Initiates a payment with Khalti.
 * @route POST /api/payment/khalti/initiate
 */
export const initiateKhaltiPayment = async (req, res) => {
    try {
        // Use 'cartItems' for consistency with your eSewa controller
        const { cartItems, phone, address, applyDiscount } = req.body;
        const user = await User.findById(req.user._id);

        if (!user || !cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid request.' });
        }

        const deliveryFee = 50;
        let itemsTotal = 0;
        const orderItems = [];

        // Efficiently fetch all products at once, just like your eSewa controller
        const productIds = cartItems.map(item => item._id);
        const productsInDb = await Product.find({ '_id': { $in: productIds } });

        for (const cartItem of cartItems) {
            const product = productsInDb.find(p => p._id.toString() === cartItem._id);
            if (!product) {
                return res.status(404).json({ success: false, message: `Product with ID ${cartItem._id} not found.` });
            }
            if (product.stock < cartItem.quantity) {
                return res.status(400).json({ success: false, message: `Product ${product.name} is out of stock.` });
            }
            itemsTotal += product.price * cartItem.quantity;
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                imageUrl: product.imageUrl,
            });
        }

        let finalAmount = itemsTotal + deliveryFee;
        let discountAppliedFlag = false;

        if (applyDiscount && user.groceryPoints >= 150) {
            finalAmount -= (itemsTotal * 0.25);
            discountAppliedFlag = true;
        }

        // Create the order in 'Pending Payment' state *before* sending to Khalti
        const newOrder = new Order({
            customer: user._id,
            items: orderItems,
            amount: finalAmount,
            address: address,
            phone: phone,
            status: 'Pending Payment',
            paymentMethod: 'Khalti',
            discountApplied: discountAppliedFlag,
        });
        await newOrder.save();

        // This is the data Khalti's API needs
        const khaltiData = {
            return_url: `${process.env.BACKEND_URL}/api/payment/khalti/verify`, // Khalti will redirect user here
            website_url: process.env.FRONTEND_URL,
            amount: Math.round(finalAmount * 100), // Khalti requires amount in paisa (integer)
            purchase_order_id: newOrder._id.toString(),
            purchase_order_name: `Order from Hamro Grocery #${newOrder._id.toString().slice(-6)}`,
            customer_info: {
                name: user.fullName,
                email: user.email,
                phone: phone,
            },
        };

        const khaltiResponse = await axios.post(
            `${KHALTI_API_URL}/epayment/initiate/`,
            khaltiData,
            { headers: { 'Authorization': `Key ${KHALTI_SECRET_KEY}` } }
        );

        // Save Khalti's unique payment ID (pidx) to our order
        newOrder.transactionId = khaltiResponse.data.pidx;
        await newOrder.save();

        // Send the payment URL to the frontend, which will redirect the user
        res.status(200).json({
            success: true,
            message: "Payment initiated successfully.",
            payment_url: khaltiResponse.data.payment_url,
        });

    } catch (error) {
        console.error("Khalti initiation failed:");
        if (error.response) {
            console.error("-> Khalti API Error:", error.response.data);
        } else {
            console.error("-> General Server Error:", error.message);
        }
        res.status(500).json({ success: false, message: "Server Error while initiating payment." });
    }
};


/**
 * @description Verifies a payment with Khalti after user is redirected back.
 * @route GET /api/payment/khalti/verify
 */
export const verifyKhaltiPayment = async (req, res) => {
    try {
        // After payment, Khalti redirects to the `return_url` with data in query params
        const { pidx, status, message } = req.query;

        if (!pidx) {
            return res.redirect(`${FRONTEND_FAILURE_URL}?payment=failure&message=${encodeURIComponent('Payment identifier missing.')}`);
        }

        if (status !== 'Completed') {
            // If payment failed or was cancelled, delete the pending order to prevent clutter
            await Order.findOneAndDelete({ transactionId: pidx });
            return res.redirect(`${FRONTEND_FAILURE_URL}?payment=failure&message=${encodeURIComponent(message || 'Payment was not completed.')}`);
        }

        // IMPORTANT: Perform a server-to-server check to securely verify the transaction
        const verificationResponse = await axios.post(
            `${KHALTI_API_URL}/epayment/lookup/`,
            { pidx },
            { headers: { 'Authorization': `Key ${KHALTI_SECRET_KEY}` } }
        );

        if (verificationResponse.data.status !== 'Completed') {
            await Order.findOneAndDelete({ transactionId: pidx });
            return res.redirect(`${FRONTEND_FAILURE_URL}?payment=failure&message=${encodeURIComponent(`Payment verification failed. Status: ${verificationResponse.data.status}`)}`);
        }
        
        const order = await Order.findOne({ transactionId: pidx }).populate('items');
        if (!order) {
            return res.redirect(`${FRONTEND_FAILURE_URL}?payment=failure&message=${encodeURIComponent('Order not found for this transaction.')}`);
        }
        
        // Security Check: Verify that the paid amount matches the order amount
        const paidAmountInPaisa = verificationResponse.data.total_amount;
        if (paidAmountInPaisa !== Math.round(order.amount * 100)) {
            console.error(`TAMPERING DETECTED! Khalti Amount: ${paidAmountInPaisa}, Order Amount: ${order.amount * 100}`);
            order.status = 'Disputed'; // Mark order for manual review
            await order.save();
            return res.redirect(`${FRONTEND_FAILURE_URL}?payment=failure&message=${encodeURIComponent('Amount mismatch. Payment has been flagged.')}`);
        }

        // Process the order if it's still in the 'Pending Payment' state
        if (order.status === 'Pending Payment') {
            const user = await User.findById(order.customer);
            let messageParts = ['Payment successful! Your order has been placed.'];

            order.status = 'Pending'; // Or 'Processing', to match your business logic

            // 1. Update stock
            const productUpdates = order.items.map(item => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { stock: -item.quantity } }
                }
            }));
            await Product.bulkWrite(productUpdates);
            
            // 2. Handle points (discount and awarding)
            if (order.discountApplied && user) {
                user.groceryPoints -= 150;
                messageParts.push('A 25% discount was applied.');
            }

            const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (itemsTotal >= 2000) {
                const pointsToAward = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
                user.groceryPoints += pointsToAward;
                order.pointsAwarded = pointsToAward;
                messageParts.push(`You earned ${pointsToAward} Grocery Points.`);
            }

            // 3. Save all changes
            await user.save();
            await order.save();

            return res.redirect(`${FRONTEND_SUCCESS_URL}?message=${encodeURIComponent(messageParts.join(' '))}`);
        }

        // If order was already processed (e.g., user refreshed the verification page), just redirect
        return res.redirect(`${FRONTEND_SUCCESS_URL}?message=${encodeURIComponent('Your order has already been confirmed.')}`);

    } catch (error) {
        console.error("Khalti verification failed:");
        if (error.response) {
            console.error("-> Khalti API Error:", error.response.data);
        } else {
            console.error("-> General Server Error:", error.message);
        }
        return res.redirect(`${FRONTEND_FAILURE_URL}?payment=failure&message=${encodeURIComponent('An internal server error occurred during verification.')}`);
    }
};
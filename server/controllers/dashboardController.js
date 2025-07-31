
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const getDashboardStats = async (req, res) => {
  try {
    
    const totalRevenuePipeline = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);

  
    const totalOrders = await Order.countDocuments({ 
        status: { $in: ['Pending', 'Shipped'] } 
    });

    
    const totalCustomers = await User.countDocuments({ role: 'normal' });

    
    const salesData = await Order.aggregate([
        { $match: { status: 'Delivered' } },
        { 
          $group: {
            _id: { month: { $month: "$createdAt" } },
            sales: { $sum: "$amount" } 
          }
        },
        { $sort: { "_id.month": 1 } }
    ]);
    
    
    const topProducts = await Order.aggregate([
        { $unwind: "$items" },
        { $group: {
            _id: "$items.product",
            sales: { $sum: "$items.quantity" }
        }},
        { $sort: { sales: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productInfo' }},
        { $unwind: "$productInfo" },
        { $project: { name: '$productInfo.name', sales: '$sales' }}
    ]);

    
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'fullName email');

    
    res.status(200).json({
      totalRevenue: totalRevenuePipeline.length > 0 ? totalRevenuePipeline[0].total : 0,
      totalOrders, 
      totalCustomers,
      salesData,
      topProducts,
      recentOrders
    });

  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ message: "An internal server error occurred while fetching dashboard statistics." });
  }
};
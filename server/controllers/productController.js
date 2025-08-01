import Product from '../models/Product.js';
import Category from '../models/Category.js';

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const createProduct = async (req, res) => {
  const product = new Product(req.body);
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
export const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getProductsByCategory = async (req, res) => {
    try {
        const { categoryName } = req.params;
        const category = await Category.findOne({ 
            name: { $regex: new RegExp(`^${categoryName}$`, 'i') } 
        });
        
        if (!category) {
            return res.status(404).json({ message: `Category '${categoryName}' not found.` });
        }
        const products = await Product.find({ category: category._id })
                                      .populate('category');
        
        res.status(200).json(products);

    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
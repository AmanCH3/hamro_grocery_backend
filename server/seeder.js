import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js'; // Adjust path if necessary
import Category from './models/Category.js'; // Adjust path if necessary

// Load env vars
dotenv.config();

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

// --- DEFINE YOUR SEED DATA HERE ---

// 1. Define Categories
const categories = [
  { name: 'Electronics' },
  { name: 'Books' },
  { name: 'Clothing' },
  { name: 'Home & Kitchen' },
];

// 2. Define Products (using category names as placeholders)
// We use a "categoryName" placeholder which we will replace with the actual ID later.
const products = [
  {
    name: 'Apple iPhone 14 Pro',
    categoryName: 'Electronics',
    price: 999.99,
    stock: 50,
    imageUrl: 'https://example.com/images/iphone14.jpg',
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    categoryName: 'Electronics',
    price: 399.0,
    stock: 75,
    imageUrl: 'https://example.com/images/sonyxm5.jpg',
  },
  {
    name: 'The Great Gatsby',
    categoryName: 'Books',
    price: 10.99,
    stock: 120,
    imageUrl: 'https://example.com/images/gatsby.jpg',
  },
  {
    name: 'Atomic Habits',
    categoryName: 'Books',
    price: 15.50,
    stock: 200,
    imageUrl: 'https://example.com/images/atomichabits.jpg',
  },
  {
    name: "Men's Classic T-Shirt",
    categoryName: 'Clothing',
    price: 25.0,
    stock: 300,
    imageUrl: 'https://example.com/images/tshirt.jpg',
  },
  {
    name: 'Nespresso VertuoPlus Coffee Maker',
    categoryName: 'Home & Kitchen',
    price: 159.0,
    stock: 40,
    imageUrl: 'https://example.com/images/nespresso.jpg',
  },
];

// --- SEEDER LOGIC ---

// Function to import data
const importData = async () => {
  try {
    // Clear existing data
    await Category.deleteMany();
    await Product.deleteMany();
    console.log('Old data cleared...');

    // Insert categories
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories imported...');

    // Create a map of category names to their IDs for easy lookup
    const categoryMap = createdCategories.reduce((map, category) => {
      map[category.name] = category._id;
      return map;
    }, {});

    // Prepare products with the correct category ObjectId
    const productsToInsert = products.map((product) => {
      return {
        ...product,
        category: categoryMap[product.categoryName], // Replace name with ID
      };
    });

    // Insert products
    await Product.insertMany(productsToInsert);
    console.log('Products imported...');

    console.log('✅ Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error importing data: ${error}`);
    process.exit(1);
  }
};

// Function to destroy data
const destroyData = async () => {
  try {
    await Category.deleteMany();
    await Product.deleteMany();
    console.log('✅ Data Destroyed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error destroying data: ${error}`);
    process.exit(1);
  }
};

// --- SCRIPT EXECUTION ---

// IIFE to run the script
(async () => {
  await connectDB();

  // Check for command line arguments
  if (process.argv[2] === '-d') {
    await destroyData();
  } else if (process.argv[2] === '-i') {
    await importData();
  } else {
    console.log('Please provide a flag: -i to import, -d to destroy');
    process.exit();
  }
})();
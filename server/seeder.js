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

// --- GROCERY STORE SEED DATA ---

// 1. Define Grocery Categories
const categories = [
  { name: 'Fruits & Vegetables' },
  { name: 'Dairy & Eggs' },
  { name: 'Meat & Seafood' },
  { name: 'Bakery' },
  { name: 'Pantry Staples' },
  { name: 'Snacks & Beverages' },
  { name: 'Frozen Foods' },
  { name: 'Health & Personal Care' },
];

// 2. Define Grocery Products with valid image URLs
const products = [
  // Fruits & Vegetables
  {
    name: 'Fresh Bananas',
    categoryName: 'Fruits & Vegetables',
    price: 120,
    stock: 150,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop',
  },
  {
    name: 'Organic Apples',
    categoryName: 'Fruits & Vegetables',
    price: 120,
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&h=400&fit=crop',
  },
  {
    name: 'Fresh Carrots',
    categoryName: 'Fruits & Vegetables',
    price: 100,
    stock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop',
  },
  {
    name: 'Baby Spinach',
    categoryName: 'Fruits & Vegetables',
    price: 50,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop',
  },
  {
    name: 'Red Bell Peppers',
    categoryName: 'Fruits & Vegetables',
    price: 70,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=400&fit=crop',
  },

  // Dairy & Eggs
  {
    name: 'Whole Milk',
    categoryName: 'Dairy & Eggs',
    price: 35,
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop',
  },
  {
    name: 'Free Range Eggs',
    categoryName: 'Dairy & Eggs',
    price: 45,
    stock: 75,
    imageUrl: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=400&h=400&fit=crop',
  },
  {
    name: 'Greek Yogurt',
    categoryName: 'Dairy & Eggs',
    price: 45,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop',
  },
  {
    name: 'Cheddar Cheese',
    categoryName: 'Dairy & Eggs',
    price: 110,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&h=400&fit=crop',
  },

  // Meat & Seafood
  {
    name: 'Fresh Chicken Breast',
    categoryName: 'Meat & Seafood',
    price: 300,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=400&fit=crop',
  },
  {
    name: 'Ground Beef',
    categoryName: 'Meat & Seafood',
    price: 400,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
  },
  {
    name: 'Fresh Salmon Fillet',
    categoryName: 'Meat & Seafood',
    price: 12.99,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
  },

  // Bakery
  {
    name: 'Whole Wheat Bread',
    categoryName: 'Bakery',
    price: 500,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  },
  {
    name: 'Fresh Croissants',
    categoryName: 'Bakery',
    price: 120,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab794f27d2e8?w=400&h=400&fit=crop',
  },
  {
    name: 'Chocolate Muffins',
    categoryName: 'Bakery',
    price: 180,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=400&fit=crop',
  },

  // Pantry Staples
  {
    name: 'Jasmine Rice',
    categoryName: 'Pantry Staples',
    price: 150,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  },
  {
    name: 'Olive Oil',
    categoryName: 'Pantry Staples',
    price: 200,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop',
  },
  {
    name: 'Pasta',
    categoryName: 'Pantry Staples',
    price: 120,
    stock: 150,
    imageUrl: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400&h=400&fit=crop',
  },
  {
    name: 'Black Beans',
    categoryName: 'Pantry Staples',
    price: 150,
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop',
  },

  // Snacks & Beverages
  {
    name: 'Potato Chips',
    categoryName: 'Snacks & Beverages',
    price: 60,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop',
  },
  {
    name: 'Orange Juice',
    categoryName: 'Snacks & Beverages',
    price: 200,
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop',
  },
  {
    name: 'Sparkling Water',
    categoryName: 'Snacks & Beverages',
    price: 400,
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop',
  },
  {
    name: 'Mixed Nuts',
    categoryName: 'Snacks & Beverages',
    price: 120,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop',
  },

  // Frozen Foods
  {
    name: 'Frozen Blueberries',
    categoryName: 'Frozen Foods',
    price: 200,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  },
  {
    name: 'Frozen Pizza',
    categoryName: 'Frozen Foods',
    price: 400,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop',
  },
  {
    name: 'Ice Cream',
    categoryName: 'Frozen Foods',
    price: 120,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=400&h=400&fit=crop',
  },

  // Health & Personal Care
  {
    name: 'Toothpaste',
    categoryName: 'Health & Personal Care',
    price: 45,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
  },
  {
    name: 'Hand Sanitizer',
    categoryName: 'Health & Personal Care',
    price: 120,
    stock: 150,
    imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=400&fit=crop',
  },
  {
    name: 'Multivitamins',
    categoryName: 'Health & Personal Care',
    price: 100,
    stock: 75,
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
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

    console.log('✅ Grocery Data Imported Successfully!');
    console.log(`📊 Imported ${createdCategories.length} categories and ${productsToInsert.length} products`);
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
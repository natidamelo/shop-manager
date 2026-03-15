import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config/env.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Shop from '../models/Shop.js';

async function seed() {
  await mongoose.connect(config.mongoUri);

  // 1. Ensure Default Shop exists
  let shop = await Shop.findOne({ name: 'Default Shop' });
  if (!shop) {
    shop = await Shop.create({
      name: 'Default Shop',
      owner_email: 'admin@shop.com',
    });
    console.log('Default shop created.');
  }

  // 2. Seed Admin User
  const existing = await User.findOne({ email: 'admin@shop.com' });
  const hash = await bcrypt.hash('admin123', 10);
  if (!existing) {
    await User.create({
      email: 'admin@shop.com',
      password_hash: hash,
      name: 'Admin',
      role: 'admin',
      shop: shop._id,
    });
    console.log('Default admin created: admin@shop.com / admin123');
  } else {
    existing.password_hash = hash;
    if (!existing.shop) existing.shop = shop._id;
    await existing.save();
    console.log('Admin user updated/reset.');
  }

  // 3. Seed Categories
  const catCount = await Category.countDocuments({ shop: shop._id });
  if (catCount === 0) {
    await Category.insertMany([
      { name: 'Electronics', description: 'Electronic devices', shop: shop._id },
      { name: 'Groceries', description: 'Food and beverages', shop: shop._id },
      { name: 'General', description: 'General merchandise', shop: shop._id },
    ]);
    console.log('Sample categories created.');
  }

  console.log('Seed completed.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

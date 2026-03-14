import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config/env.js';
import User from '../models/User.js';
import Category from '../models/Category.js';

async function seed() {
  await mongoose.connect(config.mongoUri);

  const existing = await User.findOne({ email: 'admin@shop.com' });
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({
      email: 'admin@shop.com',
      password_hash: hash,
      name: 'Admin',
      role: 'admin',
    });
    console.log('Default admin created: admin@shop.com / admin123');
  } else {
    console.log('Admin user already exists.');
  }

  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    await Category.insertMany([
      { name: 'Electronics', description: 'Electronic devices' },
      { name: 'Groceries', description: 'Food and beverages' },
      { name: 'General', description: 'General merchandise' },
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

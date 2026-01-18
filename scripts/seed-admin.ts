// Script to create admin user
// Run: npx ts-node scripts/seed-admin.ts
// OR: node -e "$(cat scripts/seed-admin.js)"

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devreels';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const existing = await User.findOne({ email: 'admin@devreels.com' });
  if (existing) {
    console.log('Admin user already exists!');
    process.exit(0);
  }

  const hashed = await bcrypt.hash('admin123456', 12);
  await User.create({
    name: 'Admin',
    email: 'admin@devreels.com',
    password: hashed,
    role: 'admin',
  });

  console.log('✅ Admin created:');
  console.log('   Email: admin@devreels.com');
  console.log('   Password: admin123456');
  console.log('   ⚠️  Change password after first login!');
  process.exit(0);
}

seed().catch(console.error);

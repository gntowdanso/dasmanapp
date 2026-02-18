import 'dotenv/config'; // Make sure env vars are loaded before db.ts is imported
import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin@dasman.com';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const admin = await prisma.adminUser.upsert({
        where: { email },
        update: {},
        create: {
            name: 'Super Admin',
            email,
            password_hash: hashedPassword,
            role: 'SUPER_ADMIN',
        },
    });
    console.log('Admin user seeded:', admin);
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
}


main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

import { PrismaClient } from '../../generated/prisma/client.js';
import * as argon2 from 'argon2';

export async function seedUsers(prisma: PrismaClient) {
  console.log('🌱 Seeding Users...');

  const hashedPassword = await argon2.hash('Admin123!');

  const users = [
    {
      email: 'admin@jrkonveksi.com',
      name: 'Admin User',
      password: hashedPassword,
      phone: "81234567890",
      address: 'Jakarta, Indonesia',
      roleId: 1,
    },
    {
      email: 'user@jrkonveksi.com',
      name: 'Regular User',
      password: hashedPassword,
      phone: "81234567891",
      address: 'Bandung, Indonesia',
      roleId: 2,
    },
    {
      email: 'manager@jrkonveksi.com',
      name: 'Manager User',
      password: hashedPassword,
      phone: "81234567892",
      address: 'Surabaya, Indonesia',
      roleId: 3,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('✅ Users seeded successfully');
}
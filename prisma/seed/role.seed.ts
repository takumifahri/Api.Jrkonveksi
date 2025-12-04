import { PrismaClient } from '../../generated/prisma/client.js';

export async function seedRoles(prisma: PrismaClient) {
  console.log('🌱 Seeding Roles...');
  
  const roles = [
    {
      id: 1,
      name: 'Admin',
      description: 'Administrator role with full access',
    },
    {
      id: 2,
      name: 'User',
      description: 'Regular user role with limited access',
    },
    {
      id: 3,
      name: 'Manager',
      description: 'Manager role with elevated permissions',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
  }

  console.log('✅ Roles seeded successfully');
}
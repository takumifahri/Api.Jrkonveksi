import { seedRoles } from './seed/role.seed.js';
import { seedUsers } from './seed/user.seed.js';
import { seedMaterials } from './seed/material.seed.js';
import { prisma } from '../src/config/prisma.config.js';
import { seedModels } from './seed/model_baju.seed.js';
async function main() {
  console.log('🚀 Start seeding database...\n');

  try {
    await seedRoles(prisma);
    await seedUsers(prisma);
    await seedMaterials(prisma);
    await seedModels(prisma);

    console.log('\n✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });

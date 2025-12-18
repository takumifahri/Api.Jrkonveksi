import { PrismaClient, StatusMaterial } from '../../generated/prisma/client.js';

export async function seedMaterials(prisma: PrismaClient) {
  console.log('🌱 Seeding Materials...');

  const materials = [
    {
      unique_id: 'mat-001',
      name: 'Kain Katun Premium',
      description: 'Kain katun berkualitas tinggi untuk produksi baju',
      status: StatusMaterial.AVAILABLE,
    },
    {
      unique_id: 'mat-002',
      name: 'Kain Polyester',
      description: 'Kain polyester untuk jaket dan outer',
      status: StatusMaterial.AVAILABLE,
    },
    {
      unique_id: 'mat-003',
      name: 'Benang Jahit Putih',
      description: 'Benang jahit warna putih ukuran 40',
      status: StatusMaterial.UNAVAILABLE,
    },
    {
      unique_id: 'mat-004',
      name: 'Kancing Plastik',
      description: 'Kancing plastik berbagai ukuran',
      status: StatusMaterial.AVAILABLE,
    },
    {
      unique_id: 'mat-005',
      name: 'Resleting YKK',
      description: 'Resleting merk YKK berbagai ukuran',
      status: StatusMaterial.AVAILABLE,
    },
  ];

  for (const material of materials) {
    await prisma.materials.create({
      data: {
        ...material,
        unique_id: crypto.randomUUID(),
      },
    });
  }

  console.log('✅ Materials seeded successfully');
}
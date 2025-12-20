import { PrismaClient } from '../../generated/prisma/client.js';

export async function seedModels(prisma: PrismaClient) {
  console.log('🌱 Seeding Models...');

  const generateUniqueId = `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const modelBajus = [
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Kaos Polos',
        deskripsi: 'Kaos polos nyaman untuk sehari-hari',
        material: 'Cotton',
        rentang_harga: BigInt(50000),
    },
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Koko',
        deskripsi: 'Baju koko untuk acara keagamaan dan formal santai',
        material: 'Cotton, Linen',
        rentang_harga: BigInt(120000),
    },
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Baju Biasa',
        deskripsi: 'Baju santai harian, cocok untuk aktivitas sehari-hari',
        material: 'Cotton, Viscose',
        rentang_harga: BigInt(75000),
    },
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Kemeja Lengan Panjang',
        deskripsi: 'Kemeja formal berbahan katun untuk kantor',
        material: 'Cotton Blend, Polyester',
        rentang_harga: BigInt(150000),
    },
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Jaket Denim',
        deskripsi: 'Jaket denim awet untuk gaya kasual',
        material: 'Denim, Cotton',
        rentang_harga: BigInt(300000),
    },
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Hoodie',
        deskripsi: 'Hoodie tebal untuk cuaca dingin dan gaya santai',
        material: 'Fleece, Cotton',
        rentang_harga: BigInt(200000),
    },
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Polo Shirt',
        deskripsi: 'Polo shirt rapi untuk acara casual-smart',
        material: 'Cotton Pique, Elastane',
        rentang_harga: BigInt(90000),
    },
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Batik',
        deskripsi: 'Kemeja batik tradisional untuk acara formal dan semi-formal',
        material: 'Cotton, Silk',
        rentang_harga: BigInt(180000),
    },
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Dress Santai',
        deskripsi: 'Dress ringan untuk kegiatan sehari-hari dan hangout',
        material: 'Viscose, Rayon',
        rentang_harga: BigInt(140000),
    },
    {
        unique_id: `MDL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nama: 'Rompi Kulit',
        deskripsi: 'Rompi kulit untuk gaya edgy dan proteksi ringan',
        material: 'Genuine Leather, Cotton Lining',
        rentang_harga: BigInt(350000),
    },
];

for (const model of modelBajus) {
    await prisma.modelBaju.upsert({
        where: { unique_id: model.unique_id },
        update: {
            nama: model.nama,
            deskripsi: model.deskripsi,
            material: model.material,
            rentang_harga: model.rentang_harga,
        },
        create: model,
    });
}

  console.log('✅ Model baju seeded successfully');
}
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Créer un admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bigtank.com' },
    update: {},
    create: {
      email: 'admin@bigtank.com',
      name: 'Admin BigTank',
      passwordHash: '$2b$10$placeholder', // À remplacer par un vrai hash bcrypt
      role: UserRole.ADMIN,
      emailVerified: true,
      city: 'Dakar',
      region: 'Dakar',
    },
  });
  console.log(`Admin créé: ${admin.email}`);

  // Créer un vendeur de test
  const seller = await prisma.user.upsert({
    where: { email: 'vendeur@test.com' },
    update: {},
    create: {
      email: 'vendeur@test.com',
      phone: '221771234567',
      name: 'Moussa Diop',
      passwordHash: '$2b$10$placeholder',
      role: UserRole.SELLER,
      emailVerified: true,
      phoneVerified: true,
      city: 'Dakar',
      region: 'Dakar',
      sellerStats: {
        create: {
          totalSales: 0,
          totalListings: 0,
          commissionFreeRemaining: 1,
        },
      },
    },
  });
  console.log(`Vendeur créé: ${seller.email}`);

  // Créer un acheteur de test
  const buyer = await prisma.user.upsert({
    where: { email: 'acheteur@test.com' },
    update: {},
    create: {
      email: 'acheteur@test.com',
      phone: '221769876543',
      name: 'Fatou Sall',
      passwordHash: '$2b$10$placeholder',
      role: UserRole.USER,
      emailVerified: true,
      phoneVerified: true,
      city: 'Thiès',
      region: 'Thiès',
    },
  });
  console.log(`Acheteur créé: ${buyer.email}`);

  // Créer des annonces de test
  const listings = await Promise.all([
    prisma.listing.create({
      data: {
        sellerId: seller.id,
        slug: 'nike-air-max-90-taille-47',
        title: 'Nike Air Max 90 - Taille 47',
        description: 'Nike Air Max 90 en excellent état, portées quelques fois. Couleur noire, taille EU 47.',
        brand: 'Nike',
        model: 'Air Max 90',
        sizeEu: 47,
        sizeUs: 13,
        condition: 'LIKE_NEW',
        color: 'Noir',
        priceXof: 35000,
        locationCity: 'Dakar',
        locationRegion: 'Dakar',
      },
    }),
    prisma.listing.create({
      data: {
        sellerId: seller.id,
        slug: 'adidas-yeezy-boost-350-taille-48',
        title: 'Adidas Yeezy Boost 350 - Taille 48',
        description: 'Adidas Yeezy Boost 350 V2 neuves, jamais portées. Taille EU 48.',
        brand: 'Adidas',
        model: 'Yeezy Boost 350 V2',
        sizeEu: 48,
        sizeUs: 14,
        condition: 'NEW',
        color: 'Blanc',
        priceXof: 85000,
        locationCity: 'Dakar',
        locationRegion: 'Dakar',
      },
    }),
    prisma.listing.create({
      data: {
        sellerId: seller.id,
        slug: 'puma-rs-x-taille-46',
        title: 'Puma RS-X - Taille 46',
        description: 'Puma RS-X en bon état général. Quelques traces d\'usure normales.',
        brand: 'Puma',
        model: 'RS-X',
        sizeEu: 46,
        sizeUs: 12,
        condition: 'GOOD',
        color: 'Bleu/Blanc',
        priceXof: 20000,
        locationCity: 'Saint-Louis',
        locationRegion: 'Saint-Louis',
      },
    }),
  ]);

  console.log(`${listings.length} annonces créées`);
  console.log('Seed terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

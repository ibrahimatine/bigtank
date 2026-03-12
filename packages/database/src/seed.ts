import { PrismaClient, UserRole, ListingCondition, ListingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Mot de passe par defaut pour tous les comptes de test : Test1234
const DEFAULT_PASSWORD = 'Test1234';

function generateSlug(title: string, index: number): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + `-${index}`;
}

const SELLERS = [
  { email: 'moussa@test.com', name: 'Moussa Diop', phone: '221771234567', city: 'Dakar', region: 'Dakar' },
  { email: 'awa@test.com', name: 'Awa Ndiaye', phone: '221781234568', city: 'Dakar', region: 'Dakar' },
  { email: 'ibrahima@test.com', name: 'Ibrahima Fall', phone: '221761234569', city: 'Thies', region: 'Thies' },
  { email: 'fatou@test.com', name: 'Fatou Sarr', phone: '221771234570', city: 'Saint-Louis', region: 'Saint-Louis' },
  { email: 'ousmane@test.com', name: 'Ousmane Ba', phone: '221781234571', city: 'Rufisque', region: 'Dakar' },
  { email: 'aminata@test.com', name: 'Aminata Diallo', phone: '221761234572', city: 'Kaolack', region: 'Kaolack' },
];

const BUYERS = [
  { email: 'cheikh@test.com', name: 'Cheikh Sy', phone: '221769876543', city: 'Dakar', region: 'Dakar' },
  { email: 'mariama@test.com', name: 'Mariama Gueye', phone: '221779876544', city: 'Mbour', region: 'Thies' },
  { email: 'aliou@test.com', name: 'Aliou Seck', phone: '221789876545', city: 'Ziguinchor', region: 'Ziguinchor' },
];

interface ListingSeed {
  title: string;
  description: string;
  brand: string;
  model: string;
  sizeEu: number;
  sizeUs?: number;
  condition: ListingCondition;
  color: string;
  priceXof: number;
  city: string;
  region: string;
  status?: ListingStatus;
  daysAgo: number; // pour varier les dates de creation
}

const LISTINGS: ListingSeed[] = [
  // Nike
  { title: 'Nike Air Max 90 Triple Black', description: 'Air Max 90 tout noir, parfait etat. Portees 2 fois pour un mariage. Semelle encore comme neuve. Taille ideale pour les grands pieds.', brand: 'Nike', model: 'Air Max 90', sizeEu: 47, sizeUs: 13, condition: 'LIKE_NEW', color: 'Noir', priceXof: 35000, city: 'Dakar', region: 'Dakar', daysAgo: 0 },
  { title: 'Nike Air Force 1 Low White', description: 'Les classiques Air Force 1 blanches. Neuves dans la boite, jamais portees. Cadeau en double.', brand: 'Nike', model: 'Air Force 1', sizeEu: 44, sizeUs: 10, condition: 'NEW', color: 'Blanc', priceXof: 45000, city: 'Dakar', region: 'Dakar', daysAgo: 1 },
  { title: 'Nike Dunk Low Panda', description: 'Nike Dunk Low noir et blanc (Panda). Tres bon etat, portees regulierement mais bien entretenues.', brand: 'Nike', model: 'Dunk Low', sizeEu: 42, sizeUs: 8.5, condition: 'GOOD', color: 'Noir/Blanc', priceXof: 28000, city: 'Thies', region: 'Thies', daysAgo: 3 },
  { title: 'Nike Air Max 97 Silver Bullet', description: 'Les iconiques 97 Silver Bullet. Etat correct, quelques plis normaux sur le dessus.', brand: 'Nike', model: 'Air Max 97', sizeEu: 45, sizeUs: 11, condition: 'GOOD', color: 'Argent', priceXof: 22000, city: 'Dakar', region: 'Dakar', daysAgo: 5 },
  { title: 'Nike Vapormax Plus Noir', description: 'Vapormax Plus noires, semelle bulle d\'air. Utilisees mais en bon etat.', brand: 'Nike', model: 'Vapormax Plus', sizeEu: 43, sizeUs: 9.5, condition: 'GOOD', color: 'Noir', priceXof: 30000, city: 'Rufisque', region: 'Dakar', daysAgo: 2 },
  { title: 'Nike Air Max 270 React', description: 'Air Max 270 React, tres confortable. Portees quelques fois, comme neuves.', brand: 'Nike', model: 'Air Max 270', sizeEu: 46, sizeUs: 12, condition: 'LIKE_NEW', color: 'Bleu/Noir', priceXof: 40000, city: 'Dakar', region: 'Dakar', daysAgo: 0 },
  { title: 'Nike Blazer Mid 77 Vintage', description: 'Blazer Mid 77 style vintage. Neuves, jamais portees. Look retro garantit.', brand: 'Nike', model: 'Blazer Mid 77', sizeEu: 41, sizeUs: 8, condition: 'NEW', color: 'Blanc/Noir', priceXof: 38000, city: 'Kaolack', region: 'Kaolack', daysAgo: 1 },
  { title: 'Nike TN Air Max Plus', description: 'Les TN noires et grises. Classique du streetwear. Bon etat general.', brand: 'Nike', model: 'TN Air Max Plus', sizeEu: 44, sizeUs: 10, condition: 'GOOD', color: 'Noir/Gris', priceXof: 25000, city: 'Dakar', region: 'Dakar', daysAgo: 7 },

  // Jordan
  { title: 'Jordan 1 Retro High OG Chicago', description: 'Les mythiques Jordan 1 Chicago. Neuves, boite d\'origine incluse. Collector.', brand: 'Jordan', model: 'Air Jordan 1 High', sizeEu: 45, sizeUs: 11, condition: 'NEW', color: 'Rouge/Blanc/Noir', priceXof: 95000, city: 'Dakar', region: 'Dakar', daysAgo: 0 },
  { title: 'Jordan 4 Retro Bred', description: 'Jordan 4 Bred, portees 3 fois. Excellent etat, pas de plis visibles.', brand: 'Jordan', model: 'Air Jordan 4', sizeEu: 43, sizeUs: 9.5, condition: 'LIKE_NEW', color: 'Noir/Rouge', priceXof: 75000, city: 'Dakar', region: 'Dakar', daysAgo: 2 },
  { title: 'Jordan 11 Concord', description: 'Jordan 11 Concord basse. Comme neuves, portees une seule fois.', brand: 'Jordan', model: 'Air Jordan 11', sizeEu: 47, sizeUs: 13, condition: 'LIKE_NEW', color: 'Blanc/Noir', priceXof: 80000, city: 'Saint-Louis', region: 'Saint-Louis', daysAgo: 4 },
  { title: 'Jordan 3 White Cement', description: 'Jordan 3 White Cement, etat correct. Portees regulierement.', brand: 'Jordan', model: 'Air Jordan 3', sizeEu: 42, sizeUs: 8.5, condition: 'FAIR', color: 'Blanc/Gris', priceXof: 35000, city: 'Thies', region: 'Thies', daysAgo: 10 },
  { title: 'Jordan 1 Low SE Craft', description: 'Jordan 1 Low edition Craft, cuir premium. Neuves dans la boite.', brand: 'Jordan', model: 'Air Jordan 1 Low', sizeEu: 40, sizeUs: 7, condition: 'NEW', color: 'Beige/Blanc', priceXof: 55000, city: 'Dakar', region: 'Dakar', daysAgo: 1 },

  // Adidas
  { title: 'Adidas Yeezy Boost 350 V2 Zebra', description: 'Yeezy 350 V2 Zebra authentiques. Neuves, jamais portees. Preuve d\'achat disponible.', brand: 'Adidas', model: 'Yeezy Boost 350 V2', sizeEu: 48, sizeUs: 14, condition: 'NEW', color: 'Blanc/Noir', priceXof: 120000, city: 'Dakar', region: 'Dakar', daysAgo: 0 },
  { title: 'Adidas Stan Smith Blanc Vert', description: 'Les indemoables Stan Smith. Etat impeccable, portees quelques fois.', brand: 'Adidas', model: 'Stan Smith', sizeEu: 43, sizeUs: 9.5, condition: 'LIKE_NEW', color: 'Blanc/Vert', priceXof: 25000, city: 'Dakar', region: 'Dakar', daysAgo: 3 },
  { title: 'Adidas Ultraboost 22 Core Black', description: 'Ultraboost 22 noires, parfaites pour le sport ou le quotidien. Bon etat.', brand: 'Adidas', model: 'Ultraboost 22', sizeEu: 44, sizeUs: 10, condition: 'GOOD', color: 'Noir', priceXof: 32000, city: 'Kaolack', region: 'Kaolack', daysAgo: 6 },
  { title: 'Adidas Superstar Classic', description: 'Les Superstar classiques shell toe. Etat moyen, usure visible mais portables.', brand: 'Adidas', model: 'Superstar', sizeEu: 41, sizeUs: 8, condition: 'FAIR', color: 'Blanc/Noir', priceXof: 12000, city: 'Thies', region: 'Thies', daysAgo: 14 },
  { title: 'Adidas NMD R1 Noir', description: 'NMD R1 noires, tres confortables. Portees mais bien entretenues.', brand: 'Adidas', model: 'NMD R1', sizeEu: 46, sizeUs: 12, condition: 'GOOD', color: 'Noir', priceXof: 28000, city: 'Rufisque', region: 'Dakar', daysAgo: 4 },
  { title: 'Adidas Gazelle Indoor', description: 'Gazelle Indoor vintage look. Neuves, jamais portees. Coloris exclusif.', brand: 'Adidas', model: 'Gazelle', sizeEu: 39, sizeUs: 6.5, condition: 'NEW', color: 'Bordeaux', priceXof: 42000, city: 'Dakar', region: 'Dakar', daysAgo: 0 },

  // New Balance
  { title: 'New Balance 550 White Green', description: 'NB 550 blanches et vertes. Tres tendance, portees 2 fois. Comme neuves.', brand: 'New Balance', model: '550', sizeEu: 44, sizeUs: 10, condition: 'LIKE_NEW', color: 'Blanc/Vert', priceXof: 48000, city: 'Dakar', region: 'Dakar', daysAgo: 1 },
  { title: 'New Balance 574 Classic Grey', description: 'Les 574 grises classiques. Confort legendaire. Bon etat.', brand: 'New Balance', model: '574', sizeEu: 45, sizeUs: 11, condition: 'GOOD', color: 'Gris', priceXof: 20000, city: 'Saint-Louis', region: 'Saint-Louis', daysAgo: 8 },
  { title: 'New Balance 2002R Protection Pack', description: 'NB 2002R Rain Cloud. Neuves dans la boite. Look premium.', brand: 'New Balance', model: '2002R', sizeEu: 43, sizeUs: 9.5, condition: 'NEW', color: 'Gris clair', priceXof: 65000, city: 'Dakar', region: 'Dakar', daysAgo: 2 },
  { title: 'New Balance 327 Moonbeam', description: '327 Moonbeam colorway. Portees quelques fois, excellent etat.', brand: 'New Balance', model: '327', sizeEu: 40, sizeUs: 7, condition: 'LIKE_NEW', color: 'Beige/Blanc', priceXof: 35000, city: 'Thies', region: 'Thies', daysAgo: 5 },

  // Puma
  { title: 'Puma RS-X Reinvention', description: 'RS-X colorees, look retro-futuriste. Bon etat general.', brand: 'Puma', model: 'RS-X', sizeEu: 46, sizeUs: 12, condition: 'GOOD', color: 'Bleu/Rouge', priceXof: 20000, city: 'Dakar', region: 'Dakar', daysAgo: 9 },
  { title: 'Puma Suede Classic XXI', description: 'Les Suede classiques. Etat moyen, usure normale au bout.', brand: 'Puma', model: 'Suede Classic', sizeEu: 42, sizeUs: 8.5, condition: 'FAIR', color: 'Noir', priceXof: 10000, city: 'Kaolack', region: 'Kaolack', daysAgo: 15 },
  { title: 'Puma MB.01 LaMelo Ball', description: 'MB.01 de LaMelo Ball, edition limitee. Neuves, parfaites pour le basket.', brand: 'Puma', model: 'MB.01', sizeEu: 48, sizeUs: 14, condition: 'NEW', color: 'Rouge/Bleu', priceXof: 55000, city: 'Dakar', region: 'Dakar', daysAgo: 0 },

  // Autres marques
  { title: 'Reebok Classic Leather Blanc', description: 'Reebok Classic Leather blanches. Indemoables, etat correct.', brand: 'Reebok', model: 'Classic Leather', sizeEu: 43, sizeUs: 9.5, condition: 'GOOD', color: 'Blanc', priceXof: 15000, city: 'Rufisque', region: 'Dakar', daysAgo: 11 },
  { title: 'Converse Chuck Taylor All Star', description: 'Les Converse hautes noires. Classique indemoable. Neuves.', brand: 'Converse', model: 'Chuck Taylor', sizeEu: 41, sizeUs: 8, condition: 'NEW', color: 'Noir', priceXof: 22000, city: 'Dakar', region: 'Dakar', daysAgo: 3 },
  { title: 'Vans Old Skool', description: 'Old Skool noires et blanches. Look skate. Bon etat.', brand: 'Vans', model: 'Old Skool', sizeEu: 42, sizeUs: 8.5, condition: 'GOOD', color: 'Noir/Blanc', priceXof: 18000, city: 'Thies', region: 'Thies', daysAgo: 6 },
  { title: 'Timberland 6 Inch Premium Boot', description: 'Les Timbs jaunes iconiques. Taille 47, parfait etat. Cuir nubuck premium.', brand: 'Timberland', model: '6 Inch Premium', sizeEu: 47, sizeUs: 13, condition: 'LIKE_NEW', color: 'Jaune miel', priceXof: 50000, city: 'Dakar', region: 'Dakar', daysAgo: 2 },
  { title: 'Fila Disruptor II Blanc', description: 'Disruptor II blanches, plateforme. Neuves, jamais portees.', brand: 'Fila', model: 'Disruptor II', sizeEu: 38, sizeUs: 6, condition: 'NEW', color: 'Blanc', priceXof: 25000, city: 'Saint-Louis', region: 'Saint-Louis', daysAgo: 1 },
  { title: 'Asics Gel-Lyte III OG', description: 'Gel-Lyte III split tongue, colorway OG. Comme neuves.', brand: 'Asics', model: 'Gel-Lyte III', sizeEu: 44, sizeUs: 10, condition: 'LIKE_NEW', color: 'Blanc/Bleu', priceXof: 38000, city: 'Dakar', region: 'Dakar', daysAgo: 4 },

  // Quelques vendu/reserve pour varier
  { title: 'Nike Air Jordan 1 Mid Smoke Grey', description: 'Jordan 1 Mid Smoke Grey. VENDU.', brand: 'Jordan', model: 'Air Jordan 1 Mid', sizeEu: 43, sizeUs: 9.5, condition: 'LIKE_NEW', color: 'Gris', priceXof: 45000, city: 'Dakar', region: 'Dakar', status: 'SOLD' as ListingStatus, daysAgo: 12 },
  { title: 'Adidas Samba OG Noir', description: 'Samba OG noires. Reservees pour un acheteur.', brand: 'Adidas', model: 'Samba OG', sizeEu: 42, sizeUs: 8.5, condition: 'NEW', color: 'Noir', priceXof: 40000, city: 'Thies', region: 'Thies', status: 'RESERVED' as ListingStatus, daysAgo: 3 },
];

async function main() {
  console.log('Seeding Samadal database...\n');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@samadal.net' },
    update: { passwordHash },
    create: {
      email: 'admin@samadal.net',
      name: 'Admin Samadal',
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      city: 'Dakar',
      region: 'Dakar',
    },
  });
  console.log(`Admin : ${admin.email} / ${DEFAULT_PASSWORD}`);

  // Vendeurs
  const sellerUsers = [];
  for (const s of SELLERS) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { passwordHash },
      create: {
        email: s.email,
        phone: s.phone,
        name: s.name,
        passwordHash,
        role: UserRole.SELLER,
        emailVerified: true,
        phoneVerified: true,
        city: s.city,
        region: s.region,
        sellerStats: {
          create: {
            totalSales: 0,
            totalListings: 0,
            commissionFreeRemaining: 1,
          },
        },
      },
    });
    sellerUsers.push(user);
    console.log(`Vendeur : ${user.email} / ${DEFAULT_PASSWORD} (${user.name})`);
  }

  // Acheteurs
  for (const b of BUYERS) {
    const user = await prisma.user.upsert({
      where: { email: b.email },
      update: { passwordHash },
      create: {
        email: b.email,
        phone: b.phone,
        name: b.name,
        passwordHash,
        role: UserRole.USER,
        emailVerified: true,
        phoneVerified: true,
        city: b.city,
        region: b.region,
      },
    });
    console.log(`Acheteur : ${user.email} / ${DEFAULT_PASSWORD} (${user.name})`);
  }

  // Annonces
  console.log('\nCreation des annonces...');
  let count = 0;
  for (let i = 0; i < LISTINGS.length; i++) {
    const l = LISTINGS[i];
    const seller = sellerUsers[i % sellerUsers.length];
    const slug = generateSlug(l.title, i);
    const createdAt = new Date(Date.now() - l.daysAgo * 86400000);
    const expiresAt = new Date(createdAt.getTime() + 30 * 86400000); // expire dans 30j

    try {
      await prisma.listing.upsert({
        where: { slug },
        update: {},
        create: {
          sellerId: seller.id,
          slug,
          title: l.title,
          description: l.description,
          brand: l.brand,
          model: l.model,
          sizeEu: l.sizeEu,
          sizeUs: l.sizeUs,
          condition: l.condition,
          color: l.color,
          priceXof: l.priceXof,
          status: l.status || 'ACTIVE',
          locationCity: l.city,
          locationRegion: l.region,
          viewsCount: Math.floor(Math.random() * 200),
          createdAt,
          expiresAt,
        },
      });
      count++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  Skip (deja existant?) : ${slug} — ${msg.slice(0, 60)}`);
    }
  }

  // Mise a jour sellerStats
  for (const seller of sellerUsers) {
    const total = await prisma.listing.count({ where: { sellerId: seller.id } });
    await prisma.sellerStats.updateMany({
      where: { userId: seller.id },
      data: { totalListings: total },
    });
  }

  console.log(`\n${count} annonces creees`);
  console.log(`\n=== COMPTES DE TEST ===`);
  console.log(`Admin    : admin@samadal.net / ${DEFAULT_PASSWORD}`);
  console.log(`Vendeurs : moussa@test.com, awa@test.com, ibrahima@test.com, fatou@test.com, ousmane@test.com, aminata@test.com`);
  console.log(`Acheteurs: cheikh@test.com, mariama@test.com, aliou@test.com`);
  console.log(`Mot de passe : ${DEFAULT_PASSWORD} (pour tous)`);
  console.log(`\nSeed termine !`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

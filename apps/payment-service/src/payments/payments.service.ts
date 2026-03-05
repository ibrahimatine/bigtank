import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const COMMISSION_RATE = 0.02;
const MIN_COMMISSION = 100; // 100 FCFA minimum
const MIN_LISTING_PRICE = 500; // 500 FCFA minimum
const LISTING_DURATION_DAYS = 60;

function calculateCommission(priceXof: number): number {
  return Math.max(MIN_COMMISSION, Math.round(priceXof * COMMISSION_RATE));
}

@Injectable()
export class PaymentsService {
  private readonly apiKey = process.env.PAYTECH_API_KEY || '';
  private readonly apiSecret = process.env.PAYTECH_API_SECRET || '';
  private readonly paytechEnv = process.env.PAYTECH_ENV || 'test';
  private readonly webUrl = process.env.WEB_URL || 'http://localhost:3000';
  private readonly listingServiceUrl = process.env.LISTING_SERVICE_URL || 'http://localhost:4002';

  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async initiate(sellerId: string, listingId: string) {
    // Vérifier que l'annonce existe et appartient au vendeur
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: {
          include: { sellerStats: true },
        },
      },
    });

    if (!listing) throw new NotFoundException('Annonce introuvable');
    if (listing.sellerId !== sellerId) throw new ForbiddenException('Accès refusé');
    if (listing.status !== 'DRAFT') {
      throw new BadRequestException('Cette annonce n\'est pas en attente de publication');
    }
    if (listing.priceXof < MIN_LISTING_PRICE) {
      throw new BadRequestException(
        `Le prix minimum est de ${MIN_LISTING_PRICE} FCFA`,
      );
    }

    // Annuler tout paiement PENDING existant pour cette annonce
    await this.prisma.listingPayment.updateMany({
      where: { listingId, status: 'PENDING' },
      data: { status: 'FAILED' },
    });

    const commission = calculateCommission(listing.priceXof);
    const refCommand = `BT_${listingId}_${Date.now()}`;

    // Vérifier si la 1ère annonce est gratuite
    const freeRemaining = listing.seller.sellerStats?.commissionFreeRemaining ?? 0;

    if (freeRemaining > 0) {
      // Publication gratuite
      const expiresAt = new Date(Date.now() + LISTING_DURATION_DAYS * 86400000);

      await this.prisma.$transaction([
        this.prisma.listingPayment.create({
          data: {
            listingId,
            sellerId,
            amount: 0,
            listingPrice: listing.priceXof,
            status: 'FREE',
            refCommand,
          },
        }),
        this.prisma.listing.update({
          where: { id: listingId },
          data: {
            status: 'ACTIVE',
            expiresAt,
          },
        }),
        this.prisma.sellerStats.update({
          where: { userId: sellerId },
          data: { commissionFreeRemaining: { decrement: 1 } },
        }),
      ]);

      // Notify listing-service to update Meilisearch index
      await this.notifyListingActivate(listingId, expiresAt);
      await this.notifyAdminsNewListing(listing.title, listing.seller.name, listingId);
      return { isFree: true, redirectUrl: null, amount: 0 };
    }

    // Paiement requis — créer la session PayTech
    const payment = await this.prisma.listingPayment.create({
      data: {
        listingId,
        sellerId,
        amount: commission,
        listingPrice: listing.priceXof,
        status: 'PENDING',
        refCommand,
      },
    });

    const paytechPayload = {
      item_name: `Publication annonce: ${listing.title}`,
      item_price: commission,
      currency: 'XOF',
      ref_command: refCommand,
      command_name: `BigTank — commission publication`,
      env: this.paytechEnv,
      ipn_url: `${this.webUrl}/api/payments/webhook`,
      success_url: `${this.webUrl}/dashboard/payment/success?ref=${refCommand}`,
      cancel_url: `${this.webUrl}/dashboard/payment/cancel?listingId=${listingId}`,
      custom_field: JSON.stringify({ listingId, paymentId: payment.id }),
    };

    const response = await fetch('https://paytech.sn/api/payment/request-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        API_KEY: this.apiKey,
        API_SECRET: this.apiSecret,
      },
      body: JSON.stringify(paytechPayload),
    });

    const data = (await response.json()) as {
      success: number;
      token?: string;
      redirect_url?: string;
    };

    if (!data.success || !data.redirect_url) {
      await this.prisma.listingPayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException('Erreur lors de la création du paiement PayTech');
    }

    // Sauvegarder le token PayTech
    await this.prisma.listingPayment.update({
      where: { id: payment.id },
      data: { paymentToken: data.token },
    });

    return {
      isFree: false,
      redirectUrl: data.redirect_url,
      amount: commission,
      listingPrice: listing.priceXof,
    };
  }

  async handleWebhook(body: Record<string, string>) {
    // Vérifier l'authenticité PayTech via SHA256
    const expectedKeyHash = crypto
      .createHash('sha256')
      .update(this.apiKey)
      .digest('hex');
    const expectedSecretHash = crypto
      .createHash('sha256')
      .update(this.apiSecret)
      .digest('hex');

    if (
      body.api_key_sha256 !== expectedKeyHash ||
      body.api_secret_sha256 !== expectedSecretHash
    ) {
      throw new ForbiddenException('Signature IPN invalide');
    }

    if (body.type_event !== 'sale_complete') {
      return { ignored: true, event: body.type_event };
    }

    const refCommand = body.ref_command;
    const payment = await this.prisma.listingPayment.findUnique({
      where: { refCommand },
    });

    if (!payment || payment.status !== 'PENDING') {
      return { ignored: true, reason: 'payment not found or already processed' };
    }

    const expiresAt = new Date(Date.now() + LISTING_DURATION_DAYS * 86400000);

    await this.prisma.$transaction([
      this.prisma.listingPayment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paymentMethod: body.payment_method || null,
          paidAt: new Date(),
          ipnPayload: JSON.parse(JSON.stringify(body)),
        },
      }),
      this.prisma.listing.update({
        where: { id: payment.listingId },
        data: { status: 'ACTIVE', expiresAt },
      }),
    ]);

    await this.notifyListingActivate(payment.listingId, expiresAt);

    // Notifier les admins de la nouvelle publication
    const listing = await this.prisma.listing.findUnique({
      where: { id: payment.listingId },
      include: { seller: { select: { name: true } } },
    });
    if (listing) {
      await this.notifyAdminsNewListing(listing.title, listing.seller.name, payment.listingId);
    }

    return { processed: true, listingId: payment.listingId };
  }

  private async notifyListingActivate(listingId: string, expiresAt: Date): Promise<void> {
    const url = `${this.listingServiceUrl}/listings/${listingId}/activate`;
    const body = JSON.stringify({ expiresAt: expiresAt.toISOString() });
    const headers = { 'Content-Type': 'application/json' };

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { method: 'PATCH', headers, body });
        if (res.ok) return;
      } catch {
        // retry
      }
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
    console.error(`[payment-service] Failed to notify listing-service for listing ${listingId}`);
  }

  private async notifyAdminsNewListing(
    listingTitle: string,
    sellerName: string,
    listingId: string,
  ): Promise<void> {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (admins.length === 0) return;

      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'NEW_LISTING_PUBLISHED' as const,
          title: 'Nouvelle annonce publiée',
          body: `${sellerName} vient de publier "${listingTitle}"`,
          channel: 'IN_APP' as const,
          data: { listingId },
        })),
      });
    } catch (err) {
      console.error('[payment-service] Failed to notify admins:', err);
    }
  }

  async getPaymentByListing(sellerId: string, listingId: string) {
    const payment = await this.prisma.listingPayment.findFirst({
      where: { listingId, sellerId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) throw new NotFoundException('Aucun paiement trouvé');
    return payment;
  }

  async getCommissionPreview(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { priceXof: true, title: true, sellerId: true },
    });
    if (!listing) throw new NotFoundException('Annonce introuvable');

    return {
      listingPrice: listing.priceXof,
      commission: calculateCommission(listing.priceXof),
      rate: `${COMMISSION_RATE * 100}%`,
      minimumFee: MIN_COMMISSION,
    };
  }
}

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

/** Mapping méthode utilisateur → codeService Intech */
const INTECH_CASH_IN_CODES: Record<string, string> = {
  ORANGE_MONEY: 'ORANGE_SN_API_CASH_IN',
  WAVE: 'WAVE_SN_API_CASH_IN',
  FREE_MONEY: 'FREE_SN_WALLET_CASH_IN',
};

const INTECH_CASH_OUT_CODES: Record<string, string> = {
  ORANGE_MONEY: 'ORANGE_SN_API_CASH_OUT',
  WAVE: 'WAVE_SN_API_CASH_OUT',
  FREE_MONEY: 'FREE_SN_WALLET_CASH_OUT',
};

function calculateCommission(priceXof: number): number {
  return Math.max(MIN_COMMISSION, Math.round(priceXof * COMMISSION_RATE));
}

@Injectable()
export class PaymentsService {
  private readonly apiKey = process.env.INTECH_API_KEY || '';
  private readonly baseUrl = process.env.INTECH_BASE_URL || 'https://api.intech.sn';
  private readonly webUrl = process.env.WEB_URL || 'http://localhost:3000';
  private readonly listingServiceUrl = process.env.LISTING_SERVICE_URL || 'http://localhost:4002';

  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Initier un paiement de commission via Intech (USSD push).
   * Le vendeur reçoit une demande de paiement directement sur son téléphone.
   */
  async initiate(
    sellerId: string,
    listingId: string,
    phone: string,
    paymentMethod: string,
  ) {
    // Vérifier la méthode de paiement
    const codeService = INTECH_CASH_IN_CODES[paymentMethod];
    if (!codeService) {
      throw new BadRequestException(
        `Méthode de paiement invalide. Choisir parmi : ${Object.keys(INTECH_CASH_IN_CODES).join(', ')}`,
      );
    }

    // Normaliser le numéro de téléphone (enlever le +221 ou le 00221)
    const cleanPhone = phone.replace(/[\s\-]/g, '').replace(/^(\+221|00221)/, '');
    if (!/^[0-9]{9}$/.test(cleanPhone)) {
      throw new BadRequestException('Numéro de téléphone invalide. Format attendu : 7XXXXXXXX');
    }

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

      // Notifier le listing-service pour mettre à jour Meilisearch
      await this.notifyListingActivate(listingId, expiresAt);
      await this.notifyAdminsNewListing(listing.title, listing.seller.name, listingId);

      // Envoyer un WhatsApp au vendeur si possible
      if (listing.seller.phone) {
        await this.sendWhatsAppNotification(
          listing.seller.phone,
          `Votre annonce "${listing.title}" a été publiée gratuitement sur BigTank ! 🎉`,
        );
      }

      return { isFree: true, amount: 0 };
    }

    // Paiement requis — créer le paiement et appeler Intech
    const payment = await this.prisma.listingPayment.create({
      data: {
        listingId,
        sellerId,
        amount: commission,
        listingPrice: listing.priceXof,
        status: 'PENDING',
        refCommand,
        paymentMethod,
      },
    });

    // Appel API Intech pour déclencher le push USSD
    const intechPayload = {
      phone: cleanPhone,
      amount: commission,
      codeService,
      externalTransactionId: refCommand,
      callbackUrl: `${this.webUrl}/api/payments/webhook`,
      apiKey: this.apiKey,
      data: JSON.stringify({ listingId, paymentId: payment.id }),
    };

    try {
      const response = await fetch(`${this.baseUrl}/api-services/operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intechPayload),
        signal: AbortSignal.timeout(15000),
      });

      const data = await response.json() as {
        status: string;
        msg?: string;
        transaction?: { transactionId: string };
      };

      if (!response.ok || data.status === 'ERROR') {
        await this.prisma.listingPayment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
        throw new BadRequestException(
          data.msg || 'Erreur lors de l\'initiation du paiement Intech',
        );
      }

      // Sauvegarder l'ID de transaction Intech
      if (data.transaction?.transactionId) {
        await this.prisma.listingPayment.update({
          where: { id: payment.id },
          data: { intechTransactionId: data.transaction.transactionId },
        });
      }

      return {
        isFree: false,
        amount: commission,
        listingPrice: listing.priceXof,
        paymentId: payment.id,
        refCommand,
        message: 'Un push USSD a été envoyé sur votre téléphone. Validez le paiement avec votre code PIN.',
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;

      await this.prisma.listingPayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException('Impossible de contacter le service de paiement Intech');
    }
  }

  /**
   * Traiter le callback webhook d'Intech.
   * Intech envoie du JSON avec un hash SHA256 pour vérification.
   */
  async handleWebhook(body: {
    msg?: string;
    status: string;
    sha256Hash: string;
    transaction: {
      transactionId: string;
      externalTransactionId: string;
      amount: number;
      codeService: string;
      status: string;
      data?: { listingId?: string; paymentId?: string } | string;
    };
  }) {
    const { transaction } = body;

    // Vérifier la signature SHA256
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${transaction.transactionId}|${transaction.externalTransactionId}|${this.apiKey}`)
      .digest('hex');

    if (expectedHash !== body.sha256Hash) {
      throw new ForbiddenException('Signature invalide');
    }

    // Ignorer les transactions non-réussies
    if (transaction.status !== 'SUCCESS') {
      return { ignored: true, status: transaction.status };
    }

    // Trouver le paiement par refCommand (= externalTransactionId)
    const refCommand = transaction.externalTransactionId;
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
          intechTransactionId: transaction.transactionId,
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
      include: { seller: { select: { name: true, phone: true } } },
    });
    if (listing) {
      await this.notifyAdminsNewListing(listing.title, listing.seller.name, payment.listingId);

      // Envoyer un WhatsApp au vendeur
      if (listing.seller.phone) {
        await this.sendWhatsAppNotification(
          listing.seller.phone,
          `Votre annonce "${listing.title}" a été publiée sur BigTank ! 🎉`,
        );
      }
    }

    return { processed: true, listingId: payment.listingId };
  }

  /**
   * Rembourser un paiement via Intech cash-out.
   */
  async refundPayment(paymentId: string, _adminId: string) {
    const payment = await this.prisma.listingPayment.findUnique({
      where: { id: paymentId },
      include: { seller: { select: { phone: true } } },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Seuls les paiements complétés peuvent être remboursés');
    }
    if (!payment.seller.phone) {
      throw new BadRequestException('Le vendeur n\'a pas de numéro de téléphone enregistré');
    }

    // Déterminer le codeService cash-out depuis la méthode de paiement
    const cashOutCode = payment.paymentMethod
      ? INTECH_CASH_OUT_CODES[payment.paymentMethod]
      : null;

    if (!cashOutCode) {
      throw new BadRequestException('Impossible de déterminer la méthode de remboursement');
    }

    const cleanPhone = payment.seller.phone.replace(/[\s\-]/g, '').replace(/^(\+221|00221)/, '');
    const refCommand = `REFUND_${payment.id}_${Date.now()}`;

    const intechPayload = {
      phone: cleanPhone,
      amount: payment.amount,
      codeService: cashOutCode,
      externalTransactionId: refCommand,
      callbackUrl: `${this.webUrl}/api/payments/webhook`,
      apiKey: this.apiKey,
      data: JSON.stringify({ paymentId: payment.id, type: 'refund' }),
    };

    const response = await fetch(`${this.baseUrl}/api-services/operation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intechPayload),
    });

    const data = await response.json() as { status: string; msg?: string };

    if (!response.ok || data.status === 'ERROR') {
      throw new BadRequestException(data.msg || 'Erreur lors du remboursement Intech');
    }

    await this.prisma.listingPayment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
    });

    return { refunded: true, amount: payment.amount };
  }

  /**
   * Envoyer une notification WhatsApp via Intech.
   */
  async sendWhatsAppNotification(phone: string, message: string): Promise<void> {
    try {
      // Formater le numéro avec +221
      const cleanPhone = phone.replace(/[\s\-]/g, '').replace(/^(\+221|00221)/, '');
      const fullPhone = `+221${cleanPhone}`;

      const payload = {
        phone: fullPhone,
        amount: 0,
        codeService: 'WHATSAPP_MESSAGING',
        externalTransactionId: `NOTIF_${Date.now()}`,
        callbackUrl: `${this.webUrl}/api/payments/webhook`,
        apiKey: this.apiKey,
        data: JSON.stringify({ message }),
      };

      await fetch(`${this.baseUrl}/api-services/operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
    } catch (err) {
      // Ne pas bloquer le flux principal si le WhatsApp échoue
      console.error('[payment-service] WhatsApp notification failed:', err);
    }
  }

  /**
   * Vérifier le statut d'une transaction côté Intech.
   */
  async checkTransactionStatus(refCommand: string) {
    const payment = await this.prisma.listingPayment.findUnique({
      where: { refCommand },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');

    return {
      paymentId: payment.id,
      listingId: payment.listingId,
      status: payment.status,
      amount: payment.amount,
      paidAt: payment.paidAt,
    };
  }

  /**
   * Vérifier le solde du compte Intech (admin only).
   */
  async getBalance() {
    try {
      const response = await fetch(`${this.baseUrl}/api-services/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new BadRequestException('Impossible de récupérer le solde Intech');
      }

      return await response.json();
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Erreur de connexion au service Intech');
    }
  }

  private async notifyListingActivate(listingId: string, expiresAt: Date): Promise<void> {
    const url = `${this.listingServiceUrl}/listings/${listingId}/activate`;
    const body = JSON.stringify({ expiresAt: expiresAt.toISOString() });
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
    };

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { method: 'PATCH', headers, body, signal: AbortSignal.timeout(10000) });
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

      console.log(`[payment-service] Found ${admins.length} admin(s) to notify for listing ${listingId}`);

      if (admins.length === 0) return;

      await Promise.all(
        admins.map((admin) =>
          this.prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'NEW_LISTING_PUBLISHED',
              title: 'Nouvelle annonce publiée',
              body: `${sellerName} vient de publier "${listingTitle}"`,
              channel: 'IN_APP',
              data: { listingId },
            },
          }),
        ),
      );

      console.log(`[payment-service] Successfully notified ${admins.length} admin(s) for listing "${listingTitle}"`);
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

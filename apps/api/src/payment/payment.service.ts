import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { ListingService } from '../listing/listing.service';

const COMMISSION_RATE = 0.02;
const MIN_COMMISSION = 100;
const MIN_LISTING_PRICE = 500;
const LISTING_DURATION_DAYS = 60;

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
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly apiKey = process.env.INTECH_API_KEY || '';
  private readonly baseUrl = process.env.INTECH_BASE_URL || 'https://api.intech.sn';
  private readonly webUrl = process.env.WEB_URL || 'http://localhost:3000';

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private listingService: ListingService,
  ) {}

  private async logTransaction(
    action: string,
    sellerId: string,
    listingId: string,
    metadata: Record<string, unknown>,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: sellerId,
          action,
          targetId: listingId,
          targetType: 'LISTING_PAYMENT',
          metadata: JSON.parse(JSON.stringify(metadata)),
        },
      });
    } catch (err) {
      this.logger.error(`Erreur log transaction: ${err}`);
    }
  }

  async initiate(
    sellerId: string,
    listingId: string,
    phone: string,
    paymentMethod: string,
  ) {
    const codeService = INTECH_CASH_IN_CODES[paymentMethod];
    if (!codeService) {
      throw new BadRequestException(
        `Méthode de paiement invalide. Choisir parmi : ${Object.keys(INTECH_CASH_IN_CODES).join(', ')}`,
      );
    }

    const cleanPhone = phone.replace(/[\s\-]/g, '').replace(/^(\+221|00221)/, '');
    if (!/^[0-9]{9}$/.test(cleanPhone)) {
      throw new BadRequestException('Numéro de téléphone invalide. Format attendu : 7XXXXXXXX');
    }

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

    await this.prisma.listingPayment.updateMany({
      where: { listingId, status: 'PENDING' },
      data: { status: 'FAILED' },
    });

    const commission = calculateCommission(listing.priceXof);
    const refCommand = `BT_${listingId}_${Date.now()}`;

    const freeRemaining = listing.seller.sellerStats?.commissionFreeRemaining ?? 0;

    if (freeRemaining > 0) {
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
        this.prisma.sellerStats.update({
          where: { userId: sellerId },
          data: { commissionFreeRemaining: { decrement: 1 } },
        }),
      ]);

      await this.listingService.activateAfterPayment(listingId, expiresAt);
      await this.notifyAdminsNewListing(listing.title, listing.seller.name, listingId);

      this.logger.log(`PUBLICATION GRATUITE | listing=${listingId} | vendeur=${sellerId} | prix=${listing.priceXof} FCFA`);
      await this.logTransaction('PAYMENT_FREE', sellerId, listingId, {
        amount: 0,
        listingPrice: listing.priceXof,
        refCommand,
        listingTitle: listing.title,
      });

      if (listing.seller.phone) {
        await this.sendWhatsAppNotification(
          listing.seller.phone,
          `Votre annonce "${listing.title}" a été publiée gratuitement sur Samadal !`,
        );
      }

      return { isFree: true, amount: 0 };
    }

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

    const intechPayload = {
      phone: cleanPhone,
      amount: commission,
      codeService,
      externalTransactionId: refCommand,
      callbackUrl: `${this.webUrl}/api/payments/webhook`,
      apiKey: this.apiKey,
      data: { listingId, paymentId: payment.id },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api-services/operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intechPayload),
        signal: AbortSignal.timeout(60000),
      });

      const result = await response.json() as {
        code: number;
        error: boolean;
        msg?: string;
        data?: { transactionId?: string; status?: string };
      };

      if (!response.ok || result.error || result.code !== 2000) {
        await this.prisma.listingPayment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
        this.logger.warn(`PAIEMENT ECHOUE (Intech) | ref=${refCommand} | code=${result.code} | erreur=${result.msg}`);
        await this.logTransaction('PAYMENT_FAILED', sellerId, listingId, {
          amount: commission,
          refCommand,
          paymentMethod,
          error: result.msg || 'Erreur Intech',
          intechCode: result.code,
        });
        throw new BadRequestException(
          result.msg || 'Erreur lors de l\'initiation du paiement Intech',
        );
      }

      if (result.data?.transactionId) {
        await this.prisma.listingPayment.update({
          where: { id: payment.id },
          data: { intechTransactionId: result.data.transactionId },
        });
      }

      this.logger.log(`PAIEMENT INITIE | ref=${refCommand} | montant=${commission} FCFA | methode=${paymentMethod} | listing=${listingId}`);
      await this.logTransaction('PAYMENT_INITIATED', sellerId, listingId, {
        amount: commission,
        listingPrice: listing.priceXof,
        paymentMethod,
        refCommand,
        paymentId: payment.id,
        listingTitle: listing.title,
      });

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

    const expectedHash = crypto
      .createHash('sha256')
      .update(`${transaction.transactionId}|${transaction.externalTransactionId}|${this.apiKey}`)
      .digest('hex');

    if (expectedHash !== body.sha256Hash) {
      this.logger.warn(`WEBHOOK SIGNATURE INVALIDE | ref=${transaction.externalTransactionId} | intechId=${transaction.transactionId}`);
      throw new ForbiddenException('Signature invalide');
    }

    if (transaction.status !== 'SUCCESS') {
      return { ignored: true, status: transaction.status };
    }

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
    ]);

    await this.listingService.activateAfterPayment(payment.listingId, expiresAt);

    this.logger.log(`PAIEMENT REUSSI | ref=${refCommand} | montant=${payment.amount} FCFA | intech=${transaction.transactionId} | listing=${payment.listingId}`);
    await this.logTransaction('PAYMENT_COMPLETED', payment.sellerId, payment.listingId, {
      amount: payment.amount,
      listingPrice: payment.listingPrice,
      paymentMethod: payment.paymentMethod,
      refCommand,
      intechTransactionId: transaction.transactionId,
    });

    const listing = await this.prisma.listing.findUnique({
      where: { id: payment.listingId },
      include: { seller: { select: { name: true, phone: true } } },
    });
    if (listing) {
      await this.notifyAdminsNewListing(listing.title, listing.seller.name, payment.listingId);

      if (listing.seller.phone) {
        await this.sendWhatsAppNotification(
          listing.seller.phone,
          `Votre annonce "${listing.title}" a été publiée sur Samadal !`,
        );
      }
    }

    return { processed: true, listingId: payment.listingId };
  }

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
      data: { paymentId: payment.id, type: 'refund' },
    };

    const response = await fetch(`${this.baseUrl}/api-services/operation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intechPayload),
      signal: AbortSignal.timeout(60000),
    });

    const result = await response.json() as { code: number; error: boolean; msg?: string };

    if (!response.ok || result.error || result.code !== 2000) {
      throw new BadRequestException(result.msg || 'Erreur lors du remboursement Intech');
    }

    await this.prisma.listingPayment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
    });

    this.logger.log(`REMBOURSEMENT | paymentId=${paymentId} | montant=${payment.amount} FCFA | vendeur=${payment.sellerId}`);
    await this.logTransaction('PAYMENT_REFUNDED', payment.sellerId, payment.listingId, {
      amount: payment.amount,
      paymentId,
      paymentMethod: payment.paymentMethod,
      refCommand,
    });

    return { refunded: true, amount: payment.amount };
  }

  async sendWhatsAppNotification(phone: string, message: string): Promise<void> {
    try {
      const cleanPhone = phone.replace(/[\s\-]/g, '').replace(/^(\+221|00221)/, '');
      const fullPhone = `+221${cleanPhone}`;

      const payload = {
        phone: fullPhone,
        amount: 0,
        codeService: 'WHATSAPP_MESSAGING',
        externalTransactionId: `NOTIF_${Date.now()}`,
        callbackUrl: `${this.webUrl}/api/payments/webhook`,
        apiKey: this.apiKey,
        data: { message },
      };

      await fetch(`${this.baseUrl}/api-services/operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000),
      });
    } catch (err) {
      console.error('[payment] WhatsApp notification failed:', err);
    }
  }

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

  async getBalance() {
    try {
      const response = await fetch(`${this.baseUrl}/api-services/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Secretkey': this.apiKey,
        },
        signal: AbortSignal.timeout(60000),
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
    } catch (err) {
      console.error('[payment] Failed to notify admins:', err);
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

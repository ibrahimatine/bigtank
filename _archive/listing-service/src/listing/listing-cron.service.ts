import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { SearchService } from '../search/search.service';

@Injectable()
export class ListingCronService {
  private readonly logger = new Logger(ListingCronService.name);
  private readonly notificationServiceUrl =
    process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005';

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private searchService: SearchService,
  ) {}

  /**
   * Toutes les heures : expire les annonces dont expiresAt est depassé
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredListings() {
    const now = new Date();

    const expired = await this.prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lte: now },
      },
      select: { id: true, sellerId: true, title: true, slug: true },
    });

    if (expired.length === 0) return;

    this.logger.log(`Expiration de ${expired.length} annonce(s)...`);

    await this.prisma.listing.updateMany({
      where: { id: { in: expired.map((l) => l.id) } },
      data: { status: 'EXPIRED' },
    });

    // Retirer des résultats de recherche et notifier les vendeurs
    for (const listing of expired) {
      this.searchService.removeListing(listing.id).catch(() => {});

      this.sendNotification({
        userId: listing.sellerId,
        type: 'LISTING_EXPIRING',
        title: 'Annonce expiree',
        body: `Votre annonce "${listing.title}" a expire. Vous pouvez la republier depuis votre tableau de bord.`,
        data: { listingTitle: listing.title, listingSlug: listing.slug },
      }).catch(() => {});
    }

    this.logger.log(`${expired.length} annonce(s) expiree(s) avec succes.`);
  }

  /**
   * Tous les jours a 9h : rappel pour les annonces qui expirent dans 3 jours
   */
  @Cron('0 9 * * *')
  async handleExpiringReminders() {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    const expiringSoon = await this.prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          gte: threeDaysLater,
          lt: fourDaysLater,
        },
      },
      select: { id: true, sellerId: true, title: true, slug: true },
    });

    if (expiringSoon.length === 0) return;

    this.logger.log(
      `Rappel d'expiration pour ${expiringSoon.length} annonce(s)...`,
    );

    for (const listing of expiringSoon) {
      this.sendNotification({
        userId: listing.sellerId,
        type: 'LISTING_EXPIRING',
        title: 'Annonce bientot expiree',
        body: `Votre annonce "${listing.title}" expire dans 3 jours.`,
        data: {
          listingTitle: listing.title,
          listingSlug: listing.slug,
          daysLeft: 3,
        },
      }).catch(() => {});
    }
  }

  private async sendNotification(payload: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await fetch(`${this.notificationServiceUrl}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
    } catch (err) {
      this.logger.error('Erreur envoi notification:', err);
    }
  }
}

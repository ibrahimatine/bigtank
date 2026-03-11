import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { SearchService } from '../search/search.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ListingCronService {
  private readonly logger = new Logger(ListingCronService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private searchService: SearchService,
    private notificationService: NotificationService,
  ) {}

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

    for (const listing of expired) {
      this.searchService.removeListing(listing.id).catch(() => {});

      this.notificationService.createAndSend({
        userId: listing.sellerId,
        type: 'LISTING_EXPIRING',
        title: 'Annonce expiree',
        body: `Votre annonce "${listing.title}" a expire. Vous pouvez la republier depuis votre tableau de bord.`,
        data: { listingTitle: listing.title, listingSlug: listing.slug },
      }).catch(() => {});
    }

    this.logger.log(`${expired.length} annonce(s) expiree(s) avec succes.`);
  }

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
      this.notificationService.createAndSend({
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
}

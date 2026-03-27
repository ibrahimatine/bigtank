import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient, UserStatus, ListingStatus } from '@prisma/client';
import { SearchService } from '../search/search.service';
import { NotificationService } from '../notification/notification.service';
import { ChatService } from '../chat/chat.service';
import { ChatGateway } from '../chat/chat.gateway';
import { generateListingSlug } from '../common/utils/slug.util';
import { sanitizeDescription } from '../common/utils/sanitize.util';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject('PRISMA') private readonly prisma: PrismaClient,
    private readonly searchService: SearchService,
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ============ Stats enrichies ============

  async getStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      totalSellers,
      totalListings,
      activeListings,
      soldListings,
      suspendedUsers,
      bannedUsers,
      newUsersToday,
      pendingReports,
      messagesToday,
      deletedListings,
      featuredListings,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'SELLER' } }),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.listing.count({ where: { status: 'SOLD' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { status: 'BANNED' } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.message.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.listing.count({ where: { status: 'DELETED' } }),
      this.prisma.listing.count({ where: { isFeatured: true } }),
    ]);

    return {
      users: { total: totalUsers, sellers: totalSellers, suspended: suspendedUsers, banned: bannedUsers, newToday: newUsersToday },
      listings: { total: totalListings, active: activeListings, sold: soldListings, deleted: deletedListings, featured: featuredListings },
      reports: { pending: pendingReports },
      messages: { today: messagesToday },
    };
  }

  // ============ Users ============

  async getUsers(params: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const { page, limit, search, role, status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          suspendedAt: true,
          suspendedReason: true,
          createdAt: true,
          _count: {
            select: { listings: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        suspendedAt: true,
        suspendedReason: true,
        createdAt: true,
        updatedAt: true,
        sellerStats: true,
        _count: {
          select: { listings: true },
        },
      },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async getUserListings(userId: string, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: { sellerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, brand: true, priceXof: true,
          status: true, createdAt: true, slug: true, isFeatured: true,
          images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
        },
      }),
      this.prisma.listing.count({ where: { sellerId: userId } }),
    ]);

    return { listings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async suspendUser(adminId: string, userId: string, reason: string) {
    if (adminId === userId) {
      throw new ForbiddenException('Un admin ne peut pas se suspendre lui-même');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Impossible de suspendre un autre admin');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspendedReason: reason,
      },
      select: { id: true, status: true, suspendedAt: true, suspendedReason: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_SUSPEND_USER',
        targetId: userId,
        targetType: 'User',
        details: reason,
      },
    });

    this.sendSystemMessageWithSocket(
      adminId,
      userId,
      `Votre compte a ete suspendu. Raison : ${reason}. Contactez le support si vous pensez qu'il s'agit d'une erreur.`,
    ).catch(() => {});

    return updated;
  }

  async activateUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        suspendedAt: null,
        suspendedReason: null,
      },
      select: { id: true, status: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_ACTIVATE_USER',
        targetId: userId,
        targetType: 'User',
      },
    });

    this.sendSystemMessageWithSocket(
      adminId,
      userId,
      `Votre compte a ete reactive. Vous pouvez a nouveau utiliser Samadal normalement.`,
    ).catch(() => {});

    return updated;
  }

  async banUser(adminId: string, userId: string, reason: string) {
    if (adminId === userId) {
      throw new ForbiddenException('Un admin ne peut pas se bannir lui-même');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Impossible de bannir un autre admin');
    }

    // 1. Ban user
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.BANNED,
        suspendedAt: new Date(),
        suspendedReason: reason,
      },
      select: { id: true, status: true },
    });

    // 2. Supprimer toutes ses annonces actives
    const activeListings = await this.prisma.listing.findMany({
      where: { sellerId: userId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (activeListings.length > 0) {
      await this.prisma.listing.updateMany({
        where: { sellerId: userId, status: 'ACTIVE' },
        data: { status: ListingStatus.DELETED, deletedAt: new Date(), deletedBy: adminId },
      });

      // Retirer de Meilisearch
      for (const listing of activeListings) {
        this.searchService.removeListing(listing.id).catch(() => {});
      }
    }

    // 3. Supprimer tous les refresh tokens
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    // 4. Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_BAN_USER',
        targetId: userId,
        targetType: 'User',
        details: `${reason} — ${activeListings.length} annonce(s) supprimee(s)`,
      },
    });

    this.sendSystemMessageWithSocket(
      adminId,
      userId,
      `Votre compte a ete banni. Raison : ${reason}. Vos annonces actives ont ete supprimees.`,
    ).catch(() => {});

    return { ...updated, listingsDeleted: activeListings.length };
  }

  async unbanUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.status !== 'BANNED') {
      throw new BadRequestException('Cet utilisateur n\'est pas banni');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        suspendedAt: null,
        suspendedReason: null,
      },
      select: { id: true, status: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_UNBAN_USER',
        targetId: userId,
        targetType: 'User',
      },
    });

    this.sendSystemMessageWithSocket(
      adminId,
      userId,
      `Votre compte a ete debanni. Vous pouvez a nouveau utiliser Samadal.`,
    ).catch(() => {});

    return updated;
  }

  async deleteUser(adminId: string, userId: string) {
    if (adminId === userId) {
      throw new ForbiddenException('Un admin ne peut pas se supprimer lui-même');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Impossible de supprimer un autre admin');
    }

    // Supprimer les annonces de la recherche
    const userListings = await this.prisma.listing.findMany({
      where: { sellerId: userId },
      select: { id: true },
    });
    for (const listing of userListings) {
      this.searchService.removeListing(listing.id).catch(() => {});
    }

    // Suppression definitive (hard delete)
    // 1. Trouver les conversations ou l'user est implique
    const conversations = await this.prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      select: { id: true },
    });
    const convIds = conversations.map(c => c.id);

    // 2. Supprimer messages de ces conversations, puis les conversations
    if (convIds.length > 0) {
      await this.prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
      await this.prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
    }

    // 3. Supprimer les autres relations sans cascade
    await this.prisma.report.deleteMany({ where: { userId } });
    await this.prisma.auditLog.deleteMany({ where: { userId } });
    await this.prisma.listing.deleteMany({ where: { sellerId: userId } });

    // 4. Supprimer l'utilisateur (cascade: refreshToken, notification, sellerStats)
    await this.prisma.user.delete({ where: { id: userId } });

    // Log d'audit avec l'admin (le log de l'user supprime est deja cascade)
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_HARD_DELETE_USER',
        targetId: userId,
        targetType: 'User',
        details: `${user.name} (${user.email || user.phone}) — ${userListings.length} annonce(s) — suppression definitive`,
      },
    });

    return { message: 'Utilisateur supprime definitivement', listingsDeleted: userListings.length };
  }

  // ============ Listings ============

  async createListingForSeller(
    adminId: string,
    dto: {
      sellerId: string;
      title: string;
      description: string;
      brand: string;
      model?: string;
      sizeEu: number;
      sizeUs?: number;
      condition: string;
      color: string;
      priceXof: number;
      locationCity?: string;
      locationRegion: string;
    },
  ) {
    const seller = await this.prisma.user.findUnique({ where: { id: dto.sellerId } });
    if (!seller) throw new NotFoundException('Vendeur introuvable');
    if (seller.role !== 'SELLER' && seller.role !== 'ADMIN') {
      throw new BadRequestException('Cet utilisateur n\'est pas vendeur');
    }

    const description = sanitizeDescription(dto.description);
    const locationCity = dto.locationCity || '';
    const slug = generateListingSlug(dto.brand, dto.model, dto.sizeEu, locationCity);

    const listing = await this.prisma.listing.create({
      data: {
        sellerId: dto.sellerId,
        slug,
        title: dto.title,
        description,
        brand: dto.brand,
        model: dto.model || '',
        sizeEu: dto.sizeEu,
        sizeUs: dto.sizeUs || null,
        condition: dto.condition as 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR',
        color: dto.color,
        priceXof: dto.priceXof,
        locationCity,
        locationRegion: dto.locationRegion,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 60 * 86400000),
      },
      include: { images: true },
    });

    this.searchService.indexListing(listing).catch(() => {});

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_CREATE_LISTING_FOR_SELLER',
        targetId: listing.id,
        targetType: 'Listing',
        details: `${listing.title} — pour ${seller.name} (${seller.email || seller.phone})`,
      },
    });

    return { message: 'Annonce creee', listing };
  }

  async getListings(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    includeDeleted?: boolean;
  }) {
    const { page, limit, search, status, includeDeleted } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    } else if (!includeDeleted) {
      where.status = { not: 'DELETED' };
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          brand: true,
          priceXof: true,
          status: true,
          isFeatured: true,
          createdAt: true,
          slug: true,
          deletedAt: true,
          seller: {
            select: { id: true, name: true, email: true },
          },
          images: {
            take: 1,
            orderBy: { order: 'asc' },
            select: { url: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      listings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateListingStatus(adminId: string, listingId: string, newStatus: string) {
    const validStatuses = ['ACTIVE', 'SOLD', 'RESERVED', 'DRAFT', 'EXPIRED'];
    if (!validStatuses.includes(newStatus)) {
      throw new BadRequestException(`Statut invalide. Statuts autorises : ${validStatuses.join(', ')}`);
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Annonce introuvable');

    const updateData: Record<string, unknown> = { status: newStatus as ListingStatus };

    if (newStatus === 'ACTIVE') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60);
      updateData.expiresAt = expiresAt;
    }

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: updateData,
      include: { images: { orderBy: { order: 'asc' } } },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_UPDATE_LISTING_STATUS',
        targetId: listingId,
        targetType: 'Listing',
        details: `${listing.title}: ${listing.status} → ${newStatus}`,
      },
    });

    try {
      if (newStatus === 'ACTIVE') {
        await this.searchService.indexListing(updated);
      } else {
        await this.searchService.removeListing(listingId);
      }
    } catch (err) {
      this.logger.error(`Echec sync Meilisearch pour listing ${listingId}: ${err}`);
    }

    return { id: updated.id, status: updated.status, title: updated.title };
  }

  async restoreListing(adminId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Annonce introuvable');
    if (listing.status !== 'DELETED') {
      throw new BadRequestException('Seules les annonces supprimees peuvent etre restaurees');
    }

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.DRAFT,
        deletedAt: null,
        deletedBy: null,
      },
      select: { id: true, status: true, title: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_RESTORE_LISTING',
        targetId: listingId,
        targetType: 'Listing',
        details: listing.title,
      },
    });

    return updated;
  }

  async toggleFeatureListing(adminId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Annonce introuvable');

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: { isFeatured: !listing.isFeatured },
      select: { id: true, isFeatured: true, title: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: updated.isFeatured ? 'ADMIN_FEATURE_LISTING' : 'ADMIN_UNFEATURE_LISTING',
        targetId: listingId,
        targetType: 'Listing',
        details: listing.title,
      },
    });

    return updated;
  }

  async deleteListing(adminId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('Annonce introuvable');

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.DELETED,
        deletedAt: new Date(),
        deletedBy: adminId,
      },
      select: { id: true, status: true, deletedAt: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_DELETE_LISTING',
        targetId: listingId,
        targetType: 'Listing',
        details: listing.title,
      },
    });

    this.searchService.removeListing(listingId).catch(() => {});

    this.sendSystemMessageWithSocket(
      adminId,
      listing.sellerId,
      `Votre annonce "${listing.title}" a ete supprimee par l'equipe Samadal car elle ne respecte pas nos conditions d'utilisation.`,
    ).catch(() => {});

    return updated;
  }

  // ============ Reports ============

  async getReports(params: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          listing: {
            select: {
              id: true, title: true, slug: true, status: true,
              seller: { select: { id: true, name: true } },
              images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
            },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async reviewReport(adminId: string, reportId: string, action: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { listing: { select: { id: true, sellerId: true, title: true } } },
    });
    if (!report) throw new NotFoundException('Signalement introuvable');
    if (report.status !== 'PENDING') {
      throw new BadRequestException('Ce signalement a deja ete traite');
    }

    // Marquer comme reviewed
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'REVIEWED', reviewedBy: adminId, reviewedAt: new Date() },
    });

    if (action === 'DELETE_LISTING') {
      await this.deleteListing(adminId, report.listingId);
    } else if (action === 'BAN_SELLER') {
      await this.banUser(adminId, report.listing.sellerId, `Banni suite au signalement de l'annonce "${report.listing.title}"`);
    }
    // REVIEW_ONLY = juste marquer comme reviewed, rien d'autre

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_REVIEW_REPORT',
        targetId: reportId,
        targetType: 'Report',
        details: `Action: ${action} — Annonce: ${report.listing.title}`,
      },
    });

    return { message: 'Signalement traite', action };
  }

  async dismissReport(adminId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Signalement introuvable');

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'DISMISSED', reviewedBy: adminId, reviewedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_DISMISS_REPORT',
        targetId: reportId,
        targetType: 'Report',
      },
    });

    return { message: 'Signalement rejete' };
  }

  // ============ Report cote user ============

  async createReport(userId: string, listingId: string, reason: string, description?: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Annonce introuvable');
    if (listing.sellerId === userId) {
      throw new BadRequestException('Vous ne pouvez pas signaler votre propre annonce');
    }

    // Vérifier unicité
    const existing = await this.prisma.report.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      throw new BadRequestException('Vous avez deja signale cette annonce');
    }

    const report = await this.prisma.report.create({
      data: {
        userId,
        listingId,
        reason: reason as any,
        description,
      },
    });

    return { message: 'Signalement enregistre', report };
  }

  // ============ Tools ============

  async sendMassEmail(adminId: string, subject: string, body: string) {
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE', email: { not: null } },
      select: { id: true, email: true, name: true },
    });

    let sent = 0;
    for (const user of users) {
      if (!user.email) continue;
      try {
        await this.notificationService.createAndSend({
          userId: user.id,
          type: 'ADMIN_BROADCAST',
          title: subject,
          body: body,
        });
        sent++;
      } catch {
        this.logger.warn(`Echec envoi email a ${user.email}`);
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_MASS_EMAIL',
        details: `Sujet: ${subject} — ${sent}/${users.length} envoyes`,
      },
    });

    return { message: `Email envoye a ${sent} utilisateurs sur ${users.length}`, sent, total: users.length };
  }

  async getBannedIps() {
    return this.prisma.bannedIp.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async banIp(adminId: string, ip: string, reason?: string) {
    const existing = await this.prisma.bannedIp.findUnique({ where: { ip } });
    if (existing) throw new BadRequestException('Cette IP est deja bannie');

    const banned = await this.prisma.bannedIp.create({
      data: { ip, reason, bannedBy: adminId },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_BAN_IP',
        details: `IP: ${ip} — ${reason || 'Aucune raison'}`,
      },
    });

    return banned;
  }

  async unbanIp(id: string) {
    const banned = await this.prisma.bannedIp.findUnique({ where: { id } });
    if (!banned) throw new NotFoundException('IP non trouvee');

    await this.prisma.bannedIp.delete({ where: { id } });
    return { message: `IP ${banned.ip} debannie` };
  }

  async cleanupUnverified(confirm: boolean) {
    // Comptes non verifies : email non verifie, crees il y a plus de 3 jours
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);

    const unverifiedUsers = await this.prisma.user.findMany({
      where: {
        emailVerified: false,
        createdAt: { lt: cutoff },
        role: 'USER',
      },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    if (!confirm) {
      return {
        preview: true,
        count: unverifiedUsers.length,
        users: unverifiedUsers.slice(0, 20),
      };
    }

    // Suppression definitive de chaque user
    let deleted = 0;
    for (const user of unverifiedUsers) {
      try {
        // Conversations
        const convs = await this.prisma.conversation.findMany({
          where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
          select: { id: true },
        });
        const convIds = convs.map(c => c.id);
        if (convIds.length > 0) {
          await this.prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
          await this.prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
        }

        await this.prisma.report.deleteMany({ where: { userId: user.id } });
        await this.prisma.auditLog.deleteMany({ where: { userId: user.id } });
        await this.prisma.listing.deleteMany({ where: { sellerId: user.id } });
        await this.prisma.user.delete({ where: { id: user.id } });
        deleted++;
      } catch (err) {
        this.logger.warn(`Echec suppression user ${user.id}: ${err}`);
      }
    }

    return { preview: false, deleted, total: unverifiedUsers.length };
  }

  async cleanupInactive(confirm: boolean) {
    // Comptes inactifs : crees il y a plus de 90 jours, 0 annonces, 0 messages
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const inactiveUsers = await this.prisma.user.findMany({
      where: {
        createdAt: { lt: cutoff },
        role: 'USER',
        status: 'ACTIVE',
        listings: { none: {} },
        messagesSent: { none: {} },
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!confirm) {
      return {
        preview: true,
        count: inactiveUsers.length,
        users: inactiveUsers.slice(0, 20), // Preview max 20
      };
    }

    // Supprimer les comptes inactifs
    const ids = inactiveUsers.map(u => u.id);
    if (ids.length > 0) {
      await this.prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
      await this.prisma.notification.deleteMany({ where: { userId: { in: ids } } });
      await this.prisma.user.deleteMany({ where: { id: { in: ids } } });
    }

    return { preview: false, deleted: ids.length };
  }

  // ============ Audit & Transactions ============

  async getAuditLogs(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTransactionLogs(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const where = { targetType: 'LISTING_PAYMENT' };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Envoie un message systeme ET emet le WebSocket pour affichage temps reel.
   */
  private async sendSystemMessageWithSocket(adminId: string, userId: string, content: string) {
    const { conversation, message } = await this.chatService.sendSystemMessage(adminId, userId, content);
    this.logger.log(`[system-msg] Message envoye a ${userId} dans conversation ${conversation.id}`);

    // Emettre via WebSocket pour affichage temps reel
    const roomName = `conversation:${conversation.id}`;
    this.chatGateway.server.to(roomName).emit('new_message', {
      ...message,
      conversationId: conversation.id,
    });
    this.logger.log(`[system-msg] WebSocket emis sur room ${roomName}`);
  }
}

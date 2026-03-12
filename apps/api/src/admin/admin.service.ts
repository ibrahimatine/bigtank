import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaClient, UserStatus, ListingStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(@Inject('PRISMA') private readonly prisma: PrismaClient) {}

  async getStats() {
    const [
      totalUsers,
      totalSellers,
      totalListings,
      activeListings,
      soldListings,
      suspendedUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'SELLER' } }),
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.listing.count({ where: { status: 'SOLD' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return {
      users: { total: totalUsers, sellers: totalSellers, suspended: suspendedUsers },
      listings: { total: totalListings, active: activeListings, sold: soldListings },
    };
  }

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

    return updated;
  }

  async getListings(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { page, limit, search, status } = params;
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
    } else {
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
          createdAt: true,
          slug: true,
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

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: newStatus as ListingStatus },
      select: { id: true, status: true, title: true },
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

    return updated;
  }

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
}

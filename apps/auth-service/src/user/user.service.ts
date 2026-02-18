import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { sellerStats: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Check email uniqueness if changed
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Check phone uniqueness if changed
    if (dto.phone && dto.phone !== user.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email || null }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.city !== undefined && { city: dto.city || null }),
        ...(dto.region !== undefined && { region: dto.region || null }),
      },
      include: { sellerStats: true },
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return { message: 'Profil mis à jour', user: userWithoutPassword };
  }

  async upgradeToSeller(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { sellerStats: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.role === 'SELLER' || user.role === 'ADMIN') {
      throw new ConflictException("L'utilisateur est déjà vendeur");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'SELLER',
        sellerStats: {
          create: {
            totalSales: 0,
            totalListings: 0,
            commissionFreeRemaining: 1,
          },
        },
      },
      include: { sellerStats: true },
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return {
      message: 'Vous êtes maintenant vendeur',
      user: userWithoutPassword,
    };
  }
}

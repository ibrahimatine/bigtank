import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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

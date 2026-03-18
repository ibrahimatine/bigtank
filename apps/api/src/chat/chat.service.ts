import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import sanitize from 'sanitize-html';
import { DEFAULT_PAGE_SIZE } from '@samadal/shared-utils';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ChatService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private notificationService: NotificationService,
  ) {}

  async startConversation(userId: string, listingId: string, message: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true, status: true },
    });

    if (!listing || listing.status === 'DELETED') {
      throw new NotFoundException('Annonce non trouvee');
    }

    if (listing.status !== 'ACTIVE' && listing.status !== 'RESERVED') {
      throw new BadRequestException(
        'Impossible de contacter le vendeur pour cette annonce',
      );
    }

    if (listing.sellerId === userId) {
      throw new BadRequestException(
        'Vous ne pouvez pas demarrer une conversation sur votre propre annonce',
      );
    }

    const sanitizedContent = this.sanitizeMessage(message);

    const conversation = await this.prisma.conversation.upsert({
      where: {
        listingId_buyerId_sellerId: {
          listingId,
          buyerId: userId,
          sellerId: listing.sellerId,
        },
      },
      create: {
        listingId,
        buyerId: userId,
        sellerId: listing.sellerId,
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: userId,
            content: sanitizedContent,
          },
        },
      },
      update: {
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: userId,
            content: sanitizedContent,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        listing: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    const firstMessage = conversation.messages[0];
    const preview = firstMessage
      ? firstMessage.content.length > 80
        ? firstMessage.content.slice(0, 77) + '...'
        : firstMessage.content
      : '';

    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    this.notificationService.createAndSend({
      userId: listing.sellerId,
      type: 'NEW_MESSAGE',
      title: 'Nouveau message',
      body: preview,
      data: {
        conversationId: conversation.id,
        senderName: sender?.name || 'Un utilisateur',
      },
    }).catch(() => {});

    return {
      conversation,
      message: firstMessage,
    };
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvee');
    }

    this.checkParticipant(conversation, userId);

    const sanitizedContent = this.sanitizeMessage(content);
    const recipientId =
      conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
    const preview =
      sanitizedContent.length > 80
        ? sanitizedContent.slice(0, 77) + '...'
        : sanitizedContent;

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: sanitizedContent,
        },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    this.notificationService.createAndSend({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: 'Nouveau message',
      body: preview,
      data: {
        conversationId,
        senderName: message.sender?.name || 'Un utilisateur',
      },
    }).catch(() => {});

    return message;
  }

  async getConversations(userId: string, cursor?: string, limit?: number) {
    const take = Math.min(limit || DEFAULT_PAGE_SIZE, 50);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                readAt: null,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = conversations.length > take;
    const data = hasMore ? conversations.slice(0, take) : conversations;

    return {
      data: data.map((conv) => ({
        ...conv,
        lastMessage: conv.messages[0] || null,
        unreadCount: conv._count.messages,
        messages: undefined,
        _count: undefined,
      })),
      cursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            priceXof: true,
            images: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
        buyer: { select: { id: true, name: true, avatarUrl: true } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvee');
    }

    this.checkParticipant(conversation, userId);

    return conversation;
  }

  async getMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
    limit?: number,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvee');
    }

    this.checkParticipant(conversation, userId);

    const take = Math.min(limit || DEFAULT_PAGE_SIZE, 100);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > take;
    const data = hasMore ? messages.slice(0, take) : messages;

    return {
      data,
      cursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async markAsRead(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvee');
    }

    this.checkParticipant(conversation, userId);

    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { conversationId, readBy: userId, readAt: new Date(), count: result.count };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        conversation: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        senderId: { not: userId },
        readAt: null,
      },
    });

    return { count };
  }

  async getUserConversationIds(userId: string): Promise<string[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      select: { id: true },
    });

    return conversations.map((c) => c.id);
  }

  /**
   * Envoie un message systeme (de Samadal) a un utilisateur.
   * Cree une conversation systeme si elle n'existe pas encore.
   * Le senderId est l'admin qui a effectue l'action.
   */
  async sendSystemMessage(adminId: string, userId: string, content: string) {
    // Trouver ou creer la conversation systeme avec cet utilisateur
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        isSystem: true,
        OR: [
          { buyerId: userId, sellerId: adminId },
          { buyerId: adminId, sellerId: userId },
        ],
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          buyerId: userId,
          sellerId: adminId,
          isSystem: true,
          lastMessageAt: new Date(),
        },
      });
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: adminId,
          content,
        },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return { conversation, message };
  }

  private checkParticipant(
    conversation: { buyerId: string; sellerId: string },
    userId: string,
  ): void {
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new ForbiddenException(
        'Vous n\'avez pas acces a cette conversation',
      );
    }
  }

  private sanitizeMessage(content: string): string {
    return sanitize(content, { allowedTags: [], allowedAttributes: {} }).trim();
  }
}

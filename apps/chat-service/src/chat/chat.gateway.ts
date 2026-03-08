import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ChatService } from './chat.service';

interface JwtPayload {
  sub: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly jwtSecret: string;

  constructor(
    private chatService: ChatService,
    configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET doit etre defini dans les variables d\'environnement');
    this.jwtSecret = secret;
  }

  async handleConnection(client: Socket) {
    try {
      const user = this.authenticateClient(client);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      this.logger.log(`Client connected: ${user.id}`);

      // Join all conversation rooms
      const conversationIds = await this.chatService.getUserConversationIds(
        user.id,
      );
      for (const id of conversationIds) {
        client.join(`conversation:${id}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.id;
    if (userId) {
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    try {
      const message = await this.chatService.sendMessage(
        user.id,
        data.conversationId,
        data.content,
      );

      // Ensure sender is in the room
      client.join(`conversation:${data.conversationId}`);

      // Broadcast to all participants in the conversation room
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('new_message', message);

      return { success: true, data: message };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne',
      };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const user = client.data.user;
    if (!user) return;

    // Broadcast to others in the room (not to sender)
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: user.id,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    try {
      const result = await this.chatService.markAsRead(
        user.id,
        data.conversationId,
      );

      // Notify the other participant
      client.to(`conversation:${data.conversationId}`).emit('messages_read', {
        conversationId: data.conversationId,
        readBy: user.id,
        readAt: result.readAt,
      });

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne',
      };
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    // Verifier que l'utilisateur est bien participant de la conversation
    const userConversationIds = await this.chatService.getUserConversationIds(user.id);
    if (!userConversationIds.includes(data.conversationId)) {
      return { success: false, error: 'Vous n\'avez pas acces a cette conversation' };
    }

    client.join(`conversation:${data.conversationId}`);
    return { success: true };
  }

  private authenticateClient(client: Socket): { id: string; role: string } | null {
    const auth = client.handshake?.auth?.token;
    if (!auth || typeof auth !== 'string') return null;

    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return { id: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  }
}

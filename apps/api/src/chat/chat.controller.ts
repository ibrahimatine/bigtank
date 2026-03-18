import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../common/guards/email-verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StartConversationDto } from './dto/start-conversation.dto';
import { GetMessagesDto } from './dto/get-messages.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Post('conversations')
  async startConversation(
    @CurrentUser() user: { id: string },
    @Body() dto: StartConversationDto,
  ) {
    const result = await this.chatService.startConversation(user.id, dto.listingId, dto.message);

    // Emettre le message via WebSocket pour que le vendeur le recoive en temps reel
    if (result.message) {
      const roomName = `conversation:${result.conversation.id}`;

      // Faire rejoindre la room a tous les sockets des 2 participants
      // (la conversation vient peut-etre d'etre creee, donc le vendeur n'est pas encore dans la room)
      const sockets = await this.chatGateway.server.fetchSockets();
      for (const s of sockets) {
        const socketUserId = s.data?.user?.id;
        if (
          socketUserId === result.conversation.buyerId ||
          socketUserId === result.conversation.sellerId
        ) {
          s.join(roomName);
        }
      }

      this.chatGateway.server.to(roomName).emit('new_message', result.message);
    }

    return result;
  }

  @Get('conversations')
  async getConversations(
    @CurrentUser() user: { id: string },
    @Query() query: GetMessagesDto,
  ) {
    return this.chatService.getConversations(user.id, query.cursor, query.limit);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.chatService.getUnreadCount(user.id);
  }

  @Get('conversations/:id')
  async getConversation(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.chatService.getConversation(user.id, id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Query() query: GetMessagesDto,
  ) {
    return this.chatService.getMessages(user.id, id, query.cursor, query.limit);
  }
}

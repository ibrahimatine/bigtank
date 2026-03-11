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
import { GatewayAuthGuard } from '../common/guards/gateway-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StartConversationDto } from './dto/start-conversation.dto';
import { GetMessagesDto } from './dto/get-messages.dto';

@Controller('chat')
@UseGuards(GatewayAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('conversations')
  async startConversation(
    @CurrentUser() user: { id: string },
    @Body() dto: StartConversationDto,
  ) {
    return this.chatService.startConversation(user.id, dto.listingId, dto.message);
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

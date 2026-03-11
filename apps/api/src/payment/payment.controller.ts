import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiate(
    @CurrentUser() user: { id: string },
    @Body() body: { listingId: string; phone: string; paymentMethod: string },
  ) {
    return this.paymentService.initiate(user.id, body.listingId, body.phone, body.paymentMethod);
  }

  /** Webhook callback Intech — pas d'auth (appele par Intech) */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() body: any) {
    return this.paymentService.handleWebhook(body);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async refund(
    @CurrentUser() user: { id: string },
    @Body() body: { paymentId: string },
  ) {
    return this.paymentService.refundPayment(body.paymentId, user.id);
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async balance() {
    return this.paymentService.getBalance();
  }

  @Get('status/:refCommand')
  @UseGuards(JwtAuthGuard)
  async status(@Param('refCommand') refCommand: string) {
    return this.paymentService.checkTransactionStatus(refCommand);
  }

  @Get('listing/:listingId')
  @UseGuards(JwtAuthGuard)
  async getByListing(
    @CurrentUser() user: { id: string },
    @Param('listingId') listingId: string,
  ) {
    return this.paymentService.getPaymentByListing(user.id, listingId);
  }

  @Get('preview/:listingId')
  async preview(@Param('listingId') listingId: string) {
    return this.paymentService.getCommissionPreview(listingId);
  }
}

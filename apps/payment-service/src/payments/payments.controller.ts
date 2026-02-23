import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private requireUser(userId: string | undefined): string {
    if (!userId) throw new ForbiddenException('Non authentifié');
    return userId;
  }

  /** Initier un paiement de publication */
  @Post('initiate')
  async initiate(
    @Headers('x-user-id') userId: string,
    @Body() body: { listingId: string },
  ) {
    const uid = this.requireUser(userId);
    return this.paymentsService.initiate(uid, body.listingId);
  }

  /** Webhook IPN PayTech — pas d'auth (appelé par PayTech) */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() body: Record<string, string>) {
    return this.paymentsService.handleWebhook(body);
  }

  /** Statut de paiement pour une annonce */
  @Get('listing/:listingId')
  async getByListing(
    @Headers('x-user-id') userId: string,
    @Param('listingId') listingId: string,
  ) {
    const uid = this.requireUser(userId);
    return this.paymentsService.getPaymentByListing(uid, listingId);
  }

  /** Aperçu de la commission avant paiement */
  @Get('preview/:listingId')
  async preview(@Param('listingId') listingId: string) {
    return this.paymentsService.getCommissionPreview(listingId);
  }
}

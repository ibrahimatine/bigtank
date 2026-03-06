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

  private requireAdmin(role: string | undefined): void {
    if (role !== 'ADMIN') throw new ForbiddenException('Accès réservé aux administrateurs');
  }

  /** Initier un paiement de publication via Intech (USSD push) */
  @Post('initiate')
  async initiate(
    @Headers('x-user-id') userId: string,
    @Body() body: { listingId: string; phone: string; paymentMethod: string },
  ) {
    const uid = this.requireUser(userId);
    return this.paymentsService.initiate(uid, body.listingId, body.phone, body.paymentMethod);
  }

  /** Webhook callback Intech — pas d'auth (appelé par Intech) */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }

  /** Rembourser un paiement (admin only) */
  @Post('refund')
  async refund(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
    @Body() body: { paymentId: string },
  ) {
    const uid = this.requireUser(userId);
    this.requireAdmin(role);
    return this.paymentsService.refundPayment(body.paymentId, uid);
  }

  /** Vérifier le solde Intech (admin only) */
  @Get('balance')
  async balance(
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ) {
    this.requireUser(userId);
    this.requireAdmin(role);
    return this.paymentsService.getBalance();
  }

  /** Vérifier le statut d'un paiement par refCommand */
  @Get('status/:refCommand')
  async status(
    @Headers('x-user-id') userId: string,
    @Param('refCommand') refCommand: string,
  ) {
    this.requireUser(userId);
    return this.paymentsService.checkTransactionStatus(refCommand);
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

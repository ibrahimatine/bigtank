import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly from: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.from = this.configService.get<string>('EMAIL_FROM') || 'Samadal <noreply@resend.dev>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      console.log('[email] Resend initialise avec succes');
    } else {
      console.warn('[email] RESEND_API_KEY non definie — emails desactives');
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.resend) {
      console.log(`[email] Email non envoye (Resend non configure): ${options.subject}`);
      return false;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error('[email] Erreur Resend:', error);
        return false;
      }

      console.log(`[email] Email envoye a ${options.to}: ${options.subject}`);
      return true;
    } catch (err) {
      console.error('[email] Erreur envoi email:', err);
      return false;
    }
  }

  async sendWelcome(to: string, name: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Bienvenue sur Samadal !',
      html: this.wrapTemplate(`
        <h1 style="color: #1a1a1a; margin: 0 0 16px;">Bienvenue ${this.escape(name)} !</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Votre compte Samadal a ete cree avec succes.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Samadal est la marketplace de chaussures grandes tailles au Senegal.
          Trouvez des paires en taille 46 et plus, ou vendez les votres !
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.getWebUrl()}/search"
             style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Decouvrir les annonces
          </a>
        </div>
      `),
    });
  }

  async sendNewMessage(
    to: string,
    recipientName: string,
    senderName: string,
    messagePreview: string,
    conversationId: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: `Nouveau message de ${senderName}`,
      html: this.wrapTemplate(`
        <h1 style="color: #1a1a1a; margin: 0 0 16px;">Nouveau message</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${this.escape(recipientName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          <strong>${this.escape(senderName)}</strong> vous a envoye un message :
        </p>
        <div style="background: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
          <p style="color: #333; font-size: 15px; margin: 0; font-style: italic;">
            "${this.escape(messagePreview)}"
          </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.getWebUrl()}/chat/${conversationId}"
             style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Repondre
          </a>
        </div>
      `),
    });
  }

  async sendListingPublished(
    to: string,
    sellerName: string,
    listingTitle: string,
    listingSlug: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: `Votre annonce "${listingTitle}" est en ligne !`,
      html: this.wrapTemplate(`
        <h1 style="color: #1a1a1a; margin: 0 0 16px;">Annonce publiee !</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${this.escape(sellerName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Votre annonce <strong>"${this.escape(listingTitle)}"</strong> est maintenant visible par tous les acheteurs.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.getWebUrl()}/shoes/${listingSlug}"
             style="background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Voir mon annonce
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          Votre annonce sera active pendant 60 jours.
        </p>
      `),
    });
  }

  async sendListingSold(
    to: string,
    sellerName: string,
    listingTitle: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: `Felicitations ! "${listingTitle}" a ete vendue`,
      html: this.wrapTemplate(`
        <h1 style="color: #1a1a1a; margin: 0 0 16px;">Vente confirmee !</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${this.escape(sellerName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Votre annonce <strong>"${this.escape(listingTitle)}"</strong> a ete marquee comme vendue. Felicitations !
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.getWebUrl()}/dashboard"
             style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Mon tableau de bord
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          Vous avez d'autres paires a vendre ? Publiez une nouvelle annonce !
        </p>
      `),
    });
  }

  async sendPaymentSuccess(
    to: string,
    sellerName: string,
    listingTitle: string,
    amount: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: `Paiement confirme pour "${listingTitle}"`,
      html: this.wrapTemplate(`
        <h1 style="color: #1a1a1a; margin: 0 0 16px;">Paiement recu !</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${this.escape(sellerName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Votre paiement de <strong>${this.escape(amount)}</strong> pour l'annonce
          <strong>"${this.escape(listingTitle)}"</strong> a ete confirme.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Votre annonce est maintenant <strong>active</strong> et visible par tous les acheteurs pendant 60 jours.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.getWebUrl()}/dashboard"
             style="background: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Voir mon tableau de bord
          </a>
        </div>
      `),
    });
  }

  async sendListingExpiringSoon(
    to: string,
    sellerName: string,
    listingTitle: string,
    daysLeft: number,
    listingSlug: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: `Votre annonce "${listingTitle}" expire dans ${daysLeft} jours`,
      html: this.wrapTemplate(`
        <h1 style="color: #1a1a1a; margin: 0 0 16px;">Annonce bientot expiree</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${this.escape(sellerName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Votre annonce <strong>"${this.escape(listingTitle)}"</strong> expire dans
          <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong>.
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Si elle n'a pas encore trouve preneur, vous pourrez la republier apres expiration.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.getWebUrl()}/shoes/${listingSlug}"
             style="background: #f59e0b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Voir mon annonce
          </a>
        </div>
      `),
    });
  }

  async sendPasswordReset(
    to: string,
    userName: string,
    resetLink: string,
  ): Promise<boolean> {
    return this.send({
      to,
      subject: 'Reinitialisation de votre mot de passe Samadal',
      html: this.wrapTemplate(`
        <h1 style="color: #1a1a1a; margin: 0 0 16px;">Mot de passe oublie ?</h1>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Bonjour ${this.escape(userName)},
        </p>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${this.escape(resetLink)}"
             style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Reinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez simplement cet email.
        </p>
      `),
    });
  }

  private getWebUrl(): string {
    return this.configService.get<string>('WEB_URL') || 'http://localhost:3000';
  }

  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private wrapTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h2 style="color: #2563eb; font-size: 28px; font-weight: 800; margin: 0;">Samadal</h2>
      <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Chaussures grandes tailles au Senegal</p>
    </div>
    <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${content}
    </div>
    <div style="text-align: center; margin-top: 32px; color: #999; font-size: 12px;">
      <p>Samadal — Marketplace chaussures grandes tailles</p>
      <p>Cet email a ete envoye automatiquement, merci de ne pas repondre.</p>
    </div>
  </div>
</body>
</html>`;
  }
}

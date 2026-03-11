import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

@Injectable()
export class AvatarService {
  private s3Client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private configService: ConfigService,
  ) {
    this.endpoint =
      this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    this.bucket =
      this.configService.get<string>('S3_BUCKET') || 'samadal-images';

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get<string>('S3_REGION') || 'us-east-1',
      credentials: {
        accessKeyId:
          this.configService.get<string>('S3_ACCESS_KEY') || 'samadal_minio',
        secretAccessKey:
          this.configService.get<string>('S3_SECRET_KEY') ||
          'samadal_minio_secret',
      },
      forcePathStyle: true,
    });
  }

  async generatePresignedUrl(
    userId: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
      throw new BadRequestException('Format accepte : JPEG, PNG, WebP');
    }

    const ext = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1];
    const key = `avatars/${userId}/${nanoid(8)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });

    return { uploadUrl, key };
  }

  async confirmAvatar(userId: string, key: string): Promise<{ avatarUrl: string }> {
    const avatarUrl = `${this.endpoint}/${this.bucket}/${key}`;

    // Supprimer l'ancien avatar de S3 si existant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl && user.avatarUrl.includes(`/${this.bucket}/avatars/`)) {
      const oldKey = user.avatarUrl.split(`/${this.bucket}/`)[1];
      if (oldKey) {
        await this.s3Client
          .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: oldKey }))
          .catch(() => {});
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return { avatarUrl };
  }
}

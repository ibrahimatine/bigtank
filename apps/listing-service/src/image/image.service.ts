import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

@Injectable()
export class ImageService {
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
      this.configService.get<string>('S3_BUCKET') || 'bigtank-images';

    this.s3Client = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get<string>('S3_REGION') || 'us-east-1',
      credentials: {
        accessKeyId:
          this.configService.get<string>('S3_ACCESS_KEY') || 'bigtank_minio',
        secretAccessKey:
          this.configService.get<string>('S3_SECRET_KEY') ||
          'bigtank_minio_secret',
      },
      forcePathStyle: true,
    });
  }

  async generatePresignedUrl(
    listingId: string,
    _fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const existingCount = await this.prisma.listingImage.count({
      where: { listingId },
    });
    if (existingCount >= MAX_IMAGES) {
      throw new BadRequestException('Maximum 5 images par annonce');
    }

    const ext =
      contentType.split('/')[1] === 'jpeg'
        ? 'jpg'
        : contentType.split('/')[1];
    const key = `listings/${listingId}/${nanoid(12)}.${ext}`;

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

  async confirmImage(
    listingId: string,
    key: string,
    order: number,
    width: number,
    height: number,
  ) {
    let headResult;
    try {
      headResult = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch {
      throw new BadRequestException(
        "Image non trouvee. Veuillez d'abord telecharger l'image.",
      );
    }

    if (headResult.ContentLength && headResult.ContentLength > MAX_FILE_SIZE) {
      await this.s3Client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      ).catch(() => {});
      throw new BadRequestException('Taille max : 5 Mo par image');
    }

    const existingCount = await this.prisma.listingImage.count({
      where: { listingId },
    });
    if (existingCount >= MAX_IMAGES) {
      throw new BadRequestException('Maximum 5 images par annonce');
    }

    const url = `${this.endpoint}/${this.bucket}/${key}`;

    return this.prisma.listingImage.create({
      data: { listingId, url, key, order, width, height },
    });
  }

  async deleteListingImages(listingId: string): Promise<void> {
    const images = await this.prisma.listingImage.findMany({
      where: { listingId },
    });

    for (const image of images) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: image.key,
          }),
        );
      } catch {
        // Ignore S3 deletion errors (image may already be gone)
      }
    }

    await this.prisma.listingImage.deleteMany({ where: { listingId } });
  }

  async deleteImage(imageId: string, listingId: string) {
    const image = await this.prisma.listingImage.findFirst({
      where: { id: imageId, listingId },
    });
    if (!image) {
      throw new NotFoundException('Image non trouvee');
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: image.key,
        }),
      );
    } catch {
      // Ignore
    }

    await this.prisma.listingImage.delete({ where: { id: imageId } });
    return { message: 'Image supprimee' };
  }
}

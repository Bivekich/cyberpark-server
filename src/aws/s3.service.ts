import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'eu-central-1';
    this.bucket = process.env.AWS_S3_BUCKET || 'cyberpark-bucket';

    this.s3 = new S3Client({
      region: this.region,
      endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.AWS_S3_ENDPOINT, // many S3-compatible services expect path-style
      credentials: process.env.AWS_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    });
  }

  /**
   * Возвращает presigned URL для загрузки файла
   */
  async getUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds: number = 60 * 5,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Публичная ссылка на загруженный объект (при условии ACL public-read)
   */
  getPublicUrl(key: string): string {
    // Если используется кастомный endpoint (например TWCStorage)
    if (process.env.AWS_S3_ENDPOINT) {
      // TWCStorage использует формат: https://s3.twcstorage.ru/bucket/key
      // Извлекаем хост из endpoint
      const endpoint = process.env.AWS_S3_ENDPOINT.replace(/^https?:\/\//, '');
      return `https://${endpoint}/${this.bucket}/${key}`;
    }
    // Стандартный AWS S3 URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
} 
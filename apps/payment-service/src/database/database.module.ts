import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'PRISMA',
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        return new PrismaClient(url ? { datasourceUrl: url } : undefined);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['PRISMA'],
})
export class DatabaseModule {}

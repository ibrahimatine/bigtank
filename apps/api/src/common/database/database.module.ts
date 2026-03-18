import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MemoryStoreService } from '../services/memory-store.service';

const prisma = new PrismaClient();

@Global()
@Module({
  providers: [
    {
      provide: 'PRISMA',
      useValue: prisma,
    },
    MemoryStoreService,
  ],
  exports: ['PRISMA', MemoryStoreService],
})
export class DatabaseModule {}

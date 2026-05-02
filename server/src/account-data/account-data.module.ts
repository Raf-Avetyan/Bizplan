import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountDataController } from './account-data.controller';
import { AccountDataService } from './account-data.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AccountDataController],
  providers: [AccountDataService, PrismaService],
})
export class AccountDataModule {}

import { Module } from '@nestjs/common';
import { BusinessPlansService } from './company.service';
import { BusinessPlansController } from './company.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BusinessPlansController],
  providers: [BusinessPlansService, PrismaService],
  exports: [BusinessPlansService],
})
export class BusinessPlansModule { }
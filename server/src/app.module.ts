import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { BusinessPlansModule } from './company/company.module';
import { UserModule } from './user/user.module';
import { AccountDataModule } from './account-data/account-data.module';
import { ImageGenerationModule } from './image-generation/image-generation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    BusinessPlansModule,
    UserModule,
    AccountDataModule,
    ImageGenerationModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

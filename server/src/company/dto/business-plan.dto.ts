import { IsString, IsArray, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateBusinessPlanDto {
   @IsString()
   businessName: string;

   @IsString()
   place: string;

   @IsArray()
   @IsString({ each: true })
   uniqueTags: string[];

   @IsString()
   idea: string;

   @IsOptional()
   @IsBoolean()
   isActive?: boolean = true;

   @IsOptional()
   @IsObject()
   additionalData?: Record<string, any> = {};

   @IsOptional()
   @IsObject()
   financialData?: Record<string, any> = {};
}

export class UpdateBusinessPlanDto {
   @IsOptional()
   @IsString()
   businessName?: string;

   @IsOptional()
   @IsString()
   place?: string;

   @IsOptional()
   @IsArray()
   @IsString({ each: true })
   uniqueTags?: string[];

   @IsOptional()
   @IsString()
   idea?: string;

   @IsOptional()
   @IsBoolean()
   isActive?: boolean;

   @IsOptional()
   @IsObject()
   additionalData?: Record<string, any>;

   @IsOptional()
   @IsObject()
   financialData?: Record<string, any>;
}
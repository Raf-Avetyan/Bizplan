import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

type AppDataKey = 'settings' | 'aiChats' | 'toolDocuments' | 'newsCache';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

@Injectable()
export class AccountDataService {
  constructor(private readonly prisma: PrismaService) {}

  private createSuccessResponse<T>(
    data: T,
    message = 'Operation successful',
    statusCode: number = HttpStatus.OK,
  ): ApiResponse<T> {
    return { success: true, data, message, statusCode };
  }

  private createErrorResponse(
    message: string,
    error?: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ): ApiResponse {
    return { success: false, message, error, statusCode };
  }

  private async getOrCreate(userId: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      INSERT INTO "user_app_data" ("id", "userId", "updatedAt")
      VALUES (${randomUUID()}, ${userId}, NOW())
      ON CONFLICT ("userId") DO UPDATE SET "updatedAt" = "user_app_data"."updatedAt"
      RETURNING *
    `;

    return rows[0];
  }

  async getAll(userId: string): Promise<ApiResponse> {
    try {
      const data = await this.getOrCreate(userId);
      return this.createSuccessResponse(data, 'Account app data retrieved successfully');
    } catch (error) {
      return this.createErrorResponse(
        'Failed to retrieve account app data',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getValue(userId: string, key: AppDataKey): Promise<ApiResponse> {
    try {
      const data = await this.getOrCreate(userId);
      return this.createSuccessResponse(data[key] ?? this.getDefaultValue(key), `${key} retrieved successfully`);
    } catch (error) {
      return this.createErrorResponse(
        `Failed to retrieve ${key}`,
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateValue(userId: string, key: AppDataKey, value: unknown): Promise<ApiResponse> {
    try {
      await this.getOrCreate(userId);
      const data = await this.updateJsonColumn(userId, key, value);

      return this.createSuccessResponse(data[key] ?? value, `${key} saved successfully`);
    } catch (error) {
      return this.createErrorResponse(
        `Failed to save ${key}`,
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCompanyNewsCache(userId: string, companyId: string): Promise<ApiResponse> {
    try {
      const data = await this.getOrCreate(userId);
      const cache = this.toObject(data.newsCache);
      return this.createSuccessResponse(cache[companyId] ?? null, 'Company news cache retrieved successfully');
    } catch (error) {
      return this.createErrorResponse(
        'Failed to retrieve company news cache',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateCompanyNewsCache(userId: string, companyId: string, value: unknown): Promise<ApiResponse> {
    try {
      const data = await this.getOrCreate(userId);
      const nextCache = {
        ...this.toObject(data.newsCache),
        [companyId]: value,
      };

      await this.updateJsonColumn(userId, 'newsCache', nextCache);

      return this.createSuccessResponse(value, 'Company news cache saved successfully');
    } catch (error) {
      return this.createErrorResponse(
        'Failed to save company news cache',
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getDefaultValue(key: AppDataKey) {
    if (key === 'toolDocuments') return [];
    return {};
  }

  private toObject(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private async updateJsonColumn(userId: string, key: AppDataKey, value: unknown) {
    const allowedColumns: Record<AppDataKey, string> = {
      settings: 'settings',
      aiChats: 'aiChats',
      toolDocuments: 'toolDocuments',
      newsCache: 'newsCache',
    };
    const column = allowedColumns[key];
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `UPDATE "user_app_data" SET "${column}" = $1::jsonb, "updatedAt" = NOW() WHERE "userId" = $2 RETURNING *`,
      JSON.stringify(value ?? this.getDefaultValue(key)),
      userId,
    );

    return rows[0];
  }
}

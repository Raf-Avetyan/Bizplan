import { Injectable, NotFoundException, BadRequestException, ForbiddenException, HttpStatus } from '@nestjs/common';
import { BusinessPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ApiResponse<T = any> {
   success: boolean;
   data?: T;
   message?: string;
   error?: string;
   statusCode?: number;
}

@Injectable()
export class BusinessPlansService {
   constructor(private readonly prisma: PrismaService) { }

   private createSuccessResponse<T>(data: T, message?: string, statusCode: number = HttpStatus.OK): ApiResponse<T> {
      return {
         success: true,
         data,
         message: message || 'Operation successful',
         statusCode
      };
   }

   private createErrorResponse(message: string, error?: string, statusCode: number = HttpStatus.BAD_REQUEST): ApiResponse {
      return {
         success: false,
         message,
         error,
         statusCode
      };
   }

   async create(userId: string, planData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const result = await this.prisma.businessPlan.create({
            data: {
               ...planData,
               userId,
            },
         });

         return this.createSuccessResponse(result, 'Business plan created successfully', HttpStatus.CREATED);
      } catch (error) {
         return this.createErrorResponse(
            'Failed to create business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async findAll(userId: string): Promise<ApiResponse<BusinessPlan[]>> {
      try {
         const result = await this.prisma.businessPlan.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
         });

         return this.createSuccessResponse(result, 'Business plans retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to retrieve business plans',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async findOne(id: string, userId?: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const where: any = { id };

         if (userId) {
            where.userId = userId;
         }

         const plan = await this.prisma.businessPlan.findUnique({
            where,
         });

         if (!plan) {
            return this.createErrorResponse(
               'Business plan not found',
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         return this.createSuccessResponse(plan, 'Business plan retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to retrieve business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async update(id: string, userId: string, updateData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               ...updateData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Business plan updated successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to update business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async remove(id: string, userId: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const result = await this.prisma.businessPlan.delete({
            where: { id },
         });

         return this.createSuccessResponse(result, 'Business plan deleted successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to delete business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async setActive(userId: string, planId: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(planId, userId);
         if (!findResult.success) {
            return findResult;
         }

         await this.prisma.user.update({
            where: { id: userId },
            data: { activeBusinessPlanId: planId },
         });

         return this.createSuccessResponse(findResult.data!, 'Business plan set as active');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to set active business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async getActive(userId: string): Promise<ApiResponse<BusinessPlan | null>> {
      try {
         const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { activeBusinessPlanId: true },
         });

         if (!user?.activeBusinessPlanId) {
            return this.createSuccessResponse(null, 'No active business plan');
         }

         return await this.findOne(user.activeBusinessPlanId, userId);
      } catch (error) {
         return this.createErrorResponse(
            'Failed to get active business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async addFinancialData(planId: string, userId: string, financialData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(planId, userId);
         if (!findResult.success) {
            return findResult;
         }

         const updatedFinancialData = { ...financialData };
         if (financialData.revenue !== undefined && financialData.expenses !== undefined) {
            updatedFinancialData.profit = financialData.revenue - financialData.expenses;
         }

         const result = await this.prisma.businessPlan.update({
            where: { id: planId },
            data: { financialData: updatedFinancialData },
         });

         return this.createSuccessResponse(result, 'Financial data added successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to add financial data',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async search(userId: string, searchTerm: string): Promise<ApiResponse<BusinessPlan[]>> {
      try {
         const result = await this.prisma.businessPlan.findMany({
            where: {
               userId,
               OR: [
                  { businessName: { contains: searchTerm, mode: 'insensitive' } },
                  { place: { contains: searchTerm, mode: 'insensitive' } },
                  { idea: { contains: searchTerm, mode: 'insensitive' } },
               ],
            },
         });

         return this.createSuccessResponse(result, 'Search results retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to search business plans',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async getStats(userId: string): Promise<ApiResponse<any>> {
      try {
         const totalPlans = await this.prisma.businessPlan.count({
            where: { userId },
         });


         const recentPlans = await this.prisma.businessPlan.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
         });

         const stats = {
            totalPlans,
            recentPlans,
         };

         return this.createSuccessResponse(stats, 'Statistics retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to get statistics',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async getAdditionalData(id: string, userId: string): Promise<ApiResponse<any>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const additionalData = findResult.data!.additionalData || {};
         return this.createSuccessResponse(additionalData, 'Additional data retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to get additional data',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async updateAdditionalData(id: string, userId: string, additionalData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data updated successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to update additional data',
            error.message,
            HttpStatus.NOT_FOUND
         );
      }
   }

   async patchAdditionalData(id: string, userId: string, additionalData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const plan = findResult.data!;
         const currentData = plan.additionalData;

         let mergedData: any;

         if (!currentData) {
            mergedData = additionalData;
         } else if (typeof currentData === 'object' && currentData !== null) {
            mergedData = {
               ...(currentData as object),
               ...additionalData,
            };
         } else {
            mergedData = additionalData;
         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: mergedData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data patched successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to patch additional data',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async removeAdditionalDataKey(id: string, userId: string, key: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const plan = findResult.data!;
         const currentData = plan.additionalData;

         if (!currentData || typeof currentData !== 'object' || currentData === null) {
            return this.createErrorResponse(
               `Key "${key}" not found in additional data`,
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         const dataObject = currentData as Record<string, any>;

         if (dataObject[key] === undefined) {
            return this.createErrorResponse(
               `Key "${key}" not found in additional data`,
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         const { [key]: removed, ...updatedData } = dataObject;

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: updatedData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data key removed successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to remove additional data key',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async addAdditionalDataKey(id: string, userId: string, key: string, value: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const plan = findResult.data!;
         const currentData = plan.additionalData;

         let updatedData: any;

         if (!currentData || typeof currentData !== 'object' || currentData === null) {
            updatedData = { [key]: value };
         } else {
            const dataObject = currentData as Record<string, any>;

            if (dataObject[key] !== undefined) {
               return this.createErrorResponse(
                  `Key "${key}" already exists in additional data`,
                  'DUPLICATE_KEY',
                  HttpStatus.BAD_REQUEST
               );
            }

            updatedData = {
               ...dataObject,
               [key]: value,
            };

         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: updatedData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data key added successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to add additional data key',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async updateAdditionalDataKey(id: string, userId: string, key: string, value: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const plan = findResult.data!;
         const currentData = plan.additionalData;

         if (!currentData || typeof currentData !== 'object' || currentData === null) {
            return this.createErrorResponse(
               `Key "${key}" not found in additional data`,
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         const dataObject = currentData as Record<string, any>;

         if (dataObject[key] === undefined) {
            return this.createErrorResponse(
               `Key "${key}" not found in additional data`,
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         const updatedData = {
            ...dataObject,
            [key]: value,
         };

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: updatedData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data key updated successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to update additional data key',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async getAdditionalDataKeys(id: string, userId: string): Promise<ApiResponse<string[]>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return {
               success: false,
               message: findResult.message,
               error: findResult.error,
               statusCode: findResult.statusCode
            } as ApiResponse<string[]>;
         }

         const plan = findResult.data!;
         const data = plan.additionalData;

         if (!data || typeof data !== 'object' || data === null) {
            return this.createSuccessResponse([], 'Additional data keys retrieved successfully');
         }

         const keys = Object.keys(data as object);
         return this.createSuccessResponse(keys, 'Additional data keys retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to get additional data keys',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }
}
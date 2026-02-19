import { businessPlanEndpoints } from '@/api/endpoints/companies.endpoints';
import { AdditionalDataResponse, ApiResponse, Company, CompanyAdditionalDataDto, CompanyFinancialDataDto, CreateCompanyDto, UpdateCompanyDto } from '@/types/company.types';

class CompanyService {
   async create(data: CreateCompanyDto): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.create(data);
      return response.data!;
   }

   async getAll(): Promise<Company[]> {
      const response: ApiResponse<Company[]> = await businessPlanEndpoints.getAll();
      return response.data!;
   }

   async getById(id: string): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.getById(id);
      return response.data!;
   }

   async update(id: string, data: UpdateCompanyDto): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.update(id, data);
      return response.data!;
   }

   async patch(id: string, data: UpdateCompanyDto): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.patch(id, data);
      return response.data!;
   }

   async delete(id: string): Promise<void> {
      const response: ApiResponse<null> = await businessPlanEndpoints.delete(id);
      if (!response.success) {
         throw new Error(response.message || 'Failed to delete plan');
      }
   }

   async setActive(id: string): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.setActive(id);
      return response.data!;
   }

   async getActive(): Promise<Company | null> {
      try {
         const response: ApiResponse<Company> = await businessPlanEndpoints.getActive();
         return response.data!;
      } catch (error: any) {
         if (error?.status === 404 || error?.statusCode === 404) {
            return null;
         }
         throw error;
      }
   }

   async addFinancialData(id: string, financialData: CompanyFinancialDataDto): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.addFinancialData(id, financialData);
      return response.data!;
   }

   async search(searchTerm: string): Promise<Company[]> {
      const response: ApiResponse<Company[]> = await businessPlanEndpoints.search(searchTerm);
      return response.data!;
   }

   async getStats(): Promise<{ totalPlans: number; recentPlans: Company[] }> {
      const response: ApiResponse<any> = await businessPlanEndpoints.getStats();
      return response.data!;
   }

   async getByIdOrNull(id: string): Promise<Company | null> {
      try {
         return await this.getById(id);
      } catch {
         return null;
      }
   }

   async exists(id: string): Promise<boolean> {
      try {
         await this.getById(id);
         return true;
      } catch {
         return false;
      }
   }

   async getAdditionalData(id: string): Promise<AdditionalDataResponse> {
      const response: ApiResponse<AdditionalDataResponse> = await businessPlanEndpoints.getAdditionalData(id);
      return response.data! || {};
   }

   async updateAdditionalData(id: string, data: AdditionalDataResponse): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.updateAdditionalData(id, data);
      return response.data!;
   }

   async patchAdditionalData(id: string, data: AdditionalDataResponse): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.patchAdditionalData(id, data);
      return response.data!;
   }

   async removeAdditionalDataKey(id: string, key: string): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.removeAdditionalDataKey(id, key);
      return response.data!;
   }

   async addAdditionalDataKey(id: string, key: string, value: any): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.addAdditionalDataKey(id, key, value);
      return response.data!;
   }

   async updateAdditionalDataKey(id: string, key: string, value: any): Promise<Company> {
      const response: ApiResponse<Company> = await businessPlanEndpoints.updateAdditionalDataKey(id, key, value);
      return response.data!;
   }

   async getAdditionalDataKeys(id: string): Promise<string[]> {
      const response: ApiResponse<string[]> = await businessPlanEndpoints.getAdditionalDataKeys(id);
      return response.data! || [];
   }

   async getAdditionalDataValue(id: string, key: string): Promise<any | null> {
      try {
         const allData = await this.getAdditionalData(id);
         return allData[key] || null;
      } catch {
         return null;
      }
   }

   async hasAdditionalDataKey(id: string, key: string): Promise<boolean> {
      try {
         const keys = await this.getAdditionalDataKeys(id);
         return keys.includes(key);
      } catch {
         return false;
      }
   }

   async setAdditionalDataValue(id: string, key: string, value: any): Promise<Company> {
      try {
         return await this.updateAdditionalDataKey(id, key, value);
      } catch (error: any) {
         if (error?.status === 404 || error?.statusCode === 404) {
            return await this.addAdditionalDataKey(id, key, value);
         }
         throw error;
      }
   }

   async mergeAdditionalData(id: string, data: CompanyAdditionalDataDto): Promise<Company> {
      const currentData = await this.getAdditionalData(id);
      const mergedData = {
         ...currentData,
         ...data,
      };
      return await this.updateAdditionalData(id, mergedData);
   }

   async bulkUpdateAdditionalData(id: string, updates: Array<{ key: string; value: any }>): Promise<Company> {
      const currentData = await this.getAdditionalData(id);
      const updatedData = { ...currentData };

      for (const { key, value } of updates) {
         updatedData[key] = value;
      }

      return await this.updateAdditionalData(id, updatedData);
   }

   async clearAdditionalData(id: string): Promise<Company> {
      return await this.updateAdditionalData(id, {});
   }

   async getAdditionalDataOrCreate(id: string, defaultData: AdditionalDataResponse = {}): Promise<AdditionalDataResponse> {
      try {
         return await this.getAdditionalData(id);
      } catch (error: any) {
         if (error?.status === 404 || error?.statusCode === 404) {
            await this.updateAdditionalData(id, defaultData);
            return defaultData;
         }
         throw error;
      }
   }

   async saveBusinessPlanData(id: string, businessPlanData: any): Promise<Company> {
      return await this.setAdditionalDataValue(id, 'business_plan', businessPlanData);
   }

   async getBusinessPlanData(id: string): Promise<any | null> {
      try {
         const additionalData = await this.getAdditionalData(id);
         return additionalData?.business_plan || null;
      } catch {
         return null;
      }
   }
}

export const companyService = new CompanyService();
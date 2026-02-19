import { ApiResponse, Company, CompanyFinancialDataDto, CreateCompanyDto } from '@/types/company.types';
import axiosClient from '../axios-client';

export const businessPlanEndpoints = {
   create: (data: CreateCompanyDto) =>
      axiosClient.post('/company', data),

   getAll: () =>
      axiosClient.get('/company'),

   getById: (id: string) =>
      axiosClient.get(`/company/${id}`),

   update: (id: string, data: Partial<Company>) =>
      axiosClient.put(`/company/${id}`, data),

   patch: (id: string, data: Partial<Company>) =>
      axiosClient.patch(`/company/${id}`, data),

   delete: (id: string) =>
      axiosClient.delete(`company/${id}`),

   setActive: (id: string) =>
      axiosClient.put(`/company/${id}/activate`, {}),

   getActive: () =>
      axiosClient.get('/company/active/current'),

   addFinancialData: (id: string, financialData: CompanyFinancialDataDto) =>
      axiosClient.put(`/company/${id}/financial-data`, financialData),

   search: (searchTerm: string) =>
      axiosClient.get(`/company/search?q=${encodeURIComponent(searchTerm)}`),

   getStats: () =>
      axiosClient.get('/company/stats/overview'),

   getAdditionalData: (id: string): Promise<ApiResponse<any>> =>
      axiosClient.get(`/company/${id}/additional-data`),

   updateAdditionalData: (id: string, data: any): Promise<ApiResponse<Company>> =>
      axiosClient.put(`/company/${id}/additional-data`, data),

   patchAdditionalData: (id: string, data: any): Promise<ApiResponse<Company>> =>
      axiosClient.patch(`/company/${id}/additional-data`, data),

   removeAdditionalDataKey: (id: string, key: string): Promise<ApiResponse<Company>> =>
      axiosClient.delete(`company/${id}/additional-data/${key}`),

   addAdditionalDataKey: (id: string, key: string, value: any): Promise<ApiResponse<Company>> =>
      axiosClient.post(`/company/${id}/additional-data/${key}`, { value }),

   updateAdditionalDataKey: (id: string, key: string, value: any): Promise<ApiResponse<Company>> =>
      axiosClient.put(`/company/${id}/additional-data/${key}`, { value }),

   getAdditionalDataKeys: (id: string): Promise<ApiResponse<string[]>> =>
      axiosClient.get(`/company/${id}/additional-data/keys`),
};
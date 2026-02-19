import { BusinessPlanTemplate } from './business-plan.types';

export type Company = {
   id: string;
   userId: string;
   businessName: string;
   place: string;
   uniqueTags: string[];
   idea: string;
   additionalData?: CompanyAdditionalDataDto;
   financialData?: CompanyFinancialDataDto;
}

export type CreateCompanyDto = {
   businessName: string;
   place: string;
   uniqueTags: string[];
   idea: string;
   additionalData?: CompanyAdditionalDataDto;
   financialData?: CompanyFinancialDataDto;
}

export type UpdateCompanyDto = {
   businessName?: string;
   place?: string;
   uniqueTags?: string[];
   idea?: string;
   additionalData?: CompanyAdditionalDataDto;
   financialData?: CompanyFinancialDataDto;
}

export type CompanyFinancialDataDto = {
   revenue?: number;
   expenses?: number;
   profit?: number;
   customers?: number;
   [key: string]: any;
}

export type CompanyAdditionalDataDto = {
   business_plan: BusinessPlanTemplate
}

export type ApiResponse<T = any> = {
   success?: boolean;
   data?: T;
   message?: string;
   error?: string;
}

export type AdditionalDataResponse = {
   [key: string]: any;
}

export type AddDataKeyDto = {
   value: any;
}

export type UpdateDataKeyDto = {
   value: any;
}
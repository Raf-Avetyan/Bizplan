import { BusinessPlanTemplate } from './business-plan.types';

export type SupportedPlanLanguage = 'en' | 'ru' | 'hy';

export type BusinessPlanGenerationState = 'idle' | 'generating' | 'ready' | 'failed';

export type BusinessPlanGenerationStatus = {
   status: BusinessPlanGenerationState;
   language?: SupportedPlanLanguage;
   startedAt?: string;
   finishedAt?: string;
   error?: string | null;
};

export type Company = {
   id: string;
   userId: string;
   businessName: string;
   place: string;
   uniqueTags: string[];
   idea: string;
   additionalData?: CompanyAdditionalDataDto;
   financialData?: CompanyFinancialDataDto;
   createdAt: string,
   updatedAt: string,
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
   startupCost?: number;
   monthlyRevenue?: number;
   monthlyCost?: number;
   fundingNeeded?: number;
   revenue?: number;
   expenses?: number;
   profit?: number;
   customers?: number;
   [key: string]: any;
}

export type CompanyAdditionalDataDto = {
   business_plan?: BusinessPlanTemplate;
   business_plan_translations?: Partial<Record<SupportedPlanLanguage, BusinessPlanTemplate>>;
   business_plan_generation?: BusinessPlanGenerationStatus;
   [key: string]: any;
}

export type ApiResponse<T = any> = {
   success?: boolean;
   data?: T;
   message?: string;
   error?: string;
   status?: number;
   statusCode?: number;
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

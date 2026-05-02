import { accountDataEndpoints } from "@/api/endpoints/account-data.endpoints";
import { ApiResponse } from "@/types/company.types";

class AccountDataService {
  private unwrap<T>(response: ApiResponse<T>, fallback: T): T {
    if (response?.success && response.data !== undefined && response.data !== null) {
      return response.data;
    }

    return fallback;
  }

  async getSettings<T>(fallback: T): Promise<T> {
    const response: ApiResponse<T> = await accountDataEndpoints.getSettings();
    return this.unwrap(response, fallback);
  }

  async updateSettings<T>(settings: T): Promise<T> {
    const response: ApiResponse<T> = await accountDataEndpoints.updateSettings(settings);
    return this.unwrap(response, settings);
  }

  async getAiChats<T>(fallback: T): Promise<T> {
    const response: ApiResponse<T> = await accountDataEndpoints.getAiChats();
    return this.unwrap(response, fallback);
  }

  async updateAiChats<T>(aiChats: T): Promise<T> {
    const response: ApiResponse<T> = await accountDataEndpoints.updateAiChats(aiChats);
    return this.unwrap(response, aiChats);
  }

  async getToolDocuments<T>(fallback: T): Promise<T> {
    const response: ApiResponse<T> = await accountDataEndpoints.getToolDocuments();
    return this.unwrap(response, fallback);
  }

  async updateToolDocuments<T extends unknown[]>(toolDocuments: T): Promise<T> {
    const response: ApiResponse<T> = await accountDataEndpoints.updateToolDocuments(toolDocuments);
    return this.unwrap(response, toolDocuments);
  }

  async getCompanyNewsCache<T>(companyId: string, fallback: T): Promise<T> {
    const response: ApiResponse<T> = await accountDataEndpoints.getCompanyNewsCache(companyId);
    return this.unwrap(response, fallback);
  }

  async updateCompanyNewsCache<T>(companyId: string, newsCache: T): Promise<T> {
    const response: ApiResponse<T> = await accountDataEndpoints.updateCompanyNewsCache(companyId, newsCache);
    return this.unwrap(response, newsCache);
  }
}

export const accountDataService = new AccountDataService();

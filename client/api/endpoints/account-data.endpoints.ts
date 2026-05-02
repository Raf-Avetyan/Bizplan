import axiosClient from "../axios-client";

export const accountDataEndpoints = {
  getSettings: () => axiosClient.get("/account-data/settings"),
  updateSettings: (settings: unknown) => axiosClient.put("/account-data/settings", settings),

  getAiChats: () => axiosClient.get("/account-data/ai-chats"),
  updateAiChats: (aiChats: unknown) => axiosClient.put("/account-data/ai-chats", aiChats),

  getToolDocuments: () => axiosClient.get("/account-data/tool-documents"),
  updateToolDocuments: (toolDocuments: unknown[]) =>
    axiosClient.put("/account-data/tool-documents", toolDocuments),

  getCompanyNewsCache: (companyId: string) =>
    axiosClient.get(`/account-data/news-cache/${encodeURIComponent(companyId)}`),
  updateCompanyNewsCache: (companyId: string, newsCache: unknown) =>
    axiosClient.put(`/account-data/news-cache/${encodeURIComponent(companyId)}`, newsCache),
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import { accountDataService } from "@/services/account-data.service";

export type ToolDocumentType =
  | "marketing-strategy"
  | "facebook-post"
  | "instagram-post"
  | "product-sales-sheet"
  | "sales-follow-up-email";

export type ToolDocument = {
  id: string;
  title: string;
  type: ToolDocumentType;
  companyId: string | null;
  companyName: string | null;
  prompt: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "bizplan-mobile-tool-documents";

async function readDocuments() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const localDocuments = raw ? (JSON.parse(raw) as ToolDocument[]) : [];
    const remoteDocuments = await accountDataService.getToolDocuments<ToolDocument[]>([]);
    const parsed = Array.isArray(remoteDocuments) && remoteDocuments.length > 0
      ? remoteDocuments
      : Array.isArray(localDocuments)
        ? localDocuments
        : [];

    if (remoteDocuments.length === 0 && parsed.length > 0) {
      await accountDataService.updateToolDocuments(parsed);
    }

    return parsed.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  } catch {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ToolDocument[]) : [];
      return Array.isArray(parsed)
        ? parsed.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        : [];
    } catch {
      return [];
    }
  }
}

async function writeDocuments(documents: ToolDocument[]) {
  try {
    await accountDataService.updateToolDocuments(documents);
  } catch {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }
}

export async function getToolDocuments(type?: ToolDocumentType, companyId?: string | null) {
  const documents = await readDocuments();
  return documents.filter((document) => {
    if (type && document.type !== type) return false;
    if (companyId !== undefined && document.companyId !== companyId) return false;
    return true;
  });
}

export async function saveToolDocument(
  document: Omit<ToolDocument, "id" | "createdAt" | "updatedAt">,
) {
  const documents = await readDocuments();
  const now = new Date().toISOString();

  const nextDocument: ToolDocument = {
    ...document,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };

  const nextDocuments = [nextDocument, ...documents];
  await writeDocuments(nextDocuments);
  return nextDocument;
}

export async function deleteToolDocument(id: string) {
  const documents = await readDocuments();
  await writeDocuments(documents.filter((document) => document.id !== id));
}

export async function getToolDocumentCounts() {
  const documents = await readDocuments();

  return documents.reduce<Record<ToolDocumentType, number>>(
    (acc, document) => {
      acc[document.type] = (acc[document.type] ?? 0) + 1;
      return acc;
    },
    {
      "marketing-strategy": 0,
      "facebook-post": 0,
      "instagram-post": 0,
      "product-sales-sheet": 0,
      "sales-follow-up-email": 0,
    },
  );
}

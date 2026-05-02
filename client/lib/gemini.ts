import { GoogleGenAI } from "@google/genai";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosClient from "@/api/axios-client";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GOOGLEAI_API_KEY?.trim();
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_IMAGE_MODEL = process.env.EXPO_PUBLIC_GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";

let geminiClient: GoogleGenAI | null = null;

export const getGeminiApiKey = () => GEMINI_API_KEY;
export const hasGeminiKey = () => Boolean(GEMINI_API_KEY);

export const getGeminiClient = () => {
  if (!GEMINI_API_KEY) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  return geminiClient;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType?: string;
          mime_type?: string;
          data?: string;
        };
        inline_data?: {
          mimeType?: string;
          mime_type?: string;
          data?: string;
        };
      }>;
    };
    groundingMetadata?: {
      webSearchQueries?: string[];
      groundingChunks?: Array<{
        web?: {
          uri?: string;
          title?: string;
        };
      }>;
      searchEntryPoint?: {
        renderedContent?: string;
      };
    };
  }>;
};

type GeminiErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<Record<string, unknown>>;
  };
};

export type WebSearchResult = {
  answer: string;
  queries: string[];
  sources: Array<{
    title: string;
    url: string;
  }>;
  searchEntryHtml?: string;
};

export type GeminiChatMessage = {
  role: "user" | "model";
  text: string;
};

function extractJsonBlock(raw: string) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("AI response did not contain valid JSON.");
}

function getRetryDelay(details?: Array<Record<string, unknown>>) {
  for (const detail of details ?? []) {
    const retryDelay = detail.retryDelay;
    if (typeof retryDelay === "string" && retryDelay.trim()) {
      return retryDelay.trim();
    }
  }

  return null;
}

function formatRetryDelay(retryDelay: string | null) {
  if (!retryDelay) return "a moment";

  const seconds = Number(retryDelay.replace(/s$/, ""));
  if (!Number.isFinite(seconds)) return retryDelay;
  if (seconds < 60) return `about ${Math.ceil(seconds)} seconds`;

  return `about ${Math.ceil(seconds / 60)} minutes`;
}

async function getGeminiErrorMessage(response: Response, fallback: string) {
  const text = await response.text();
  let payload: GeminiErrorResponse | null = null;

  try {
    payload = JSON.parse(text) as GeminiErrorResponse;
  } catch {
    payload = null;
  }

  const error = payload?.error;
  const retryDelay = getRetryDelay(error?.details);

  if (response.status === 429 || error?.status === "RESOURCE_EXHAUSTED") {
    return `Gemini quota reached. Please wait ${formatRetryDelay(retryDelay)} and try again.`;
  }

  const firstLine = error?.message?.split("\n")[0]?.trim();
  return firstLine || text || fallback;
}

export async function generateJson<T>(prompt: string): Promise<T> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Google AI API key.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await getGeminiErrorMessage(response, "Google AI request failed."));
  }

  const payload = (await response.json()) as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

  if (!text.trim()) {
    throw new Error("Google AI returned an empty response.");
  }

  return JSON.parse(extractJsonBlock(text)) as T;
}

export async function searchWebWithGemini(query: string): Promise<WebSearchResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Google AI API key.");
  }

  const cleanQuery = query.trim();
  if (!cleanQuery) {
    throw new Error("Enter something to search.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Search the web for this request and answer like a compact research browser result.

Request: ${cleanQuery}

Rules:
- Prioritize recent and relevant sources when the request asks for news or current information.
- Give a readable summary first.
- Include practical details the user can act on.
- Do not invent URLs or citations.`,
              },
            ],
          },
        ],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await getGeminiErrorMessage(response, "Google Search request failed."));
  }

  const payload = (await response.json()) as GeminiResponse;
  const candidate = payload.candidates?.[0];
  const answer = candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

  if (!answer.trim()) {
    throw new Error("Search returned an empty response.");
  }

  const sourceMap = new Map<string, { title: string; url: string }>();
  for (const chunk of candidate?.groundingMetadata?.groundingChunks ?? []) {
    const url = chunk.web?.uri?.trim();
    if (!url) continue;

    let fallbackTitle = "Source";
    try {
      fallbackTitle = new URL(url).hostname;
    } catch {
      fallbackTitle = url;
    }

    sourceMap.set(url, {
      url,
      title: chunk.web?.title?.trim() || fallbackTitle,
    });
  }

  return {
    answer,
    queries: candidate?.groundingMetadata?.webSearchQueries ?? [cleanQuery],
    sources: Array.from(sourceMap.values()),
    searchEntryHtml: candidate?.groundingMetadata?.searchEntryPoint?.renderedContent,
  };
}

export async function sendChatMessageWithGemini(
  history: GeminiChatMessage[],
  message: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Google AI API key.");
  }

  const cleanMessage = message.trim();
  if (!cleanMessage) {
    throw new Error("Enter a message first.");
  }

  const contents = [
    ...history.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.text }],
    })),
    {
      role: "user" as const,
      parts: [{ text: cleanMessage }],
    },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.5,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await getGeminiErrorMessage(response, "Google AI request failed."));
  }

  const payload = (await response.json()) as GeminiResponse;
  const text =
    payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

  if (!text.trim()) {
    throw new Error("Google AI returned an empty response.");
  }

  return text.trim();
}

export async function generateImageWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Google AI API key.");
  }

  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    throw new Error("Image prompt is empty.");
  }

  const client = getGeminiClient();

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: cleanPrompt,
      });

      const imagePart = (response.candidates?.[0]?.content?.parts as any[] | undefined)?.find(
        (part) => part.inlineData?.data || part.inline_data?.data,
      );
      const inlineImage = imagePart?.inlineData ?? imagePart?.inline_data;

      if (inlineImage?.data) {
        return await persistGeneratedImage(
          inlineImage.data,
          inlineImage.mimeType || inlineImage.mime_type || "image/png",
        );
      }
    } catch {
      // Fall back to REST below if the SDK path does not return an image.
    }
  }

  const attempts = [
    {
      contents: [
        {
          role: "user",
          parts: [{ text: cleanPrompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    },
    {
      contents: [
        {
          parts: [{ text: cleanPrompt }],
        },
      ],
    },
  ];

  for (const body of attempts) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const message = await getGeminiErrorMessage(response, "Google image generation failed.");
      if (message.toLowerCase().includes("quota")) {
        throw new Error(message);
      }
      continue;
    }

    const payload = (await response.json()) as GeminiResponse;
    const imagePart = payload.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .find((part) => part.inlineData?.data || part.inline_data?.data);

    const inlineImage = imagePart?.inlineData ?? imagePart?.inline_data;

    if (inlineImage?.data) {
      return await persistGeneratedImage(
        inlineImage.data,
        inlineImage.mimeType || inlineImage.mime_type || "image/png",
      );
    }
  }

  throw new Error("Google AI returned no image.");
}

async function persistGeneratedImage(base64Image: string, mimeType: string) {
  const extension = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
  const directory = `${FileSystem.cacheDirectory ?? ""}generated-social-posts/`;

  if (!directory.startsWith("file:")) {
    return `data:${mimeType};base64,${base64Image}`;
  }

  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const fileUri = `${directory}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  await FileSystem.writeAsStringAsync(fileUri, base64Image, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

type ServerImageResponse = {
  url?: string;
  base64?: string;
  mimeType?: string;
};

function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";
}

function getApiRootUrl() {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/\/api$/i, "");
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const payload = error as { message?: unknown; error?: unknown; statusCode?: unknown };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
    if (Array.isArray(payload.message) && payload.message.length) {
      return payload.message.join(" ");
    }
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.statusCode === "number") {
      return `${fallback} (${payload.statusCode})`;
    }
  }

  return fallback;
}

async function readServerImageError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text.trim()) {
    return `Image server failed with ${response.status}.`;
  }

  try {
    const payload = JSON.parse(text) as { message?: unknown; error?: unknown };
    return getRequestErrorMessage(payload, text);
  } catch {
    return text;
  }
}

async function postImageGenerationWithoutApiPrefix(prompt: string) {
  const rootUrl = getApiRootUrl();
  if (!rootUrl || rootUrl === getApiBaseUrl()) {
    throw new Error("Image server route is missing. Restart the backend so /api/image-generation is registered.");
  }

  const token = await AsyncStorage.getItem("auth_token");
  const response = await fetch(`${rootUrl}/image-generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(await readServerImageError(response));
  }

  return (await response.json()) as ServerImageResponse;
}

export async function generateImageWithServer(prompt: string): Promise<string> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    throw new Error("Image prompt is empty.");
  }

  let payload: ServerImageResponse;

  try {
    payload = await axiosClient.post<ServerImageResponse, ServerImageResponse>("/image-generation", {
      prompt: cleanPrompt,
    });
  } catch (error) {
    const message = getRequestErrorMessage(error, "Image server request failed.");
    const canTryWithoutApiPrefix = /cannot\s+post|not\s+found|404/i.test(message);

    if (!canTryWithoutApiPrefix) {
      throw new Error(message);
    }

    try {
      payload = await postImageGenerationWithoutApiPrefix(cleanPrompt);
    } catch (fallbackError) {
      const fallbackMessage = getRequestErrorMessage(fallbackError, "Image server request failed.");
      throw new Error(`${message}. Also tried without /api prefix: ${fallbackMessage}`);
    }
  }

  if (payload.url) {
    return payload.url;
  }

  if (payload.base64) {
    return await persistGeneratedImage(payload.base64, payload.mimeType || "image/png");
  }

  throw new Error("Image server returned no image.");
}


import { Message } from "@/app/(tabs)/chat";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDuVCs_kbbaAeAo8kHr4OGBOVIvnnlRxAk",
});

export const useAiChat = ({ history }: { history: Message[] }) => {
  const chat = ai.chats.create({
    model: "gemini-2.0-flash",
    history: history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
  });

  return chat;
};

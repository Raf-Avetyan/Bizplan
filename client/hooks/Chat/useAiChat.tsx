import { useMemo } from "react";
import { Message } from "@/components/chat/types";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyAM7yXm1NCYgmeLaWpJS30OiZN7Ey6fn64",
});

export const useAiChat = ({ history }: { history: Message[] }) => {
  return useMemo(() => {
    try {
      const historyArray = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: historyArray,
      });

      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      return {
        sendMessage: async (message: any) => ({
          text: 'AI chat is currently unavailable. Please check your internet connection and try again later.'
        }),
        sendMessageStream: async function* () {
          yield { text: 'AI chat is currently unavailable. Please check your internet connection and try again later.' };
        }
      };
    }
  }, [JSON.stringify(history)]);
};

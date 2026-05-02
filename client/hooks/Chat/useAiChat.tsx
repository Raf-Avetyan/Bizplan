import { useMemo } from "react";
import { Message } from "@/components/chat/types";
import { getGeminiClient } from "@/lib/gemini";

export const useAiChat = ({ history }: { history: Message[] }) => {
  return useMemo(() => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("Missing EXPO_PUBLIC_GOOGLEAI_API_KEY");
      }

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
          text: 'AI chat is currently unavailable. Please check your Gemini API key and internet connection, then try again later.'
        }),
        sendMessageStream: async function* () {
          yield { text: 'AI chat is currently unavailable. Please check your Gemini API key and internet connection, then try again later.' };
        }
      };
    }
  }, [JSON.stringify(history)]);
};

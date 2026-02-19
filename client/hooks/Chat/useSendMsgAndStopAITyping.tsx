import { Message } from "@/components/chat/types";
import { Chat } from "@google/genai";
import { useState } from "react";

type useSendMsgAndStopAITypingProps = {
  text: string;
  chat: Chat | { sendMessage: (message: any) => Promise<{ text: string }>; sendMessageStream: () => AsyncGenerator<{ text: string }> };
  setText: (text: string) => void;
  setIsLoadingMsg: (isLoadingMsg: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsAITyping: (isAITyping: boolean) => void;
  isLoadingMsg: boolean;
  isAITyping: boolean;
};
export const useSendMsgAndStopAITyping = ({
  text,
  chat,
  setText,
  setIsLoadingMsg,
  setMessages,
  setHistory,
  setIsAITyping,
  isLoadingMsg,
  isAITyping,
}: useSendMsgAndStopAITypingProps) => {
  const [typingInterval, setTypingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  const sendMessage = async () => {
    if (!text.trim()) return;
    setIsLoadingMsg(true);

    const newUserMessage: Message = { role: "user", text };
    setMessages((prev) => [...prev, newUserMessage]);
    setHistory((prev) => [...prev, newUserMessage]);
    setText("");

    try {
      setIsAITyping(true);

      // Check if chat object has the sendMessage method
      if (!chat || typeof chat.sendMessage !== 'function') {
        throw new Error('AI chat service is not available');
      }

      const apiResponse = await chat.sendMessage({
        message: text,
      });

      if (apiResponse && apiResponse.text) {
        const aiText = apiResponse.text;
        const aiMessage: Message = { role: "model", text: aiText };
        const words = aiText.split(" ");
        let currentText = "";
        let index = 0;

        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "model", text: "" },
        ]);
        setHistory((prev) => [...prev, aiMessage]);

        const interval = setInterval(() => {
          if (index < words.length) {
            currentText += (index === 0 ? "" : " ") + words[index];
            index++;

            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              updatedMessages[updatedMessages.length - 1] = {
                role: "model",
                text: currentText,
              };
              return updatedMessages;
            });
          } else {
            clearInterval(interval);
            setIsAITyping(false);
          }
        }, 100);

        setTypingInterval(interval);
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Fallback: Add error message to chat
      const errorMessage: Message = {
        role: "model",
        text: "Sorry, I'm having trouble connecting right now. Please check your internet connection and try again."
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      setHistory((prev) => [...prev, errorMessage]);
      setIsAITyping(false);
    } finally {
      setIsLoadingMsg(false);
    }
  };

  const sendMessageOrStopAITyping = () => {
    if (typingInterval && !isLoadingMsg) {
      clearInterval(typingInterval);
      setIsAITyping(false);
    }
    if (!isAITyping) {
      sendMessage();
    }
  };

  return { sendMessageOrStopAITyping };
};

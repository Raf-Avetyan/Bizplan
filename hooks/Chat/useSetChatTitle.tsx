import { useEffect } from "react";

export const useSetChatTitle = ({
  isLoading,
  setTitle,
}: {
  isLoading: boolean;
  setTitle: (title: string) => void;
}) => {
  useEffect(() => {
    if (!isLoading) {
      const fullText = "What can I help with?";
      let index = 0;
      let currentText = "";

      const interval = setInterval(() => {
        if (index < fullText.length) {
          currentText += fullText[index];
          index++;

          setTitle(currentText);
        } else {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isLoading]);
};

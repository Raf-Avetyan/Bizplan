import { ScrollView } from "react-native";

type Message = {
  role: "user" | "model";
  text: string;
};

type MessageBubbleProps = {
  message: Message;
  index: number;
  setSelectedMessage: (message: { id: number; x: number; y: number }) => void;
  scrollViewRef: React.RefObject<ScrollView & { contentOffset: { y: number } }>;
};

type MessageDropdownMenuProps = {
  selectedMessage: {
    id: number;
    x: number;
    y: number;
  };
  messages: Message[];
  setSelectedMessage: React.Dispatch<
    React.SetStateAction<{
      id: number;
      x: number;
      y: number;
    } | null>
  >;
};

type ChatInputProps = {
  text: string;
  setText: (text: string) => void;
  sendMessageOrStopAITyping: () => void;
  isAITyping: boolean;
  keyboardHeight: number;
};

export {
  Message,
  MessageBubbleProps,
  MessageDropdownMenuProps,
  ChatInputProps,
};

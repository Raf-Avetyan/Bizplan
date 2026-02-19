import { cn } from "@/lib/utils";
import {
  ImageBackground,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatInputProps } from "./types";
import { CircleStop } from "lucide-react-native";
import { SendHorizontal } from "lucide-react-native";
import { MotiView } from "moti";

export const ChatInput = ({
  text,
  setText,
  sendMessageOrStopAITyping,
  isAITyping,
  keyboardHeight,
}: ChatInputProps) => {
  return (
    <MotiView
      className="flex flex-row justify-center mx-[10px] px-3 absolute"
      from={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
        bottom: keyboardHeight > 0 ? keyboardHeight + 80 : 100,
        scaleX: 1,
      }}
      transition={{
        type: "timing",
        duration: 500,
      }}
      style={{
        minHeight: 50,
      }}
    >
      <View
        className={cn(
          "flex gap-2 flex-row items-center rounded-[24px]  px-5 w-full border-[.5px] border-white/20"
        )}
        style={{
          backgroundColor: "rgba(77, 47, 178, .9)",
        }}
      >
        <TextInput
          multiline
          numberOfLines={3}
          placeholder="Enter a message..."
          value={text}
          className="text-white placeholder:text-white/50 flex-1 pb-1"
          onChangeText={(newText) => setText(newText)}
        />
        <TouchableOpacity onPress={sendMessageOrStopAITyping}>
          {isAITyping ? (
            <CircleStop size={28} strokeWidth={1.5} color="whitesmoke" />
          ) : (
            <SendHorizontal size={28} strokeWidth={1.5} color="whitesmoke" />
          )}
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

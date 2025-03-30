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
    <ImageBackground
      source={require("../../assets/images/mainbg.jpg")}
      resizeMode="cover"
      className="min-h-[50px]"
    >
      <MotiView
        className="flex flex-row justify-center w-full px-3 absolute"
        from={{
          opacity: 0,
          bottom: 0,
        }}
        animate={{
          opacity: 1,
          bottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20,
          scaleX: 1,
        }}
        transition={{
          type: "timing",
          duration: 300,
        }}
        style={{
          bottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20,
          minHeight: 50,
        }}
      >
        <View
          className={cn(
            "flex gap-2 flex-row items-center rounded-[24px]  px-5 w-full border border-white/10"
          )}
          style={{
            backgroundColor: "#002958",
          }}
        >
          <TextInput
            multiline
            numberOfLines={3}
            placeholder="Enter a message..."
            value={text}
            className="text-white placeholder:text-white/50 flex-1"
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
    </ImageBackground>
  );
};

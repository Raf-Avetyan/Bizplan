import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { cn } from "@/lib/utils";
import { MessageBubbleProps } from "@/components/chat/types";

const MessageBubble = ({
  message,
  index,
  setSelectedMessage,
  scrollViewRef,
}: MessageBubbleProps) => {
  const screenWidth = Dimensions.get("window").width;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      key={index}
      onLongPress={(event) => {
        const { pageX, pageY } = event.nativeEvent;

        const scrollOffsetY = scrollViewRef.current?.contentOffset?.y ?? 0;

        setSelectedMessage({
          id: index,
          x: Math.min(pageX, screenWidth - 200),
          y: pageY + scrollOffsetY,
        });
      }}
      style={{ backgroundColor: "rgba(77, 47, 178, .97)" }}
      className={cn(
        "border border-white/5 rounded-[20px] mb-[15px] max-w-[90%] overflow-hidden",
        {
          "self-end rounded-br-[8px] mr-3": message.role === "user",
          "self-start rounded-bl-[8px] ml-3": message.role === "model",
        }
      )}
    >
      <View className="px-5 py-3">
        <Text className="text-white">{message.text}</Text>
      </View>
    </TouchableOpacity>
  );
};
export default MessageBubble;

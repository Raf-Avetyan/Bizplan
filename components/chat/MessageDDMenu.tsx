import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Copy } from "lucide-react-native";
import { MessageDropdownMenuProps } from "./types";

export const MessageDropdownMenu = ({
  selectedMessage,
  messages,
  setSelectedMessage,
}: MessageDropdownMenuProps) => {
  const screenWidth = Dimensions.get("window").width;

  const copyToClipboard = (content: string) => {
    Clipboard.setStringAsync(content);
    setSelectedMessage(null);
  };

  return (
    <View
      className="border border-white/10 flex gap-4"
      style={{
        position: "absolute",
        top: selectedMessage.y - 60,
        left:
          selectedMessage.x > screenWidth - 150
            ? screenWidth - 150
            : selectedMessage.x,
        backgroundColor: "#002958",
        padding: 10,
        minWidth: 150,
        borderRadius: 8,
        zIndex: 1000,
      }}
    >
      <TouchableOpacity
        onPress={() => copyToClipboard(messages[selectedMessage.id].text)}
        className="flex flex-row items-center gap-3"
      >
        <Copy size={25} color="#fff" />
        <Text className="text-white font-Gabarito">Copy</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => copyToClipboard(messages[selectedMessage.id].text)}
        className="flex flex-row items-center gap-3"
      >
        <Copy size={25} color="#fff" />
        <Text className="text-white font-Gabarito">Copy</Text>
      </TouchableOpacity>
    </View>
  );
};

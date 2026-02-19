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
      className="border border-white/10 flex gap-[2px] p-[2px]"
      style={{
        position: "absolute",
        top: selectedMessage.y - 60,
        left:
          selectedMessage.x > screenWidth - 150
            ? screenWidth - 150
            : selectedMessage.x,
        backgroundColor: "whitesmoke",
        minWidth: 120,
        borderRadius: 8,
        zIndex: 1000,
      }}
    >
      <TouchableOpacity
        onPress={() => copyToClipboard(messages[selectedMessage.id].text)}
        className="flex flex-row items-center gap-3 p-[6px] rounded-[8px]"
        style={{ backgroundColor: "rgba(77, 47, 178, .97)" }}
      >
        <Copy size={25} color="#fff" />
        <Text className="text-white font-Gabarito font-bold text-[15px]">Copy</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => copyToClipboard(messages[selectedMessage.id].text)}
        className="flex flex-row items-center gap-3 bg-red-300 p-[6px] rounded-[8px]"
        style={{ backgroundColor: "rgba(77, 47, 178, .97)" }}
      >
        <Copy size={25} color="#fff" />
        <Text className="text-white font-Gabarito font-bold text-[15px]">Copy</Text>
      </TouchableOpacity>
    </View>
  );
};

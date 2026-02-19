// React
import React, { useCallback, useEffect, useRef, useState } from "react";

// React Native
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Link } from "expo-router";

// Types
import { Message } from "@/components/chat/types";

// Hooks
import { useKeyboardHeight } from "@/hooks/useIsKeyboardHeight";
import { useAiChat } from "@/hooks/Chat/useAiChat";
import { useSendMsgAndStopAITyping } from "@/hooks/Chat/useSendMsgAndStopAITyping";
import { useSetChatTitle } from "@/hooks/Chat/useSetChatTitle";

// Lucide Icons
import { ArrowLeft, Copy, EllipsisVertical } from "lucide-react-native";

// Components
import MessageBubble from "@/components/chat/MessageBubble";
import { MessageDropdownMenu } from "@/components/chat/MessageDDMenu";
import { useIsKeyboardVisible } from "@/hooks/useIsKeyboardVisible";
import { ChatInput } from "@/components/chat/ChatInput";
import { LinearGradient } from 'expo-linear-gradient';


export default function ChatScreen() {
  // States and refs
  const scrollViewRef = useRef<
    (ScrollView & { contentOffset: { y: number } }) | null
  >(null);

  // Keyboard height and animated style
  const keyboardHeight = useKeyboardHeight();

  // Use a simpler approach - avoid animated keyboard if it causes issues
  const keyboardAnimatedStyle = { transform: [] };

  // Keyboard visible and set selected message to null
  const isKeyboardVisible = useIsKeyboardVisible();
  useEffect(() => {
    if (isKeyboardVisible) setSelectedMessage(null);
  }, [isKeyboardVisible]);

  // Ai Chat and history
  const [history, setHistory] = useState<Message[]>([]);
  const chat = useAiChat({ history });

  // Copy text to clipboard from selected message
  const [selectedMessage, setSelectedMessage] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);

  // Set chat title with animation
  const [title, setTitle] = useState("");
  useSetChatTitle({ isLoading: false, setTitle });

  // Send message or stop AI typing
  const [text, setText] = useState<string>("");
  const [isLoadingMsg, setIsLoadingMsg] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);

  const { sendMessageOrStopAITyping } = useSendMsgAndStopAITyping({
    chat,
    text,
    setText,
    isLoadingMsg,
    setIsLoadingMsg,
    setMessages,
    isAITyping,
    setIsAITyping,
    setHistory,
  });
  const sendMessageOrStopAITypingCallback = useCallback(() => {
    sendMessageOrStopAITyping();
    if (!isAITyping) Keyboard.dismiss();
  }, [text, isLoadingMsg, isAITyping]);

  return (
    <View
      className="bg-[#4D2FB2] h-screen flex relative"
    >
      <LinearGradient
        colors={["#4D2FB2", "rgba(0,0,0,0.6)"]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[{ flex: 1 }, keyboardAnimatedStyle]}
        >
          <View
            className="px-4 flex flex-row justify-between items-center z-50 rounded-b-[8px]"
            style={{ paddingVertical: 19, boxShadow: "1px 1px 20px 10px rgba(0, 0, 0, 0.1)" }}
          >
            {/* Back button component for going back to the previous screen */}
            <Link href="/(root)/(tabs)" asChild replace>
              <TouchableOpacity>
                <ArrowLeft size={24} color="whitesmoke" />
              </TouchableOpacity>
            </Link>
            {/* Title component for showing the title of the chat */}
            <View>
              <Text className="text-white text-[16px]">{title}</Text>
            </View>
            {/* Dropdown menu component for showing the dropdown menu of the chat */}
            <TouchableOpacity>
              <EllipsisVertical size={24} color="whitesmoke" />
            </TouchableOpacity>
          </View>

          {/* Dropdown menu component for copying text from selected message */}
          {selectedMessage && !isKeyboardVisible && (
            <MessageDropdownMenu
              selectedMessage={selectedMessage}
              setSelectedMessage={setSelectedMessage}
              messages={messages}
            />
          )}

          <ScrollView
            scrollEnabled={selectedMessage ? false : true}
            className="flex flex-1 pt-3"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
            ref={scrollViewRef}
            contentContainerStyle={{
              paddingBottom: keyboardHeight > 0 ? 135 : 155,
            }}
          >
            {/* Message bubble component for showing messages */}
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                index={index}
                setSelectedMessage={setSelectedMessage}
                scrollViewRef={scrollViewRef as any}
              />
            ))}
            {isLoadingMsg && (
              <View
                className="text-white border border-white/5 rounded-[20px] max-w-[90%] overflow-hidden text-left rounded-bl-[4px] mb-[15px] p-4 self-start ml-3"
                style={{ backgroundColor: "rgba(77, 47, 178, .97)" }}
              >
                <View className="w-[12px] h-[12px] bg-white/80 rounded-full" />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Chat input component */}
        <ChatInput
          text={text}
          setText={setText}
          sendMessageOrStopAITyping={sendMessageOrStopAITypingCallback}
          isAITyping={isAITyping}
          keyboardHeight={keyboardHeight}
        />
      </LinearGradient>
    </View>
  );
}
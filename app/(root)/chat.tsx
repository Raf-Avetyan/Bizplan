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
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAnimatedKeyboard, useAnimatedStyle } from "react-native-reanimated";

// Types
import { Message } from "@/components/chat/types";

// Hooks
import { useKeyboardHeight } from "@/hooks/useIsKeyboardHeight";
import { useAiChat } from "@/hooks/Chat/useAiChat";
import { useSendMsgAndStopAITyping } from "@/hooks/Chat/useSendMsgAndStopAITyping";
import { useSetChatTitle } from "@/hooks/Chat/useSetChatTitle";

// Lucide Icons
import {
  ArrowLeft,
  CircleStop,
  Copy,
  EllipsisVertical,
} from "lucide-react-native";

// Components
import MessageBubble from "@/components/chat/MessageBubble";
import LottieLoading from "@/components/ui/LottieLoading/LottieLoading";
import { MessageDropdownMenu } from "@/components/chat/MessageDDMenu";
import { useIsKeyboardVisible } from "@/hooks/useIsKeyboardVisible";
import { ChatInput } from "@/components/chat/ChatInput";
import { RootStackParamList } from "@/types/navigation.types";

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, "Chat">;

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  // States and refs
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const scrollViewRef = useRef<ScrollView & { contentOffset: { y: number } }>(
    null
  );

  // Loading  simulated animation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Keyboard height and animated style
  const keyboardHeight = useKeyboardHeight();
  const keyboard = useAnimatedKeyboard();
  const keyboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboard.height.value }],
  }));

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
  useSetChatTitle({ isLoading, setTitle });

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
    <>
      <LottieLoading
        isLoading={isLoading}
        navigation={navigation}
        lottieURL={{
          background: require("../../assets/images/bluredmainbg.jpg"),
          loading: require("../../assets/lottie/business.json"),
        }}
      />
      <TouchableWithoutFeedback onPress={() => setSelectedMessage(null)}>
        <SafeAreaView className="bg-[#1E1E1E] h-screen flex relative">
          <ImageBackground
            source={require("../../assets/images/mainbg.jpg")}
            resizeMode="cover"
            className="h-screen flex-1"
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={[{ flex: 1 }, keyboardAnimatedStyle]}
            >
              <View
                className="py-4 px-4 flex flex-row justify-between items-center"
                style={{ backgroundColor: "#002958" }}
              >
                {/* Back button component for going back to the previous screen */}
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <ArrowLeft size={24} color="whitesmoke" />
                </TouchableOpacity>
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
                  paddingBottom: keyboardHeight > 0 ? 115 : 25,
                }}
              >
                {/* Message bubble component for showing messages */}
                {messages.map((message, index) => (
                  <MessageBubble
                    key={index}
                    message={message}
                    index={index}
                    setSelectedMessage={setSelectedMessage}
                    scrollViewRef={scrollViewRef}
                  />
                ))}
                {isLoadingMsg && (
                  <View
                    className="text-white border border-white/5 rounded-[20px] max-w-[90%] overflow-hidden text-left rounded-bl-none mb-[15px] p-4 self-start ml-3"
                    style={{ backgroundColor: "#002958" }}
                  >
                    <View className="w-[12px] h-[12px] bg-white/80 rounded-full" />
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </ImageBackground>

          {/* Chat input component */}
          <ChatInput
            text={text}
            setText={setText}
            sendMessageOrStopAITyping={sendMessageOrStopAITypingCallback}
            isAITyping={isAITyping}
            keyboardHeight={keyboardHeight}
          />

          <StatusBar backgroundColor="#001941" barStyle="light-content" />
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </>
  );
}

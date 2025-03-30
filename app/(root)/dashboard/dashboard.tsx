import {
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  View,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import {
  AlignJustify,
  ChevronDown,
  Facebook,
  FileChartColumn,
  FileText,
  Folder,
  Instagram,
  LayoutDashboard,
  Mail,
  PencilRuler,
  Plus,
  Settings,
  UserRound,
  UsersRound,
  X,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieLoading from "@/components/ui/LottieLoading/LottieLoading";
import React, { useEffect, useState } from "react";
import Animated, {
  Easing,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { HomeIcon, MessageIcon } from "@/assets/tabBarIcons";

export default function DashboardScreen({ navigation, route }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuOpacity = useSharedValue(0);
  const menuTranslateX = useSharedValue(-300);

  // Loading  simulated animation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Trigger the animation when the menu opens/closes
  useEffect(() => {
    if (isMenuOpen) {
      menuOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      });
      menuTranslateX.value = withTiming(0, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      });
    } else {
      menuOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      });
      menuTranslateX.value = withTiming(-100, {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      });
    }
  }, [isMenuOpen]);

  // Animated styles for the menu
  const animatedMenuStyle = useAnimatedStyle(() => {
    return {
      opacity: menuOpacity.value,
      transform: [{ translateX: menuTranslateX.value }],
    };
  });

  return (
    <>
      <LottieLoading
        isLoading={isLoading}
        navigation={navigation}
        lottieURL={{
          background: require("@/assets/images/bluredmainbg.jpg"),
          loading: require("@/assets/lottie/business.json"),
        }}
      />
      <SafeAreaView className="flex-1 relative">
        <ImageBackground
          source={require("@/assets/images/darkbluebg.jpg")}
          resizeMode="cover"
          className="flex-1"
        >
          {isMenuOpen && (
            <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
              <View
                style={{
                  flex: 1,
                  position: "absolute",
                  inset: 0,
                  zIndex: 40,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}
              />
            </TouchableWithoutFeedback>
          )}

          {/* Menu component */}
          <Animated.View
            style={[
              {
                backgroundColor: "#001941f6",
                width: "75%",
              },
              animatedMenuStyle,
            ]}
            className="absolute top-0 left-0 h-full z-50"
          >
            <View
              style={{
                backgroundColor: "#001941f6",
                height: 55,
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                zIndex: 99,
              }}
            />
            <ScrollView
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <View
                className="flex-1"
                style={{
                  marginTop: 55,
                }}
              >
                <View
                  style={{
                    borderBottomWidth: 1,
                    marginHorizontal: 16,
                    borderColor: "rgba(255, 255, 255, 0.05)",
                  }}
                />
                {/* Home, AI Consultant, Marketing Tools, My Documents */}
                <View style={{ gap: 24, paddingLeft: 20, paddingTop: 20 }}>
                  <TouchableOpacity
                    className="flex-row items-center gap-4 w-full"
                    onPress={() => navigation.goBack()}
                  >
                    <HomeIcon width={25} height={25} fill="whitesmoke" />
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16 }}
                    >
                      Home
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center gap-4 w-full"
                    style={{ paddingRight: 16 }}
                    onPress={() =>
                      navigation.navigate("ChatAndPlan", { screen: "Chat" })
                    }
                  >
                    <View className="flex-row items-center justify-between gap-4 w-full">
                      <View className="flex-row items-center gap-4">
                        <MessageIcon width={25} height={25} fill="whitesmoke" />
                        <Text
                          className="text-white font-Gabarito"
                          style={{ fontSize: 16 }}
                        >
                          AI Consultant
                        </Text>
                      </View>
                      <View
                        className="rounded-[8px] px-4 py-2"
                        style={{ backgroundColor: "#00275a" }}
                      >
                        <Text
                          className="text-white font-Gabarito"
                          style={{
                            fontSize: 12,
                            textTransform: "uppercase",
                          }}
                        >
                          Free
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center gap-4 w-full"
                    onPress={() => navigation.navigate("MarketingTools")}
                  >
                    <PencilRuler
                      width={24}
                      height={24}
                      strokeWidth={1.4}
                      stroke="#b5b5b5"
                    />
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16 }}
                    >
                      Marketing Tools
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center gap-4 w-full">
                    <Folder
                      width={24}
                      height={24}
                      strokeWidth={1.4}
                      stroke="#b5b5b5"
                    />
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16 }}
                    >
                      My Documents
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    borderBottomWidth: 1,
                    marginHorizontal: 16,
                    borderColor: "rgba(255, 255, 255, 0.05)",
                    marginTop: 20,
                  }}
                />
                {/* My Plans */}
                <View style={{ gap: 24, paddingLeft: 20, paddingTop: 20 }}>
                  <View>
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16, textTransform: "uppercase" }}
                    >
                      My Plans
                    </Text>
                  </View>
                  <TouchableOpacity className="flex-row items-center gap-4 w-full">
                    <FileText
                      width={24}
                      height={24}
                      strokeWidth={1.4}
                      stroke="#b5b5b5"
                    />
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16 }}
                    >
                      Business Plan
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center gap-4 w-full">
                    <Plus
                      width={24}
                      height={24}
                      strokeWidth={2}
                      stroke="#b5b5b5"
                    />
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16 }}
                    >
                      Marketing Strategy
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    borderBottomWidth: 1,
                    marginHorizontal: 16,
                    borderColor: "rgba(255, 255, 255, 0.05)",
                    marginTop: 20,
                  }}
                />
                {/* Create Content */}
                <View style={{ gap: 24, paddingLeft: 20, paddingTop: 20 }}>
                  <View>
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16, textTransform: "uppercase" }}
                    >
                      Create Content
                    </Text>
                  </View>
                  <TouchableOpacity className="flex-row items-center gap-4 w-full">
                    <Facebook
                      width={24}
                      height={24}
                      strokeWidth={1.4}
                      stroke="#b5b5b5"
                    />
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16 }}
                    >
                      New Facebook Post
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center gap-4 w-full">
                    <Instagram
                      width={24}
                      height={24}
                      strokeWidth={1.4}
                      stroke="#b5b5b5"
                    />
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16 }}
                    >
                      New Instagram Post
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center gap-4 w-full">
                    <FileChartColumn
                      width={24}
                      height={24}
                      strokeWidth={1.4}
                      stroke="#b5b5b5"
                    />
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16 }}
                    >
                      New Product Sales Sheet
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center gap-4 w-full">
                    <Mail
                      width={24}
                      height={24}
                      strokeWidth={1.4}
                      stroke="#b5b5b5"
                    />
                    <Text
                      className="text-white font-Gabarito"
                      style={{ fontSize: 16 }}
                    >
                      New Sales Follow-Up Email
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ marginBottom: 24 }}>
                    <Text
                      className="font-Gabarito"
                      style={{ fontSize: 16, color: "#007bff" }}
                    >
                      View All Tools
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            <View style={{ marginBottom: 12, marginHorizontal: 12 }}>
              <TouchableOpacity
                className="flex-row items-center gap-4 w-full justify-between"
                style={{
                  backgroundColor: "#00275a",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <View className="flex-row items-center gap-4">
                  <UserRound
                    width={24}
                    height={24}
                    strokeWidth={1.4}
                    color="#b5b5b5"
                  />
                  <Text
                    className="text-white font-Gabarito"
                    style={{ fontSize: 16 }}
                  >
                    Raf Avetyan
                  </Text>
                </View>
                <ChevronDown
                  width={24}
                  height={24}
                  strokeWidth={2}
                  color="#b5b5b5"
                />
              </TouchableOpacity>
              <View
                className="flex-row items-center gap-2 w-full justify-between"
                style={{ marginTop: 8 }}
              >
                <TouchableOpacity
                  className="flex-1 items-center justify-center"
                  style={{
                    backgroundColor: "#00275a",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <UsersRound
                    width={24}
                    height={24}
                    strokeWidth={1.4}
                    color="#b5b5b5"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center justify-center"
                  style={{
                    backgroundColor: "#00275a",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <LayoutDashboard
                    width={24}
                    height={24}
                    strokeWidth={1.4}
                    color="#b5b5b5"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 items-center justify-center"
                  style={{
                    backgroundColor: "#00275a",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Settings
                    width={24}
                    height={24}
                    strokeWidth={1.4}
                    color="#b5b5b5"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* TouchableOpacity for the menu button */}
          <TouchableOpacity
            onPress={() => setIsMenuOpen(!isMenuOpen)}
            className="absolute top-[10px] left-[10px] z-50"
          >
            {isMenuOpen ? (
              <X size={32} color="whitesmoke" strokeWidth={1.5} />
            ) : (
              <AlignJustify size={32} color="whitesmoke" strokeWidth={1.2} />
            )}
          </TouchableOpacity>

          {/* Scrollable content */}
          <ScrollView contentContainerStyle={{ paddingTop: 50 }}>
            <Text className="text-white">Content goes here...</Text>
          </ScrollView>
        </ImageBackground>
      </SafeAreaView>
    </>
  );
}

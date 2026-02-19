import { HomeIcon, MessageIcon } from "@/assets/tabBarIcons";
import {
  ChevronDown,
  Facebook,
  FileChartColumn,
  FileText,
  Folder,
  Instagram,
  LayoutDashboard,
  LogOut,
  Mail,
  PencilRuler,
  Plus,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { MotiView } from "moti";
import { router, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type MenuProps = {
  isMenuOpen: boolean;
};

const Menu = ({ isMenuOpen }: MenuProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const menuOpacity = useSharedValue(0);
  const menuTranslateX = useSharedValue(-300);

  // Animated styles for the menu
  const animatedMenuStyle = useAnimatedStyle(() => {
    return {
      opacity: menuOpacity.value,
      transform: [{ translateX: menuTranslateX.value }],
    };
  });

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

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "#001941f6",
          width: "80%",
        },
        animatedMenuStyle,
      ]}
      className="absolute top-0 left-0 z-[2000] h-screen"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View
          className="flex-1"
          style={{
            paddingTop: 80,
            marginTop: 20
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
          <View style={{ gap: 16, paddingHorizontal: 20, paddingTop: 20 }}>
            <TouchableOpacity
              className="flex-row items-center gap-4 w-full"
              style={{ paddingRight: 16 }}
              onPress={() =>
                router.push("/chat")
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
              onPress={() => router.push("/(root)/(tabs)/(dashboard)/marketing-tools")}
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
            <TouchableOpacity
              className="flex-row items-center gap-4 w-full"
              onPress={() => router.push("/(root)/(tabs)/(dashboard)/my-documents")}
            >
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
            <TouchableOpacity
              className="flex-row items-center gap-4 w-full"
              onPress={() => router.navigate("/(root)/(tabs)/plan")}
            >
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
              <Plus width={24} height={24} strokeWidth={2} stroke="#b5b5b5" />
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
              <Mail width={24} height={24} strokeWidth={1.4} stroke="#b5b5b5" />
              <Text
                className="text-white font-Gabarito"
                style={{ fontSize: 16 }}
              >
                New Sales Follow-Up Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: -10 }}>
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
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <MotiView
            animate={{
              height: isExpanded ? 35 : 28,
              opacity: 1,
            }}
            transition={{
              type: "timing",
              duration: 200,
            }}
            className="flex-row items-center"
          >
            <View className="flex-row items-center gap-4">
              {!isExpanded && (
                <>
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
                </>
              )}
            </View>
            {isExpanded && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "timing", duration: 300 }}
                className="top-0 left-0 flex-col gap-1"
              >
                <View className='flex items-center flex-row gap-4'>
                  <TouchableOpacity
                    onPress={() => router.push("/profile")}
                    className="flex-row items-center gap-4 bg-[#003366] p-2 rounded-lg"
                  >
                    <UserRound
                      width={20}
                      height={20}
                      strokeWidth={1.4}
                      color="#b5b5b5"
                    />
                    <Text className="text-white font-Gabarito">View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      AsyncStorage.removeItem("token");
                      router.replace("/(auth)/auth");
                    }}
                    className="flex-row items-center gap-4 p-2 rounded-lg"
                  >
                    <LogOut
                      width={20}
                      height={20}
                      strokeWidth={1.4}
                      color="#b5b5b5"
                    />
                    <Text className="text-white font-Gabarito">Logout</Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            )}
          </MotiView>
          <MotiView
            animate={{ rotate: isExpanded ? "180deg" : "0deg" }}
            transition={{ type: "timing", duration: 200 }}
          >
            <ChevronDown
              width={24}
              height={24}
              strokeWidth={2}
              color="#b5b5b5"
            />
          </MotiView>
        </TouchableOpacity>

        {/* Divider */}
        <View
          style={{
            borderBottomWidth: 1,
            marginHorizontal: 16,
            marginVertical: 42,
            borderColor: "rgba(255, 255, 255, 0.05)",
          }}
        />
      </View>
    </Animated.View >
  );
};

export default Menu;

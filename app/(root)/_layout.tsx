import { useEffect } from "react";
import "react-native-reanimated";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  ImageBackground,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/types/navigation.types";
import {
  DolarIcon,
  FileIcon,
  HomeIcon,
  MessageIcon,
} from "@/assets/tabBarIcons";
import { useNavigation } from "@react-navigation/native";
import { useIsKeyboardVisible } from "@/hooks/useIsKeyboardVisible";
import HomeScreen from ".";
import ChatScreen from "./chat";
import DashboardScreen from "./dashboard/dashboard";
import MarketingTools from "./dashboard/marketing-tools";
import MyDocuments from "./dashboard/my-documents";
import PlanScreen from "./plan";
import FinancialScreen from "./financial";

import "@/global.css";

const Stack = createStackNavigator();
const ModalStack = createStackNavigator<RootStackParamList>();

export default function MainLayout() {
  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    StatusBar.setBackgroundColor("#001941");
  }, []);

  return (
    <>
      <ModalStack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: "modal",
        }}
      >
        <ModalStack.Screen name="Main" component={MainStackNavigator} />
        <ModalStack.Screen
          name="Dashboard"
          component={DashbordStackNavigator}
          options={{ ...TransitionPresets.SlideFromRightIOS }}
        />
        <ModalStack.Screen
          name="ChatAndPlan"
          component={ChatAndPlanStackNavigator}
          options={{ ...TransitionPresets.SlideFromRightIOS }}
        />
      </ModalStack.Navigator>
    </>
  );
}

function MainStackNavigator() {
  const [selectedTab, setSelectedTab] = useState("home");
  const isKeyboardVisible = useIsKeyboardVisible();

  const navigation =
    useNavigation<NativeStackScreenProps<RootStackParamList>["navigation"]>();

  function renderContent() {
    return (
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          ...(Platform.OS === "ios"
            ? TransitionPresets.SlideFromRightIOS
            : TransitionPresets.FadeFromBottomAndroid),
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Financial" component={FinancialScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {renderContent()}

      {!isKeyboardVisible && (
        <View style={styles.container}>
          <ImageBackground
            style={styles.tabBar}
            source={require("@/assets/images/bluredmainbg.jpg")}
            resizeMode="cover"
            className="flex-1"
          >
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Main", { screen: "Home" });
                setSelectedTab("home");
              }}
              style={styles.tabItem}
            >
              <HomeIcon
                width={26}
                height={26}
                fill={selectedTab === "home" ? "#01a06d" : "#aeaeff"}
                selectedTab={selectedTab}
              />
              <View
                style={{
                  display: selectedTab === "home" ? "flex" : "none",
                  position: "absolute",
                  top: -8.2,
                  borderBottomEndRadius: 10,
                  borderBottomStartRadius: 10,
                  backgroundColor: "#01a06d",
                  height: 6,
                  width: 64,
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("ChatAndPlan", { screen: "Plan" });
              }}
              style={styles.tabItem}
            >
              <FileIcon
                width={29}
                height={29}
                fill={selectedTab === "plan" ? "#01a06d" : "#aeaeff"}
                selectedTab={selectedTab}
              />
              <View
                style={{
                  display: selectedTab === "plan" ? "flex" : "none",
                  position: "absolute",
                  top: -8.2,
                  borderBottomEndRadius: 10,
                  borderBottomStartRadius: 10,
                  backgroundColor: "#01a06d",
                  height: 6,
                  width: 64,
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("ChatAndPlan", { screen: "Chat" });
              }}
              style={styles.tabItem}
            >
              <MessageIcon
                width={29}
                height={29}
                fill={selectedTab === "chat" ? "#01a06d" : "#aeaeff"}
                selectedTab={selectedTab}
              />
              <View
                style={{
                  display: selectedTab === "chat" ? "flex" : "none",
                  position: "absolute",
                  top: -8.2,
                  borderBottomEndRadius: 10,
                  borderBottomStartRadius: 10,
                  backgroundColor: "#01a06d",
                  height: 6,
                  width: 64,
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Main", { screen: "Financial" });
                setSelectedTab("financial");
              }}
              style={styles.tabItem}
            >
              <DolarIcon
                width={35}
                height={35}
                fill={selectedTab === "financial" ? "#01a06d" : "#aeaeff"}
                selectedTab={selectedTab}
              />
              <View
                style={{
                  display: selectedTab === "financial" ? "flex" : "none",
                  position: "absolute",
                  top: -8.2,
                  borderBottomEndRadius: 10,
                  borderBottomStartRadius: 10,
                  backgroundColor: "#01a06d",
                  height: 6,
                  width: 64,
                }}
              />
            </TouchableOpacity>
          </ImageBackground>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

function DashbordStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="MarketingTools" component={MarketingTools} />
      <Stack.Screen name="MyDocuments" component={MyDocuments} />
    </Stack.Navigator>
  );
}

function ChatAndPlanStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Chat" component={ChatScreen as any} />
      <Stack.Screen name="Plan" component={PlanScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    left: 2,
    width: "95%",
    marginHorizontal: 8,
    paddingBottom: 2,
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    height: 75,
    gap: 11,
    opacity: 0.95,
  },
  tabBar: {
    flexDirection: "row",
    position: "absolute",
    width: "100%",
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    height: 75,
    gap: 11,
    opacity: 0.95,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
  },
  tabBarBg: {
    position: "absolute",
    bottom: -5,
    left: 0,
    width: "100%",
    height: 100,
    zIndex: -1,
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
    width: 55,
    height: 55,
    borderRadius: 50,
  },
});

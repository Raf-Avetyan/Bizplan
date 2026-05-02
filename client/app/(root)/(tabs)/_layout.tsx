import "react-native-reanimated";
import React from "react";
import { Platform, Pressable, StyleSheet, View, useColorScheme } from "react-native";
import { Tabs, usePathname } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { useIsKeyboardVisible } from "@/hooks/useIsKeyboardVisible";
import { useSettings } from "@/lib/settings-context";
import {
  House,
  FileText,
  LayoutDashboard,
  Search,
  UserRound,
} from "lucide-react-native";

export default function TabsLayout() {
  const isKeyboardVisible = useIsKeyboardVisible();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const t = getTabsCopy(settings.language);
  const pathname = usePathname();
  const hideNativeTabs = pathname.includes("pitch-deck");

  if (Platform.OS === "ios" && hideNativeTabs) {
    return (
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="plan" />
        <Tabs.Screen name="(dashboard)" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="profile" />
      </Tabs>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>{t.home}</Label>
          <Icon sf="house.fill" drawable="ic_home" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="plan">
          <Label>{t.plans}</Label>
          <Icon sf="doc.text.fill" drawable="ic_plan" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(dashboard)">
          <Label>{t.dashboard}</Label>
          <Icon sf="rectangle.3.offgrid.fill" drawable="ic_dashboard" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <Label>{t.profile}</Label>
          <Icon sf="person.fill" drawable="ic_profile" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="search" role='search'>
          <Icon sf="dot.radiowaves.left.and.right" drawable="ic_search" />
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
      tabBar={({ state, navigation }) => {
        if (isKeyboardVisible) return null;

        const activeIndex = state.index;

        const tabs = [
          { name: "index", icon: House, key: "home", size: 22, label: t.home },
          { name: "plan", icon: FileText, key: "plan", size: 22, label: t.plans },
          { name: "(dashboard)", icon: LayoutDashboard, key: "dashboard", size: 22, label: t.dashboard },
          { name: "search", icon: Search, key: "search", size: 22, label: t.search },
          { name: "profile", icon: UserRound, key: "profile", size: 22, label: t.profile },
        ];

        return (
          <View style={styles.container}>
            <BlurView intensity={isDark ? 32 : 48} tint={isDark ? "dark" : "light"} style={[styles.tabBar, !isDark && styles.tabBarLight]}>
              {tabs.map((tab, index) => {
                const isActive = activeIndex === index;
                const IconComponent = tab.icon;

                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => navigation.navigate(tab.name)}
                    accessibilityLabel={tab.label}
                    style={styles.tabItem}
                  >
                    <MotiView
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        opacity: isActive ? 1 : 0.7,
                      }}
                      transition={{
                        type: "spring",
                        damping: 15,
                        stiffness: 200,
                      }}
                    >
                      <IconComponent
                        size={tab.size}
                        color={isActive ? (isDark ? "#01a06d" : "#0f766e") : (isDark ? "#aeaeff" : "#64748b")}
                        strokeWidth={2}
                      />
                    </MotiView>

                    <MotiView
                      animate={{
                        opacity: isActive ? 1 : 0,
                        scale: isActive ? 1 : 0.8,
                      }}
                      transition={{
                        type: "spring",
                        damping: 20,
                        stiffness: 300,
                      }}
                      style={[styles.activeIndicator, !isDark && styles.activeIndicatorLight]}
                    />
                  </Pressable>
                );
              })}
            </BlurView>
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="(dashboard)" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

function getTabsCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      home: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f",
      plans: "\u041f\u043b\u0430\u043d\u044b",
      dashboard: "\u041f\u0430\u043d\u0435\u043b\u044c",
      search: "\u041f\u043e\u0438\u0441\u043a",
      profile: "\u041f\u0440\u043e\u0444\u0438\u043b\u044c",
    };
  }

  if (language === "hy") {
    return {
      home: "\u0533\u056c\u056d\u0561\u057e\u0578\u0580",
      plans: "\u054a\u056c\u0561\u0576\u0576\u0565\u0580",
      dashboard: "\u054e\u0561\u0570\u0561\u0576\u0561\u056f",
      search: "\u0548\u0580\u0578\u0576\u0578\u0582\u0574",
      profile: "\u054a\u0580\u0578\u0586\u056b\u056c",
    };
  }

  return {
    home: "Home",
    plans: "Plans",
    dashboard: "Dashboard",
    search: "Search",
    profile: "Profile",
  };
}
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 10,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    height: 75,
    paddingHorizontal: 18,
    paddingBottom: 2,
    gap: 6,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(20, 10, 45, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  tabBarLight: {
    borderColor: "rgba(15, 23, 42, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 55,
    borderRadius: 50,
  },
  activeIndicator: {
    position: "absolute",
    top: -8.2,
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
    backgroundColor: "#A855F7", // Radiant Amethyst Purple
    height: 6,
    width: 48,
  },
  activeIndicatorLight: {
    backgroundColor: "#0f766e",
  },
});





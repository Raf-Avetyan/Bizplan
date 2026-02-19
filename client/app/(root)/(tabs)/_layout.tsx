import "react-native-reanimated";
import React, { useState } from "react";
import { Platform, StyleSheet, View, TouchableOpacity } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { useIsKeyboardVisible } from "@/hooks/useIsKeyboardVisible";
import { HomeIcon, FileIcon, MessageIcon, DolarIcon } from "@/assets/tabBarIcons";

export default function TabsLayout() {
  const isKeyboardVisible = useIsKeyboardVisible();

  if (Platform.OS === "ios") {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf="house.fill" drawable="ic_home" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="plan">
          <Label>Plans</Label>
          <Icon sf="doc.text.fill" drawable="ic_plan" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(dashboard)" >
          <Label>Dashboard</Label>
          <Icon sf="rectangle.3.offgrid.fill" drawable="ic_dashboard" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile" >
          <Label>Profile</Label>
          <Icon sf="person.fill" drawable="ic_profile" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="search" role='search'>
          <Icon sf="globe" drawable="ic_search" />
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
          { name: "index", icon: HomeIcon, key: "home", size: 26 },
          { name: "plan", icon: FileIcon, key: "plan", size: 29 },
          { name: "financial", icon: DolarIcon, key: "financial", size: 35 },
        ];

        return (
          <View style={styles.container}>
            <BlurView style={styles.tabBar}>
              {tabs.map((tab, index) => {
                const isActive = activeIndex === index;
                const IconComponent = tab.icon;

                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => navigation.navigate(tab.name)}
                    style={styles.tabItem}
                    activeOpacity={0.8}
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
                        width={tab.size}
                        height={tab.size}
                        fill={isActive ? "#01a06d" : "#aeaeff"}
                        selectedTab={tab.key}
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
                      style={styles.activeIndicator}
                    />
                  </TouchableOpacity>
                );
              })}
            </BlurView>
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="financial" />
    </Tabs>
  );
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
    paddingHorizontal: 45,
    paddingBottom: 2,
    gap: 11,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff10",
    backgroundColor: "rgba(14, 33, 160, 0.2)",
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
    width: 55,
    height: 55,
    borderRadius: 50,
  },
  activeIndicator: {
    position: "absolute",
    top: -8.2,
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
    backgroundColor: "#01a06d",
    height: 6,
    width: 64,
  },
});

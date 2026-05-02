import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { Image, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppSettings } from "@/lib/settings-context";
import { accountDataService } from "@/services/account-data.service";

const Index = () => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<null | boolean>(null);
  const [defaultRoute, setDefaultRoute] = useState<AppSettings["defaultRoute"]>("/(root)/(tabs)/(dashboard)");

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("auth_token");
      let savedSettings = await AsyncStorage.getItem("bizplan-mobile-settings");

      if (token) {
        try {
          const remoteSettings = await accountDataService.getSettings<Partial<AppSettings>>({});
          if (remoteSettings.defaultRoute) {
            setDefaultRoute(remoteSettings.defaultRoute);
          }
          savedSettings = null;
        } catch {
          // Fall back to local settings if the backend is not reachable during startup.
        }
      }

      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings) as Partial<AppSettings>;
          if (parsed.defaultRoute) {
            setDefaultRoute(parsed.defaultRoute);
          }
        } catch {
          // Keep fallback route if saved settings are malformed.
        }
      }

      setIsUserLoggedIn(!!token);
    };

    checkLogin();
  }, []);

  if (isUserLoggedIn === null) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0a1b1f]">
        <Image
          source={require("@/assets/images/splash-icon.png")}
          resizeMode="contain"
          className="w-1/2 h-1/2"
        />
      </View>
    );
  }

  return isUserLoggedIn ? (
    <Redirect href={defaultRoute} />
  ) : (
    <Redirect href="/(auth)/auth" />
  );
};

export default Index;

import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { Image, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Index = () => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<null | boolean>(null);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("auth_token");
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
    <Redirect href="/(root)/(tabs)" />
  ) : (
    <Redirect href="/(auth)/auth" />
  );
};

export default Index;

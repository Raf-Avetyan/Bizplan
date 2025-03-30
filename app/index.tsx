import React, { useState } from "react";
import { Redirect } from "expo-router";
import { Image, StatusBar, View } from "react-native";

const Index = () => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(true);

  return (
    <View className="flex-1 items-center justify-center bg-[#0a1b1f]">
      <Image
        source={require("@/assets/images/splash-icon.png")}
        resizeMode="contain"
        className="w-1/2 h-1/2"
      />
      {isUserLoggedIn ? (
        <Redirect href="/(root)" />
      ) : (
        <Redirect href="/(auth)/onBoarding" />
      )}
    </View>
  );
};

export default Index;

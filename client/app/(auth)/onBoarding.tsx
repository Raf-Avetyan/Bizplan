import { router } from "expo-router";
import React, { useState } from "react";
import { Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieLoading from "@/components/ui/LottieLoading/LottieLoading";

const OnBoarding = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <SafeAreaView className="bg-[#001941] flex-1">
      <LottieLoading
        isLoading={isLoading}
        lottieURL={{
          background: require("@/assets/images/bluredmainbg.jpg"),
          loading: require("@/assets/lottie/business.json"),
        }}
      />
      <Text>OnBoarding</Text>
      <Button title="Go to Auth" onPress={() => router.push("/(auth)/auth")} />
    </SafeAreaView>
  );
};

export default OnBoarding;

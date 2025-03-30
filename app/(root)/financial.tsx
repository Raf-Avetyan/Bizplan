import * as React from "react";
import { useState, useEffect } from "react";
import {
  ImageBackground,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import Calendar from "@/components/ui/calendar";
import { loadingStyles } from ".";
import { ChevronLeft } from "lucide-react-native";

export default function FinancialScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      {isLoading && (
        <View style={loadingStyles.loadingContainer}>
          <ImageBackground
            style={loadingStyles.loadingContainer}
            source={require("../../assets/images/bluredmainbg.jpg")}
            resizeMode="cover"
            className="flex-1"
          >
            <LottieView
              source={require("../../assets/lottie/business.json")}
              autoPlay
              loop
              style={[loadingStyles.lottie]}
            />
          </ImageBackground>
        </View>
      )}
      <SafeAreaView className="bg-[#1E1E1E] h-screen flex relative">
        <ImageBackground
          source={require("../../assets/images/mainbg.jpg")}
          resizeMode="cover"
          className="h-screen flex-1"
        >
          <Text>Financal</Text>
          <View className="h-[340px] mt-10">
            <Calendar className="mx-auto" />
          </View>
        </ImageBackground>
        <StatusBar backgroundColor="#001941" barStyle="light-content" />
      </SafeAreaView>
    </>
  );
}

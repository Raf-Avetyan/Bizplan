import * as React from "react";
import { useState, useEffect } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import { useNavigation } from "expo-router";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MotiText, MotiView } from "moti";
import { RootStackParamList } from "@/types/navigation.types";

export default function FinancalScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  const navigation =
    useNavigation<
      NativeStackScreenProps<RootStackParamList, "Home">["navigation"]
    >();

  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={require("../../assets/images/mainbg.jpg")}
      resizeMode="cover"
      className="flex-1"
    >
      <SafeAreaView
        className="min-h-[100%]"
        style={{ flex: 1, paddingBottom: insets.bottom }}
      >
        {isLoading ? (
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
                style={loadingStyles.lottie}
              />
            </ImageBackground>
          </View>
        ) : (
          <ScrollView>
            <View className="flex h-screen p-6">
              <MotiView
                className="h-[50%] relative overflow-hidden rounded-[16px] transform origin-bottom"
                from={{
                  opacity: 0,
                  translateX: -300,
                }}
                animate={{
                  opacity: 1,
                  translateX: 0,
                }}
                transition={{
                  type: "timing",
                  duration: 800,
                }}
              >
                <View className="h-full relative overflow-hidden rounded-[16px]">
                  <Image
                    source={require("../../assets/images/home-hero.webp")}
                    resizeMode="cover"
                    className="w-screen h-full"
                  />
                  <Image
                    source={require("../../assets/images/hero-research.webp")}
                    resizeMode="contain"
                    className="h-full absolute top-0 left-0 w-[50%]"
                  />
                </View>
              </MotiView>

              <View>
                <MotiText
                  style={{ marginTop: 16 }}
                  from={{
                    opacity: 0,
                    translateX: -300,
                  }}
                  animate={{
                    opacity: 1,
                    translateX: 0,
                  }}
                  transition={{
                    type: "timing",
                    delay: 50,
                    duration: 800,
                  }}
                >
                  <Text
                    className="font-Arm_Hmks_Bebas_Neue text-white"
                    style={{ fontSize: 32 }}
                  >
                    Ամեն ինչ, ինչ ձեզ հարկավոր է ձեր բիզնեսը պլանավորելու,
                    սկսելու և զարգացնելու համար։
                  </Text>
                </MotiText>
                <MotiText
                  style={{ marginTop: 16 }}
                  from={{
                    opacity: 0,
                    translateX: -300,
                  }}
                  animate={{
                    opacity: 1,
                    translateX: 0,
                  }}
                  transition={{
                    type: "timing",
                    duration: 800,
                    delay: 100,
                  }}
                >
                  <Text
                    className="font-Arm_Hmks_Bebas_Neue text-white"
                    style={{ fontSize: 16, marginTop: 16 }}
                  >
                    Ստեղծեք բարձրակարգ բիզնես պլան րոպեների ընթացքում{" "}
                    <Text style={{ color: "#01a06d", lineHeight: 22 }}>
                      AI-ի միջոցով
                    </Text>
                    ։ Ապա իրականացրեք այն ֆինանսական կանխատեսումներով, շուկայի
                    վերլուծությամբ, ներդրումային առաջարկով և այլ գործիքներով։
                  </Text>
                </MotiText>
                <MotiView
                  style={{ marginTop: 20 }}
                  from={{
                    opacity: 0,
                    translateY: 300,
                  }}
                  animate={{
                    opacity: 1,
                    translateY: 0,
                  }}
                  transition={{
                    type: "timing",
                    delay: 200,
                    duration: 1000,
                  }}
                >
                  <TouchableOpacity
                    // onPress={() => navigation.push("Plan")}
                    onPress={() =>
                      navigation.push("Dashboard", {
                        businessPlanData: {},
                      } as RootStackParamList["Dashboard"])
                    }
                    className="rounded-full"
                    style={{
                      backgroundColor: "#01a06d",
                      paddingVertical: 10,
                      paddingHorizontal: 24,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text
                      className="text-white font-Arm_Hmks_Bebas_Neue"
                      style={{ fontSize: 20, letterSpacing: 1 }}
                    >
                      Սկսել
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              </View>
            </View>
          </ScrollView>
        )}
        <StatusBar backgroundColor="#001941" barStyle="light-content" />
      </SafeAreaView>
    </ImageBackground>
  );
}

export const loadingStyles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    zIndex: 999,
  },
  lottie: {
    width: 210,
    height: 210,
    position: "relative",
    bottom: 30,
  },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { Text, TouchableOpacity, View, TextInput } from "react-native";
import React, { useState, useEffect } from "react";
import * as jwtDecode from "jwt-decode";
import { MotiText, MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView } from 'react-native-gesture-handler';
import axiosClient from "@/api/axios-client";
import { UserProfile, UserWithPlans } from '@/types/auth.types';
import { useToast } from '@/components/ui/Toast/Toast';

export default function Profile() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const handleLogout = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("user");
    router.replace("/(auth)/auth");
  };

  const confirmLogout = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("user");
    setShowModal(false);
    router.replace("/(auth)/auth");
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);

      const userData: UserProfile = await axiosClient.get("/user/profile");

      setName(userData.name);
      setEmail(userData.email);
    } catch (error: any) {
      console.error("Fetch profile error:", error);

      if (error?.status === 401 || error?.message?.includes("Unauthorized")) {
        toast.showToast("Session Expired", "Please login again to continue", "warning");
        handleLogout();
        return;
      }

      toast.showToast("Error", error?.message || "Failed to fetch profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async () => {
    try {
      setIsUpdating(true);

      const updatedUser: UserProfile = await axiosClient.patch("/user/profile", { name });

      setName(updatedUser.name);
      setIsEditing(false);

      toast.showToast("Success", "Profile updated successfully", "success");
    } catch (error: any) {
      console.error("Update error:", error);

      if (error?.status === 401 || error?.message?.includes("Unauthorized")) {
        toast.showToast("Session Expired", "Please login again to continue", "warning");
        handleLogout();
        return;
      }

      toast.showToast("Error", error?.message || "Failed to update name", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const getUserWithPlans = async () => {
    try {
      const userWithPlans: UserWithPlans = await axiosClient.get("/user/with-plans");
    } catch (error) {
      console.error("Get user with plans error:", error);
    }
  };

  useEffect(() => {
    const initProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");

        if (!token) {
          toast.showToast("Authentication Error", "Please login to access your profile", "error");
          router.replace("/(auth)/auth");
          return;
        }

        await fetchUserProfile();

      } catch (error) {
        console.error("Init profile error:", error);
        toast.showToast("Error", "Failed to initialize profile", "error");
      }
    }

    initProfile();
  }, []);

  return (
    <View className="h-full flex bg-[#4D2FB2]">
      <LinearGradient
        colors={["#4D2FB2", "#2B1A66", "#050510"]}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.6, 1]}
      >
        <ScrollView>
          <View className="flex items-center flex-col pt-14">
            <LottieView
              source={require("../../../assets/lottie/user.json")}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200 }}
            />

            <View className="bg-slate-300/10 rounded-[16px] min-h-[120px] w-[65%] p-4 flex gap-[18px]">
              {isLoading ? (
                <View className="items-center justify-center">
                  <LottieView
                    source={require("@/assets/lottie/profile-skeleton.json")}
                    autoPlay
                    loop
                    style={{ width: 180, height: 180 }}
                  />
                </View>
              ) : (
                <View className="flex gap-[18px]">
                  <View>
                    {isEditing ? (
                      <View className="flex-row items-center justify-center gap-2">
                        <TextInput
                          value={name}
                          onChangeText={setName}
                          className="text-center text-[32px] p-0 font-Arm_Hmks_Bebas_Neue tracking-[1px] text-white bg-slate-400/20 rounded-lg px-2"
                          editable={!isUpdating}
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={handleUpdateName}
                          disabled={isUpdating}
                          className={`rounded-[12px] py-[6px] self-center px-4 ${isUpdating ? "bg-gray-500" : "bg-green-500"}`}
                        >
                          <Text className="text-center text-white font-Gabarito">
                            {isUpdating ? "Saving..." : "Save"}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setIsEditing(false)}
                          disabled={isUpdating}
                          className="rounded-[12px] py-[6px] self-center px-4 bg-gray-500"
                        >
                          <Text className="text-center text-white font-Gabarito">
                            Cancel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        <View className="flex-row items-center justify-center">
                          <Text className="text-center text-[32px] font-Arm_Hmks_Bebas_Neue tracking-[1px] text-white">
                            {name}
                          </Text>
                        </View>
                      </View>
                    )}
                    <Text className="text-center text-[14px] font-Gabarito text-white/50">
                      {email}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      className="bg-blue-500/60 rounded-[12px] flex-1 py-[6px] self-center px-6"
                    >
                      <Text className="text-center text-white font-Gabarito">
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowModal(true)}
                      className="bg-red-500 rounded-[12px] flex-1 py-[6px] self-center px-6"
                    >
                      <Text className="text-center text-white font-Gabarito">
                        Logout
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View
              style={{
                borderBottomColor: "#aaa",
                borderBottomWidth: 1,
                width: "20%",
                marginHorizontal: "auto",
                marginTop: 32,
                marginBottom: 12,
              }}
            />

            <View className="px-4 flex items-center">
              <Text className="text-white text-[32px] font-Gabarito">
                Business Plans
              </Text>
              <MotiView
                from={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  type: "timing",
                  duration: 800,
                }}
                className="items-center"
              >
                <LottieView
                  source={require("@/assets/lottie/nothing-found.json")}
                  autoPlay
                  loop={false}
                  style={{ width: 200, height: 200 }}
                />
                <MotiText
                  from={{
                    opacity: 0,
                    translateY: 20,
                  }}
                  animate={{
                    opacity: 1,
                    translateY: 0,
                  }}
                  transition={{
                    type: "timing",
                    delay: 200,
                    duration: 600,
                  }}
                  className="text-white text-[14px] font-Gabarito text-center"
                >
                  You haven't created any business plans yet
                </MotiText>
                <MotiView
                  from={{
                    opacity: 0,
                    translateY: 20,
                  }}
                  animate={{
                    opacity: 1,
                    translateY: 0,
                  }}
                  transition={{
                    type: "timing",
                    delay: 400,
                    duration: 1000,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => router.push("/plan")}
                    className="mt-8 bg-[#01a06d] px-8 py-4 rounded-full shadow-lg"
                    style={{
                      shadowColor: "#01a06d",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                    }}
                  >
                    <Text className="text-white font-Gabarito text-lg">
                      Create Your First Plan
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              </MotiView>
            </View>
          </View>
        </ScrollView>

        <MotiView
          animate={{ opacity: showModal ? 1 : 0 }}
          transition={{ type: "timing", duration: 300 }}
          className="absolute inset-0 bg-black/60 items-center justify-center z-50"
          pointerEvents={showModal ? "auto" : "none"}
        >
          <View className="bg-[#1e1e1e] w-[80%] rounded-2xl p-6 items-center shadow-2xl border border-white/10">
            <Text className="text-white text-xl font-Gabarito mb-2 text-center">
              Logout
            </Text>
            <Text className="text-white/60 text-center mb-6 font-Gabarito">
              Are you sure you want to logout?
            </Text>
            <View className="flex-row gap-4 w-full">
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 items-center"
              >
                <Text className="text-white font-Gabarito">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                className="flex-1 py-3 rounded-xl bg-red-500/20 items-center border border-red-500/50"
              >
                <Text className="text-red-400 font-Gabarito">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </MotiView>
      </LinearGradient>
    </View>
  );
}
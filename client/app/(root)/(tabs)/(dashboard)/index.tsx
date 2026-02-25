import {
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useCallback } from "react";
import Menu from "./components/Menu/Menu";
import { LinearGradient } from "expo-linear-gradient";
import { X, AlignJustify } from 'lucide-react-native';
import { Text } from 'react-native';
import Content from './components/Content';
import LottieLoading from '@/components/ui/LottieLoading/LottieLoading';
import LottieView from 'lottie-react-native';
import { useActiveCompany, useCompanyAdditionalData } from '@/hooks/useCompanyQueries';

export default function DashboardScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: activeCompany, isLoading, refetch } = useActiveCompany();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <>
      <LinearGradient
        colors={["#4D2FB2", "#061E29"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1 relative">
          <LottieLoading
            isLoading={isLoading}
            lottieURL={{ loading: require("@/assets/lottie/spinner.json") }}
          />

          <TouchableOpacity
            onPress={() => setIsMenuOpen(!isMenuOpen)}
            className="left-[10px] top-[-10px] z-[2500]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            {isMenuOpen ? (
              <X size={32} color="whitesmoke" strokeWidth={1.5} />
            ) : (
              <AlignJustify size={32} color="whitesmoke" strokeWidth={1.2} />
            )}
          </TouchableOpacity>

          {isMenuOpen && (
            <>
              <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1500,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                  }}
                />
              </TouchableWithoutFeedback>
              <Menu isMenuOpen={isMenuOpen} />
            </>
          )}

          <ScrollView
            className="flex-1 px-4"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="transparent"
                colors={["transparent"]}
                progressBackgroundColor="transparent"
              />
            }
          >
            {activeCompany ? (
              <Content companyData={activeCompany} />
            ) : (
              <View className="flex-1 justify-center items-center py-10">
                <Text className="text-white">No active plan</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}
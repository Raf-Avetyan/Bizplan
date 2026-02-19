import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import SignUp from "@/components/auth/sign-up/SignUp";

export default function Auth() {
  return (
    <SafeAreaView style={{ backgroundColor: "#1E1E1E", flex: 1 }}>
      <SignUp />
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

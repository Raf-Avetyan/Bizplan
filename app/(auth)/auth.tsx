import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";

export default function Auth() {
  return (
    <SafeAreaView style={{ backgroundColor: "#1E1E1E", flex: 1 }}>
      <Text>Auth</Text>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

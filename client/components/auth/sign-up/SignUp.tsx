import { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import axiosClient from "@/api/axios-client";
import { AuthResponse } from '@/types/auth.types';
import { useToast } from '@/components/ui/Toast/Toast';
import { useSettings } from "@/lib/settings-context";

export default function SignUp() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getAuthPalette(isDark);

  const handleAuth = async () => {
    if (!email || !password) {
      toast.showToast("Error", "Email and password are required", "error");
      return;
    }
    if (!isLogin && !name) {
      toast.showToast("Error", "Name is required for registration", "error");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const response: AuthResponse = await axiosClient.post("/auth/login", {
          email,
          password,
        });

        const { token, user } = response;

        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        toast.showToast("Success", "Login successful!", "success");
        router.replace(settings.defaultRoute as any);
      } else {
        const data: AuthResponse = await axiosClient.post("/auth/register", {
          name,
          email,
          password,
        });

        const { token, user } = data;

        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        toast.showToast("Success", "Registration successful!", "success");
        router.replace(settings.defaultRoute as any);
      }
    } catch (error: any) {
      const errorMessage = error?.message ||
        error?.error ||
        "Authentication failed";

      toast.showToast("Error", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      style={[styles.keyboardWrap, { backgroundColor: palette.background }]}
    >
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: palette.background }]}
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: palette.text }]}>{isLogin ? "Sign In" : "Sign Up"}</Text>

      {!isLogin && (
        <TextInput
          style={[styles.input, { backgroundColor: palette.input, color: palette.text, borderColor: palette.border }]}
          placeholder="Name"
          placeholderTextColor={palette.placeholder}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={[styles.input, { backgroundColor: palette.input, color: palette.text, borderColor: palette.border }]}
        placeholder="Email"
        placeholderTextColor={palette.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={[styles.input, { backgroundColor: palette.input, color: palette.text, borderColor: palette.border }]}
        placeholder="Password"
        placeholderTextColor={palette.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isLogin ? "Login" : "Register"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} disabled={loading}>
        <Text style={styles.linkText}>
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Sign In"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#0a1b1f",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1f2d35",
    color: "#fff",
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#1abc9c",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#1abc9c80",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkText: {
    color: "#1abc9c",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
});

function getAuthPalette(isDark: boolean) {
  return {
    background: isDark ? "#0a1b1f" : "#F8FAFC",
    text: isDark ? "#FFFFFF" : "#0F172A",
    input: isDark ? "#1f2d35" : "#FFFFFF",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
    placeholder: isDark ? "#94A3B8" : "#718096",
  };
}

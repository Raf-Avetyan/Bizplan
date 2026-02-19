import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import axiosClient from "@/api/axios-client";
import { AuthResponse } from '@/types/auth.types';

export default function SignUp() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }
    if (!isLogin && !name) {
      Alert.alert("Error", "Name is required for registration");
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

        Alert.alert("Success", "Login successful!");
        router.replace("/(root)/(tabs)");
      } else {
        const data: AuthResponse = await axiosClient.post("/auth/register", {
          name,
          email,
          password,
        });

        const { token, user } = data;

        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        Alert.alert("Success", "Registration successful!");
        router.replace("/(root)/(tabs)");
      }
    } catch (error: any) {
      const errorMessage = error?.message ||
        error?.error ||
        "Authentication failed";

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? "Sign In" : "Sign Up"}</Text>

      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
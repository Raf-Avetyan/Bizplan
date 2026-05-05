import { useMemo, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Lock, Sparkles } from "lucide-react-native";
import axiosClient from "@/api/axios-client";
import { AuthResponse } from "@/types/auth.types";
import { useToast } from "@/components/ui/Toast/Toast";
import { useSettings } from "@/lib/settings-context";

type AuthLanguage = "en" | "ru" | "hy";

export default function SignUp() {
  const [mode, setMode] = useState<"login" | "register">("login");
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
  const copy = useMemo(
    () => getAuthCopy((settings.language as AuthLanguage) ?? "en"),
    [settings.language]
  );
  const palette = getAuthPalette(isDark);

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      toast.showToast(copy.errorTitle, copy.emailPasswordRequired, "error");
      return;
    }
    if (mode === "register" && !name.trim()) {
      toast.showToast(copy.errorTitle, copy.nameRequired, "error");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const response: AuthResponse = await axiosClient.post("/auth/login", {
          email: email.trim(),
          password,
        });

        const { token, user } = response;
        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        toast.showToast(copy.successTitle, copy.loginSuccess, "success");
      } else {
        const response: AuthResponse = await axiosClient.post("/auth/register", {
          name: name.trim(),
          email: email.trim(),
          password,
        });

        const { token, user } = response;
        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));

        toast.showToast(copy.successTitle, copy.registerSuccess, "success");
      }

      router.replace(settings.defaultRoute as any);
    } catch (error: any) {
      const message =
        error?.message ||
        error?.error ||
        copy.authFailed;

      toast.showToast(copy.errorTitle, message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={palette.screenGradient} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        style={styles.keyboardWrap}
      >
        <View pointerEvents="none" style={styles.backgroundLayer}>
          <LinearGradient colors={palette.orbPrimary} style={[styles.orb, styles.orbPrimary]} />
          <LinearGradient colors={palette.orbSecondary} style={[styles.orb, styles.orbSecondary]} />
          <View style={[styles.gridGlow, { borderColor: palette.gridBorder }]} />
        </View>
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <View style={[styles.heroPill, { borderColor: palette.heroBorder, backgroundColor: palette.heroPill }]}>
              <Sparkles size={16} color={palette.heroText} />
              <Text style={[styles.heroPillText, { color: palette.heroMuted }]}>{copy.brand}</Text>
            </View>

            <Text style={[styles.heroTitle, { color: palette.heroText }]}>
              {copy.sameProduct1}
            </Text>

            <View style={styles.heroTags}>
              <View style={[styles.heroTag, { backgroundColor: palette.heroTagBackground, borderColor: palette.heroTagBorder }]}>
                <Text style={[styles.heroTagText, { color: palette.heroText }]}>{copy.sameProduct2}</Text>
              </View>
              <View style={[styles.heroTag, { backgroundColor: palette.heroTagBackground, borderColor: palette.heroTagBorder }]}>
                <Text style={[styles.heroTagText, { color: palette.heroText }]}>{copy.sameProduct3}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <View style={styles.cardTopRow}>
              <LinearGradient colors={palette.brandBadgeGradient} style={styles.brandIconWrap}>
                <Sparkles size={18} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.cardTitleWrap}>
                <Text style={[styles.brandTitle, { color: palette.cardText }]}>{mode === "login" ? copy.signIn : copy.signUp}</Text>
                <Text style={[styles.cardKicker, { color: palette.cardMuted }]}>{copy.brand}</Text>
              </View>
            </View>

            <View style={[styles.modeSwitch, { backgroundColor: palette.switchBackground, borderColor: palette.switchBorder }]}>
              <Pressable
                onPress={() => setMode("login")}
                disabled={loading}
                style={[
                  styles.modeButton,
                  mode === "login" ? { backgroundColor: palette.switchActive, shadowColor: "#0F172A" } : null,
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    { color: mode === "login" ? palette.cardText : palette.cardMuted },
                  ]}
                >
                  {copy.signIn}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode("register")}
                disabled={loading}
                style={[
                  styles.modeButton,
                  mode === "register" ? { backgroundColor: palette.switchActive, shadowColor: "#0F172A" } : null,
                ]}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    { color: mode === "register" ? palette.cardText : palette.cardMuted },
                  ]}
                >
                  {copy.signUp}
                </Text>
              </Pressable>
            </View>

            <View style={styles.form}>
              {mode === "register" ? (
                <View style={styles.field}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: palette.input,
                        color: palette.cardText,
                        borderColor: palette.inputBorder,
                      },
                    ]}
                    placeholder={copy.namePlaceholder}
                    placeholderTextColor={palette.inputPlaceholder}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              ) : null}

              <View style={styles.field}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.input,
                      color: palette.cardText,
                      borderColor: palette.inputBorder,
                    },
                  ]}
                  placeholder={copy.emailPlaceholder}
                  placeholderTextColor={palette.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              <View style={styles.field}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.input,
                      color: palette.cardText,
                      borderColor: palette.inputBorder,
                    },
                  ]}
                  placeholder={copy.passwordPlaceholder}
                  placeholderTextColor={palette.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>

              <Pressable disabled={loading} onPress={() => void handleAuth()} style={styles.submitButtonWrap}>
                <LinearGradient colors={palette.submitGradient} style={[styles.submitButton, loading ? styles.submitButtonDisabled : null]}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {mode === "login" ? copy.login : copy.createAccount}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          <View style={styles.bottomNoteWrap}>
            <View style={[styles.bottomNotePill, { borderColor: palette.heroBorder, backgroundColor: palette.heroPill }]}>
              <Lock size={15} color={palette.heroText} />
              <Text style={[styles.bottomNote, { color: palette.heroMuted }]}>
                {copy.bottomCaption}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function getAuthPalette(isDark: boolean) {
  return {
    screenGradient: isDark
      ? (["#24114A", "#24114A", "#24114A"] as const)
      : (["#6A48E0", "#24114A", "#6A48E0"] as const),
    heroText: "#FFFFFF",
    heroMuted: "rgba(255,255,255,0.74)",
    heroPill: "rgba(255,255,255,0.10)",
    heroBorder: "rgba(255,255,255,0.14)",
    heroTagBackground: "rgba(255,255,255,0.10)",
    heroTagBorder: "rgba(255,255,255,0.12)",
    card: isDark ? "rgba(10,12,24,0.76)" : "rgba(255,255,255,0.88)",
    cardBorder: isDark ? "rgba(255,255,255,0.10)" : "rgba(126,92,255,0.12)",
    cardText: isDark ? "#FFFFFF" : "#140F2B",
    cardMuted: isDark ? "rgba(226,232,240,0.68)" : "#6B5CA8",
    switchBackground: isDark ? "rgba(255,255,255,0.06)" : "rgba(106,72,224,0.08)",
    switchBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(106,72,224,0.10)",
    switchActive: isDark ? "rgba(255,255,255,0.10)" : "#FFFFFF",
    input: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.92)",
    inputBorder: isDark ? "rgba(255,255,255,0.10)" : "rgba(126,92,255,0.16)",
    inputPlaceholder: isDark ? "rgba(203,213,225,0.58)" : "#8A7EC0",
    submitGradient: ["#7C5CFF", "#4D2FB2"] as const,
    brandBadgeGradient: ["#A986FF", "#5E37E7"] as const,
    orbPrimary: isDark ? (["rgba(147,51,234,0.42)", "rgba(147,51,234,0.00)"] as const) : (["rgba(124,92,255,0.24)", "rgba(124,92,255,0.00)"] as const),
    orbSecondary: isDark ? (["rgba(56,189,248,0.18)", "rgba(56,189,248,0.00)"] as const) : (["rgba(14,165,233,0.16)", "rgba(14,165,233,0.00)"] as const),
    gridBorder: isDark ? "rgba(255,255,255,0.04)" : "rgba(94,55,231,0.08)",
  };
}

function getAuthCopy(language: AuthLanguage) {
  if (language === "ru") {
    return {
      brand: "Bizplan",
      webAccess: "\u0412\u0435\u0431-\u0434\u043e\u0441\u0442\u0443\u043f",
      sameProduct1: "\u0412\u0430\u0448 \u0431\u0438\u0437\u043d\u0435\u0441 \u0432 \u043a\u0430\u0440\u043c\u0430\u043d\u0435.",
      sameProduct2: "\u041f\u043b\u0430\u043d\u044b, \u0438\u0434\u0435\u0438 \u0438 \u0440\u043e\u0441\u0442.",
      sameProduct3: "\u0412\u0441\u0435 \u0432 \u043e\u0434\u043d\u043e\u043c \u043c\u043e\u0431\u0438\u043b\u044c\u043d\u043e\u043c \u043f\u043e\u0442\u043e\u043a\u0435.",
      description:
        "\u0412\u043e\u0439\u0434\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u0441\u043e\u0437\u0434\u0430\u0432\u0430\u0442\u044c \u0431\u0438\u0437\u043d\u0435\u0441-\u043f\u043b\u0430\u043d\u044b, \u0443\u043f\u0440\u0430\u0432\u043b\u044f\u0442\u044c \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f\u043c\u0438, \u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c \u0441 AI-\u0438\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438 \u0438 \u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0432\u0435\u0441\u044c \u043f\u0440\u043e\u0433\u0440\u0435\u0441\u0441 \u043f\u043e\u0434 \u0440\u0443\u043a\u043e\u0439.",
      signIn: "\u0412\u043e\u0439\u0442\u0438",
      signUp: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f",
      name: "\u0418\u043c\u044f",
      email: "Email",
      password: "\u041f\u0430\u0440\u043e\u043b\u044c",
      namePlaceholder: "Raf",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "********",
      login: "\u0412\u0445\u043e\u0434",
      createAccount: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442",
      switchToRegister: "\u041d\u0435\u0442 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430? \u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044c",
      switchToLogin: "\u0423\u0436\u0435 \u0435\u0441\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442? \u0412\u043e\u0439\u0442\u0438",
      bottomCaption: "\u0411\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u044b\u0439 \u0432\u0445\u043e\u0434. \u0417\u0430\u0449\u0438\u0449\u0435\u043d\u043d\u044b\u0439 \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u0432\u0430\u0448\u0438\u043c \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f\u043c, \u043f\u043b\u0430\u043d\u0430\u043c \u0438 \u0434\u0430\u043d\u043d\u044b\u043c.",
      emailPasswordRequired: "Email \u0438 \u043f\u0430\u0440\u043e\u043b\u044c \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b.",
      nameRequired: "\u0418\u043c\u044f \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e \u0434\u043b\u044f \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438.",
      loginSuccess: "\u0412\u0445\u043e\u0434 \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d.",
      registerSuccess: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u0443\u0441\u043f\u0435\u0448\u043d\u0430.",
      authFailed: "\u041e\u0448\u0438\u0431\u043a\u0430 \u0430\u0443\u0442\u0435\u043d\u0442\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u0438.",
      errorTitle: "\u041e\u0448\u0438\u0431\u043a\u0430",
      successTitle: "\u0423\u0441\u043f\u0435\u0445",
    };
  }

  if (language === "hy") {
    return {
      brand: "Bizplan",
      webAccess: "\u054e\u0565\u0562 \u0574\u0578\u0582\u057f\u0584",
      sameProduct1: "\u0541\u0565\u0580 \u0562\u056b\u0566\u0576\u0565\u057d\u0568 \u0571\u0565\u0580 \u0571\u0565\u057c\u0584\u0578\u0582\u0574 \u0567\u0589",
      sameProduct2: "\u054a\u056c\u0561\u0576\u0576\u0565\u0580, \u0563\u0561\u0572\u0561\u0583\u0561\u0580\u0576\u0565\u0580 \u0587 \u0561\u0573\u0589",
      sameProduct3: "\u0531\u0574\u0565\u0576 \u056b\u0576\u0579\u0568 \u0574\u0565\u056f \u0570\u0561\u0580\u0569\u0561\u056f\u0578\u0582\u0574\u0589",
      description:
        "\u0544\u0578\u0582\u057f\u0584 \u0563\u0578\u0580\u056e\u0565\u0584\u055d \u0562\u056b\u0566\u0576\u0565\u057d \u057a\u056c\u0561\u0576\u0576\u0565\u0580 \u057d\u057f\u0565\u0572\u056e\u0565\u056c\u0578\u0582, \u0568\u0576\u056f\u0565\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0576\u0565\u0580\u0568 \u056f\u0561\u057c\u0561\u057e\u0561\u0580\u0565\u056c\u0578\u0582, AI \u0563\u0578\u0580\u056e\u056b\u0584\u0576\u0565\u0580\u056b \u0570\u0565\u057f \u0561\u0577\u056d\u0561\u057f\u0565\u056c\u0578\u0582 \u0587 \u0571\u0565\u0580 \u0561\u0574\u0562\u0578\u0572\u057b \u0561\u057c\u0561\u057b\u0568\u0576\u0569\u0561\u0581\u0568 \u0574\u0565\u056f \u057f\u0565\u0572\u0578\u0582\u0574 \u057a\u0561\u0570\u0565\u056c\u0578\u0582 \u0570\u0561\u0574\u0561\u0580\u0589",
      signIn: "\u0544\u0578\u0582\u057f\u0584",
      signUp: "\u0533\u0580\u0561\u0576\u0581\u0578\u0582\u0574",
      name: "\u0531\u0576\u0578\u0582\u0576",
      email: "Email",
      password: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c",
      namePlaceholder: "Raf",
      emailPlaceholder: "you@example.com",
      passwordPlaceholder: "********",
      login: "\u0544\u0578\u0582\u057f\u0584 \u0563\u0578\u0580\u056e\u0565\u056c",
      createAccount: "\u054d\u057f\u0565\u0572\u056e\u0565\u056c \u0570\u0561\u0577\u056b\u057e",
      switchToRegister: "\u0540\u0561\u0577\u056b\u057e \u0579\u0578\u0582\u0576\u0565\u055e\u055e\u0564? \u0533\u0580\u0561\u0576\u0581\u057e\u0565\u0584",
      switchToLogin: "\u0531\u0580\u0564\u0565\u0576 \u0578\u0582\u0576\u0565\u055e\u055e\u0564 \u0570\u0561\u0577\u056b\u057e? \u0544\u0578\u0582\u057f\u0584 \u0563\u0578\u0580\u056e\u0565\u0584",
      bottomCaption: "\u0531\u0576\u057e\u057f\u0561\u0576\u0563 \u0574\u0578\u0582\u057f\u0584\u0589 \u054a\u0561\u0577\u057f\u057a\u0561\u0576\u057e\u0561\u056e \u0570\u0561\u057d\u0561\u0576\u0565\u056c\u056b\u0578\u0582\u0569\u0575\u0578\u0582\u0576 \u0571\u0565\u0580 \u0568\u0576\u056f\u0565\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0576\u0565\u0580\u056b\u0576, \u057a\u056c\u0561\u0576\u0576\u0565\u0580\u056b\u0576 \u0587 \u057f\u057e\u0575\u0561\u056c\u0576\u0565\u0580\u056b\u0576\u0589",
      emailPasswordRequired: "Email-\u0568 \u0587 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568 \u057a\u0561\u0580\u057f\u0561\u0564\u056b\u0580 \u0565\u0576\u0589",
      nameRequired: "\u0533\u0580\u0561\u0576\u0581\u0574\u0561\u0576 \u0570\u0561\u0574\u0561\u0580 \u0561\u0576\u0578\u0582\u0576\u0568 \u057a\u0561\u0580\u057f\u0561\u0564\u056b\u0580 \u0567\u0589",
      loginSuccess: "\u0544\u0578\u0582\u057f\u0584\u0568 \u0570\u0561\u057b\u0578\u0572\u057e\u0565\u0581\u0589",
      registerSuccess: "\u0533\u0580\u0561\u0576\u0581\u0578\u0582\u0574\u0568 \u0570\u0561\u057b\u0578\u0572\u057e\u0565\u0581\u0589",
      authFailed: "\u0544\u0578\u0582\u057f\u0584\u056b \u057d\u056d\u0561\u056c\u0589",
      errorTitle: "\u054d\u056d\u0561\u056c",
      successTitle: "\u0540\u0561\u057b\u0578\u0572\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
    };
  }

  return {
    brand: "Bizplan",
    webAccess: "Web access",
    sameProduct1: "Your business in your pocket.",
    sameProduct2: "Plans, ideas, and growth.",
    sameProduct3: "All in one mobile flow.",
    description:
      "Sign in to build business plans, manage companies, use AI tools, and keep your entire business workflow moving from one mobile app.",
    signIn: "Sign In",
    signUp: "Sign Up",
    name: "Name",
    email: "Email",
    password: "Password",
    bottomCaption: "Secure sign-in. Protected access to your companies, plans, and data.",
    namePlaceholder: "Raf",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "********",
    login: "Login",
    createAccount: "Create account",
    switchToRegister: "Don't have an account? Sign Up",
    switchToLogin: "Already have an account? Sign In",
    emailPasswordRequired: "Email and password are required.",
    nameRequired: "Name is required for registration.",
    loginSuccess: "Login successful!",
    registerSuccess: "Registration successful!",
    authFailed: "Authentication failed.",
    errorTitle: "Error",
    successTitle: "Success",
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 44,
    justifyContent: "flex-start",
    gap: 12,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbPrimary: {
    width: 260,
    height: 260,
    top: -70,
    right: -60,
  },
  orbSecondary: {
    width: 220,
    height: 220,
    left: -80,
    top: 180,
  },
  gridGlow: {
    position: "absolute",
    top: 88,
    left: 18,
    right: 18,
    height: 126,
    borderRadius: 28,
    borderWidth: 1,
    opacity: 0.65,
  },
  heroSection: {
    gap: 8,
    paddingTop: 0,
  },
  heroPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.1,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
    maxWidth: 280,
  },
  heroTags: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  heroTag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: "800",
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: "#050510",
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14,
    gap: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  cardTitleWrap: {
    gap: 2,
  },
  cardKicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  modeSwitch: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 4,
    flexDirection: "row",
    gap: 4,
  },
  modeButton: {
    flex: 1,
    borderRadius: 14,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  form: {
    gap: 12,
  },
  field: {
    gap: 0,
  },
  input: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "700",
  },
  submitButtonWrap: {
    marginTop: 50,
  },
  submitButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  bottomNoteWrap: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 0,
    alignItems: "center",
  },
  bottomNotePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bottomNote: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  footerSwitch: {
    paddingTop: 6,
    alignItems: "center",
  },
  footerSwitchText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});

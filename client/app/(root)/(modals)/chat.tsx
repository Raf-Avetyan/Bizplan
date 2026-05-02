import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Copy,
  MessageCircle,
  PencilLine,
  Plus,
  Send,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react-native";
import { useToast } from "@/components/ui/Toast/Toast";
import {
  GeminiChatMessage,
  hasGeminiKey,
  sendChatMessageWithGemini,
} from "@/lib/gemini";
import { useActiveCompany, useCompanies } from "@/hooks/useCompanyQueries";
import { useSettings } from "@/lib/settings-context";
import { accountDataService } from "@/services/account-data.service";
import { Company } from "@/types/company.types";

type UiMessage = GeminiChatMessage & {
  id: string;
};

type ChatSession = {
  id: string;
  title: string;
  companyId: string | null;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
  messages: UiMessage[];
};

const CHAT_STORAGE_KEY = "bizplan-mobile-ai-consultant-history";

function createChatSession(
  company?: { id?: string | null; businessName?: string | null } | null,
): ChatSession {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "New chat",
    companyId: company?.id ?? null,
    companyName: company?.businessName ?? null,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function buildChatTitle(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return "New chat";
  return trimmed.length > 34 ? `${trimmed.slice(0, 34).trim()}...` : trimmed;
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { data: activeCompany } = useActiveCompany();
  const { data: companies = [] } = useCompanies();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const compact = settings.density === "compact";
  const palette = getChatPalette(isDark);
  const t = getChatCopy(settings.language);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [draft, setDraft] = useState("");
  const [isWaitingForReply, setIsWaitingForReply] = useState(false);
  const [isTypingReply, setIsTypingReply] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null);
  const [pendingRenameSessionId, setPendingRenameSessionId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [isPlanSelectorVisible, setIsPlanSelectorVisible] = useState(false);
  const [draftPlanCompanyId, setDraftPlanCompanyId] = useState<string | null>(null);

  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingSessionIdRef = useRef<string | null>(null);
  const typingMessageIdRef = useRef<string | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );
  const messages = activeSession?.messages ?? [];
  const activeChatCompany = useMemo(
    () => {
      if (!activeSession?.companyId) return null;
      return (
        companies.find((company) => company.id === activeSession.companyId) ??
        (activeCompany?.id === activeSession.companyId ? activeCompany : null)
      );
    },
    [activeCompany, activeSession?.companyId, companies],
  );
  const planContext = useMemo(() => buildAiPlanContext(activeChatCompany), [activeChatCompany]);
  const isBusy = isWaitingForReply || isTypingReply;
  const canSend = draft.trim().length > 0 && !isWaitingForReply;

  useEffect(() => {
    void loadSessions();
    return () => stopTyping();
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!sessions.length || !activeSessionId) return;
    async function persistSessions() {
      const payload = { sessions, activeSessionId };
      try {
        await accountDataService.updateAiChats(payload);
      } catch {
        await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
      }
    }

    void persistSessions();
  }, [activeSessionId, sessions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 40);
    return () => clearTimeout(timer);
  }, [messages, isWaitingForReply, activeSessionId]);

  async function loadSessions() {
    try {
      const localRaw = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      const localData = localRaw
        ? (JSON.parse(localRaw) as { sessions?: ChatSession[]; activeSessionId?: string })
        : null;
      let remoteData: { sessions?: ChatSession[]; activeSessionId?: string } | null = null;

      try {
        remoteData = await accountDataService.getAiChats<{ sessions?: ChatSession[]; activeSessionId?: string }>({});
      } catch {
        remoteData = null;
      }

      const remoteSessions = Array.isArray(remoteData?.sessions) ? remoteData.sessions : [];
      const localSessions = Array.isArray(localData?.sessions) ? localData.sessions : [];
      const selectedData = remoteSessions.length > 0 ? remoteData : localData;
      const selectedSessions =
        remoteSessions.length > 0 ? remoteSessions : localSessions;

      if (selectedSessions.length === 0) {
        const initialSession = createChatSession(activeCompany);
        setSessions([initialSession]);
        setActiveSessionId(initialSession.id);
        return;
      }

      setSessions(selectedSessions);
      setActiveSessionId(selectedData?.activeSessionId ?? selectedSessions[0]?.id ?? "");

      if (remoteSessions.length === 0 && localSessions.length > 0) {
        await accountDataService.updateAiChats({
          sessions: localSessions,
          activeSessionId: localData?.activeSessionId ?? localSessions[0]?.id ?? "",
        });
      }
    } catch {
      const initialSession = createChatSession(activeCompany);
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
    }
  }

  function updateSession(sessionId: string, updater: (session: ChatSession) => ChatSession) {
    setSessions((current) =>
      current.map((session) => (session.id === sessionId ? updater(session) : session)),
    );
  }

  function stopTyping() {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    typingSessionIdRef.current = null;
    typingMessageIdRef.current = null;
    setIsTypingReply(false);
  }

  function animateAssistantReply(sessionId: string, messageId: string, text: string) {
    stopTyping();
    typingSessionIdRef.current = sessionId;
    typingMessageIdRef.current = messageId;
    setIsTypingReply(true);

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      updateSession(sessionId, (session) => ({
        ...session,
        updatedAt: new Date().toISOString(),
        messages: session.messages.map((message) =>
          message.id === messageId ? { ...message, text } : message,
        ),
      }));
      setIsTypingReply(false);
      return;
    }

    let index = 0;
    let currentText = "";

    typingIntervalRef.current = setInterval(() => {
      if (typingSessionIdRef.current !== sessionId || typingMessageIdRef.current !== messageId) {
        return;
      }

      if (index < words.length) {
        currentText += `${index === 0 ? "" : " "}${words[index]}`;
        index += 1;

        updateSession(sessionId, (session) => ({
          ...session,
          updatedAt: new Date().toISOString(),
          messages: session.messages.map((message) =>
            message.id === messageId ? { ...message, text: currentText } : message,
          ),
        }));
        return;
      }

      stopTyping();
    }, 45);
  }

  async function handleSend() {
    if (isTypingReply) {
      stopTyping();
      return;
    }

    const message = draft.trim();
    if (!message || isWaitingForReply || !activeSessionId) {
      return;
    }

    if (!hasGeminiKey()) {
      toast.showToast(
        "Missing Gemini key",
        "Add EXPO_PUBLIC_GOOGLEAI_API_KEY to use AI consultant.",
        "warning",
      );
      return;
    }

    const userMessage: UiMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: message,
    };
    const modelMessageId = `${Date.now()}-model`;
    const modelPlaceholder: UiMessage = {
      id: modelMessageId,
      role: "model",
      text: "",
    };

    setDraft("");
    setIsWaitingForReply(true);

    updateSession(activeSessionId, (session) => ({
      ...session,
      title: session.messages.length === 0 ? buildChatTitle(message) : session.title,
      companyId: session.companyId ?? activeCompany?.id ?? null,
      companyName: session.companyName ?? activeCompany?.businessName ?? null,
      updatedAt: new Date().toISOString(),
      messages: [...session.messages, userMessage, modelPlaceholder],
    }));

    try {
      const response = await sendChatMessageWithGemini(
        messages.map(({ role, text }) => ({ role, text })),
        planContext ? `${planContext}\n\nUser question: ${message}` : message,
      );
      setIsWaitingForReply(false);
      animateAssistantReply(activeSessionId, modelMessageId, response);
    } catch (error) {
      setIsWaitingForReply(false);
      const fallback =
        error instanceof Error ? error.message : "Something went wrong with Gemini.";

      updateSession(activeSessionId, (session) => ({
        ...session,
        updatedAt: new Date().toISOString(),
        messages: session.messages.map((entry) =>
          entry.id === modelMessageId ? { ...entry, text: fallback } : entry,
        ),
      }));

      toast.showToast("AI consultant error", fallback, "error", 4500);
    }
  }

  function handleNewChat() {
    stopTyping();
    setIsWaitingForReply(false);
    const nextSession = createChatSession(activeCompany);
    setSessions((current) => [nextSession, ...current]);
    setActiveSessionId(nextSession.id);
    setDraft("");
  }

  function openPlanSelector() {
    setDraftPlanCompanyId(activeSession?.companyId ?? null);
    setIsPlanSelectorVisible(true);
  }

  function selectChatPlan(company: Company | null) {
    if (!activeSessionId) return;

    updateSession(activeSessionId, (session) => ({
      ...session,
      companyId: company?.id ?? null,
      companyName: company?.businessName ?? null,
      updatedAt: new Date().toISOString(),
    }));
    setIsPlanSelectorVisible(false);
  }

  function confirmSelectedPlan() {
    const selectedCompany =
      draftPlanCompanyId === null
        ? null
        : companies.find((company) => company.id === draftPlanCompanyId) ?? null;

    selectChatPlan(selectedCompany);
  }

  function deleteSession(sessionId: string) {
    stopTyping();
    setIsWaitingForReply(false);

    setSessions((current) => {
      const remaining = current.filter((session) => session.id !== sessionId);

      if (remaining.length === 0) {
        const nextSession = createChatSession(activeCompany);
        setActiveSessionId(nextSession.id);
        return [nextSession];
      }

      if (activeSessionId === sessionId) {
        setActiveSessionId(remaining[0].id);
      }

      return remaining;
    });
  }

  function openRenameSession(session: ChatSession) {
    setPendingRenameSessionId(session.id);
    setRenameDraft(session.title);
  }

  function confirmRenameSession() {
    const sessionId = pendingRenameSessionId;
    const nextTitle = renameDraft.trim();

    if (!sessionId) return;

    if (!nextTitle) {
      toast.showToast("Rename chat", "Chat name cannot be empty.", "warning");
      return;
    }

    updateSession(sessionId, (session) => ({
      ...session,
      title: nextTitle.length > 48 ? `${nextTitle.slice(0, 48).trim()}...` : nextTitle,
      updatedAt: new Date().toISOString(),
    }));
    setPendingRenameSessionId(null);
    setRenameDraft("");
  }

  async function copyMessage(text: string) {
    try {
      await Clipboard.setStringAsync(text);
      toast.showToast("Copied", "Message copied to clipboard.", "success");
    } catch {
      toast.showToast("Copy failed", "Could not copy the message.", "error");
    }
  }

  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={[styles.headerButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <ArrowLeft size={20} color={palette.text} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerEyebrow, { color: palette.eyebrow }]}>AI consultant</Text>
              <Text style={[styles.headerTitle, { color: palette.text }]}>
                {activeSession?.title || activeCompany?.businessName || "Business advisor"}
              </Text>
            </View>

            <Pressable onPress={handleNewChat} style={[styles.headerButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Plus size={20} color={palette.text} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            style={styles.sessionScroller}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sessionRow}
          >
            {sessions
              .slice()
              .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
              .map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <Pressable
                    key={session.id}
                    onPress={() => setActiveSessionId(session.id)}
                    style={[
                      styles.sessionPill,
                      { backgroundColor: palette.card, borderColor: palette.border },
                      isActive && styles.sessionPillActive,
                    ]}
                  >
                    <Text
                      style={[styles.sessionPillText, { color: isActive ? "#FFFFFF" : palette.muted }]}
                      numberOfLines={1}
                    >
                      {session.title}
                    </Text>
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        openRenameSession(session);
                      }}
                      hitSlop={8}
                      style={styles.sessionIconButton}
                    >
                      <PencilLine size={14} color={isActive ? "#FFFFFF" : palette.muted} />
                    </Pressable>
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        setPendingDeleteSessionId(session.id);
                      }}
                      hitSlop={8}
                      style={styles.sessionIconButton}
                    >
                      <Trash2 size={14} color={isActive ? "#FFFFFF" : palette.muted} />
                    </Pressable>
                  </Pressable>
                );
              })}
          </ScrollView>

          <View style={styles.chatStage}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesArea}
              contentContainerStyle={[
                styles.messagesContent,
                { paddingTop: compact ? 66 : 76, paddingBottom: isKeyboardVisible ? 132 : 146 },
                compact && { gap: 8 },
              ]}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                  <View style={styles.emptyIcon}>
                    <MessageCircle size={28} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.emptyTitle, { color: palette.text }]}>{t.startConversation}</Text>
                  <Text style={[styles.emptyBody, { color: palette.muted }]}>
                    {t.conversationHint}
                  </Text>

                  <View style={styles.promptList}>
                    {[
                      t.promptGrowth,
                      t.promptImprovePlan,
                      t.promptRisks,
                    ].map((prompt) => (
                      <Pressable key={prompt} onPress={() => setDraft(prompt)} style={[styles.promptButton, { backgroundColor: palette.chip, borderColor: palette.border }]}>
                        <Text style={[styles.promptButtonText, { color: palette.text }]}>{prompt}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                messages.map((message) => {
                  const isModel = message.role === "model";
                  const isLoadingBubble = isModel && isWaitingForReply && message.text.length === 0;

                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageRow,
                        isModel ? styles.messageRowModel : styles.messageRowUser,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          isModel ? styles.modelBubble : [styles.userBubble, { backgroundColor: palette.card, borderColor: palette.border }],
                        ]}
                      >
                        <Text style={[styles.messageText, !isModel && { color: palette.text }, isModel && styles.modelMessageText]}>
                          {isLoadingBubble ? t.thinking : message.text}
                        </Text>

                        {isModel && message.text ? (
                          <Pressable
                            onPress={() => void copyMessage(message.text)}
                            style={styles.copyButton}
                          >
                            <Copy size={14} color="#E5E7EB" />
                            <Text style={styles.copyButtonText}>{t.copy}</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View
              style={[styles.heroPanel, { backgroundColor: palette.floatingPanel, borderColor: palette.border }]}
            >
              <Pressable
                style={styles.activePlanButton}
                onPress={openPlanSelector}
              >
                <View style={styles.activePlanTextWrap}>
                  <Text style={[styles.heroBadgeText, { color: palette.eyebrow }]}>{t.activePlan}</Text>
                  <Text style={[styles.heroPanelTitle, { color: palette.text }]} numberOfLines={1}>
                    {activeChatCompany?.businessName ?? t.generalChat}
                  </Text>
                </View>
                <View style={[styles.changePlanPill, { backgroundColor: palette.chip, borderColor: palette.border }]}>
                  <Text style={[styles.changePlanText, { color: palette.text }]}>{t.change}</Text>
                  <ChevronDown size={14} color={palette.text} />
                </View>
              </Pressable>
            </View>

            <View
              style={[
                styles.inputBar,
                {
                  paddingBottom: isKeyboardVisible
                    ? 6
                    : insets.bottom > 0
                      ? Math.max(insets.bottom - 10, 6)
                      : 6,
                  marginBottom: isKeyboardVisible ? 2 : 8,
                  paddingTop: compact ? 5 : 7,
                  backgroundColor: palette.floatingBar,
                  borderTopColor: "transparent",
                },
              ]}
            >
              <View style={[styles.inputCard, { backgroundColor: palette.inputCard, borderColor: palette.border }]}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={t.inputPlaceholder}
                  placeholderTextColor={palette.placeholder}
                  multiline
                  style={[styles.input, { color: palette.text }]}
                />
                <Pressable
                  onPress={() => void handleSend()}
                  disabled={!canSend && !isTypingReply}
                  style={[
                    styles.sendButton,
                    !canSend && !isTypingReply && styles.sendButtonDisabled,
                  ]}
                >
                  {isTypingReply ? (
                    <Square size={16} color="#FFFFFF" />
                  ) : (
                    <Send size={17} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={pendingDeleteSessionId !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPendingDeleteSessionId(null)}
      >
        <View style={[styles.confirmOverlay, styles.renameOverlay]}>
          <View style={[styles.confirmCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.confirmTitle, { color: palette.text }]}>Delete chat?</Text>
            <Text style={[styles.confirmBody, { color: palette.muted }]}>
              This chat session will be removed from your history.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.confirmButton, { backgroundColor: palette.chip, borderColor: palette.border }]}
                onPress={() => setPendingDeleteSessionId(null)}
              >
                <Text style={[styles.confirmCancelText, { color: palette.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, styles.confirmDeleteButton]}
                onPress={() => {
                  const sessionId = pendingDeleteSessionId;
                  setPendingDeleteSessionId(null);
                  if (sessionId) deleteSession(sessionId);
                }}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={pendingRenameSessionId !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          setPendingRenameSessionId(null);
          setRenameDraft("");
        }}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.confirmTitle, { color: palette.text }]}>{t.renameChat}</Text>
            <Text style={[styles.confirmBody, { color: palette.muted }]}>
              {t.renameChatBody}
            </Text>
            <TextInput
              value={renameDraft}
              onChangeText={setRenameDraft}
              autoFocus
              selectTextOnFocus
              placeholder={t.chatNamePlaceholder}
              placeholderTextColor={palette.placeholder}
              style={[
                styles.renameInput,
                { color: palette.text, backgroundColor: palette.inputCard, borderColor: palette.border },
              ]}
              returnKeyType="done"
              onSubmitEditing={confirmRenameSession}
            />
            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.confirmButton, { backgroundColor: palette.chip, borderColor: palette.border }]}
                onPress={() => {
                  setPendingRenameSessionId(null);
                  setRenameDraft("");
                }}
              >
                <Text style={[styles.confirmCancelText, { color: palette.text }]}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, styles.confirmRenameButton]}
                onPress={confirmRenameSession}
              >
                <Text style={styles.confirmDeleteText}>{t.rename}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPlanSelectorVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsPlanSelectorVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.confirmTitle, { color: palette.text }]}>{t.chooseActivePlan}</Text>
            <Text style={[styles.confirmBody, { color: palette.muted }]}>{t.chooseActivePlanBody}</Text>
            <ScrollView style={styles.planList} contentContainerStyle={styles.planListContent}>
              <Pressable
                style={[
                  styles.planOption,
                  { backgroundColor: palette.chip, borderColor: palette.border },
                  draftPlanCompanyId === null && { borderColor: "#4D2FB2" },
                ]}
                onPress={() => setDraftPlanCompanyId(null)}
              >
                <View style={styles.planOptionTextWrap}>
                  <Text style={[styles.planOptionTitle, { color: palette.text }]}>{t.generalChat}</Text>
                  <Text style={[styles.planOptionBody, { color: palette.muted }]}>{t.generalChatBody}</Text>
                </View>
                {draftPlanCompanyId === null ? <CheckCircle2 size={20} color="#4D2FB2" /> : null}
              </Pressable>

              {companies.map((company) => {
                const isSelected = draftPlanCompanyId === company.id;
                const hasPlan = Boolean(company.additionalData?.business_plan);
                return (
                  <Pressable
                    key={company.id}
                    style={[
                      styles.planOption,
                      { backgroundColor: palette.chip, borderColor: isSelected ? "#4D2FB2" : palette.border },
                    ]}
                    onPress={() => setDraftPlanCompanyId(company.id)}
                  >
                    <View style={styles.planOptionTextWrap}>
                      <Text style={[styles.planOptionTitle, { color: palette.text }]} numberOfLines={1}>
                        {company.businessName}
                      </Text>
                      <Text style={[styles.planOptionBody, { color: hasPlan ? palette.muted : palette.eyebrow }]} numberOfLines={2}>
                        {hasPlan ? t.planAvailable : t.noGeneratedPlan}
                      </Text>
                    </View>
                    {isSelected ? <CheckCircle2 size={20} color="#4D2FB2" /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.confirmButton, { backgroundColor: palette.chip, borderColor: palette.border }]}
                onPress={() => setIsPlanSelectorVisible(false)}
              >
                <Text style={[styles.confirmCancelText, { color: palette.text }]}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, styles.confirmRenameButton]}
                onPress={confirmSelectedPlan}
              >
                <Text style={styles.confirmDeleteText}>{t.applyPlan}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function buildAiPlanContext(company: Company | null) {
  if (!company) return "";

  const plan = company.additionalData?.business_plan as any;
  const pageTitles = Array.isArray(plan?.presentation?.pages)
    ? plan.presentation.pages
        .slice(0, 14)
        .map((page: any) => page?.title)
        .filter(Boolean)
        .join(", ")
    : "";
  const planSnapshot = plan
    ? JSON.stringify({
        metadata: plan.metadata,
        pages: pageTitles,
        executive_summary: plan.executive_summary,
        market_analysis: plan.market_analysis,
        financial_plan: plan.financial_plan,
      }).slice(0, 2600)
    : "No generated business plan is available yet.";

  return [
    "You are BizPlan AI Consultant. Answer using the selected active plan context below.",
    `Active plan/company: ${company.businessName}`,
    `Location: ${company.place || "Not specified"}`,
    `Idea: ${company.idea || "Not specified"}`,
    `Tags: ${company.uniqueTags?.join(", ") || "None"}`,
    `Business plan context: ${planSnapshot}`,
    "When the plan has missing data, say what is missing and give practical next steps.",
  ].join("\n");
}

function getChatCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      activeCompany: "Активная компания",
      noActiveCompany: "Активная компания пока не выбрана. Можно использовать общий чат.",
      startConversation: "Начните деловой диалог",
      conversationHint: "Спросите про рост, бизнес-план, конкурентов, контент или финансирование.",
      promptGrowth: "Дай 3 идеи роста для моей компании.",
      promptImprovePlan: "Как улучшить мой бизнес-план?",
      promptRisks: "Какие риски мне отслеживать в этом месяце?",
      thinking: "Думаю...",
      copy: "Копировать",
      inputPlaceholder: "Ask AI...",
      stop: "Стоп",
      send: "Отправить",
      renameChat: "Переименовать чат",
      renameChatBody: "Введите короткое название, чтобы легче найти этот диалог позже.",
      chatNamePlaceholder: "Название чата",
      cancel: "Отмена",
      applyPlan: "Применить",
      rename: "Переименовать",
      activePlan: "Active plan",
      generalChat: "General chat",
      generalChatBody: "No specific business plan context.",
      change: "Change",
      chooseActivePlan: "Choose active plan",
      chooseActivePlanBody: "Select which company plan this chat should use for AI answers.",
      planAvailable: "Generated business plan available.",
      noGeneratedPlan: "No generated plan yet. AI will use company details only.",
    };
  }

  if (language === "hy") {
    return {
      activeCompany: "Ակտիվ ընկերություն",
      noActiveCompany: "Ակտիվ ընկերություն դեռ ընտրված չէ։ Կարող եք օգտագործել ընդհանուր չատը։",
      startConversation: "Սկսեք նպատակային բիզնես զրույց",
      conversationHint: "Հարցրեք աճի գաղափարներ, բիզնես պլան, մրցակիցներ, կոնտենտ կամ ֆինանսավորում։",
      promptGrowth: "Տուր 3 աճի գաղափար իմ ընկերության համար։",
      promptImprovePlan: "Ինչպե՞ս բարելավեմ իմ բիզնես պլանը։",
      promptRisks: "Ի՞նչ ռիսկեր պետք է վերահսկեմ այս ամիս։",
      thinking: "Մտածում եմ...",
      copy: "Պատճենել",
      inputPlaceholder: "Հարցրեք AI-ին...",
      stop: "Կանգնեցնել",
      send: "Ուղարկել",
      renameChat: "Վերանվանել չատը",
      renameChatBody: "Գրեք կարճ անուն, որ հետո հեշտ գտնեք այս խոսակցությունը։",
      chatNamePlaceholder: "Չատի անուն",
      cancel: "Չեղարկել",
      applyPlan: "Կիրառել",
      rename: "Վերանվանել",
      activePlan: "Active plan",
      generalChat: "General chat",
      generalChatBody: "No specific business plan context.",
      change: "Change",
      chooseActivePlan: "Choose active plan",
      chooseActivePlanBody: "Select which company plan this chat should use for AI answers.",
      planAvailable: "Generated business plan available.",
      noGeneratedPlan: "No generated plan yet. AI will use company details only.",
    };
  }

  return {
    activeCompany: "Active company",
    noActiveCompany: "No active company is selected yet. You can still use a general chat.",
    startConversation: "Start a focused business conversation",
    conversationHint:
      "Ask for growth ideas, business-plan help, competitor analysis, content drafts, or funding guidance.",
    promptGrowth: "Give me 3 growth ideas for my company.",
    promptImprovePlan: "How should I improve my business plan?",
    promptRisks: "What risks should I watch this month?",
    thinking: "Thinking...",
    copy: "Copy",
    inputPlaceholder: "Ask AI...",
    stop: "Stop",
    send: "Send",
    renameChat: "Rename chat",
    renameChatBody: "Add a short name so this conversation is easier to find later.",
    chatNamePlaceholder: "Chat name",
    cancel: "Cancel",
    applyPlan: "Apply",
    rename: "Rename",
    activePlan: "Active plan",
    generalChat: "General chat",
    generalChatBody: "No specific business plan context.",
    change: "Change",
    chooseActivePlan: "Choose active plan",
    chooseActivePlanBody: "Select which company plan this chat should use for AI answers.",
    planAvailable: "Generated business plan available.",
    noGeneratedPlan: "No generated plan yet. AI will use company details only.",
  };
}

function getChatPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#CBD5E1" : "#475569",
    eyebrow: isDark ? "rgba(229,231,235,0.6)" : "#64748B",
    card: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.88)",
    chip: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
    inputBar: isDark ? "rgba(9,11,20,0.94)" : "rgba(248,250,252,0.96)",
    inputCard: isDark ? "#0F172A" : "#FFFFFF",
    floatingPanel: isDark ? "#0F172A" : "#FFFFFF",
    floatingBar: "transparent",
    placeholder: isDark ? "#64748B" : "#718096",
  };
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 2,
  },
  headerEyebrow: {
    color: "rgba(229,231,235,0.6)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  sessionScroller: {
    maxHeight: 48,
    flexGrow: 0,
  },
  sessionRow: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 10,
    alignItems: "center",
  },
  sessionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 220,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sessionPillActive: {
    backgroundColor: "#4D2FB2",
    borderColor: "rgba(255,255,255,0.12)",
  },
  sessionPillText: {
    flexShrink: 1,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },
  sessionPillTextActive: {
    color: "#FFFFFF",
  },
  sessionIconButton: {
    padding: 3,
    marginRight: -2,
  },
  chatStage: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  heroPanel: {
    position: "absolute",
    top: 8,
    left: 18,
    right: 18,
    zIndex: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 10,
  },
  activePlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  activePlanTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  heroBadgeText: {
    color: "#E5E7EB",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroPanelTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    marginTop: 2,
  },
  changePlanPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  changePlanText: {
    fontSize: 12,
    fontWeight: "800",
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 12,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 20,
    gap: 12,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#4D2FB2",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  emptyBody: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  promptList: {
    gap: 10,
  },
  promptButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  promptButtonText: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowModel: {
    justifyContent: "flex-start",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
  },
  modelBubble: {
    borderColor: "rgba(167,139,250,0.28)",
    backgroundColor: "rgba(77,47,178,0.92)",
    borderBottomLeftRadius: 8,
  },
  userBubble: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.92)",
    borderBottomRightRadius: 8,
  },
  messageText: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 22,
  },
  modelMessageText: {
    color: "#FFFFFF",
  },
  copyButton: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyButtonText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "700",
  },
  inputBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: "rgba(9,11,20,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  inputCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.92)",
    padding: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    maxHeight: 86,
    minHeight: 38,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 42,
    minWidth: 42,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#4D2FB2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  renameOverlay: {
    justifyContent: "flex-start",
    paddingTop: 150,
  },
  confirmCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  confirmBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmDeleteButton: {
    backgroundColor: "#DC2626",
    borderColor: "#DC2626",
  },
  confirmRenameButton: {
    backgroundColor: "#4D2FB2",
    borderColor: "#4D2FB2",
  },
  renameInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "700",
  },
  planList: {
    maxHeight: 340,
  },
  planListContent: {
    gap: 10,
    paddingBottom: 4,
  },
  planOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  planOptionTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  planOptionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  planOptionBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: "800",
  },
  confirmDeleteText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});

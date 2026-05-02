import React, { useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Copy, FileText, Trash2 } from "lucide-react-native";
import { useToast } from "@/components/ui/Toast/Toast";
import { getClipboardText, getToolPalette, ToolOutputPreview } from "@/components/tools/ToolWorkspaceScreen";
import { useActiveCompany, useCompanies } from "@/hooks/useCompanyQueries";
import { deleteToolDocument, getToolDocuments, ToolDocument } from "@/lib/tool-documents";
import { useSettings } from "@/lib/settings-context";

export default function MyDocumentsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getDocumentsPalette(isDark);
  const previewPalette = getToolPalette(isDark);
  const t = getDocumentsCopy(settings.language);
  const { data: activeCompany } = useActiveCompany();
  const { data: companies = [] } = useCompanies();

  const [documents, setDocuments] = useState<ToolDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setIsLoading(true);
      setDocuments(await getToolDocuments());
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy(document: ToolDocument) {
    await Clipboard.setStringAsync(getClipboardText(document.type, document.content));
    toast.showToast(t.copied, t.copiedBody, "success");
  }

  async function handleDelete(id: string) {
    await deleteToolDocument(id);
    if (expandedId === id) setExpandedId(null);
    await loadDocuments();
    toast.showToast(t.deleted, t.deletedBody, "success");
  }

  const hasBusinessPlan = Boolean(activeCompany?.additionalData?.business_plan);

  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.headerButton, { backgroundColor: palette.headerButton, borderColor: palette.border }]}
            >
              <ArrowLeft size={20} color={palette.text} />
            </Pressable>
          </View>

          <LinearGradient
            colors={palette.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={[styles.eyebrow, { color: palette.heroEyebrow }]}>{t.dashboardTool}</Text>
            <Text style={[styles.heroTitle, { color: palette.heroText }]}>{t.myDocuments}</Text>
            <Text style={[styles.heroBody, { color: palette.heroMuted }]}>
              {t.heroBody}
            </Text>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: palette.heroChip }]}>
                <Text style={[styles.summaryValue, { color: palette.heroText }]}>{documents.length}</Text>
                <Text style={[styles.summaryLabel, { color: palette.heroMuted }]}>{t.savedToolDocs}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: palette.heroChip }]}>
                <Text style={[styles.summaryValue, { color: palette.heroText }]}>{companies.length}</Text>
                <Text style={[styles.summaryLabel, { color: palette.heroMuted }]}>{t.companies}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{t.businessPlanStatus}</Text>
            <Text style={[styles.sectionBody, { color: palette.muted }]}>
              {activeCompany
                ? hasBusinessPlan
                  ? t.hasPlan(activeCompany.businessName)
                  : t.noSavedPlan(activeCompany.businessName)
                : t.noActiveCompany}
            </Text>
            <Pressable
              style={styles.inlineButton}
              onPress={() => router.push(activeCompany ? "/(root)/(tabs)/plan" : "/companies")}
            >
              <Text style={styles.inlineButtonText}>
                {activeCompany ? t.openPlan : t.chooseCompany}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>{t.savedDocuments}</Text>

            {isLoading ? (
              <ActivityIndicator color={palette.accent} />
            ) : documents.length === 0 ? (
              <Text style={[styles.sectionBody, { color: palette.muted }]}>
                {t.noSavedDocuments}
              </Text>
            ) : (
              <View style={styles.list}>
                {documents.map((document) => {
                  const expanded = expandedId === document.id;
                  return (
                    <LinearGradient
                      key={document.id}
                      colors={palette.documentGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.documentCard,
                        { borderColor: palette.border },
                      ]}
                    >
                      <Pressable
                        style={styles.documentHeader}
                        onPress={() => setExpandedId(expanded ? null : document.id)}
                      >
                        <View style={[styles.documentIcon, { backgroundColor: palette.iconBackground }]}>
                          <FileText size={16} color="#FFFFFF" />
                        </View>
                        <View style={styles.documentTextWrap}>
                          <Text style={[styles.documentTitle, { color: palette.text }]}>{document.title}</Text>
                          <Text style={[styles.documentMeta, { color: palette.muted }]}>
                            {document.type} - {document.companyName ?? t.general} - {new Date(document.updatedAt).toLocaleDateString(t.locale)}
                          </Text>
                        </View>
                      </Pressable>

                      {expanded ? (
                        <>
                          <Text style={[styles.promptText, { color: palette.muted }]}>{t.prompt}: {document.prompt}</Text>
                          <ToolOutputPreview
                            type={document.type}
                            content={document.content}
                            companyName={document.companyName ?? t.general}
                            palette={previewPalette}
                            compact
                            wide
                          />
                          <View style={styles.actionRow}>
                            <Pressable
                              style={[
                                styles.smallAction,
                                { backgroundColor: palette.actionBackground, borderColor: palette.border },
                              ]}
                              onPress={() => void handleCopy(document)}
                            >
                              <Copy size={14} color={palette.text} />
                              <Text style={[styles.smallActionText, { color: palette.text }]}>{t.copy}</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.smallAction, styles.smallActionDanger]}
                              onPress={() =>
                                toast.showConfirm(
                                  t.deleteDocument,
                                  t.deleteDocumentBody,
                                  () => {
                                    void handleDelete(document.id);
                                  },
                                  {
                                    type: "warning",
                                    confirmText: t.delete,
                                    cancelText: t.cancel,
                                  },
                                )
                              }
                            >
                              <Trash2 size={14} color="#FCA5A5" />
                              <Text style={styles.smallActionDangerText}>{t.delete}</Text>
                            </Pressable>
                          </View>
                        </>
                      ) : null}
                    </LinearGradient>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getDocumentsCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      locale: "ru-RU",
      dashboardTool: "Инструмент панели",
      myDocuments: "Мои документы",
      heroBody: "Просматривайте сохраненные маркетинг-материалы и состояние созданного плана активной компании.",
      savedToolDocs: "сохраненных документов",
      companies: "компании",
      businessPlanStatus: "Статус бизнес-плана",
      hasPlan: (name: string) => `У ${name} уже есть созданный бизнес-план.`,
      noSavedPlan: (name: string) => `${name} активна, но бизнес-план еще не сохранен.`,
      noActiveCompany: "Активная компания сейчас не выбрана.",
      openPlan: "Открыть план",
      chooseCompany: "Выбрать компанию",
      savedDocuments: "Сохраненные документы",
      noSavedDocuments: "Сохраненных документов пока нет. Создайте контент в маркетинг-инструментах, и он появится здесь.",
      general: "Общее",
      prompt: "Prompt",
      copy: "Копировать",
      copied: "Скопировано",
      copiedBody: "Документ скопирован.",
      deleted: "Удалено",
      deletedBody: "Документ удален из сохраненных результатов.",
      deleteDocument: "Удалить документ",
      deleteDocumentBody: "Этот сохраненный результат будет удален из документов.",
      delete: "Удалить",
      cancel: "Отмена",
    };
  }

  if (language === "hy") {
    return {
      locale: "hy-AM",
      dashboardTool: "Dashboard գործիք",
      myDocuments: "Իմ փաստաթղթերը",
      heroBody: "Դիտեք պահված մարքեթինգ արդյունքները և ակտիվ ընկերության ստեղծված պլանի վիճակը։",
      savedToolDocs: "պահված փաստաթուղթ",
      companies: "ընկերություններ",
      businessPlanStatus: "Բիզնես պլանի վիճակ",
      hasPlan: (name: string) => `${name}-ը արդեն ունի ստեղծված բիզնես պլան։`,
      noSavedPlan: (name: string) => `${name}-ը ակտիվ է, բայց բիզնես պլանը դեռ պահված չէ։`,
      noActiveCompany: "Ակտիվ ընկերություն հիմա ընտրված չէ։",
      openPlan: "Բացել պլանը",
      chooseCompany: "Ընտրել ընկերություն",
      savedDocuments: "Պահված փաստաթղթեր",
      noSavedDocuments: "Պահված փաստաթղթեր դեռ չկան։ Ստեղծեք կոնտենտ marketing tools-ում, և այն կհայտնվի այստեղ։",
      general: "Ընդհանուր",
      prompt: "Prompt",
      copy: "Պատճենել",
      copied: "Պատճենված է",
      copiedBody: "Փաստաթուղթը պատճենվեց։",
      deleted: "Ջնջված է",
      deletedBody: "Документ удален из сохраненных результатов.",
      deleteDocument: "Ջնջել փաստաթուղթը",
      deleteDocumentBody: "Этот сохраненный результат будет удален из документов.",
      delete: "Ջնջել",
      cancel: "Չեղարկել",
    };
  }

  return {
    locale: "en-US",
    dashboardTool: "Dashboard tool",
    myDocuments: "My documents",
    heroBody: "Review saved marketing outputs and keep track of the active company's generated plan state.",
    savedToolDocs: "saved tool docs",
    companies: "companies",
    businessPlanStatus: "Business plan status",
    hasPlan: (name: string) => `${name} already has a generated business plan.`,
    noSavedPlan: (name: string) => `${name} is active, but its business plan is not saved yet.`,
    noActiveCompany: "No active company is selected right now.",
    openPlan: "Open plan",
    chooseCompany: "Choose company",
    savedDocuments: "Saved documents",
    noSavedDocuments: "No saved tool documents yet. Generate content from the marketing tools screens and it will appear here.",
    general: "General",
    prompt: "Prompt",
    copy: "Copy",
    copied: "Copied",
    copiedBody: "Document copied to clipboard.",
    deleted: "Deleted",
    deletedBody: "Документ удален из сохраненных результатов.",
    deleteDocument: "Delete document",
    deleteDocumentBody: "Этот сохраненный результат будет удален из документов.",
    delete: "Delete",
    cancel: "Cancel",
  };
}

function getDocumentsPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    heroGradient: isDark
      ? (["rgba(77,47,178,0.96)", "rgba(24,59,53,0.92)", "rgba(9,11,20,0.94)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(238,232,255,0.94)", "rgba(232,246,241,0.96)"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#CBD5E1" : "#475569",
    heroText: isDark ? "#FFFFFF" : "#0F172A",
    heroMuted: isDark ? "#CBD5E1" : "#475569",
    heroEyebrow: isDark ? "rgba(229,231,235,0.62)" : "#64748B",
    card: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.90)",
    innerCard: isDark ? "rgba(255,255,255,0.03)" : "rgba(248,250,252,0.92)",
    documentGradient: isDark
      ? (["rgba(255,255,255,0.04)", "rgba(24,59,53,0.22)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(239,253,246,0.94)", "rgba(245,243,255,0.90)"] as const),
    headerButton: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.88)",
    actionBackground: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
    heroChip: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.72)",
    iconBackground: "#4D2FB2",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
    accent: isDark ? "#A78BFA" : "#4D2FB2",
  };
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    gap: 12,
  },
  eyebrow: {
    color: "rgba(229,231,235,0.62)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  heroBody: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  summaryLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionBody: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  inlineButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#4D2FB2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  list: {
    gap: 10,
  },
  documentCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
    gap: 10,
  },
  documentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  documentIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#4D2FB2",
    alignItems: "center",
    justifyContent: "center",
  },
  documentTextWrap: {
    flex: 1,
    gap: 4,
  },
  documentTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  documentMeta: {
    color: "#94A3B8",
    fontSize: 12,
  },
  promptText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
  },
  documentContent: {
    color: "#F8FAFC",
    fontSize: 13,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  smallAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallActionText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "700",
  },
  smallActionDanger: {
    borderColor: "rgba(248,113,113,0.18)",
    backgroundColor: "rgba(127,29,29,0.18)",
  },
  smallActionDangerText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "700",
  },
});


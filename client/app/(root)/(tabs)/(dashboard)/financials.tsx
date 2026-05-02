import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, DollarSign, Save, TrendingUp } from "lucide-react-native";
import { useActiveCompany } from "@/hooks/useCompanyQueries";
import { companyService } from "@/services/company.service";
import { useToast } from "@/components/ui/Toast/Toast";
import { useSettings } from "@/lib/settings-context";

type Language = "en" | "ru" | "hy";

function palette(isDark: boolean) {
  return {
    gradient: isDark ? (["#090B14", "#111827", "#183B35"] as const) : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    hero: isDark ? (["rgba(77,47,178,0.96)", "rgba(24,59,53,0.92)", "rgba(9,11,20,0.94)"] as const) : (["#FFFFFF", "#F4FBFF", "#EEF7FF"] as const),
    card: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.92)",
    input: isDark ? "rgba(2,6,23,0.64)" : "rgba(255,255,255,0.96)",
    text: isDark ? "#FFFFFF" : "#0F172A", muted: isDark ? "#CBD5E1" : "#475569",
    border: isDark ? "rgba(255,255,255,0.09)" : "rgba(15,23,42,0.10)", chip: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.05)", accent: isDark ? "#DFAE55" : "#B7791F",
  };
}

function getCopy(language: Language) {
  if (language === "ru") return {
    badge: "Финансовая рабочая зона", title: "Финансы", body: (name: string) => `Редактируйте стартовые расходы, выручку, затраты и финансирование для ${name}.`,
    profit: "Месячная прибыль", runway: "Runway от финансирования", startupCost: "Стартовые расходы", monthlyRevenue: "Месячная выручка", monthlyCost: "Месячные затраты", fundingNeeded: "Нужно финансирование", save: "Сохранить финансы", saved: "Сохранено", savedBody: "Финансы компании обновлены.", error: "Ошибка", failed: "Не удалось сохранить финансы", month: "мес",
  };
  if (language === "hy") return {
    badge: "Ֆինանսական workspace", title: "Ֆինանսներ", body: (name: string) => `Խմբագրեք startup cost-ը, եկամուտը, ծախսերը և ֆինանսավորումը ${name}-ի համար։`,
    profit: "Ամսական շահույթ", runway: "Runway ֆինանսավորումից", startupCost: "Startup cost", monthlyRevenue: "Ամսական եկամուտ", monthlyCost: "Ամսական ծախս", fundingNeeded: "Անհրաժեշտ ֆինանսավորում", save: "Պահել ֆինանսները", saved: "Պահված է", savedBody: "Ընկերության ֆինանսները թարմացվեցին։", error: "Սխալ", failed: "Չհաջողվեց պահել ֆինանսները", month: "ամիս",
  };
  return {
    badge: "Financial workspace", title: "Financials", body: (name: string) => `Edit startup cost, revenue, costs, funding, and see instant cash-flow signals for ${name}.`,
    profit: "Monthly profit", runway: "Runway from funding", startupCost: "Startup cost", monthlyRevenue: "Monthly revenue", monthlyCost: "Monthly cost", fundingNeeded: "Funding needed", save: "Save financials", saved: "Saved", savedBody: "Financials updated for this company.", error: "Error", failed: "Failed to save financials", month: "mo",
  };
}

export default function FinancialsScreen() {
  const router = useRouter(); const toast = useToast(); const queryClient = useQueryClient(); const { data: activeCompany, isLoading } = useActiveCompany(); const { settings } = useSettings();
  const colorScheme = useColorScheme(); const isDark = (settings.theme === "system" ? colorScheme : settings.theme) !== "light"; const p = palette(isDark); const t = getCopy(settings.language as Language);
  const [isSaving, setIsSaving] = useState(false); const [startupCost, setStartupCost] = useState(""); const [monthlyRevenue, setMonthlyRevenue] = useState(""); const [monthlyCost, setMonthlyCost] = useState(""); const [fundingNeeded, setFundingNeeded] = useState("");

  useEffect(() => { const financialData = activeCompany?.financialData ?? {}; setStartupCost(financialData.startupCost !== undefined ? String(financialData.startupCost) : ""); setMonthlyRevenue(financialData.monthlyRevenue !== undefined ? String(financialData.monthlyRevenue) : ""); setMonthlyCost(financialData.monthlyCost !== undefined ? String(financialData.monthlyCost) : ""); setFundingNeeded(financialData.fundingNeeded !== undefined ? String(financialData.fundingNeeded) : ""); }, [activeCompany?.id]);

  const numbers = useMemo(() => { const revenue = Number(monthlyRevenue) || 0; const cost = Number(monthlyCost) || 0; const profit = revenue - cost; const runway = cost > 0 ? Math.max(0, Math.floor((Number(fundingNeeded) || 0) / cost)) : 0; return { profit, runway }; }, [monthlyRevenue, monthlyCost, fundingNeeded]);

  async function save() {
    if (!activeCompany?.id) return; setIsSaving(true);
    try {
      await companyService.addFinancialData(activeCompany.id, { startupCost: Number(startupCost) || 0, monthlyRevenue: Number(monthlyRevenue) || 0, monthlyCost: Number(monthlyCost) || 0, fundingNeeded: Number(fundingNeeded) || 0, revenue: Number(monthlyRevenue) || 0, expenses: Number(monthlyCost) || 0, profit: numbers.profit });
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["activeCompany"] }), queryClient.invalidateQueries({ queryKey: ["companies"] })]);
      toast.showToast(t.saved, t.savedBody, "success");
    } catch (error) { toast.showToast(t.error, error instanceof Error ? error.message : t.failed, "error"); } finally { setIsSaving(false); }
  }

  if (isLoading) return <LinearGradient colors={p.gradient} style={styles.center}><ActivityIndicator color={p.text} /></LinearGradient>;

  return <LinearGradient colors={p.gradient} style={styles.gradient}><SafeAreaView style={styles.safeArea}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardWrap}><ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.headerButton, { backgroundColor: p.card, borderColor: p.border }]}><ArrowLeft size={20} color={p.text} /></Pressable></View>
    <LinearGradient colors={p.hero} style={[styles.hero, { borderColor: p.border }]}><View style={[styles.badge, { backgroundColor: p.chip, borderColor: p.border }]}><BarChart3 size={14} color={p.accent} /><Text style={[styles.badgeText, { color: p.muted }]}>{t.badge}</Text></View><Text style={[styles.heroTitle, { color: p.text }]}>{t.title}</Text><Text style={[styles.heroBody, { color: p.muted }]}>{t.body(activeCompany?.businessName ?? "your company")}</Text></LinearGradient>
    <View style={styles.metricsGrid}><Metric label={t.profit} value={`$${numbers.profit.toLocaleString()}`} icon={TrendingUp} palette={p} /><Metric label={t.runway} value={`${numbers.runway} ${t.month}`} icon={DollarSign} palette={p} /></View>
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}><MoneyInput label={t.startupCost} value={startupCost} onChangeText={setStartupCost} palette={p} /><MoneyInput label={t.monthlyRevenue} value={monthlyRevenue} onChangeText={setMonthlyRevenue} palette={p} /><MoneyInput label={t.monthlyCost} value={monthlyCost} onChangeText={setMonthlyCost} palette={p} /><MoneyInput label={t.fundingNeeded} value={fundingNeeded} onChangeText={setFundingNeeded} palette={p} /><Pressable disabled={isSaving} onPress={save} style={styles.saveButton}>{isSaving ? <ActivityIndicator color="#0F172A" /> : <Save size={16} color="#0F172A" />}<Text style={styles.saveButtonText}>{t.save}</Text></Pressable></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView></LinearGradient>;
}

function Metric({ label, value, icon: Icon, palette: p }: { label: string; value: string; icon: any; palette: ReturnType<typeof palette> }) { return <View style={[styles.metric, { backgroundColor: p.card, borderColor: p.border }]}><Icon size={18} color={p.accent} /><Text style={[styles.metricValue, { color: p.text }]}>{value}</Text><Text style={[styles.metricLabel, { color: p.muted }]}>{label}</Text></View>; }
function MoneyInput({ label, value, onChangeText, palette: p }: { label: string; value: string; onChangeText: (value: string) => void; palette: ReturnType<typeof palette> }) { return <View style={styles.field}><Text style={[styles.label, { color: p.muted }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType="numeric" placeholder="0" placeholderTextColor={p.muted} style={[styles.input, { backgroundColor: p.input, borderColor: p.border, color: p.text }]} /></View>; }

const styles = StyleSheet.create({
  gradient: { flex: 1 }, safeArea: { flex: 1 }, keyboardWrap: { flex: 1 }, center: { flex: 1, justifyContent: "center", alignItems: "center" }, scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 130, gap: 16 }, header: { flexDirection: "row", justifyContent: "space-between" }, headerButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" }, hero: { borderRadius: 28, borderWidth: 1, padding: 20, gap: 12 }, badge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 }, badgeText: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: "800" }, heroTitle: { fontSize: 30, fontWeight: "900" }, heroBody: { fontSize: 13, lineHeight: 21 }, metricsGrid: { flexDirection: "row", gap: 12 }, metric: { flex: 1, borderRadius: 22, borderWidth: 1, padding: 16, gap: 6 }, metricValue: { fontSize: 24, fontWeight: "900" }, metricLabel: { fontSize: 12, fontWeight: "700" }, card: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 14 }, field: { gap: 7 }, label: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 }, input: { minHeight: 50, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, fontWeight: "800" }, saveButton: { marginTop: 4, borderRadius: 18, backgroundColor: "#FFFFFF", paddingVertical: 14, flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" }, saveButtonText: { color: "#0F172A", fontWeight: "900", fontSize: 15 },
});

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image as RNImage, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useColorScheme, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useRouter } from "expo-router";
import { ArrowLeft, BadgePlus, BookOpen, Box, BringToFront, Brush, Cloud, Compass, Copy, Download, FileText, Folder, Grid2X2, Image, Layers, Maximize2, Mic, MousePointer2, Pencil, Plus, Presentation, Save, Search, SendToBack, Sparkles, Square, Table2, TextCursorInput, Trash2, Type, Undo2, Redo2, Upload, Wand2, X as XIcon } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveCompany, useCompanyAdditionalData } from "@/hooks/useCompanyQueries";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/components/ui/Toast/Toast";
import { companyService } from "@/services/company.service";

type ToolKind = "pitch-deck" | "guides" | "market-research";
type Language = "en" | "ru" | "hy";
type Format = "presentation" | "instagram" | "facebook" | "story" | "flyer" | "product";
type ElementType = "heading" | "text" | "shape" | "image" | "badge" | "button";
type ShapeKind = "triangle" | "pentagon" | "star" | "spark" | "arrow-right" | "arrow-left" | "arrow-up" | "line" | "dash" | "flowchart" | "table" | "kpi" | "stat" | "progress" | "browser" | "qr" | "phone" | "chart" | "quote" | "checklist" | "video" | "form" | "file" | "diagram" | "music";
type EditorPanel = "templates" | "elements" | "text" | "style" | "animation" | "downloads" | "instruments" | "brand" | "uploads" | "photo" | "background" | "captions" | null;
type ExportKind = "pdf" | "json" | "canva" | "html" | "ppt" | "svg";
type DrawingTool = "pen" | "pencil" | "marker" | null;
type DesignElement = { id: string; type: ElementType; text: string; x: number; y: number; width: number; height: number; color: string; backgroundColor: string; fontSize: number; radius: number; fontWeight?: "600" | "800" | "900"; fontStyle?: "normal" | "italic"; fontFamily?: string; letterSpacing?: number; lineHeight?: number; textDecorationLine?: "none" | "underline" | "line-through" | "underline line-through"; textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"; opacity?: number; imageUri?: string; imageFit?: "cover" | "contain" | "stretch"; blurRadius?: number; borderColor?: string; borderWidth?: number; borderStyle?: "solid" | "dashed" | "dotted"; textAlign?: "left" | "center" | "right"; rotation?: number; shadow?: boolean; animation?: "none" | "fade" | "pop" | "rise" | "pan" | "breathe" | "tumble"; textEffect?: "none" | "shadow" | "lift" | "outline" | "glow" | "background"; imageFilter?: "none" | "warm" | "cool" | "mono" | "vivid"; shadowColor?: string; shapeKind?: ShapeKind };
type DesignPage = { id: string; title: string; format: Format; background: string; elements: DesignElement[] };
type SavedDocument = { generatedAt: string; sections: Array<{ title: string; body: string; bullets?: string[] }> };
type OldSlide = { id: string; title: string; subtitle: string; bullets: string[]; accent: string };

const SWATCHES = ["#111827", "#4D2FB2", "#183B35", "#DFAE55", "#01A06D", "#0EA5E9", "#F97316", "#EF4444", "#FFFFFF", "#F8FAFC", "#FDE68A", "#BFDBFE"];
const PHOTO_TOPICS = [
  "business office team", "startup founders", "finance laptop charts", "students classroom english", "cafe shop business", "product photography", "flower shop", "software developer workspace", "marketing team", "retail store", "restaurant kitchen", "fitness studio", "beauty salon", "medical clinic", "law office", "real estate interior", "delivery logistics", "handmade products", "online education", "conference speaker", "customer service", "small business owner", "modern coworking", "bakery storefront", "fashion boutique", "technology dashboard", "warehouse team", "architecture studio", "creative agency", "eco products",
];
const BACKGROUND_TOPICS = [
  "paper texture", "soft fabric texture", "blue abstract background", "warm sunset gradient", "white marble texture", "lavender field", "wood texture", "minimal studio backdrop", "water texture", "green botanical background", "concrete wall texture", "cream paper", "pastel gradient", "dark luxury texture", "gold foil texture", "linen background", "cloud background", "geometric pattern", "light workspace background", "neutral product backdrop",
];
function imageSearchUri(topic: string, index: number, size: "square" | "wide" = "square") {
  const dimensions = size === "wide" ? "1200x900" : "900x900";
  return `https://source.unsplash.com/${dimensions}/?${encodeURIComponent(topic)}&sig=${index + 101}`;
}
function titleCase(value: string) {
  return value.replace(/\w/g, (letter) => letter.toUpperCase());
}
const PHOTO_LIBRARY = Array.from({ length: 720 }, (_, index) => {
  const query = PHOTO_TOPICS[index % PHOTO_TOPICS.length];
  return { title: `${titleCase(query)} ${index + 1}`, query, uri: imageSearchUri(query, index, "square") };
});
const BACKGROUND_LIBRARY = Array.from({ length: 720 }, (_, index) => {
  const query = BACKGROUND_TOPICS[index % BACKGROUND_TOPICS.length];
  return { title: `${titleCase(query)} ${index + 1}`, query, uri: imageSearchUri(query, index, "wide") };
});
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function getExportUri(fileName: string) {
  const directory = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? (FileSystem as any).Paths?.cache?.uri ?? (FileSystem as any).Paths?.document?.uri;
  if (!directory) throw new Error("Export storage is not available on this device.");
  return `${directory.endsWith("/") ? directory : `${directory}/`}${fileName}`;
}
async function writeExportFile(fileName: string, body: string) {
  const anyFileSystem = FileSystem as any;
  if (typeof anyFileSystem.writeAsStringAsync === "function") {
    const uri = getExportUri(fileName);
    await anyFileSystem.writeAsStringAsync(uri, body, { encoding: anyFileSystem.EncodingType?.UTF8 ?? "utf8" });
    return uri;
  }
  if (anyFileSystem.File && anyFileSystem.Paths?.cache) {
    const file = new anyFileSystem.File(anyFileSystem.Paths.cache, fileName);
    await file.write(body);
    return file.uri;
  }
  throw new Error("Export storage is not available on this device.");
}
async function shareExport(uri: string, kind: ExportKind) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, exportShareOptions(kind));
    return;
  }
  await Clipboard.setStringAsync(uri);
}
function exportShareOptions(kind: ExportKind) {
  if (kind === "svg") return { mimeType: "image/svg+xml", UTI: "public.svg-image", dialogTitle: "Export SVG" };
  if (kind === "pdf") return { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Export PDF" };
  if (kind === "json" || kind === "canva") return { mimeType: "application/json", UTI: "public.json", dialogTitle: "Export project" };
  return { mimeType: "text/html", UTI: "public.html", dialogTitle: kind === "ppt" ? "Export PowerPoint-compatible HTML" : "Export HTML" };
}

function getPalette(isDark: boolean) {
  return {
    gradient: isDark ? (["#090B14", "#111827", "#183B35"] as const) : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    hero: isDark ? (["rgba(77,47,178,0.96)", "rgba(24,59,53,0.92)", "rgba(9,11,20,0.94)"] as const) : (["#FFFFFF", "#F4FBFF", "#EEF7FF"] as const),
    cardGradient: isDark ? (["rgba(15,23,42,0.88)", "rgba(18,49,46,0.76)"] as const) : (["rgba(255,255,255,0.98)", "rgba(240,253,250,0.94)", "rgba(239,246,255,0.94)"] as const),
    workspace: isDark ? "#10131E" : "#E8ECF4",
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#CBD5E1" : "#475569",
    border: isDark ? "rgba(255,255,255,0.09)" : "rgba(15,23,42,0.10)",
    card: isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.94)",
    input: isDark ? "rgba(2,6,23,0.70)" : "rgba(255,255,255,0.96)",
    chip: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
    accent: isDark ? "#DFAE55" : "#B7791F",
    purple: "#4D2FB2",
    danger: "#DC2626",
  };
}

function getCopy(language: Language, kind: ToolKind) {
  const en = {
    save: "Save", saved: "Saved", copied: "Copied", error: "Error", failedSave: "Failed to save", savedSuccess: "Saved to company workspace.", regenerate: "Regenerate",
    noCompany: "No active company", noCompanyBody: "Create or activate a company first so this tool can use the right business context.",
    title: kind === "pitch-deck" ? "Canva studio" : kind === "guides" ? "Founder guides" : "Market research",
    eyebrow: kind === "pitch-deck" ? "Hands-on editor" : kind === "guides" ? "Action guides" : "Research workspace",
    body: kind === "pitch-deck" ? "Create presentations, posts, flyers, and business visuals on a fixed canvas." : kind === "guides" ? "Generate practical operating guides from the active company." : "Build audience, competitor, positioning, and market insight cards.",
    pageTitle: "Page title", elementText: "Edit selected text", pages: "Pages", templates: "Templates", tools: "Tools", addPage: "Add page",
    pitchTemplate: "Pitch", instagramTemplate: "Instagram", facebookTemplate: "Facebook", storyTemplate: "Story", flyerTemplate: "Flyer", productTemplate: "Product",
    addHeading: "Heading", addText: "Text", addShape: "Shape", addImage: "Image", addBadge: "Badge", addButton: "Button", duplicate: "Duplicate", delete: "Delete", forward: "Forward", back: "Back",
    chooseTitle: "What do you want to create?", chooseBody: "Start with a canvas type, then move and resize everything by hand.", continueDesign: "Continue design", blankCanvas: "Blank canvas",
    presentationTool: "Presentation", presentationBody: "Pitch decks, investor slides, and business presentations.", socialTool: "Social media post", socialBody: "Reusable square creative for any platform.", instagramTool: "Instagram post", instagramBody: "Square launch post with image and caption layout.", facebookTool: "Facebook post", facebookBody: "Wide campaign creative with CTA block.", storyTool: "Story / Reel", storyBody: "Vertical mobile story or reel cover.", flyerTool: "Flyer", flyerBody: "Printable promo flyer for your business.", productTool: "Product card", productBody: "Product or offer card with visual area.",
  };
  if (language === "ru") return {
    ...en,
    save: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c", saved: "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e", copied: "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e", error: "\u041e\u0448\u0438\u0431\u043a\u0430", failedSave: "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c", savedSuccess: "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e \u0432 \u0440\u0430\u0431\u043e\u0447\u0435\u0439 \u043e\u0431\u043b\u0430\u0441\u0442\u0438 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438.", regenerate: "\u0421\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0437\u0430\u043d\u043e\u0432\u043e",
    noCompany: "\u041d\u0435\u0442 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0439 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438", noCompanyBody: "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0441\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0438\u043b\u0438 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044e.",
    title: kind === "pitch-deck" ? "Canva-\u0441\u0442\u0443\u0434\u0438\u044f" : kind === "guides" ? "\u0413\u0430\u0439\u0434\u044b \u043e\u0441\u043d\u043e\u0432\u0430\u0442\u0435\u043b\u044f" : "\u0418\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u043d\u0438\u0435 \u0440\u044b\u043d\u043a\u0430",
    eyebrow: kind === "pitch-deck" ? "\u0420\u0443\u0447\u043d\u043e\u0439 \u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440" : kind === "guides" ? "\u041f\u0440\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0433\u0430\u0439\u0434\u044b" : "\u0420\u0430\u0431\u043e\u0447\u0435\u0435 \u043f\u0440\u043e\u0441\u0442\u0440\u0430\u043d\u0441\u0442\u0432\u043e",
    body: kind === "pitch-deck" ? "\u0421\u043e\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u043f\u0440\u0435\u0437\u0435\u043d\u0442\u0430\u0446\u0438\u0438, \u043f\u043e\u0441\u0442\u044b, \u0444\u043b\u0430\u0435\u0440\u044b \u0438 \u0431\u0438\u0437\u043d\u0435\u0441-\u0432\u0438\u0437\u0443\u0430\u043b\u044b." : kind === "guides" ? "\u0421\u043e\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u043f\u0440\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0435 \u0433\u0430\u0439\u0434\u044b." : "\u0421\u043e\u0431\u0438\u0440\u0430\u0439\u0442\u0435 \u0440\u044b\u043d\u043e\u0447\u043d\u044b\u0435 \u0438\u043d\u0441\u0430\u0439\u0442\u044b.",
    pageTitle: "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b", elementText: "\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0442\u0435\u043a\u0441\u0442", pages: "\u0421\u0442\u0440\u0430\u043d\u0438\u0446\u044b", templates: "\u0428\u0430\u0431\u043b\u043e\u043d\u044b", tools: "\u0418\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u044b", addPage: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443",
    pitchTemplate: "\u041f\u0438\u0442\u0447", flyerTemplate: "\u0424\u043b\u0430\u0435\u0440", productTemplate: "\u041f\u0440\u043e\u0434\u0443\u043a\u0442",
    addHeading: "\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a", addText: "\u0422\u0435\u043a\u0441\u0442", addShape: "\u0424\u0438\u0433\u0443\u0440\u0430", addImage: "\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0435", addBadge: "\u0411\u0435\u0439\u0434\u0436", addButton: "\u041a\u043d\u043e\u043f\u043a\u0430", duplicate: "\u0414\u0443\u0431\u043b\u0438\u0440\u043e\u0432\u0430\u0442\u044c", delete: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c", forward: "\u0412\u043f\u0435\u0440\u0435\u0434", back: "\u041d\u0430\u0437\u0430\u0434",
    chooseTitle: "\u0427\u0442\u043e \u0445\u043e\u0442\u0438\u0442\u0435 \u0441\u043e\u0437\u0434\u0430\u0442\u044c?", chooseBody: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0438\u043f \u0445\u043e\u043b\u0441\u0442\u0430, \u0437\u0430\u0442\u0435\u043c \u0434\u0432\u0438\u0433\u0430\u0439\u0442\u0435 \u0438 \u043c\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u0443\u0439\u0442\u0435.", continueDesign: "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c", blankCanvas: "\u041f\u0443\u0441\u0442\u043e\u0439 \u0445\u043e\u043b\u0441\u0442",
    presentationTool: "\u041f\u0440\u0435\u0437\u0435\u043d\u0442\u0430\u0446\u0438\u044f", socialTool: "\u041f\u043e\u0441\u0442", instagramTool: "Instagram", facebookTool: "Facebook", storyTool: "Story / Reel", flyerTool: "\u0424\u043b\u0430\u0435\u0440", productTool: "\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u0430",
  };
  if (language === "hy") return en;
  return en;
}
function makeElement(type: ElementType, overrides: Partial<DesignElement> = {}): DesignElement {
  const base: Record<ElementType, Omit<DesignElement, "id">> = {
    heading: { type: "heading", text: "Big headline", x: 8, y: 10, width: 72, height: 12, color: "#111827", backgroundColor: "transparent", fontSize: 26, radius: 0 },
    text: { type: "text", text: "Supporting description", x: 8, y: 28, width: 70, height: 10, color: "#334155", backgroundColor: "transparent", fontSize: 14, radius: 0 },
    shape: { type: "shape", text: "", x: 12, y: 58, width: 36, height: 18, color: "#111827", backgroundColor: "#E8F3EF", fontSize: 12, radius: 16 },
    image: { type: "image", text: "Image", x: 54, y: 42, width: 36, height: 30, color: "#475569", backgroundColor: "#EEF2FF", fontSize: 13, radius: 18 },
    badge: { type: "badge", text: "NEW", x: 8, y: 6, width: 28, height: 7, color: "#111827", backgroundColor: "#DFAE55", fontSize: 12, radius: 999 },
    button: { type: "button", text: "Get started", x: 8, y: 78, width: 34, height: 9, color: "#FFFFFF", backgroundColor: "#4D2FB2", fontSize: 13, radius: 999 },
  };
  return { id: uid(type), ...base[type], ...overrides };
}

function makePage(title: string, format: Format, elements: DesignElement[] = []): DesignPage {
  return { id: uid("page"), title, format, background: "#FFFFFF", elements };
}

function buildTemplate(template: Format | "pitch", companyName: string, idea: string, tags: string[]): DesignPage[] {
  const shortIdea = idea || "A focused business offer for a clear audience";
  const tagLine = tags.slice(0, 3).join(" - ") || "Strategy - Product - Growth";
  if (template === "instagram") return [makePage("Instagram post", "instagram", [makeElement("badge", { text: "LAUNCH" }), makeElement("heading", { text: companyName, y: 20, fontSize: 30 }), makeElement("text", { text: shortIdea, y: 42 }), makeElement("image", { text: "Post image", x: 12, y: 58, width: 76, height: 30 })])];
  if (template === "facebook") return [makePage("Facebook post", "facebook", [makeElement("heading", { text: `Meet ${companyName}`, y: 12 }), makeElement("text", { text: shortIdea, y: 30, width: 58 }), makeElement("image", { text: "Cover", x: 58, y: 48, width: 34, height: 30 }), makeElement("button", { text: "Learn more", y: 74 })])];
  if (template === "story") return [makePage("Story", "story", [makeElement("image", { text: "Hero", x: 10, y: 10, width: 80, height: 48 }), makeElement("heading", { text: companyName, x: 10, y: 66, width: 78 }), makeElement("button", { text: "Swipe up", x: 22, y: 86, width: 56 })])];
  if (template === "flyer") return [makePage("Flyer", "flyer", [makeElement("badge", { text: tagLine, width: 70 }), makeElement("heading", { text: companyName, y: 24 }), makeElement("text", { text: shortIdea, y: 48, width: 78 }), makeElement("button", { text: "Contact us", x: 20, y: 84, width: 60 })])];
  if (template === "product") return [makePage("Product card", "product", [makeElement("image", { text: "Product", x: 16, y: 10, width: 68, height: 42 }), makeElement("heading", { text: companyName, x: 10, y: 58 }), makeElement("text", { text: shortIdea, x: 10, y: 75 }), makeElement("badge", { text: "BEST VALUE", x: 10, y: 88, width: 46 })])];
  return buildDeckTemplate(0, companyName, idea, tags);
}

function buildDeckTemplate(variant: number, companyName: string, idea: string, tags: string[]): DesignPage[] {
  const shortIdea = idea || "A focused business offer for a clear audience";
  const tagLine = tags.slice(0, 3).join(" - ") || "Strategy - Product - Growth";
  const themes = [
    { name: "Modern investor", accent: "#4D2FB2", dark: "#111827", soft: "#EEF2FF", label: "INVESTOR DECK", pages: ["Problem", "Solution", "Market", "Traction", "The ask"] },
    { name: "Sales proposal", accent: "#01A06D", dark: "#183B35", soft: "#DCFCE7", label: "SALES DECK", pages: ["Customer pain", "Offer", "Proof", "Packages", "Next step"] },
    { name: "Product launch", accent: "#F97316", dark: "#111827", soft: "#FFEDD5", label: "LAUNCH", pages: ["Product story", "Features", "Use cases", "Pricing", "Launch CTA"] },
    { name: "Creative portfolio", accent: "#EF4444", dark: "#111827", soft: "#FEE2E2", label: "PORTFOLIO", pages: ["Selected work", "Creative process", "Results", "Services", "Contact"] },
    { name: "Technology pitch", accent: "#0EA5E9", dark: "#020617", soft: "#DBEAFE", label: "TECHNOLOGY", pages: ["Platform", "Architecture", "Security", "Roadmap", "Demo"] },
    { name: "Project proposal", accent: "#2563EB", dark: "#0F172A", soft: "#E0F2FE", label: "PROPOSAL", pages: ["Objective", "Scope", "Timeline", "Deliverables", "Approval"] },
    { name: "Creative brief", accent: "#F43F5E", dark: "#111827", soft: "#FFE4E6", label: "CREATIVE BRIEF", pages: ["Goal", "Audience", "Message", "Channels", "Assets"] },
    { name: "Marketing plan", accent: "#A855F7", dark: "#18181B", soft: "#F3E8FF", label: "MARKETING", pages: ["Positioning", "Funnel", "Channels", "Calendar", "KPIs"] },
    { name: "Financial report", accent: "#DFAE55", dark: "#111827", soft: "#FEF3C7", label: "FINANCIALS", pages: ["Revenue", "Costs", "Cash flow", "Assumptions", "Scenario"] },
    { name: "Training workshop", accent: "#14B8A6", dark: "#134E4A", soft: "#CCFBF1", label: "WORKSHOP", pages: ["Agenda", "Lesson 1", "Activity", "Checklist", "Recap"] },
    { name: "Brand strategy", accent: "#EC4899", dark: "#3B0764", soft: "#FCE7F3", label: "BRAND", pages: ["Positioning", "Voice", "Visual system", "Touchpoints", "Rollout"] },
    { name: "Minimal startup", accent: "#111827", dark: "#0F172A", soft: "#F8FAFC", label: "STARTUP", pages: ["Opportunity", "Product", "Go to market", "Metrics", "Close"] },
  ];
  const theme = themes[variant % themes.length];
  return [
    makePage(theme.name, "presentation", [
      makeElement("shape", { x: 0, y: 0, width: 100, height: 100, radius: 0, backgroundColor: theme.dark }),
      makeElement("badge", { text: theme.label, x: 7, y: 8, width: 42, backgroundColor: theme.accent, color: "#FFFFFF" }),
      makeElement("heading", { text: companyName, x: 7, y: 26, width: 62, fontSize: 32, color: "#FFFFFF" }),
      makeElement("text", { text: shortIdea, x: 7, y: 56, width: 54, color: "#E5E7EB" }),
      makeElement("shape", { x: 70, y: 18, width: 20, height: 54, radius: 18, backgroundColor: theme.accent, opacity: 0.92 }),
    ]),
    makePage(theme.pages[0], "presentation", [
      makeElement("heading", { text: theme.pages[0], x: 8, y: 12, width: 62, color: theme.dark }),
      makeElement("text", { text: `Frame this around ${companyName}'s strongest customer insight.`, x: 8, y: 36, width: 58, color: "#334155" }),
      makeElement("shape", { x: 70, y: 16, width: 20, height: 52, radius: 16, backgroundColor: theme.soft }),
      makeElement("badge", { text: "01", x: 72, y: 72, width: 16, backgroundColor: theme.accent, color: "#FFFFFF" }),
    ]),
    makePage(theme.pages[1], "presentation", [
      makeElement("heading", { text: theme.pages[1], x: 8, y: 12, width: 62, color: theme.dark }),
      makeElement("text", { text: shortIdea, x: 8, y: 34, width: 50, color: "#334155" }),
      makeElement("image", { text: "Visual", x: 62, y: 18, width: 28, height: 46, radius: 18, backgroundColor: theme.soft }),
      makeElement("button", { text: tagLine, x: 8, y: 74, width: 60, backgroundColor: theme.accent }),
    ]),
    makePage(theme.pages[2], "presentation", [
      makeElement("heading", { text: theme.pages[2], x: 8, y: 10, width: 60, color: theme.dark }),
      makeElement("shape", { x: 10, y: 48, width: 18, height: 32, radius: 6, backgroundColor: theme.accent }),
      makeElement("shape", { x: 38, y: 36, width: 18, height: 44, radius: 6, backgroundColor: theme.soft }),
      makeElement("shape", { x: 66, y: 26, width: 18, height: 54, radius: 6, backgroundColor: theme.dark }),
      makeElement("text", { text: "Replace with your own proof, charts, or examples.", x: 8, y: 84, width: 78, fontSize: 12, color: "#475569" }),
    ]),
    makePage(theme.pages[3], "presentation", [
      makeElement("heading", { text: theme.pages[3], x: 8, y: 12, width: 58, color: theme.dark }),
      makeElement("badge", { text: "Step 1", x: 10, y: 42, width: 26, backgroundColor: theme.soft, color: theme.dark }),
      makeElement("badge", { text: "Step 2", x: 38, y: 42, width: 26, backgroundColor: theme.accent, color: "#FFFFFF" }),
      makeElement("badge", { text: "Step 3", x: 66, y: 42, width: 26, backgroundColor: theme.dark, color: "#FFFFFF" }),
      makeElement("text", { text: "Use this slide for roadmap, offer stack, timeline, or execution plan.", x: 8, y: 68, width: 76, color: "#334155" }),
    ]),
    makePage(theme.pages[4], "presentation", [
      makeElement("shape", { x: 0, y: 0, width: 100, height: 100, radius: 0, backgroundColor: theme.soft }),
      makeElement("heading", { text: theme.pages[4], x: 8, y: 20, width: 64, color: theme.dark, fontSize: 30 }),
      makeElement("text", { text: `Next step for ${companyName}.`, x: 8, y: 48, width: 58, color: "#334155" }),
      makeElement("button", { text: "Let's build", x: 8, y: 72, width: 34, backgroundColor: theme.accent }),
    ]),
    makePage("Business model", "presentation", [
      makeElement("heading", { text: "Business model", x: 8, y: 10, width: 64, color: theme.dark }),
      makeElement("shape", { text: "", x: 9, y: 38, width: 24, height: 22, backgroundColor: theme.accent, color: theme.accent, shapeKind: "stat" }),
      makeElement("shape", { text: "", x: 38, y: 38, width: 24, height: 22, backgroundColor: theme.soft, color: theme.accent, shapeKind: "stat" }),
      makeElement("shape", { text: "", x: 67, y: 38, width: 24, height: 22, backgroundColor: theme.dark, color: theme.dark, shapeKind: "stat" }),
      makeElement("text", { text: "Revenue, costs, margin, and repeatable growth logic.", x: 8, y: 72, width: 76, color: "#475569" }),
    ]),
    makePage("Roadmap", "presentation", [
      makeElement("heading", { text: "Roadmap", x: 8, y: 12, width: 54, color: theme.dark }),
      makeElement("shape", { text: "", x: 12, y: 46, width: 76, height: 5, backgroundColor: theme.accent, color: theme.accent, shapeKind: "progress" }),
      makeElement("badge", { text: "Phase 1", x: 10, y: 58, width: 24, backgroundColor: theme.soft, color: theme.dark }),
      makeElement("badge", { text: "Phase 2", x: 38, y: 58, width: 24, backgroundColor: theme.accent, color: "#FFFFFF" }),
      makeElement("badge", { text: "Phase 3", x: 66, y: 58, width: 24, backgroundColor: theme.dark, color: "#FFFFFF" }),
    ]),
    makePage("Team and roles", "presentation", [
      makeElement("heading", { text: "Team and roles", x: 8, y: 12, width: 66, color: theme.dark }),
      makeElement("image", { text: "Founder", x: 10, y: 36, width: 20, height: 20, radius: 999, backgroundColor: theme.soft }),
      makeElement("image", { text: "Ops", x: 40, y: 36, width: 20, height: 20, radius: 999, backgroundColor: theme.soft }),
      makeElement("image", { text: "Growth", x: 70, y: 36, width: 20, height: 20, radius: 999, backgroundColor: theme.soft }),
      makeElement("text", { text: "Replace with key people, responsibilities, and hiring gaps.", x: 8, y: 70, width: 76, color: "#475569" }),
    ]),
    makePage("Appendix", "presentation", [
      makeElement("heading", { text: "Appendix", x: 8, y: 12, width: 54, color: theme.dark }),
      makeElement("shape", { text: "", x: 10, y: 38, width: 36, height: 26, backgroundColor: theme.accent, color: theme.accent, borderColor: theme.dark, shapeKind: "chart" }),
      makeElement("shape", { text: "", x: 56, y: 38, width: 34, height: 26, backgroundColor: theme.soft, color: theme.accent, borderColor: theme.dark, shapeKind: "table" }),
      makeElement("text", { text: "Use this slide for extra research, metrics, and proof.", x: 8, y: 76, width: 76, color: "#475569" }),
    ]),
  ];
}
function createTemplateForFormat(format: Format, variant: number, companyName: string, idea: string): DesignPage {
  const shortIdea = idea || "A focused business offer for a clear audience";
  const v = variant % 12;
  if (format === "presentation") {
    const templates = [
      () => makePage("Investor cover", "presentation", [makeElement("badge", { text: "INVESTOR DECK", x: 8, y: 8, width: 42 }), makeElement("heading", { text: companyName, x: 8, y: 24, width: 58, fontSize: 32 }), makeElement("text", { text: shortIdea, x: 8, y: 52, width: 54 }), makeElement("image", { text: "Hero visual", x: 66, y: 18, width: 26, height: 54 }), makeElement("button", { text: "2026 plan", x: 8, y: 78 })]),
      () => makePage("Problem map", "presentation", [makeElement("heading", { text: "Problem", x: 8, y: 12, width: 48 }), makeElement("text", { text: "The current workflow is slow, fragmented, and difficult to trust.", x: 8, y: 32, width: 54 }), makeElement("shape", { x: 8, y: 62, width: 24, height: 18, backgroundColor: "#FEE2E2" }), makeElement("shape", { x: 38, y: 62, width: 24, height: 18, backgroundColor: "#FEF3C7" }), makeElement("shape", { x: 68, y: 62, width: 24, height: 18, backgroundColor: "#DBEAFE" })]),
      () => makePage("Solution story", "presentation", [makeElement("heading", { text: `${companyName} solution`, x: 8, y: 12, width: 62 }), makeElement("text", { text: shortIdea, x: 8, y: 34, width: 48 }), makeElement("image", { text: "Product visual", x: 58, y: 18, width: 34, height: 44 }), makeElement("badge", { text: "FAST", x: 8, y: 66, width: 24 }), makeElement("badge", { text: "CLEAR", x: 36, y: 66, width: 24, backgroundColor: "#DBEAFE" })]),
      () => makePage("Market sizing", "presentation", [makeElement("heading", { text: "Market opportunity", x: 8, y: 12, width: 70 }), makeElement("shape", { x: 10, y: 48, width: 18, height: 32, backgroundColor: "#DFAE55" }), makeElement("shape", { x: 36, y: 38, width: 18, height: 42, backgroundColor: "#4D2FB2" }), makeElement("shape", { x: 62, y: 28, width: 18, height: 52, backgroundColor: "#183B35" }), makeElement("text", { text: "Use this slide to explain TAM, SAM, and near-term reachable market.", x: 8, y: 84, width: 78, fontSize: 12 })]),
      () => makePage("Business model", "presentation", [makeElement("heading", { text: "Business model", x: 8, y: 10, width: 64 }), makeElement("badge", { text: "Revenue", x: 8, y: 34, width: 32 }), makeElement("badge", { text: "Costs", x: 42, y: 34, width: 26, backgroundColor: "#DBEAFE" }), makeElement("badge", { text: "Margin", x: 70, y: 34, width: 24, backgroundColor: "#DCFCE7" }), makeElement("text", { text: "Explain pricing, recurring revenue, and what makes the economics attractive.", x: 8, y: 58, width: 76 })]),
      () => makePage("Roadmap", "presentation", [makeElement("heading", { text: "Roadmap", x: 8, y: 12, width: 50 }), makeElement("shape", { x: 12, y: 52, width: 76, height: 2, radius: 999, backgroundColor: "#CBD5E1" }), makeElement("badge", { text: "Q1", x: 10, y: 44, width: 18 }), makeElement("badge", { text: "Q2", x: 36, y: 44, width: 18, backgroundColor: "#DBEAFE" }), makeElement("badge", { text: "Q3", x: 62, y: 44, width: 18, backgroundColor: "#DCFCE7" }), makeElement("text", { text: "Launch, validate, scale.", x: 8, y: 70, width: 64 })]),
      () => makePage("Traction", "presentation", [makeElement("heading", { text: "Traction", x: 8, y: 12, width: 52 }), makeElement("badge", { text: "+42%", x: 8, y: 36, width: 26, height: 16, fontSize: 18 }), makeElement("badge", { text: "12k users", x: 38, y: 36, width: 30, height: 16, backgroundColor: "#DBEAFE" }), makeElement("badge", { text: "4.8 rating", x: 72, y: 36, width: 24, height: 16, backgroundColor: "#DCFCE7" }), makeElement("text", { text: "Replace these numbers with real proof points from the business.", x: 8, y: 66, width: 76 })]),
      () => makePage("Ask slide", "presentation", [makeElement("heading", { text: "The ask", x: 8, y: 14, width: 54 }), makeElement("text", { text: "What you need next: capital, partners, customers, or distribution.", x: 8, y: 36, width: 56 }), makeElement("shape", { x: 66, y: 18, width: 24, height: 48, backgroundColor: "#EEF2FF" }), makeElement("button", { text: "Let's build", x: 8, y: 76 })]),
    ];
    return templates[v % templates.length]();
  }
  if (format === "instagram") {
    const templates = [
      () => makePage("Instagram launch", "instagram", [makeElement("image", { text: "Hero photo", x: 7, y: 7, width: 86, height: 48 }), makeElement("badge", { text: "NEW", x: 10, y: 60, width: 24 }), makeElement("heading", { text: companyName, x: 10, y: 70, width: 78, fontSize: 24 }), makeElement("text", { text: shortIdea, x: 10, y: 86, width: 76, fontSize: 12 })]),
      () => makePage("Instagram quote", "instagram", [makeElement("shape", { x: 8, y: 8, width: 84, height: 84, radius: 28, backgroundColor: "#F8FAFC" }), makeElement("heading", { text: "Make the promise clear.", x: 14, y: 26, width: 72, fontSize: 28 }), makeElement("text", { text: companyName, x: 14, y: 74, width: 70, fontSize: 12 })]),
      () => makePage("Instagram sale", "instagram", [makeElement("badge", { text: "LIMITED", x: 12, y: 12, width: 34 }), makeElement("heading", { text: "Special offer", x: 12, y: 30, width: 74, fontSize: 28 }), makeElement("image", { text: "Offer visual", x: 16, y: 54, width: 68, height: 30 }), makeElement("button", { text: "DM to start", x: 24, y: 88, width: 52 })]),
      () => makePage("Carousel cover", "instagram", [makeElement("badge", { text: "GUIDE", x: 10, y: 10, width: 28 }), makeElement("heading", { text: "3 reasons customers choose us", x: 10, y: 28, width: 78, fontSize: 26 }), makeElement("shape", { x: 12, y: 72, width: 20, height: 12, backgroundColor: "#DFAE55" }), makeElement("shape", { x: 40, y: 72, width: 20, height: 12, backgroundColor: "#DBEAFE" }), makeElement("shape", { x: 68, y: 72, width: 20, height: 12, backgroundColor: "#DCFCE7" })]),
      () => makePage("Testimonial post", "instagram", [makeElement("text", { text: "Customer proof", x: 12, y: 12, width: 70, fontSize: 13 }), makeElement("heading", { text: "It finally feels simple.", x: 12, y: 30, width: 76, fontSize: 28 }), makeElement("badge", { text: "5 stars", x: 12, y: 68, width: 40, backgroundColor: "#FEF3C7" }), makeElement("text", { text: companyName, x: 12, y: 82, width: 60, fontSize: 12 })]),
      () => makePage("Tip post", "instagram", [makeElement("badge", { text: "TIP", x: 10, y: 10, width: 22 }), makeElement("heading", { text: "One thing to do today", x: 10, y: 28, width: 78, fontSize: 28 }), makeElement("text", { text: "Write your best offer in one sentence, then test it with five real people.", x: 12, y: 66, width: 74, fontSize: 14 })]),
      () => makePage("Before after", "instagram", [makeElement("heading", { text: "Before", x: 10, y: 14, width: 34 }), makeElement("heading", { text: "After", x: 56, y: 14, width: 34 }), makeElement("shape", { x: 10, y: 38, width: 34, height: 42, backgroundColor: "#FEE2E2" }), makeElement("shape", { x: 56, y: 38, width: 34, height: 42, backgroundColor: "#DCFCE7" })]),
      () => makePage("Founder note", "instagram", [makeElement("image", { text: "Founder", x: 10, y: 10, width: 32, height: 32, radius: 999 }), makeElement("heading", { text: "A note from us", x: 10, y: 50, width: 78, fontSize: 26 }), makeElement("text", { text: shortIdea, x: 10, y: 74, width: 76, fontSize: 13 })]),
    ];
    return templates[v % templates.length]();
  }
  if (format === "facebook") {
    const templates = [
      () => makePage("Facebook campaign", "facebook", [makeElement("heading", { text: `Meet ${companyName}`, x: 8, y: 12, width: 52 }), makeElement("text", { text: shortIdea, x: 8, y: 36, width: 50 }), makeElement("image", { text: "Cover image", x: 60, y: 12, width: 32, height: 58 }), makeElement("button", { text: "Learn more", x: 8, y: 74 })]),
      () => makePage("Facebook event", "facebook", [makeElement("badge", { text: "LIVE", x: 8, y: 10, width: 24 }), makeElement("heading", { text: "Join our next session", x: 8, y: 28, width: 56 }), makeElement("text", { text: "Add date, time, and the promise of the event here.", x: 8, y: 54, width: 54 }), makeElement("image", { text: "Event visual", x: 66, y: 18, width: 24, height: 52 })]),
      () => makePage("Facebook testimonial", "facebook", [makeElement("heading", { text: "Trusted by customers", x: 8, y: 12, width: 64 }), makeElement("text", { text: "This changed the way we work.", x: 8, y: 38, width: 56, fontSize: 18 }), makeElement("badge", { text: "5 stars", x: 8, y: 66, width: 34 }), makeElement("image", { text: "Customer", x: 70, y: 24, width: 20, height: 36, radius: 999 })]),
      () => makePage("Facebook offer", "facebook", [makeElement("badge", { text: "OFFER", x: 8, y: 10, width: 28 }), makeElement("heading", { text: "Get started this week", x: 8, y: 28, width: 56 }), makeElement("button", { text: "Book now", x: 8, y: 72 }), makeElement("shape", { x: 62, y: 18, width: 30, height: 50, backgroundColor: "#FEF3C7" })]),
      () => makePage("Facebook story ad", "facebook", [makeElement("heading", { text: "One clear result", x: 8, y: 14, width: 48 }), makeElement("text", { text: shortIdea, x: 8, y: 40, width: 48 }), makeElement("image", { text: "Result visual", x: 58, y: 12, width: 34, height: 62 })]),
      () => makePage("Community post", "facebook", [makeElement("heading", { text: "Question for our community", x: 8, y: 12, width: 72 }), makeElement("text", { text: "What is your biggest challenge with this problem right now?", x: 8, y: 38, width: 72 }), makeElement("badge", { text: "Comment below", x: 8, y: 72, width: 42 })]),
      () => makePage("Feature spotlight", "facebook", [makeElement("badge", { text: "FEATURE", x: 8, y: 10, width: 34 }), makeElement("heading", { text: "Designed to save time", x: 8, y: 30, width: 52 }), makeElement("image", { text: "Feature", x: 62, y: 16, width: 30, height: 52 }), makeElement("text", { text: "Explain one feature and one outcome.", x: 8, y: 60, width: 48 })]),
      () => makePage("Founder update", "facebook", [makeElement("image", { text: "Founder photo", x: 8, y: 12, width: 26, height: 46 }), makeElement("heading", { text: "A quick update", x: 40, y: 14, width: 48 }), makeElement("text", { text: shortIdea, x: 40, y: 42, width: 48 }), makeElement("button", { text: "Read more", x: 40, y: 72 })]),
    ];
    return templates[v % templates.length]();
  }
  if (format === "story") {
    const templates = [
      () => makePage("Story cover", "story", [makeElement("image", { text: "Vertical visual", x: 10, y: 8, width: 80, height: 48 }), makeElement("badge", { text: "TAP IN", x: 24, y: 62, width: 52 }), makeElement("heading", { text: companyName, x: 12, y: 72, width: 76, fontSize: 24 }), makeElement("button", { text: "Swipe up", x: 22, y: 88, width: 56 })]),
      () => makePage("Story poll", "story", [makeElement("heading", { text: "Which one do you need?", x: 10, y: 16, width: 78, fontSize: 25 }), makeElement("button", { text: "Option A", x: 18, y: 54, width: 64 }), makeElement("button", { text: "Option B", x: 18, y: 68, width: 64, backgroundColor: "#183B35" })]),
      () => makePage("Story countdown", "story", [makeElement("badge", { text: "COMING SOON", x: 18, y: 12, width: 64 }), makeElement("heading", { text: "Launch day", x: 12, y: 36, width: 76, fontSize: 30 }), makeElement("shape", { x: 22, y: 68, width: 56, height: 14, radius: 999, backgroundColor: "#FEF3C7" })]),
      () => makePage("Story tip", "story", [makeElement("badge", { text: "TIP", x: 12, y: 12, width: 22 }), makeElement("heading", { text: "Save this", x: 12, y: 34, width: 76, fontSize: 30 }), makeElement("text", { text: shortIdea, x: 12, y: 64, width: 72, fontSize: 14 })]),
      () => makePage("Story sale", "story", [makeElement("heading", { text: "Today only", x: 12, y: 18, width: 76, fontSize: 30 }), makeElement("badge", { text: "20% OFF", x: 24, y: 50, width: 52, height: 12 }), makeElement("button", { text: "Claim", x: 24, y: 82, width: 52 })]),
      () => makePage("Story proof", "story", [makeElement("heading", { text: "Proof", x: 12, y: 16, width: 60 }), makeElement("badge", { text: "+42%", x: 20, y: 42, width: 60, height: 18, fontSize: 20 }), makeElement("text", { text: "Replace with your best metric.", x: 14, y: 68, width: 70 })]),
      () => makePage("Story question", "story", [makeElement("heading", { text: "Ask us anything", x: 12, y: 18, width: 76, fontSize: 28 }), makeElement("shape", { x: 12, y: 52, width: 76, height: 28, radius: 18, backgroundColor: "#F8FAFC" })]),
      () => makePage("Story checklist", "story", [makeElement("heading", { text: "Checklist", x: 12, y: 14, width: 76 }), makeElement("badge", { text: "1. Validate", x: 14, y: 42, width: 58 }), makeElement("badge", { text: "2. Launch", x: 14, y: 58, width: 58, backgroundColor: "#DBEAFE" }), makeElement("badge", { text: "3. Improve", x: 14, y: 74, width: 58, backgroundColor: "#DCFCE7" })]),
    ];
    return templates[v % templates.length]();
  }
  if (format === "flyer") {
    const templates = [
      () => makePage("Flyer promo", "flyer", [makeElement("badge", { text: "LOCAL OFFER", x: 10, y: 8, width: 54 }), makeElement("heading", { text: companyName, x: 10, y: 24, width: 78 }), makeElement("image", { text: "Main visual", x: 12, y: 46, width: 76, height: 24 }), makeElement("text", { text: shortIdea, x: 10, y: 76, width: 78 }), makeElement("button", { text: "Contact", x: 24, y: 88, width: 52 })]),
      () => makePage("Flyer event", "flyer", [makeElement("heading", { text: "Grand opening", x: 10, y: 14, width: 78 }), makeElement("image", { text: "Event visual", x: 12, y: 38, width: 76, height: 26 }), makeElement("text", { text: "Date, place, and offer details go here.", x: 10, y: 70, width: 78 })]),
      () => makePage("Flyer menu", "flyer", [makeElement("heading", { text: "Services", x: 10, y: 12, width: 78 }), makeElement("badge", { text: "Starter", x: 12, y: 38, width: 66 }), makeElement("badge", { text: "Professional", x: 12, y: 54, width: 66, backgroundColor: "#DBEAFE" }), makeElement("badge", { text: "Premium", x: 12, y: 70, width: 66, backgroundColor: "#DCFCE7" })]),
      () => makePage("Flyer coupon", "flyer", [makeElement("badge", { text: "COUPON", x: 18, y: 12, width: 50 }), makeElement("heading", { text: "Bring this flyer", x: 10, y: 34, width: 78 }), makeElement("button", { text: "Save 20%", x: 22, y: 72, width: 56 })]),
      () => makePage("Flyer premium", "flyer", [makeElement("shape", { x: 8, y: 8, width: 84, height: 84, radius: 22, backgroundColor: "#111827" }), makeElement("heading", { text: companyName, x: 14, y: 24, width: 70, color: "#FFFFFF" }), makeElement("text", { text: shortIdea, x: 14, y: 54, width: 68, color: "#E5E7EB" })]),
      () => makePage("Flyer checklist", "flyer", [makeElement("heading", { text: "Why choose us", x: 10, y: 14, width: 76 }), makeElement("badge", { text: "Simple", x: 12, y: 40, width: 60 }), makeElement("badge", { text: "Reliable", x: 12, y: 56, width: 60, backgroundColor: "#DBEAFE" }), makeElement("badge", { text: "Fast", x: 12, y: 72, width: 60, backgroundColor: "#DCFCE7" })]),
      () => makePage("Flyer lead magnet", "flyer", [makeElement("heading", { text: "Free guide", x: 10, y: 16, width: 78 }), makeElement("image", { text: "Guide cover", x: 18, y: 42, width: 64, height: 28 }), makeElement("button", { text: "Scan to get it", x: 22, y: 82, width: 56 })]),
      () => makePage("Flyer minimal", "flyer", [makeElement("heading", { text: companyName, x: 12, y: 18, width: 76, fontSize: 28 }), makeElement("text", { text: shortIdea, x: 12, y: 50, width: 72 }), makeElement("shape", { x: 12, y: 78, width: 76, height: 2, radius: 999, backgroundColor: "#DFAE55" })]),
    ];
    return templates[v % templates.length]();
  }
  const productTemplates = [
    () => makePage("Product card", "product", [makeElement("image", { text: "Product", x: 14, y: 8, width: 72, height: 40 }), makeElement("heading", { text: companyName, x: 10, y: 56, width: 78 }), makeElement("text", { text: shortIdea, x: 10, y: 73, width: 78 }), makeElement("badge", { text: "BEST VALUE", x: 10, y: 88, width: 46 })]),
    () => makePage("Feature card", "product", [makeElement("badge", { text: "FEATURE", x: 10, y: 10, width: 34 }), makeElement("heading", { text: "Built for speed", x: 10, y: 30, width: 76 }), makeElement("image", { text: "Feature", x: 18, y: 56, width: 64, height: 26 })]),
    () => makePage("Pricing card", "product", [makeElement("heading", { text: "Starter", x: 12, y: 14, width: 70 }), makeElement("badge", { text: "$29/mo", x: 12, y: 38, width: 44, height: 14, fontSize: 18 }), makeElement("text", { text: "Best for first launch.", x: 12, y: 62, width: 70 }), makeElement("button", { text: "Choose", x: 22, y: 84, width: 56 })]),
    () => makePage("Comparison", "product", [makeElement("heading", { text: "Why us", x: 10, y: 12, width: 76 }), makeElement("badge", { text: "Old way", x: 12, y: 40, width: 34, backgroundColor: "#FEE2E2" }), makeElement("badge", { text: companyName, x: 54, y: 40, width: 34, backgroundColor: "#DCFCE7" }), makeElement("text", { text: "Show the direct difference.", x: 12, y: 70, width: 74 })]),
    () => makePage("Bundle card", "product", [makeElement("badge", { text: "BUNDLE", x: 10, y: 10, width: 34 }), makeElement("heading", { text: "Everything you need", x: 10, y: 30, width: 78 }), makeElement("shape", { x: 12, y: 62, width: 20, height: 18, backgroundColor: "#DBEAFE" }), makeElement("shape", { x: 40, y: 62, width: 20, height: 18, backgroundColor: "#FEF3C7" }), makeElement("shape", { x: 68, y: 62, width: 20, height: 18, backgroundColor: "#DCFCE7" })]),
    () => makePage("App feature", "product", [makeElement("shape", { x: 24, y: 8, width: 52, height: 80, radius: 28, backgroundColor: "#111827" }), makeElement("heading", { text: "Mobile first", x: 30, y: 22, width: 40, color: "#FFFFFF", fontSize: 22 }), makeElement("button", { text: "Try it", x: 32, y: 72, width: 36 })]),
    () => makePage("Course card", "product", [makeElement("image", { text: "Course cover", x: 12, y: 10, width: 76, height: 36 }), makeElement("heading", { text: "Learn faster", x: 10, y: 54, width: 78 }), makeElement("badge", { text: "6 modules", x: 10, y: 78, width: 34 })]),
    () => makePage("Offer stack", "product", [makeElement("heading", { text: "Offer stack", x: 10, y: 12, width: 78 }), makeElement("badge", { text: "Core product", x: 12, y: 38, width: 64 }), makeElement("badge", { text: "Bonus", x: 12, y: 54, width: 64, backgroundColor: "#DBEAFE" }), makeElement("badge", { text: "Support", x: 12, y: 70, width: 64, backgroundColor: "#DCFCE7" })]),
  ];
  return productTemplates[v % productTemplates.length]();
}
function mapOldSlides(slides: OldSlide[]): DesignPage[] {
  return slides.map((slide, index) => makePage(slide.title || `Slide ${index + 1}`, "presentation", [makeElement("heading", { text: slide.title, y: 18 }), makeElement("text", { text: slide.subtitle, y: 38 }), ...slide.bullets.slice(0, 3).map((bullet, i) => makeElement("badge", { text: bullet, x: 8, y: 58 + i * 10, width: 74, backgroundColor: "#EEF2FF" }))]));
}

function buildDocument(kind: ToolKind, language: Language, companyName: string, idea: string, place: string, tags: string[]): SavedDocument {
  const generatedAt = new Date().toISOString();
  const tagText = tags.slice(0, 4).join(", ") || "your strongest advantages";
  if (kind === "guides") {
    return {
      generatedAt,
      sections: [
        { title: language === "ru" ? "\u041f\u043b\u0430\u043d \u0437\u0430\u043f\u0443\u0441\u043a\u0430" : "Launch playbook", body: `Turn ${companyName} into a simple weekly operating system: offer, audience, channel, proof, and follow-up.`, bullets: ["Define one clear promise", "Pick the first customer segment", "Write the weekly execution checklist"] },
        { title: language === "ru" ? "\u041f\u0440\u043e\u0434\u0430\u0436\u0438" : "Sales workflow", body: `Use ${tagText} to shape the first outreach and follow-up flow.`, bullets: ["Create a short lead list", "Send a direct offer", "Track objections and replies"] },
        { title: language === "ru" ? "\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c" : "Control dashboard", body: "Review progress every week and update the plan from real customer signals.", bullets: ["Leads contacted", "Qualified conversations", "Revenue opportunities"] },
      ],
    };
  }
  return {
    generatedAt,
    sections: [
      { title: language === "ru" ? "\u041e\u0431\u0437\u043e\u0440 \u0440\u044b\u043d\u043a\u0430" : "Market snapshot", body: `${companyName} should validate demand around: ${idea || "the core offer"}.`, bullets: ["Identify buyer pain", "Compare alternatives", "Map competitors"] },
      { title: language === "ru" ? "\u0421\u0435\u0433\u043c\u0435\u043d\u0442\u044b" : "Audience segments", body: `Use ${tagText} for positioning.`, bullets: ["Early adopters", "Budget-sensitive users", "Premium segment"] },
      { title: language === "ru" ? "\u0413\u0434\u0435 \u0438\u0441\u043a\u0430\u0442\u044c" : "Where to look", body: place ? `Start with local signals in ${place}, then compare global examples.` : "Start with local signals, then compare global examples.", bullets: ["Search current news", "Review social proof", "Interview real customers"] },
    ],
  };
}
function baseCanvasStyleFor(format: Format) {
  if (format === "presentation") return { width: "100%", aspectRatio: 16 / 9 } as const;
  if (format === "facebook") return { width: "100%", aspectRatio: 1.91 } as const;
  if (format === "story") return { width: "68%", aspectRatio: 9 / 16 } as const;
  if (format === "flyer") return { width: "76%", aspectRatio: 3 / 4 } as const;
  return { width: "92%", aspectRatio: 1 } as const;
}

function renderSvgShape(item: DesignElement, x: number, y: number, width: number, height: number, fill: string, stroke: string) {
  if (item.shapeKind === "triangle") return `<polygon points="${x + width / 2},${y} ${x + width},${y + height} ${x},${y + height}" fill="${fill}" ${stroke}/>`;
  if (item.shapeKind === "line") return `<rect x="${x}" y="${y + height / 2 - 2}" width="${width}" height="4" rx="2" fill="${fill}"/>`;
  if (item.shapeKind === "dash") return [0, 1, 2, 3].map((cell) => `<rect x="${x + cell * (width / 4)}" y="${y + height / 2 - 2}" width="${width / 6}" height="4" rx="2" fill="${fill}"/>`).join("");
  if (item.shapeKind?.startsWith("arrow")) return `<path d="M ${x} ${y + height / 2} H ${x + width * 0.72} L ${x + width * 0.72} ${y + height * 0.2} L ${x + width} ${y + height / 2} L ${x + width * 0.72} ${y + height * 0.8} L ${x + width * 0.72} ${y + height / 2}" fill="${fill}"/>`;
  if (["table", "kpi"].includes(item.shapeKind ?? "")) return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${item.radius}" fill="${fill}" ${stroke}/><path d="M ${x + width / 3} ${y} V ${y + height} M ${x + (width * 2) / 3} ${y} V ${y + height} M ${x} ${y + height / 2} H ${x + width}" stroke="${item.borderColor ?? "#CBD5E1"}" stroke-width="2"/>`;
  if (item.shapeKind === "chart") return [0.25, 0.48, 0.72, 0.38].map((h, cell) => `<rect x="${x + 12 + cell * (width / 5)}" y="${y + height - height * h - 8}" width="${Math.max(8, width / 10)}" height="${height * h}" rx="6" fill="${fill}"/>`).join("");
  if (item.shapeKind === "music") return `<rect x="${x + width * 0.62}" y="${y + height * 0.08}" width="${Math.max(6, width * 0.12)}" height="${height * 0.68}" rx="${Math.max(3, width * 0.04)}" fill="${fill}"/><ellipse cx="${x + width * 0.38}" cy="${y + height * 0.76}" rx="${width * 0.24}" ry="${height * 0.20}" fill="${fill}"/>`;
  if (item.shapeKind === "progress") return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="#E2E8F0"/><rect x="${x}" y="${y}" width="${width * 0.68}" height="${height}" rx="${height / 2}" fill="${fill}"/>`;
  if (item.shapeKind === "phone") return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.min(width, height) / 6}" fill="${fill}"/><rect x="${x + width * 0.32}" y="${y + height * 0.88}" width="${width * 0.36}" height="4" rx="2" fill="rgba(255,255,255,.45)"/>`;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${item.radius}" fill="${fill}" ${stroke}/>`;
}
function getSvgPageSize(page: DesignPage) {
  return page.format === "presentation" ? { width: 1600, height: 900 } : page.format === "facebook" ? { width: 1200, height: 628 } : page.format === "story" ? { width: 1080, height: 1920 } : page.format === "flyer" ? { width: 900, height: 1200 } : { width: 1080, height: 1080 };
}
function pageToSvg(page: DesignPage) {
  const size = getSvgPageSize(page);
  const blocks = page.elements.map((item) => {
    const x = (item.x / 100) * size.width;
    const y = (item.y / 100) * size.height;
    const width = (item.width / 100) * size.width;
    const height = (item.height / 100) * size.height;
    const fill = item.type === "heading" || item.type === "text" ? "none" : item.backgroundColor;
    const stroke = item.borderWidth ? `stroke="${item.borderColor ?? "#CBD5E1"}" stroke-width="${item.borderWidth}"` : "";
    const shadow = item.shadow ? `<filter id="shadow-${item.id}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="${item.shadowColor ?? "#000000"}" flood-opacity="0.22"/></filter>` : "";
    const text = !item.shapeKind && item.text ? `<text x="${x + width / 2}" y="${y + height / 2}" fill="${item.color}" font-size="${item.fontSize}" font-weight="${item.fontWeight ?? "800"}" font-style="${item.fontStyle ?? "normal"}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(item.text)}</text>` : "";
    const image = item.imageUri ? `<image href="${item.imageUri}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${item.imageFit === "contain" ? "xMidYMid meet" : "xMidYMid slice"}" />` : "";
    const visual = item.shapeKind ? renderSvgShape(item, x, y, width, height, fill, stroke) : `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${item.radius}" fill="${fill}" opacity="${item.opacity ?? 1}" ${stroke}/>`;
    return `${shadow}<g transform="rotate(${item.rotation ?? 0} ${x + width / 2} ${y + height / 2})" filter="${item.shadow ? `url(#shadow-${item.id})` : ""}">${visual}${image}${text}</g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}"><rect width="100%" height="100%" fill="${page.background}"/>${blocks}</svg>`;
}
function designToSvgDocument(pages: DesignPage[]) {
  const gap = 80;
  const sizes = pages.map(getSvgPageSize);
  const width = Math.max(...sizes.map((size) => size.width));
  const height = sizes.reduce((sum, size) => sum + size.height, 0) + Math.max(0, pages.length - 1) * gap;
  let offset = 0;
  const content = pages.map((page, index) => {
    const size = sizes[index];
    const inner = pageToSvg(page).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    const x = Math.round((width - size.width) / 2);
    const y = offset;
    offset += size.height + gap;
    return `<svg x="${x}" y="${y}" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${inner}</svg>`;
  }).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;
}
function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderHtmlShape(item: DesignElement) {
  const fill = item.backgroundColor === "transparent" ? item.color : item.backgroundColor;
  if (!item.shapeKind) return "";
  if (item.shapeKind === "triangle") return `<div style="width:0;height:0;border-left:50px solid transparent;border-right:50px solid transparent;border-bottom:86px solid ${fill};"></div>`;
  if (item.shapeKind === "line") return `<div style="width:92%;height:4px;border-radius:999px;background:${fill};"></div>`;
  if (item.shapeKind === "dash") return `<div style="display:flex;gap:8px;width:92%;">${[0,1,2,3].map(() => `<span style="flex:1;height:4px;border-radius:999px;background:${fill};"></span>`).join("")}</div>`;
  if (item.shapeKind?.startsWith("arrow")) return `<div style="width:80%;height:34%;background:${fill};clip-path:polygon(0 35%,70% 35%,70% 0,100% 50%,70% 100%,70% 65%,0 65%);"></div>`;
  if (item.shapeKind === "chart") return `<div style="display:flex;align-items:flex-end;gap:8px;height:90%;border-left:3px solid rgba(15,23,42,.25);border-bottom:3px solid rgba(15,23,42,.25);padding:10px;">${[24,42,62,34].map((h) => `<span style="width:12px;height:${h}%;border-radius:999px;background:${fill};"></span>`).join("")}</div>`;
  if (item.shapeKind === "progress") return `<div style="width:92%;height:44%;border-radius:999px;background:#E2E8F0;overflow:hidden;"><div style="width:68%;height:100%;background:${fill};border-radius:999px;"></div></div>`;
  if (item.shapeKind === "music") return `<div style="width:70%;height:80%;position:relative;"><span style="position:absolute;right:20%;top:8%;width:12%;height:70%;border-radius:999px;background:${fill};"></span><span style="position:absolute;left:12%;bottom:8%;width:50%;height:35%;border-radius:999px;background:${fill};"></span></div>`;
  return "";
}
function pageToHtml(page: DesignPage) {
  const ratio = page.format === "presentation" ? "16 / 9" : page.format === "facebook" ? "1.91 / 1" : page.format === "story" ? "9 / 16" : page.format === "flyer" ? "3 / 4" : "1 / 1";
  const blocks = page.elements.map((item) => {
    const background = item.type === "heading" || item.type === "text" || item.shapeKind ? "transparent" : item.backgroundColor;
    const content = item.shapeKind ? renderHtmlShape(item) : item.imageUri ? `<img src="${item.imageUri}" style="width:100%;height:100%;object-fit:${item.imageFit ?? "cover"};border-radius:${item.radius}px;filter:blur(${item.blurRadius ?? 0}px);" />` : escapeHtml(item.text || "");
    return `<div style="position:absolute;left:${item.x}%;top:${item.y}%;width:${item.width}%;min-height:${item.height}%;border-radius:${item.radius}px;background:${background};color:${item.color};font-size:${item.fontSize}px;font-weight:${item.fontWeight ?? "800"};font-style:${item.fontStyle ?? "normal"};letter-spacing:${item.letterSpacing ?? 0}px;opacity:${item.opacity ?? 1};border:${item.shapeKind ? 0 : item.borderWidth ?? 0}px ${item.borderStyle ?? "solid"} ${item.borderColor ?? "transparent"};transform:rotate(${item.rotation ?? 0}deg);box-shadow:${item.shadow ? `0 14px 30px ${item.shadowColor ?? "rgba(15,23,42,.20)"}` : "none"};padding:${item.imageUri || item.shapeKind ? 0 : 8}px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;text-align:${item.textAlign ?? "left"};overflow:hidden;line-height:${item.lineHeight ?? Math.round(item.fontSize * 1.18)}px;text-decoration:${item.textDecorationLine ?? "none"};text-transform:${item.textTransform ?? "none"};">${content}</div>`;
  }).join("");
  return `<section style="page-break-after:always;margin:0 auto 24px;max-width:960px;aspect-ratio:${ratio};background:${page.background};position:relative;box-shadow:0 12px 40px rgba(15,23,42,.18);overflow:hidden;">${blocks}</section>`;
}
export default function DashboardToolDetailScreen({ kind }: { kind: ToolKind }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const screen = useWindowDimensions();
  const isLandscape = screen.width > screen.height;
  const language = settings.language as Language;
  const colorScheme = useColorScheme();
  const isDark = (settings.theme === "system" ? colorScheme : settings.theme) !== "light";
  const palette = getPalette(isDark);
  const t = getCopy(language, kind);
  const { data: activeCompany, isLoading } = useActiveCompany();
  const { data: additionalData } = useCompanyAdditionalData(activeCompany?.id);
  const [isSaving, setIsSaving] = useState(false);
  const [pages, setPages] = useState<DesignPage[]>([]);
  const [history, setHistory] = useState<DesignPage[][]>([]);
  const [future, setFuture] = useState<DesignPage[][]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [selectedElementId, setSelectedElementId] = useState("");
  const [isPageSelected, setIsPageSelected] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<EditorPanel>(null);
  const [panelSearch, setPanelSearch] = useState("");
  const [canvasZoom, setCanvasZoom] = useState(0.8);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const [document, setDocument] = useState<SavedDocument | null>(null);

  const defaultPages = useMemo(() => buildTemplate("pitch", activeCompany?.businessName ?? "Business", activeCompany?.idea ?? "", activeCompany?.uniqueTags ?? []), [activeCompany?.businessName, activeCompany?.idea, activeCompany?.uniqueTags]);

  useEffect(() => {
    if (kind === "pitch-deck") {
      const saved = (additionalData as Record<string, unknown> | undefined)?.pitch_deck as { pages?: DesignPage[]; slides?: OldSlide[] } | undefined;
      const nextPages = saved?.pages?.length ? saved.pages : saved?.slides?.length ? mapOldSlides(saved.slides) : defaultPages;
      setPages(nextPages);
      setHistory([]);
      setFuture([]);
      setSelectedPageId(nextPages[0]?.id ?? "");
      setSelectedElementId(nextPages[0]?.elements[0]?.id ?? "");
      setIsPageSelected(!nextPages[0]?.elements[0]);
    } else {
      const key = kind === "guides" ? "guides_document" : "market_research_document";
      const saved = (additionalData as Record<string, unknown> | undefined)?.[key] as SavedDocument | undefined;
      setDocument(saved ?? buildDocument(kind, language, activeCompany?.businessName ?? "Business", activeCompany?.idea ?? "", activeCompany?.place ?? "", activeCompany?.uniqueTags ?? []));
    }
  }, [additionalData, activeCompany?.id, defaultPages, kind, language]);

  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0];
  const selectedElement = selectedPage?.elements.find((item) => item.id === selectedElementId);
  const displayZoom = isLandscape ? Math.min(canvasZoom, 0.68) : canvasZoom;

  const drawingResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !!drawingTool,
    onMoveShouldSetPanResponder: () => !!drawingTool,
    onStartShouldSetPanResponderCapture: () => !!drawingTool,
    onMoveShouldSetPanResponderCapture: () => !!drawingTool,
    onPanResponderGrant: (event) => {
      if (!drawingTool || canvasSize.width <= 1 || canvasSize.height <= 1) return;
      drawStartRef.current = {
        x: clamp((event.nativeEvent.locationX / canvasSize.width) * 100, 0, 100),
        y: clamp((event.nativeEvent.locationY / canvasSize.height) * 100, 0, 100),
      };
      Keyboard.dismiss();
      setSelectedElementId("");
      setIsPageSelected(false);
    },
    onPanResponderRelease: (_, gesture) => {
      if (!drawingTool || !drawStartRef.current || canvasSize.width <= 1 || canvasSize.height <= 1) return;
      const start = drawStartRef.current;
      const dx = (gesture.dx / canvasSize.width) * 100;
      const dy = (gesture.dy / canvasSize.height) * 100;
      const length = clamp(Math.hypot(dx, dy), 5, 92);
      const rotation = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      const thickness = drawingTool === "marker" ? 5 : drawingTool === "pencil" ? 2 : 3;
      const color = drawingTool === "marker" ? "#DFAE55" : drawingTool === "pencil" ? "#64748B" : "#111827";
      const next = makeElement("shape", {
        x: clamp(start.x, 0, 92),
        y: clamp(start.y, 0, 92),
        width: length,
        height: thickness,
        radius: 999,
        backgroundColor: color,
        color,
        rotation,
        opacity: drawingTool === "pencil" ? 0.78 : drawingTool === "marker" ? 0.62 : 1,
        shapeKind: drawingTool === "pencil" ? "dash" : "line",
      });
      updateSelectedPage((page) => ({ ...page, elements: [...page.elements, next] }));
      setSelectedElementId(next.id);
      setIsPageSelected(false);
      drawStartRef.current = null;
    },
    onPanResponderTerminate: () => {
      drawStartRef.current = null;
    },
  }), [canvasSize.height, canvasSize.width, drawingTool, selectedPageId]);
  function syncSelection(nextPages: DesignPage[]) {
    const nextPage = nextPages.find((page) => page.id === selectedPageId) ?? nextPages[0];
    setSelectedPageId(nextPage?.id ?? "");
    const nextElement = nextPage?.elements.find((item) => item.id === selectedElementId) ?? nextPage?.elements[0];
    setSelectedElementId(nextElement?.id ?? "");
    setIsPageSelected(!nextElement);
  }

  function commitPages(updater: DesignPage[] | ((current: DesignPage[]) => DesignPage[])) {
    setPages((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (next === current) return current;
      setHistory((items) => [...items.slice(-24), current]);
      setFuture([]);
      return next;
    });
  }

  function undoDesign() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture((items) => [pages, ...items].slice(0, 25));
    setHistory((items) => items.slice(0, -1));
    setPages(previous);
    syncSelection(previous);
  }

  function redoDesign() {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items.slice(-24), pages]);
    setFuture((items) => items.slice(1));
    setPages(next);
    syncSelection(next);
  }
  async function saveValue(key: string, value: unknown) {
    if (!activeCompany?.id) return;
    setIsSaving(true);
    try {
      await companyService.setAdditionalDataValue(activeCompany.id, key, value);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["companyAdditionalData", activeCompany.id] }), queryClient.invalidateQueries({ queryKey: ["activeCompany"] })]);
      toast.showToast(t.saved, t.savedSuccess, "success");
    } catch (error) {
      toast.showToast(t.error, error instanceof Error ? error.message : t.failedSave, "error");
    } finally {
      setIsSaving(false);
    }
  }

  function updateSelectedPage(updater: (page: DesignPage) => DesignPage) {
    commitPages((current) => current.map((page) => (page.id === selectedPageId ? updater(page) : page)));
  }
  function updateElement(elementId: string, updater: (item: DesignElement) => DesignElement) {
    updateSelectedPage((page) => ({ ...page, elements: page.elements.map((item) => (item.id === elementId ? updater(item) : item)) }));
  }
  function addElement(type: ElementType) {
    const next = makeElement(type, { x: 12, y: 14 + Math.min((selectedPage?.elements.length ?? 0) * 4, 26) });
    updateSelectedPage((page) => ({ ...page, elements: [...page.elements, next] }));
    setSelectedElementId(next.id);
    setIsPageSelected(false);
  }
  function addElementPreset(type: ElementType, overrides: Partial<DesignElement>) {
    const next = makeElement(type, { x: 12, y: 14 + Math.min((selectedPage?.elements.length ?? 0) * 4, 26), ...overrides });
    updateSelectedPage((page) => ({ ...page, elements: [...page.elements, next] }));
    setSelectedElementId(next.id);
    setIsPageSelected(false);
  }
  function applyTemplate(template: Format | "pitch") {
    if (!activeCompany) return;
    const nextPages = buildTemplate(template, activeCompany.businessName, activeCompany.idea, activeCompany.uniqueTags);
    commitPages(nextPages);
    setCanvasZoom(0.8);
    setIsEditorOpen(true);
    setSelectedPageId(nextPages[0]?.id ?? "");
    setSelectedElementId(nextPages[0]?.elements[0]?.id ?? "");
    setIsPageSelected(!nextPages[0]?.elements[0]);
  }
  function applyDeckTemplate(variant: number) {
    if (!activeCompany) return;
    const nextPages = buildDeckTemplate(variant, activeCompany.businessName, activeCompany.idea, activeCompany.uniqueTags);
    commitPages(nextPages);
    setCanvasZoom(0.8);
    setIsEditorOpen(true);
    setSelectedPageId(nextPages[0]?.id ?? "");
    setSelectedElementId(nextPages[0]?.elements[0]?.id ?? "");
    setIsPageSelected(!nextPages[0]?.elements[0]);
  }
  function applyPageTemplate(variant: number) {
    if (!activeCompany || !selectedPage) return;
    const next = createTemplateForFormat(selectedPage.format, variant, activeCompany.businessName, activeCompany.idea);
    updateSelectedPage((page) => ({ ...next, id: page.id, format: page.format }));
    setSelectedElementId(next.elements[0]?.id ?? "");
    setIsPageSelected(!next.elements[0]);
  }
  function startBlankCanvas() {
    const next = makePage(t.blankCanvas, "presentation", []);
    commitPages([next]);
    setSelectedPageId(next.id);
    setSelectedElementId("");
    setIsPageSelected(true);
    setIsEditorOpen(true);
  }
  function addPage() {
    const next = makePage("Blank page", selectedPage?.format ?? "presentation", []);
    commitPages((current) => [...current, next]);
    setIsEditorOpen(true);
    setSelectedPageId(next.id);
    setSelectedElementId("");
    setIsPageSelected(true);
  }
  function deletePage(pageId = selectedPageId) {
    if (pages.length <= 1) return;
    const deletedIndex = Math.max(0, pages.findIndex((page) => page.id === pageId));
    const nextPages = pages.filter((page) => page.id !== pageId);
    const fallback = nextPages[Math.min(deletedIndex, nextPages.length - 1)] ?? nextPages[0];
    commitPages(nextPages);
    setSelectedPageId(fallback?.id ?? "");
    setSelectedElementId(fallback?.elements[0]?.id ?? "");
    setIsPageSelected(!fallback?.elements[0]);
  }
  function duplicateElement() {
    if (!selectedElement) return;
    const copy = { ...selectedElement, id: uid(selectedElement.type), x: clamp(selectedElement.x + 4, 0, 88), y: clamp(selectedElement.y + 4, 0, 88) };
    updateSelectedPage((page) => ({ ...page, elements: [...page.elements, copy] }));
    setSelectedElementId(copy.id);
    setIsPageSelected(false);
  }
  function deleteElement() {
    if (!selectedElement) return;
    updateSelectedPage((page) => ({ ...page, elements: page.elements.filter((item) => item.id !== selectedElement.id) }));
    setSelectedElementId("");
    setIsPageSelected(true);
  }
  function moveLayer(direction: "front" | "back") {
    if (!selectedElement) return;
    updateSelectedPage((page) => {
      const rest = page.elements.filter((item) => item.id !== selectedElement.id);
      return { ...page, elements: direction === "front" ? [...rest, selectedElement] : [selectedElement, ...rest] };
    });
  }
  function setSelectedElementColor(color: string) {
    if (!selectedElement) return;
    updateElement(selectedElement.id, (item) => ({ ...item, backgroundColor: item.type === "heading" || item.type === "text" ? item.backgroundColor : color, color: item.type === "heading" || item.type === "text" ? color : color === "#FFFFFF" ? "#0F172A" : item.color }));
  }
  function updateSelectedElementStyle(patch: Partial<DesignElement>) {
    if (!selectedElement) return;
    updateElement(selectedElement.id, (item) => ({ ...item, ...patch }));
  }
  function adjustSelectedFont(delta: number) {
    if (!selectedElement) return;
    updateElement(selectedElement.id, (item) => ({ ...item, fontSize: clamp(item.fontSize + delta, 8, 56) }));
  }
  async function replaceSelectedImage() {
    if (!selectedElement) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.showToast(t.error, "Photo library permission is required.", "error");
        return;
      }
      Keyboard.dismiss();
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.92, selectionLimit: 1 });
      if (result.canceled || !result.assets[0]?.uri) return;
      updateElement(selectedElement.id, (item) => ({ ...item, type: "image", imageUri: result.assets[0].uri, imageFit: item.imageFit ?? "cover", text: "", backgroundColor: "#EEF2FF" }));
    } catch (error) {
      toast.showToast(t.error, error instanceof Error ? error.message : "Failed to replace image", "error");
    }
  }
  function addPhotoFromUri(uri: string) {
    const next = makeElement("image", { text: "", imageUri: uri, imageFit: "cover", width: 52, height: 34, radius: 16, backgroundColor: "#EEF2FF" });
    updateSelectedPage((page) => ({ ...page, elements: [...page.elements, next] }));
    setSelectedElementId(next.id);
    setIsPageSelected(false);
  }
  function setBackgroundPhoto(uri: string) {
    const next = makeElement("image", { text: "", x: 0, y: 0, width: 100, height: 100, radius: 0, imageUri: uri, imageFit: "cover", backgroundColor: "#EEF2FF" });
    updateSelectedPage((page) => ({ ...page, elements: [next, ...page.elements] }));
    setSelectedElementId(next.id);
    setIsPageSelected(false);
  }
  async function pickAndAddMedia() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.showToast(t.error, "Photo library permission is required.", "error");
        return;
      }
      Keyboard.dismiss();
      const result = await (ImagePicker.launchImageLibraryAsync as any)({ mediaTypes: ["images", "videos"], allowsEditing: false, quality: 0.92, selectionLimit: 1 });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      if (asset.type === "video") {
        addElementPreset("shape", { text: "", width: 46, height: 28, radius: 14, backgroundColor: "#8B5CF6", color: "#8B5CF6", shapeKind: "video" });
        return;
      }
      const next = makeElement("image", { text: "", imageUri: asset.uri, imageFit: "cover", width: 52, height: 34, radius: 16, backgroundColor: "#EEF2FF" });
      updateSelectedPage((page) => ({ ...page, elements: [...page.elements, next] }));
      setSelectedElementId(next.id);
      setIsPageSelected(false);
    } catch (error) {
      toast.showToast(t.error, error instanceof Error ? error.message : "Failed to upload media", "error");
    }
  }
  async function exportDesign(kind: ExportKind) {
    const html = `<html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,sans-serif;">${pages.map(pageToHtml).join("")}</body></html>`;
    try {
      if (kind === "svg") {
        const body = designToSvgDocument(pages);
        const uri = await writeExportFile("bizplan-design.svg", body);
        await shareExport(uri, "svg");
        return;
      }
      if (kind === "pdf") {
        const result = await Print.printToFileAsync({ html });
        await shareExport(result.uri, "pdf");
        return;
      }
      const extension = kind === "json" || kind === "canva" ? "json" : kind === "ppt" ? "html" : "html";
      const body = kind === "json" || kind === "canva" ? JSON.stringify({ pages, exportedAt: new Date().toISOString(), format: kind === "canva" ? "canva-import" : "bizplan-project" }, null, 2) : html;
      const fileName = kind === "ppt" ? "bizplan-presentation-powerpoint.html" : kind === "canva" ? "bizplan-canva-project.json" : `bizplan-design.${extension}`;
      const uri = await writeExportFile(fileName, body);
      await shareExport(uri, kind);
    } catch (error) {
      toast.showToast(t.error, error instanceof Error ? error.message : t.failedSave, "error");
    }
  }
  async function copyDocument() {
    const text = kind === "pitch-deck" ? pages.map((page, index) => `${index + 1}. ${page.title}\n${page.elements.map((item) => item.text).filter(Boolean).join("\n")}`).join("\n\n") : document?.sections.map((section) => `${section.title}\n${section.body}\n${section.bullets?.join("\n") ?? ""}`).join("\n\n") ?? "";
    await Clipboard.setStringAsync(text);
    toast.showToast(t.copied, "", "success");
  }

  if (isLoading) return <LinearGradient colors={palette.gradient} style={styles.center}><ActivityIndicator color={palette.text} /></LinearGradient>;
  if (!activeCompany) return <LinearGradient colors={palette.gradient} style={styles.center}><Text style={[styles.emptyTitle, { color: palette.text }]}>{t.noCompany}</Text><Text style={[styles.emptyBody, { color: palette.muted }]}>{t.noCompanyBody}</Text></LinearGradient>;

  if (kind === "pitch-deck" && !isEditorOpen) {
    return <PitchDeckChooser t={t} palette={palette} pages={pages} onBack={() => router.back()} onContinue={() => setIsEditorOpen(true)} onBlank={startBlankCanvas} onTemplate={applyTemplate} />;
  }

  if (kind === "pitch-deck" && selectedPage) {
    return (
      <View style={[styles.canvaRoot, { backgroundColor: palette.workspace }]}>
        <StatusBar hidden={isLandscape} barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView style={[styles.canvaSafe, isLandscape ? styles.canvaSafeLandscape : null]}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0} style={styles.canvaKeyboard}>
          <View style={[styles.canvaHeader, isLandscape ? styles.canvaHeaderLandscape : null, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Pressable onPress={() => setIsEditorOpen(false)} style={styles.canvaIconButton}><ArrowLeft size={20} color={palette.text} /></Pressable>
            <TextInput value={selectedPage.title} onChangeText={(value) => updateSelectedPage((page) => ({ ...page, title: value }))} placeholder={t.pageTitle} placeholderTextColor={palette.muted} style={[styles.canvaTitleInput, { color: palette.text }]} />
            <Pressable disabled={!history.length} onPress={undoDesign} style={[styles.canvaIconButton, !history.length ? styles.disabledIconButton : null]}><Undo2 size={18} color={history.length ? palette.text : palette.muted} /></Pressable>
            <Pressable disabled={!future.length} onPress={redoDesign} style={[styles.canvaIconButton, !future.length ? styles.disabledIconButton : null]}><Redo2 size={18} color={future.length ? palette.text : palette.muted} /></Pressable>
            <Pressable onPress={() => void copyDocument()} style={styles.canvaIconButton}><Copy size={18} color={palette.text} /></Pressable>
            <Pressable disabled={isSaving} onPress={() => saveValue("pitch_deck", { pages, updatedAt: new Date().toISOString() })} style={styles.canvaSaveButton}>{isSaving ? <ActivityIndicator color="#fff" /> : <Save size={18} color="#fff" />}</Pressable>
          </View>

          <PinchZoomStage zoom={canvasZoom} landscape={isLandscape} onZoom={setCanvasZoom} onPress={() => { Keyboard.dismiss(); setSelectedElementId(""); setIsPageSelected(false); }}>
            <Pressable {...(drawingTool ? drawingResponder.panHandlers : {})} onPress={(event) => { event.stopPropagation(); if (drawingTool) return; Keyboard.dismiss(); setSelectedElementId(""); setIsPageSelected(true); }} onLayout={(event) => setCanvasSize(event.nativeEvent.layout)} style={[styles.blankPage, isLandscape ? styles.blankPageLandscape : null, baseCanvasStyleFor(selectedPage.format), isPageSelected && !selectedElement ? { borderWidth: 2, borderColor: palette.purple } : null, { backgroundColor: selectedPage.background, transform: [{ scale: displayZoom }] }]}>
              {selectedPage.elements.map((item) => <DesignBlock key={item.id} item={item} selected={item.id === selectedElementId} canvasSize={canvasSize} onPress={() => { setSelectedElementId(item.id); setIsPageSelected(false); }} onMove={(x, y) => updateElement(item.id, (current) => ({ ...current, x: clamp(x, 0, 94), y: clamp(y, 0, 94) }))} onResize={(width, height, fontSize) => updateElement(item.id, (current) => ({ ...current, width: clamp(width, 7, 95), height: clamp(height, 5, 92), fontSize: clamp(fontSize, 8, 72) }))} />)}

            </Pressable>
          </PinchZoomStage>

          {selectedElement && selectedElement.type !== "shape" ? <View style={[styles.textEditPanel, { backgroundColor: palette.card, borderColor: palette.border }]}><TextInput value={selectedElement.text} onChangeText={(value) => updateElement(selectedElement.id, (item) => ({ ...item, text: value }))} placeholder={t.elementText} placeholderTextColor={palette.muted} style={[styles.textEditInput, { color: palette.text }]} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} /></View> : null}
          {selectedElement ? <ElementQuickToolbar item={selectedElement} palette={palette} onStyle={() => { setPanelSearch(""); setActivePanel("style"); }} onAnimation={() => { setPanelSearch(""); setActivePanel("animation"); }} onDuplicate={duplicateElement} onForward={() => moveLayer("front")} onBack={() => moveLayer("back")} onDelete={deleteElement} /> : null}

          <View style={[styles.bottomDock, isLandscape ? styles.bottomDockLandscape : null, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <PageStrip pages={pages} selectedPageId={selectedPageId} palette={palette} onSelect={(page) => { setSelectedPageId(page.id); setSelectedElementId(page.elements[0]?.id ?? ""); setIsPageSelected(!page.elements[0]); }} onAdd={addPage} onDelete={deletePage} />
            <ActiveBottomTools selectedElement={selectedElement} pageSelected={isPageSelected && !selectedElement} palette={palette} t={t} onColor={setSelectedElementColor} onDuplicate={duplicateElement} onDelete={deleteElement} onForward={() => moveLayer("front")} onBack={() => moveLayer("back")} onOpenPanel={(panel) => { setPanelSearch(""); setActivePanel(panel); }} onAddElement={addElement} onAddPage={addPage} onPageColor={(color) => updateSelectedPage((page) => ({ ...page, background: color }))} onStyleElement={updateSelectedElementStyle} onAdjustFont={adjustSelectedFont} onReplaceImage={replaceSelectedImage} onZoomIn={() => setCanvasZoom((value) => clamp(value + 0.08, 0.5, 1.8))} onZoomOut={() => setCanvasZoom((value) => clamp(value - 0.08, 0.5, 1.8))} />
          </View>
          <EditorPanelSheet activePanel={activePanel} search={panelSearch} t={t} palette={palette} pages={pages} currentFormat={selectedPage.format} selectedElement={selectedElement} pageSelected={isPageSelected && !selectedElement} onSearch={setPanelSearch} onPanelChange={(panel) => { setPanelSearch(""); setActivePanel(panel); }} onClose={() => setActivePanel(null)} onApplyPageTemplate={applyPageTemplate} onApplyDeckTemplate={applyDeckTemplate} onAddElement={addElement} onAddPreset={addElementPreset} onStyleElement={updateSelectedElementStyle} onAdjustFont={adjustSelectedFont} onStylePage={(color) => updateSelectedPage((page) => ({ ...page, background: color }))} onReplaceImage={replaceSelectedImage} onExport={exportDesign} onAddPage={addPage} onPickUpload={pickAndAddMedia} onAddPhoto={addPhotoFromUri} onSetBackgroundPhoto={setBackgroundPhoto} onSetDrawingTool={setDrawingTool} onSelectPage={(page) => { setSelectedPageId(page.id); setSelectedElementId(page.elements[0]?.id ?? ""); setIsPageSelected(!page.elements[0]); setActivePanel(null); }} />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  const Icon = kind === "guides" ? BookOpen : Compass;
  return (
    <LinearGradient colors={palette.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardWrap}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={[styles.headerButton, { backgroundColor: palette.card, borderColor: palette.border }]}><ArrowLeft size={20} color={palette.text} /></Pressable>
              <Pressable onPress={() => void copyDocument()} style={[styles.headerButton, { backgroundColor: palette.card, borderColor: palette.border }]}><Copy size={18} color={palette.text} /></Pressable>
            </View>
            <LinearGradient colors={palette.hero} style={[styles.hero, { borderColor: palette.border }]}>
              <View style={[styles.badge, { backgroundColor: palette.chip, borderColor: palette.border }]}><Icon size={14} color={palette.accent} /><Text style={[styles.badgeText, { color: palette.muted }]}>{t.eyebrow}</Text></View>
              <Text style={[styles.heroTitle, { color: palette.text }]}>{t.title}</Text>
              <Text style={[styles.heroBody, { color: palette.muted }]}>{t.body}</Text>
              <Text style={[styles.companyPill, { color: palette.text, backgroundColor: palette.chip }]}>{activeCompany.businessName}</Text>
            </LinearGradient>
            {document ? <>
              <View style={styles.rowButtons}>
                <Pressable style={styles.secondaryButton} onPress={() => setDocument(buildDocument(kind, language, activeCompany.businessName, activeCompany.idea, activeCompany.place, activeCompany.uniqueTags))}><Sparkles size={16} color="#fff" /><Text style={styles.buttonText}>{t.regenerate}</Text></Pressable>
                <Pressable disabled={isSaving} style={styles.primaryButton} onPress={() => saveValue(kind === "guides" ? "guides_document" : "market_research_document", document)}>{isSaving ? <ActivityIndicator color="#0f172a" /> : <Save size={16} color="#0f172a" />}<Text style={styles.primaryButtonText}>{t.save}</Text></Pressable>
              </View>
              {document.sections.map((section) => <LinearGradient key={section.title} colors={palette.cardGradient} style={[styles.card, { borderColor: palette.border }]}><Text style={[styles.sectionTitle, { color: palette.text }]}>{section.title}</Text><Text style={[styles.sectionBody, { color: palette.muted }]}>{section.body}</Text>{section.bullets?.map((bullet) => <Text key={bullet} style={[styles.bullet, { color: palette.text }]}>- {bullet}</Text>)}</LinearGradient>)}
            </> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PitchDeckChooser({ t, palette, pages, onBack, onContinue, onBlank, onTemplate }: { t: ReturnType<typeof getCopy>; palette: ReturnType<typeof getPalette>; pages: DesignPage[]; onBack: () => void; onContinue: () => void; onBlank: () => void; onTemplate: (template: Format | "pitch") => void }) {
  const cards: Array<{ title: string; body: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; action: () => void; accent: string }> = [
    { title: t.presentationTool, body: t.presentationBody, icon: Presentation, action: () => onTemplate("pitch"), accent: "#4D2FB2" },
    { title: t.socialTool, body: t.socialBody, icon: Square, action: () => onTemplate("instagram"), accent: "#01A06D" },
    { title: t.instagramTool, body: t.instagramBody, icon: Image, action: () => onTemplate("instagram"), accent: "#F97316" },
    { title: t.facebookTool, body: t.facebookBody, icon: Presentation, action: () => onTemplate("facebook"), accent: "#0EA5E9" },
    { title: t.storyTool, body: t.storyBody, icon: Image, action: () => onTemplate("story"), accent: "#DFAE55" },
    { title: t.flyerTool, body: t.flyerBody, icon: TextCursorInput, action: () => onTemplate("flyer"), accent: "#183B35" },
    { title: t.productTool, body: t.productBody, icon: BadgePlus, action: () => onTemplate("product"), accent: "#EF4444" },
    { title: t.blankCanvas, body: t.chooseBody, icon: Plus, action: onBlank, accent: "#111827" },
  ];

  return (
    <LinearGradient colors={palette.gradient} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.chooserContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={onBack} style={[styles.headerButton, { backgroundColor: palette.card, borderColor: palette.border }]}><ArrowLeft size={20} color={palette.text} /></Pressable>
            {pages.length ? <Pressable onPress={onContinue} style={[styles.continueButton, { backgroundColor: palette.purple }]}><Text style={styles.continueText}>{t.continueDesign}</Text></Pressable> : null}
          </View>
          <LinearGradient colors={palette.hero} style={[styles.hero, { borderColor: palette.border }]}>
            <View style={[styles.badge, { backgroundColor: palette.chip, borderColor: palette.border }]}><Presentation size={14} color={palette.accent} /><Text style={[styles.badgeText, { color: palette.muted }]}>{t.eyebrow}</Text></View>
            <Text style={[styles.heroTitle, { color: palette.text }]}>{t.chooseTitle}</Text>
            <Text style={[styles.heroBody, { color: palette.muted }]}>{t.chooseBody}</Text>
          </LinearGradient>
          <View style={styles.chooserGrid}>
            {cards.map((card) => <ChooserCard key={card.title} card={card} palette={palette} />)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ChooserCard({ card, palette }: { card: { title: string; body: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; action: () => void; accent: string }; palette: ReturnType<typeof getPalette> }) {
  const Icon = card.icon;
  return (
    <Pressable onPress={card.action} style={[styles.chooserCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <LinearGradient colors={[`${card.accent}36`, "rgba(255,255,255,0.04)"]} style={styles.chooserPreview}>
        <View style={[styles.chooserIcon, { backgroundColor: card.accent }]}><Icon size={22} color="#fff" /></View>
        <View style={styles.chooserLines}><View style={styles.chooserLineWide} /><View style={styles.chooserLine} /></View>
      </LinearGradient>
      <Text style={[styles.chooserTitle, { color: palette.text }]}>{card.title}</Text>
      <Text style={[styles.chooserBody, { color: palette.muted }]} numberOfLines={2}>{card.body}</Text>
    </Pressable>
  );
}

function animationFor(animation: DesignElement["animation"]) {
  if (animation === "fade") return { from: { opacity: 0.35 }, animate: { opacity: 1 }, transition: { loop: true, type: "timing", duration: 1400 } } as const;
  if (animation === "pop") return { from: { scale: 0.94 }, animate: { scale: 1.04 }, transition: { loop: true, type: "timing", duration: 900 } } as const;
  if (animation === "rise") return { from: { translateY: 8, opacity: 0.65 }, animate: { translateY: 0, opacity: 1 }, transition: { loop: true, type: "timing", duration: 1200 } } as const;
  if (animation === "pan") return { from: { translateX: -5 }, animate: { translateX: 5 }, transition: { loop: true, type: "timing", duration: 1400 } } as const;
  if (animation === "breathe") return { from: { scale: 0.98 }, animate: { scale: 1.02 }, transition: { loop: true, type: "timing", duration: 1600 } } as const;
  if (animation === "tumble") return { from: { rotate: "-2deg" }, animate: { rotate: "2deg" }, transition: { loop: true, type: "timing", duration: 1000 } } as const;
  return { from: { opacity: 1 }, animate: { opacity: 1 }, transition: { type: "timing", duration: 1 } } as const;
}
function imageFilterColor(filter: DesignElement["imageFilter"]) {
  if (filter === "warm") return "rgba(249,115,22,0.20)";
  if (filter === "cool") return "rgba(14,165,233,0.20)";
  if (filter === "mono") return "rgba(15,23,42,0.34)";
  if (filter === "vivid") return "rgba(1,160,109,0.18)";
  return "transparent";
}
function DrawnShape({ item }: { item: DesignElement }) {
  const fill = item.backgroundColor === "transparent" ? item.color : item.backgroundColor;
  const stroke = item.borderColor ?? item.color;
  const kind = item.shapeKind;
  if (!kind) return null;
  if (kind === "triangle") return <View style={styles.drawnCenter}><View style={[styles.drawnTriangle, { borderBottomColor: fill }]} /></View>;
  if (kind === "pentagon") return <View style={styles.drawnCenter}><View style={[styles.drawnPentagon, { backgroundColor: fill }]}><View style={[styles.drawnPentagonTop, { backgroundColor: fill }]} /></View></View>;
  if (kind === "star" || kind === "spark") return <View style={styles.drawnCenter}><View style={[styles.drawnSpark, { backgroundColor: fill, transform: [{ rotate: kind === "star" ? "45deg" : "18deg" }] }]} /></View>;
  if (kind === "arrow-right" || kind === "arrow-left" || kind === "arrow-up") return <View style={styles.drawnCenter}><View style={[styles.drawnArrow, kind === "arrow-left" ? { transform: [{ rotate: "180deg" }] } : kind === "arrow-up" ? { transform: [{ rotate: "-90deg" }] } : null]}><View style={[styles.drawnArrowShaft, { backgroundColor: fill }]} /><View style={[styles.drawnArrowHead, { borderLeftColor: fill }]} /></View></View>;
  if (kind === "line") return <View style={styles.drawnCenter}><View style={[styles.drawnLine, { backgroundColor: fill }]} /></View>;
  if (kind === "dash") return <View style={styles.drawnCenter}><View style={styles.drawnDashRow}>{[0, 1, 2, 3].map((cell) => <View key={cell} style={[styles.drawnDash, { backgroundColor: fill }]} />)}</View></View>;
  if (kind === "flowchart") return <View style={styles.drawnCenter}><View style={styles.drawnFlowchart}><View style={[styles.drawnFlowNode, { borderColor: stroke }]} /><View style={[styles.drawnFlowLine, { backgroundColor: stroke }]} /><View style={[styles.drawnFlowNode, { borderColor: stroke }]} /></View></View>;
  if (kind === "table" || kind === "kpi") return <View style={[styles.drawnTable, { borderColor: stroke }]}>{Array.from({ length: 6 }).map((_, cell) => <View key={cell} style={[styles.drawnTableCell, { borderColor: stroke, backgroundColor: kind === "kpi" ? ["#DBEAFE", "#DCFCE7", "#FEF3C7"][cell % 3] : "transparent" }]} />)}</View>;
  if (kind === "stat") return <View style={styles.drawnStat}><View style={[styles.drawnStatNumber, { backgroundColor: fill }]} /><View style={styles.drawnStatLine} /></View>;
  if (kind === "progress") return <View style={styles.drawnCenter}><View style={styles.drawnProgressTrack}><View style={[styles.drawnProgressFill, { backgroundColor: fill }]} /></View></View>;
  if (kind === "browser") return <View style={[styles.drawnBrowser, { borderColor: stroke }]}><View style={styles.drawnBrowserTop} /><View style={styles.drawnBrowserBody} /></View>;
  if (kind === "qr") return <View style={styles.drawnQr}>{Array.from({ length: 16 }).map((_, cell) => <View key={cell} style={[styles.drawnQrCell, { backgroundColor: cell % 3 === 0 || cell === 5 || cell === 10 ? fill : "transparent" }]} />)}</View>;
  if (kind === "phone") return <View style={[styles.drawnPhone, { backgroundColor: fill }]}><View style={styles.drawnPhoneLine} /></View>;
  if (kind === "chart") return <View style={styles.drawnChart}>{[24, 42, 62, 34].map((height, cell) => <View key={cell} style={[styles.drawnChartBar, { height: `${height}%`, backgroundColor: fill }]} />)}</View>;
  if (kind === "video") return <View style={[styles.drawnVideo, { backgroundColor: fill }]}><View style={styles.drawnPlayTriangle} /></View>;
  if (kind === "music") return <View style={styles.drawnMusicIcon}><View style={[styles.drawnMusicStem, { backgroundColor: fill }]} /><View style={[styles.drawnMusicNote, { backgroundColor: fill }]} /></View>;
  if (kind === "form") return <View style={styles.drawnForm}>{[0, 1, 2].map((row) => <View key={row} style={styles.drawnFormLine} />)}<View style={[styles.drawnFormButton, { backgroundColor: fill }]} /></View>;
  if (kind === "file") return <View style={styles.drawnFile}><View style={[styles.drawnFileCorner, { borderRightColor: fill }]} /><View style={styles.drawnFileLine} /><View style={[styles.drawnFileLine, { width: "52%" }]} /></View>;
  if (kind === "diagram") return <View style={styles.drawnDiagram}><View style={[styles.drawnDiagramNode, { backgroundColor: fill }]} /><View style={styles.drawnDiagramConnector} /><View style={[styles.drawnDiagramNode, { backgroundColor: "#DFAE55" }]} /><View style={styles.drawnDiagramConnector} /><View style={[styles.drawnDiagramNode, { backgroundColor: "#01A06D" }]} /></View>;
  if (kind === "quote") return <View style={styles.drawnQuote}><View style={[styles.drawnQuoteDot, { backgroundColor: fill }]} /><View style={styles.drawnQuoteLine} /><View style={[styles.drawnQuoteLine, { width: "58%" }]} /></View>;
  if (kind === "checklist") return <View style={styles.drawnChecklist}>{[0, 1, 2].map((row) => <View key={row} style={styles.drawnChecklistRow}><View style={[styles.drawnChecklistDot, { backgroundColor: fill }]} /><View style={styles.drawnChecklistLine} /></View>)}</View>;
  return null;
}
function DesignBlock({ item, selected, canvasSize, onPress, onMove, onResize }: { item: DesignElement; selected: boolean; canvasSize: { width: number; height: number }; onPress: () => void; onMove: (x: number, y: number) => void; onResize: (width: number, height: number, fontSize: number) => void }) {
  const isTextOnly = item.type === "heading" || item.type === "text";
  const [frame, setFrame] = useState({ x: item.x, y: item.y, width: item.width, height: item.height, fontSize: item.fontSize });
  const frameRef = useRef(frame);
  const startRef = useRef(frame);

  useEffect(() => {
    const next = { x: item.x, y: item.y, width: item.width, height: item.height, fontSize: item.fontSize };
    frameRef.current = next;
    startRef.current = next;
    setFrame(next);
  }, [item.fontSize, item.height, item.width, item.x, item.y]);

  const beginGesture = () => {
    startRef.current = frameRef.current;
    onPress();
  };

  const dragResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => false,
    onPanResponderGrant: beginGesture,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gesture) => {
      const dx = canvasSize.width > 0 ? (gesture.dx / canvasSize.width) * 100 : 0;
      const dy = canvasSize.height > 0 ? (gesture.dy / canvasSize.height) * 100 : 0;
      const next = { ...frameRef.current, x: clamp(startRef.current.x + dx, 0, 94), y: clamp(startRef.current.y + dy, 0, 94) };
      frameRef.current = next;
      setFrame(next);
    },
    onPanResponderRelease: () => onMove(frameRef.current.x, frameRef.current.y),
    onPanResponderTerminate: () => onMove(frameRef.current.x, frameRef.current.y),
  }), [canvasSize.height, canvasSize.width, onMove, onPress]);

  const resizeResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderGrant: beginGesture,
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gesture) => {
      const averageSize = Math.max((canvasSize.width + canvasSize.height) / 2, 1);
      const drag = Math.abs(gesture.dx) > Math.abs(gesture.dy) ? gesture.dx : gesture.dy;
      const scale = clamp(1 + (drag / averageSize) * 0.62, 0.25, 3);
      const nextWidth = clamp(startRef.current.width * scale, 7, 95);
      const nextHeight = clamp(startRef.current.height * scale, 5, 92);
      const next = {
        ...frameRef.current,
        width: nextWidth,
        height: nextHeight,
        fontSize: clamp(Math.round(startRef.current.fontSize * scale), 8, 72),
      };
      frameRef.current = next;
      setFrame(next);
    },
    onPanResponderRelease: () => onResize(frameRef.current.width, frameRef.current.height, frameRef.current.fontSize),
    onPanResponderTerminate: () => onResize(frameRef.current.width, frameRef.current.height, frameRef.current.fontSize),
  }), [canvasSize.height, canvasSize.width, onPress, onResize]);

  const blockStyle = { left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.width}%`, height: `${frame.height}%`, backgroundColor: isTextOnly || item.shapeKind ? "transparent" : item.backgroundColor, borderRadius: item.radius, borderColor: item.borderColor ?? "rgba(15,23,42,0.14)", borderWidth: item.shapeKind ? 0 : item.borderWidth ?? (item.type === "image" ? 1 : 0), borderStyle: item.borderStyle ?? "solid", opacity: item.opacity ?? 1, overflow: selected || item.shadow || item.shapeKind ? "visible" : "hidden", transform: [{ rotate: `${item.rotation ?? 0}deg` }] } as const;
  const shadowStyle = item.shadow ? { shadowColor: item.shadowColor ?? "#000", shadowOpacity: 0.20, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 } : null;
  const motion = animationFor(item.animation);
  return <MotiView from={motion.from} animate={motion.animate} transition={motion.transition} style={[styles.designBlock, item.type === "image" || item.shapeKind ? styles.designBlockFlush : null, blockStyle, shadowStyle]} {...dragResponder.panHandlers}>{item.shapeKind ? <DrawnShape item={item} /> : null}{item.type === "image" && item.imageUri ? <RNImage source={{ uri: item.imageUri }} blurRadius={item.blurRadius ?? 0} style={[styles.designImage, { borderRadius: item.radius }]} resizeMode={item.imageFit ?? "cover"} /> : null}{item.type === "image" && item.imageFilter && item.imageFilter !== "none" ? <View pointerEvents="none" style={[styles.designImageFilter, { backgroundColor: imageFilterColor(item.imageFilter) }]} /> : null}{item.type === "image" && !item.imageUri ? <Image size={18} color={item.color} /> : null}{!item.shapeKind && item.text ? <Text style={[styles.designText, { color: item.color, fontSize: frame.fontSize, lineHeight: item.lineHeight ?? Math.round(frame.fontSize * 1.18), textAlign: item.textAlign ?? (item.type === "button" || item.type === "badge" ? "center" : "left"), fontWeight: item.fontWeight ?? "900", fontFamily: item.fontFamily, fontStyle: item.fontStyle ?? "normal", textShadowColor: item.textEffect && item.textEffect !== "none" ? item.shadowColor ?? item.color : "transparent", textShadowRadius: item.textEffect === "glow" ? 8 : item.textEffect === "shadow" || item.textEffect === "lift" || item.textEffect === "outline" ? 3 : 0, textShadowOffset: item.textEffect === "shadow" || item.textEffect === "lift" ? { width: 2, height: 2 } : { width: 0, height: 0 }, letterSpacing: item.letterSpacing ?? 0, textDecorationLine: item.textDecorationLine ?? "none", textTransform: item.textTransform ?? "none" }]} numberOfLines={6}>{item.text}</Text> : null}{selected ? <View pointerEvents="none" style={styles.selectedFrame} /> : null}{selected ? <View style={styles.resizeHandle} {...resizeResponder.panHandlers}><Maximize2 size={12} color="#fff" /></View> : null}</MotiView>;
}
function PinchZoomStage({ zoom, landscape, onZoom, onPress, children }: { zoom: number; landscape?: boolean; onZoom: (value: number) => void; onPress: () => void; children: React.ReactNode }) {
  const distanceRef = useRef<number | null>(null);
  const startZoomRef = useRef(zoom);
  const frameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const pendingZoomRef = useRef(zoom);

  useEffect(() => {
    startZoomRef.current = zoom;
    pendingZoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const scheduleZoom = (value: number) => {
    pendingZoomRef.current = value;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      onZoom(pendingZoomRef.current);
    });
  };

  return (
    <Pressable
      style={[styles.canvaStage, landscape ? styles.canvaStageLandscape : null]}
      onPress={onPress}
      onTouchStart={(event) => {
        if (event.nativeEvent.touches.length === 2) {
          const [a, b] = event.nativeEvent.touches;
          distanceRef.current = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
          startZoomRef.current = zoom;
        }
      }}
      onTouchMove={(event) => {
        if (event.nativeEvent.touches.length === 2 && distanceRef.current) {
          const [a, b] = event.nativeEvent.touches;
          const nextDistance = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
          const ratio = nextDistance / distanceRef.current;
          const rawZoom = clamp(startZoomRef.current * ratio, 0.5, 1.8);
          scheduleZoom(zoom + (rawZoom - zoom) * 0.28);
        }
      }}
      onTouchEnd={() => { distanceRef.current = null; }}
    >
      {children}
    </Pressable>
  );
}
function ActiveBottomTools({ selectedElement, pageSelected, palette, t, onDuplicate, onDelete, onForward, onBack, onOpenPanel, onAddPage, onReplaceImage, onZoomIn, onZoomOut }: { selectedElement?: DesignElement; pageSelected: boolean; palette: ReturnType<typeof getPalette>; t: ReturnType<typeof getCopy>; onColor: (color: string) => void; onDuplicate: () => void; onDelete: () => void; onForward: () => void; onBack: () => void; onOpenPanel: (panel: Exclude<EditorPanel, null>) => void; onAddElement: (type: ElementType) => void; onAddPage: () => void; onPageColor: (color: string) => void; onStyleElement: (patch: Partial<DesignElement>) => void; onAdjustFont: (delta: number) => void; onReplaceImage: () => void; onZoomIn: () => void; onZoomOut: () => void }) {
  if (!selectedElement && pageSelected) {
    return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomTools} keyboardShouldPersistTaps="handled"><DockButton label="Page style" icon={Brush} onPress={() => onOpenPanel("style")} palette={palette} /><DockButton label="Templates" icon={Layers} onPress={() => onOpenPanel("templates")} palette={palette} /><DockButton label="Elements" icon={Box} onPress={() => onOpenPanel("elements")} palette={palette} /><DockButton label="Text" icon={TextCursorInput} onPress={() => onOpenPanel("text")} palette={palette} /><DockButton label="Instruments" icon={Pencil} onPress={() => onOpenPanel("instruments")} palette={palette} /><DockButton label={t.addPage} icon={Plus} onPress={onAddPage} palette={palette} /><DockButton label="Downloads" icon={Download} onPress={() => onOpenPanel("downloads")} palette={palette} /><DockButton label="Zoom -" icon={Maximize2} onPress={onZoomOut} palette={palette} /><DockButton label="Zoom +" icon={Maximize2} onPress={onZoomIn} palette={palette} /></ScrollView>;
  }
  if (!selectedElement) {
    return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomTools} keyboardShouldPersistTaps="handled"><DockButton label="Templates" icon={Layers} onPress={() => onOpenPanel("templates")} palette={palette} /><DockButton label="Elements" icon={Box} onPress={() => onOpenPanel("elements")} palette={palette} /><DockButton label="Text" icon={TextCursorInput} onPress={() => onOpenPanel("text")} palette={palette} /><DockButton label="Instruments" icon={Pencil} onPress={() => onOpenPanel("instruments")} palette={palette} /><DockButton label="Downloads" icon={Download} onPress={() => onOpenPanel("downloads")} palette={palette} /><DockButton label="Zoom -" icon={Maximize2} onPress={onZoomOut} palette={palette} /><DockButton label="Zoom +" icon={Maximize2} onPress={onZoomIn} palette={palette} /></ScrollView>;
  }
  if (selectedElement.type === "image") {
    return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomTools} keyboardShouldPersistTaps="handled"><DockButton label="Style" icon={Brush} onPress={() => onOpenPanel("style")} palette={palette} /><DockButton label="Animation" icon={Sparkles} onPress={() => onOpenPanel("animation")} palette={palette} /><DockButton label="Replace" icon={Image} onPress={onReplaceImage} palette={palette} /><DockButton label={t.duplicate} icon={Copy} onPress={onDuplicate} palette={palette} /><DockButton label={t.forward} icon={BringToFront} onPress={onForward} palette={palette} /><DockButton label={t.back} icon={SendToBack} onPress={onBack} palette={palette} /><DockButton label={t.delete} icon={Trash2} onPress={onDelete} palette={palette} danger /></ScrollView>;
  }
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomTools} keyboardShouldPersistTaps="handled"><DockButton label="Style" icon={Brush} onPress={() => onOpenPanel("style")} palette={palette} /><DockButton label="Animation" icon={Sparkles} onPress={() => onOpenPanel("animation")} palette={palette} /><DockButton label={t.duplicate} icon={Copy} onPress={onDuplicate} palette={palette} /><DockButton label={t.forward} icon={BringToFront} onPress={onForward} palette={palette} /><DockButton label={t.back} icon={SendToBack} onPress={onBack} palette={palette} /><DockButton label={t.delete} icon={Trash2} onPress={onDelete} palette={palette} danger /></ScrollView>;
}
function PageStrip({ pages, selectedPageId, palette, onSelect, onAdd, onDelete }: { pages: DesignPage[]; selectedPageId: string; palette: ReturnType<typeof getPalette>; onSelect: (page: DesignPage) => void; onAdd: () => void; onDelete: (pageId: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pageStrip}>{pages.map((page, index) => {
    const selected = selectedPageId === page.id;
    return <React.Fragment key={page.id}><Pressable onPress={() => onSelect(page)} style={[styles.pageThumb, { borderColor: selected ? palette.purple : palette.border, backgroundColor: page.background }]}><Text style={styles.pageThumbNumber}>{index + 1}</Text><View style={styles.pageThumbLine} /><View style={[styles.pageThumbLine, { width: "55%" }]} />{selected && pages.length > 1 ? <Pressable hitSlop={8} onPress={(event) => { event.stopPropagation(); onDelete(page.id); }} style={[styles.pageDeleteButton, { backgroundColor: palette.danger }]}><XIcon size={10} color="#fff" /></Pressable> : null}</Pressable>{index < pages.length - 1 ? <Pressable onPress={onAdd} style={[styles.pagePlus, { borderColor: palette.border }]}><Plus size={14} color={palette.text} /></Pressable> : null}</React.Fragment>;
  })}<Pressable onPress={onAdd} style={[styles.pageThumbAdd, { borderColor: palette.border, backgroundColor: palette.chip }]}><Plus size={18} color={palette.text} /></Pressable></ScrollView>;
}

function ContextToolbar({ selectedElement, palette, t, onColor, onDuplicate, onDelete, onForward, onBack }: { selectedElement: DesignElement; palette: ReturnType<typeof getPalette>; t: ReturnType<typeof getCopy>; onColor: (color: string) => void; onDuplicate: () => void; onDelete: () => void; onForward: () => void; onBack: () => void }) {
  const isText = selectedElement.type === "heading" || selectedElement.type === "text" || selectedElement.type === "button" || selectedElement.type === "badge";
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contextTools}>{isText ? SWATCHES.map((color) => <Pressable key={color} onPress={() => onColor(color)} style={[styles.colorDot, { backgroundColor: color, borderColor: palette.border }]} />) : SWATCHES.map((color) => <Pressable key={color} onPress={() => onColor(color)} style={[styles.colorPill, { backgroundColor: color, borderColor: palette.border }]} />)}<DockButton label={t.duplicate} icon={Copy} onPress={onDuplicate} palette={palette} /><DockButton label={t.forward} icon={BringToFront} onPress={onForward} palette={palette} /><DockButton label={t.back} icon={SendToBack} onPress={onBack} palette={palette} /><DockButton label={t.delete} icon={Trash2} onPress={onDelete} palette={palette} danger /></ScrollView>;
}

function CanvaTemplatePreview({ index }: { title: string; index: number }) {
  const variant = index % 12;
  const canvas = (children: React.ReactNode, bg = "#FFFFFF") => <View style={[styles.templatePreviewCanvas, { backgroundColor: bg }]}>{children}</View>;
  if (variant === 0) return canvas(<><View style={[styles.templateHeroBlock, { backgroundColor: "#111827" }]} /><View style={[styles.templateAccentBar, { backgroundColor: "#DFAE55" }]} /><View style={[styles.templateMiniCircle, { backgroundColor: "#4D2FB2" }]} /><View style={styles.templateLineStack}><View style={[styles.templateLineDark, { width: "82%" }]} /><View style={[styles.templateLineDark, { width: "54%" }]} /></View></>, "#F8FAFC");
  if (variant === 1) return canvas(<><View style={[styles.templateSplitLeft, { backgroundColor: "#EF4444" }]} /><View style={[styles.templateSplitRight, { backgroundColor: "#111827" }]} /><View style={[styles.templatePosterText, { backgroundColor: "#FFFFFF", top: 16, left: 9, width: 42 }]} /><View style={[styles.templatePosterText, { backgroundColor: "#FFFFFF", top: 27, left: 9, width: 30 }]} /><View style={[styles.templateMiniPhoto, { right: 9, bottom: 8 }]} /></>, "#EF4444");
  if (variant === 2) return canvas(<><View style={styles.templateTechRing} /><View style={[styles.templateTechRing, { width: 34, height: 34, borderRadius: 17, right: 8, top: 8 }]} /><View style={[styles.templateGlowDot, { left: 14, bottom: 13 }]} /><View style={[styles.templateLineLight, { width: "62%", bottom: 10 }]} /></>, "#020617");
  if (variant === 3) return canvas(<><View style={[styles.templateWave, { backgroundColor: "#111827" }]} /><View style={[styles.templateWaveSmall, { backgroundColor: "#F97316" }]} /><View style={[styles.templateLineDark, { width: "74%", top: 11 }]} /><View style={[styles.templateLineDark, { width: "40%", top: 21 }]} /></>, "#FDE047");
  if (variant === 4) return canvas(<><View style={[styles.templateLineLight, { top: 10, width: "56%" }]} /><View style={styles.templateBarChart}>{[18, 30, 42, 26].map((height, cell) => <View key={cell} style={[styles.templateChartBar, { height }]} />)}</View><View style={[styles.templateAccentBar, { backgroundColor: "#01A06D", bottom: 8 }]} /></>, "#183B35");
  if (variant === 5) return canvas(<><View style={[styles.templateMiniPhoto, { left: 8, top: 8, width: 38, height: 26 }]} /><View style={[styles.templateLineDark, { width: "42%", right: 8, top: 12 }]} /><View style={[styles.templateLineDark, { width: "34%", right: 8, top: 24, opacity: 0.35 }]} /><View style={[styles.templateAccentBar, { backgroundColor: "#2563EB", bottom: 10 }]} /></>, "#FFFFFF");
  if (variant === 6) return canvas(<><View style={[styles.templateSplitLeft, { backgroundColor: "#FB923C", width: "48%" }]} /><View style={[styles.templatePosterText, { backgroundColor: "#111827", top: 13, left: 8, width: 50 }]} /><View style={[styles.templatePosterText, { backgroundColor: "#111827", top: 24, left: 8, width: 28 }]} /><View style={[styles.templateMiniPhoto, { right: 8, bottom: 8, width: 34, height: 30 }]} /></>, "#FEE2E2");
  if (variant === 7) return canvas(<><View style={[styles.templateMiniCircle, { backgroundColor: "#A855F7", left: 10, top: 10 }]} /><View style={[styles.templateMiniCircle, { backgroundColor: "#D946EF", left: 31, top: 26 }]} /><View style={[styles.templateMiniCircle, { backgroundColor: "#4D2FB2", right: 11, bottom: 9 }]} /><View style={[styles.templateAccentBar, { backgroundColor: "#FFFFFF", bottom: 11, opacity: 0.8 }]} /></>, "#2E1065");
  if (variant === 8) return canvas(<><View style={styles.templateReportGrid}>{Array.from({ length: 6 }).map((_, cell) => <View key={cell} style={styles.templateReportCell} />)}</View><View style={[styles.templateChartBar, { height: 34, backgroundColor: "#DFAE55", right: 12, bottom: 8, position: "absolute" }]} /></>, "#FFFBEB");
  if (variant === 9) return canvas(<><View style={[styles.templateCheckRow, { top: 10 }]} /><View style={[styles.templateCheckRow, { top: 25, width: "70%" }]} /><View style={[styles.templateCheckRow, { top: 40, width: "58%" }]} /><View style={[styles.templateMiniCircle, { backgroundColor: "#14B8A6", right: 8, top: 8 }]} /></>, "#CCFBF1");
  if (variant === 10) return canvas(<><View style={[styles.templateColorChip, { backgroundColor: "#EC4899", left: 8 }]} /><View style={[styles.templateColorChip, { backgroundColor: "#3B0764", left: 29 }]} /><View style={[styles.templateColorChip, { backgroundColor: "#FCE7F3", left: 50 }]} /><View style={[styles.templateLineDark, { bottom: 10, width: "72%" }]} /></>, "#FFFFFF");
  return canvas(<><View style={[styles.templateLineDark, { width: "76%", top: 15 }]} /><View style={[styles.templateLineDark, { width: "46%", top: 27, opacity: 0.38 }]} /><View style={[styles.templateAccentBar, { backgroundColor: "#111827", bottom: 10 }]} /></>, "#F8FAFC");
}

function CanvaElementPreview({ preview, index }: { preview: string; index: number }) {
  if (preview.startsWith("uri:")) return <View style={styles.elementPreviewBox}><RNImage source={{ uri: preview.slice(4) }} style={styles.previewRealImage} resizeMode="cover" /></View>;
  if (preview === "triangle") return <View style={styles.elementPreviewBox}><View style={styles.previewTriangle} /></View>;
  if (preview === "circle" || preview === "avatar") return <View style={styles.elementPreviewBox}><View style={[styles.previewCircle, preview === "avatar" ? { backgroundColor: "#BFDBFE", borderWidth: 6, borderColor: "#FFFFFF" } : null]} /></View>;
  if (preview === "soft-square") return <View style={styles.elementPreviewBox}><View style={[styles.previewSquare, { backgroundColor: "#CBD5E1", borderRadius: 7 }]} /></View>;
  if (preview === "square") return <View style={styles.elementPreviewBox}><View style={[styles.previewSquare, { backgroundColor: "#000000", borderRadius: 1 }]} /></View>;
  if (preview === "dark-square") return <View style={styles.elementPreviewBox}><View style={[styles.previewSquare, { backgroundColor: "#1F2937", borderRadius: 2 }]} /></View>;
  if (preview === "rounded") return <View style={styles.elementPreviewBox}><View style={styles.previewRounded} /></View>;
  if (preview === "cta") return <View style={styles.elementPreviewBox}><View style={[styles.previewRounded, { width: 66, height: 25, borderRadius: 999, backgroundColor: "#4D2FB2" }]}><Text style={styles.previewCtaText}>Get started</Text></View></View>;
  if (preview === "line") return <View style={styles.elementPreviewBox}><View style={styles.previewLine} /></View>;
  if (preview === "dash") return <View style={styles.elementPreviewBox}><View style={styles.previewDashRow}><View style={styles.previewDash} /><View style={styles.previewDash} /><View style={styles.previewDash} /></View></View>;
  if (preview === "arrow-right" || preview === "arrow-left" || preview === "arrow-up") return <View style={styles.elementPreviewBox}><View style={[styles.previewArrowShape, preview === "arrow-left" ? { transform: [{ rotate: "180deg" }] } : preview === "arrow-up" ? { transform: [{ rotate: "-90deg" }] } : null]}><View style={styles.previewArrowShaft} /><View style={styles.previewArrowHead} /></View></View>;
  if (preview === "pentagon") return <View style={styles.elementPreviewBox}><View style={styles.previewPentagon}><View style={styles.previewPentagonTop} /></View></View>;
  if (preview === "star" || preview === "spark") return <View style={styles.elementPreviewBox}><View style={[styles.previewSpark, preview === "star" ? { transform: [{ rotate: "45deg" }], backgroundColor: "#111827" } : null]} /></View>;
  if (preview === "blob") return <View style={styles.elementPreviewBox}><LinearGradient colors={["#A855F7", "#F0ABFC"] as const} style={styles.previewBlob} /></View>;
  if (preview === "flowchart") return <View style={styles.elementPreviewBox}><View style={styles.previewFlowchart}><View style={styles.previewFlowNode} /><View style={styles.previewFlowLine} /><View style={styles.previewFlowNode} /></View></View>;
  if (preview === "table" || preview === "kpi") return <View style={styles.elementPreviewBox}><View style={styles.previewTable}>{Array.from({ length: 6 }).map((_, cell) => <View key={cell} style={[styles.previewTableCell, preview === "kpi" ? { backgroundColor: ["#DBEAFE", "#DCFCE7", "#FEF3C7"][cell % 3] } : null]} />)}</View></View>;
  if (preview === "image" || preview === "hero-image") return <View style={styles.elementPreviewBox}><LinearGradient colors={preview === "hero-image" ? ["#111827", "#4D2FB2"] as const : ["#BFDBFE", "#34D399"] as const} style={[styles.previewImage, preview === "hero-image" ? { width: 68, height: 44 } : null]}><View style={styles.previewSun} /><View style={styles.previewMountain} /></LinearGradient></View>;
  if (preview === "text") return <View style={styles.elementPreviewBox}><View style={styles.previewTextShell}><Text style={styles.previewTextActual}>Short caption goes here.</Text></View></View>;
  if (preview === "title-text") return <View style={styles.elementPreviewBox}><View style={styles.previewTextShell}><Text style={styles.previewHeadingActual}>Big headline</Text></View></View>;
  if (preview === "body-text") return <View style={styles.elementPreviewBox}><View style={styles.previewTextShell}><Text style={styles.previewBodyActual}>Supporting description</Text></View></View>;
  if (preview === "caption-text") return <View style={styles.elementPreviewBox}><View style={styles.previewTextShell}><Text style={styles.previewCaptionActual}>Small caption</Text></View></View>;
  if (preview === "label") return <View style={styles.elementPreviewBox}><View style={styles.previewLabelPill}><Text style={styles.previewLabelText}>NEW</Text></View></View>;
  if (preview === "stat") return <View style={styles.elementPreviewBox}><View style={styles.previewStatCard}><View style={styles.previewStatNumber} /><View style={styles.previewStatLine} /></View></View>;
  if (preview === "quote") return <View style={styles.elementPreviewBox}><View style={styles.previewQuoteCard}><View style={styles.previewQuoteMark} /><View style={styles.previewQuoteLine} /><View style={[styles.previewQuoteLine, { width: 30 }]} /></View></View>;
  if (preview === "checklist") return <View style={styles.elementPreviewBox}><View style={styles.previewChecklist}>{[0, 1, 2].map((item) => <View key={item} style={styles.previewChecklistRow}><View style={styles.previewChecklistDot} /><View style={styles.previewChecklistLine} /></View>)}</View></View>;
  if (preview === "progress") return <View style={styles.elementPreviewBox}><View style={styles.previewProgressTrack}><View style={styles.previewProgressFill} /></View></View>;
  if (preview === "phone") return <View style={styles.elementPreviewBox}><View style={styles.previewPhone}><View style={styles.previewPhoneLine} /></View></View>;
  if (preview === "browser") return <View style={styles.elementPreviewBox}><View style={styles.previewBrowser}><View style={styles.previewBrowserTop} /><View style={styles.previewBrowserBody} /></View></View>;
  if (preview === "qr") return <View style={styles.elementPreviewBox}><View style={styles.previewQr}>{Array.from({ length: 9 }).map((_, cell) => <View key={cell} style={[styles.previewQrCell, cell % 2 ? { opacity: 0.25 } : null]} />)}</View></View>;
  if (preview.startsWith("brand")) return <View style={styles.elementPreviewBox}><LinearGradient colors={(preview.includes("green") ? ["#183B35", "#01A06D"] : preview.includes("gold") ? ["#DFAE55", "#FEF3C7"] : preview.includes("mono") ? ["#111827", "#475569"] : ["#4D2FB2", "#A855F7"]) as any} style={styles.previewBrandCard}><View style={styles.previewBrandDot} /><View style={styles.previewBrandLines}><View style={styles.previewBrandLineWide} /><View style={styles.previewBrandLine} /></View></LinearGradient></View>;
  if (preview.startsWith("photo") || preview === "fabric" || preview === "paper" || preview === "water" || preview === "lavender") return <View style={styles.elementPreviewBox}><LinearGradient colors={(preview === "photo-code" ? ["#111827", "#0EA5E9"] : preview === "photo-warm" || preview === "fabric" ? ["#FED7AA", "#F97316"] : preview === "photo-flower" ? ["#DCFCE7", "#F9A8D4"] : preview === "paper" ? ["#F8FAFC", "#E2E8F0"] : preview === "water" ? ["#BFDBFE", "#38BDF8"] : preview === "lavender" ? ["#DDD6FE", "#A78BFA"] : ["#DBEAFE", "#34D399"]) as any} style={styles.previewPhotoCard}><View style={styles.previewPhotoGlow} /><View style={styles.previewPhotoLine} /><View style={styles.previewPhotoLineShort} /></LinearGradient></View>;
  if (preview.startsWith("bg-") || preview === "gradient") return <View style={styles.elementPreviewBox}><LinearGradient colors={(preview === "bg-black" ? ["#020617", "#334155"] : preview === "bg-purple" ? ["#4D2FB2", "#A855F7"] : preview === "bg-teal" ? ["#183B35", "#14B8A6"] : preview === "bg-sunset" ? ["#F97316", "#FACC15"] : preview === "gradient" ? ["#EEF2FF", "#CCFBF1"] : ["#FFFFFF", "#E2E8F0"]) as any} style={styles.previewBackgroundCard} /></View>;
  if (preview.startsWith("upload")) return <View style={styles.elementPreviewBox}><LinearGradient colors={["#E0F2FE", "#F5D0FE"] as const} style={styles.previewUploadCard}><View style={styles.previewUploadPlus} /></LinearGradient></View>;
  if (preview === "project") return <View style={styles.elementPreviewBox}><View style={styles.previewProjectCard}><View style={styles.previewProjectGrid}>{Array.from({ length: 4 }).map((_, cell) => <View key={cell} style={styles.previewProjectCell} />)}</View></View></View>;
  if (preview === "file") return <View style={styles.elementPreviewBox}><View style={styles.previewFileCard}><View style={styles.previewFileCorner} /><View style={styles.previewFileLine} /><View style={[styles.previewFileLine, { width: 28 }]} /></View></View>;
  if (preview === "number") return <View style={styles.elementPreviewBox}><View style={styles.previewNumber}><Text style={styles.previewNumberText}>2</Text></View></View>;
  if (preview === "caption-footer") return <View style={styles.elementPreviewBox}><View style={styles.previewLine} /><View style={[styles.previewLine, { width: 38, marginTop: 8, opacity: 0.55 }]} /></View>;
  if (preview === "chart") return <View style={styles.elementPreviewBox}><View style={styles.previewChart}>{[18, 30, 42].map((height, cell) => <View key={cell} style={[styles.previewChartBar, { height }]} />)}</View></View>;
  if (preview === "diagram") return <View style={styles.elementPreviewBox}><View style={styles.previewDiagram}><View style={[styles.previewDiagramNode, { backgroundColor: "#4D2FB2" }]} /><View style={styles.previewDiagramLink} /><View style={[styles.previewDiagramNode, { backgroundColor: "#DFAE55" }]} /><View style={styles.previewDiagramLink} /><View style={[styles.previewDiagramNode, { backgroundColor: "#01A06D" }]} /></View></View>;
  if (preview === "music") return <View style={styles.elementPreviewBox}><View style={styles.previewMusicIcon}><View style={styles.previewMusicStem} /><View style={styles.previewMusicNote} /></View></View>;
  if (preview === "video") return <View style={styles.elementPreviewBox}><LinearGradient colors={["#F0ABFC", "#8B5CF6"] as const} style={styles.previewVideo}><View style={styles.previewPlayTriangle} /></LinearGradient></View>;
  if (preview === "form") return <View style={styles.elementPreviewBox}><View style={styles.previewForm}><View style={styles.previewFormLine} /><View style={styles.previewFormLine} /><View style={styles.previewFormButton} /></View></View>;
  return <View style={styles.elementPreviewBox}><LinearGradient colors={(["#F8FAFC", "#DBEAFE", "#DCFCE7"] as const)} style={styles.previewFallbackCard}><View style={[styles.previewFallbackShape, { backgroundColor: ["#4D2FB2", "#01A06D", "#DFAE55", "#0EA5E9"][index % 4] }]} /><View style={styles.previewFallbackLine} /><View style={[styles.previewFallbackLine, { width: "48%" }]} /></LinearGradient></View>;
}
function PanelPreview({ activePanel, index, title, preview }: { activePanel: Exclude<EditorPanel, null>; index: number; title: string; preview?: string }) {
  if (activePanel === "templates") return <CanvaTemplatePreview title={title} index={index} />;
  return <CanvaElementPreview preview={preview ?? title.toLowerCase()} index={index} />;
}

function ElementQuickToolbar({ item, palette, onStyle, onAnimation, onDuplicate, onForward, onBack, onDelete }: { item: DesignElement; palette: ReturnType<typeof getPalette>; onStyle: () => void; onAnimation: () => void; onDuplicate: () => void; onForward: () => void; onBack: () => void; onDelete: () => void }) {
  void item;
  const tools: Array<{ icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; action: () => void; danger?: boolean }> = [
    { icon: Brush, action: onStyle },
    { icon: Sparkles, action: onAnimation },
    { icon: Copy, action: onDuplicate },
    { icon: BringToFront, action: onForward },
    { icon: SendToBack, action: onBack },
    { icon: Trash2, action: onDelete, danger: true },
  ];
  const positionStyle = { backgroundColor: palette.card, borderColor: palette.border };
  return <View pointerEvents="box-none" style={[styles.elementQuickToolbar, positionStyle]}>{tools.map((tool, index) => { const Icon = tool.icon; return <Pressable key={index} onPress={tool.action} hitSlop={8} style={[styles.elementQuickButton, { backgroundColor: tool.danger ? "rgba(220,38,38,0.14)" : palette.chip }]}><Icon size={19} color={tool.danger ? palette.danger : palette.text} /></Pressable>; })}</View>;
}
function InlineTextToolbar({ selectedElement, palette, onStyle, onOpenStyle, onOpenAnimation }: { selectedElement: DesignElement; palette: ReturnType<typeof getPalette>; onStyle: (patch: Partial<DesignElement>) => void; onOpenStyle: () => void; onOpenAnimation: () => void }) {
  return <View style={[styles.inlineTextToolbar, { backgroundColor: palette.card, borderColor: palette.border }]}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inlineTextTools} keyboardShouldPersistTaps="handled"><ToolChip label="Bold" palette={palette} onPress={() => onStyle({ fontWeight: selectedElement.fontWeight === "900" ? "600" : "900" })} /><ToolChip label="Italic" palette={palette} onPress={() => onStyle({ fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic" })} /><ToolChip label="Center" palette={palette} onPress={() => onStyle({ textAlign: selectedElement.textAlign === "center" ? "left" : "center" })} /><ToolChip label="Uppercase" palette={palette} onPress={() => onStyle({ textTransform: selectedElement.textTransform === "uppercase" ? "none" : "uppercase" })} /><ToolChip label="Style" palette={palette} onPress={onOpenStyle} /><ToolChip label="Animate" palette={palette} onPress={onOpenAnimation} /></ScrollView></View>;
}

function AnimationControlPanel({ selectedElement, palette, onStyleElement }: { selectedElement?: DesignElement; palette: ReturnType<typeof getPalette>; onStyleElement: (patch: Partial<DesignElement>) => void }) {
  const animations: Array<{ key: NonNullable<DesignElement["animation"]>; title: string; body: string }> = [
    { key: "none", title: "None", body: "Keep this element still." },
    { key: "fade", title: "Fade", body: "Soft opacity pulse for calm emphasis." },
    { key: "pop", title: "Pop", body: "Small scale pulse for stickers and CTAs." },
    { key: "rise", title: "Rise", body: "Subtle upward entrance feeling." },
    { key: "pan", title: "Pan", body: "Horizontal motion for image-like elements." },
    { key: "breathe", title: "Breathe", body: "Slow premium breathing effect." },
    { key: "tumble", title: "Tumble", body: "Tiny playful rotation." },
  ];
  if (!selectedElement) return <Text style={[styles.sheetRowBody, { color: palette.muted }]}>Select an element first, then choose its animation.</Text>;
  return <View style={styles.stylePanel}>{animations.map((item, index) => <Pressable key={item.key} onPress={() => onStyleElement({ animation: item.key })} style={[styles.animationCard, { borderColor: selectedElement.animation === item.key || (!selectedElement.animation && item.key === "none") ? palette.purple : palette.border, backgroundColor: palette.chip }]}><MotiView from={animationFor(item.key).from} animate={animationFor(item.key).animate} transition={animationFor(item.key).transition} style={[styles.animationPreview, { backgroundColor: index % 2 ? "#DFAE55" : palette.purple }]} /><View style={styles.sheetRowText}><Text style={[styles.sheetRowTitle, { color: palette.text }]}>{item.title}</Text><Text style={[styles.sheetRowBody, { color: palette.muted }]}>{item.body}</Text></View></Pressable>)}</View>;
}

function CanvaToolRail({ activePanel, palette, onSelect }: { activePanel: Exclude<EditorPanel, null>; palette: ReturnType<typeof getPalette>; onSelect: (panel: Exclude<EditorPanel, null>) => void }) {
  const items: Array<{ key: Exclude<EditorPanel, null>; label: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> }> = [
    { key: "templates", label: "Templates", icon: Layers },
    { key: "elements", label: "Elements", icon: Box },
    { key: "text", label: "Text", icon: Type },
    { key: "brand", label: "Brand", icon: BadgePlus },
    { key: "uploads", label: "Uploads", icon: Upload },
    { key: "instruments", label: "Tools", icon: Pencil },
    { key: "photo", label: "Photo", icon: Image },
    { key: "background", label: "Background", icon: Square },
    { key: "captions", label: "Captions", icon: FileText },
    { key: "downloads", label: "Export", icon: Download },
  ];
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.canvaToolRailScroll} contentContainerStyle={styles.canvaToolRail}>{items.map((item) => { const Icon = item.icon; const active = item.key === activePanel; return <Pressable key={item.key} onPress={() => onSelect(item.key)} style={[styles.canvaRailItem, active ? { backgroundColor: palette.chip, borderColor: palette.border } : null]}><Icon size={17} color={active ? palette.purple : palette.muted} /><Text numberOfLines={1} style={[styles.canvaRailText, { color: active ? palette.text : palette.muted }]}>{item.label}</Text></Pressable>; })}</ScrollView>;
}
function EditorPanelSheet({ activePanel, search, t, palette, pages, currentFormat, selectedElement, pageSelected, onSearch, onPanelChange, onClose, onApplyPageTemplate, onApplyDeckTemplate, onAddElement, onAddPreset, onStyleElement, onStylePage, onReplaceImage, onExport, onAddPage, onSelectPage, onPickUpload, onAddPhoto, onSetBackgroundPhoto, onSetDrawingTool }: { activePanel: EditorPanel; search: string; t: ReturnType<typeof getCopy>; palette: ReturnType<typeof getPalette>; pages: DesignPage[]; currentFormat: Format; selectedElement?: DesignElement; pageSelected: boolean; onSearch: (value: string) => void; onPanelChange: (panel: Exclude<EditorPanel, null>) => void; onClose: () => void; onApplyPageTemplate: (variant: number) => void; onApplyDeckTemplate: (variant: number) => void; onAddElement: (type: ElementType) => void; onAddPreset: (type: ElementType, overrides: Partial<DesignElement>) => void; onStyleElement: (patch: Partial<DesignElement>) => void; onAdjustFont: (delta: number) => void; onStylePage: (color: string) => void; onReplaceImage: () => void; onExport: (type: ExportKind) => void; onAddPage: () => void; onSelectPage: (page: DesignPage) => void; onPickUpload: () => void; onAddPhoto: (uri: string) => void; onSetBackgroundPhoto: (uri: string) => void; onSetDrawingTool: (tool: DrawingTool) => void }) {
  if (!activePanel) return null;
  const rows = activePanel === "style" || activePanel === "animation" ? [] : getPanelRows(activePanel, t, pages, currentFormat, onApplyPageTemplate, onApplyDeckTemplate, onAddElement, onAddPreset, onStylePage, onExport, onAddPage, onSelectPage, onPickUpload, onAddPhoto, onSetBackgroundPhoto, onSetDrawingTool);
  const filtered = rows.filter((row) => row.title.toLowerCase().includes(search.toLowerCase()) || row.body.toLowerCase().includes(search.toLowerCase()));
  const showSearch = activePanel !== "instruments" && activePanel !== "style" && activePanel !== "animation";
  const showPreview = ["templates", "elements", "text", "brand", "photo", "background", "captions", "instruments"].includes(activePanel);
  return (
    <Modal transparent visible={!!activePanel} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.sheetModalRoot} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.editorSheet, activePanel === "instruments" ? styles.editorSheetSmall : null, { backgroundColor: palette.card, borderColor: palette.border }]}> 
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: palette.text }]}>{activePanel === "style" ? "Customize" : activePanel === "animation" ? "Animation" : activePanel}</Text>
            <Pressable onPress={onClose} style={[styles.sheetClose, { backgroundColor: palette.chip }]}><XIcon size={18} color={palette.text} /></Pressable>
          </View>
          {showSearch ? <View style={[styles.searchBox, { backgroundColor: palette.input, borderColor: palette.border }]}><Search size={16} color={palette.muted} /><TextInput value={search} onChangeText={onSearch} placeholder={activePanel === "templates" ? "Search templates" : activePanel === "elements" ? "Describe your ideal shape" : activePanel === "photo" ? "Search photos" : activePanel === "background" ? "Search backgrounds" : "Search"} placeholderTextColor={palette.muted} style={[styles.searchInput, { color: palette.text }]} returnKeyType="search" onSubmitEditing={() => Keyboard.dismiss()} />{activePanel === "elements" ? <Mic size={16} color={palette.muted} /> : null}</View> : null}
          <CanvaToolRail activePanel={activePanel} palette={palette} onSelect={onPanelChange} />
          {activePanel === "style" ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.stylePanel}>
              <StyleControlPanel selectedElement={selectedElement} pageSelected={pageSelected} palette={palette} onStyleElement={onStyleElement} onStylePage={onStylePage} onReplaceImage={onReplaceImage} />
            </ScrollView>
          ) : activePanel === "animation" ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.stylePanel}>
              <AnimationControlPanel selectedElement={selectedElement} palette={palette} onStyleElement={onStyleElement} />
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={showPreview ? styles.previewGrid : styles.sheetList}>{filtered.map((row, index) => { const RowIcon = row.icon; return showPreview ? <Pressable key={`${row.title}-${index}`} accessibilityLabel={row.title} onPress={() => { row.action(); onClose(); }} style={[styles.previewTile, { borderColor: palette.border, backgroundColor: palette.chip }]}><PanelPreview activePanel={activePanel} index={index} title={row.title} preview={("preview" in row ? row.preview : undefined) as string | undefined} /></Pressable> : <Pressable key={`${row.title}-${index}`} onPress={() => { row.action(); if (activePanel !== "downloads") onClose(); }} style={[styles.sheetRow, { borderColor: palette.border, backgroundColor: palette.chip }]}><RowIcon size={20} color={palette.text} /><View style={styles.sheetRowText}><Text style={[styles.sheetRowTitle, { color: palette.text }]}>{row.title}</Text><Text style={[styles.sheetRowBody, { color: palette.muted }]}>{row.body}</Text></View></Pressable>; })}</ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function StyleNumberInput({ palette, label, value, onChange, onApply, suffix }: { palette: ReturnType<typeof getPalette>; label: string; value: string; onChange: (value: string) => void; onApply: () => void; suffix?: string }) {
  return (
    <View style={[styles.styleInputWrap, { backgroundColor: palette.input, borderColor: palette.border }]}>
      <Text style={[styles.styleInputLabel, { color: palette.muted }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={onApply} style={[styles.styleNumberInput, { color: palette.text }]} placeholderTextColor={palette.muted} />
      {suffix ? <Text style={[styles.styleInputLabel, { color: palette.muted }]}>{suffix}</Text> : null}
      <Pressable onPress={() => { onApply(); Keyboard.dismiss(); }} style={[styles.styleApplySmall, { backgroundColor: palette.purple }]}><Text style={styles.styleApplyText}>Set</Text></Pressable>
    </View>
  );
}

function StyleCustomColorInput({ palette, label, value, onChange, normalizeColor, onApply }: { palette: ReturnType<typeof getPalette>; label: string; value: string; onChange: (value: string) => void; normalizeColor: (value: string) => string | null; onApply: (color: string) => void }) {
  const color = normalizeColor(value);
  return (
    <View style={[styles.styleInputWrap, { backgroundColor: palette.input, borderColor: palette.border }]}>
      <Text style={[styles.styleInputLabel, { color: palette.muted }]}>{label}</Text>
      <View style={[styles.customColorPreview, { backgroundColor: color ?? "transparent", borderColor: palette.border }]} />
      <TextInput value={value} onChangeText={onChange} autoCapitalize="none" autoCorrect={false} placeholder="#AEAEFF" placeholderTextColor={palette.muted} style={[styles.styleNumberInput, { color: palette.text, textAlign: "left" }]} />
      <Pressable onPress={() => { if (color) onApply(color); Keyboard.dismiss(); }} style={[styles.styleApplySmall, { backgroundColor: palette.purple }]}><Text style={styles.styleApplyText}>Set</Text></Pressable>
    </View>
  );
}
function StyleControlPanel({ selectedElement, pageSelected, palette, onStyleElement, onStylePage, onReplaceImage }: { selectedElement?: DesignElement; pageSelected: boolean; palette: ReturnType<typeof getPalette>; onStyleElement: (patch: Partial<DesignElement>) => void; onStylePage: (color: string) => void; onReplaceImage: () => void }) {
  const [textDraft, setTextDraft] = useState(selectedElement?.text ?? "");
  const [fontSize, setFontSize] = useState(String(selectedElement?.fontSize ?? 16));
  const [lineHeight, setLineHeight] = useState(String(selectedElement?.lineHeight ?? Math.round((selectedElement?.fontSize ?? 16) * 1.18)));
  const [letterSpacing, setLetterSpacing] = useState(String(selectedElement?.letterSpacing ?? 0));
  const [radius, setRadius] = useState(String(selectedElement?.radius ?? 0));
  const [opacity, setOpacity] = useState(String(Math.round((selectedElement?.opacity ?? 1) * 100)));
  const [borderWidth, setBorderWidth] = useState(String(selectedElement?.borderWidth ?? 0));
  const [blurRadius, setBlurRadius] = useState(String(selectedElement?.blurRadius ?? 0));
  const [xValue, setXValue] = useState(String(Math.round(selectedElement?.x ?? 0)));
  const [yValue, setYValue] = useState(String(Math.round(selectedElement?.y ?? 0)));
  const [widthValue, setWidthValue] = useState(String(Math.round(selectedElement?.width ?? 40)));
  const [heightValue, setHeightValue] = useState(String(Math.round(selectedElement?.height ?? 10)));
  const [rotation, setRotation] = useState(String(selectedElement?.rotation ?? 0));
  const [customTextColor, setCustomTextColor] = useState(selectedElement?.color ?? "#111827");
  const [customFillColor, setCustomFillColor] = useState(selectedElement?.backgroundColor ?? "#FFFFFF");
  const [customBorderColor, setCustomBorderColor] = useState(selectedElement?.borderColor ?? "#CBD5E1");
  const [customShadowColor, setCustomShadowColor] = useState(selectedElement?.shadowColor ?? "#000000");

  useEffect(() => {
    setTextDraft(selectedElement?.text ?? "");
    setFontSize(String(selectedElement?.fontSize ?? 16));
    setLineHeight(String(selectedElement?.lineHeight ?? Math.round((selectedElement?.fontSize ?? 16) * 1.18)));
    setLetterSpacing(String(selectedElement?.letterSpacing ?? 0));
    setRadius(String(selectedElement?.radius ?? 0));
    setOpacity(String(Math.round((selectedElement?.opacity ?? 1) * 100)));
    setBorderWidth(String(selectedElement?.borderWidth ?? 0));
    setBlurRadius(String(selectedElement?.blurRadius ?? 0));
    setXValue(String(Math.round(selectedElement?.x ?? 0)));
    setYValue(String(Math.round(selectedElement?.y ?? 0)));
    setWidthValue(String(Math.round(selectedElement?.width ?? 40)));
    setHeightValue(String(Math.round(selectedElement?.height ?? 10)));
    setRotation(String(selectedElement?.rotation ?? 0));
    setCustomTextColor(selectedElement?.color ?? "#111827");
    setCustomFillColor(selectedElement?.backgroundColor ?? "#FFFFFF");
    setCustomBorderColor(selectedElement?.borderColor ?? "#CBD5E1");
    setCustomShadowColor(selectedElement?.shadowColor ?? "#000000");
  }, [selectedElement?.id, selectedElement?.text, selectedElement?.fontSize, selectedElement?.lineHeight, selectedElement?.letterSpacing, selectedElement?.radius, selectedElement?.opacity, selectedElement?.borderWidth, selectedElement?.blurRadius, selectedElement?.x, selectedElement?.y, selectedElement?.width, selectedElement?.height, selectedElement?.rotation, selectedElement?.color, selectedElement?.backgroundColor, selectedElement?.borderColor, selectedElement?.shadowColor]);

  const isText = !!selectedElement && (selectedElement.type === "heading" || selectedElement.type === "text" || selectedElement.type === "button" || selectedElement.type === "badge");
  const isImage = selectedElement?.type === "image";
  const isFillable = (!!selectedElement && !isText) || selectedElement?.type === "button" || selectedElement?.type === "badge";
  const parseNumber = (value: string, fallback: number, min: number, max: number) => {
    const next = Number(value.replace(/[^0-9.-]/g, ""));
    return clamp(Number.isFinite(next) ? next : fallback, min, max);
  };
  const normalizeColor = (value: string) => {
    const clean = value.trim();
    if (/^#[0-9a-fA-F]{3}$/.test(clean) || /^#[0-9a-fA-F]{6}$/.test(clean)) return clean;
    if (/^[0-9a-fA-F]{3}$/.test(clean) || /^[0-9a-fA-F]{6}$/.test(clean)) return `#${clean}`;
    return null;
  };

  const MiniButton = ({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[styles.styleMiniButton, { backgroundColor: active ? palette.purple : palette.input, borderColor: active ? palette.purple : palette.border }]}>
      <Text style={[styles.styleMiniButtonText, { color: active ? "#FFFFFF" : palette.text }]}>{label}</Text>
    </Pressable>
  );

  const NumberInput = ({ label, value, onChange, onApply, suffix }: { label: string; value: string; onChange: (value: string) => void; onApply: () => void; suffix?: string }) => (
    <View style={[styles.styleInputWrap, { backgroundColor: palette.input, borderColor: palette.border }]}>
      <Text style={[styles.styleInputLabel, { color: palette.muted }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={onApply} style={[styles.styleNumberInput, { color: palette.text }]} placeholderTextColor={palette.muted} />
      {suffix ? <Text style={[styles.styleInputLabel, { color: palette.muted }]}>{suffix}</Text> : null}
      <Pressable onPress={() => { onApply(); Keyboard.dismiss(); }} style={[styles.styleApplySmall, { backgroundColor: palette.purple }]}><Text style={styles.styleApplyText}>Set</Text></Pressable>
    </View>
  );

  const CustomColorInput = ({ label, value, onChange, onApply }: { label: string; value: string; onChange: (value: string) => void; onApply: (color: string) => void }) => (
    <View style={[styles.styleInputWrap, { backgroundColor: palette.input, borderColor: palette.border }]}>
      <Text style={[styles.styleInputLabel, { color: palette.muted }]}>{label}</Text>
      <View style={[styles.customColorPreview, { backgroundColor: normalizeColor(value) ?? "transparent", borderColor: palette.border }]} />
      <TextInput value={value} onChangeText={onChange} autoCapitalize="none" autoCorrect={false} placeholder="#AEAEFF" placeholderTextColor={palette.muted} style={[styles.styleNumberInput, { color: palette.text, textAlign: "left" }]} />
      <Pressable onPress={() => { const color = normalizeColor(value); if (color) onApply(color); Keyboard.dismiss(); }} style={[styles.styleApplySmall, { backgroundColor: palette.purple }]}><Text style={styles.styleApplyText}>Set</Text></Pressable>
    </View>
  );

  const ColorCircles = ({ label, activeColor, onPick }: { label: string; activeColor?: string; onPick: (color: string) => void }) => (
    <View style={styles.styleSection}>
      <Text style={[styles.styleSectionTitle, { color: palette.muted }]}>{label}</Text>
      <View style={styles.colorCircleGrid}>{SWATCHES.map((color) => {
        const active = (activeColor ?? "").toLowerCase() === color.toLowerCase();
        return <Pressable key={`${label}-${color}`} onPress={() => onPick(color)} style={[styles.colorCircle, { backgroundColor: color, borderColor: active ? palette.purple : color === "#FFFFFF" ? palette.border : "rgba(255,255,255,0.55)" }, active ? styles.colorCircleActive : null]} />;
      })}</View>
    </View>
  );

  if (!selectedElement && pageSelected) {
    return (
      <View style={styles.stylePanel}>
        <View style={styles.styleSection}>
          <Text style={[styles.styleSectionTitle, { color: palette.muted }]}>Canvas background</Text>
          <View style={styles.styleControlsRow}>
            <MiniButton label="Clean white" onPress={() => onStylePage("#FFFFFF")} />
            <MiniButton label="Soft cream" onPress={() => onStylePage("#FFF7ED")} />
            <MiniButton label="Night" onPress={() => onStylePage("#111827")} />
            <MiniButton label="Brand green" onPress={() => onStylePage("#E8F3EF")} />
            <MiniButton label="Soft blue" onPress={() => onStylePage("#EEF2FF")} />
          </View>
        </View>
        <StyleCustomColorInput palette={palette} normalizeColor={normalizeColor} label="Custom page" value={customFillColor} onChange={setCustomFillColor} onApply={onStylePage} />
        <ColorCircles label="Page colors" onPick={onStylePage} />
      </View>
    );
  }

  if (!selectedElement) {
    return <Text style={[styles.sheetRowBody, { color: palette.muted }]}>Select text, image, shape, or the page to customize it.</Text>;
  }

  return (
    <View style={styles.stylePanel}>
      {isText ? <View style={styles.styleSection}>
        <Text style={[styles.styleSectionTitle, { color: palette.muted }]}>Text content</Text>
        <View style={[styles.styleTextInputWrap, { backgroundColor: palette.input, borderColor: palette.border }]}>
          <TextInput value={textDraft} onChangeText={setTextDraft} multiline placeholder="Write text" placeholderTextColor={palette.muted} style={[styles.styleTextArea, { color: palette.text }]} />
          <Pressable onPress={() => { onStyleElement({ text: textDraft }); Keyboard.dismiss(); }} style={[styles.styleApplySmall, { backgroundColor: palette.purple, alignSelf: "flex-end" }]}><Text style={styles.styleApplyText}>Apply text</Text></Pressable>
        </View>
      </View> : null}

      {isText ? <View style={styles.styleSection}>
        <Text style={[styles.styleSectionTitle, { color: palette.muted }]}>Typography</Text>
        <Text style={[styles.styleSubLabel, { color: palette.muted }]}>Font family</Text>
        <View style={styles.styleControlsRow}>
          <MiniButton label="System" active={!selectedElement.fontFamily} onPress={() => onStyleElement({ fontFamily: undefined })} />
          <MiniButton label="Serif" active={selectedElement.fontFamily === "serif"} onPress={() => onStyleElement({ fontFamily: "serif" })} />
          <MiniButton label="Mono" active={selectedElement.fontFamily === "monospace"} onPress={() => onStyleElement({ fontFamily: "monospace" })} />
          <MiniButton label="Rounded" active={selectedElement.fontFamily === "sans-serif"} onPress={() => onStyleElement({ fontFamily: "sans-serif" })} />
        </View>
        <Text style={[styles.styleSubLabel, { color: palette.muted }]}>Format</Text>
        <View style={styles.styleControlsRow}>
          <MiniButton label="Regular" active={selectedElement.fontWeight === "600"} onPress={() => onStyleElement({ fontWeight: "600" })} />
          <MiniButton label="Medium" active={selectedElement.fontWeight === "800"} onPress={() => onStyleElement({ fontWeight: "800" })} />
          <MiniButton label="Bold" active={selectedElement.fontWeight === "900" || !selectedElement.fontWeight} onPress={() => onStyleElement({ fontWeight: "900" })} />
          <MiniButton label="Italic" active={selectedElement.fontStyle === "italic"} onPress={() => onStyleElement({ fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic" })} />
          <MiniButton label="Underline" active={selectedElement.textDecorationLine === "underline"} onPress={() => onStyleElement({ textDecorationLine: selectedElement.textDecorationLine === "underline" ? "none" : "underline" })} />
          <MiniButton label="Strike" active={selectedElement.textDecorationLine === "line-through"} onPress={() => onStyleElement({ textDecorationLine: selectedElement.textDecorationLine === "line-through" ? "none" : "line-through" })} />
          <MiniButton label="Left" active={(selectedElement.textAlign ?? "left") === "left"} onPress={() => onStyleElement({ textAlign: "left" })} />
          <MiniButton label="Center" active={selectedElement.textAlign === "center"} onPress={() => onStyleElement({ textAlign: "center" })} />
          <MiniButton label="Right" active={selectedElement.textAlign === "right"} onPress={() => onStyleElement({ textAlign: "right" })} />
          <MiniButton label="Uppercase" active={selectedElement.textTransform === "uppercase"} onPress={() => onStyleElement({ textTransform: selectedElement.textTransform === "uppercase" ? "none" : "uppercase" })} />
          <MiniButton label="Lowercase" active={selectedElement.textTransform === "lowercase"} onPress={() => onStyleElement({ textTransform: selectedElement.textTransform === "lowercase" ? "none" : "lowercase" })} />
          <MiniButton label="Capitalize" active={selectedElement.textTransform === "capitalize"} onPress={() => onStyleElement({ textTransform: selectedElement.textTransform === "capitalize" ? "none" : "capitalize" })} />
        </View>
        <StyleNumberInput palette={palette} label="Font size" value={fontSize} onChange={setFontSize} suffix="px" onApply={() => onStyleElement({ fontSize: parseNumber(fontSize, selectedElement.fontSize, 8, 96) })} />
        <StyleNumberInput palette={palette} label="Line height" value={lineHeight} onChange={setLineHeight} suffix="px" onApply={() => onStyleElement({ lineHeight: parseNumber(lineHeight, selectedElement.lineHeight ?? Math.round(selectedElement.fontSize * 1.18), 8, 140) })} />
        <StyleNumberInput palette={palette} label="Letter space" value={letterSpacing} onChange={setLetterSpacing} suffix="px" onApply={() => onStyleElement({ letterSpacing: parseNumber(letterSpacing, selectedElement.letterSpacing ?? 0, -4, 12) })} />
              <Text style={[styles.styleSubLabel, { color: palette.muted }]}>Text effects</Text>
        <View style={styles.styleControlsRow}>
          <MiniButton label="None" active={!selectedElement.textEffect || selectedElement.textEffect === "none"} onPress={() => onStyleElement({ textEffect: "none" })} />
          <MiniButton label="Shadow" active={selectedElement.textEffect === "shadow"} onPress={() => onStyleElement({ textEffect: "shadow", shadowColor: selectedElement.shadowColor ?? "#111827" })} />
          <MiniButton label="Lift" active={selectedElement.textEffect === "lift"} onPress={() => onStyleElement({ textEffect: "lift", shadowColor: "rgba(15,23,42,0.45)" })} />
          <MiniButton label="Glow" active={selectedElement.textEffect === "glow"} onPress={() => onStyleElement({ textEffect: "glow", shadowColor: selectedElement.color })} />
          <MiniButton label="Outline" active={selectedElement.textEffect === "outline"} onPress={() => onStyleElement({ textEffect: "outline", shadowColor: selectedElement.shadowColor ?? "#FFFFFF" })} />
        </View>
      </View> : null}

      {isImage ? <View style={styles.styleSection}>
        <Text style={[styles.styleSectionTitle, { color: palette.muted }]}>Image</Text>
        <View style={styles.styleControlsRow}>
          <MiniButton label="Replace" onPress={onReplaceImage} />
          <MiniButton label="Cover" active={(selectedElement.imageFit ?? "cover") === "cover"} onPress={() => onStyleElement({ imageFit: "cover" })} />
          <MiniButton label="Contain" active={selectedElement.imageFit === "contain"} onPress={() => onStyleElement({ imageFit: "contain" })} />
          <MiniButton label="Stretch" active={selectedElement.imageFit === "stretch"} onPress={() => onStyleElement({ imageFit: "stretch" })} />
          <MiniButton label="Circle" active={selectedElement.radius >= 999} onPress={() => onStyleElement({ radius: 999 })} />
          <MiniButton label="Sharp" active={(selectedElement.blurRadius ?? 0) === 0 && (selectedElement.opacity ?? 1) === 1} onPress={() => onStyleElement({ blurRadius: 0, opacity: 1 })} />
          <MiniButton label="Soft" active={(selectedElement.blurRadius ?? 0) >= 3} onPress={() => onStyleElement({ blurRadius: 4 })} />
          <MiniButton label="Fade" active={(selectedElement.opacity ?? 1) < 0.85} onPress={() => onStyleElement({ opacity: (selectedElement.opacity ?? 1) < 0.85 ? 1 : 0.72 })} />
        </View>
        <Text style={[styles.styleSubLabel, { color: palette.muted }]}>Photo filters</Text>
        <View style={styles.styleControlsRow}>
          <MiniButton label="None" active={!selectedElement.imageFilter || selectedElement.imageFilter === "none"} onPress={() => onStyleElement({ imageFilter: "none" })} />
          <MiniButton label="Warm" active={selectedElement.imageFilter === "warm"} onPress={() => onStyleElement({ imageFilter: "warm" })} />
          <MiniButton label="Cool" active={selectedElement.imageFilter === "cool"} onPress={() => onStyleElement({ imageFilter: "cool" })} />
          <MiniButton label="Mono" active={selectedElement.imageFilter === "mono"} onPress={() => onStyleElement({ imageFilter: "mono" })} />
          <MiniButton label="Vivid" active={selectedElement.imageFilter === "vivid"} onPress={() => onStyleElement({ imageFilter: "vivid" })} />
        </View>
        <StyleNumberInput palette={palette} label="Blur" value={blurRadius} onChange={setBlurRadius} suffix="px" onApply={() => onStyleElement({ blurRadius: parseNumber(blurRadius, selectedElement.blurRadius ?? 0, 0, 24) })} />
      </View> : null}

      <View style={styles.styleSection}>
        <Text style={[styles.styleSectionTitle, { color: palette.muted }]}>Position and size</Text>
        <View style={styles.styleGridTwo}>
          <StyleNumberInput palette={palette} label="X" value={xValue} onChange={setXValue} suffix="%" onApply={() => onStyleElement({ x: parseNumber(xValue, selectedElement.x, 0, 96) })} />
          <StyleNumberInput palette={palette} label="Y" value={yValue} onChange={setYValue} suffix="%" onApply={() => onStyleElement({ y: parseNumber(yValue, selectedElement.y, 0, 96) })} />
          <StyleNumberInput palette={palette} label="Width" value={widthValue} onChange={setWidthValue} suffix="%" onApply={() => onStyleElement({ width: parseNumber(widthValue, selectedElement.width, 4, 100) })} />
          <StyleNumberInput palette={palette} label="Height" value={heightValue} onChange={setHeightValue} suffix="%" onApply={() => onStyleElement({ height: parseNumber(heightValue, selectedElement.height, 3, 96) })} />
          <StyleNumberInput palette={palette} label="Rotate" value={rotation} onChange={setRotation} suffix="deg" onApply={() => onStyleElement({ rotation: parseNumber(rotation, selectedElement.rotation ?? 0, -180, 180) })} />
        </View>
      </View>

      <View style={styles.styleSection}>
        <Text style={[styles.styleSectionTitle, { color: palette.muted }]}>Shape and border</Text>
        <View style={styles.styleControlsRow}>
          <MiniButton label="Square" active={selectedElement.radius <= 2} onPress={() => onStyleElement({ radius: 2 })} />
          <MiniButton label="Rounded" active={selectedElement.radius > 2 && selectedElement.radius < 999} onPress={() => onStyleElement({ radius: 18 })} />
          <MiniButton label="Pill" active={selectedElement.radius >= 999} onPress={() => onStyleElement({ radius: 999 })} />
          <MiniButton label="Solid" active={(selectedElement.borderStyle ?? "solid") === "solid"} onPress={() => onStyleElement({ borderStyle: "solid", borderWidth: Math.max(selectedElement.borderWidth ?? 0, 1) })} />
          <MiniButton label="Dashed" active={selectedElement.borderStyle === "dashed"} onPress={() => onStyleElement({ borderStyle: "dashed", borderWidth: Math.max(selectedElement.borderWidth ?? 0, 1) })} />
          <MiniButton label="Dotted" active={selectedElement.borderStyle === "dotted"} onPress={() => onStyleElement({ borderStyle: "dotted", borderWidth: Math.max(selectedElement.borderWidth ?? 0, 1) })} />
          <MiniButton label="No border" active={(selectedElement.borderWidth ?? 0) === 0} onPress={() => onStyleElement({ borderWidth: 0 })} />
          <MiniButton label="Shadow" active={!!selectedElement.shadow} onPress={() => onStyleElement({ shadow: !selectedElement.shadow })} />
          <MiniButton label="No fill" active={selectedElement.backgroundColor === "transparent"} onPress={() => onStyleElement({ backgroundColor: "transparent" })} />
        </View>
        <StyleNumberInput palette={palette} label="Radius" value={radius} onChange={setRadius} suffix="px" onApply={() => onStyleElement({ radius: parseNumber(radius, selectedElement.radius, 0, 999) })} />
        <StyleNumberInput palette={palette} label="Opacity" value={opacity} onChange={setOpacity} suffix="%" onApply={() => onStyleElement({ opacity: parseNumber(opacity, Math.round((selectedElement.opacity ?? 1) * 100), 5, 100) / 100 })} />
        <StyleNumberInput palette={palette} label="Border" value={borderWidth} onChange={setBorderWidth} suffix="px" onApply={() => onStyleElement({ borderWidth: parseNumber(borderWidth, selectedElement.borderWidth ?? 0, 0, 16), borderColor: selectedElement.borderColor ?? "#CBD5E1" })} />
      </View>

      {isText ? <View style={styles.styleSection}><ColorCircles label="Text color" activeColor={selectedElement.color} onPick={(color) => onStyleElement({ color })} /><StyleCustomColorInput palette={palette} normalizeColor={normalizeColor} label="Custom text" value={customTextColor} onChange={setCustomTextColor} onApply={(color) => onStyleElement({ color })} /></View> : null}
      {isFillable ? <View style={styles.styleSection}><ColorCircles label="Fill color" activeColor={selectedElement.backgroundColor} onPick={(color) => onStyleElement({ backgroundColor: color, color: color === "#FFFFFF" && !isText ? "#0F172A" : selectedElement.color })} /><StyleCustomColorInput palette={palette} normalizeColor={normalizeColor} label="Custom fill" value={customFillColor} onChange={setCustomFillColor} onApply={(color) => onStyleElement({ backgroundColor: color, color: color === "#FFFFFF" && !isText ? "#0F172A" : selectedElement.color })} /></View> : null}
      <View style={styles.styleSection}><ColorCircles label="Border color" activeColor={selectedElement.borderColor} onPick={(color) => onStyleElement({ borderColor: color, borderWidth: Math.max(selectedElement.borderWidth ?? 0, 1) })} /><StyleCustomColorInput palette={palette} normalizeColor={normalizeColor} label="Custom border" value={customBorderColor} onChange={setCustomBorderColor} onApply={(color) => onStyleElement({ borderColor: color, borderWidth: Math.max(selectedElement.borderWidth ?? 0, 1) })} /></View>
      <View style={styles.styleSection}><ColorCircles label="Shadow color" activeColor={selectedElement.shadowColor} onPick={(color) => onStyleElement({ shadow: true, shadowColor: color })} /><StyleCustomColorInput palette={palette} normalizeColor={normalizeColor} label="Custom shadow" value={customShadowColor} onChange={setCustomShadowColor} onApply={(color) => onStyleElement({ shadow: true, shadowColor: color })} /></View>
    </View>
  );
}

function getPanelRows(activePanel: Exclude<EditorPanel, null>, t: ReturnType<typeof getCopy>, pages: DesignPage[], currentFormat: Format, onApplyPageTemplate: (variant: number) => void, onApplyDeckTemplate: (variant: number) => void, onAddElement: (type: ElementType) => void, onAddPreset: (type: ElementType, overrides: Partial<DesignElement>) => void, onStylePage: (color: string) => void, onExport: (type: ExportKind) => void, onAddPage: () => void, onSelectPage: (page: DesignPage) => void, onPickUpload: () => void, onAddPhoto: (uri: string) => void, onSetBackgroundPhoto: (uri: string) => void, onSetDrawingTool: (tool: DrawingTool) => void) {
  if (activePanel === "templates") {
    if (currentFormat === "presentation") return [
      { title: "Modern investor deck", body: "Complete pitch deck with cover, problem, solution, market, traction, roadmap, and ask", icon: Presentation, action: () => onApplyDeckTemplate(0) },
      { title: "Sales proposal deck", body: "Complete sales presentation with pain, offer, proof, packages, and next step", icon: Presentation, action: () => onApplyDeckTemplate(1) },
      { title: "Product launch deck", body: "Complete launch presentation with story, features, pricing, and CTA", icon: Presentation, action: () => onApplyDeckTemplate(2) },
      { title: "Creative portfolio deck", body: "Portfolio-style presentation with bold cover, work sections, and closing slide", icon: Presentation, action: () => onApplyDeckTemplate(3) },
      { title: "Technology pitch deck", body: "Dark tech-style presentation for SaaS, AI, and product businesses", icon: Presentation, action: () => onApplyDeckTemplate(4) },
      { title: "Project proposal deck", body: "Client proposal deck with scope, plan, timeline, and deliverables", icon: Presentation, action: () => onApplyDeckTemplate(5) },
      { title: "Creative brief deck", body: "Agency-style creative brief with objective, audience, message, and assets", icon: Presentation, action: () => onApplyDeckTemplate(6) },
      { title: "Marketing plan deck", body: "Campaign strategy presentation with channels, funnel, calendar, and KPIs", icon: Presentation, action: () => onApplyDeckTemplate(7) },
      { title: "Financial report deck", body: "Business report deck with revenue, costs, cash flow, and assumptions", icon: Presentation, action: () => onApplyDeckTemplate(8) },
      { title: "Training workshop deck", body: "Teaching deck with agenda, lesson sections, activities, and recap", icon: Presentation, action: () => onApplyDeckTemplate(9) },
      { title: "Brand strategy deck", body: "Brand system presentation with positioning, voice, visuals, and rollout", icon: Presentation, action: () => onApplyDeckTemplate(10) },
      { title: "Minimal startup deck", body: "Clean startup deck with white space, strong typography, and simple charts", icon: Presentation, action: () => onApplyDeckTemplate(11) },
    ];    const labels: Record<Format, string[]> = {
      presentation: ["Investor cover", "Problem map", "Solution story", "Market sizing", "Business model", "Roadmap", "Traction", "Ask slide", "Team slide", "Pricing slide", "Demo slide", "Closing slide"],
      instagram: ["Launch post", "Quote post", "Sale post", "Carousel cover", "Testimonial", "Tip post", "Before / after", "Founder note", "Education cover", "FAQ post", "Comparison post", "Behind scenes"],
      facebook: ["Campaign cover", "Event post", "Testimonial", "Offer post", "Story ad", "Community post", "Feature spotlight", "Founder update", "Lead magnet", "Case study", "Newsletter teaser", "Product news"],
      story: ["Story cover", "Poll story", "Countdown", "Tip story", "Sale story", "Proof story", "Question box", "Checklist", "Review story", "New product", "DM prompt", "Day in life"],
      flyer: ["Promo flyer", "Event flyer", "Service menu", "Coupon", "Premium flyer", "Checklist flyer", "Lead magnet", "Minimal flyer", "Grand opening", "Workshop", "Referral", "Price list"],
      product: ["Product card", "Feature card", "Pricing card", "Comparison", "Bundle card", "App feature", "Course card", "Offer stack", "Launch card", "Benefit card", "Guarantee", "FAQ card"],
    };
    return labels[currentFormat].map((title, index) => ({ title, body: `Editable ${currentFormat} template for this exact canvas`, icon: index % 3 === 0 ? Layers : index % 3 === 1 ? Image : Presentation, action: () => onApplyPageTemplate(index) }));
  }
  if (activePanel === "elements") return [
    { title: "Recently used: soft square", body: "Light neutral square", preview: "soft-square", icon: Square, action: () => onAddPreset("shape", { width: 24, height: 24, radius: 6, backgroundColor: "#CBD5E1" }) },
    { title: "Recently used: dark card", body: "Dark square block", preview: "dark-square", icon: Square, action: () => onAddPreset("shape", { width: 26, height: 26, radius: 2, backgroundColor: "#1F2937" }) },
    { title: "Recently used: circle", body: "Solid round shape", preview: "circle", icon: BadgePlus, action: () => onAddPreset("shape", { width: 24, height: 24, radius: 999, backgroundColor: "#26313B" }) },
    { title: "Line", body: "Straight line", preview: "line", icon: Square, action: () => onAddPreset("shape", { width: 72, height: 3, radius: 999, backgroundColor: "#111827", shapeKind: "line" }) },
    { title: "Dashed line", body: "Dashed separator", preview: "dash", icon: Square, action: () => onAddPreset("shape", { width: 68, height: 4, radius: 999, backgroundColor: "#111827", opacity: 0.9, shapeKind: "dash" }) },
    { title: "Arrow line", body: "Directional arrow", preview: "arrow-right", icon: SendToBack, action: () => onAddPreset("shape", { text: "", width: 34, height: 12, backgroundColor: "#111827", color: "#111827", shapeKind: "arrow-right" }) },
    { title: "Square", body: "Basic black square", preview: "square", icon: Square, action: () => onAddPreset("shape", { width: 24, height: 24, radius: 0, backgroundColor: "#000000" }) },
    { title: "Rounded square", body: "Rounded app-like tile", preview: "rounded", icon: Square, action: () => onAddPreset("shape", { width: 24, height: 24, radius: 8, backgroundColor: "#000000" }) },
    { title: "Circle", body: "Basic circle", preview: "circle", icon: BadgePlus, action: () => onAddPreset("shape", { width: 24, height: 24, radius: 999, backgroundColor: "#000000" }) },
    { title: "Triangle", body: "Sharp triangle shape", preview: "triangle", icon: Square, action: () => onAddPreset("shape", { width: 26, height: 24, radius: 0, backgroundColor: "#000000", rotation: 0, shapeKind: "triangle" }) },
    { title: "Pentagon", body: "Polygon badge", preview: "pentagon", icon: Sparkles, action: () => onAddPreset("shape", { text: "", width: 26, height: 24, backgroundColor: "#000000", color: "#000000", shapeKind: "pentagon" }) },
    { title: "Star", body: "Classic star sticker", preview: "star", icon: Sparkles, action: () => onAddPreset("shape", { text: "", width: 26, height: 24, backgroundColor: "#000000", color: "#000000", shapeKind: "star" }) },
    { title: "Spark star", body: "Four-point sparkle", preview: "spark", icon: Sparkles, action: () => onAddPreset("shape", { text: "", width: 24, height: 22, backgroundColor: "#000000", color: "#000000", shapeKind: "spark" }) },
    { title: "Right arrow", body: "Solid arrow", preview: "arrow-right", icon: SendToBack, action: () => onAddPreset("shape", { text: "", width: 34, height: 13, backgroundColor: "#000000", color: "#000000", shapeKind: "arrow-right" }) },
    { title: "Left arrow", body: "Solid arrow", preview: "arrow-left", icon: SendToBack, action: () => onAddPreset("shape", { text: "", width: 34, height: 13, backgroundColor: "#000000", color: "#000000", shapeKind: "arrow-left" }) },
    { title: "Up arrow", body: "Solid arrow", preview: "arrow-up", icon: SendToBack, action: () => onAddPreset("shape", { text: "", width: 28, height: 18, backgroundColor: "#000000", color: "#000000", shapeKind: "arrow-up" }) },
    { title: "Flowchart card", body: "Diagram block", preview: "flowchart", icon: Box, action: () => onAddPreset("shape", { width: 46, height: 18, radius: 8, backgroundColor: "#E8F3EF", borderWidth: 1, borderColor: "#94A3B8", shapeKind: "flowchart" }) },
    { title: "Image frame", body: "Placeholder for image", preview: "image", icon: Image, action: () => onAddPreset("image", { text: "Image", width: 44, height: 30, radius: 20 }) },
    { title: "Hero image", body: "Large visual placeholder", preview: "hero-image", icon: Image, action: () => onAddPreset("image", { text: "Hero image", width: 74, height: 42, radius: 24 }) },
    { title: "Avatar", body: "Circular photo placeholder", preview: "avatar", icon: Image, action: () => onAddPreset("image", { text: "Avatar", width: 18, height: 18, radius: 999 }) },
    { title: "Gradient blob", body: "Soft decorative gradient", preview: "blob", icon: Brush, action: () => onAddPreset("shape", { width: 34, height: 22, radius: 28, backgroundColor: "#DBEAFE" }) },
    { title: "Stat card", body: "Metric block for numbers", preview: "stat", icon: Table2, action: () => onAddPreset("shape", { text: "", width: 42, height: 22, backgroundColor: "#2563EB", color: "#2563EB", shapeKind: "stat" }) },
    { title: "KPI trio", body: "Three small metric pills", preview: "kpi", icon: Table2, action: () => onAddPreset("shape", { text: "", width: 58, height: 22, backgroundColor: "#DBEAFE", color: "#0F172A", borderColor: "#94A3B8", shapeKind: "kpi" }) },
    { title: "CTA button", body: "Action button", preview: "cta", icon: MousePointer2, action: () => onAddElement("button") },
    { title: "Quote box", body: "Customer quote or proof", preview: "quote", icon: TextCursorInput, action: () => onAddPreset("shape", { text: "", width: 58, height: 22, backgroundColor: "#4D2FB2", color: "#4D2FB2", shapeKind: "quote" }) },
    { title: "Checklist item", body: "Single checklist pill", preview: "checklist", icon: BadgePlus, action: () => onAddPreset("shape", { text: "", width: 54, height: 24, backgroundColor: "#22C55E", color: "#22C55E", shapeKind: "checklist" }) },
    { title: "Progress bar", body: "Simple progress visual", preview: "progress", icon: Square, action: () => onAddPreset("shape", { text: "", width: 58, height: 8, radius: 999, backgroundColor: "#4D2FB2", color: "#4D2FB2", shapeKind: "progress" }) },
    { title: "Phone mockup", body: "Mobile screen placeholder", preview: "phone", icon: Image, action: () => onAddPreset("shape", { text: "", width: 24, height: 44, radius: 24, backgroundColor: "#111827", color: "#111827", shapeKind: "phone" }) },
    { title: "Browser mockup", body: "Website window placeholder", preview: "browser", icon: Image, action: () => onAddPreset("shape", { text: "", width: 72, height: 38, radius: 16, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#CBD5E1", shapeKind: "browser" }) },
    { title: "Table block", body: "Structured table placeholder", preview: "table", icon: Table2, action: () => onAddPreset("shape", { text: "", width: 72, height: 24, radius: 10, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#CBD5E1", shapeKind: "table" }) },
    { title: "QR placeholder", body: "Small square code block", preview: "qr", icon: Box, action: () => onAddPreset("shape", { text: "", width: 22, height: 22, radius: 4, backgroundColor: "#111827", color: "#111827", shapeKind: "qr" }) },
  ];  if (activePanel === "text") return [
    { title: "Big heading", body: "Large title text", preview: "title-text", icon: TextCursorInput, action: () => onAddElement("heading") },
    { title: "Body text", body: "Paragraph copy", preview: "body-text", icon: TextCursorInput, action: () => onAddElement("text") },
    { title: "Small caption", body: "Compact supporting text", preview: "caption-text", icon: TextCursorInput, action: () => onAddPreset("text", { text: "Small caption", fontSize: 10, width: 46, height: 7, color: "#64748B" }) },
    { title: "Label", body: "Badge style text", preview: "label", icon: BadgePlus, action: () => onAddElement("badge") },
    { title: "CTA copy", body: "Button text block", preview: "cta", icon: MousePointer2, action: () => onAddElement("button") },
  ];
  if (activePanel === "brand") return [
    { title: "Primary logo", body: "", preview: "brand-logo", icon: BadgePlus, action: () => onAddPreset("text", { text: "Brand name", width: 48, height: 9, fontSize: 20, fontWeight: "900", color: "#111827" }) },
    { title: "Purple badge", body: "", preview: "brand-purple", icon: BadgePlus, action: () => onAddPreset("badge", { text: "BRAND", width: 34, backgroundColor: "#4D2FB2", color: "#FFFFFF" }) },
    { title: "Green badge", body: "", preview: "brand-green", icon: BadgePlus, action: () => onAddPreset("badge", { text: "BRAND", width: 34, backgroundColor: "#183B35", color: "#FFFFFF" }) },
    { title: "Gold accent", body: "", preview: "brand-gold", icon: BadgePlus, action: () => onAddPreset("shape", { width: 34, height: 12, radius: 999, backgroundColor: "#DFAE55" }) },
    { title: "Monogram", body: "", preview: "brand-mono", icon: BadgePlus, action: () => onAddPreset("badge", { text: "B", width: 16, height: 16, radius: 999, backgroundColor: "#111827", color: "#FFFFFF", fontSize: 18 }) },
    { title: "Brand strip", body: "", preview: "line", icon: Square, action: () => onAddPreset("shape", { width: 64, height: 3, radius: 999, backgroundColor: "#4D2FB2" }) },
  ];
  if (activePanel === "uploads") return [
    { title: "Upload image", body: "", preview: "upload-image", icon: Upload, action: onPickUpload },
    { title: "Upload video", body: "", preview: "video", icon: Upload, action: onPickUpload },
    { title: "Upload media", body: "", preview: "file", icon: FileText, action: onPickUpload },
    { title: "Replace selected image", body: "", preview: "upload-image", icon: Image, action: onPickUpload },
  ];
  if (activePanel === "photo") return PHOTO_LIBRARY.map((photo) => ({ title: photo.title, body: photo.query, preview: `uri:${photo.uri}`, icon: Image, action: () => onAddPhoto(photo.uri) }));
  if (activePanel === "background") return [
    { title: "White", body: "solid color", preview: "bg-white", icon: Square, action: () => onStylePage("#FFFFFF") },
    { title: "Black", body: "solid color", preview: "bg-black", icon: Square, action: () => onStylePage("#0F172A") },
    { title: "Purple", body: "solid color", preview: "bg-purple", icon: Square, action: () => onStylePage("#4D2FB2") },
    { title: "Teal", body: "solid color", preview: "bg-teal", icon: Square, action: () => onStylePage("#183B35") },
    ...BACKGROUND_LIBRARY.map((photo) => ({ title: photo.title, body: photo.query, preview: `uri:${photo.uri}`, icon: Image, action: () => onSetBackgroundPhoto(photo.uri) })),
  ];
  if (activePanel === "captions") return [
    { title: "Caption block", body: "", preview: "text", icon: FileText, action: () => onAddPreset("text", { text: "Short caption goes here.", width: 62, height: 10, fontSize: 13, color: "#475569" }) },
    { title: "Quote caption", body: "", preview: "quote", icon: FileText, action: () => onAddPreset("text", { text: "\"Customer proof goes here.\"", width: 68, height: 12, fontSize: 15, color: "#111827" }) },
    { title: "Numbered caption", body: "", preview: "number", icon: FileText, action: () => onAddPreset("badge", { text: "01", width: 16, height: 16, radius: 999, backgroundColor: "#4D2FB2", color: "#FFFFFF", fontSize: 18 }) },
    { title: "Footer note", body: "", preview: "caption-footer", icon: FileText, action: () => onAddPreset("text", { text: "website.com", y: 88, width: 44, height: 7, fontSize: 11, color: "#64748B" }) },
  ];  if (activePanel === "downloads") return [
    { title: "Export PDF", body: "Share all pages as PDF", icon: Download, action: () => onExport("pdf") },
    { title: "Export project JSON", body: "Editable project data", icon: FileText, action: () => onExport("json") },
    { title: "Export Canva JSON", body: "Canva-style editable project data", icon: FileText, action: () => onExport("canva") },
    { title: "Export HTML", body: "Browser-ready design file", icon: FileText, action: () => onExport("html") },
    { title: "Export SVG", body: "Vector-friendly design file", icon: FileText, action: () => onExport("svg") },
    { title: "Export PowerPoint-compatible", body: "HTML file PowerPoint can open/import", icon: Presentation, action: () => onExport("ppt") },
  ];
  if (activePanel === "instruments") return [
    { title: "Pen", body: "Draw a clean hand stroke on the page", preview: "line", icon: Pencil, action: () => onSetDrawingTool("pen") },
    { title: "Pencil", body: "Draw a soft dashed sketch stroke", preview: "dash", icon: Pencil, action: () => onSetDrawingTool("pencil") },
    { title: "Marker", body: "Draw a thick translucent highlight", preview: "brand-gold", icon: Brush, action: () => onSetDrawingTool("marker") },
    { title: "Stop drawing", body: "Return to selecting and moving elements", preview: "caption-footer", icon: MousePointer2, action: () => onSetDrawingTool(null) },
    { title: "Table block", body: "Simple table placeholder", preview: "table", icon: Table2, action: () => onAddPreset("shape", { text: "", width: 72, height: 24, radius: 10, backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", shapeKind: "table" }) },
  ];  return [{ title: t.addPage, body: "Create a new page", icon: Plus, action: onAddPage }, ...pages.map((page, index) => ({ title: `${index + 1}. ${page.title}`, body: page.format, icon: Presentation, action: () => onSelectPage(page) }))];
}
function DockButton({ label, icon: Icon, onPress, palette, danger }: { label: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; onPress: () => void; palette: ReturnType<typeof getPalette>; danger?: boolean }) {
  return <Pressable onPress={onPress} style={[styles.dockButton, { backgroundColor: danger ? "rgba(220,38,38,0.14)" : palette.chip, borderColor: danger ? "rgba(220,38,38,0.35)" : palette.border }]}><Icon size={19} color={danger ? "#EF4444" : palette.text} /><Text style={[styles.dockButtonText, { color: danger ? "#EF4444" : palette.text }]}>{label}</Text></Pressable>;
}

function ToolChip({ label, onPress, palette }: { label: string; onPress: () => void; palette: ReturnType<typeof getPalette> }) {
  return <Pressable onPress={onPress} style={[styles.toolChip, { backgroundColor: palette.chip, borderColor: palette.border }]}><Text style={[styles.toolChipText, { color: palette.text }]} numberOfLines={1}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  pageStrip: { gap: 8, paddingHorizontal: 12, paddingTop: 8, alignItems: "center" },
  pageThumb: { width: 58, height: 42, borderRadius: 8, borderWidth: 2, padding: 6, justifyContent: "space-between" },
  pageDeleteButton: { position: "absolute", right: -4, top: -4, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", zIndex: 20, elevation: 6 },
  pageThumbNumber: { color: "#0F172A", fontSize: 9, fontWeight: "900" },
  pageThumbLine: { width: "78%", height: 4, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.14)" },
  pagePlus: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pageThumbAdd: { width: 48, height: 42, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  contextTools: { gap: 8, paddingHorizontal: 12, alignItems: "center" },
  colorDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1 },
  colorPill: { width: 48, height: 34, borderRadius: 12, borderWidth: 1 },
  sheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  sheetModalRoot: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.04)" },
  editorSheet: { maxHeight: "52%", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 34 : 18, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 12 },
  editorSheetSmall: { maxHeight: "34%" },
  sheetHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 999, backgroundColor: "rgba(148,163,184,0.55)", marginBottom: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sheetTitle: { fontSize: 18, fontWeight: "900", textTransform: "capitalize" },
  sheetClose: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  sheetCloseText: { fontSize: 22, fontWeight: "900", marginTop: -2 },
  canvaToolRailScroll: { minHeight: 76, maxHeight: 80, flexGrow: 0, marginBottom: 9, zIndex: 2 },
  canvaToolRail: { gap: 10, paddingBottom: 8, paddingTop: 4, alignItems: "center" },
  canvaRailItem: { width: 64, minHeight: 58, borderRadius: 16, borderWidth: 1, borderColor: "transparent", alignItems: "center", justifyContent: "center", gap: 5 },
  canvaRailText: { fontSize: 9, lineHeight: 11, fontWeight: "800", textAlign: "center" },
  searchBox: { minHeight: 46, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, marginBottom: 10, zIndex: 4 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "700" },
  sheetList: { gap: 9, paddingBottom: 12 },
  stylePanel: { gap: 14, paddingBottom: 14 },
  styleSection: { gap: 10 },
  styleSectionTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  styleSubLabel: { fontSize: 11, fontWeight: "800", marginTop: 2 },
  styleControlsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  styleMiniButton: { minHeight: 38, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" },
  styleMiniButtonText: { fontSize: 12, fontWeight: "900" },
  styleInputWrap: { minHeight: 48, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  styleInputLabel: { fontSize: 12, fontWeight: "900" },
  styleNumberInput: { flex: 1, fontSize: 16, fontWeight: "900", paddingVertical: 8, textAlign: "right" },
  styleApplySmall: { borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  styleApplyText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  styleTextInputWrap: { minHeight: 92, borderRadius: 18, borderWidth: 1, padding: 10, gap: 10 },
  styleTextArea: { minHeight: 56, fontSize: 15, lineHeight: 20, fontWeight: "800", textAlignVertical: "top" },
  styleGridTwo: { gap: 10 },
  customColorPreview: { width: 24, height: 24, borderRadius: 12, borderWidth: 1 },

  colorCircleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2 },
  colorCircleActive: { transform: [{ scale: 1.08 }] },
  fontSizeControl: { minHeight: 48, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, marginBottom: 12 },
  fontSizeLabel: { fontSize: 12, fontWeight: "900" },
  fontSizeInput: { flex: 1, fontSize: 16, fontWeight: "900", paddingVertical: 8 },
  fontSizeApply: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  fontSizeApplyText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  sheetRow: { minHeight: 64, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  sheetVisualRow: { minHeight: 92, alignItems: "stretch" },
  previewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 14 },
  previewTile: { width: "30.5%", minHeight: 98, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", padding: 5, overflow: "hidden" },
  templatePreviewCanvas: { width: "100%", minHeight: 78, borderRadius: 12, overflow: "hidden", position: "relative", borderWidth: 1, borderColor: "rgba(15,23,42,0.10)" },
  templateHeroBlock: { position: "absolute", left: 7, top: 8, width: 34, height: 38, borderRadius: 8 },
  templateAccentBar: { position: "absolute", left: 8, right: 8, height: 6, borderRadius: 999 },
  templateMiniCircle: { position: "absolute", width: 18, height: 18, borderRadius: 9, right: 9, top: 10 },
  templateLineStack: { position: "absolute", left: 8, right: 8, bottom: 9, gap: 5 },
  templateLineDark: { position: "absolute", height: 6, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.82)", left: 8 },
  templateLineLight: { position: "absolute", height: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.75)", left: 8 },
  templateSplitLeft: { position: "absolute", left: 0, top: 0, bottom: 0, width: "54%" },
  templateSplitRight: { position: "absolute", right: 0, top: 0, bottom: 0, width: "46%" },
  templatePosterText: { position: "absolute", height: 8, borderRadius: 999 },
  templateMiniPhoto: { position: "absolute", width: 28, height: 26, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.72)" },
  templateTechRing: { position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 5, borderColor: "rgba(14,165,233,0.75)", right: 15, top: 14 },
  templateGlowDot: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#DFAE55" },
  templateWave: { position: "absolute", width: 76, height: 34, borderRadius: 28, right: -18, bottom: 8, transform: [{ rotate: "-10deg" }] },
  templateWaveSmall: { position: "absolute", width: 48, height: 16, borderRadius: 18, right: 4, bottom: 21, transform: [{ rotate: "-10deg" }] },
  templateBarChart: { position: "absolute", left: 10, bottom: 11, height: 48, flexDirection: "row", alignItems: "flex-end", gap: 5 },
  templateChartBar: { width: 8, borderRadius: 999, backgroundColor: "#DFAE55" },
  templateReportGrid: { position: "absolute", left: 8, top: 8, width: 48, height: 44, flexDirection: "row", flexWrap: "wrap", gap: 4 },
  templateReportCell: { width: 20, height: 12, borderRadius: 4, backgroundColor: "rgba(15,23,42,0.12)" },
  templateCheckRow: { position: "absolute", left: 10, width: "78%", height: 8, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.30)" },
  templateColorChip: { position: "absolute", top: 12, width: 17, height: 28, borderRadius: 8 },
  templatePreviewMain: { flex: 1, minHeight: 58, borderRadius: 10, padding: 7, overflow: "hidden", justifyContent: "space-between" },
  templatePreviewKicker: { width: 22, height: 5, borderRadius: 999, opacity: 0.88 },
  templatePreviewTitle: { fontSize: 10, lineHeight: 11, fontWeight: "900", textTransform: "uppercase" },
  templatePreviewRows: { gap: 3 },
  templatePreviewLine: { width: "78%", height: 4, borderRadius: 999 },
  templatePreviewLineShort: { width: "52%", height: 4, borderRadius: 999 },
  templatePreviewSlides: { flexDirection: "row", gap: 4 },
  templateTinySlide: { width: 24, height: 14, borderRadius: 3, borderWidth: 1, borderColor: "rgba(15,23,42,0.10)" },
  elementPreviewBox: { width: "100%", minHeight: 88, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", overflow: "hidden", paddingHorizontal: 0 },
  previewRealImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", borderRadius: 14 },
  previewTextShell: { width: "100%", height: "100%", minHeight: 80, alignItems: "center", justifyContent: "center", paddingHorizontal: 7, alignSelf: "stretch" },
  previewSquare: { width: 42, height: 42, borderRadius: 2 },
  previewRounded: { width: 42, height: 42, borderRadius: 9, backgroundColor: "#000000" },
  previewArrowShape: { width: 58, height: 28, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  previewArrowShaft: { width: 38, height: 8, borderRadius: 999, backgroundColor: "#111827" },
  previewArrowHead: { width: 0, height: 0, borderTopWidth: 12, borderBottomWidth: 12, borderLeftWidth: 18, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "#111827" },
  previewPentagon: { width: 44, height: 34, backgroundColor: "#111827", borderRadius: 8, transform: [{ rotate: "-6deg" }] },
  previewPentagonTop: { position: "absolute", top: -13, left: 9, width: 26, height: 26, backgroundColor: "#111827", transform: [{ rotate: "45deg" }], borderRadius: 4 },
  previewSpark: { width: 38, height: 38, backgroundColor: "#111827", borderRadius: 12, transform: [{ rotate: "18deg" }] },
  previewFlowchart: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewFlowNode: { width: 22, height: 18, borderRadius: 7, backgroundColor: "#E8F3EF", borderWidth: 1, borderColor: "#94A3B8" },
  previewFlowLine: { width: 18, height: 3, borderRadius: 999, backgroundColor: "#94A3B8" },
  previewStatCard: { width: 62, height: 44, borderRadius: 14, backgroundColor: "#DBEAFE", padding: 8, justifyContent: "space-between" },
  previewStatNumber: { width: 32, height: 12, borderRadius: 999, backgroundColor: "#2563EB" },
  previewStatLine: { width: 46, height: 6, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.18)" },
  previewQuoteCard: { width: 62, height: 44, borderRadius: 14, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#CBD5E1", padding: 8, gap: 5 },
  previewQuoteMark: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#4D2FB2" },
  previewQuoteLine: { width: 44, height: 5, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.22)" },
  previewChecklist: { width: 58, gap: 6 },
  previewChecklistRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewChecklistDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#22C55E" },
  previewChecklistLine: { flex: 1, height: 6, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.22)" },
  previewProgressTrack: { width: 62, height: 12, borderRadius: 999, backgroundColor: "#E2E8F0", overflow: "hidden" },
  previewProgressFill: { width: "68%", height: "100%", borderRadius: 999, backgroundColor: "#4D2FB2" },
  previewBrowser: { width: 64, height: 44, borderRadius: 10, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#CBD5E1", overflow: "hidden" },
  previewBrowserTop: { height: 10, backgroundColor: "#E2E8F0" },
  previewBrowserBody: { margin: 7, flex: 1, borderRadius: 6, backgroundColor: "#DBEAFE" },
  previewQr: { width: 44, height: 44, flexDirection: "row", flexWrap: "wrap", backgroundColor: "#FFFFFF" },
  previewQrCell: { width: "33.33%", height: "33.33%", backgroundColor: "#111827", borderWidth: 2, borderColor: "#FFFFFF" },
  previewUploadPlus: { width: 26, height: 26, borderRadius: 13, borderWidth: 3, borderColor: "#4D2FB2" },
  previewMusicIcon: { width: 48, height: 48, position: "relative" },
  previewMusicStem: { position: "absolute", right: 13, top: 4, width: 5, height: 34, borderRadius: 999, backgroundColor: "#EF4444" },
  previewMusicNote: { position: "absolute", left: 8, bottom: 4, width: 24, height: 18, borderRadius: 12, backgroundColor: "#EF4444" },
  previewPlayTriangle: { width: 0, height: 0, borderTopWidth: 12, borderBottomWidth: 12, borderLeftWidth: 18, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "#FFFFFF" },
  previewCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#1F2937" },
  previewTriangle: { width: 0, height: 0, borderLeftWidth: 25, borderRightWidth: 25, borderBottomWidth: 46, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#000000" },
  previewLine: { width: 62, height: 3, backgroundColor: "#111827", borderRadius: 999 },
  previewDashRow: { flexDirection: "row", gap: 5 },
  previewDash: { width: 16, height: 3, backgroundColor: "#111827", borderRadius: 999 },
  previewArrow: { fontSize: 44, lineHeight: 48, color: "#000000", fontWeight: "900" },
  previewStar: { fontSize: 48, lineHeight: 52, color: "#000000", fontWeight: "900" },
  previewBlob: { width: 52, height: 42, borderRadius: 24, opacity: 0.84 },
  previewTable: { width: 54, height: 42, flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: "#94A3B8" },
  previewTableCell: { width: "33.33%", height: "50%", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#CBD5E1" },
  previewImage: { width: 58, height: 42, borderRadius: 10, overflow: "hidden" },
  previewSun: { position: "absolute", right: 8, top: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: "#FDE68A" },
  previewMountain: { position: "absolute", left: 8, bottom: 6, width: 42, height: 18, borderRadius: 8, backgroundColor: "rgba(15,23,42,0.20)", transform: [{ rotate: "-8deg" }] },
  previewText: { fontSize: 42, lineHeight: 46, color: "#8B3DFF", fontWeight: "900" },
  previewHeadingActual: { width: "100%", color: "#111827", fontSize: 16, lineHeight: 18, fontWeight: "900", textAlign: "center", paddingHorizontal: 2, includeFontPadding: false, alignSelf: "center"},
  previewBodyActual: { width: "100%", color: "#334155", fontSize: 10, lineHeight: 14, fontWeight: "700", textAlign: "center", paddingHorizontal: 2, includeFontPadding: false, alignSelf: "center"},
  previewCaptionActual: { width: "100%", color: "#64748B", fontSize: 9, lineHeight: 11, fontWeight: "800", textAlign: "center", paddingHorizontal: 2, includeFontPadding: false, alignSelf: "center"},
  previewTextActual: { width: "100%", color: "#475569", fontSize: 9, lineHeight: 12, fontWeight: "800", textAlign: "center", paddingHorizontal: 2, includeFontPadding: false, alignSelf: "center"},
  previewLabelText: { color: "#111827", fontSize: 9, fontWeight: "900" },
  previewCtaText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900" },
  previewTextCard: { width: 62, gap: 7 },
  previewTextTitle: { width: 54, height: 14, borderRadius: 4, backgroundColor: "#111827" },
  previewTextLine: { width: 44, height: 6, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.20)" },
  previewCaptionText: { width: 56, height: 8, borderRadius: 999, backgroundColor: "#64748B" },
  previewLabelPill: { width: 54, height: 22, borderRadius: 999, backgroundColor: "#DFAE55" },
  previewPhone: { width: 32, height: 54, borderRadius: 14, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  previewPhoneLine: { width: 18, height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.35)" },
  previewBrandCard: { width: 58, height: 44, borderRadius: 14, padding: 8, justifyContent: "space-between", overflow: "hidden" },
  previewBrandDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.82)" },
  previewBrandLines: { gap: 4 },
  previewBrandLineWide: { width: 38, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.74)" },
  previewBrandLine: { width: 24, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.52)" },
  previewPhotoCard: { width: 62, height: 48, borderRadius: 12, padding: 8, justifyContent: "flex-end", overflow: "hidden" },
  previewPhotoGlow: { position: "absolute", right: 7, top: 7, width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.65)" },
  previewPhotoLine: { width: 42, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.74)" },
  previewPhotoLineShort: { width: 28, height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.52)", marginTop: 5 },
  previewBackgroundCard: { width: 62, height: 52, borderRadius: 12, borderWidth: 1, borderColor: "rgba(15,23,42,0.12)" },
  previewUploadCard: { width: 58, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  previewUploadIcon: { color: "#4D2FB2", fontSize: 30, fontWeight: "900", lineHeight: 34 },
  previewProjectCard: { width: 58, height: 44, borderRadius: 10, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  previewProjectGrid: { width: 22, height: 22, flexDirection: "row", flexWrap: "wrap", gap: 3 },
  previewProjectCell: { width: 8, height: 8, borderRadius: 2, backgroundColor: "#64748B" },
  previewFileCard: { width: 52, height: 46, borderRadius: 10, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", padding: 8, justifyContent: "flex-end", gap: 5, overflow: "hidden" },
  previewFileCorner: { position: "absolute", right: 0, top: 0, width: 0, height: 0, borderTopWidth: 17, borderRightWidth: 17, borderTopColor: "#E2E8F0", borderRightColor: "#4D2FB2" },
  previewFileLine: { width: 36, height: 5, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.20)" },
  previewQuote: { fontSize: 48, lineHeight: 52, color: "#4D2FB2", fontWeight: "900" },
  previewNumber: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#F97316", alignItems: "flex-end", justifyContent: "flex-end", padding: 6 },
  previewNumberText: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  previewChart: { width: 56, height: 48, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: "#DFAE55", flexDirection: "row", alignItems: "flex-end", gap: 6, paddingLeft: 6, paddingBottom: 4 },
  previewChartBar: { width: 8, borderRadius: 999, backgroundColor: "#DFAE55" },
  previewMusic: { color: "#EF4444", fontSize: 46, lineHeight: 50, fontWeight: "900" },
  previewVideo: { width: 58, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  previewVideoPlay: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" },
  previewDiagram: { width: 62, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  previewDiagramNode: { width: 16, height: 16, borderRadius: 8 },
  previewDiagramLink: { width: 12, height: 3, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.22)" },
  previewForm: { width: 58, height: 46, borderRadius: 14, backgroundColor: "#DCFCE7", padding: 8, gap: 5 },
  previewFormLine: { height: 7, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.18)" },
  previewFormButton: { width: 30, height: 10, borderRadius: 999, backgroundColor: "#22C55E", alignSelf: "flex-end" },
  sheetPreview: { width: 84, minHeight: 66, borderRadius: 14, padding: 9, justifyContent: "space-between", overflow: "hidden" },
  sheetPreviewBadge: { width: 20, height: 20, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.72)" },
  sheetPreviewLineWide: { width: "88%", height: 7, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.18)" },
  sheetPreviewLine: { width: "62%", height: 7, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.14)" },
  animationCard: { minHeight: 70, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  animationPreview: { width: 42, height: 42, borderRadius: 16 },
  sheetRowText: { flex: 1, gap: 2 },
  sheetRowTitle: { fontSize: 14, fontWeight: "900" },
  sheetRowBody: { fontSize: 12, lineHeight: 16, fontWeight: "600" },  chooserContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120, gap: 16 },
  continueButton: { minHeight: 42, borderRadius: 14, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  continueText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  chooserGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  chooserCard: { width: "48%", minHeight: 190, borderRadius: 24, borderWidth: 1, padding: 12, gap: 10 },
  chooserPreview: { height: 92, borderRadius: 18, padding: 12, overflow: "hidden", justifyContent: "space-between" },
  chooserIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  chooserLines: { gap: 7 },
  chooserLineWide: { width: "78%", height: 8, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.12)" },
  chooserLine: { width: "52%", height: 8, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.10)" },
  chooserTitle: { fontSize: 16, lineHeight: 20, fontWeight: "900" },
  chooserBody: { fontSize: 12, lineHeight: 17, fontWeight: "600" },  canvaRoot: { flex: 1 },
  canvaSafe: { flex: 1, paddingHorizontal: 12, paddingBottom: 0 },
  canvaSafeLandscape: { paddingHorizontal: 8, paddingBottom: Platform.OS === "ios" ? 8 : 6 },
  canvaKeyboard: { flex: 1 },
  canvaHeader: { minHeight: 54, borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  canvaHeaderLandscape: { minHeight: 42, borderRadius: 16, paddingHorizontal: 6, gap: 5 },
  canvaIconButton: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  disabledIconButton: { opacity: 0.45 },
  canvaTitleInput: { flex: 1, fontSize: 15, fontWeight: "900", paddingVertical: 8 },
  canvaSaveButton: { width: 42, height: 38, borderRadius: 14, backgroundColor: "#4D2FB2", alignItems: "center", justifyContent: "center" },
  canvaStage: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 },
  canvaStageLandscape: { paddingVertical: 2, paddingHorizontal: 6 },
  blankPage: { width: "100%", maxWidth: 420, borderRadius: 3, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8, overflow: "hidden" },
  blankPageLandscape: { width: "78%", maxWidth: 620 },
  inlineTextToolbar: { borderRadius: 18, borderWidth: 1, marginBottom: 7, overflow: "hidden" },
  inlineTextTools: { gap: 8, paddingHorizontal: 10, paddingVertical: 8, alignItems: "center" },
  textEditPanel: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, marginBottom: 8 },
  textEditInput: { minHeight: 42, fontSize: 14, fontWeight: "800" },
  bottomDock: { borderRadius: 24, borderWidth: 1, paddingVertical: 10, gap: 9, marginBottom: 0 },
  bottomDockLandscape: { paddingVertical: 6, gap: 6, marginBottom: 0 },
  bottomTools: { gap: 10, paddingHorizontal: 12 },
  bottomToolsSmall: { gap: 8, paddingHorizontal: 12 },
  dockButton: { width: 72, minHeight: 54, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 6 },
  dockButtonText: { fontSize: 10, fontWeight: "900", textAlign: "center" },
  designBlock: { position: "absolute", paddingHorizontal: 8, paddingVertical: 6, alignItems: "center", justifyContent: "center", gap: 4 },
  designBlockFlush: { paddingHorizontal: 0, paddingVertical: 0, gap: 0 },
  designText: { width: "100%", fontWeight: "900" },
  designImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  designImageFilter: { ...StyleSheet.absoluteFillObject },
  drawnCenter: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%", height: "100%" },
  drawnTriangle: { width: 0, height: 0, borderLeftWidth: 42, borderRightWidth: 42, borderBottomWidth: 72, borderLeftColor: "transparent", borderRightColor: "transparent" },
  drawnPentagon: { width: "70%", height: "64%", borderRadius: 9, alignSelf: "center", marginTop: "14%" },
  drawnPentagonTop: { position: "absolute", top: -18, left: "24%", width: "52%", aspectRatio: 1, transform: [{ rotate: "45deg" }], borderRadius: 5 },
  drawnSpark: { width: "58%", aspectRatio: 1, borderRadius: 13 },
  drawnArrow: { width: "86%", height: "70%", flexDirection: "row", alignItems: "center", justifyContent: "center" },
  drawnArrowShaft: { width: "66%", height: "28%", borderRadius: 999 },
  drawnArrowHead: { width: 0, height: 0, borderTopWidth: 18, borderBottomWidth: 18, borderLeftWidth: 26, borderTopColor: "transparent", borderBottomColor: "transparent" },
  drawnLine: { width: "90%", height: 4, borderRadius: 999 },
  drawnDashRow: { width: "90%", flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  drawnDash: { flex: 1, height: 4, borderRadius: 999 },
  drawnFlowchart: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", height: "100%" },
  drawnFlowNode: { width: "31%", height: "56%", borderRadius: 8, borderWidth: 1, backgroundColor: "rgba(232,243,239,0.9)" },
  drawnFlowLine: { width: "15%", height: 3, borderRadius: 999 },
  drawnTable: { width: "100%", height: "100%", borderWidth: 1, flexDirection: "row", flexWrap: "wrap", overflow: "hidden", borderRadius: 10 },
  drawnTableCell: { width: "33.33%", height: "50%", borderRightWidth: 1, borderBottomWidth: 1 },
  drawnStat: { flex: 1, borderRadius: 14, backgroundColor: "#DBEAFE", padding: 10, justifyContent: "space-between" },
  drawnStatNumber: { width: "52%", height: 13, borderRadius: 999 },
  drawnStatLine: { width: "78%", height: 7, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.18)" },
  drawnProgressTrack: { width: "92%", height: "58%", borderRadius: 999, backgroundColor: "#E2E8F0", overflow: "hidden" },
  drawnProgressFill: { width: "68%", height: "100%", borderRadius: 999 },
  drawnBrowser: { flex: 1, borderWidth: 1, borderRadius: 14, overflow: "hidden", backgroundColor: "#F8FAFC" },
  drawnBrowserTop: { height: "20%", backgroundColor: "#E2E8F0" },
  drawnBrowserBody: { flex: 1, margin: 8, borderRadius: 9, backgroundColor: "#DBEAFE" },
  drawnQr: { width: "100%", height: "100%", flexDirection: "row", flexWrap: "wrap", backgroundColor: "#FFFFFF" },
  drawnQrCell: { width: "25%", height: "25%", borderWidth: 1, borderColor: "#FFFFFF" },
  drawnPhone: { flex: 1, borderRadius: 24, alignItems: "center", justifyContent: "center", padding: 10 },
  drawnPhoneLine: { width: "46%", height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.36)" },
  drawnChart: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 8, padding: 10, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: "rgba(15,23,42,0.25)" },
  drawnChartBar: { width: 11, borderRadius: 999 },
  drawnQuote: { flex: 1, borderRadius: 14, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#CBD5E1", padding: 10, gap: 7, justifyContent: "center" },
  drawnQuoteDot: { width: 16, height: 16, borderRadius: 8 },
  drawnQuoteLine: { width: "78%", height: 6, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.18)" },
  drawnChecklist: { flex: 1, justifyContent: "center", gap: 7, padding: 9 },
  drawnChecklistRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  drawnChecklistDot: { width: 11, height: 11, borderRadius: 6 },
  drawnChecklistLine: { flex: 1, height: 6, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.18)" },
  drawnVideo: { flex: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  drawnMusicIcon: { flex: 1, width: "100%", height: "100%", position: "relative" },
  drawnMusicStem: { position: "absolute", right: "24%", top: "8%", width: "13%", height: "68%", borderRadius: 999 },
  drawnMusicNote: { position: "absolute", left: "12%", bottom: "8%", width: "50%", height: "34%", borderRadius: 999 },
  drawnPlayTriangle: { width: 0, height: 0, borderTopWidth: 18, borderBottomWidth: 18, borderLeftWidth: 28, borderTopColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "#FFFFFF" },
  drawnForm: { flex: 1, borderRadius: 14, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#CBD5E1", padding: 10, gap: 6 },
  drawnFormLine: { height: 7, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.16)" },
  drawnFormButton: { width: "44%", height: 10, borderRadius: 999, alignSelf: "flex-end" },
  drawnFile: { flex: 1, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", padding: 10, justifyContent: "flex-end", gap: 6, overflow: "hidden" },
  drawnFileCorner: { position: "absolute", right: 0, top: 0, width: 0, height: 0, borderTopWidth: 20, borderRightWidth: 20, borderTopColor: "rgba(15,23,42,0.08)" },
  drawnFileLine: { width: "76%", height: 6, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.18)" },
  drawnDiagram: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  drawnDiagramNode: { width: 20, height: 20, borderRadius: 10 },
  drawnDiagramConnector: { width: 16, height: 3, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.22)" },
  selectedFrame: { position: "absolute", left: -3, right: -3, top: -3, bottom: -3, borderWidth: 1.5, borderColor: "#4D2FB2", borderRadius: 0 },
  elementQuickToolbar: { zIndex: 80, minHeight: 48, borderRadius: 20, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 8, paddingVertical: 6, marginHorizontal: 8, marginBottom: 6, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 10 },
  elementQuickButton: { width: 38, height: 38, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  designBlockShadow: { shadowColor: "#000", shadowOpacity: 0.20, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  resizeHandle: { position: "absolute", right: -16, bottom: -16, width: 44, height: 44, borderRadius: 22, backgroundColor: "#4D2FB2", borderWidth: 3, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", zIndex: 90, elevation: 12 },
  previewFallbackCard: { width: 66, height: 56, borderRadius: 14, padding: 8, justifyContent: "space-between", overflow: "hidden" },
  previewFallbackShape: { width: 24, height: 24, borderRadius: 9 },
  previewFallbackLine: { width: "78%", height: 6, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.18)" },
  toolChip: { maxWidth: 132, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  toolChipText: { fontSize: 11, fontWeight: "900" },

  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardWrap: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 120, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between" },
  headerButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  hero: { borderRadius: 28, borderWidth: 1, padding: 20, gap: 12 },
  badge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  badgeText: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: "800" },
  heroTitle: { fontSize: 30, lineHeight: 34, fontWeight: "900" },
  heroBody: { fontSize: 13, lineHeight: 21 },
  companyPill: { alignSelf: "flex-start", overflow: "hidden", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, fontSize: 12, fontWeight: "800" },
  card: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "900" },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  bullet: { fontSize: 14, lineHeight: 24, fontWeight: "600" },
  rowButtons: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  primaryButton: { flex: 1, minWidth: 130, borderRadius: 18, backgroundColor: "#FFFFFF", paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButtonText: { color: "#0F172A", fontWeight: "900", fontSize: 14 },
  secondaryButton: { flex: 1, minWidth: 130, borderRadius: 18, backgroundColor: "#4D2FB2", paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  emptyTitle: { fontSize: 24, fontWeight: "900", textAlign: "center" },
  emptyBody: { marginTop: 8, textAlign: "center", fontSize: 14, lineHeight: 22 },
});



















































































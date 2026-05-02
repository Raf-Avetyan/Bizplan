import React, { useEffect, useMemo, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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
  Bookmark,
  Copy,
  Folder,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Sparkles,
  ThumbsUp,
  Trash2,
} from "lucide-react-native";
import { useToast } from "@/components/ui/Toast/Toast";
import { useActiveCompany } from "@/hooks/useCompanyQueries";
import {
  generateImageWithServer,
  hasGeminiKey,
  sendChatMessageWithGemini,
} from "@/lib/gemini";
import {
  deleteToolDocument,
  getToolDocuments,
  saveToolDocument,
  ToolDocument,
  ToolDocumentType,
} from "@/lib/tool-documents";
import type { Company } from "@/types/company.types";
import { useSettings } from "@/lib/settings-context";

type ToolWorkspaceScreenProps = {
  type: ToolDocumentType;
  eyebrow: string;
  title: string;
  description: string;
  promptLabel: string;
  promptPlaceholder: string;
  suggestions: string[];
  buildPrompt: (params: {
    company: Company | null | undefined;
    userPrompt: string;
  }) => string;
};

export default function ToolWorkspaceScreen({
  type,
  eyebrow,
  title,
  description,
  promptLabel,
  promptPlaceholder,
  suggestions,
  buildPrompt,
}: ToolWorkspaceScreenProps) {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { data: activeCompany } = useActiveCompany();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getToolPalette(isDark);
  const t = getToolWorkspaceCopy(settings.language, type, {
    eyebrow,
    title,
    description,
    promptLabel,
    promptPlaceholder,
    suggestions,
  });

  const [userPrompt, setUserPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [documents, setDocuments] = useState<ToolDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);
  const [socialOptions, setSocialOptions] = useState<SocialPostOptions>({
    tone: "confident",
    goal: "engagement",
    visualStyle: "premium",
    hashtagsMode: type === "instagram-post" ? "balanced" : "minimal",
  });

  useEffect(() => {
    void loadDocuments();
  }, [type, activeCompany?.id]);

  const subtitle = useMemo(
    () => activeCompany?.businessName ?? t.noActiveCompany,
    [activeCompany?.businessName, t.noActiveCompany],
  );

  async function loadDocuments() {
    try {
      setIsLoadingDocuments(true);
      const nextDocuments = await getToolDocuments(type, activeCompany?.id ?? null);
      setDocuments(nextDocuments);

      if (!output && nextDocuments[0]?.content) {
        setOutput(nextDocuments[0].content);
      }
    } finally {
      setIsLoadingDocuments(false);
    }
  }

  async function handleGenerate() {
    const cleanPrompt = userPrompt.trim();
    if (!cleanPrompt) {
      toast.showToast(t.promptRequired, t.addInstructions, "warning");
      return;
    }

    if (!isSocialTool(type) && !hasGeminiKey()) {
      toast.showToast(
        t.missingGeminiKey,
        t.addGeminiKey,
        "warning",
      );
      return;
    }

    try {
      setIsGenerating(true);
      const finalPrompt = isSocialTool(type)
        ? buildCustomizedSocialPrompt(cleanPrompt, socialOptions)
        : cleanPrompt;
      const response = isSocialTool(type)
        ? buildLocalSocialPostContent(type, cleanPrompt, socialOptions, activeCompany?.businessName ?? t.general)
        : await sendChatMessageWithGemini(
            [],
            buildPrompt({ company: activeCompany, userPrompt: finalPrompt }),
          );
      const preparedContent = await prepareToolOutput(type, response, activeCompany?.businessName ?? t.general);
      setOutput(preparedContent);

      await saveToolDocument({
        type,
        title: `${t.title} - ${activeCompany?.businessName ?? t.general}`,
        companyId: activeCompany?.id ?? null,
        companyName: activeCompany?.businessName ?? null,
        prompt: cleanPrompt,
        content: preparedContent,
      });

      await loadDocuments();
      toast.showToast(t.generated, t.generatedBody(t.title), "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : t.failedGenerate(t.title);
      toast.showToast(t.generationFailed, message, "error", 4500);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await Clipboard.setStringAsync(text);
      toast.showToast(t.copied, t.copiedBody, "success");
    } catch {
      toast.showToast(t.copyFailed, t.copyFailedBody, "error");
    }
  }

  async function handleDelete(id: string) {
    await deleteToolDocument(id);
    if (expandedDocumentId === id) setExpandedDocumentId(null);
    await loadDocuments();
    toast.showToast(t.deleted, t.deletedBody, "success");
  }

  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          style={styles.keyboardWrap}
        >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={[styles.headerButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <ArrowLeft size={20} color={palette.text} />
            </Pressable>
            <Pressable onPress={() => router.push("/(root)/(tabs)/(dashboard)/my-documents")} style={[styles.headerButton, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Folder size={20} color={palette.text} />
            </Pressable>
          </View>

          <LinearGradient
            colors={palette.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: palette.border }]}
          >
            <View style={styles.badge}>
              <Sparkles size={13} color="#DFAE55" />
              <Text style={[styles.badgeText, { color: palette.text }]}>{t.eyebrow}</Text>
            </View>
            <Text style={[styles.heroTitle, { color: palette.text }]}>{t.title}</Text>
            <Text style={[styles.heroBody, { color: palette.muted }]}>{t.description}</Text>
            <View style={[styles.companyPill, { backgroundColor: palette.chip }]}>
              <Text style={[styles.companyLabel, { color: palette.eyebrow }]}>{t.activeCompany}</Text>
              <Text style={[styles.companyValue, { color: palette.text }]}>{subtitle}</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={palette.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { borderColor: palette.border }]}
          >
            <Text style={[styles.sectionLabel, { color: palette.text }]}>{t.promptLabel}</Text>
            <TextInput
              value={userPrompt}
              onChangeText={setUserPrompt}
              placeholder={t.promptPlaceholder}
              placeholderTextColor={palette.placeholder}
              multiline
              style={[styles.promptInput, { backgroundColor: palette.input, borderColor: palette.border, color: palette.text }]}
            />

            <View style={styles.suggestionWrap}>
              {t.suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => setUserPrompt(suggestion)}
                  style={[styles.suggestionChip, { backgroundColor: palette.chip, borderColor: palette.border }]}
                >
                  <Text style={[styles.suggestionText, { color: palette.text }]}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>

            {isSocialTool(type) ? (
              <SocialPostOptionsEditor
                palette={palette}
                t={t}
                options={socialOptions}
                onChange={setSocialOptions}
              />
            ) : null}

            <Pressable
              onPress={() => void handleGenerate()}
              disabled={isGenerating}
              style={[styles.primaryButton, isGenerating && styles.primaryButtonDisabled]}
            >
              {isGenerating ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <>
                  <Sparkles size={16} color="#0F172A" />
                  <Text style={styles.primaryButtonText}>{t.generateAndSave}</Text>
                </>
              )}
            </Pressable>
          </LinearGradient>

          <LinearGradient
            colors={palette.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { borderColor: palette.border }]}
          >
            <View style={styles.outputHeader}>
              <View>
                <Text style={[styles.sectionLabel, { color: palette.text }]}>{t.latestOutput}</Text>
                <Text style={[styles.outputHint, { color: palette.muted }]}>{t.latestOutputBody}</Text>
              </View>
              {output ? (
                <Pressable onPress={() => void handleCopy(getClipboardText(type, output))} style={styles.smallAction}>
                  <Copy size={14} color="#E5E7EB" />
                  <Text style={[styles.smallActionText, { color: palette.text }]}>{t.copy}</Text>
                </Pressable>
              ) : null}
            </View>

            {isGenerating && isSocialTool(type) ? (
              <SocialPreviewSkeleton type={type} palette={palette} />
            ) : output ? (
              <View style={[styles.outputCard, { backgroundColor: palette.input, borderColor: palette.border }]}>
                <ToolOutputPreview
                  type={type}
                  content={output}
                  companyName={activeCompany?.businessName ?? t.general}
                  palette={palette}
                  wide
                />
              </View>
            ) : (
              <View style={[styles.emptyOutput, { borderColor: palette.border }]}>
                <Text style={[styles.emptyOutputTitle, { color: palette.text }]}>{t.noGeneratedContent}</Text>
                <Text style={[styles.emptyOutputBody, { color: palette.muted }]}>
                  {t.noGeneratedContentBody}
                </Text>
              </View>
            )}
          </LinearGradient>

          <LinearGradient
            colors={palette.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { borderColor: palette.border }]}
          >
            <Text style={[styles.sectionLabel, { color: palette.text }]}>{t.recentSavedDocuments}</Text>
            {isLoadingDocuments ? (
              <ActivityIndicator color="#A78BFA" />
            ) : documents.length === 0 ? (
              <Text style={[styles.outputHint, { color: palette.muted }]}>{t.noSavedDocuments}</Text>
            ) : (
              <View style={styles.documentList}>
                {documents.slice(0, 6).map((document) => {
                  const expanded = expandedDocumentId === document.id;
                  return (
                    <View key={document.id} style={[styles.documentCard, { backgroundColor: palette.chip, borderColor: palette.border }]}>
                      <Pressable
                        onPress={() => setExpandedDocumentId(expanded ? null : document.id)}
                        style={styles.documentHeader}
                      >
                        <View style={styles.documentHeaderText}>
                          <Text style={[styles.documentTitle, { color: palette.text }]}>{document.title}</Text>
                          <Text style={[styles.documentMeta, { color: palette.muted }]}>
                            {new Date(document.updatedAt).toLocaleDateString(t.locale)} - {document.companyName ?? t.general}
                          </Text>
                        </View>
                      </Pressable>

                      {expanded ? (
                        <>
                          <Text style={[styles.documentPrompt, { color: palette.muted }]}>{t.promptPrefix}: {document.prompt}</Text>
                          <ToolOutputPreview
                            type={document.type}
                            content={document.content}
                            companyName={document.companyName ?? t.general}
                            palette={palette}
                            compact
                            wide
                          />
                          <View style={styles.documentActions}>
                            <Pressable
                              onPress={() => void handleCopy(getClipboardText(document.type, document.content))}
                              style={styles.smallAction}
                            >
                              <Copy size={14} color="#E5E7EB" />
                              <Text style={[styles.smallActionText, { color: palette.text }]}>{t.copy}</Text>
                            </Pressable>
                            <Pressable
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
                              style={[styles.smallAction, styles.smallActionDanger]}
                            >
                              <Trash2 size={14} color="#FCA5A5" />
                              <Text style={styles.smallActionDangerText}>{t.delete}</Text>
                            </Pressable>
                          </View>
                        </>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </LinearGradient>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type SocialPostPreviewData = {
  authorName: string;
  handle: string;
  caption: string;
  hashtags: string[];
  cta: string;
  visualPrompt: string;
  altText: string;
  imageUri?: string;
  imageError?: string;
};

type SocialPostOptions = {
  tone: string;
  goal: string;
  visualStyle: string;
  hashtagsMode: string;
};

function isSocialTool(type: ToolDocumentType) {
  return type === "instagram-post" || type === "facebook-post";
}

function extractJsonObject(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

function sanitizeToolText(raw: string) {
  return raw
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```(?:json)?/gi, "").replace(/```/g, ""))
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*---+\s*$/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeHandle(value: string, authorName: string) {
  const fallback = authorName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "business";
  const clean = value.trim().replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "").slice(0, 24);
  return `@${clean || fallback}`;
}

function normalizeHashtags(value: unknown) {
  const source = Array.isArray(value) ? value.join(" ") : String(value ?? "");
  return source
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .slice(0, 10)
    .map((tag) => `#${tag}`);
}

function makeSentence(value: string) {
  const clean = sanitizeToolText(value).replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function titleCaseWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function makeSocialHashtags(prompt: string, companyName: string, mode: string) {
  if (mode === "none") return [];

  const blocked = new Set([
    "the", "and", "for", "with", "from", "this", "that", "your", "you", "our", "about", "post", "make", "create",
    "children", "people", "class", "style", "image", "caption", "facebook", "instagram",
  ]);
  const words = `${companyName} ${prompt}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !blocked.has(word));
  const unique = Array.from(new Set(words)).slice(0, mode === "minimal" ? 3 : 6);
  const defaults = mode === "minimal" ? ["business", "growth"] : ["business", "learning", "growth", "community"];

  return normalizeHashtags([...unique, ...defaults]);
}

function getSocialToneLine(tone: string) {
  if (tone === "luxury") return "premium, refined, trust-building";
  if (tone === "friendly") return "warm, clear, human, and encouraging";
  return "confident, direct, and professional";
}

function getSocialGoalLine(goal: string) {
  if (goal === "sales") return "Invite people to take the next step without sounding pushy.";
  if (goal === "awareness") return "Make the brand feel memorable, useful, and easy to understand.";
  return "Encourage saves, comments, shares, and real conversation.";
}

function getSocialCta(type: ToolDocumentType, goal: string) {
  if (goal === "sales") return type === "instagram-post" ? "DM us to get started." : "Send us a message to learn more.";
  if (goal === "awareness") return "Follow for more practical updates.";
  return type === "instagram-post" ? "Save this and share it with someone who needs it." : "Comment what you want to see next.";
}

function buildLocalSocialPostContent(
  type: ToolDocumentType,
  prompt: string,
  options: SocialPostOptions,
  companyName: string,
) {
  const cleanPrompt = sanitizeToolText(prompt).replace(/\s+/g, " ").trim();
  const brand = sanitizeToolText(companyName || "BizPlan") || "BizPlan";
  const topic = titleCaseWords(cleanPrompt) || (type === "instagram-post" ? "New Update" : "Business Update");
  const platform = type === "instagram-post" ? "Instagram" : "Facebook";
  const caption = [
    `${topic} can be simple when the message is clear.`,
    makeSentence(cleanPrompt),
    getSocialGoalLine(options.goal),
    getSocialCta(type, options.goal),
  ].filter(Boolean).join("\n\n");
  const visualPrompt = [
    cleanPrompt,
    `${platform} post visual for ${brand}`,
    `${options.visualStyle} visual style`,
    getSocialToneLine(options.tone),
    "real people, natural emotion, clean composition, professional lighting",
  ].filter(Boolean).join(", ");

  return JSON.stringify({
    authorName: brand,
    handle: normalizeHandle(brand, brand),
    caption,
    hashtags: makeSocialHashtags(cleanPrompt, brand, options.hashtagsMode),
    cta: getSocialCta(type, options.goal),
    visualPrompt,
    altText: `${platform} visual for ${brand}: ${cleanPrompt}`,
  }, null, 2);
}
function getToolErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const payload = error as { message?: unknown; error?: unknown };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
    if (Array.isArray(payload.message) && payload.message.length) {
      return payload.message.join(" ");
    }
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  }

  return fallback;
}

function parseSocialPostContent(type: ToolDocumentType, content: string, companyName: string): SocialPostPreviewData {
  const json = extractJsonObject(content);

  if (json) {
    try {
      const parsed = JSON.parse(json) as Partial<SocialPostPreviewData>;
      const authorName = sanitizeToolText(parsed.authorName || companyName || "BizPlan");
      const caption = sanitizeToolText(parsed.caption || content);
      return {
        authorName,
        handle: normalizeHandle(parsed.handle || authorName, authorName),
        caption,
        hashtags: normalizeHashtags(parsed.hashtags),
        cta: sanitizeToolText(parsed.cta || (type === "instagram-post" ? "Save this idea for later." : "Message us to learn more.")),
        visualPrompt: sanitizeToolText(parsed.visualPrompt || parsed.altText || "Clean branded business visual with product and lifestyle details."),
        altText: sanitizeToolText(parsed.altText || parsed.visualPrompt || "Brand post visual preview."),
        imageUri: typeof parsed.imageUri === "string" ? parsed.imageUri : undefined,
        imageError: typeof parsed.imageError === "string" ? parsed.imageError : undefined,
      };
    } catch {
      // Fall through to legacy text parsing.
    }
  }

  const clean = sanitizeToolText(content);
  return {
    authorName: companyName || "BizPlan",
    handle: normalizeHandle(companyName || "bizplan", companyName || "BizPlan"),
    caption: clean,
    hashtags: type === "instagram-post" ? ["#business", "#startup", "#growth"] : [],
    cta: type === "instagram-post" ? "Follow for more updates." : "Comment or message us to learn more.",
    visualPrompt: "Clean branded business visual with confident lighting, product context, and modern composition.",
    altText: "Generated post visual preview.",
  };
}

async function prepareToolOutput(type: ToolDocumentType, raw: string, companyName: string) {
  if (isSocialTool(type)) {
    const post = parseSocialPostContent(type, raw, companyName);

    try {
      post.imageUri = await generateImageWithServer(buildServerImagePrompt(type, post));
      post.imageError = undefined;
    } catch (serverError) {
      post.imageUri = undefined;
      post.imageError = getToolErrorMessage(serverError, "Free image generation failed.");
    }

    return JSON.stringify(post, null, 2);
  }

  return sanitizeToolText(raw);
}

function buildServerImagePrompt(type: ToolDocumentType, post: SocialPostPreviewData) {
  const platform = type === "instagram-post" ? "instagram" : "facebook";
  const trimmedCaption = post.caption.replace(/\s+/g, " ").trim().slice(0, 180);

  return [
    `${post.visualPrompt}.`,
    trimmedCaption,
    post.altText,
    `realistic ${platform} post image`,
    "professional photography",
    "natural lighting",
    "no text overlay",
  ]
    .filter(Boolean)
    .join(", ");
}

export function getClipboardText(type: ToolDocumentType, content: string) {
  if (isSocialTool(type)) {
    const post = parseSocialPostContent(type, content, "Business");
    return [
      post.caption,
      post.hashtags.length ? post.hashtags.join(" ") : "",
      post.cta,
      "",
      `Visual brief: ${post.visualPrompt}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return sanitizeToolText(content);
}

function splitOutputSections(content: string) {
  const clean = sanitizeToolText(content);
  const chunks = clean.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);

  if (chunks.length <= 1) {
    return clean
      .split(/\n(?=[A-Z][A-Za-z\s]{3,34}:)/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);
  }

  return chunks;
}

function getSectionParts(section: string, index: number) {
  const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
  const first = lines[0] || `Section ${index + 1}`;
  const headingMatch = first.match(/^([A-Za-z0-9 ,/&()+-]{3,60}):\s*(.*)$/);

  if (headingMatch) {
    return {
      title: headingMatch[1],
      body: [headingMatch[2], ...lines.slice(1)].filter(Boolean).join("\n"),
    };
  }

  if (lines.length > 1 && first.length <= 64 && !first.endsWith(".")) {
    return {
      title: first,
      body: lines.slice(1).join("\n"),
    };
  }

  return {
    title: `Part ${index + 1}`,
    body: lines.join("\n"),
  };
}

export function ToolOutputPreview({
  type,
  content,
  companyName,
  palette,
  compact = false,
  wide = false,
}: {
  type: ToolDocumentType;
  content: string;
  companyName: string;
  palette: ReturnType<typeof getToolPalette>;
  compact?: boolean;
  wide?: boolean;
}) {
  if (type === "instagram-post") {
    return (
      <InstagramPostPreview
        post={parseSocialPostContent(type, content, companyName)}
        palette={palette}
        compact={compact}
        wide={wide}
      />
    );
  }

  if (type === "facebook-post") {
    return (
      <FacebookPostPreview
        post={parseSocialPostContent(type, content, companyName)}
        palette={palette}
        compact={compact}
        wide={wide}
      />
    );
  }

  return <FormattedToolOutput content={content} palette={palette} compact={compact} />;
}

function VisualPreview({
  post,
  palette,
  square,
}: {
  post: SocialPostPreviewData;
  palette: ReturnType<typeof getToolPalette>;
  square?: boolean;
}) {
  const imageUri = post.imageUri;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [post.imageUri]);

  function handleImageError() {
    setImageFailed(true);
  }

  return (
    <LinearGradient
      colors={palette.visualGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.visualPreview, imageUri && !imageFailed && styles.visualPreviewWithImage, square && styles.visualPreviewSquare, { borderColor: palette.border }]}
    >
      {imageUri && !imageFailed ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.generatedPostImage}
          resizeMode="cover"
          onError={handleImageError}
        />
      ) : (
        <>
          <View style={styles.visualOrbLarge} />
          <View style={styles.visualOrbSmall} />
          <Text style={styles.visualBrand} numberOfLines={1}>{post.authorName}</Text>
          <Text style={styles.visualBrief} numberOfLines={4}>{post.visualPrompt}</Text>
          {post.imageError ? (
            <Text style={styles.visualError} numberOfLines={2}>{post.imageError}</Text>
          ) : null}
        </>
      )}
    </LinearGradient>
  );
}

function InstagramPostPreview({
  post,
  palette,
  compact,
  wide,
}: {
  post: SocialPostPreviewData;
  palette: ReturnType<typeof getToolPalette>;
  compact?: boolean;
  wide?: boolean;
}) {
  return (
    <View
      style={[
        styles.socialPostCard,
        wide && styles.socialPostCardWide,
        { backgroundColor: palette.socialCard, borderColor: palette.border },
      ]}
    >
      <View style={styles.socialHeader}>
        <LinearGradient colors={["#F97316", "#DB2777", "#7C3AED"]} style={styles.instagramAvatar}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitial}>{post.authorName.slice(0, 1).toUpperCase()}</Text>
          </View>
        </LinearGradient>
        <View style={styles.socialIdentity}>
          <Text style={[styles.socialName, { color: palette.text }]} numberOfLines={1}>{post.authorName}</Text>
          <Text style={[styles.socialHandle, { color: palette.muted }]} numberOfLines={1}>{post.handle}</Text>
        </View>
        <MoreHorizontal size={20} color={palette.text} />
      </View>

      <VisualPreview post={post} palette={palette} square />

      <View style={styles.instagramActions}>
        <View style={styles.socialActionGroup}>
          <Heart size={21} color={palette.text} />
          <MessageCircle size={21} color={palette.text} />
          <Send size={21} color={palette.text} />
        </View>
        <Bookmark size={21} color={palette.text} />
      </View>
      <Text style={[styles.likesText, { color: palette.text }]}>1,248 likes</Text>
      <Text style={[styles.captionText, { color: palette.text }]} numberOfLines={compact ? 5 : undefined}>
        <Text style={styles.captionAuthor}>{post.handle.replace("@", "")} </Text>
        {post.caption}
      </Text>
      {post.hashtags.length ? (
        <Text style={[styles.hashtagText, { color: palette.platformBlue }]} numberOfLines={compact ? 2 : undefined}>
          {post.hashtags.join(" ")}
        </Text>
      ) : null}
      <Text style={[styles.socialCta, { color: palette.muted }]}>{post.cta}</Text>
    </View>
  );
}

function FacebookPostPreview({
  post,
  palette,
  compact,
  wide,
}: {
  post: SocialPostPreviewData;
  palette: ReturnType<typeof getToolPalette>;
  compact?: boolean;
  wide?: boolean;
}) {
  return (
    <View
      style={[
        styles.socialPostCard,
        wide && styles.socialPostCardWide,
        { backgroundColor: palette.socialCard, borderColor: palette.border },
      ]}
    >
      <View style={styles.socialHeader}>
        <View style={[styles.facebookAvatar, { backgroundColor: palette.platformBlue }]}>
          <Text style={styles.avatarInitial}>{post.authorName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.socialIdentity}>
          <Text style={[styles.socialName, { color: palette.text }]} numberOfLines={1}>{post.authorName}</Text>
          <Text style={[styles.socialHandle, { color: palette.muted }]}>Sponsored · Public</Text>
        </View>
        <MoreHorizontal size={20} color={palette.text} />
      </View>

      <Text style={[styles.facebookCaption, { color: palette.text }]} numberOfLines={compact ? 6 : undefined}>
        {post.caption}
      </Text>
      {post.hashtags.length ? (
        <Text style={[styles.hashtagText, { color: palette.platformBlue }]} numberOfLines={compact ? 2 : undefined}>
          {post.hashtags.join(" ")}
        </Text>
      ) : null}
      <VisualPreview post={post} palette={palette} />

      <View style={styles.facebookStats}>
        <View style={styles.reactionStack}>
          <View style={[styles.reactionBubble, { backgroundColor: palette.platformBlue }]}>
            <ThumbsUp size={10} color="#FFFFFF" />
          </View>
          <View style={[styles.reactionBubble, { backgroundColor: "#EF4444" }]}>
            <Heart size={10} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
        <Text style={[styles.facebookStatText, { color: palette.muted }]}>342 reactions · 48 comments · 19 shares</Text>
      </View>

      <View style={[styles.facebookActions, { borderTopColor: palette.border }]}>
        <View style={styles.facebookAction}>
          <ThumbsUp size={17} color={palette.muted} />
          <Text style={[styles.facebookActionText, { color: palette.muted }]}>Like</Text>
        </View>
        <View style={styles.facebookAction}>
          <MessageCircle size={17} color={palette.muted} />
          <Text style={[styles.facebookActionText, { color: palette.muted }]}>Comment</Text>
        </View>
        <View style={styles.facebookAction}>
          <Share2 size={17} color={palette.muted} />
          <Text style={[styles.facebookActionText, { color: palette.muted }]}>Share</Text>
        </View>
      </View>
      <Text style={[styles.socialCta, { color: palette.muted }]}>{post.cta}</Text>
    </View>
  );
}

function FormattedToolOutput({
  content,
  palette,
  compact,
}: {
  content: string;
  palette: ReturnType<typeof getToolPalette>;
  compact?: boolean;
}) {
  const sections = splitOutputSections(content).slice(0, compact ? 4 : 10);

  return (
    <View style={styles.formattedOutput}>
      {sections.map((section, index) => {
        const { title, body } = getSectionParts(section, index);
        return (
          <View key={`${title}-${index}`} style={[styles.outputSectionCard, { backgroundColor: palette.socialSurface, borderColor: palette.border }]}>
            <Text style={[styles.outputSectionIndex, { color: palette.platformBlue }]}>{String(index + 1).padStart(2, "0")}</Text>
            <Text style={[styles.outputSectionTitle, { color: palette.text }]}>{title}</Text>
            <Text style={[styles.outputSectionBody, { color: palette.muted }]} numberOfLines={compact ? 8 : undefined}>
              {body || section}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SocialPreviewSkeleton({
  type,
  palette,
}: {
  type: ToolDocumentType;
  palette: ReturnType<typeof getToolPalette>;
}) {
  if (type === "facebook-post") {
    return (
      <View style={[styles.outputCard, styles.skeletonCardShell, { backgroundColor: palette.input, borderColor: palette.border }]}>
        <View style={[styles.socialPostCard, styles.socialPostCardWide, { backgroundColor: palette.socialCard, borderColor: palette.border }]}>
          <View style={styles.socialHeader}>
            <View style={[styles.skeletonCircle, { backgroundColor: palette.skeletonSoft }]} />
            <View style={styles.socialIdentity}>
              <View style={[styles.skeletonLineShort, { backgroundColor: palette.skeleton }]} />
              <View style={[styles.skeletonLineTiny, { backgroundColor: palette.skeletonSoft }]} />
            </View>
            <View style={[styles.skeletonDot, { backgroundColor: palette.skeletonSoft }]} />
          </View>

          <View style={styles.skeletonBodyWrapWide}>
            <View style={[styles.skeletonLineFull, { backgroundColor: palette.skeleton }]} />
            <View style={[styles.skeletonLineMedium, { backgroundColor: palette.skeletonSoft }]} />
            <View style={[styles.skeletonLineMediumShort, { backgroundColor: palette.skeletonSoft }]} />
          </View>

          <View style={[styles.visualPreview, { borderColor: palette.border, backgroundColor: palette.socialSurface }]}>
            <View style={[styles.skeletonGlow, { backgroundColor: palette.skeletonGlow }]} />
            <View style={[styles.skeletonLineLarge, { backgroundColor: palette.skeleton }]} />
            <View style={[styles.skeletonLineMedium, { backgroundColor: palette.skeletonSoft }]} />
          </View>

          <View style={styles.facebookStats}>
            <View style={styles.reactionStack}>
              <View style={[styles.skeletonReactionBubble, { backgroundColor: palette.skeleton }]} />
              <View style={[styles.skeletonReactionBubble, styles.skeletonReactionBubbleOverlap, { backgroundColor: palette.skeletonSoft }]} />
            </View>
            <View style={[styles.skeletonLineMedium, styles.skeletonStatLine, { backgroundColor: palette.skeletonSoft }]} />
          </View>

          <View style={[styles.facebookActions, { borderTopColor: palette.border }]}>
            <View style={styles.facebookAction}>
              <View style={[styles.skeletonIcon, { backgroundColor: palette.skeleton }]} />
              <View style={[styles.skeletonButtonText, { backgroundColor: palette.skeletonSoft }]} />
            </View>
            <View style={styles.facebookAction}>
              <View style={[styles.skeletonIcon, { backgroundColor: palette.skeleton }]} />
              <View style={[styles.skeletonButtonText, { backgroundColor: palette.skeletonSoft }]} />
            </View>
            <View style={styles.facebookAction}>
              <View style={[styles.skeletonIcon, { backgroundColor: palette.skeleton }]} />
              <View style={[styles.skeletonButtonText, { backgroundColor: palette.skeletonSoft }]} />
            </View>
          </View>

          <View style={styles.skeletonCtaWrap}>
            <View style={[styles.skeletonLineMedium, styles.skeletonCtaLine, { backgroundColor: palette.skeletonSoft }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.outputCard, styles.skeletonCardShell, { backgroundColor: palette.input, borderColor: palette.border }]}>
      <View style={[styles.socialPostCard, styles.socialPostCardWide, { backgroundColor: palette.socialCard, borderColor: palette.border }]}>
        <View style={styles.socialHeader}>
          <View style={[styles.skeletonCircle, { backgroundColor: palette.skeletonSoft }]} />
          <View style={styles.socialIdentity}>
            <View style={[styles.skeletonLineShort, { backgroundColor: palette.skeleton }]} />
            <View style={[styles.skeletonLineTiny, { backgroundColor: palette.skeletonSoft }]} />
          </View>
          <View style={[styles.skeletonDot, { backgroundColor: palette.skeletonSoft }]} />
        </View>
        <View style={[styles.visualPreview, styles.visualPreviewSquare, { borderColor: palette.border, backgroundColor: palette.socialSurface }]}>
          <View style={[styles.skeletonGlow, { backgroundColor: palette.skeletonGlow }]} />
          <View style={[styles.skeletonLineLarge, { backgroundColor: palette.skeleton }]} />
          <View style={[styles.skeletonLineMedium, { backgroundColor: palette.skeletonSoft }]} />
        </View>
        <View style={styles.instagramActions}>
          <View style={styles.socialActionGroup}>
            <View style={[styles.skeletonIcon, { backgroundColor: palette.skeleton }]} />
            <View style={[styles.skeletonIcon, { backgroundColor: palette.skeleton }]} />
            <View style={[styles.skeletonIcon, { backgroundColor: palette.skeleton }]} />
          </View>
          <View style={[styles.skeletonIcon, { backgroundColor: palette.skeletonSoft }]} />
        </View>
        <View style={styles.skeletonBodyWrap}>
          <View style={[styles.skeletonLineShort, { backgroundColor: palette.skeleton }]} />
          <View style={[styles.skeletonLineFull, { backgroundColor: palette.skeletonSoft }]} />
          <View style={[styles.skeletonLineMedium, { backgroundColor: palette.skeletonSoft }]} />
          <View style={[styles.skeletonLineMediumShort, { backgroundColor: palette.skeletonSoft }]} />
          <View style={[styles.skeletonCtaLine, { backgroundColor: palette.skeletonSoft }]} />
        </View>
      </View>
    </View>
  );
}

function buildCustomizedSocialPrompt(userPrompt: string, options: SocialPostOptions) {
  return [
    userPrompt,
    "",
    "Customization preferences:",
    `- Tone: ${options.tone}`,
    `- Goal: ${options.goal}`,
    `- Visual style: ${options.visualStyle}`,
    `- Hashtags: ${options.hashtagsMode}`,
  ].join("\n");
}

function SocialPostOptionsEditor({
  palette,
  t,
  options,
  onChange,
}: {
  palette: ReturnType<typeof getToolPalette>;
  t: ReturnType<typeof getToolWorkspaceCopy>;
  options: SocialPostOptions;
  onChange: React.Dispatch<React.SetStateAction<SocialPostOptions>>;
}) {
  return (
    <View style={styles.optionsPanel}>
      <Text style={[styles.optionHeading, { color: palette.text }]}>{t.customizePost}</Text>
      <OptionRow
        label={t.tone}
        values={[
          { key: "confident", label: t.confident },
          { key: "friendly", label: t.friendly },
          { key: "luxury", label: t.luxury },
        ]}
        selected={options.tone}
        onSelect={(value) => onChange((current) => ({ ...current, tone: value }))}
        palette={palette}
      />
      <OptionRow
        label={t.goal}
        values={[
          { key: "engagement", label: t.engagement },
          { key: "sales", label: t.sales },
          { key: "awareness", label: t.awareness },
        ]}
        selected={options.goal}
        onSelect={(value) => onChange((current) => ({ ...current, goal: value }))}
        palette={palette}
      />
      <OptionRow
        label={t.visualStyle}
        values={[
          { key: "premium", label: t.premium },
          { key: "minimal", label: t.minimal },
          { key: "bold", label: t.bold },
        ]}
        selected={options.visualStyle}
        onSelect={(value) => onChange((current) => ({ ...current, visualStyle: value }))}
        palette={palette}
      />
      <OptionRow
        label={t.hashtags}
        values={[
          { key: "none", label: t.none },
          { key: "minimal", label: t.minimal },
          { key: "balanced", label: t.balanced },
        ]}
        selected={options.hashtagsMode}
        onSelect={(value) => onChange((current) => ({ ...current, hashtagsMode: value }))}
        palette={palette}
      />
    </View>
  );
}

function OptionRow({
  label,
  values,
  selected,
  onSelect,
  palette,
}: {
  label: string;
  values: Array<{ key: string; label: string }>;
  selected: string;
  onSelect: (value: string) => void;
  palette: ReturnType<typeof getToolPalette>;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={[styles.optionLabel, { color: palette.muted }]}>{label}</Text>
      <View style={styles.optionChipRow}>
        {values.map((value) => {
          const active = selected === value.key;
          return (
            <Pressable
              key={value.key}
              onPress={() => onSelect(value.key)}
              style={[
                styles.optionChip,
                {
                  backgroundColor: active ? palette.platformBlue : palette.chip,
                  borderColor: active ? palette.platformBlue : palette.border,
                },
              ]}
            >
              <Text style={[styles.optionChipText, { color: active ? "#FFFFFF" : palette.text }]}>{value.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function getToolPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#090B14", "#111827", "#183B35"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    heroGradient: isDark
      ? (["rgba(77,47,178,0.96)", "rgba(24,59,53,0.92)", "rgba(9,11,20,0.94)"] as const)
      : (["#FFFFFF", "#F4FBFF", "#EEF7FF"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "#CBD5E1" : "#475569",
    eyebrow: isDark ? "rgba(229,231,235,0.65)" : "#64748B",
    card: isDark ? "rgba(15,23,42,0.84)" : "rgba(255,255,255,0.88)",
    cardGradient: isDark
      ? (["rgba(15,23,42,0.86)", "rgba(18,49,46,0.72)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(240,253,250,0.94)", "rgba(239,246,255,0.94)"] as const),
    input: isDark ? "rgba(2,6,23,0.65)" : "rgba(255,255,255,0.94)",
    chip: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)",
    placeholder: isDark ? "#64748B" : "#718096",
    socialCard: isDark ? "rgba(2,6,23,0.72)" : "rgba(255,255,255,0.98)",
    socialSurface: isDark ? "rgba(255,255,255,0.05)" : "rgba(248,250,252,0.92)",
    skeleton: isDark ? "rgba(226,232,240,0.16)" : "rgba(148,163,184,0.22)",
    skeletonSoft: isDark ? "rgba(226,232,240,0.10)" : "rgba(148,163,184,0.14)",
    skeletonGlow: isDark ? "rgba(223,174,85,0.14)" : "rgba(59,130,246,0.10)",
    platformBlue: isDark ? "#93C5FD" : "#2563EB",
    visualGradient: isDark
      ? (["rgba(77,47,178,0.96)", "rgba(24,59,53,0.92)", "rgba(223,174,85,0.62)"] as const)
      : (["rgba(238,232,255,0.98)", "rgba(209,250,229,0.96)", "rgba(254,243,199,0.92)"] as const),
  };
}

function getToolWorkspaceCopy(
  language: "en" | "ru" | "hy",
  type: ToolDocumentType,
  fallback: {
    eyebrow: string;
    title: string;
    description: string;
    promptLabel: string;
    promptPlaceholder: string;
    suggestions: string[];
  },
) {
  const shared = {
    locale: language === "ru" ? "ru-RU" : language === "hy" ? "hy-AM" : "en-US",
  };

  const toolCopies = {
    en: {
      "marketing-strategy": {
        title: "Marketing strategy",
        description: "Build a practical channel, campaign, and growth plan for your active company.",
        promptLabel: "Strategy instructions",
        promptPlaceholder: "Tell AI what market, audience, offer, or campaign you want to plan...",
        suggestions: ["Launch plan for the next 30 days", "Low-budget growth channels", "Positioning and messaging angles"],
      },
      "facebook-post": {
        title: "Facebook post",
        description: "Create social copy with hooks, CTA, audience angle, and campaign notes.",
        promptLabel: "Post instructions",
        promptPlaceholder: "Describe the post goal, audience, tone, and offer...",
        suggestions: ["Write a launch announcement", "Create a promotion post", "Make an educational post"],
      },
      "instagram-post": {
        title: "Instagram post",
        description: "Generate captions, visual direction, hashtags, and short-form campaign ideas.",
        promptLabel: "Instagram instructions",
        promptPlaceholder: "Describe the visual, caption style, audience, and goal...",
        suggestions: ["Caption with visual direction", "Carousel post idea", "Reel script with hashtags"],
      },
      "product-sales-sheet": {
        title: "Product sales sheet",
        description: "Write sales-ready one-pagers and product positioning documents.",
        promptLabel: "Sales sheet instructions",
        promptPlaceholder: "Describe the product, buyer, objections, and proof points...",
        suggestions: ["One-page sales sheet", "Objection handling section", "Buyer-focused benefits"],
      },
      "sales-follow-up-email": {
        title: "Sales follow-up email",
        description: "Prepare polished follow-up drafts and email sequences.",
        promptLabel: "Email instructions",
        promptPlaceholder: "Describe the lead, last conversation, offer, and desired next step...",
        suggestions: ["Friendly first follow-up", "Second follow-up after no reply", "Meeting recap email"],
      },
    },
    ru: {
      "marketing-strategy": {
        title: "Маркетинговая стратегия",
        description: "Создайте практичный план каналов, кампаний и роста для активной компании.",
        promptLabel: "Инструкции для стратегии",
        promptPlaceholder: "Опишите рынок, аудиторию, оффер или кампанию...",
        suggestions: ["План запуска на 30 дней", "Рост с малым бюджетом", "Позиционирование и сообщения"],
      },
      "facebook-post": {
        title: "Пост Facebook",
        description: "Создайте текст для соцсетей с hook, CTA, аудиторией и заметками кампании.",
        promptLabel: "Инструкции для поста",
        promptPlaceholder: "Опишите цель, аудиторию, тон и оффер...",
        suggestions: ["Анонс запуска", "Промо-пост", "Образовательный пост"],
      },
      "instagram-post": {
        title: "Пост Instagram",
        description: "Сгенерируйте caption, визуальное направление, hashtags и идеи кампании.",
        promptLabel: "Инструкции Instagram",
        promptPlaceholder: "Опишите визуал, стиль caption, аудиторию и цель...",
        suggestions: ["Caption с визуальным направлением", "Идея carousel", "Reel script с hashtags"],
      },
      "product-sales-sheet": {
        title: "Sales sheet продукта",
        description: "Создайте sales one-pager и позиционирование продукта.",
        promptLabel: "Инструкции sales sheet",
        promptPlaceholder: "Опишите продукт, покупателя, возражения и proof points...",
        suggestions: ["Sales sheet на одну страницу", "Блок работы с возражениями", "Преимущества для покупателя"],
      },
      "sales-follow-up-email": {
        title: "Follow-up email",
        description: "Подготовьте polished follow-up drafts и email sequences.",
        promptLabel: "Инструкции для email",
        promptPlaceholder: "Опишите лида, прошлый разговор, оффер и следующий шаг...",
        suggestions: ["Первый дружелюбный follow-up", "Второй follow-up без ответа", "Email после встречи"],
      },
    },
    hy: {
      "marketing-strategy": {
        title: "Մարքեթինգ ռազմավարություն",
        description: "Ստեղծեք գործնական channel, campaign և growth պլան ակտիվ ընկերության համար։",
        promptLabel: "Ռազմավարության հրահանգներ",
        promptPlaceholder: "Նկարագրեք շուկան, լսարանը, առաջարկը կամ campaign-ը...",
        suggestions: ["30 օրվա launch plan", "Ցածր բյուջեով growth channels", "Positioning և messaging angles"],
      },
      "facebook-post": {
        title: "Facebook post",
        description: "Ստեղծեք social copy՝ hooks, CTA, audience angle և campaign notes-ով։",
        promptLabel: "Post-ի հրահանգներ",
        promptPlaceholder: "Նկարագրեք post-ի նպատակը, լսարանը, տոնը և առաջարկը...",
        suggestions: ["Launch announcement", "Promotion post", "Educational post"],
      },
      "instagram-post": {
        title: "Instagram post",
        description: "Գեներացրեք captions, visual direction, hashtags և campaign ideas։",
        promptLabel: "Instagram հրահանգներ",
        promptPlaceholder: "Նկարագրեք visual-ը, caption style-ը, լսարանը և նպատակը...",
        suggestions: ["Caption visual direction-ով", "Carousel post idea", "Reel script hashtags-ով"],
      },
      "product-sales-sheet": {
        title: "Product sales sheet",
        description: "Ստեղծեք sales-ready one-pagers և product positioning docs։",
        promptLabel: "Sales sheet հրահանգներ",
        promptPlaceholder: "Նկարագրեք product-ը, buyer-ը, objections-ը և proof points-ը...",
        suggestions: ["One-page sales sheet", "Objection handling section", "Buyer-focused benefits"],
      },
      "sales-follow-up-email": {
        title: "Follow-up email",
        description: "Պատրաստեք polished follow-up drafts և email sequences։",
        promptLabel: "Email հրահանգներ",
        promptPlaceholder: "Նկարագրեք lead-ը, վերջին խոսակցությունը, offer-ը և հաջորդ քայլը...",
        suggestions: ["Friendly first follow-up", "Second follow-up no reply-ից հետո", "Meeting recap email"],
      },
    },
  } as const;

  const langCopy = toolCopies[language]?.[type] ?? toolCopies.en[type];
  const sharedCopy = language === "ru"
    ? {
        eyebrow: "Инструмент панели",
        activeCompany: "Активная компания",
        noActiveCompany: "Активная компания не выбрана",
        generateAndSave: "Сгенерировать и сохранить",
        latestOutput: "Последний результат",
        latestOutputBody: "Новый результат остается здесь для быстрого редактирования и копирования.",
        copy: "Копировать",
        copied: "Скопировано",
        copiedBody: "Документ скопирован.",
        copyFailed: "Не удалось скопировать",
        copyFailedBody: "Документ не удалось скопировать.",
        noGeneratedContent: "Контент пока не создан",
        noGeneratedContentBody: "Используйте prompt выше, чтобы создать первый сохраненный документ.",
        recentSavedDocuments: "Недавние документы",
        noSavedDocuments: "Для этого инструмента и компании пока нет сохраненных документов.",
        promptPrefix: "Prompt",
        deleteDocument: "Удалить документ",
        deleteDocumentBody: "Этот сохраненный результат будет удален.",
        delete: "Удалить",
        cancel: "Отмена",
        promptRequired: "Нужен prompt",
        addInstructions: "Добавьте инструкции перед генерацией.",
        missingGeminiKey: "Нет Gemini key",
        addGeminiKey: "Добавьте EXPO_PUBLIC_GOOGLEAI_API_KEY, чтобы использовать инструмент.",
        generated: "Сгенерировано",
        generatedBody: (name: string) => `${name} готов и сохранен.`,
        generationFailed: "Генерация не удалась",
        failedGenerate: (name: string) => `Не удалось сгенерировать ${name}.`,
        deleted: "Удалено",
        deletedBody: "Сохраненный документ удален.",
        general: "Общее",
        customizePost: "Настройки поста",
        tone: "Тон",
        goal: "Цель",
        visualStyle: "Визуал",
        hashtags: "Хэштеги",
        confident: "Уверенный",
        friendly: "Дружелюбный",
        luxury: "Премиум",
        engagement: "Вовлечение",
        sales: "Продажи",
        awareness: "Охват",
        premium: "Премиум",
        minimal: "Минимализм",
        bold: "Смело",
        none: "Нет",
        balanced: "Баланс",
      }
    : language === "hy"
      ? {
          eyebrow: "Dashboard գործիք",
          activeCompany: "Ակտիվ ընկերություն",
          noActiveCompany: "Ակտիվ ընկերություն ընտրված չէ",
          generateAndSave: "Գեներացնել և պահել",
          latestOutput: "Վերջին արդյունք",
          latestOutputBody: "Նոր արդյունքը մնում է այստեղ՝ արագ խմբագրելու և պատճենելու համար։",
          copy: "Պատճենել",
          copied: "Պատճենված է",
          copiedBody: "Փաստաթուղթը պատճենվեց։",
          copyFailed: "Չհաջողվեց պատճենել",
          copyFailedBody: "Չհաջողվեց պատճենել փաստաթուղթը։",
          noGeneratedContent: "Ստեղծված կոնտենտ դեռ չկա",
          noGeneratedContentBody: "Օգտագործեք վերևի prompt-ը՝ առաջին պահպանված փաստաթուղթը ստեղծելու համար։",
          recentSavedDocuments: "Վերջին պահպանված փաստաթղթեր",
          noSavedDocuments: "Այս գործիքի և ընկերության համար պահպանված փաստաթուղթ դեռ չկա։",
          promptPrefix: "Prompt",
          deleteDocument: "Ջնջել փաստաթուղթը",
          deleteDocumentBody: "Այս պահպանված արդյունքը կհեռացվի։",
          delete: "Ջնջել",
          cancel: "Չեղարկել",
          promptRequired: "Prompt-ը պարտադիր է",
          addInstructions: "Գեներացնելուց առաջ ավելացրեք հրահանգներ։",
          missingGeminiKey: "Gemini key չկա",
          addGeminiKey: "Ավելացրեք EXPO_PUBLIC_GOOGLEAI_API_KEY՝ գործիքը օգտագործելու համար։",
          generated: "Գեներացված է",
          generatedBody: (name: string) => `${name}-ը պատրաստ է և պահված։`,
          generationFailed: "Գեներացիան ձախողվեց",
          failedGenerate: (name: string) => `Չհաջողվեց գեներացնել ${name}-ը։`,
          deleted: "Ջնջված է",
          deletedBody: "Պահպանված փաստաթուղթը հեռացվեց։",
          general: "Ընդհանուր",
          customizePost: "Post-ի կարգավորումներ",
          tone: "Տոն",
          goal: "Նպատակ",
          visualStyle: "Վիզուալ",
          hashtags: "Hashtags",
          confident: "Վստահ",
          friendly: "Բարեկամական",
          luxury: "Պրեմիում",
          engagement: "Ներգրավվածություն",
          sales: "Վաճառք",
          awareness: "Ճանաչելիություն",
          premium: "Պրեմիում",
          minimal: "Մինիմալ",
          bold: "Համարձակ",
          none: "Չկա",
          balanced: "Բալանս",
        }
      : {
          eyebrow: "Dashboard tool",
          activeCompany: "Active company",
          noActiveCompany: "No active company selected",
          generateAndSave: "Generate and save",
          latestOutput: "Latest output",
          latestOutputBody: "The newest result stays here for quick editing and copy.",
          copy: "Copy",
          copied: "Copied",
          copiedBody: "Document copied to clipboard.",
          copyFailed: "Copy failed",
          copyFailedBody: "Could not copy the document.",
          noGeneratedContent: "No generated content yet",
          noGeneratedContentBody: "Use the prompt above to generate your first saved document for this tool.",
          recentSavedDocuments: "Recent saved documents",
          noSavedDocuments: "No saved documents for this tool and company yet.",
          promptPrefix: "Prompt",
          deleteDocument: "Delete document",
          deleteDocumentBody: "This saved tool output will be removed.",
          delete: "Delete",
          cancel: "Cancel",
          promptRequired: "Prompt required",
          addInstructions: "Add instructions before generating.",
          missingGeminiKey: "Missing Gemini key",
          addGeminiKey: "Add EXPO_PUBLIC_GOOGLEAI_API_KEY to use this tool.",
          generated: "Generated",
          generatedBody: (name: string) => `${name} is ready and saved.`,
          generationFailed: "Generation failed",
          failedGenerate: (name: string) => `Failed to generate ${name}.`,
          deleted: "Deleted",
          deletedBody: "Saved document removed.",
          general: "General",
          customizePost: "Customize post",
          tone: "Tone",
          goal: "Goal",
          visualStyle: "Visual style",
          hashtags: "Hashtags",
          confident: "Confident",
          friendly: "Friendly",
          luxury: "Luxury",
          engagement: "Engagement",
          sales: "Sales",
          awareness: "Awareness",
          premium: "Premium",
          minimal: "Minimal",
          bold: "Bold",
          none: "None",
          balanced: "Balanced",
        };

  return {
    ...shared,
    ...sharedCopy,
    eyebrow: sharedCopy.eyebrow || fallback.eyebrow,
    title: langCopy?.title ?? fallback.title,
    description: langCopy?.description ?? fallback.description,
    promptLabel: langCopy?.promptLabel ?? fallback.promptLabel,
    promptPlaceholder: langCopy?.promptPlaceholder ?? fallback.promptPlaceholder,
    suggestions: [...(langCopy?.suggestions ?? fallback.suggestions)],
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
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
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(9,11,20,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    color: "#E5E7EB",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
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
  companyPill: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 12,
    gap: 4,
  },
  companyLabel: {
    color: "rgba(229,231,235,0.65)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
  },
  companyValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.84)",
    padding: 18,
    gap: 14,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  promptInput: {
    minHeight: 140,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(2,6,23,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  suggestionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "600",
  },
  optionsPanel: {
    gap: 12,
    marginTop: 2,
  },
  optionHeading: {
    fontSize: 14,
    fontWeight: "800",
  },
  optionRow: {
    gap: 8,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  optionChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  primaryButton: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  outputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  outputHint: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
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
  outputCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(2,6,23,0.48)",
    padding: 14,
  },
  skeletonCardShell: {
    overflow: "hidden",
  },
  outputText: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 22,
  },
  socialPostCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  socialPostCardWide: {
    marginHorizontal: -14,
  },
  skeletonCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  skeletonDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  skeletonGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -28,
    right: -24,
  },
  skeletonLineLarge: {
    height: 18,
    width: "58%",
    borderRadius: 999,
  },
  skeletonLineFull: {
    height: 12,
    width: "100%",
    borderRadius: 999,
  },
  skeletonLineMedium: {
    height: 12,
    width: "72%",
    borderRadius: 999,
    marginTop: 8,
  },
  skeletonLineMediumShort: {
    height: 12,
    width: "56%",
    borderRadius: 999,
    marginTop: 8,
  },
  skeletonLineShort: {
    height: 12,
    width: "42%",
    borderRadius: 999,
  },
  skeletonLineTiny: {
    height: 10,
    width: "28%",
    borderRadius: 999,
    marginTop: 8,
  },
  skeletonIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  skeletonReactionBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  skeletonReactionBubbleOverlap: {
    marginLeft: -4,
  },
  skeletonButtonText: {
    width: 48,
    height: 10,
    borderRadius: 999,
  },
  skeletonBodyWrap: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
  },
  skeletonBodyWrapWide: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },
  skeletonStatLine: {
    marginTop: 0,
    width: "60%",
  },
  skeletonCtaWrap: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  skeletonCtaLine: {
    height: 11,
    width: "48%",
    borderRadius: 999,
    marginTop: 10,
  },
  socialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  socialIdentity: {
    flex: 1,
    gap: 2,
  },
  socialName: {
    fontSize: 14,
    fontWeight: "800",
  },
  socialHandle: {
    fontSize: 12,
    fontWeight: "600",
  },
  instagramAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
  },
  facebookAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  visualPreview: {
    minHeight: 178,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: "hidden",
    padding: 16,
    justifyContent: "flex-end",
  },
  visualPreviewSquare: {
    aspectRatio: 1,
    minHeight: undefined,
  },
  visualPreviewWithImage: {
    padding: 0,
  },
  generatedPostImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  visualOrbLarge: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.20)",
    top: -38,
    right: -34,
  },
  visualOrbSmall: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(15,23,42,0.12)",
    bottom: 20,
    left: 18,
  },
  visualBrand: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    textShadowColor: "rgba(15,23,42,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  visualBrief: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 8,
    maxWidth: "86%",
    textShadowColor: "rgba(15,23,42,0.28)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  visualError: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    marginTop: 8,
    maxWidth: "88%",
  },
  instagramActions: {
    paddingHorizontal: 14,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  socialActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  likesText: {
    paddingHorizontal: 14,
    marginTop: 10,
    fontSize: 13,
    fontWeight: "800",
  },
  captionText: {
    paddingHorizontal: 14,
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
  },
  captionAuthor: {
    fontWeight: "900",
  },
  hashtagText: {
    paddingHorizontal: 14,
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  socialCta: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  facebookCaption: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    fontSize: 14,
    lineHeight: 21,
  },
  facebookStats: {
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reactionStack: {
    flexDirection: "row",
  },
  reactionBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -4,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  facebookStatText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  facebookActions: {
    borderTopWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  facebookAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  facebookActionText: {
    fontSize: 12,
    fontWeight: "800",
  },
  formattedOutput: {
    gap: 10,
  },
  outputSectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  outputSectionIndex: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  outputSectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    marginBottom: 7,
  },
  outputSectionBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyOutput: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
    gap: 6,
  },
  emptyOutputTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyOutputBody: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  documentList: {
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
  },
  documentHeaderText: {
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
  documentPrompt: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
  },
  documentContent: {
    color: "#F8FAFC",
    fontSize: 13,
    lineHeight: 21,
  },
  documentActions: {
    flexDirection: "row",
    gap: 8,
  },
});






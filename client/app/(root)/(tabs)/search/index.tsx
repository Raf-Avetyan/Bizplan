import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ExternalLink,
  Globe2,
  Newspaper,
  RefreshCw,
  Search as SearchIcon,
  Sparkles,
} from "lucide-react-native";
import { router } from "expo-router";
import { useActiveCompany, useSearchCompanies, useSetActiveCompany } from "@/hooks/useCompanyQueries";
import { searchWebWithGemini, type WebSearchResult } from "@/lib/gemini";
import { Company } from "@/types/company.types";
import { useToast } from "@/components/ui/Toast/Toast";
import { useSettings } from "@/lib/settings-context";
import { accountDataService } from "@/services/account-data.service";

const COMPANY_NEWS_CACHE_TTL_MS = 30 * 60 * 1000;

type CachedCompanyNews = {
  query: string;
  savedAt: number;
  result: WebSearchResult;
};

type ArticleSnippetMap = Record<string, string>;
type NewsArticleCard = {
  url: string;
  title: string;
  domain: string;
  snippet: string;
  imageUrl: string;
  theme: string;
};

export default function SearchIndex() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const resolvedTheme =
    settings.theme === "system" ? (colorScheme === "light" ? "light" : "dark") : settings.theme;
  const isDark = resolvedTheme === "dark";
  const palette = getSearchPalette(isDark);
  const t = getSearchCopy(settings.language);
  const [companyQuery, setCompanyQuery] = useState("");
  const [webQuery, setWebQuery] = useState("");
  const [webResult, setWebResult] = useState<WebSearchResult | null>(null);
  const [webLoading, setWebLoading] = useState(false);
  const [companyNews, setCompanyNews] = useState<WebSearchResult | null>(null);
  const [companyNewsLoading, setCompanyNewsLoading] = useState(false);
  const [companyNewsError, setCompanyNewsError] = useState<string | null>(null);
  const [articleSnippets, setArticleSnippets] = useState<ArticleSnippetMap>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: activeCompany, isLoading: activeCompanyLoading, refetch: refetchActiveCompany } = useActiveCompany();
  const { data: results = [], isFetching, refetch: refetchCompanyResults } = useSearchCompanies(companyQuery);
  const setActiveCompany = useSetActiveCompany();

  const companyNewsQuery = useMemo(
    () => (activeCompany ? buildCompanyNewsQuery(activeCompany, t.aiLanguageInstruction) : ""),
    [activeCompany, t.aiLanguageInstruction],
  );
  const companyNewsCacheId = useMemo(
    () => activeCompany?.id ?? "",
    [activeCompany?.id],
  );
  const companyArticles = useMemo(
    () => (companyNews ? buildArticleCards(companyNews, articleSnippets, t.openSourceForFullArticle) : []),
    [articleSnippets, companyNews, t.openSourceForFullArticle],
  );
  const webArticles = useMemo(
    () => (webResult ? buildArticleCards(webResult, articleSnippets, t.openSourceForFullArticle) : []),
    [articleSnippets, t.openSourceForFullArticle, webResult],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialNews() {
      if (!companyNewsQuery || !companyNewsCacheId) {
        setCompanyNews(null);
        setCompanyNewsError(null);
        return;
      }

      const cached = await readCompanyNewsCache(companyNewsCacheId, companyNewsQuery);
      if (cached) {
        setCompanyNews(cached.result);
        setCompanyNewsError(null);

        if (Date.now() - cached.savedAt < COMPANY_NEWS_CACHE_TTL_MS) {
          setCompanyNewsLoading(false);
          return;
        }
      }

      try {
        setCompanyNewsLoading(!cached);
        setCompanyNewsError(null);
        const result = await searchWebWithGemini(companyNewsQuery);
        await writeCompanyNewsCache(companyNewsCacheId, companyNewsQuery, result);
        if (!cancelled) setCompanyNews(result);
      } catch (error) {
        if (!cancelled) {
          if (!cached) setCompanyNews(null);
          setCompanyNewsError(
            cached
              ? `${error instanceof Error ? error.message : t.companyNewsFailed} ${t.showingSavedNews}`
              : error instanceof Error
                ? error.message
                : t.companyNewsFailed,
          );
        }
      } finally {
        if (!cancelled) setCompanyNewsLoading(false);
      }
    }

    void loadInitialNews();

    return () => {
      cancelled = true;
    };
  }, [companyNewsCacheId, companyNewsQuery]);

  useEffect(() => {
    if (!companyNews?.sources.length) {
      setArticleSnippets({});
      return;
    }

    let cancelled = false;
    const sources = companyNews.sources.slice(0, 9);
    setArticleSnippets({});

    async function loadArticleSnippets() {
      const entries = await Promise.all(
        sources.map(async (source) => {
          const snippet = await fetchArticleSnippet(source.url);
          return snippet ? ([source.url, snippet] as const) : null;
        }),
      );

      if (cancelled) return;

      setArticleSnippets(
        entries.reduce<ArticleSnippetMap>((next, entry) => {
          if (entry) next[entry[0]] = entry[1];
          return next;
        }, {}),
      );
    }

    void loadArticleSnippets();

    return () => {
      cancelled = true;
    };
  }, [companyNews?.sources]);

  async function refreshCompanyNews(silent = false) {
    if (!companyNewsQuery || !companyNewsCacheId) return;

    try {
      setCompanyNewsLoading(true);
      setCompanyNewsError(null);
      const result = await searchWebWithGemini(companyNewsQuery);
      await writeCompanyNewsCache(companyNewsCacheId, companyNewsQuery, result);
      setCompanyNews(result);
      if (!silent) {
        toast.showToast(t.newsRefreshed, t.newsRefreshedBody, "success");
      }
    } catch (error: any) {
      const message = error?.message || t.companyNewsFailed;
      setCompanyNewsError(message);
      toast.showToast(t.searchError, message, "error");
    } finally {
      setCompanyNewsLoading(false);
    }
  }

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refetchActiveCompany();
      if (companyQuery.trim()) {
        await refetchCompanyResults();
      }
      if (companyNewsQuery && companyNewsCacheId) {
        await refreshCompanyNews(true);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [companyNewsCacheId, companyNewsQuery, companyQuery, refetchActiveCompany, refetchCompanyResults]);

  async function runWebSearch() {
    const cleanQuery = webQuery.trim();
    if (!cleanQuery) {
      toast.showToast(t.searchTheWeb, t.enterSearchFirst, "warning");
      return;
    }

    try {
      setWebLoading(true);
      setWebResult(null);
      setWebResult(await searchWebWithGemini(cleanQuery));
    } catch (error: any) {
      toast.showToast(t.searchError, error?.message || t.webSearchFailed, "error");
    } finally {
      setWebLoading(false);
    }
  }

  async function handleOpenCompanyPlan(company: Company) {
    try {
      if (company.id !== activeCompany?.id) {
        await setActiveCompany.mutateAsync(company.id);
      }
      router.push("/(root)/(tabs)/plan" as any);
    } catch (error: any) {
      toast.showToast(t.error, error?.message || t.failedOpenPlan, "error");
    }
  }

  return (
    <LinearGradient
      colors={palette.gradient}
      style={{ flex: 1 }}
      locations={[0, 0.6, 1]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          style={{ flex: 1 }}
        >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={palette.text}
              colors={["#4D2FB2"]}
            />
          }
        >
          <Text style={[styles.eyebrow, { color: palette.eyebrow }]}>{t.workspace}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{t.search}</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            {t.subtitle}
          </Text>

          <View style={[styles.heroCard, { backgroundColor: palette.heroCard, borderColor: palette.border }]}>
            <View style={styles.heroHeader}>
              <View style={[styles.heroIcon, { backgroundColor: palette.iconBackground }]}>
                <Newspaper size={20} color={palette.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.heroEyebrow, { color: palette.eyebrow }]}>{t.companyNews}</Text>
                <Text style={[styles.heroTitle, { color: palette.text }]}>
                  {activeCompany ? t.newsFor(activeCompany.businessName) : t.companyRelatedNews}
                </Text>
              </View>
            </View>
            <Text style={[styles.heroBody, { color: palette.muted }]}>
              {activeCompany
                ? t.companyNewsBody
                : t.noCompanyNewsBody}
            </Text>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                { backgroundColor: palette.primaryButton },
                !activeCompany && styles.disabledButton,
              ]}
              disabled={!activeCompany || companyNewsLoading}
              onPress={() => void refreshCompanyNews()}
            >
              {companyNewsLoading ? (
                <ActivityIndicator color={palette.primaryText} />
              ) : (
                <>
                  <RefreshCw size={16} color={palette.primaryText} />
                  <Text style={[styles.refreshButtonText, { color: palette.primaryText }]}>{t.refresh}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {activeCompanyLoading ? (
            <View style={[styles.messageCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.messageText, { color: palette.muted }]}>{t.loadingActiveCompany}</Text>
            </View>
          ) : !activeCompany ? (
            <View style={[styles.messageCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.messageTitle, { color: palette.text }]}>{t.noActiveCompany}</Text>
              <Text style={[styles.messageText, { color: palette.muted }]}>
                {t.noActiveCompanyBody}
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/companies" as any)}>
                <Text style={styles.primaryButtonText}>{t.goToCompanies}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {companyNewsError ? (
            <View style={[styles.errorCard, { backgroundColor: palette.errorBackground, borderColor: palette.errorBorder }]}>
              <Text style={[styles.errorText, { color: palette.errorText }]}>{companyNewsError}</Text>
            </View>
          ) : null}

          {companyNewsLoading ? (
            <View style={[styles.messageCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.messageText, { color: palette.muted }]}>{t.searchingCompanyNews}</Text>
            </View>
          ) : null}

          {!companyNewsLoading && companyArticles.length > 0 ? (
            <View style={styles.section}>
              {companyArticles.map((article, index) => (
                <TouchableOpacity
                  key={`${article.url}-${index}`}
                  style={styles.articleCardPressable}
                  activeOpacity={0.9}
                  onPress={() => void Linking.openURL(article.url)}
                >
                  <LinearGradient
                    colors={palette.cardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.articleCard, { borderColor: palette.border }]}
                  >
                  <View style={[styles.articleImageWrap, { backgroundColor: palette.imageBackground }]}>
                    <Image source={{ uri: article.imageUrl }} style={styles.articleImage} resizeMode="cover" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.articleTopRow}>
                      <Text style={[styles.articleDomain, { color: palette.eyebrow }]}>{article.domain}</Text>
                      <ExternalLink size={14} color={palette.muted} />
                    </View>
                    <View style={[styles.themeBadge, { backgroundColor: palette.chip, borderColor: palette.border }]}>
                      <Text style={[styles.themeBadgeText, { color: palette.text }]}>{article.theme}</Text>
                    </View>
                    <Text style={[styles.articleTitle, { color: palette.text }]}>{article.title}</Text>
                    <Text style={[styles.articleSnippet, { color: palette.muted }]}>{article.snippet}</Text>
                  </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: palette.iconSolidBackground }]}>
                <Globe2 size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>{t.webNewsResearch}</Text>
                <Text style={[styles.sectionBody, { color: palette.muted }]}>
                  {t.webNewsResearchBody}
                </Text>
              </View>
            </View>

            <View style={[styles.searchBox, { backgroundColor: palette.input, borderColor: palette.border }]}>
              <SearchIcon size={16} color={palette.placeholder} />
              <TextInput
                value={webQuery}
                onChangeText={setWebQuery}
                placeholder={t.webSearchPlaceholder}
                placeholderTextColor={palette.placeholder}
                style={[styles.searchTextInput, { color: palette.text }]}
              />
            </View>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: palette.primaryButton }]} onPress={() => void runWebSearch()} disabled={webLoading}>
              {webLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{t.searchWeb}</Text>}
            </TouchableOpacity>

            {webResult ? (
              <View style={[styles.browserCard, { backgroundColor: palette.input, borderColor: palette.border }]}>
                <Text style={[styles.browserEyebrow, { color: palette.eyebrow }]}>{t.browserResult}</Text>
                <Text style={[styles.browserQuery, { color: palette.text }]}>{webQuery}</Text>

                {webArticles.length > 0 ? (
                  <View style={styles.sourcesList}>
                    {webArticles.map((article, index) => (
                      <TouchableOpacity
                        key={`${article.url}-${index}`}
                        style={[styles.sourceArticleCard, { backgroundColor: palette.card, borderColor: palette.border }]}
                        onPress={() => void Linking.openURL(article.url)}
                      >
                        <Image source={{ uri: article.imageUrl }} style={styles.sourceArticleImage} resizeMode="cover" />
                        <View style={styles.sourceArticleBody}>
                          <View style={styles.articleTopRow}>
                            <Text style={[styles.articleDomain, { color: palette.eyebrow }]}>{article.domain}</Text>
                            <Text style={[styles.sourceThemeText, { color: palette.muted }]}>{article.theme}</Text>
                          </View>
                          <Text style={[styles.sourceArticleTitle, { color: palette.text }]} numberOfLines={2}>{article.title}</Text>
                          <Text style={[styles.sourceArticleSnippet, { color: palette.muted }]} numberOfLines={3}>{article.snippet}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                <Text style={[styles.browserAnswer, { color: palette.muted }]}>{webResult.answer}</Text>

                <Text style={[styles.sourceHeading, { color: palette.text }]}>{t.sources}</Text>
                <View style={styles.sourcesList}>
                  {webResult.sources.map((source) => (
                    <TouchableOpacity
                      key={source.url}
                      style={[styles.sourceCard, { backgroundColor: palette.chip, borderColor: palette.border }]}
                      onPress={() => void Linking.openURL(source.url)}
                    >
                      <Text style={[styles.sourceTitle, { color: palette.text }]} numberOfLines={1}>{source.title}</Text>
                      <Text style={[styles.sourceUrl, { color: palette.muted }]} numberOfLines={1}>{source.url}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: palette.iconSolidBackground }]}>
                <Sparkles size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>{t.searchCompanies}</Text>
                <Text style={[styles.sectionBody, { color: palette.muted }]}>
                  {t.searchCompaniesBody}
                </Text>
              </View>
            </View>

            <View style={[styles.searchBox, { backgroundColor: palette.input, borderColor: palette.border }]}>
              <SearchIcon size={16} color={palette.placeholder} />
              <TextInput
                value={companyQuery}
                onChangeText={setCompanyQuery}
                placeholder={t.companySearchPlaceholder}
                placeholderTextColor={palette.placeholder}
                style={[styles.searchTextInput, { color: palette.text }]}
              />
            </View>

            {!companyQuery.trim() ? (
              <Text style={[styles.messageText, { color: palette.muted }]}>{t.startWithCompanySearch}</Text>
            ) : isFetching ? (
              <Text style={[styles.messageText, { color: palette.muted }]}>{t.searchingCompanies}</Text>
            ) : results.length === 0 ? (
              <Text style={[styles.messageText, { color: palette.muted }]}>{t.noCompaniesMatched}</Text>
            ) : (
              <View style={styles.companyResults}>
                {results.map((company) => (
                  <View key={company.id} style={[styles.companyResultCard, { backgroundColor: palette.input, borderColor: palette.border }]}>
                    <Text style={[styles.companyResultName, { color: palette.text }]}>{company.businessName}</Text>
                    <Text style={[styles.companyResultPlace, { color: palette.eyebrow }]}>{company.place}</Text>
                    <Text style={[styles.companyResultIdea, { color: palette.muted }]}>{company.idea}</Text>
                    <View style={styles.companyResultActions}>
                      <TouchableOpacity
                        style={[styles.secondaryButton, { backgroundColor: palette.secondaryButton, borderColor: palette.border }]}
                        onPress={async () => {
                          try {
                            await setActiveCompany.mutateAsync(company.id);
                            toast.showToast(t.activeCompany, t.companyNowActive(company.businessName), "success");
                          } catch (error: any) {
                            toast.showToast(t.error, error?.message || t.failedSetActive, "error");
                          }
                        }}
                      >
                        <Text style={[styles.secondaryButtonText, { color: palette.text }]}>{t.setActive}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.secondaryButton, { backgroundColor: palette.secondaryButton, borderColor: palette.border }]}
                        onPress={() => void handleOpenCompanyPlan(company)}
                      >
                        <Text style={[styles.secondaryButtonText, { color: palette.text }]}>{t.openPlan}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function buildCompanyNewsQuery(company: Company, languageInstruction: string) {
  const tags = company.uniqueTags.length > 0 ? company.uniqueTags.join(", ") : "business startup";

  return [
    `Find recent news articles, market updates, competitor signals, regulations, funding news, and useful reading connected to this company.`,
    `Company: ${company.businessName}`,
    `Location: ${company.place}`,
    `Business idea: ${company.idea}`,
    `Tags: ${tags}`,
    `Return a concise research brief and prioritize source-backed article links that a founder should read now.`,
    languageInstruction,
  ].join("\n");
}

async function readCompanyNewsCache(companyId: string, query: string) {
  try {
    const remoteCached = await accountDataService.getCompanyNewsCache<CachedCompanyNews | null>(companyId, null);
    if (remoteCached?.query === query && remoteCached.result?.answer) {
      return remoteCached;
    }

    const raw = await AsyncStorage.getItem(`bizplan-mobile-company-news:${companyId}`);
    if (!raw) return null;

    const localCached = JSON.parse(raw) as CachedCompanyNews;
    if (localCached.query !== query || !localCached.result?.answer) return null;

    await accountDataService.updateCompanyNewsCache(companyId, localCached);
    return localCached;
  } catch {
    return null;
  }
}

async function writeCompanyNewsCache(companyId: string, query: string, result: WebSearchResult) {
  try {
    const cache = {
      query,
      savedAt: Date.now(),
      result,
    } satisfies CachedCompanyNews;

    await accountDataService.updateCompanyNewsCache(companyId, cache);
  } catch {
    try {
      await AsyncStorage.setItem(
        `bizplan-mobile-company-news:${companyId}`,
        JSON.stringify({
          query,
          savedAt: Date.now(),
          result,
        } satisfies CachedCompanyNews),
      );
    } catch {
      // Search still works without cache storage.
    }
  }
}

function buildArticleCards(
  result: WebSearchResult,
  articleSnippets: ArticleSnippetMap,
  fallbackSnippet: string,
) : NewsArticleCard[] {
  return result.sources.slice(0, 9).map((source) => ({
    ...source,
    domain: getDomain(source.url),
    imageUrl: getArticlePreviewUrl(source.url),
    snippet: articleSnippets[source.url] ?? fallbackSnippet,
    theme: inferArticleTheme(source.title, articleSnippets[source.url] ?? fallbackSnippet),
  }));
}

async function fetchArticleSnippet(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    return extractArticleSnippet(html);
  } catch {
    return null;
  }
}

function extractArticleSnippet(html: string) {
  const metadataSnippet =
    getHtmlMetaContent(html, "description") ??
    getHtmlMetaContent(html, "og:description") ??
    getHtmlMetaContent(html, "twitter:description");

  if (metadataSnippet) return trimSnippet(metadataSnippet);

  const readableText = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return readableText.length > 80 ? trimSnippet(readableText) : null;
}

function getHtmlMetaContent(html: string, name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const metaRegex = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const reversedMetaRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escapedName}["'][^>]*>`,
    "i",
  );

  return decodeHtmlEntities(metaRegex.exec(html)?.[1] ?? reversedMetaRegex.exec(html)?.[1] ?? "");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function trimSnippet(value: string) {
  const clean = decodeHtmlEntities(value);
  if (clean.length <= 230) return clean;
  return `${clean.slice(0, 227).trim()}...`;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "article";
  }
}

function getArticlePreviewUrl(url: string) {
  return `https://image.thum.io/get/width/900/crop/600/noanimate/${url}`;
}

function inferArticleTheme(title: string, snippet: string) {
  const value = `${title} ${snippet}`.toLowerCase();
  if (value.includes("fund") || value.includes("investment") || value.includes("raise")) return "Funding";
  if (value.includes("compet") || value.includes("rival")) return "Competitor";
  if (value.includes("regulat") || value.includes("law") || value.includes("policy")) return "Regulation";
  if (value.includes("market") || value.includes("industry") || value.includes("trend")) return "Market";
  if (value.includes("customer") || value.includes("consumer") || value.includes("audience")) return "Customer trend";
  if (value.includes("armenia") || value.includes("local") || value.includes("community")) return "Local news";
  return "Business update";
}

function getSearchCopy(language: "en" | "ru" | "hy") {
  if (language === "ru") {
    return {
      workspace: "Поиск и источники",
      search: "Поиск",
      subtitle: "Ищите компании, новости, конкурентов и источники, полезные для решений по бизнесу.",
      companyNews: "Новости компании",
      newsFor: (name: string) => `Новости для ${name}`,
      companyRelatedNews: "Новости по компании",
      companyNewsBody: "Свежие статьи, обновления рынка, конкуренты и полезные материалы для активной компании.",
      noCompanyNewsBody: "Выберите активную компанию, и здесь автоматически появятся релевантные новости со ссылками.",
      refresh: "Обновить",
      loadingActiveCompany: "Загружаем активную компанию...",
      noActiveCompany: "Активной компании пока нет",
      noActiveCompanyBody: "Выберите активную компанию в Companies, и этот экран начнет показывать новости автоматически.",
      goToCompanies: "К компаниям",
      searchingCompanyNews: "Ищем свежие новости компании...",
      webNewsResearch: "Новости и исследование рынка",
      webNewsResearchBody: "Ищите текущие новости, конкурентов, market research, regulations или материалы с источниками.",
      webSearchPlaceholder: "Последние AI startup новости, данные рынка Армении...",
      searchWeb: "Искать источники",
      browserResult: "Результат браузера",
      sources: "Источники",
      searchCompanies: "Поиск компаний",
      searchCompaniesBody: "Ищите компании в аккаунте, выбирайте активную и переходите к планированию.",
      companySearchPlaceholder: "Поиск по названию, локации или идее",
      startWithCompanySearch: "Начните с названия компании, локации или идеи.",
      searchingCompanies: "Ищем компании...",
      noCompaniesMatched: "Компании не найдены.",
      activeCompany: "Активная компания",
      companyNowActive: (name: string) => `${name} теперь активна.`,
      setActive: "Сделать активной",
      openPlan: "Открыть план",
      error: "Ошибка",
      failedSetActive: "Не удалось сделать компанию активной.",
      failedOpenPlan: "Не удалось открыть план этой компании.",
      searchTheWeb: "Поиск источников",
      enterSearchFirst: "Введите тему, рынок или вопрос о компании.",
      searchError: "Ошибка поиска",
      webSearchFailed: "Не удалось найти источники.",
      newsRefreshed: "Новости обновлены",
      newsRefreshedBody: "Новости компании обновлены.",
      companyNewsFailed: "Поиск новостей компании не удался.",
      showingSavedNews: "Показаны сохраненные новости.",
      openSourceForFullArticle: "Откройте источник, чтобы прочитать фрагмент статьи и подробности с сайта.",
      aiLanguageInstruction: "Respond in Russian.",
    };
  }

  if (language === "hy") {
    return {
      workspace: "Որոնում և աղբյուրներ",
      search: "Որոնում",
      subtitle: "Որոնեք ընկերություններ, նորություններ, մրցակիցներ և բիզնես որոշումների համար օգտակար աղբյուրներ։",
      companyNews: "Ընկերության նորություններ",
      newsFor: (name: string) => `${name}-ի նորություններ`,
      companyRelatedNews: "Ընկերության հետ կապված նորություններ",
      companyNewsBody: "Թարմ հոդվածներ, շուկայի թարմացումներ, մրցակիցներ և օգտակար նյութեր ակտիվ ընկերության համար։",
      noCompanyNewsBody: "Ընտրեք ակտիվ ընկերություն, և այստեղ ավտոմատ կհայտնվեն համապատասխան նորություններ հղումներով։",
      refresh: "Թարմացնել",
      loadingActiveCompany: "Բեռնվում է ակտիվ ընկերությունը...",
      noActiveCompany: "Ակտիվ ընկերություն դեռ չկա",
      noActiveCompanyBody: "Ընտրեք ակտիվ ընկերություն Companies էջից, և այս էջը ավտոմատ ցույց կտա համապատասխան նորություններ։",
      goToCompanies: "Գնալ ընկերություններին",
      searchingCompanyNews: "Որոնվում են ընկերության թարմ նորություններ...",
      webNewsResearch: "Նորություններ և շուկայի ուսումնասիրություն",
      webNewsResearchBody: "Ищите текущие новости, конкурентов, market research, regulations или материалы с источниками.",
      webSearchPlaceholder: "Վերջին AI startup նորություններ, Հայաստանի շուկայի տվյալներ...",
      searchWeb: "Որոնել աղբյուրներ",
      browserResult: "Browser արդյունք",
      sources: "Աղբյուրներ",
      searchCompanies: "Որոնել ընկերություններ",
      searchCompaniesBody: "Որոնեք ձեր հաշվի ընկերություններում, ընտրեք ակտիվը և անցեք պլանավորմանը։",
      companySearchPlaceholder: "Որոնել անունով, վայրով կամ գաղափարով",
      startWithCompanySearch: "Սկսեք ընկերության անունից, վայրից կամ գաղափարից։",
      searchingCompanies: "Որոնվում են ընկերությունները...",
      noCompaniesMatched: "Համապատասխան ընկերություններ չկան։",
      activeCompany: "Ակտիվ ընկերություն",
      companyNowActive: (name: string) => `${name}-ը հիմա ակտիվ է։`,
      setActive: "Դարձնել ակտիվ",
      openPlan: "Բացել պլանը",
      error: "Սխալ",
      failedSetActive: "Չհաջողվեց դարձնել ակտիվ ընկերություն։",
      failedOpenPlan: "Չհաջողվեց բացել այս ընկերության պլանը։",
      searchTheWeb: "Աղբյուրների որոնում",
      enterSearchFirst: "Նախ մուտքագրեք թեմա, շուկա կամ ընկերության հարց։",
      searchError: "Որոնման սխալ",
      webSearchFailed: "Не удалось найти источники.",
      newsRefreshed: "Նորությունները թարմացվեցին",
      newsRefreshedBody: "Ընկերության նորությունները թարմացվեցին։",
      companyNewsFailed: "Ընկերության նորությունների որոնումը ձախողվեց։",
      showingSavedNews: "Ցուցադրվում են պահված նորությունները։",
      openSourceForFullArticle: "Բացեք աղբյուրը՝ կայքի հոդվածի հատվածը և մանրամասները կարդալու համար։",
      aiLanguageInstruction: "Respond in Armenian.",
    };
  }

  return {
    workspace: "Search and sources",
    search: "Search",
    subtitle: "Search companies, news, competitors, and sources that help business decisions.",
    companyNews: "Company news",
    newsFor: (name: string) => `News for ${name}`,
    companyRelatedNews: "Company-related news",
    companyNewsBody: "Fresh articles, market updates, competitors, and useful reading connected to your active company.",
    noCompanyNewsBody: "Set an active company and this page will automatically show relevant news with article links.",
    refresh: "Refresh",
    loadingActiveCompany: "Loading active company...",
    noActiveCompany: "No active company yet",
    noActiveCompanyBody: "Set an active company from Companies and this screen will start showing related news automatically.",
    goToCompanies: "Go to companies",
    searchingCompanyNews: "Searching recent company news...",
    webNewsResearch: "News and market research",
    webNewsResearchBody: "Ищите текущие новости, конкурентов, market research, regulations или материалы с источниками.",
    webSearchPlaceholder: "Search latest AI startup news, Armenian market data...",
    searchWeb: "Search sources",
    browserResult: "Browser result",
    sources: "Sources",
    searchCompanies: "Search companies",
    searchCompaniesBody: "Search across the companies in your account, set one active, then jump into planning.",
    companySearchPlaceholder: "Search by name, location, or idea",
    startWithCompanySearch: "Start with a company name, location, or idea.",
    searchingCompanies: "Searching companies...",
    noCompaniesMatched: "No companies matched your search.",
    activeCompany: "Active company",
    companyNowActive: (name: string) => `${name} is now active.`,
    setActive: "Set active",
    openPlan: "Open plan",
    error: "Error",
    failedSetActive: "Failed to set active company.",
    failedOpenPlan: "Failed to open this company plan.",
    searchTheWeb: "Source search",
    enterSearchFirst: "Enter a topic, market, or company question first.",
    searchError: "Search error",
    webSearchFailed: "Не удалось найти источники.",
    newsRefreshed: "News refreshed",
    newsRefreshedBody: "Company news has been updated.",
    companyNewsFailed: "Company news search failed.",
    showingSavedNews: "Showing saved company news.",
    openSourceForFullArticle: "Open this source to read the article excerpt and latest details from the site.",
    aiLanguageInstruction: "Respond in English.",
  };
}

function getSearchPalette(isDark: boolean) {
  return {
    gradient: isDark
      ? (["#4D2FB2", "#2B1A66", "#050510"] as const)
      : (["#F8FAFC", "#EEF7F3", "#E7EEF9"] as const),
    text: isDark ? "#FFFFFF" : "#0F172A",
    muted: isDark ? "rgba(255,255,255,0.72)" : "#475569",
    eyebrow: isDark ? "rgba(255,255,255,0.58)" : "#64748B",
    placeholder: isDark ? "rgba(255,255,255,0.45)" : "#718096",
    heroCard: isDark ? "rgba(24,59,53,0.88)" : "rgba(255,255,255,0.88)",
    card: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.88)",
    cardGradient: isDark
      ? (["rgba(255,255,255,0.09)", "rgba(24,59,53,0.30)"] as const)
      : (["rgba(255,255,255,0.98)", "rgba(240,253,250,0.94)", "rgba(239,246,255,0.94)"] as const),
    input: isDark ? "rgba(8,10,16,0.38)" : "rgba(255,255,255,0.94)",
    chip: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
    border: isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)",
    iconBackground: isDark ? "rgba(255,255,255,0.12)" : "rgba(77,47,178,0.10)",
    iconColor: isDark ? "#FFFFFF" : "#4D2FB2",
    iconSolidBackground: "#4D2FB2",
    imageBackground: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.06)",
    primaryButton: "#4D2FB2",
    primaryText: "#FFFFFF",
    secondaryButton: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.86)",
    errorBackground: isDark ? "rgba(190,40,60,0.22)" : "rgba(254,226,226,0.94)",
    errorBorder: isDark ? "rgba(255,140,160,0.26)" : "rgba(220,38,38,0.24)",
    errorText: isDark ? "#ffd4da" : "#991B1B",
  };
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 36,
    gap: 16,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "REM-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 34,
    lineHeight: 38,
    fontFamily: "Gabarito",
    marginTop: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "REM-Regular",
    marginTop: 10,
  },
  heroCard: {
    marginTop: 6,
    borderRadius: 30,
    padding: 18,
    backgroundColor: "rgba(24,59,53,0.88)",
    borderWidth: 1,
    borderColor: "rgba(223,174,85,0.18)",
  },
  heroHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontFamily: "REM-Bold",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    lineHeight: 26,
    fontFamily: "Gabarito",
    marginTop: 4,
  },
  heroBody: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "REM-Regular",
    marginTop: 14,
  },
  refreshButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "REM-Bold",
  },
  disabledButton: {
    opacity: 0.45,
  },
  messageCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 18,
  },
  messageTitle: {
    color: "#fff",
    fontSize: 19,
    fontFamily: "Gabarito",
  },
  messageText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "REM-Regular",
    marginTop: 6,
  },
  errorCard: {
    borderRadius: 20,
    backgroundColor: "rgba(190,40,60,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,140,160,0.26)",
    padding: 16,
  },
  errorText: {
    color: "#ffd4da",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "REM-Regular",
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: "rgba(122,95,255,0.95)",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "REM-Bold",
  },
  section: {
    gap: 12,
  },
  articleCardPressable: {
    borderRadius: 24,
  },
  articleCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 14,
  },
  articleImageWrap: {
    width: 92,
    height: 92,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  articleImage: {
    width: "100%",
    height: "100%",
  },
  articleTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  themeBadgeText: {
    fontSize: 10,
    fontFamily: "REM-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  articleDomain: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "REM-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  articleTitle: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
    fontFamily: "Gabarito",
    marginTop: 6,
  },
  articleSnippet: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "REM-Regular",
    marginTop: 6,
  },
  sectionCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(122,95,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 19,
    fontFamily: "Gabarito",
  },
  sectionBody: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "REM-Regular",
    marginTop: 4,
  },
  searchBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,10,16,0.38)",
    paddingHorizontal: 14,
  },
  searchTextInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontFamily: "REM-Regular",
    paddingVertical: 14,
  },
  browserCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,10,16,0.36)",
    padding: 16,
  },
  browserEyebrow: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontFamily: "REM-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  browserQuery: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 24,
    fontFamily: "Gabarito",
    marginTop: 6,
  },
  browserAnswer: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "REM-Regular",
    marginTop: 14,
  },
  sourceHeading: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Gabarito",
    marginTop: 18,
  },
  sourcesList: {
    marginTop: 10,
    gap: 10,
  },
  sourceArticleCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  sourceArticleImage: {
    width: "100%",
    height: 156,
  },
  sourceArticleBody: {
    padding: 12,
    gap: 6,
  },
  sourceArticleTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "Gabarito",
  },
  sourceArticleSnippet: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "REM-Regular",
  },
  sourceThemeText: {
    fontSize: 11,
    fontFamily: "REM-Bold",
  },
  sourceCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
  },
  sourceTitle: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "REM-Bold",
  },
  sourceUrl: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    fontFamily: "REM-Regular",
    marginTop: 5,
  },
  companyResults: {
    marginTop: 12,
    gap: 10,
  },
  companyResultCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,10,16,0.36)",
    padding: 14,
  },
  companyResultName: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Gabarito",
  },
  companyResultPlace: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 12,
    fontFamily: "REM-Regular",
    marginTop: 4,
  },
  companyResultIdea: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "REM-Regular",
    marginTop: 8,
  },
  companyResultActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "REM-Bold",
  },
});

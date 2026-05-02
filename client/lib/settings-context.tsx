import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { accountDataService } from "@/services/account-data.service";

export const languageMeta = {
  en: { label: "English", locale: "en-US" },
  ru: { label: "Russian", locale: "ru-RU" },
  hy: { label: "Armenian", locale: "hy-AM" },
} as const;

export type Language = keyof typeof languageMeta;
export type ThemeMode = "dark" | "light" | "system";
export type DensityMode = "comfortable" | "compact";
export type RoutePreference =
  | "/(root)/(tabs)/(dashboard)"
  | "/(root)/companies"
  | "/(root)/(tabs)/plan";

export type AppSettings = {
  language: Language;
  theme: ThemeMode;
  density: DensityMode;
  reducedMotion: boolean;
  defaultRoute: RoutePreference;
  autoGeneratePlanOnCreate: boolean;
  openPlanAfterGeneration: boolean;
  confirmBeforeDeleteCompany: boolean;
  showFinancialFields: boolean;
  enableAiCompanyDraft: boolean;
  showProfileEmail: boolean;
};

type SettingsContextValue = {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  isHydrated: boolean;
};

const STORAGE_KEY = "bizplan-mobile-settings";

const defaultSettings: AppSettings = {
  language: "hy",
  theme: "dark",
  density: "comfortable",
  reducedMotion: false,
  defaultRoute: "/(root)/(tabs)/(dashboard)",
  autoGeneratePlanOnCreate: false,
  openPlanAfterGeneration: true,
  confirmBeforeDeleteCompany: true,
  showFinancialFields: true,
  enableAiCompanyDraft: true,
  showProfileEmail: true,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

async function readLocalSettings() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AppSettings>;
  } catch {
    return null;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const localSettings = await readLocalSettings();
        const token = await AsyncStorage.getItem("auth_token");

        if (!token) {
          if (mounted && localSettings) {
            setSettings((current) => ({ ...current, ...localSettings }));
          }
          return;
        }

        const remoteSettings = await accountDataService.getSettings<Partial<AppSettings>>({});
        const hasRemoteSettings = Object.keys(remoteSettings || {}).length > 0;
        const nextSettings = hasRemoteSettings ? remoteSettings : localSettings;

        if (mounted && nextSettings) {
          const mergedSettings = { ...defaultSettings, ...nextSettings };
          setSettings(mergedSettings);

          if (!hasRemoteSettings && localSettings) {
            await accountDataService.updateSettings(mergedSettings);
          }
        }
      } catch {
        const localSettings = await readLocalSettings();
        if (mounted && localSettings) {
          setSettings((current) => ({ ...current, ...localSettings }));
        }
      } finally {
        if (mounted) setIsHydrated(true);
      }
    }

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    async function persistSettings() {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        return;
      }

      try {
        await accountDataService.updateSettings(settings);
      } catch {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      }
    }

    void persistSettings();
  }, [isHydrated, settings]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSetting: (key, value) =>
        setSettings((current) => ({
          ...current,
          [key]: value,
        })),
      resetSettings: () => setSettings(defaultSettings),
      isHydrated,
    }),
    [isHydrated, settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}

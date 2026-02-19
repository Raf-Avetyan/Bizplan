import { NavigatorScreenParams } from "@react-navigation/native";

export type DashboardStackParamList = {
  DashboardMain: undefined
  MarketingTools: undefined;
  MyDocuments: undefined;
  Profile: undefined;
};

export type ChatAndPlanStackParamList = {
  Chat: undefined;
  Plan: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Financial: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainStackParamList>;
  ChatAndPlan: NavigatorScreenParams<ChatAndPlanStackParamList>;
  Dashboard: NavigatorScreenParams<DashboardStackParamList>;
  Profile: undefined;
};


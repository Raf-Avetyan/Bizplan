export type RootStackParamList = {
  Main: { screen: "Home" | "Financial" };
  Home: undefined;
  Plan: undefined;
  Chat: undefined;
  Financial: undefined;
  Dashboard: { businessPlanData: BusinessPlanData };
  ChatAndPlan: { screen: "Chat" | "Plan" };
  MarketingTools: undefined;
  MyDocuments: undefined;
};

type BusinessPlanData = {
  idea: string;
  place: string;
  uniqueTags: string[];
  businessName: string;
};

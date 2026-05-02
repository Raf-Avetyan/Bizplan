import { Href } from 'expo-router';

export const cardData = [
   {
      id: 1,
      title: "Business Plan",
      type: "business-plan",
      path: "/(root)/(tabs)/plan"
   },
   {
      id: 2,
      title: "Financials",
      type: "financials",
      path: "/(root)/(tabs)/(dashboard)/financials"
   },
   {
      id: 3,
      title: "Pitch Deck",
      description: "Secure funding and impress partners",
      type: "pitch-desk",
      path: "/(root)/(tabs)/(dashboard)/pitch-deck"
   },
   {
      id: 4,
      title: "Radar",
      description: "Track competitors, news, social media, and local events",
      type: "radar",
      path: "/(root)/(tabs)/search"
   },
   {
      id: 5,
      title: "Guides",
      description: "Bespoke guides generated just for you",
      type: "executive",
      path: "/(root)/(tabs)/(dashboard)/guides"
   },
   {
      id: 6,
      title: "Market Research",
      description: "Audience demographics, personas, and industry benchmarks",
      type: "competitor",
      path: "/(root)/(tabs)/(dashboard)/market-research"
   }
];

export type CardDataItem = {
   id: number;
   title: string;
   description?: string;
   type: string;
   path: Href;
};

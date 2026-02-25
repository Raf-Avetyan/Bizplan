import { Href } from 'expo-router';
import { ImageRequireSource } from 'react-native';

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
      thumbnail: require('@/assets/images/dashboardCard/financials-thumb.png'),
      path: "/(root)/(tabs)/plan"
   },
   {
      id: 3,
      title: "Pitch Desk",
      description: "Secure funding and impress partners",
      type: "pitch-desk",
      thumbnail: require('@/assets/images/dashboardCard/pitch-deck-thumb.png'),
      path: "/(root)/(tabs)/plan"
   },
   {
      id: 4,
      title: "Radar",
      description: "Track competitors, news, social media, and local events",
      type: "radar",
      thumbnail: require('@/assets/images/dashboardCard/radar-thumb.png'),
      path: "/(root)/(tabs)/search"
   },
   {
      id: 5,
      title: "Guides",
      description: "Bespoke guides generated just for you",
      type: "executive",
      thumbnail: require('@/assets/images/dashboardCard/guides-thumb.png'),
      path: "/(root)/(tabs)/plan"
   },
   {
      id: 6,
      title: "Market Research",
      description: "Audience demographics, personas, and industry benchmarks",
      type: "competitor",
      thumbnail: require('@/assets/images/dashboardCard/market-research-thumb.png'),
      path: "/(root)/(tabs)/plan"
   }
];

export type CardDataItem = {
   id: number;
   title: string;
   description?: string;
   type: string;
   thumbnail?: ImageRequireSource;
   path: Href;
};
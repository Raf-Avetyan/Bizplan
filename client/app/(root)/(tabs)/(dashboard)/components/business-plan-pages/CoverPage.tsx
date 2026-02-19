import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Company } from '@/types/company.types';

interface CoverPageProps {
   company: Company;
   size: "normal" | "small";
}

const CoverPage: React.FC<CoverPageProps> = ({ company, size }: CoverPageProps) => {
   const scaleFactor = size === "small" ? .2 : 1;

   const scaledStyles = StyleSheet.create({
      coverContainer: {
         flex: 1,
         justifyContent: "space-between",
         width: "100%"
      },
      logoContainer: {
         width: 100 * scaleFactor,
         height: 50 * scaleFactor,
         backgroundColor: '#f0f0f0',
         justifyContent: 'center',
         alignItems: 'center',
         borderRadius: 8
      },
      logo: {
         fontSize: 14 * scaleFactor,
         color: '#666'
      },
      businessName: {
         fontSize: 20 * scaleFactor,
         textTransform: "uppercase",
         fontWeight: '700',
         color: '#001941',
         marginBottom: 2 * scaleFactor,
      },
      businessPlanText: {
         fontSize: 12 * scaleFactor,
         color: "#666",
         fontWeight: '500',
         marginBottom: 40 * scaleFactor,
      },
      contactInfo: {
      },
      contactText: {
         fontSize: 6 * scaleFactor,
         color: '#666',
         textAlign: 'left',
      },
   });

   return (
      <View style={scaledStyles.coverContainer}>
         <View style={scaledStyles.logoContainer}>
            <Text style={scaledStyles.logo}>LOGO</Text>
         </View>

         <View>
            <Text style={scaledStyles.businessName}>{company.businessName}</Text>
            <Text style={scaledStyles.businessPlanText}>BUSINESS PLAN</Text>
         </View>

         <View style={scaledStyles.contactInfo}>
            <Text style={scaledStyles.contactText}>NAME@EXAMPLE.COM</Text>
            <Text style={scaledStyles.contactText}>416 656 1234</Text>
            <Text style={scaledStyles.contactText}>EXAMPLE.COM</Text>
            <Text style={scaledStyles.contactText}>123 ELM STREET, TORONTO, ON, M6V 1A1</Text>
         </View>
      </View>
   );
};

export default CoverPage;
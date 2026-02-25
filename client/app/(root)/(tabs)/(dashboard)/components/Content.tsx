import { useEffect, useState } from "react";
import {
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  RefreshControl
} from "react-native";
import { useAiChat } from "@/hooks/Chat/useAiChat";
import { tableOfContents } from '../../../../../components/plan/BusinessPlanRenderer';
import { ViewStyle, TextStyle } from 'react-native';
import { useActiveCompany, useAddBusinessPlan, useCompanyAdditionalData } from '@/hooks/useCompanyQueries';
import { Company, CompanyAdditionalDataDto } from '@/types/company.types';
import Card from './Card/Card';
import { cardData, CardDataItem } from '@/constants/DashboardCardData';

type ContentProps = {
  companyData: Company;
};

export interface PageBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'image' | 'chart' | 'divider' | 'quote';
  content: string | Array<any> | PageBlock[];
  styles: TextStyle & ViewStyle & {
    width?: number | string;
    height?: number | string;
  };
  metadata?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    listType?: 'bullet' | 'number' | 'check';
    imageSrc?: string;
    chartType?: string;
    author?: string
  };
}

export interface Page {
  id: string;
  pageNumber: number;
  type: 'cover' | 'toc' | 'content' | 'financial' | 'custom';
  title: string;
  section?: string;
  blocks: PageBlock[];
  styles: TextStyle & ViewStyle & {
    width?: number | string;
    height?: number | string;
  };
  formatting: {
    backgroundColor: string;
    backgroundImage?: string;
    border?: string;
    shadow?: string;
  };
}

export interface TableOfContentsItem {
  title: string;
  items: Array<{
    name: string;
    page: number;
  }>;
}

export interface BusinessPlanSections {
  id: string,
  title: string,
}

const Content = ({ companyData }: ContentProps) => {
  const { businessName, idea, place, uniqueTags } = companyData;
  const [isCreatingBizPlan, setIsCreatingBizPlan] = useState(false);

  const {
    data: activeCompany,
    isLoading: isActiveCompanyDataLoading,
    error: activePlanError,
    refetch: refreshActivePlanData
  } = useActiveCompany();

  const {
    data: companyAdditionalData,
    isLoading: isAdditionalDataLoading,
  } = useCompanyAdditionalData(activeCompany?.id);

  const addBusinessPlan = useAddBusinessPlan();

  const convertRendererSectionsToPageFormat = (companyAdditionalData: CompanyAdditionalDataDto): {
    sections: { id: string; title: string; }[],
    pages: Page[]
  } => {
    const pages: Page[] = [
      // Document Section - Cover & TOC
      {
        id: 'cover',
        type: 'cover',
        title: 'Cover Page',
        pageNumber: 0,
        section: "document",
        blocks: [
          {
            id: 'logo-placeholder',
            type: 'image',
            content: 'LOGO',
            styles: {
              width: 100,
              height: 50,
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 40,
              borderRadius: 8,
              textAlign: 'center',
            },
            metadata: { imageSrc: 'logo' }
          },
          {
            id: 'business-name',
            type: 'heading',
            content: companyAdditionalData.business_plan.metadata.business_name,
            styles: {
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#001941',
              marginBottom: 8,
            },
            metadata: { level: 1 }
          },
          {
            id: 'business-plan-text',
            type: 'paragraph',
            content: 'BUSINESS PLAN',
            styles: {
              fontSize: 20,
              textAlign: 'center',
              color: '#666',
              marginBottom: 40,
            }
          },
          {
            id: 'divider',
            type: 'divider',
            content: '',
            styles: {
              width: '80%',
              height: 2,
              backgroundColor: '#001941',
              marginVertical: 30,
              alignSelf: 'center',
            }
          },
          {
            id: 'prepared-by',
            type: 'heading',
            content: 'PREPARED BY',
            styles: {
              fontSize: 16,
              textAlign: 'center',
              color: '#666',
              marginBottom: 8,
            },
            metadata: { level: 3 }
          },
          {
            id: 'prepared-name',
            type: 'paragraph',
            content: 'Jane Doe',
            styles: {
              fontSize: 20,
              fontWeight: '600',
              textAlign: 'center',
              color: '#001941',
              marginBottom: 40,
            }
          },
          {
            id: 'contact-info',
            type: 'list',
            content: [
              'NAME@EXAMPLE.COM',
              '416 656 1234',
              'EXAMPLE.COM',
              '123 ELM STREET, TORONTO, ON, M6V 1A1'
            ],
            styles: {
              alignItems: 'center',
              textAlign: 'center',
            },
            metadata: { listType: 'bullet' }
          },
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'toc',
        type: 'toc',
        title: 'Table of Contents',
        pageNumber: 1,
        section: "document",
        blocks: [
          {
            id: 'toc-title',
            type: 'heading',
            content: 'Table Of Contents',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#001941',
              marginBottom: 30,
            },
            metadata: { level: 1 }
          },
          {
            id: 'toc-content',
            type: 'table',
            content: tableOfContents,
            styles: {
              fontSize: 14,
              lineHeight: 20,
              color: '#333',
            }
          },
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },

      // Overview Section
      {
        id: 'executive-summary',
        type: 'content',
        pageNumber: 2,
        section: "overview",
        title: 'Executive Summary',
        blocks: [
          {
            id: 'es-title',
            type: 'heading',
            content: 'Executive Summary',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'es-subtitle',
            type: 'paragraph',
            content: `Executive summary for ${companyAdditionalData.business_plan.metadata.business_name}`,
            styles: {
              fontSize: 16,
              color: '#666',
              marginBottom: 20,
            }
          },
          {
            id: 'es-business-concept',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.overview?.executive_summary?.business_concept || 'Business concept not available',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-mission',
            type: 'heading',
            content: 'Mission Statement',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'es-mission-content',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.overview?.executive_summary?.mission_statement || 'Mission statement not available',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontStyle: 'italic',
            }
          },
          {
            id: 'es-vision',
            type: 'heading',
            content: 'Vision Statement',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'es-vision-content',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.overview?.executive_summary?.vision_statement || 'Vision statement not available',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-core-values',
            type: 'heading',
            content: 'Core Values',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'es-core-values-list',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.executive_summary?.core_values || ['Quality', 'Hospitality', 'Community', 'Authenticity'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'es-short-term-goals',
            type: 'heading',
            content: 'Short-term Goals (1 year)',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'es-short-term-1-3',
            type: 'paragraph',
            content: 'Months 1-3: ' + (companyAdditionalData.business_plan.overview?.executive_summary?.short_term_goals?.months_1_3?.join(', ') || 'Business registration, location setup, initial hiring'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-short-term-4-6',
            type: 'paragraph',
            content: 'Months 4-6: ' + (companyAdditionalData.business_plan.overview?.executive_summary?.short_term_goals?.months_4_6?.join(', ') || 'Soft opening, marketing campaigns, customer feedback collection'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-short-term-7-12',
            type: 'paragraph',
            content: 'Months 7-12: ' + (companyAdditionalData.business_plan.overview?.executive_summary?.short_term_goals?.months_7_12?.join(', ') || 'Achieve profitability, expand menu, establish loyalty program'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-long-term-goals',
            type: 'heading',
            content: 'Long-term Goals (5 years)',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'es-long-term-year1',
            type: 'paragraph',
            content: 'Year 1: ' + (companyAdditionalData.business_plan.overview?.executive_summary?.long_term_goals?.year_1?.join(', ') || 'Establish brand, build customer base'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-long-term-year2',
            type: 'paragraph',
            content: 'Year 2: ' + (companyAdditionalData.business_plan.overview?.executive_summary?.long_term_goals?.year_2?.join(', ') || 'Expand menu, increase revenue 30%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-long-term-year3',
            type: 'paragraph',
            content: 'Year 3: ' + (companyAdditionalData.business_plan.overview?.executive_summary?.long_term_goals?.year_3?.join(', ') || 'Open second location, develop franchise model'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-long-term-year4',
            type: 'paragraph',
            content: 'Year 4: ' + (companyAdditionalData.business_plan.overview?.executive_summary?.long_term_goals?.year_4?.join(', ') || 'Regional expansion, launch online store'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-long-term-year5',
            type: 'paragraph',
            content: 'Year 5: ' + (companyAdditionalData.business_plan.overview?.executive_summary?.long_term_goals?.year_5?.join(', ') || 'National brand, international consideration'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'es-unique-selling-proposition',
            type: 'heading',
            content: 'Unique Selling Proposition',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'es-unique-selling-content',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.overview?.executive_summary?.unique_selling_proposition || 'Handmade quality, local ingredients, cultural experience',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontStyle: 'italic',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'swot-analysis',
        type: 'content',
        title: 'SWOT Analysis',
        section: "overview",
        pageNumber: 3,
        blocks: [
          {
            id: 'swot-title',
            type: 'heading',
            content: 'SWOT Analysis',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 1 }
          },
          {
            id: 'swot-subtitle',
            type: 'paragraph',
            content: `SWOT analysis for ${companyAdditionalData.business_plan.metadata.business_name}`,
            styles: {
              fontSize: 16,
              color: '#666',
              marginBottom: 20,
            }
          },
          {
            id: 'strengths-title',
            type: 'heading',
            content: 'Strengths',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#2e7d32',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'strengths-internal-advantages',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.strengths?.internal_advantages || ['Skilled bakers', 'Quality ingredients', 'Unique recipes'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'strengths-competitive-edges',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.strengths?.competitive_edges || ['Cultural events', 'Book corner', 'Warm atmosphere'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'strengths-resources',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.strengths?.resources || ['Prime location', 'Experienced team', 'Local supplier relationships'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'strengths-capabilities',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.strengths?.capabilities || ['Menu innovation', 'Event organization', 'Customer service'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'weaknesses-title',
            type: 'heading',
            content: 'Weaknesses',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#c62828',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'weaknesses-internal-limitations',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.weaknesses?.internal_limitations || ['Limited seating', 'New brand', 'Small marketing budget'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'weaknesses-gaps',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.weaknesses?.gaps || ['No delivery service', 'Limited evening hours', 'Seasonal staff shortages'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'weaknesses-vulnerabilities',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.weaknesses?.vulnerabilities || ['Key staff dependency', 'Supplier price increases', 'Economic downturns'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'weaknesses-constraints',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.weaknesses?.constraints || ['Limited capital', 'Space constraints', 'Regulatory requirements'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'opportunities-title',
            type: 'heading',
            content: 'Opportunities',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#1565c0',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'opportunities-market',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.opportunities?.market_opportunities || ['Growing coffee culture', 'Tourism increase', 'Local food trend'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'opportunities-technological',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.opportunities?.technological_advancements || ['Online ordering', 'Social media marketing', 'Mobile payments'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'opportunities-partnership',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.opportunities?.partnership_potentials || ['Local artists', 'Book publishers', 'Tour agencies'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'opportunities-expansion',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.opportunities?.expansion_possibilities || ['Catering services', 'New locations', 'Product line expansion'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'threats-title',
            type: 'heading',
            content: 'Threats',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#ef6c00',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'threats-market',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.threats?.market_threats || ['New competitors', 'Changing tastes', 'Economic instability'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'threats-competitive',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.threats?.competitive_pressures || ['Price wars', 'Copycat concepts', 'Established chains'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'threats-regulatory',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.threats?.regulatory_risks || ['Health regulations', 'Tax changes', 'Licensing requirements'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'threats-economic',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.swot_analysis?.threats?.economic_factors || ['Inflation', 'Rising costs', 'Currency fluctuation'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'business-models',
        type: 'content',
        title: 'Business Models',
        section: "overview",
        pageNumber: 4,
        blocks: [
          {
            id: 'bm-title',
            type: 'heading',
            content: 'Business Models',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'bm-primary-title',
            type: 'heading',
            content: 'Primary Model',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bm-primary-name',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.overview?.business_models?.primary_model?.name || 'Coffee Shop & Bakery',
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bm-primary-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.overview?.business_models?.primary_model?.description || 'In-store sales of baked goods, coffee, and light meals with cultural events',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontStyle: 'italic',
            }
          },
          {
            id: 'bm-primary-revenue-streams',
            type: 'heading',
            content: 'Revenue Streams',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 10,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'bm-primary-revenue-list',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.business_models?.primary_model?.revenue_streams || ['Product sales', 'Event tickets', 'Catering services'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bm-primary-cost-structure',
            type: 'heading',
            content: 'Cost Structure',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 10,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'bm-primary-cost-list',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.business_models?.primary_model?.cost_structure || ['Ingredients', 'Labor', 'Rent', 'Marketing'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bm-primary-key-partners',
            type: 'heading',
            content: 'Key Partners',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 10,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'bm-primary-partners-list',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.business_models?.primary_model?.key_partners || ['Local farms', 'Coffee roasters', 'Artists', 'Bookstores'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bm-secondary-title',
            type: 'heading',
            content: 'Secondary Models',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bm-secondary-1-name',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.business_models?.secondary_models?.[0]?.name || 'Catering Services') +
              ' - ' + (companyAdditionalData.business_plan.overview?.business_models?.secondary_models?.[0]?.description || 'Provide baked goods for events'),
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bm-secondary-1-timeline',
            type: 'paragraph',
            content: 'Implementation Timeline: ' + (companyAdditionalData.business_plan.overview?.business_models?.secondary_models?.[0]?.implementation_timeline || '6-12 months'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bm-secondary-2-name',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.business_models?.secondary_models?.[1]?.name || 'Online Orders & Delivery') +
              ' - ' + (companyAdditionalData.business_plan.overview?.business_models?.secondary_models?.[1]?.description || 'Digital platform for orders and delivery'),
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
              marginTop: 10,
            }
          },
          {
            id: 'bm-secondary-2-timeline',
            type: 'paragraph',
            content: 'Implementation Timeline: ' + (companyAdditionalData.business_plan.overview?.business_models?.secondary_models?.[1]?.implementation_timeline || '12-18 months'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bm-hybrid-title',
            type: 'heading',
            content: 'Hybrid Approaches',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bm-hybrid-list',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.business_models?.hybrid_approaches || ['Event + Cafe', 'Subscription boxes', 'Workshops + Tastings'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'viability-analysis',
        type: 'content',
        title: 'Viability Analysis',
        section: "overview",
        pageNumber: 5,
        blocks: [
          {
            id: 'va-title',
            type: 'heading',
            content: 'Viability Analysis',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'va-market-title',
            type: 'heading',
            content: 'Market Viability',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'va-market-demand',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.overview?.viability_analysis?.market_viability?.demand_assessment || 'High demand for quality cafes with unique experiences',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'va-market-competitive',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.overview?.viability_analysis?.market_viability?.competitive_landscape || 'Competitive but our concept is differentiated',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'va-market-barriers',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.overview?.viability_analysis?.market_viability?.market_entry_barriers || 'Capital requirements, location scarcity, brand building',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'va-financial-title',
            type: 'heading',
            content: 'Financial Viability',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'va-financial-startup',
            type: 'paragraph',
            content: 'Startup Costs: ' + (companyAdditionalData.business_plan.overview?.viability_analysis?.financial_viability?.startup_costs || '$250,000 - $350,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'va-financial-break-even',
            type: 'paragraph',
            content: 'Break-even Analysis: ' + (companyAdditionalData.business_plan.overview?.viability_analysis?.financial_viability?.break_even_analysis || '12-18 months'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'va-financial-profitability',
            type: 'paragraph',
            content: 'Profitability Timeline: ' + (companyAdditionalData.business_plan.overview?.viability_analysis?.financial_viability?.profitability_timeline || '18-24 months'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'va-operational-title',
            type: 'heading',
            content: 'Operational Viability',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'va-operational-resources',
            type: 'paragraph',
            content: 'Resource Availability: ' + (companyAdditionalData.business_plan.overview?.viability_analysis?.operational_viability?.resource_availability || 'Local ingredients accessible, skilled labor available'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'va-operational-skills',
            type: 'paragraph',
            content: 'Skill Requirements: ' + (companyAdditionalData.business_plan.overview?.viability_analysis?.operational_viability?.skill_requirements || 'Baking, barista, management, event planning'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'va-operational-infrastructure',
            type: 'paragraph',
            content: 'Infrastructure Needs: ' + (companyAdditionalData.business_plan.overview?.viability_analysis?.operational_viability?.infrastructure_needs || 'Commercial kitchen, seating area, event space, POS system'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'va-risk-assessment',
            type: 'heading',
            content: 'Risk Assessment',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'va-risk-high',
            type: 'paragraph',
            content: 'High Risks: ' + (companyAdditionalData.business_plan.overview?.viability_analysis?.risk_assessment?.high_risks?.join(', ') || 'Competition, rising costs'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            }
          },
          {
            id: 'va-risk-medium',
            type: 'paragraph',
            content: 'Medium Risks: ' + (companyAdditionalData.business_plan.overview?.viability_analysis?.risk_assessment?.medium_risks?.join(', ') || 'Staff turnover, equipment failure'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#ef6c00',
            }
          },
          {
            id: 'va-risk-low',
            type: 'paragraph',
            content: 'Low Risks: ' + (companyAdditionalData.business_plan.overview?.viability_analysis?.risk_assessment?.low_risks?.join(', ') || 'Minor regulatory changes, seasonal fluctuations'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#2e7d32',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'legal-compliance',
        type: 'content',
        title: 'Legal Compliance',
        section: "overview",
        pageNumber: 6,
        blocks: [
          {
            id: 'lc-title',
            type: 'heading',
            content: 'Legal Compliance',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'lc-business-registration',
            type: 'heading',
            content: 'Business Registration',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'lc-legal-structure',
            type: 'paragraph',
            content: 'Legal Structure: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.business_registration?.legal_structure || 'LLC (Limited Liability Company)'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-registration-number',
            type: 'paragraph',
            content: 'Registration Number: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.business_registration?.registration_number || 'To be obtained'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-tax-id',
            type: 'paragraph',
            content: 'Tax ID: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.business_registration?.tax_identification_number || 'To be obtained'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-licenses-title',
            type: 'heading',
            content: 'Licenses & Permits',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'lc-license-1',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[0]?.license_name || 'Business License') +
              ' - Issuer: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[0]?.issuing_authority || 'City') +
              ', Cost: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[0]?.cost || '$500'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-license-2',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[1]?.license_name || 'Food Service Permit') +
              ' - Issuer: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[1]?.issuing_authority || 'Health Department') +
              ', Cost: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[1]?.cost || '$300'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-license-3',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[2]?.license_name || 'Alcohol License (optional)') +
              ' - Issuer: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[2]?.issuing_authority || 'State') +
              ', Cost: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[2]?.cost || '$1,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-tax-obligations',
            type: 'heading',
            content: 'Tax Obligations',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'lc-tax-vat',
            type: 'paragraph',
            content: 'VAT Registration: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.tax_obligations?.vat_registration || 'Required if revenue exceeds threshold'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-tax-income',
            type: 'paragraph',
            content: 'Income Tax: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.tax_obligations?.income_tax || 'Corporate rate 20%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-tax-payroll',
            type: 'paragraph',
            content: 'Payroll Taxes: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.tax_obligations?.payroll_taxes || '15% of payroll'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-tax-schedule',
            type: 'paragraph',
            content: 'Filing Schedule: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.tax_obligations?.tax_filing_schedule || 'Quarterly estimates, annual return'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-insurance-title',
            type: 'heading',
            content: 'Insurance Requirements',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'lc-insurance-1',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements?.[0]?.insurance_type || 'General Liability') +
              ' - Coverage: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements?.[0]?.coverage_amount || '$1M') +
              ', Premium: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements?.[0]?.premium_cost || '$2,000/year'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-insurance-2',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements?.[1]?.insurance_type || 'Property Insurance') +
              ' - Coverage: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements?.[1]?.coverage_amount || '$500K') +
              ', Premium: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements?.[1]?.premium_cost || '$1,500/year'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'lc-insurance-3',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements?.[2]?.insurance_type || 'Workers Compensation') +
              ' - Coverage: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements?.[2]?.coverage_amount || 'Statutory') +
              ', Premium: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements?.[2]?.premium_cost || 'Based on payroll'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },

      // Market Research Section
      {
        id: 'industry-overview',
        type: 'content',
        title: 'Industry Overview',
        section: "market-research",
        pageNumber: 7,
        blocks: [
          {
            id: 'io-title',
            type: 'heading',
            content: 'Industry Overview',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'io-overview',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.market_research?.industry_analysis?.industry_overview || 'The coffee shop and bakery industry continues to grow with increasing demand for artisanal products and unique experiences.',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'io-key-players',
            type: 'heading',
            content: 'Key Industry Players',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'io-players-list',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.industry_analysis?.key_industry_players || ['Local chains', 'Independent cafes', 'Specialty bakeries'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'io-trends-title',
            type: 'heading',
            content: 'Industry Trends',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'io-trends-current',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.industry_analysis?.industry_trends?.current_trends || ['Artisanal coffee', 'Plant-based options', 'Experiential retail'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'io-trends-emerging',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.industry_analysis?.industry_trends?.emerging_trends || ['Ghost kitchens', 'Subscription models', 'Sustainable practices'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'io-trends-future',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.industry_analysis?.industry_trends?.future_predictions || ['AI personalization', 'Drone delivery', 'Virtual events'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'io-regulatory',
            type: 'paragraph',
            content: 'Regulatory Environment: ' + (companyAdditionalData.business_plan.market_research?.industry_analysis?.regulatory_environment || 'Increasing focus on food safety and sustainability'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'io-technological',
            type: 'paragraph',
            content: 'Technological Impact: ' + (companyAdditionalData.business_plan.market_research?.industry_analysis?.technological_impact || 'Digital ordering, loyalty apps, social media marketing'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'target-audience',
        type: 'content',
        title: 'Target Audience',
        section: "market-research",
        pageNumber: 8,
        blocks: [
          {
            id: 'ta-title',
            type: 'heading',
            content: 'Target Audience',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'ta-demographics-title',
            type: 'heading',
            content: 'Demographics',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ta-age',
            type: 'paragraph',
            content: 'Age Distribution: 13-17: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.age_distribution?.teenagers_13_17 || '5%') +
              ', 18-25: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.age_distribution?.young_adults_18_25 || '30%') +
              ', 26-35: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.age_distribution?.adults_26_35 || '35%') +
              ', 36-50: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.age_distribution?.middle_aged_36_50 || '20%') +
              ', 51+: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.age_distribution?.seniors_51_plus || '10%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ta-gender',
            type: 'paragraph',
            content: 'Gender: Male: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.gender_distribution?.male || '45%') +
              ', Female: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.gender_distribution?.female || '50%') +
              ', Other: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.gender_distribution?.other || '5%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ta-income',
            type: 'paragraph',
            content: 'Income: Low: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.income_levels?.low_income || '15%') +
              ', Middle: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.income_levels?.middle_income || '60%') +
              ', High: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.income_levels?.high_income || '25%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ta-geography',
            type: 'paragraph',
            content: 'Location: Urban: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.geographic_distribution?.urban || '70%') +
              ', Suburban: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.geographic_distribution?.suburban || '25%') +
              ', Rural: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.geographic_distribution?.rural || '5%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ta-education',
            type: 'paragraph',
            content: 'Education: High School: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.education_levels?.high_school || '15%') +
              ', College: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.education_levels?.college || '25%') +
              ', University: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.education_levels?.university || '40%') +
              ', Postgraduate: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.demographics?.education_levels?.postgraduate || '20%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ta-psychographics-title',
            type: 'heading',
            content: 'Psychographics',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ta-lifestyle',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.psychographics?.lifestyle_patterns || ['Urban professionals', 'Students', 'Remote workers', 'Culture enthusiasts'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-values',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.psychographics?.values_beliefs || ['Quality over quantity', 'Support local', 'Community engagement'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-interests',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.psychographics?.interests_hobbies || ['Reading', 'Art', 'Music', 'Food exploration'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-personality',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.psychographics?.personality_traits || ['Open-minded', 'Curious', 'Social', 'Creative'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-buying-behavior',
            type: 'heading',
            content: 'Buying Behavior',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ta-purchase-frequency',
            type: 'paragraph',
            content: 'Purchase Frequency: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.psychographics?.buying_behavior?.purchase_frequency || '2-3 times per week'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ta-spending-habits',
            type: 'paragraph',
            content: 'Spending Habits: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.psychographics?.buying_behavior?.spending_habits || '$10-25 per visit'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ta-brand-loyalty',
            type: 'paragraph',
            content: 'Brand Loyalty: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.psychographics?.buying_behavior?.brand_loyalty || 'High when experience is unique'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ta-needs-analysis',
            type: 'heading',
            content: 'Needs Analysis',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ta-functional-needs',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.needs_analysis?.functional_needs || ['Quality coffee', 'Fresh baked goods', 'Comfortable seating', 'Reliable WiFi'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-emotional-needs',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.needs_analysis?.emotional_needs || ['Relaxation', 'Sense of community', 'Inspiration', 'Escape'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-social-needs',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.needs_analysis?.social_needs || ['Meeting friends', 'Networking', 'Cultural events', 'Group activities'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-unmet-needs',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.needs_analysis?.unmet_needs || ['Cultural cafe experience', 'Book corner', 'Local art showcases'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-pain-points',
            type: 'heading',
            content: 'Pain Points',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ta-current-pain-points',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.pain_points?.current_pain_points || ['Crowded cafes', 'Inconsistent quality', 'No cultural events'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-anticipated-pain-points',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.target_audience?.pain_points?.anticipated_pain_points || ['Price increases', 'Reduced hours', 'Limited menu options'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#ef6c00',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ta-pain-point-severity-mild',
            type: 'paragraph',
            content: 'Mild: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.pain_points?.pain_point_severity?.mild?.join(', ') || 'Wait times, parking challenges'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#2e7d32',
            }
          },
          {
            id: 'ta-pain-point-severity-moderate',
            type: 'paragraph',
            content: 'Moderate: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.pain_points?.pain_point_severity?.moderate?.join(', ') || 'Limited seating, occasional quality issues'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#ef6c00',
            }
          },
          {
            id: 'ta-pain-point-severity-severe',
            type: 'paragraph',
            content: 'Severe: ' + (companyAdditionalData.business_plan.market_research?.target_audience?.pain_points?.pain_point_severity?.severe?.join(', ') || 'Food safety concerns, consistently poor service'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'market-size-trends',
        type: 'content',
        title: 'Market Size & Trends',
        section: "market-research",
        pageNumber: 9,
        blocks: [
          {
            id: 'mst-title',
            type: 'heading',
            content: 'Market Size & Trends',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'mst-current-size',
            type: 'heading',
            content: 'Current Market Size',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'mst-local',
            type: 'paragraph',
            content: 'Local: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.current_market_size?.local || '$50M annual revenue'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-regional',
            type: 'paragraph',
            content: 'Regional: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.current_market_size?.regional || '$200M annual revenue'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-national',
            type: 'paragraph',
            content: 'National: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.current_market_size?.national || '$5B annual revenue'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-tam',
            type: 'paragraph',
            content: 'Total Addressable Market: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.current_market_size?.total_addressable_market || 'All coffee drinkers in region'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-sam',
            type: 'paragraph',
            content: 'Serviceable Available Market: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.current_market_size?.serviceable_available_market || 'Cafe-goers within 5 miles'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-som',
            type: 'paragraph',
            content: 'Serviceable Obtainable Market: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.current_market_size?.serviceable_obtainable_market || '5-10% of SAM in year 1'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-growth-title',
            type: 'heading',
            content: 'Growth Metrics',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'mst-growth-historical',
            type: 'paragraph',
            content: 'Historical Growth Rate: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.growth_metrics?.historical_growth_rate || '5-7% annually'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-growth-projected',
            type: 'paragraph',
            content: 'Projected Growth Rate: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.growth_metrics?.projected_growth_rate || '8-10% annually'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-growth-cagr',
            type: 'paragraph',
            content: 'CAGR: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.growth_metrics?.compound_annual_growth_rate || '7.5%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-market-trends',
            type: 'heading',
            content: 'Market Trends',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'mst-seasonal-trends',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.market_size_trends?.market_trends?.seasonal_trends || ['Summer: cold brew peak', 'Winter: hot drinks focus', 'Holiday: special editions'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'mst-cyclical-trends',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.market_size_trends?.market_trends?.cyclical_trends || ['Morning rush', 'Afternoon slump', 'Weekend leisure'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'mst-secular-trends',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.market_size_trends?.market_trends?.secular_trends || ['Health consciousness', 'Sustainability', 'Experience economy'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'mst-forecast-title',
            type: 'heading',
            content: 'Forecast Analysis',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'mst-forecast-optimistic',
            type: 'paragraph',
            content: 'Optimistic Scenario: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.forecast_analysis?.optimistic_scenario || '20% revenue growth, rapid expansion'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#2e7d32',
            }
          },
          {
            id: 'mst-forecast-pessimistic',
            type: 'paragraph',
            content: 'Pessimistic Scenario: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.forecast_analysis?.pessimistic_scenario || '5% growth, market challenges'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            }
          },
          {
            id: 'mst-forecast-realistic',
            type: 'paragraph',
            content: 'Realistic Scenario: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.forecast_analysis?.realistic_scenario || '10-15% growth, steady expansion'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-quarterly-projections',
            type: 'heading',
            content: 'Quarterly Projections (Year 1)',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 10,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'mst-q1',
            type: 'paragraph',
            content: 'Q1: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.forecast_analysis?.quarterly_projections?.q1_2024 || '$100,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-q2',
            type: 'paragraph',
            content: 'Q2: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.forecast_analysis?.quarterly_projections?.q2_2024 || '$125,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-q3',
            type: 'paragraph',
            content: 'Q3: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.forecast_analysis?.quarterly_projections?.q3_2024 || '$150,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mst-q4',
            type: 'paragraph',
            content: 'Q4: ' + (companyAdditionalData.business_plan.market_research?.market_size_trends?.forecast_analysis?.quarterly_projections?.q4_2024 || '$175,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'competitor-analysis',
        type: 'content',
        title: 'Competitor Analysis',
        section: "market-research",
        pageNumber: 10,
        blocks: [
          {
            id: 'ca-title',
            type: 'heading',
            content: 'Competitor Analysis',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'ca-direct-title',
            type: 'heading',
            content: 'Direct Competitors',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ca-competitor-1',
            type: 'heading',
            content: (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[0]?.name || 'The Green Bean'),
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 10,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'ca-competitor-1-market-share',
            type: 'paragraph',
            content: 'Market Share: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[0]?.market_share || '15%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-competitor-1-strengths',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[0]?.strengths || ['Established brand', 'Loyal customer base', 'Prime locations'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#2e7d32',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ca-competitor-1-weaknesses',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[0]?.weaknesses || ['Higher prices', 'Limited cultural events', 'Standard menu'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ca-competitor-1-pricing',
            type: 'paragraph',
            content: 'Pricing Strategy: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[0]?.pricing_strategy || 'Premium pricing'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-competitor-1-target',
            type: 'paragraph',
            content: 'Target Audience: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[0]?.target_audience || 'Affluent professionals, tourists'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-competitor-2',
            type: 'heading',
            content: (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[1]?.name || 'Artbridge Cafe'),
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'ca-competitor-2-market-share',
            type: 'paragraph',
            content: 'Market Share: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[1]?.market_share || '8%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-competitor-2-strengths',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[1]?.strengths || ['Art gallery attached', 'Cultural reputation', 'Historic location'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#2e7d32',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ca-competitor-2-weaknesses',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[1]?.weaknesses || ['Limited food menu', 'Inconsistent events', 'Outdated interior'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ca-competitor-2-pricing',
            type: 'paragraph',
            content: 'Pricing Strategy: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[1]?.pricing_strategy || 'Mid-range pricing'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-competitor-2-target',
            type: 'paragraph',
            content: 'Target Audience: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[1]?.target_audience || 'Art lovers, students, tourists'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-competitor-3',
            type: 'heading',
            content: (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[2]?.name || 'Louis Charden'),
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'ca-competitor-3-market-share',
            type: 'paragraph',
            content: 'Market Share: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[2]?.market_share || '12%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-competitor-3-strengths',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[2]?.strengths || ['French pastries', 'Elegant atmosphere', 'International brand'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#2e7d32',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ca-competitor-3-weaknesses',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[2]?.weaknesses || ['Very expensive', 'Not local', 'Formal atmosphere'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ca-competitor-3-pricing',
            type: 'paragraph',
            content: 'Pricing Strategy: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[2]?.pricing_strategy || 'Premium pricing'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-competitor-3-target',
            type: 'paragraph',
            content: 'Target Audience: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.direct_competitors?.[2]?.target_audience || 'Upscale clientele, business meetings'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-indirect-title',
            type: 'heading',
            content: 'Indirect Competitors',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ca-indirect-1',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.market_research?.competitor_analysis?.indirect_competitors?.[0]?.name || 'Local Bakeries') +
              ' - Threat: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.indirect_competitors?.[0]?.competitive_threat || 'Moderate - they sell baked goods but no cafe experience'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-indirect-2',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.market_research?.competitor_analysis?.indirect_competitors?.[1]?.name || 'Fast Food Chains') +
              ' - Threat: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.indirect_competitors?.[1]?.competitive_threat || 'Low - different customer experience'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-indirect-3',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.market_research?.competitor_analysis?.indirect_competitors?.[2]?.name || 'Tea Houses') +
              ' - Threat: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.indirect_competitors?.[2]?.competitive_threat || 'Low - different beverage focus'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-competitive-matrix',
            type: 'heading',
            content: 'Competitive Matrix',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ca-matrix-price',
            type: 'paragraph',
            content: 'Price Comparison: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.competitive_matrix?.price_comparison || 'Competitive with mid-range pricing'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-matrix-quality',
            type: 'paragraph',
            content: 'Quality Comparison: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.competitive_matrix?.quality_comparison || 'High quality with local ingredients'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-matrix-service',
            type: 'paragraph',
            content: 'Service Comparison: ' + (companyAdditionalData.business_plan.market_research?.competitor_analysis?.competitive_matrix?.service_comparison || 'Personalized, warm service'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ca-swot-comparison',
            type: 'heading',
            content: 'SWOT Comparison',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ca-swot-our-strengths',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.competitor_analysis?.swot_comparison?.our_strengths || ['Unique cultural concept', 'Local ingredients', 'Community focus'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#2e7d32',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ca-swot-competitor-weaknesses',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.competitor_analysis?.swot_comparison?.competitor_weaknesses || ['Lack of cultural events', 'Non-local ingredients', 'Generic atmosphere'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ca-swot-gaps',
            type: 'list',
            content: companyAdditionalData.business_plan.market_research?.competitor_analysis?.swot_comparison?.competitive_gaps || ['Cultural cafe niche', 'Book corner', 'Local art showcases'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#1565c0',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },

      // Products & Services Section
      {
        id: 'core-offering',
        type: 'content',
        title: 'Core Offering',
        section: "products-services",
        pageNumber: 11,
        blocks: [
          {
            id: 'co-title',
            type: 'heading',
            content: 'Core Offering',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'co-product-1-title',
            type: 'heading',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[0]?.name || 'Artisan Breads',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 5,
            },
            metadata: { level: 2 }
          },
          {
            id: 'co-product-1-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[0]?.description || 'Freshly baked artisan breads made with local flour and traditional techniques',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontStyle: 'italic',
            }
          },
          {
            id: 'co-product-1-features',
            type: 'list',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[0]?.features || ['Sourdough', 'Baguettes', 'Multigrain', 'Rye'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'co-product-1-benefits',
            type: 'list',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[0]?.benefits || ['Fresh daily', 'No preservatives', 'Local ingredients'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'co-product-1-target',
            type: 'paragraph',
            content: 'Target Customer: ' + (companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[0]?.target_customer || 'Bread enthusiasts, local families'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'co-product-1-pricing',
            type: 'paragraph',
            content: 'Price: ' + (companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[0]?.detailed_pricing?.retail_price || '$4-8 per loaf'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'co-product-2-title',
            type: 'heading',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[1]?.name || 'Signature Pastries',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 5,
            },
            metadata: { level: 2 }
          },
          {
            id: 'co-product-2-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[1]?.description || 'Handcrafted pastries with unique local flavors and traditional recipes',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontStyle: 'italic',
            }
          },
          {
            id: 'co-product-2-features',
            type: 'list',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[1]?.features || ['Croissants', 'Danishes', 'Scones', 'Cookies'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'co-product-2-benefits',
            type: 'list',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[1]?.benefits || ['Made from scratch', 'Seasonal varieties', 'Perfect with coffee'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'co-product-3-title',
            type: 'heading',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[2]?.name || 'Specialty Coffee',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 5,
            },
            metadata: { level: 2 }
          },
          {
            id: 'co-product-3-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[2]?.description || 'Premium coffee sourced from sustainable farms, roasted locally',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontStyle: 'italic',
            }
          },
          {
            id: 'co-product-3-features',
            type: 'list',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[2]?.features || ['Espresso drinks', 'Pour-over', 'Cold brew', 'Seasonal specials'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'co-product-3-benefits',
            type: 'list',
            content: companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[2]?.benefits || ['Ethically sourced', 'Expertly roasted', 'Consistent quality'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'co-product-3-target',
            type: 'paragraph',
            content: 'Target Customer: ' + (companyAdditionalData.business_plan.products_services?.product_line?.core_products?.[2]?.target_customer || 'Coffee connoisseurs, daily drinkers'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'expansion-opportunities',
        type: 'content',
        title: 'Expansion Opportunities',
        section: "products-services",
        pageNumber: 12,
        blocks: [
          {
            id: 'eo-title',
            type: 'heading',
            content: 'Expansion Opportunities',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'eo-secondary-products',
            type: 'heading',
            content: 'Secondary Products',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'eo-secondary-1',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.products_services?.product_line?.secondary_products?.[0]?.name || 'Packaged Goods') +
              ' - ' + (companyAdditionalData.business_plan.products_services?.product_line?.secondary_products?.[0]?.description || 'Coffee beans, jams, and baked goods for take-home'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'eo-secondary-2',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.products_services?.product_line?.secondary_products?.[1]?.name || 'Gift Baskets') +
              ' - ' + (companyAdditionalData.business_plan.products_services?.product_line?.secondary_products?.[1]?.description || 'Curated selections of our products for gifting'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'eo-secondary-3',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.products_services?.product_line?.secondary_products?.[2]?.name || 'Merchandise') +
              ' - ' + (companyAdditionalData.business_plan.products_services?.product_line?.secondary_products?.[2]?.description || 'Branded mugs, t-shirts, and tote bags'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'eo-future-products',
            type: 'heading',
            content: 'Future Products',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'eo-future-1',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.products_services?.product_line?.future_products?.[0]?.name || 'Seasonal Menu Items') +
              ' - Launch: ' + (companyAdditionalData.business_plan.products_services?.product_line?.future_products?.[0]?.expected_launch || 'Quarterly rotation'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'eo-future-1-concept',
            type: 'paragraph',
            content: 'Concept: ' + (companyAdditionalData.business_plan.products_services?.product_line?.future_products?.[0]?.concept || 'Limited-time offerings featuring seasonal ingredients'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontStyle: 'italic',
            }
          },
          {
            id: 'eo-future-2',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.products_services?.product_line?.future_products?.[1]?.name || 'Gluten-Free Line') +
              ' - Launch: ' + (companyAdditionalData.business_plan.products_services?.product_line?.future_products?.[1]?.expected_launch || 'Year 2'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'eo-future-2-concept',
            type: 'paragraph',
            content: 'Concept: ' + (companyAdditionalData.business_plan.products_services?.product_line?.future_products?.[1]?.concept || 'Dedicated gluten-free baked goods section'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontStyle: 'italic',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'secondary-offering',
        type: 'content',
        title: 'Secondary Offering',
        section: "products-services",
        pageNumber: 13,
        blocks: [
          {
            id: 'so-title',
            type: 'heading',
            content: 'Secondary Offering',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'so-services-title',
            type: 'heading',
            content: 'Service Offerings',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'so-core-services',
            type: 'heading',
            content: 'Core Services',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 10,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'so-core-1-name',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.core_services?.[0]?.name || 'Dine-in Experience',
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-core-1-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.core_services?.[0]?.description || 'Full-service cafe with comfortable seating and book corner',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-core-1-delivery',
            type: 'paragraph',
            content: 'Delivery Method: ' + (companyAdditionalData.business_plan.products_services?.service_offerings?.core_services?.[0]?.delivery_method || 'In-person service'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-core-1-pricing-tiers',
            type: 'list',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.core_services?.[0]?.pricing_tiers?.map(tier => tier.tier_name + ': ' + tier.price) || ['Standard menu pricing'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'so-core-2-name',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.core_services?.[1]?.name || 'Take-out Service',
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
              marginTop: 10,
            }
          },
          {
            id: 'so-core-2-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.core_services?.[1]?.description || 'Quick service for customers on the go',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-core-2-delivery',
            type: 'paragraph',
            content: 'Delivery Method: ' + (companyAdditionalData.business_plan.products_services?.service_offerings?.core_services?.[1]?.delivery_method || 'Counter service'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-premium-services',
            type: 'heading',
            content: 'Premium Services',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'so-premium-1-name',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.premium_services?.[0]?.name || 'Cultural Events',
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-premium-1-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.premium_services?.[0]?.description || 'Ticketed events featuring local artists, authors, and musicians',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-premium-1-pricing',
            type: 'paragraph',
            content: 'Price: ' + (companyAdditionalData.business_plan.products_services?.service_offerings?.premium_services?.[0]?.premium_pricing || '$10-25 per event'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-premium-1-value',
            type: 'paragraph',
            content: 'Value Added: ' + (companyAdditionalData.business_plan.products_services?.service_offerings?.premium_services?.[0]?.value_added || 'Unique cultural experience, community building'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-premium-2-name',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.premium_services?.[1]?.name || 'Private Events',
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
              marginTop: 10,
            }
          },
          {
            id: 'so-premium-2-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.premium_services?.[1]?.description || 'Venue rental for private parties and corporate events',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-premium-2-pricing',
            type: 'paragraph',
            content: 'Price: ' + (companyAdditionalData.business_plan.products_services?.service_offerings?.premium_services?.[1]?.premium_pricing || '$200-500 flat fee + catering'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-custom-services',
            type: 'heading',
            content: 'Custom Services',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'so-custom-1-name',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.custom_services?.[0]?.name || 'Custom Cake Orders',
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-custom-1-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.products_services?.service_offerings?.custom_services?.[0]?.description || 'Personalized cakes for weddings, birthdays, and special occasions',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-custom-1-min-order',
            type: 'paragraph',
            content: 'Minimum Order: ' + (companyAdditionalData.business_plan.products_services?.service_offerings?.custom_services?.[0]?.minimum_order || '48 hours notice'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-custom-1-pricing',
            type: 'paragraph',
            content: 'Pricing Model: ' + (companyAdditionalData.business_plan.products_services?.service_offerings?.custom_services?.[0]?.pricing_model || 'Based on size and complexity'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'so-custom-1-quote',
            type: 'paragraph',
            content: 'Quotation Process: ' + (companyAdditionalData.business_plan.products_services?.service_offerings?.custom_services?.[0]?.quotation_process || 'In-person consultation, design approval, deposit required'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'customer-service',
        type: 'content',
        title: 'Customer Service',
        section: "products-services",
        pageNumber: 14,
        blocks: [
          {
            id: 'cs-title',
            type: 'heading',
            content: 'Customer Service',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'cs-support-channels',
            type: 'heading',
            content: 'Support Channels',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cs-phone',
            type: 'paragraph',
            content: 'Phone Support: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.support_channels?.phone_support || 'Available during business hours: (555) 123-4567'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-email',
            type: 'paragraph',
            content: 'Email Support: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.support_channels?.email_support || 'support@cozycrumb.com - 24hr response'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-social',
            type: 'paragraph',
            content: 'Social Media Support: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.support_channels?.social_media_support || 'Active on Facebook & Instagram, response within 2 hours'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-live-chat',
            type: 'paragraph',
            content: 'Live Chat: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.support_channels?.live_chat || 'Available on website during peak hours'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-sla',
            type: 'heading',
            content: 'Service Level Agreements',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cs-response-time',
            type: 'paragraph',
            content: 'Response Time: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.service_level_agreements?.response_time || 'Within 24 hours for all inquiries'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-resolution-time',
            type: 'paragraph',
            content: 'Resolution Time: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.service_level_agreements?.resolution_time || 'Within 48 hours for most issues'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-availability',
            type: 'paragraph',
            content: 'Availability: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.service_level_agreements?.availability || 'In-person during business hours, digital 24/7 for non-urgent'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-feedback',
            type: 'heading',
            content: 'Customer Feedback Systems',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cs-feedback-forms',
            type: 'paragraph',
            content: 'Feedback Forms: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.customer_feedback_systems?.feedback_forms || 'In-store cards and digital surveys'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-review-platforms',
            type: 'paragraph',
            content: 'Review Platforms: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.customer_feedback_systems?.review_platforms || 'Google, Yelp, TripAdvisor monitored weekly'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-satisfaction-surveys',
            type: 'paragraph',
            content: 'Satisfaction Surveys: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.customer_feedback_systems?.customer_satisfaction_surveys || 'Quarterly email surveys to loyalty members'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-complaint-resolution',
            type: 'heading',
            content: 'Complaint Resolution Process',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cs-escalation',
            type: 'paragraph',
            content: 'Escalation Procedures: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.complaint_resolution_process?.escalation_procedures || 'Staff -> Manager -> Owner for unresolved issues'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-refund-policies',
            type: 'paragraph',
            content: 'Refund Policies: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.complaint_resolution_process?.refund_policies || 'Full refund or replacement for quality issues'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cs-recovery-strategies',
            type: 'paragraph',
            content: 'Customer Recovery Strategies: ' + (companyAdditionalData.business_plan.sales_marketing?.customer_service?.complaint_resolution_process?.customer_recovery_strategies || 'Apology, compensation offer, follow-up'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },

      // Sales & Marketing Section
      {
        id: 'marketing-overview',
        type: 'content',
        title: 'Marketing Overview',
        section: "sales-marketing",
        pageNumber: 15,
        blocks: [
          {
            id: 'mo-title',
            type: 'heading',
            content: 'Marketing Overview',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'mo-positioning',
            type: 'heading',
            content: 'Positioning Statement',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'mo-positioning-text',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.positioning_statement || 'A cozy cultural cafe offering artisanal baked goods and coffee with a unique community-focused experience',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontStyle: 'italic',
            }
          },
          {
            id: 'mo-value-proposition',
            type: 'heading',
            content: 'Value Proposition',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'mo-value-text',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.value_proposition || 'Fresh, local ingredients meet cultural experiences in a warm, welcoming space',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-messaging-framework',
            type: 'heading',
            content: 'Messaging Framework',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'mo-core-messages',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.messaging_framework?.core_messages || ['Fresh daily', 'Local love', 'Culture meets coffee', 'Your community corner'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'mo-tone-of-voice',
            type: 'paragraph',
            content: 'Tone of Voice: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.messaging_framework?.tone_of_voice || 'Warm, inviting, authentic, knowledgeable'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-brand-personality',
            type: 'paragraph',
            content: 'Brand Personality: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.messaging_framework?.brand_personality || 'Friendly, artistic, community-focused, genuine'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-marketing-mix',
            type: 'heading',
            content: 'Marketing Mix',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'mo-product-strategy',
            type: 'paragraph',
            content: 'Product Strategy: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_mix?.product_strategy || 'High-quality artisanal products with seasonal rotation'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-price-strategy',
            type: 'paragraph',
            content: 'Price Strategy: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_mix?.price_strategy || 'Mid-premium pricing reflecting quality and experience'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-place-strategy',
            type: 'paragraph',
            content: 'Place Strategy: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_mix?.place_strategy || 'Central location with cozy atmosphere and book corner'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-promotion-strategy',
            type: 'paragraph',
            content: 'Promotion Strategy: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_mix?.promotion_strategy || 'Social media, local partnerships, events, and word-of-mouth'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-campaign-details',
            type: 'heading',
            content: 'Campaign Details',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'mo-launch-campaign',
            type: 'paragraph',
            content: 'Launch Campaign Budget: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_campaign_details?.specific_campaign_budgets?.launch_campaign || '$10,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-seasonal-campaign',
            type: 'paragraph',
            content: 'Seasonal Campaign Budget: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_campaign_details?.specific_campaign_budgets?.seasonal_campaign || '$3,000 per season'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-digital-campaign',
            type: 'paragraph',
            content: 'Digital Campaign Budget: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_campaign_details?.specific_campaign_budgets?.digital_campaign || '$2,000 per month'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-agency-fees',
            type: 'paragraph',
            content: 'Agency Fees: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_campaign_details?.agency_fees || '$1,500 per month for social media management'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'mo-promotional-materials',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_campaign_details?.promotional_materials_costs ?
              [
                'Printing: ' + companyAdditionalData.business_plan.sales_marketing.marketing_strategy.marketing_campaign_details.promotional_materials_costs.printing_costs,
                'Merchandise: ' + companyAdditionalData.business_plan.sales_marketing.marketing_strategy.marketing_campaign_details.promotional_materials_costs.merchandise_costs,
                'Display: ' + companyAdditionalData.business_plan.sales_marketing.marketing_strategy.marketing_campaign_details.promotional_materials_costs.display_materials
              ] : ['Printing: $500', 'Merchandise: $1,000', 'Display: $300'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'mo-event-sponsorship',
            type: 'paragraph',
            content: 'Event Sponsorship Costs: ' + (companyAdditionalData.business_plan.sales_marketing?.marketing_strategy?.marketing_campaign_details?.event_sponsorship_costs || '$2,000 per year'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'branding-identity',
        type: 'content',
        title: 'Branding & Identity',
        section: "sales-marketing",
        pageNumber: 16,
        blocks: [
          {
            id: 'bi-title',
            type: 'heading',
            content: 'Branding & Identity',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'bi-brand-voice',
            type: 'heading',
            content: 'Brand Voice',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bi-tone',
            type: 'paragraph',
            content: 'Tone: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_voice?.tone || 'Warm, inviting, professional, cultural'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bi-language',
            type: 'paragraph',
            content: 'Language Style: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_voice?.language_style || 'Clear, engaging, authentic, bilingual (Armenian/English)'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bi-communication',
            type: 'paragraph',
            content: 'Communication Style: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_voice?.communication_style || 'Personal, responsive, community-focused'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bi-brand-identity',
            type: 'heading',
            content: 'Visual Identity',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bi-logo',
            type: 'paragraph',
            content: 'Logo Design: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_identity?.logo_design || 'Modern yet traditional, incorporating coffee cup and book elements'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bi-colors',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_identity?.color_palette || ['Warm brown (#8B4513)', 'Cream (#FFFDD0)', 'Deep burgundy (#800020)', 'Soft gold (#D4AF37)'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bi-typography',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_identity?.typography || ['Playfair Display for headings', 'Lato for body text', 'Armenian traditional fonts for cultural events'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bi-visual-elements',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_identity?.visual_elements || ['Coffee bean motifs', 'Book illustrations', 'Armenian pomegranate designs', 'Warm wood textures'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bi-positioning',
            type: 'heading',
            content: 'Brand Positioning',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bi-market-position',
            type: 'paragraph',
            content: 'Market Position: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_positioning?.market_position || 'Premium yet accessible cultural cafe in the heart of Yerevan'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bi-differentiation',
            type: 'paragraph',
            content: 'Competitive Differentiation: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_positioning?.competitive_differentiation || 'Unique blend of high-quality baked goods, coffee, and cultural experiences'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bi-target-perception',
            type: 'paragraph',
            content: 'Target Perception: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.brand_positioning?.target_perception || 'A warm, welcoming space for relaxation, work, and cultural enrichment'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bi-community',
            type: 'heading',
            content: 'Community Engagement',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bi-local-sponsorship',
            type: 'paragraph',
            content: 'Local Sponsorship Budget: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.community_engagement?.local_sponsorship_budget || '$2,000 annually for local events'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bi-charity',
            type: 'paragraph',
            content: 'Charity Donations: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.community_engagement?.charity_donations || '$1,000 annually to local causes'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bi-community-events',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.brand_development?.community_engagement?.community_events ?
              [companyAdditionalData.business_plan.sales_marketing.brand_development.community_engagement.community_events] :
              ['Monthly poetry readings', 'Local artist exhibitions', 'Book club meetings', 'Cultural holiday celebrations'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bi-pr-costs',
            type: 'paragraph',
            content: 'Public Relations Costs: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.community_engagement?.public_relations_costs || '$500 monthly for PR activities'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'customer-retention',
        type: 'content',
        title: 'Customer Retention',
        section: "sales-marketing",
        pageNumber: 17,
        blocks: [
          {
            id: 'cr-title',
            type: 'heading',
            content: 'Customer Retention',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'cr-loyalty-programs',
            type: 'heading',
            content: 'Loyalty Programs',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cr-loyalty-description',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.sales_marketing?.customer_service?.complaint_resolution_process?.customer_recovery_strategies ||
              'Points-based system: 10 points per $1 spent, 100 points = $5 off. Birthday rewards, exclusive event access for members.',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cr-loyalty-tiers',
            type: 'list',
            content: ['Bronze: 0-500 points - 5% off', 'Silver: 501-1000 points - 10% off', 'Gold: 1000+ points - 15% off + exclusive events'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'cr-engagement',
            type: 'heading',
            content: 'Customer Engagement',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cr-engagement-list',
            type: 'list',
            content: [
              'Regular email newsletters with recipes and stories',
              'Social media engagement: polls, Q&As, behind-the-scenes',
              'Special events for loyal customers: tasting evenings',
              'Personalized offers based on purchase history'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'cr-newsletter-frequency',
            type: 'paragraph',
            content: 'Newsletter Frequency: Weekly with special updates',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cr-feedback',
            type: 'heading',
            content: 'Feedback Implementation',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cr-feedback-process',
            type: 'paragraph',
            content: 'Customer feedback is collected through multiple channels and reviewed weekly. Changes are implemented based on common themes and suggestions.',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cr-feedback-metrics',
            type: 'list',
            content: [
              'Feedback response rate: Target 15%',
              'Implementation rate: Target 30% of suggestions',
              'Customer satisfaction score: Target 4.5/5'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'cr-retention-metrics',
            type: 'heading',
            content: 'Retention Metrics',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cr-repeat-rate',
            type: 'paragraph',
            content: 'Target Repeat Customer Rate: 40% monthly',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cr-churn-rate',
            type: 'paragraph',
            content: 'Target Churn Rate: <10% annually',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cr-ltv',
            type: 'paragraph',
            content: 'Customer Lifetime Value Target: $1,500',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'online-presence',
        type: 'content',
        title: 'Online Presence',
        section: "sales-marketing",
        pageNumber: 18,
        blocks: [
          {
            id: 'op-title',
            type: 'heading',
            content: 'Online Presence',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'op-website',
            type: 'heading',
            content: 'Website',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'op-website-desc',
            type: 'paragraph',
            content: 'Professional website with menu, online ordering, blog, event calendar, and reservation system. Mobile-responsive design.',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-website-features',
            type: 'list',
            content: [
              'Online ordering for pickup',
              'Event registration and ticketing',
              'Blog with recipes and stories',
              'Photo gallery',
              'Contact form and location map'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'op-website-cost',
            type: 'paragraph',
            content: 'Website Development Cost: $3,000 one-time, $50/month hosting',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-seo',
            type: 'heading',
            content: 'SEO Strategy',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'op-primary-keywords',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.content_strategy?.seo_strategy?.primary_keywords ||
              ['best coffee shop Yerevan', 'Armenian bakery near me', 'cultural cafe Yerevan', 'artisanal pastries Yerevan'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'op-secondary-keywords',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.content_strategy?.seo_strategy?.secondary_keywords ||
              ['book cafe', 'poetry readings Yerevan', 'fresh bread daily', 'local coffee shop'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'op-local-seo',
            type: 'paragraph',
            content: 'Local SEO: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.content_strategy?.seo_strategy?.local_seo ||
              'Google My Business optimization, local citations, Armenian business directories, location-based keywords'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-google-business',
            type: 'paragraph',
            content: 'Google My Business: Complete profile with photos, posts, reviews, and Q&A',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-analytics',
            type: 'heading',
            content: 'Analytics & Measurement',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'op-analytics-tools',
            type: 'list',
            content: [
              'Google Analytics for website traffic',
              'Google Search Console for SEO performance',
              'Social media analytics tools',
              'Monthly reporting on key metrics'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'op-traffic-targets',
            type: 'paragraph',
            content: 'Website Traffic Targets: 1,000 monthly visitors by month 3, 3,000 by month 12',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-conversion-targets',
            type: 'paragraph',
            content: 'Conversion Rate Target: 2% for online orders, 5% for event registrations',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'social-media',
        type: 'content',
        title: 'Social Media',
        section: "sales-marketing",
        pageNumber: 19,
        blocks: [
          {
            id: 'sm-title',
            type: 'heading',
            content: 'Social Media',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'sm-platforms',
            type: 'heading',
            content: 'Platform Strategies',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'sm-instagram',
            type: 'paragraph',
            content: 'Instagram: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.social_media_plan?.platform_strategies?.instagram ||
              'Visual storytelling, daily posts, Reels, Stories, highlights for menu items and events. Focus on high-quality food photography and behind-the-scenes content.'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sm-instagram-metrics',
            type: 'list',
            content: [
              'Post frequency: 1-2x daily',
              'Story frequency: 3-5x daily',
              'Target followers: 5,000 by year 1',
              'Engagement rate target: 4%'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'sm-facebook',
            type: 'paragraph',
            content: 'Facebook: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.social_media_plan?.platform_strategies?.facebook ||
              'Community building, event promotion, longer posts, customer engagement, local group participation. Event creation and ticketing.'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sm-facebook-metrics',
            type: 'list',
            content: [
              'Post frequency: 1x daily',
              'Event posts: Weekly',
              'Target followers: 3,000 by year 1',
              'Engagement rate target: 3%'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'sm-tiktok',
            type: 'paragraph',
            content: 'TikTok: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.social_media_plan?.platform_strategies?.tiktok ||
              'Short-form video content, baking process videos, cultural moments, trending sounds, challenges, behind-the-scenes fun content.'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sm-tiktok-metrics',
            type: 'list',
            content: [
              'Post frequency: 3-5x weekly',
              'Target followers: 10,000 by year 1',
              'Video views target: 50,000 monthly'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'sm-linkedin',
            type: 'paragraph',
            content: 'LinkedIn: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.social_media_plan?.platform_strategies?.linkedin ||
              'Business networking, B2B partnerships, professional updates, job postings, company culture posts.'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sm-twitter',
            type: 'paragraph',
            content: 'Twitter/X: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.social_media_plan?.platform_strategies?.twitter ||
              'Real-time updates, customer service, community conversations, sharing local news and events.'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sm-advertising',
            type: 'heading',
            content: 'Paid Advertising',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'sm-ad-budget',
            type: 'paragraph',
            content: 'Monthly Advertising Budget: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.social_media_plan?.advertising_budget?.monthly_budget || '$500'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sm-ad-allocations',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.social_media_plan?.advertising_budget?.ad_allocations ?
              [
                'Facebook/Instagram: ' + companyAdditionalData.business_plan.sales_marketing.digital_marketing.social_media_plan.advertising_budget.ad_allocations.facebook_ads,
                'Google Ads: ' + companyAdditionalData.business_plan.sales_marketing.digital_marketing.social_media_plan.advertising_budget.ad_allocations.google_ads,
                'TikTok: ' + (companyAdditionalData.business_plan.sales_marketing.digital_marketing.social_media_plan.advertising_budget.ad_allocations.instagram_ads || '$50')
              ] : ['Facebook/Instagram: $300', 'Google Ads: $150', 'TikTok: $50'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'sm-content-calendar',
            type: 'heading',
            content: 'Content Calendar',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'sm-content-themes',
            type: 'list',
            content: [
              'Monday: Product spotlight',
              'Tuesday: Behind the scenes',
              'Wednesday: Customer features',
              'Thursday: Cultural/historical content',
              'Friday: Weekend events',
              'Saturday: Community highlights',
              'Sunday: Relaxation/cozy content'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'seo-content',
        type: 'content',
        title: 'SEO & Content',
        section: "sales-marketing",
        pageNumber: 20,
        blocks: [
          {
            id: 'sc-title',
            type: 'heading',
            content: 'SEO & Content',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'sc-content-types',
            type: 'heading',
            content: 'Content Types',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'sc-content-list',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.content_strategy?.content_types ||
              [
                'Blog posts about Armenian baking traditions',
                'Recipe videos and tutorials',
                'Customer stories and interviews',
                'Event highlights and recaps',
                'Behind-the-scenes at the bakery',
                'Local ingredient spotlights',
                'Cultural heritage articles'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'sc-content-calendar',
            type: 'heading',
            content: 'Content Calendar',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'sc-calendar-daily',
            type: 'paragraph',
            content: 'Daily Posts: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.content_strategy?.content_calendar?.daily_posts || '1-2 social media posts'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sc-calendar-weekly',
            type: 'paragraph',
            content: 'Weekly Themes: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.content_strategy?.content_calendar?.weekly_themes ||
              'Seasonal features, customer spotlights, cultural highlights, baking tips'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sc-calendar-monthly',
            type: 'paragraph',
            content: 'Monthly Campaigns: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.content_strategy?.content_calendar?.monthly_campaigns ||
              'Special promotions, event series, seasonal menu launches'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sc-blog-schedule',
            type: 'paragraph',
            content: 'Blog Posts: 2-4 per month on relevant topics',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sc-video-schedule',
            type: 'paragraph',
            content: 'Video Content: 2-3 per week for social media',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'sc-seo-strategy',
            type: 'heading',
            content: 'SEO Strategy Details',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'sc-on-page-seo',
            type: 'list',
            content: [
              'Keyword-optimized page titles and meta descriptions',
              'Header tags (H1, H2, H3) structure',
              'Image alt text with keywords',
              'Internal linking strategy',
              'Mobile-friendly design',
              'Fast page load speed'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'sc-off-page-seo',
            type: 'list',
            content: [
              'Local business citations',
              'Backlink building from local sites',
              'Social media signals',
              'Guest posts on food blogs',
              'Influencer collaborations'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'sc-technical-seo',
            type: 'list',
            content: [
              'XML sitemap submission',
              'Schema markup for local business',
              'Mobile optimization',
              'Page speed optimization',
              'SSL certificate'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'digital-marketing',
        type: 'content',
        title: 'Digital Marketing',
        section: "sales-marketing",
        pageNumber: 21,
        blocks: [
          {
            id: 'dm-title',
            type: 'heading',
            content: 'Digital Marketing',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'dm-email',
            type: 'heading',
            content: 'Email Marketing',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'dm-email-campaigns',
            type: 'list',
            content: [
              'Weekly Newsletter: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.email_marketing?.campaign_schedule?.weekly_newsletter || 'Every Tuesday with updates'),
              'Promotional Emails: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.email_marketing?.campaign_schedule?.promotional_emails || 'Monthly specials and offers'),
              'Abandoned Cart: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.email_marketing?.campaign_schedule?.abandoned_cart_emails || '24-hour follow-up'),
              'Birthday Emails: ' + 'Personalized offers for loyalty members'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'dm-email-segmentation',
            type: 'heading',
            content: 'List Segmentation',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 10,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'dm-email-segments',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.email_marketing?.list_segmentation ?
              [
                'New Subscribers: ' + companyAdditionalData.business_plan.sales_marketing.digital_marketing.email_marketing.list_segmentation.new_subscribers,
                'Active Customers: ' + companyAdditionalData.business_plan.sales_marketing.digital_marketing.email_marketing.list_segmentation.active_customers,
                'Inactive Customers: ' + companyAdditionalData.business_plan.sales_marketing.digital_marketing.email_marketing.list_segmentation.inactive_customers,
                'Loyal Customers: ' + companyAdditionalData.business_plan.sales_marketing.digital_marketing.email_marketing.list_segmentation.loyal_customers
              ] : [
                'New Subscribers: Welcome series',
                'Active Customers: Regular updates',
                'Inactive Customers: Re-engagement campaigns',
                'Loyal Customers: VIP offers'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'dm-email-metrics',
            type: 'list',
            content: [
              'Open Rate: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.email_marketing?.performance_metrics?.open_rate || '20-25% target'),
              'Click-through Rate: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.email_marketing?.performance_metrics?.click_through_rate || '3-5% target'),
              'Conversion Rate: ' + (companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.email_marketing?.performance_metrics?.conversion_rate || '1-2% target')
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'dm-paid-ads',
            type: 'heading',
            content: 'Paid Advertising',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'dm-ad-platforms',
            type: 'list',
            content: [
              'Facebook/Instagram Ads: Targeted local audience, interest-based targeting, retargeting',
              'Google Ads: Search ads for key terms, display network, YouTube ads',
              'Local influencers: Micro-influencer partnerships'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'dm-ad-metrics',
            type: 'list',
            content: [
              'CTR target: 2-3%',
              'Conversion rate: 2-4%',
              'ROAS target: 4:1',
              'CPA target: $10-15'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'dm-analytics',
            type: 'heading',
            content: 'Analytics & Measurement',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'dm-analytics-tools',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.digital_marketing?.analytics_measurement ?
              [
                'Analytics Software: ' + (companyAdditionalData.business_plan.sales_marketing.digital_marketing.analytics_measurement.analytics_software_costs || 'Google Analytics, Facebook Pixel'),
                'Market Research Budget: ' + (companyAdditionalData.business_plan.sales_marketing.digital_marketing.analytics_measurement.market_research_budget || '$200/month'),
                'Customer Survey Costs: ' + (companyAdditionalData.business_plan.sales_marketing.digital_marketing.analytics_measurement.customer_survey_costs || '$100/quarter'),
                'Data Analysis Tools: ' + (companyAdditionalData.business_plan.sales_marketing.digital_marketing.analytics_measurement.data_analysis_tools || 'Excel, Google Data Studio')
              ] : [
                'Google Analytics 4',
                'Facebook Business Suite',
                'Hotjar for user behavior',
                'SEMrush for SEO tracking'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'community-engagement',
        type: 'content',
        title: 'Community Engagement',
        section: "sales-marketing",
        pageNumber: 22,
        blocks: [
          {
            id: 'ce-title',
            type: 'heading',
            content: 'Community Engagement',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'ce-events',
            type: 'heading',
            content: 'Local Events',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ce-events-list',
            type: 'list',
            content: companyAdditionalData.business_plan.sales_marketing?.brand_development?.community_engagement?.community_events ?
              [companyAdditionalData.business_plan.sales_marketing.brand_development.community_engagement.community_events] :
              [
                'Monthly poetry readings in Armenian and English',
                'Local artist exhibitions (rotating monthly)',
                'Book club meetings every two weeks',
                'Traditional Armenian music evenings',
                'Baking workshops with local pastry chefs',
                'Cultural holiday celebrations (Vardavar, New Year, etc.)'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ce-event-frequency',
            type: 'paragraph',
            content: 'Event Frequency: 2-3 events per week',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ce-partnerships',
            type: 'heading',
            content: 'Local Partnerships',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ce-partners-list',
            type: 'list',
            content: [
              'Local farms: Partner for fresh ingredients, feature their stories',
              'Nearby bookstores: Cross-promotion, joint events',
              'Art galleries: Exhibition partnerships',
              'Music venues: Musician referrals',
              'Tourism agencies: Include in local tours',
              'Universities: Student discounts, study spaces'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ce-partnership-benefits',
            type: 'paragraph',
            content: 'Partnership Benefits: Cross-promotion, shared audiences, cost sharing, enhanced credibility',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ce-charity',
            type: 'heading',
            content: 'Charity & Giving Back',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ce-charity-donations',
            type: 'paragraph',
            content: 'Charity Donations: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.community_engagement?.charity_donations ||
              'Monthly donations of unsold baked goods to local shelters. Annual financial contribution of $2,000 to children\'s education programs.'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ce-charity-events',
            type: 'list',
            content: [
              'Annual charity bake sale',
              'Benefit nights for local causes',
              'Holiday giving campaigns'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ce-local-sponsorship',
            type: 'paragraph',
            content: 'Local Sponsorship Budget: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.community_engagement?.local_sponsorship_budget ||
              '$3,000 annually for school events, sports teams, cultural festivals'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ce-pr',
            type: 'heading',
            content: 'Public Relations',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ce-pr-activities',
            type: 'list',
            content: [
              'Press releases for major events',
              'Media invites to cultural evenings',
              'Local news features',
              'Food blogger/influencer visits',
              'Tourism guide inclusions'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ce-pr-budget',
            type: 'paragraph',
            content: 'PR Budget: ' + (companyAdditionalData.business_plan.sales_marketing?.brand_development?.community_engagement?.public_relations_costs || '$500 monthly'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ce-impact-metrics',
            type: 'heading',
            content: 'Community Impact Metrics',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ce-metrics',
            type: 'list',
            content: [
              'Event attendance: 50+ per event',
              'Partner organizations: 10+ active partnerships',
              'Media mentions: 5+ per quarter',
              'Community feedback score: 4.5/5',
              'Social media mentions: 500+ monthly'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },

      // Financials Section
      {
        id: 'revenue',
        type: 'content',
        title: 'Revenue',
        section: "financials",
        pageNumber: 23,
        blocks: [
          {
            id: 'rev-title',
            type: 'heading',
            content: 'Revenue',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'rev-projections',
            type: 'heading',
            content: 'Revenue Projections',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'rev-year1',
            type: 'paragraph',
            content: 'Year 1 Total: ' + (companyAdditionalData.business_plan.financials?.revenue_projections?.monthly_revenue?.year_1?.january ? 'Calculated from data' : '$500,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'rev-year1-breakdown',
            type: 'list',
            content: [
              'Q1: $100,000',
              'Q2: $120,000',
              'Q3: $135,000',
              'Q4: $145,000'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'rev-year2',
            type: 'paragraph',
            content: 'Year 2 Total: $650,000 (30% growth)',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'rev-year3',
            type: 'paragraph',
            content: 'Year 3 Total: $845,000 (30% growth)',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'rev-streams',
            type: 'heading',
            content: 'Revenue Streams',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'rev-streams-list',
            type: 'list',
            content: companyAdditionalData.business_plan.financials?.revenue_projections?.revenue_streams ?
              [
                'Product Sales: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.product_sales?.percentage || '60%') +
                ' - Growth: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.product_sales?.growth_rate || '15%') +
                ' - Seasonality: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.product_sales?.seasonality || 'Peak in holidays'),
                'Service Revenue: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.service_revenue?.percentage || '25%') +
                ' - Growth: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.service_revenue?.growth_rate || '20%') +
                ' - Recurring: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.service_revenue?.recurring_revenue || 'Event tickets'),
                'Subscription Revenue: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.subscription_revenue?.percentage || '5%') +
                ' - Churn: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.subscription_revenue?.churn_rate || '5%'),
                'Other Revenue: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.other_revenue?.percentage || '10%') +
                ' - Sources: ' + (companyAdditionalData.business_plan.financials.revenue_projections.revenue_streams.other_revenue?.sources?.join(', ') || 'Merchandise, catering')
              ] : [
                'Product Sales: 60% - Baked goods, coffee, retail items',
                'Service Revenue: 25% - Event tickets, workshops, venue rental',
                'Catering: 10% - Corporate events, private parties',
                'Merchandise: 5% - Branded items, packaged goods'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'rev-pricing',
            type: 'heading',
            content: 'Pricing Strategy',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'rev-price-points',
            type: 'list',
            content: companyAdditionalData.business_plan.financials?.revenue_projections?.pricing_strategy?.price_points ||
              ['Coffee: $3-6', 'Pastries: $4-8', 'Light meals: $8-15', 'Event tickets: $10-25'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'rev-discount-strategy',
            type: 'paragraph',
            content: 'Discount Strategy: ' + (companyAdditionalData.business_plan.financials?.revenue_projections?.pricing_strategy?.discount_strategy ||
              'Loyalty program discounts, student discounts (10%), early bird event pricing, seasonal promotions'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'rev-competitive-pricing',
            type: 'paragraph',
            content: 'Competitive Pricing: ' + (companyAdditionalData.business_plan.financials?.revenue_projections?.pricing_strategy?.competitive_pricing ||
              'Positioned at premium but accessible price point, 10-15% above standard cafes for quality differentiation'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'rev-value-pricing',
            type: 'paragraph',
            content: 'Value-Based Pricing: ' + (companyAdditionalData.business_plan.financials?.revenue_projections?.pricing_strategy?.value_based_pricing ||
              'Pricing reflects quality ingredients, skilled preparation, and unique cultural experience'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'expenses',
        type: 'content',
        title: 'Expenses',
        section: "financials",
        pageNumber: 24,
        blocks: [
          {
            id: 'exp-title',
            type: 'heading',
            content: 'Expenses',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'exp-fixed',
            type: 'heading',
            content: 'Fixed Costs (Monthly)',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'exp-rent',
            type: 'paragraph',
            content: 'Rent: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.rent || '$3,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-utilities',
            type: 'paragraph',
            content: 'Utilities Total: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.utilities?.monthly_total || '$500') +
              ' (Electricity: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.utilities?.electricity || '$250') +
              ', Water: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.utilities?.water || '$100') +
              ', Internet: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.utilities?.internet || '$100') +
              ', Phone: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.utilities?.telephone || '$50') + ')',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-insurance',
            type: 'paragraph',
            content: 'Insurance: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.insurance || '$400'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-software',
            type: 'paragraph',
            content: 'Software Subscriptions: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.software_subscriptions || '$150'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-banking',
            type: 'paragraph',
            content: 'Banking Fees: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.business_banking_fees?.account_maintenance || '$50') +
              ' + ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.business_banking_fees?.transaction_fees || '2% of transactions'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-professional-fees',
            type: 'paragraph',
            content: 'Professional Fees: ' +
              'Accounting: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.professional_fees?.accountant || '$400') +
              ', Legal: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.professional_fees?.lawyer || '$200 avg') +
              ', Consulting: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.fixed_costs?.professional_fees?.consultant || '$0'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-total-fixed',
            type: 'paragraph',
            content: 'Total Fixed Costs: $4,500 - $5,000 per month',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontWeight: 'bold',
            }
          },
          {
            id: 'exp-variable',
            type: 'heading',
            content: 'Variable Costs (% of Revenue)',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'exp-materials',
            type: 'paragraph',
            content: 'Materials (COGS): ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.variable_costs?.materials || '30-35%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-labor',
            type: 'paragraph',
            content: 'Labor: 25-30% of revenue',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-marketing',
            type: 'paragraph',
            content: 'Marketing: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.variable_costs?.marketing || '5-8%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-commission',
            type: 'paragraph',
            content: 'Commission: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.variable_costs?.commission || '0-3% for delivery platforms'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-shipping',
            type: 'paragraph',
            content: 'Shipping: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.variable_costs?.shipping || '1-2% for wholesale'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-production',
            type: 'paragraph',
            content: 'Production: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.variable_costs?.production || 'Included in materials'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-shrinkage',
            type: 'paragraph',
            content: 'Inventory Shrinkage: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.variable_costs?.inventory_shrinkage || '1%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-returns',
            type: 'paragraph',
            content: 'Returns/Refunds: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.variable_costs?.returns_refunds || '0.5%'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-operational',
            type: 'heading',
            content: 'Operational Costs',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'exp-maintenance',
            type: 'paragraph',
            content: 'Maintenance: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.operational_costs?.maintenance || '$200/month'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-repairs',
            type: 'paragraph',
            content: 'Repairs: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.operational_costs?.repairs || '$100/month avg'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-training',
            type: 'paragraph',
            content: 'Training: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.operational_costs?.training || '$150/month'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-travel',
            type: 'paragraph',
            content: 'Travel: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.operational_costs?.travel || '$50/month'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-emergency',
            type: 'paragraph',
            content: 'Emergency Repairs: ' + (companyAdditionalData.business_plan.financials?.expense_breakdown?.operational_costs?.emergency_repairs || 'From contingency fund'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'exp-detailed-equipment',
            type: 'heading',
            content: 'Equipment Costs',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'financing',
        type: 'content',
        title: 'Financing',
        section: "financials",
        pageNumber: 25,
        blocks: [
          {
            id: 'fin-title',
            type: 'heading',
            content: 'Financing',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'fin-startup',
            type: 'heading',
            content: 'Startup Capital Requirements',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fin-amount',
            type: 'paragraph',
            content: 'Total Amount Needed: ' + (companyAdditionalData.business_plan.financials?.funding_requirements?.startup_capital?.amount_needed || '$250,000'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontWeight: 'bold',
            }
          },
          {
            id: 'fin-use-of-funds',
            type: 'heading',
            content: 'Use of Funds',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 10,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'fin-use-list',
            type: 'list',
            content: companyAdditionalData.business_plan.financials?.funding_requirements?.startup_capital?.use_of_funds ?
              [
                'Equipment: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.use_of_funds.equipment || '$80,000'),
                'Inventory: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.use_of_funds.inventory || '$30,000'),
                'Marketing: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.use_of_funds.marketing || '$40,000'),
                'Working Capital: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.use_of_funds.working_capital || '$60,000'),
                'Legal/Registration: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.use_of_funds.legal_registration || '$10,000'),
                'Pre-launch Expenses: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.use_of_funds.pre_launch_expenses || '$30,000')
              ] : [
                'Equipment & Renovation: $120,000',
                'Initial Inventory: $30,000',
                'Marketing & Branding: $25,000',
                'Working Capital (6 months): $60,000',
                'Legal & Permits: $15,000'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fin-sources',
            type: 'heading',
            content: 'Funding Sources',
            styles: {
              fontSize: 16,
              fontWeight: '600',
              color: '#001941',
              marginTop: 10,
              marginBottom: 5,
            },
            metadata: { level: 3 }
          },
          {
            id: 'fin-sources-list',
            type: 'list',
            content: companyAdditionalData.business_plan.financials?.funding_requirements?.startup_capital?.funding_sources ?
              [
                'Personal Savings: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.funding_sources.personal_savings || '$100,000'),
                'Bank Loans: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.funding_sources.bank_loans || '$100,000'),
                'Investors: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.funding_sources.investors || '$50,000'),
                'Grants: ' + (companyAdditionalData.business_plan.financials.funding_requirements.startup_capital.funding_sources.grants || 'Exploring options')
              ] : [
                'Owner Equity: $150,000 (60%)',
                'Bank Loan: $100,000 (40%)'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fin-growth',
            type: 'heading',
            content: 'Growth Funding',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fin-phase1',
            type: 'paragraph',
            content: 'Phase 1 (Year 2): ' + (companyAdditionalData.business_plan.financials?.funding_requirements?.growth_funding?.phase_1_funding || '$150,000 for second location'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fin-phase2',
            type: 'paragraph',
            content: 'Phase 2 (Year 3): ' + (companyAdditionalData.business_plan.financials?.funding_requirements?.growth_funding?.phase_2_funding || '$300,000 for expansion'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fin-phase3',
            type: 'paragraph',
            content: 'Phase 3 (Year 4-5): ' + (companyAdditionalData.business_plan.financials?.funding_requirements?.growth_funding?.phase_3_funding || '$500,000 for regional expansion'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'dividends',
        type: 'content',
        title: 'Dividends & Returns',
        section: "financials",
        pageNumber: 26,
        blocks: [
          {
            id: 'div-title',
            type: 'heading',
            content: 'Dividends & Returns',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'div-expectations',
            type: 'heading',
            content: 'Return Expectations',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'div-roi',
            type: 'paragraph',
            content: 'Investor ROI: ' + (companyAdditionalData.business_plan.financials?.funding_requirements?.return_expectations?.investor_roi || '20-25% annually'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'div-payback',
            type: 'paragraph',
            content: 'Payback Period: ' + (companyAdditionalData.business_plan.financials?.funding_requirements?.return_expectations?.payback_period || '3-4 years'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'div-dividend-policy',
            type: 'heading',
            content: 'Dividend Policy',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'div-policy-text',
            type: 'paragraph',
            content: 'No dividends for first 2 years to reinvest in growth. Year 3+: 30% of net profits distributed quarterly.',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'div-projections',
            type: 'list',
            content: [
              'Year 3 projected dividend: $30,000',
              'Year 4 projected dividend: $50,000',
              'Year 5 projected dividend: $75,000'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'div-exit',
            type: 'heading',
            content: 'Exit Strategy',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'div-exit-list',
            type: 'list',
            content: companyAdditionalData.business_plan.financials?.funding_requirements?.return_expectations?.exit_strategy ?
              [
                'Acquisition Possibilities: ' + (companyAdditionalData.business_plan.financials.funding_requirements.return_expectations.exit_strategy.acquisition_possibilities || 'Sale to larger cafe chain or hospitality group'),
                'IPO Potential: ' + (companyAdditionalData.business_plan.financials.funding_requirements.return_expectations.exit_strategy.ipo_potential || 'Low probability, long-term possibility'),
                'Management Buyout: ' + (companyAdditionalData.business_plan.financials.funding_requirements.return_expectations.exit_strategy.management_buyout || 'Option for key employees after 5-7 years'),
                'Liquidation Plan: ' + (companyAdditionalData.business_plan.financials.funding_requirements.return_expectations.exit_strategy.liquidation_plan || 'Asset sale, brand transfer')
              ] : [
                'Strategic acquisition by larger food & beverage company',
                'Sell to employees through ESOP',
                'Family succession or management buyout',
                'Liquidation of assets if needed'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },

      // Taxes Section
      {
        id: 'profit-loss',
        type: 'content',
        title: 'Profit & Loss',
        section: "taxes",
        pageNumber: 27,
        blocks: [
          {
            id: 'pl-title',
            type: 'heading',
            content: 'Profit & Loss Statement',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'pl-year1',
            type: 'heading',
            content: 'Year 1 Projections',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'pl-revenue',
            type: 'paragraph',
            content: 'Revenue: $500,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pl-cogs',
            type: 'paragraph',
            content: 'Cost of Goods Sold: $175,000 (35%)',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pl-gross-profit',
            type: 'paragraph',
            content: 'Gross Profit: $325,000 (65% margin)',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontWeight: 'bold',
            }
          },
          {
            id: 'pl-operating-expenses',
            type: 'paragraph',
            content: 'Operating Expenses: $200,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pl-operating-breakdown',
            type: 'list',
            content: [
              'Rent: $36,000',
              'Utilities: $6,000',
              'Salaries & Wages: $100,000',
              'Marketing: $25,000',
              'Insurance: $5,000',
              'Maintenance: $3,000',
              'Professional Fees: $5,000',
              'Other: $20,000'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'pl-ebitda',
            type: 'paragraph',
            content: 'EBITDA: $125,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pl-depreciation',
            type: 'paragraph',
            content: 'Depreciation & Amortization: $25,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pl-interest',
            type: 'paragraph',
            content: 'Interest Expense: $10,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pl-tax',
            type: 'paragraph',
            content: 'Taxes (20%): $18,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pl-net-profit',
            type: 'paragraph',
            content: 'Net Profit: $72,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontWeight: 'bold',
            }
          },
          {
            id: 'pl-metrics',
            type: 'heading',
            content: 'Key Metrics',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'pl-metrics-list',
            type: 'list',
            content: companyAdditionalData.business_plan.financials?.profit_loss_statement?.key_metrics ?
              [
                'Gross Margin: ' + (companyAdditionalData.business_plan.financials.profit_loss_statement.key_metrics.gross_margin || '65%'),
                'Operating Margin: ' + (companyAdditionalData.business_plan.financials.profit_loss_statement.key_metrics.operating_margin || '25%'),
                'Net Margin: ' + (companyAdditionalData.business_plan.financials.profit_loss_statement.key_metrics.net_margin || '14%'),
                'EBITDA: ' + (companyAdditionalData.business_plan.financials.profit_loss_statement.key_metrics.ebitda || '$125,000')
              ] : [
                'Gross Margin: 65%',
                'Operating Margin: 25%',
                'Net Margin: 14%',
                'EBITDA: $125,000'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'balance-sheet',
        type: 'content',
        title: 'Balance Sheet',
        section: "taxes",
        pageNumber: 28,
        blocks: [
          {
            id: 'bs-title',
            type: 'heading',
            content: 'Balance Sheet (Opening)',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'bs-assets',
            type: 'heading',
            content: 'Assets',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bs-current-assets',
            type: 'list',
            content: [
              'Cash: $50,000',
              'Inventory: $30,000',
              'Prepaid Expenses: $10,000',
              'Accounts Receivable: $5,000'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bs-total-current',
            type: 'paragraph',
            content: 'Total Current Assets: $95,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bs-fixed-assets',
            type: 'list',
            content: [
              'Equipment: $120,000',
              'Furniture & Fixtures: $50,000',
              'Leasehold Improvements: $60,000',
              'Vehicles: $0'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bs-total-fixed',
            type: 'paragraph',
            content: 'Total Fixed Assets: $230,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bs-total-assets',
            type: 'paragraph',
            content: 'Total Assets: $325,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontWeight: 'bold',
            }
          },
          {
            id: 'bs-liabilities',
            type: 'heading',
            content: 'Liabilities',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bs-current-liabilities',
            type: 'list',
            content: [
              'Accounts Payable: $15,000',
              'Accrued Expenses: $5,000',
              'Short-term Loans: $20,000',
              'Current portion of LTD: $10,000'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bs-total-current-liabilities',
            type: 'paragraph',
            content: 'Total Current Liabilities: $50,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bs-long-term-debt',
            type: 'paragraph',
            content: 'Long-term Debt: $100,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bs-total-liabilities',
            type: 'paragraph',
            content: 'Total Liabilities: $150,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bs-equity',
            type: 'heading',
            content: "Owner's Equity",
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'bs-equity-list',
            type: 'list',
            content: [
              "Owner's Capital: $175,000",
              'Retained Earnings: $0'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'bs-total-equity',
            type: 'paragraph',
            content: 'Total Equity: $175,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'bs-total-liabilities-equity',
            type: 'paragraph',
            content: 'Total Liabilities & Equity: $325,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontWeight: 'bold',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'cash-flow',
        type: 'content',
        title: 'Cash Flow',
        section: "taxes",
        pageNumber: 29,
        blocks: [
          {
            id: 'cf-title',
            type: 'heading',
            content: 'Cash Flow Analysis',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'cf-operating',
            type: 'heading',
            content: 'Operating Cash Flow (Monthly)',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cf-operating-in',
            type: 'paragraph',
            content: 'Cash Inflows: $45,000 (average)',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cf-operating-out',
            type: 'paragraph',
            content: 'Cash Outflows: $35,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cf-operating-net',
            type: 'paragraph',
            content: 'Net Operating Cash Flow: $10,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
              fontWeight: 'bold',
            }
          },
          {
            id: 'cf-operating-details',
            type: 'list',
            content: [
              'Cash receipts from customers: $45,000',
              'Cash paid to suppliers: ($15,000)',
              'Cash paid to employees: ($12,000)',
              'Cash paid for operating expenses: ($8,000)',
              'Interest paid: ($500)',
              'Taxes paid: ($1,500)'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'cf-investing',
            type: 'heading',
            content: 'Investing Cash Flow',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cf-investing-list',
            type: 'list',
            content: [
              'Equipment Purchases: ($5,000) quarterly',
              'Property Investments: $0',
              'R&D Investments: ($500) monthly'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'cf-investing-net',
            type: 'paragraph',
            content: 'Net Investing Cash Flow: ($5,500) monthly avg',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cf-financing',
            type: 'heading',
            content: 'Financing Cash Flow',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cf-financing-list',
            type: 'list',
            content: companyAdditionalData.business_plan.financials?.cash_flow_analysis?.financing_cash_flow ?
              [
                'Loan Proceeds: ' + (companyAdditionalData.business_plan.financials.cash_flow_analysis.financing_cash_flow.loan_proceeds || '$100,000 initial'),
                'Equity Investments: ' + (companyAdditionalData.business_plan.financials.cash_flow_analysis.financing_cash_flow.equity_investments || '$150,000 initial'),
                'Dividend Payments: ' + (companyAdditionalData.business_plan.financials.cash_flow_analysis.financing_cash_flow.dividend_payments || '$0 year 1-2')
              ] : [
                'Loan Proceeds: $100,000 (year 0)',
                'Equity Investments: $150,000 (year 0)',
                'Dividend Payments: $0 (years 1-2)'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'cf-cash-balance',
            type: 'heading',
            content: 'Cash Balance Forecast',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'cf-minimum-balance',
            type: 'paragraph',
            content: 'Minimum Cash Balance Required: $30,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cf-working-capital',
            type: 'paragraph',
            content: 'Working Capital Requirements: $50,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cf-cash-buffer',
            type: 'paragraph',
            content: 'Cash Buffer (3 months expenses): $75,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'cf-end-year1',
            type: 'paragraph',
            content: 'Projected Cash Balance - End Year 1: $85,000',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'funding-plan',
        type: 'content',
        title: 'Funding Plan',
        section: "taxes",
        pageNumber: 30,
        blocks: [
          {
            id: 'fp-title',
            type: 'heading',
            content: 'Funding Plan',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'fp-contingency',
            type: 'heading',
            content: 'Contingency Fund',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fp-contingency-percent',
            type: 'paragraph',
            content: 'Percentage of Budget: ' + (companyAdditionalData.business_plan.financials?.contingency_fund?.percentage_of_budget || '15% of startup capital'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fp-contingency-amount',
            type: 'paragraph',
            content: 'Contingency Fund Amount: $37,500',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fp-contingency-scenarios',
            type: 'list',
            content: companyAdditionalData.business_plan.financials?.contingency_fund?.specific_scenarios_covered ||
              [
                'Equipment breakdowns or repairs',
                'Revenue shortfalls (3-6 months)',
                'Unexpected price increases in ingredients',
                'Emergency renovations',
                'Legal or compliance issues'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fp-contingency-access',
            type: 'paragraph',
            content: 'Access Conditions: ' + (companyAdditionalData.business_plan.financials?.contingency_fund?.access_conditions ||
              'Manager approval for amounts under $5,000, owner approval for larger amounts. Monthly review of fund status.'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fp-contingency-replenishment',
            type: 'paragraph',
            content: 'Replenishment Strategy: ' + (companyAdditionalData.business_plan.financials?.contingency_fund?.replenishment_strategy ||
              '10% of monthly profits allocated until fund reaches target level. Review quarterly.'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fp-funding-schedule',
            type: 'heading',
            content: 'Funding Schedule',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fp-schedule-list',
            type: 'list',
            content: [
              'Month 0: Initial funding $250,000',
              'Month 6: Review performance, potential additional $50,000 if needed',
              'Year 2: Growth funding $150,000 for expansion',
              'Year 3: Series A funding $500,000 for regional growth'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fp-debt-structure',
            type: 'heading',
            content: 'Debt Structure',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fp-debt-terms',
            type: 'list',
            content: [
              'Loan Amount: $100,000',
              'Interest Rate: 8% fixed',
              'Term: 5 years',
              'Monthly Payment: $2,028',
              'Collateral: Equipment and assets'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fp-equity-structure',
            type: 'heading',
            content: 'Equity Structure',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fp-equity-terms',
            type: 'list',
            content: [
              'Founder Equity: 80%',
              'Investor Equity: 20% (for $50,000 investment)',
              'Vesting: 4-year with 1-year cliff',
              'Profit Share: 30% of profits after year 2'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },

      // Operations Section
      {
        id: 'team-roles',
        type: 'content',
        title: 'Team & Roles',
        section: "operations",
        pageNumber: 31,
        blocks: [
          {
            id: 'tr-title',
            type: 'heading',
            content: 'Team & Roles',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'tr-management',
            type: 'heading',
            content: 'Management Team',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'tr-manager-1',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[0]?.name || 'Anna Harutyunyan') +
              ' - ' + (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[0]?.position || 'Owner/General Manager'),
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'tr-manager-1-qual',
            type: 'paragraph',
            content: 'Qualifications: ' + (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[0]?.qualifications || 'MBA, 10 years hospitality experience'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'tr-manager-1-exp',
            type: 'paragraph',
            content: 'Experience: ' + (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[0]?.experience || 'Previous cafe owner, restaurant manager'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'tr-manager-1-responsibilities',
            type: 'list',
            content: companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[0]?.responsibilities ||
              ['Overall business strategy', 'Financial management', 'Marketing oversight', 'Staff management', 'Vendor relationships'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'tr-manager-1-salary',
            type: 'paragraph',
            content: 'Salary: ' + (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[0]?.salary_details?.base_salary || '$4,000/month') +
              ', Bonus: ' + (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[0]?.salary_details?.bonus_structure || '10% of profits'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'tr-manager-2',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[1]?.name || 'Siranush Mkrtchyan') +
              ' - ' + (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[1]?.position || 'Head Baker'),
            styles: {
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 22,
              color: '#333',
              marginTop: 10,
            }
          },
          {
            id: 'tr-manager-2-qual',
            type: 'paragraph',
            content: 'Qualifications: ' + (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[1]?.qualifications || 'Pastry degree, 8 years experience'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'tr-manager-2-exp',
            type: 'paragraph',
            content: 'Experience: ' + (companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[1]?.experience || 'Head pastry chef at luxury hotel'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'tr-manager-2-responsibilities',
            type: 'list',
            content: companyAdditionalData.business_plan.operations?.organizational_structure?.management_team?.[1]?.responsibilities ||
              ['Menu development', 'Quality control', 'Staff training', 'Inventory management', 'Recipe creation'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'tr-staffing',
            type: 'heading',
            content: 'Staffing Plan',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'tr-immediate-hires',
            type: 'list',
            content: [
              'Baristas: 2 full-time',
              'Bakers: 2 full-time',
              'Service Staff: 3 full-time',
              'Cleaner: 1 part-time'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'tr-year1-hires',
            type: 'list',
            content: companyAdditionalData.business_plan.operations?.organizational_structure?.staffing_plan?.year_1_hires ||
              ['Additional barista (part-time)', 'Event coordinator (part-time)', 'Marketing assistant (freelance)'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'tr-year2-hires',
            type: 'list',
            content: companyAdditionalData.business_plan.operations?.organizational_structure?.staffing_plan?.year_2_hires ||
              ['Assistant manager', 'Second head baker', 'Delivery driver'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'tr-seasonal-staffing',
            type: 'paragraph',
            content: 'Seasonal Needs: ' + (companyAdditionalData.business_plan.operations?.organizational_structure?.staffing_plan?.seasonal_staffing_needs?.high_season ||
              'Summer months and holidays: +2 part-time staff'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'tr-org-chart',
            type: 'paragraph',
            content: 'Organizational Chart: Owner/Manager → Head Baker, Barista Lead → Staff',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'tr-hr-details',
            type: 'heading',
            content: 'HR Details',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'tr-hiring-budget',
            type: 'paragraph',
            content: 'Hiring Budget: $5,000 annually',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'tr-benefits',
            type: 'list',
            content: [
              'Health insurance contribution for full-time staff',
              'Paid time off: 2 weeks/year',
              'Staff meals and discounts',
              'Performance bonuses',
              'Training and development opportunities'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'tr-training-budget',
            type: 'paragraph',
            content: 'Training Budget: $2,000 annually',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'operation-plan',
        type: 'content',
        title: 'Operation Plan',
        section: "operations",
        pageNumber: 32,
        blocks: [
          {
            id: 'op-title',
            type: 'heading',
            content: 'Operation Plan',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'op-hours',
            type: 'heading',
            content: 'Operating Hours',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'op-hours-details',
            type: 'paragraph',
            content: 'Monday-Friday: 7:00 AM - 9:00 PM, Saturday-Sunday: 8:00 AM - 10:00 PM',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-peak-hours',
            type: 'list',
            content: [
              'Morning rush: 7:30-9:30 AM',
              'Lunch: 12:00-2:00 PM',
              'Afternoon coffee: 3:00-5:00 PM',
              'Event evenings: 7:00-9:00 PM'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'op-location',
            type: 'heading',
            content: 'Location Details',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'op-location-details',
            type: 'paragraph',
            content: 'Square Footage: ' + (companyAdditionalData.business_plan.operations?.facilities_equipment?.physical_location_details?.exact_square_footage || '1,500 sq ft'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-space-breakdown',
            type: 'list',
            content: [
              'Kitchen/Bakery: 500 sq ft',
              'Customer seating: 600 sq ft (40 seats)',
              'Book corner: 200 sq ft',
              'Event space: 150 sq ft',
              'Storage/Office: 50 sq ft'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'op-parking',
            type: 'paragraph',
            content: 'Parking: ' + (companyAdditionalData.business_plan.operations?.facilities_equipment?.physical_location_details?.parking_accessibility || 'Street parking, nearby public lot'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-layout',
            type: 'paragraph',
            content: 'Layout Plans: Open concept with designated zones for cafe, book corner, and events. Accessible entrance and restrooms.',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-supply-chain',
            type: 'heading',
            content: 'Supply Chain',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'op-suppliers',
            type: 'list',
            content: [
              'Local farms: Fresh produce, dairy, eggs',
              'Regional mill: Flour, grains',
              'Coffee roasters: Specialty coffee beans',
              'Distributors: Non-perishable items',
              'Beverage suppliers: Tea, juices'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'op-supplier-terms',
            type: 'paragraph',
            content: 'Supplier Terms: Net 30 for most, weekly/bi-weekly deliveries',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-inventory',
            type: 'heading',
            content: 'Inventory Management',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'op-inventory-system',
            type: 'paragraph',
            content: 'Digital inventory tracking system with automated reorder points. Weekly physical counts. FIFO method for perishables.',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'op-reorder-points',
            type: 'list',
            content: [
              'Flour: Order when below 100kg',
              'Coffee beans: Order when below 20kg',
              'Dairy: Daily delivery based on need',
              'Packaging: Monthly order'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'risk-analysis',
        type: 'content',
        title: 'Risk Analysis',
        section: "operations",
        pageNumber: 33,
        blocks: [
          {
            id: 'ra-title',
            type: 'heading',
            content: 'Risk Analysis',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'ra-identification',
            type: 'heading',
            content: 'Risk Identification',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ra-market-risks',
            type: 'list',
            content: companyAdditionalData.business_plan.risk_management?.risk_identification?.market_risks ||
              [
                'Intense competition from existing cafes',
                'Changing consumer preferences',
                'Economic downturn affecting discretionary spending',
                'New market entrants',
                'Seasonal fluctuations in tourism'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ra-financial-risks',
            type: 'list',
            content: companyAdditionalData.business_plan.risk_management?.risk_identification?.financial_risks ||
              [
                'Cash flow shortages in first year',
                'Rising ingredient costs',
                'Lower than projected sales',
                'Interest rate increases on loans',
                'Currency fluctuation for imports'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ra-operational-risks',
            type: 'list',
            content: companyAdditionalData.business_plan.risk_management?.risk_identification?.operational_risks ||
              [
                'Equipment failure or breakdown',
                'Staff turnover and training',
                'Supply chain disruptions',
                'Food safety incidents',
                'Technology failures (POS, website)'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ra-compliance-risks',
            type: 'list',
            content: companyAdditionalData.business_plan.risk_management?.risk_identification?.compliance_risks ||
              [
                'Health inspection violations',
                'Licensing issues',
                'Employment law changes',
                'Tax compliance errors',
                'Data privacy regulations'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#c62828',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ra-assessment',
            type: 'heading',
            content: 'Risk Assessment',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ra-probability',
            type: 'paragraph',
            content: 'Probability Analysis: High (competition, costs), Medium (staffing, equipment), Low (food safety, compliance)',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ra-impact',
            type: 'paragraph',
            content: 'Impact Analysis: High (financial, reputation), Medium (operational), Low (minor disruptions)',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ra-prioritization',
            type: 'list',
            content: [
              'Priority 1: Cash flow, food safety',
              'Priority 2: Competition, staffing',
              'Priority 3: Equipment, compliance'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ra-mitigation',
            type: 'heading',
            content: 'Mitigation Strategies',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ra-mitigation-list',
            type: 'list',
            content: companyAdditionalData.business_plan.risk_management?.mitigation_strategies?.preventive_measures ||
              [
                'Diversify suppliers to avoid disruption',
                'Maintain cash reserves (contingency fund)',
                'Cross-train staff for flexibility',
                'Regular equipment maintenance schedule',
                'Strict food safety protocols and training',
                'Multiple marketing channels',
                'Competitive monitoring'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#2e7d32',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ra-contingency',
            type: 'list',
            content: companyAdditionalData.business_plan.risk_management?.mitigation_strategies?.contingency_plans ||
              [
                'Emergency fund for unexpected expenses',
                'Backup equipment agreements',
                'Temporary staff agencies',
                'Alternative venue options for events',
                'Crisis communication plan'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ra-insurance',
            type: 'paragraph',
            content: 'Insurance Coverage: ' + (companyAdditionalData.business_plan.risk_management?.mitigation_strategies?.insurance_coverage ||
              'General liability ($1M), property insurance ($500K), workers compensation, business interruption, cyber liability'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ra-monitoring',
            type: 'heading',
            content: 'Monitoring Plan',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'ra-key-indicators',
            type: 'list',
            content: companyAdditionalData.business_plan.risk_management?.monitoring_plan?.key_risk_indicators ||
              [
                'Weekly sales vs. projections',
                'Monthly profit margins',
                'Customer complaint tracking',
                'Staff turnover rate',
                'Equipment maintenance logs',
                'Supplier delivery performance'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'ra-review-frequency',
            type: 'paragraph',
            content: 'Review Frequency: ' + (companyAdditionalData.business_plan.risk_management?.monitoring_plan?.review_frequency ||
              'Weekly operational review, monthly financial review, quarterly comprehensive risk assessment'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'ra-reporting',
            type: 'paragraph',
            content: 'Reporting Structure: Staff → Manager → Owner, with quarterly reports to investors',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'regulatory-compliance',
        type: 'content',
        title: 'Regulatory Compliance',
        section: "operations",
        pageNumber: 34,
        blocks: [
          {
            id: 'rc-title',
            type: 'heading',
            content: 'Regulatory Compliance',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'rc-licenses',
            type: 'heading',
            content: 'Licenses & Permits',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'rc-license-1',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[0]?.license_name || 'Business License') +
              ' - Issuer: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[0]?.issuing_authority || 'City of Yerevan') +
              ', Cost: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[0]?.cost || '$200') +
              ', Renewal: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[0]?.renewal_date || 'Annual'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'rc-license-2',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[1]?.license_name || 'Food Service Permit') +
              ' - Issuer: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[1]?.issuing_authority || 'Health Department') +
              ', Cost: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[1]?.cost || '$300') +
              ', Renewal: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[1]?.renewal_date || 'Annual'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'rc-license-3',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[2]?.license_name || 'Alcohol License') +
              ' - Issuer: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[2]?.issuing_authority || 'State Revenue Committee') +
              ', Cost: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[2]?.cost || '$1,000') +
              ', Renewal: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[2]?.renewal_date || 'Annual'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'rc-license-4',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[3]?.license_name || 'Music License') +
              ' - Issuer: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[3]?.issuing_authority || 'Copyright Office') +
              ', Cost: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[3]?.cost || '$150') +
              ', Renewal: ' + (companyAdditionalData.business_plan.overview?.legal_compliance?.licenses_permits?.[3]?.renewal_date || 'Annual'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'rc-tax',
            type: 'heading',
            content: 'Tax Obligations',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'rc-tax-list',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.legal_compliance?.tax_obligations ?
              [
                'VAT Registration: ' + (companyAdditionalData.business_plan.overview.legal_compliance.tax_obligations.vat_registration || 'Required if turnover exceeds threshold'),
                'Income Tax: ' + (companyAdditionalData.business_plan.overview.legal_compliance.tax_obligations.income_tax || '20% corporate rate'),
                'Payroll Taxes: ' + (companyAdditionalData.business_plan.overview.legal_compliance.tax_obligations.payroll_taxes || '15% of salaries'),
                'Tax Filing Schedule: ' + (companyAdditionalData.business_plan.overview.legal_compliance.tax_obligations.tax_filing_schedule || 'Monthly VAT, quarterly income tax, annual return')
              ] : [
                'VAT: 20% on applicable goods',
                'Corporate Income Tax: 18%',
                'Payroll Taxes: 15% + social contributions',
                'Monthly/Quarterly filing requirements'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'rc-insurance',
            type: 'heading',
            content: 'Insurance Requirements',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'rc-insurance-list',
            type: 'list',
            content: companyAdditionalData.business_plan.overview?.legal_compliance?.insurance_requirements ?
              [
                (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[0]?.insurance_type || 'General Liability') +
                ': ' + (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[0]?.coverage_amount || '$1M') +
                ', Premium: ' + (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[0]?.premium_cost || '$1,200/year'),
                (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[1]?.insurance_type || 'Property Insurance') +
                ': ' + (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[1]?.coverage_amount || '$500K') +
                ', Premium: ' + (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[1]?.premium_cost || '$800/year'),
                (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[2]?.insurance_type || 'Workers Compensation') +
                ': ' + (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[2]?.coverage_amount || 'Statutory') +
                ', Premium: ' + (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[2]?.premium_cost || 'Based on payroll'),
                (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[3]?.insurance_type || 'Business Interruption') +
                ': ' + (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[3]?.coverage_amount || '$100K') +
                ', Premium: ' + (companyAdditionalData.business_plan.overview.legal_compliance.insurance_requirements[3]?.premium_cost || '$500/year')
              ] : [
                'General Liability: $1M coverage',
                'Property Insurance: $500K coverage',
                'Workers Compensation: Statutory',
                'Business Interruption: $100K'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'rc-compliance-schedule',
            type: 'heading',
            content: 'Compliance Schedule',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'rc-schedule-list',
            type: 'list',
            content: [
              'Monthly: Tax filings, payroll reporting',
              'Quarterly: Financial reports to investors',
              'Annual: License renewals, insurance reviews',
              'Ongoing: Health inspections, staff training'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },

      // Implementation Plan Section
      {
        id: 'pre-launch',
        type: 'content',
        title: 'Pre-Launch',
        section: "implementation",
        pageNumber: 35,
        blocks: [
          {
            id: 'pre-title',
            type: 'heading',
            content: 'Pre-Launch Phase',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'pre-duration',
            type: 'paragraph',
            content: 'Duration: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.phase_duration || '3-4 months'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-milestones',
            type: 'heading',
            content: 'Key Milestones',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'pre-milestone-1',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[0]?.name || 'Business Registration') +
              ' - Due: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[0]?.due_date || 'Month 1') +
              ' - Responsible: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[0]?.responsible_party || 'Owner'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-milestone-2',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[1]?.name || 'Location Lease') +
              ' - Due: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[1]?.due_date || 'Month 1') +
              ' - Responsible: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[1]?.responsible_party || 'Owner'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-milestone-3',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[2]?.name || 'Renovation Complete') +
              ' - Due: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[2]?.due_date || 'Month 2') +
              ' - Responsible: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[2]?.responsible_party || 'Contractor'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-milestone-4',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[3]?.name || 'Equipment Installed') +
              ' - Due: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[3]?.due_date || 'Month 2') +
              ' - Responsible: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[3]?.responsible_party || 'Owner/Supplier'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-milestone-5',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[4]?.name || 'Staff Hiring') +
              ' - Due: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[4]?.due_date || 'Month 2') +
              ' - Responsible: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[4]?.responsible_party || 'Owner'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-milestone-6',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[5]?.name || 'Menu Development') +
              ' - Due: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[5]?.due_date || 'Month 2') +
              ' - Responsible: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[5]?.responsible_party || 'Head Baker'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-milestone-7',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[6]?.name || 'Supplier Agreements') +
              ' - Due: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[6]?.due_date || 'Month 2') +
              ' - Responsible: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[6]?.responsible_party || 'Owner'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-milestone-8',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[7]?.name || 'Marketing Campaign') +
              ' - Due: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[7]?.due_date || 'Month 3') +
              ' - Responsible: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[7]?.responsible_party || 'Marketing Lead'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-milestone-9',
            type: 'paragraph',
            content: (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[8]?.name || 'Soft Opening') +
              ' - Due: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[8]?.due_date || 'Month 3') +
              ' - Responsible: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.key_milestones?.[8]?.responsible_party || 'All Staff'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-critical-path',
            type: 'paragraph',
            content: 'Critical Path: ' + (companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.critical_path ||
              'Lease → Renovation → Equipment → Hiring → Menu → Marketing → Opening'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-resource',
            type: 'heading',
            content: 'Resource Allocation',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'pre-resource-text',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.implementation_timeline?.pre_launch_phase?.resource_allocation ||
              '40% Renovation & Equipment, 20% Initial Inventory, 15% Marketing, 15% Legal & Permits, 10% Working Capital',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'pre-budget',
            type: 'list',
            content: [
              'Renovation: $50,000',
              'Equipment: $70,000',
              'Inventory: $30,000',
              'Marketing: $25,000',
              'Legal/Permits: $15,000',
              'Working Capital: $60,000'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'post-launch',
        type: 'content',
        title: 'Post-Launch',
        section: "implementation",
        pageNumber: 36,
        blocks: [
          {
            id: 'post-title',
            type: 'heading',
            content: 'Launch & Post-Launch',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'post-launch-date',
            type: 'paragraph',
            content: 'Launch Date: ' + (companyAdditionalData.business_plan.implementation_timeline?.launch_phase?.launch_date || 'June 1, 2025'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'post-launch-activities',
            type: 'heading',
            content: 'Launch Activities',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'post-activities-list',
            type: 'list',
            content: companyAdditionalData.business_plan.implementation_timeline?.launch_phase?.launch_activities ||
              [
                'Grand opening event with local musicians',
                '50% off first 50 customers',
                'Social media campaign with influencers',
                'Press release to local media',
                'Community open house',
                'Loyalty program launch'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'post-launch-week',
            type: 'list',
            content: [
              'Day 1-3: Soft opening for friends/family',
              'Day 4-5: Invite-only preview for influencers',
              'Day 6-7: Public grand opening weekend'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'post-support',
            type: 'heading',
            content: 'Post-Launch Support',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'post-support-text',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.implementation_timeline?.launch_phase?.post_launch_support ||
              'Daily team debriefs for first week, weekly staff meetings, customer feedback collection, menu adjustments based on demand, extended support from vendors',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'post-support-schedule',
            type: 'list',
            content: [
              'Week 1: Daily operations review',
              'Week 2-4: Weekly performance meetings',
              'Month 2: Customer survey',
              'Month 3: Menu optimization'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'post-monitoring',
            type: 'heading',
            content: 'Performance Monitoring',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'post-monitoring-text',
            type: 'paragraph',
            content: companyAdditionalData.business_plan.implementation_timeline?.launch_phase?.performance_monitoring ||
              'Daily sales tracking, hourly customer counts, social media engagement metrics, review monitoring, mystery shopper program quarterly',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'post-kpis',
            type: 'list',
            content: [
              'Daily sales vs. target',
              'Customer count',
              'Average ticket value',
              'Social media growth',
              'Online reviews (4.5+ target)',
              'Staff retention'
            ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'post-first-90-days',
            type: 'heading',
            content: 'First 90 Days Plan',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'post-30-days',
            type: 'paragraph',
            content: 'Days 1-30: Stabilize operations, gather feedback, build regular customer base',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'post-60-days',
            type: 'paragraph',
            content: 'Days 31-60: Launch first cultural events, optimize menu, expand marketing',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'post-90-days',
            type: 'paragraph',
            content: 'Days 61-90: Evaluate performance, plan for next quarter, refine operations',
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'five-year-plan',
        type: 'content',
        title: '5 Year Plan',
        section: "implementation",
        pageNumber: 37,
        blocks: [
          {
            id: 'fyp-title',
            type: 'heading',
            content: '5 Year Plan',
            styles: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#001941',
              marginBottom: 20,
            },
            metadata: { level: 1 }
          },
          {
            id: 'fyp-year1',
            type: 'heading',
            content: 'Year 1 Goals',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fyp-year1-list',
            type: 'list',
            content: companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.annual_goals?.year_1 ||
              [
                'Successful launch and stabilization',
                'Build customer base of 500+ regulars',
                'Achieve monthly revenue of $45,000',
                'Establish brand in local market',
                'Launch cultural events program',
                'Positive cash flow by month 6'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fyp-year2',
            type: 'heading',
            content: 'Year 2 Goals',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fyp-year2-list',
            type: 'list',
            content: companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.annual_goals?.year_2 ||
              [
                'Expand menu with 20% new items',
                'Increase revenue by 30%',
                'Launch catering service',
                'Develop online ordering system',
                'Grow social media following to 10K+',
                'Achieve 4.5+ star rating on all platforms'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fyp-year3',
            type: 'heading',
            content: 'Year 3 Goals',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fyp-year3-list',
            type: 'list',
            content: companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.annual_goals?.year_3 ||
              [
                'Open second location',
                'Develop franchise model',
                'Launch product line (packaged goods)',
                'Regional expansion consideration',
                'Double revenue from year 1',
                'Build management team'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fyp-year4',
            type: 'heading',
            content: 'Year 4 Goals',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fyp-year4-list',
            type: 'list',
            content: companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.annual_goals?.year_4 ||
              [
                'Expand to 3-4 locations',
                'Launch wholesale distribution',
                'Develop training programs',
                'Build corporate partnerships',
                'Achieve regional recognition'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fyp-year5',
            type: 'heading',
            content: 'Year 5 Goals',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fyp-year5-list',
            type: 'list',
            content: companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.annual_goals?.year_5 ||
              [
                'National brand presence',
                'Explore international expansion',
                'IPO or acquisition consideration',
                'Industry awards and recognition',
                'Sustainability certification'
              ],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fyp-quarterly-objectives',
            type: 'heading',
            content: 'Quarterly Objectives (Year 1)',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fyp-q1',
            type: 'paragraph',
            content: 'Q1: ' + (companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.quarterly_objectives?.year_1?.q1?.join(', ') ||
              'Launch, establish operations, build initial customer base'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fyp-q2',
            type: 'paragraph',
            content: 'Q2: ' + (companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.quarterly_objectives?.year_1?.q2?.join(', ') ||
              'First cultural events, menu optimization, loyalty program launch'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fyp-q3',
            type: 'paragraph',
            content: 'Q3: ' + (companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.quarterly_objectives?.year_1?.q3?.join(', ') ||
              'Summer promotions, catering pilot, social media growth'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fyp-q4',
            type: 'paragraph',
            content: 'Q4: ' + (companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.quarterly_objectives?.year_1?.q4?.join(', ') ||
              'Holiday campaigns, year-end review, year 2 planning'),
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            }
          },
          {
            id: 'fyp-success-metrics',
            type: 'heading',
            content: 'Success Metrics',
            styles: {
              fontSize: 18,
              fontWeight: '600',
              color: '#001941',
              marginTop: 20,
              marginBottom: 10,
            },
            metadata: { level: 2 }
          },
          {
            id: 'fyp-financial-metrics',
            type: 'list',
            content: companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.success_metrics?.financial_metrics ||
              ['Revenue growth: 30% YoY', 'Profit margin: 15% by year 3', 'ROI: 25% by year 5'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fyp-operational-metrics',
            type: 'list',
            content: companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.success_metrics?.operational_metrics ||
              ['Customer satisfaction: 90%+', 'Staff retention: 80%+', 'Efficiency ratio: improving'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          },
          {
            id: 'fyp-customer-metrics',
            type: 'list',
            content: companyAdditionalData.business_plan.implementation_timeline?.five_year_roadmap?.success_metrics?.customer_metrics ||
              ['Repeat rate: 40%', 'NPS score: 50+', 'Social media followers: 50K+'],
            styles: {
              fontSize: 14,
              lineHeight: 22,
              color: '#333',
            },
            metadata: { listType: 'bullet' }
          }
        ],
        styles: {},
        formatting: {
          backgroundColor: '#ffffff'
        }
      }
    ];

    const sections = [
      { id: 'document', title: 'Document' },
      { id: 'overview', title: 'Overview' },
      { id: 'market-research', title: 'Market Research' },
      { id: 'products-services', title: 'Products & Services' },
      { id: 'sales-marketing', title: 'Sales & Marketing' },
      { id: 'financials', title: 'Financials' },
      { id: 'taxes', title: 'Taxes' },
      { id: 'operations', title: 'Operations' },
      { id: 'implementation', title: 'Implementation Plan' }
    ];;

    return { sections, pages };
  };

  const initialMessage = `
    Բիզնեսի անունը: ${businessName}
    Իդեա: ${idea}
    Վայրը: ${place}
    Յուրահատկւթյունները: ${uniqueTags.join(", ")}`;

  const businessPlanStructurePrompt = `
    !!! Պատասխանդ պետք է լինի միայն JSON օբյեկտ՝ առանց որևէ լրացուցիչ տեքստի, բացատրությունների կամ կոդի բլոկի:
    !!! Չօգտագործեք markdown կոդի բլոկներ (\`\`\`), միայն մաքուր JSON:

    Բիզնեսի անունը: ${businessName}
    Իդեա: ${idea}
    Վայրը: ${place}
    Յուրահատկւթյունները: ${uniqueTags.join(", ")}

    Խնդրում եմ ստեղծել միայն JSON պատասխան հետևյալ ճշգրիտ կառուցվածքով.
    Ահա JSON կառուցվածքը, որը պետք է հետևես.
    {
      "business_plan": {
        "metadata": {
          "business_name": "${businessName}",
          "idea": "${idea}",
          "location": "${place}",
          "unique_tags": ${JSON.stringify(uniqueTags)},
          "created_date": "${new Date().toISOString().split('T')[0]}",
          "last_updated": "${new Date().toISOString().split('T')[0]}",
          "version": "1.0.0",
          "page_name": "Business Plan"
        },
        "overview": {
          "page_name": "Overview",
          "executive_summary": {
            "page_name": "Executive Summary",
            "business_concept": "Բիզնեսի հիմնական հայեցակարգը",
            "mission_statement": "Բիզնեսի առաքելությունը",
            "vision_statement": "Բիզնեսի տեսլականը",
            "core_values": ["արժեք 1", "արժեք 2", "արժեք 3"],
            "unique_selling_proposition": "Եզակի վաճառքի առաջարկ",
            "short_term_goals": {
              "months_1_3": ["նպատակ 1", "նպատակ 2"],
              "months_4_6": ["նպատակ 1", "նպատակ 2"],
              "months_7_12": ["նպատակ 1", "նպատակ 2"]
            },
            "long_term_goals": {
              "year_1": ["նպատակ 1", "նպատակ 2", "նպատակ 3"],
              "year_2": ["նպատակ 1", "նպատակ 2", "նպատակ 3"],
              "year_3": ["նպատակ 1", "նպատակ 2", "նպատակ 3"],
              "year_4": ["նպատակ 1", "նպատակ 2", "նպատակ 3"],
              "year_5": ["նպատակ 1", "նպատակ 2", "նպատակ 3"]
            }
          },
          "swot_analysis": {
            "page_name": "SWOT Analysis",
            "strengths": {
              "internal_advantages": ["ուժեղ կողմ 1", "ուժեղ կողմ 2"],
              "competitive_edges": ["առավելություն 1", "առավելություն 2"],
              "resources": ["ռեսուրս 1", "ռեսուրս 2"],
              "capabilities": ["կարողություն 1", "կարողություն 2"]
            },
            "weaknesses": {
              "internal_limitations": ["սահմանափակում 1", "սահմանափակում 2"],
              "gaps": ["բացթողում 1", "բացթողում 2"],
              "vulnerabilities": ["խոցելիություն 1", "խոցելիություն 2"],
              "constraints": ["սահմանափակում 1", "սահմանափակում 2"]
            },
            "opportunities": {
              "market_opportunities": ["հնարավորություն 1", "հնարավորություն 2"],
              "technological_advancements": ["առաջընթաց 1", "առաջընթաց 2"],
              "partnership_potentials": ["գործընկերություն 1", "գործընկերություն 2"],
              "expansion_possibilities": ["ընդլայնում 1", "ընդլայնում 2"]
            },
            "threats": {
              "market_threats": ["սպառնալիք 1", "սպառնալիք 2"],
              "competitive_pressures": ["ճնշում 1", "ճնշում 2"],
              "regulatory_risks": ["ռիսկ 1", "ռիսկ 2"],
              "economic_factors": ["գործոն 1", "գործոն 2"]
            }
          },
          "business_models": {
            "page_name": "Business Models",
            "primary_model": {
              "name": "Հիմնական մոդել",
              "description": "Հիմնական բիզնես մոդելի նկարագրությունը",
              "revenue_streams": ["եկամտի հոսք 1", "եկամտի հոսք 2"],
              "cost_structure": ["ծախսերի կառուցվածք 1", "ծախսերի կառուցվածք 2"],
              "key_partners": ["գործընկեր 1", "գործընկեր 2"]
            },
            "secondary_models": [
              {
                "name": "Երկրորդական մոդել 1",
                "description": "Նկարագրություն",
                "implementation_timeline": "Ժամանակացույց"
              },
              {
                "name": "Երկրորդական մոդել 2",
                "description": "Նկարագրություն",
                "implementation_timeline": "Ժամանակացույց"
              }
            ],
            "hybrid_approaches": ["հիբրիդ մոտեցում 1", "հիբրիդ մոտեցում 2"]
          },
          "viability_analysis": {
            "page_name": "Viability Analysis",
            "market_viability": {
              "demand_assessment": "Պահանջարկի գնահատում",
              "competitive_landscape": "Մրցակցային լանդշաֆտ",
              "market_entry_barriers": "Շուկա մուտք գործելու խոչընդոտներ"
            },
            "financial_viability": {
              "startup_costs": "Ստարտափի ծախսեր",
              "break_even_analysis": "Անկման կետի վերլուծություն",
              "profitability_timeline": "Շահութաբերության ժամանակացույց"
            },
            "operational_viability": {
              "resource_availability": "Ռեսուրսների առկայություն",
              "skill_requirements": "Հմտությունների պահանջներ",
              "infrastructure_needs": "Ինֆրակառուցվածքի կարիքներ"
            },
            "risk_assessment": {
              "high_risks": ["բարձր ռիսկ 1", "բարձր ռիսկ 2"],
              "medium_risks": ["միջին ռիսկ 1", "միջին ռիսկ 2"],
              "low_risks": ["ցածր ռիսկ 1", "ցածր ռիսկ 2"]
            }
          },
          "legal_compliance": {
            "page_name": "Legal Compliance",
            "business_registration": {
              "legal_structure": "իրավաբանական կառուցվածք",
              "registration_number": "գրանցման համար",
              "tax_identification_number": "հարկային նույնացման համար"
            },
            "licenses_permits": [
              {
                "license_name": "արտոնագիր 1",
                "issuing_authority": "թողարկող մարմին",
                "renewal_date": "${new Date(Date.now() + 31536000000).toISOString().split('T')[0]}",
                "cost": "արժեք"
              },
              {
                "license_name": "արտոնագիր 2",
                "issuing_authority": "թողարկող մարմին",
                "renewal_date": "${new Date(Date.now() + 31536000000).toISOString().split('T')[0]}",
                "cost": "արժեք"
              }
            ],
            "tax_obligations": {
              "vat_registration": "ԱԱՀ գրանցում",
              "income_tax": "եկամտահարկ",
              "payroll_taxes": "աշխատավարձային հարկեր",
              "tax_filing_schedule": "հարկային հայտարարագրման ժամանակացույց"
            },
            "insurance_requirements": [
              {
                "insurance_type": "ապահովագրության տեսակ",
                "coverage_amount": "ապահովագրման գումար",
                "premium_cost": "պրեմիումի արժեք",
                "provider": "մատակարար"
              }
            ]
          }
        },
        "market_research": {
          "page_name": "Market Research",
          "industry_analysis": {
            "page_name": "Industry Analysis",
            "industry_overview": "Արդյունաբերության ակնարկ",
            "key_industry_players": ["խաղացող 1", "խաղացող 2"],
            "industry_trends": {
              "current_trends": ["ընթացիկ միտում 1", "ընթացիկ միտում 2"],
              "emerging_trends": ["ծագող միտում 1", "ծագող միտում 2"],
              "future_predictions": ["ապագայի կանխատեսում 1", "ապագայի կանխատեսում 2"]
            },
            "regulatory_environment": "Կարգավորող միջավայր",
            "technological_impact": "Տեխնոլոգիական ազդեցություն"
          },
          "target_audience": {
            "page_name": "Target Audience",
            "demographics": {
              "age_distribution": {
                "teenagers_13_17": "տոկոս",
                "young_adults_18_25": "տոկոս",
                "adults_26_35": "տոկոս",
                "middle_aged_36_50": "տոկոս",
                "seniors_51_plus": "տոկոս"
              },
              "gender_distribution": {
                "male": "տոկոս",
                "female": "տոկոս",
                "other": "տոկոս"
              },
              "income_levels": {
                "low_income": "տոկոս",
                "middle_income": "տոկոս",
                "high_income": "տոկոս"
              },
              "geographic_distribution": {
                "urban": "տոկոս",
                "suburban": "տոկոս",
                "rural": "տոկոս"
              },
              "education_levels": {
                "high_school": "տոկոս",
                "college": "տոկոս",
                "university": "տոկոս",
                "postgraduate": "տոկոս"
              }
            },
            "psychographics": {
              "lifestyle_patterns": ["կենսակերպի օրինակ 1", "կենսակերպի օրինակ 2"],
              "values_beliefs": ["արժեքներ/հավատալիքներ 1", "արժեքներ/հավատալիքներ 2"],
              "interests_hobbies": ["հետաքրքրություններ/հոբբիներ 1", "հետաքրքրություններ/հոբբիներ 2"],
              "personality_traits": ["անհատականության գծեր 1", "անհատականության գծեր 2"],
              "buying_behavior": {
                "purchase_frequency": "գնման հաճախականություն",
                "spending_habits": "ծախսելու սովորություններ",
                "brand_loyalty": "բրենդային հավատարմություն"
              }
            },
            "needs_analysis": {
              "functional_needs": ["ֆունկցիոնալ կարիք 1", "ֆունկցիոնալ կարիք 2"],
              "emotional_needs": ["զգացմունքային կարիք 1", "զգացմունքային կարիք 2"],
              "social_needs": ["սոցիալական կարիք 1", "սոցիալական կարիք 2"],
              "unmet_needs": ["չբավարարված կարիք 1", "չբավարարված կարիք 2"]
            },
            "pain_points": {
              "current_pain_points": ["ընթացիկ խնդիր 1", "ընթացիկ խնդիր 2"],
              "anticipated_pain_points": ["ակնկալվող խնդիր 1", "ակնկալվող խնդիր 2"],
              "pain_point_severity": {
                "mild": ["թեթև 1", "թեթև 2"],
                "moderate": ["միջին 1", "միջին 2"],
                "severe": ["ծանր 1", "ծանր 2"]
              }
            }
          },
          "market_size_trends": {
            "page_name": "Market Size & Trends",
            "current_market_size": {
              "local": "տեղական չափ",
              "regional": "տարածաշրջանային չափ",
              "national": "ազգային չափ",
              "total_addressable_market": "ընդհանուր հասանելի շուկա",
              "serviceable_available_market": "ծառայելի հասանելի շուկա",
              "serviceable_obtainable_market": "ծառայելի ձեռք բերվող շուկա"
            },
            "growth_metrics": {
              "historical_growth_rate": "պատմական աճի տեմպ",
              "projected_growth_rate": "կանխատեսվող աճի տեմպ",
              "compound_annual_growth_rate": "համակցված տարեկան աճի տեմպ"
            },
            "market_trends": {
              "seasonal_trends": ["սեզոնային միտում 1", "սեզոնային միտում 2"],
              "cyclical_trends": ["ցիկլային միտում 1", "ցիկլային միտում 2"],
              "secular_trends": ["երկարաժամկետ միտում 1", "երկարաժամկետ միտում 2"]
            },
            "forecast_analysis": {
              "optimistic_scenario": "լավատեսական սցենար",
              "pessimistic_scenario": "հոռետեսական սցենար",
              "realistic_scenario": "ռեալիստական սցենար",
              "quarterly_projections": {
                "q1_2024": "կանխատեսում",
                "q2_2024": "կանխատեսում",
                "q3_2024": "կանխատեսում",
                "q4_2024": "կանխատեսում"
              }
            }
          },
          "competitor_analysis": {
            "page_name": "Competitor Analysis",
            "direct_competitors": [
              {
                "name": "Մրցակից 1",
                "market_share": "շուկայական մասնաբաժին",
                "strengths": ["ուժեղ կողմ 1", "ուժեղ կողմ 2"],
                "weaknesses": ["թույլ կողմ 1", "թույլ կողմ 2"],
                "pricing_strategy": "գնագոյացման ռազմավարություն",
                "target_audience": "թիրախային լսարան"
              },
              {
                "name": "Մրցակից 2",
                "market_share": "շուկայական մասնաբաժին",
                "strengths": ["ուժեղ կողմ 1", "ուժեղ կողմ 2"],
                "weaknesses": ["թույլ կողմ 1", "թույլ կողմ 2"],
                "pricing_strategy": "գնագոյացման ռազմավարություն",
                "target_audience": "թիրախային լսարան"
              }
            ],
            "indirect_competitors": [
              {
                "name": "Ոչ ուղղակի մրցակից 1",
                "competitive_threat": "մրցակցային սպառնալիք",
                "market_overlap": "շուկայական համընկնում"
              },
              {
                "name": "Ոչ ուղղակի մրցակից 2",
                "competitive_threat": "մրցակցային սպառնալիք",
                "market_overlap": "շուկայական համընկնում"
              }
            ],
            "competitive_matrix": {
              "price_comparison": "գների համեմատություն",
              "quality_comparison": "որակի համեմատություն",
              "service_comparison": "ծառայության համեմատություն"
            },
            "swot_comparison": {
              "our_strengths": ["մեր ուժեղ կողմեր 1", "մեր ուժեղ կողմեր 2"],
              "competitor_weaknesses": ["մրցակցի թույլ կողմեր 1", "մրցակցի թույլ կողմեր 2"],
              "competitive_gaps": ["մրցակցային բացթողումներ 1", "մրցակցային բացթողումներ 2"]
            }
          }
        },
        "products_services": {
          "page_name": "Products & Services",
          "product_line": {
            "page_name": "Product Line",
            "core_products": [
              {
                "product_id": "PROD001",
                "name": "Հիմնական ապրանք 1",
                "description": "Նկարագրություն",
                "features": ["հատկություն 1", "հատկություն 2"],
                "benefits": ["օգուտ 1", "օգուտ 2"],
                "target_customer": "Թիրախային հաճախորդ",
                "development_stage": "զարգացման փուլ",
                "launch_date": "${new Date(Date.now() + 7776000000).toISOString().split('T')[0]}",
                "detailed_pricing": {
                  "unit_cost": "միավորի արժեք",
                  "wholesale_price": "մեծածախ գին",
                  "retail_price": "մանրածախ գին",
                  "profit_margin_percentage": "շահույթի մարժայի տոկոս",
                  "discount_structures": {
                    "volume_discounts": "ծավալային զեղչեր",
                    "seasonal_discounts": "սեզոնային զեղչեր",
                    "promotional_discounts": "ակցիոն զեղչեր"
                  }
                }
              }
            ],
            "secondary_products": [
              {
                "product_id": "PROD002",
                "name": "Երկրորդական ապրանք 1",
                "description": "Նկարագրություն",
                "purpose": "նպատակ",
                "target_market": "Թիրախային շուկա",
                "pricing_details": {
                  "unit_price": "միավորի գին",
                  "profit_margin_percentage": "շահույթի մարժայի տոկոս"
                }
              }
            ],
            "future_products": [
              {
                "product_id": "PROD003",
                "name": "Ապագայի ապրանք 1",
                "concept": "հայեցակարգ",
                "expected_launch": "${new Date(Date.now() + 157680000000).toISOString().split('T')[0]}",
                "development_timeline": "զարգացման ժամանակացույց",
                "estimated_pricing": "գնահատված գին"
              }
            ]
          },
          "service_offerings": {
            "page_name": "Service Offerings",
            "core_services": [
              {
                "service_id": "SERV001",
                "name": "Հիմնական ծառայություն 1",
                "description": "Նկարագրություն",
                "delivery_method": "առաքման մեթոդ",
                "service_level": "ծառայության մակարդակ",
                "pricing_tiers": [
                  {
                    "tier_name": "գնային մակարդակ 1",
                    "price": "գին",
                    "features_included": ["ներառված հատկություն 1", "ներառված հատկություն 2"],
                    "profit_margin": "շահույթի մարժա"
                  },
                  {
                    "tier_name": "գնային մակարդակ 2",
                    "price": "գին",
                    "features_included": ["ներառված հատկություն 1", "ներառված հատկություն 2"],
                    "profit_margin": "շահույթի մարժա"
                  }
                ],
                "pricing_strategy": "գնագոյացման ռազմավարություն"
              }
            ],
            "premium_services": [
              {
                "service_id": "SERV002",
                "name": "Պրեմիում ծառայություն 1",
                "description": "Նկարագրություն",
                "value_added": "ավելացված արժեք",
                "target_clients": "Թիրախային հաճախորդներ",
                "premium_pricing": "պրեմիում գին",
                "profit_margin_percentage": "շահույթի մարժայի տոկոս"
              }
            ],
            "custom_services": [
              {
                "service_id": "SERV003",
                "name": "Անհատականացված ծառայություն 1",
                "description": "Նկարագրություն",
                "customization_options": ["հարմարեցման ընտրանք 1", "հարմարեցման ընտրանք 2"],
                "minimum_order": "նվազագույն պատվեր",
                "pricing_model": "գնագոյացման մոդել",
                "quotation_process": "գնահատման գործընթաց"
              }
            ]
          },
          "innovation_pipeline": {
            "page_name": "Innovation Pipeline",
            "r_and_d_projects": [
              {
                "project_id": "RD001",
                "name": "Նախագիծ 1",
                "description": "Նկարագրություն",
                "status": "կարգավիճակ",
                "expected_completion": "${new Date(Date.now() + 15552000000).toISOString().split('T')[0]}",
                "budget_allocation": "բյուջեի հատկացում"
              }
            ],
            "technology_roadmap": {
              "phase_1": ["տեխնոլոգիա 1", "տեխնոլոգիա 2"],
              "phase_2": ["տեխնոլոգիա 1", "տեխնոլոգիա 2"],
              "phase_3": ["տեխնոլոգիա 1", "տեխնոլոգիա 2"]
            },
            "intellectual_property": {
              "patents": ["արտոնագիր 1", "արտոնագիր 2"],
              "trademarks": ["ապրանքանիշ 1", "ապրանքանիշ 2"],
              "trade_secrets": ["գաղտնիք 1", "գաղտնիք 2"],
              "trademark_registration_costs": ["արտոնագրման ծախսեր 1", "արտոնագրման ծախսեր 2"],
              "patent_application_costs": ["արտոնագրման դիմումի ծախսեր 1", "արտոնագրման դիմումի ծախսեր 2"],
              "copyright_protection_costs": "հեղինակային իրավունքի պաշտպանության ծախսեր",
              "non_disclosure_agreements": "գաղտնիության պայմանագրեր"
            }
          },
          "quality_assurance": {
            "page_name": "Quality Assurance",
            "quality_standards": ["ստանդարտ 1", "ստանդարտ 2"],
            "testing_procedures": ["փորձարկման ընթացակարգ 1", "փորձարկման ընթացակարգ 2"],
            "quality_metrics": {
              "defect_rate": "թերի տոկոս",
              "customer_satisfaction": "հաճախորդների բավարարվածություն",
              "return_rate": "վերադարձի տոկոս"
            },
            "continuous_improvement": {
              "feedback_mechanisms": ["հետադարձ կապի մեխանիզմ 1", "հետադարձ կապի մեխանիզմ 2"],
              "improvement_initiatives": ["բարելավման նախաձեռնություն 1", "բարելավման նախաձեռնություն 2"]
            },
            "quality_certifications": {
              "iso_certification_costs": "ISO սերտիֆիկացման ծախսեր",
              "industry_specific_certifications": ["արդյունաբերության համար հատուկ սերտիֆիկատներ 1", "արդյունաբերության համար հատուկ սերտիֆիկատներ 2"],
              "inspection_fees": "ստուգման վճարներ",
              "compliance_audit_costs": "համապատասխանության աուդիտի ծախսեր"
            }
          }
        },
        "sales_marketing": {
          "page_name": "Sales & Marketing",
          "marketing_strategy": {
            "page_name": "Marketing Strategy",
            "positioning_statement": "Դիրքավորման հայտարարություն",
            "value_proposition": "Արժեքի առաջարկ",
            "messaging_framework": {
              "core_messages": ["հիմնական հաղորդագրություն 1", "հիմնական հաղորդագրություն 2"],
              "tone_of_voice": "ձայնի տոն",
              "brand_personality": "բրենդի անհատականություն"
            },
            "marketing_mix": {
              "product_strategy": "Ապրանքի ռազմավարություն",
              "price_strategy": "Գնագոյացման ռազմավարություն",
              "place_strategy": "Տեղաբաշխման ռազմավարություն",
              "promotion_strategy": "Գովազդային ռազմավարություն"
            },
            "marketing_campaign_details": {
              "specific_campaign_budgets": {
                "launch_campaign": "մեկնարկային արշավի բյուջե",
                "seasonal_campaign": "սեզոնային արշավի բյուջե",
                "digital_campaign": "դիջիթալ արշավի բյուջե"
              },
              "agency_fees": "գործակալության վճարներ",
              "promotional_materials_costs": {
                "printing_costs": "տպագրության ծախսեր",
                "merchandise_costs": "մերչենդայզի ծախսեր",
                "display_materials": "ցուցադրման նյութեր"
              },
              "event_sponsorship_costs": "միջոցառումների հովանավորչության ծախսեր"
            }
          },
          "sales_strategy": {
            "page_name": "Sales Strategy",
            "sales_process": {
              "lead_generation": "Լիդերի ստեղծում",
              "qualification": "Որակավորում",
              "presentation": "Ներկայացում",
              "proposal": "Առաջարկ",
              "closing": "Փակում",
              "follow_up": "Հետևում"
            },
            "sales_channels": {
              "direct_sales": "Ուղղակի վաճառք",
              "online_sales": "Առցանց վաճառք",
              "retail_partners": "Մանրածախ գործընկերներ",
              "distribution_network": "Բաշխման ցանց"
            },
            "sales_targets": {
              "monthly_targets": {
                "month_1": "նպատակ",
                "month_2": "նպատակ",
                "month_3": "նպատակ"
              },
              "quarterly_targets": {
                "q1": "նպատակ",
                "q2": "նպատակ",
                "q3": "նպատակ",
                "q4": "նպատակ"
              },
              "annual_targets": {
                "year_1": "նպատակ",
                "year_2": "նպատակ",
                "year_3": "նպատակ"
              }
            }
          },
          "digital_marketing": {
            "page_name": "Digital Marketing",
            "content_strategy": {
              "content_types": ["բովանդակության տեսակ 1", "բովանդակության տեսակ 2"],
              "content_calendar": {
                "daily_posts": "օրական գրառումներ",
                "weekly_themes": "շաբաթական թեմաներ",
                "monthly_campaigns": "ամսական արշավներ"
              },
              "seo_strategy": {
                "primary_keywords": ["հիմնական բանալի բառ 1", "հիմնական բանալի բառ 2"],
                "secondary_keywords": ["երկրորդական բանալի բառ 1", "երկրորդական բանալի բառ 2"],
                "local_seo": "տեղական SEO"
              }
            },
            "social_media_plan": {
              "platform_strategies": {
                "facebook": "ռազմավարություն",
                "instagram": "ռազմավարություն",
                "twitter": "ռազմավարություն",
                "linkedin": "ռազմավարություն",
                "tiktok": "ռազմավարություն"
              },
              "engagement_metrics": {
                "follower_growth": "հետևորդների աճ",
                "engagement_rate": "ներգրավվածության տոկոս",
                "conversion_rate": "կոնվերսիայի տոկոս"
              },
              "advertising_budget": {
                "monthly_budget": "ամսական բյուջե",
                "ad_allocations": {
                  "facebook_ads": "բյուջե",
                  "google_ads": "բյուջե",
                  "instagram_ads": "բյուջե"
                }
              }
            },
            "email_marketing": {
              "list_segmentation": {
                "new_subscribers": "նոր բաժանորդներ",
                "active_customers": "ակտիվ հաճախորդներ",
                "inactive_customers": "ոչ ակտիվ հաճախորդներ",
                "loyal_customers": "հավատարիմ հաճախորդներ"
              },
              "campaign_schedule": {
                "weekly_newsletter": "շաբաթական տեղեկագիր",
                "promotional_emails": "գովազդային նամակներ",
                "abandoned_cart_emails": "թողնված զամբյուղի նամակներ"
              },
              "performance_metrics": {
                "open_rate": "բացման տոկոս",
                "click_through_rate": "սեղմումների տոկոս",
                "conversion_rate": "կոնվերսիայի տոկոս"
              }
            },
            "analytics_measurement": {
              "analytics_software_costs": "վերլուծական ծրագրային ապահովման ծախսեր",
              "market_research_budget": "շուկայի հետազոտության բյուջե",
              "customer_survey_costs": "հաճախորդների հարցման ծախսեր",
              "data_analysis_tools": "տվյալների վերլուծության գործիքներ"
            }
          },
          "brand_development": {
            "page_name": "Brand Development",
            "brand_identity": {
              "logo_design": "լոգոյի դիզայն",
              "color_palette": ["գույն 1", "գույն 2", "գույն 3"],
              "typography": ["տառատեսակ 1", "տառատեսակ 2"],
              "visual_elements": ["տեսողական տարր 1", "տեսողական տարր 2"]
            },
            "brand_voice": {
              "tone": "տոն",
              "language_style": "լեզվի ոճ",
              "communication_style": "հաղորդակցման ոճ"
            },
            "brand_positioning": {
              "market_position": "շուկայական դիրք",
              "competitive_differentiation": "մրցակցային տարբերակում",
              "target_perception": "թիրախային ընկալում"
            },
            "community_engagement": {
              "local_sponsorship_budget": "տեղական հովանավորչության բյուջե",
              "charity_donations": "բարեգործական նվիրատվություններ",
              "community_events": "համայնքի միջոցառումներ",
              "public_relations_costs": "հանրային կապերի ծախսեր"
            }
          },
          "customer_service": {
            "page_name": "Customer Service",
            "support_channels": {
              "phone_support": "հեռախոսային աջակցություն",
              "email_support": "էլեկտրոնային փոստի աջակցություն",
              "live_chat": "ուղիղ զրույց",
              "social_media_support": "սոցիալական ցանցերի աջակցություն"
            },
            "service_level_agreements": {
              "response_time": "արձագանքման ժամանակ",
              "resolution_time": "լուծման ժամանակ",
              "availability": "հասանելիություն"
            },
            "customer_feedback_systems": {
              "feedback_forms": "հետադարձ կապի ձևեր",
              "review_platforms": "կարծիքների հարթակներ",
              "customer_satisfaction_surveys": "հաճախորդների բավարարվածության հարցումներ"
            },
            "complaint_resolution_process": {
              "escalation_procedures": "էսկալացիայի ընթացակարգեր",
              "refund_policies": "վերադարձի քաղաքականություն",
              "customer_recovery_strategies": "հաճախորդների վերականգնման ռազմավարություններ"
            }
          }
        },
        "financials": {
          "page_name": "Financials",
          "revenue_projections": {
            "page_name": "Revenue Projections",
            "monthly_revenue": {
              "year_1": {
                "january": "եկամուտ",
                "february": "եկամուտ",
                "march": "եկամուտ",
                "april": "եկամուտ",
                "may": "եկամուտ",
                "june": "եկամուտ",
                "july": "եկամուտ",
                "august": "եկամուտ",
                "september": "եկամուտ",
                "october": "եկամուտ",
                "november": "եկամուտ",
                "december": "եկամուտ"
              },
              "year_2": {
                "january": "եկամուտ",
                "february": "եկամուտ",
                "march": "եկամուտ",
                "april": "եկամուտ",
                "may": "եկամուտ",
                "june": "եկամուտ",
                "july": "եկամուտ",
                "august": "եկամուտ",
                "september": "եկամուտ",
                "october": "եկամուտ",
                "november": "եկամուտ",
                "december": "եկամուտ"
              },
              "year_3": {
                "january": "եկամուտ",
                "february": "եկամուտ",
                "march": "եկամուտ",
                "april": "եկամուտ",
                "may": "եկամուտ",
                "june": "եկամուտ",
                "july": "եկամուտ",
                "august": "եկամուտ",
                "september": "եկամուտ",
                "october": "եկամուտ",
                "november": "եկամուտ",
                "december": "եկամուտ"
              }
            },
            "revenue_streams": {
              "product_sales": {
                "percentage": "տոկոս",
                "growth_rate": "աճի տեմպ",
                "seasonality": "սեզոնայնություն"
              },
              "service_revenue": {
                "percentage": "տոկոս",
                "growth_rate": "աճի տեմպ",
                "recurring_revenue": "կրկնվող եկամուտ"
              },
              "subscription_revenue": {
                "percentage": "տոկոս",
                "growth_rate": "աճի տեմպ",
                "churn_rate": "կորուստի տոկոս"
              },
              "other_revenue": {
                "percentage": "տոկոս",
                "sources": ["աղբյուր 1", "աղբյուր 2"]
              }
            },
            "pricing_strategy": {
              "price_points": ["գնային կետ 1", "գնային կետ 2"],
              "discount_strategy": "զեղչերի ռազմավարություն",
              "competitive_pricing": "մրցակցային գնագոյացում",
              "value_based_pricing": "արժեքով հիմնված գնագոյացում"
            }
          },
          "expense_breakdown": {
            "page_name": "Expense Breakdown",
            "fixed_costs": {
              "rent": "ամսական վարձ",
              "utilities": {
                "electricity": "էլեկտրաէներգիա",
                "water": "ջուր",
                "internet": "ինտերնետ",
                "telephone": "հեռախոս",
                "monthly_total": "ամսական ընդհանուր"
              },
              "insurance": "ապահովագրություն",
              "software_subscriptions": "ծրագրային ապահովման բաժանորդագրություններ",
              "business_banking_fees": {
                "account_maintenance": "հաշվի սպասարկում",
                "transaction_fees": "գործարքի վճարներ",
                "credit_card_processing": "վարկային քարտերի մշակում"
              },
              "professional_fees": {
                "accountant": "հաշվապահ",
                "lawyer": "իրավաբան",
                "consultant": "խորհրդատու"
              }
            },
            "variable_costs": {
              "materials": "նյութեր",
              "production": "արտադրություն",
              "shipping": "առաքում",
              "commission": "հանձնաժողով",
              "marketing": "մարքեթինգ",
              "inventory_shrinkage": "պաշարների կորուստ",
              "returns_refunds": "վերադարձներ/վերադարձումներ"
            },
            "operational_costs": {
              "maintenance": "սպասարկում",
              "repairs": "վերանորոգում",
              "training": "ուսուցում",
              "travel": "ճամփորդություն",
              "professional_services": "մասնագիտական ծառայություններ",
              "emergency_repairs": "արտակարգ վերանորոգումներ"
            },
            "detailed_equipment_costs": [
              {
                "equipment_id": "EQ001",
                "name": "սարքավորում 1",
                "brand_model": "բրենդ/մոդել",
                "purpose": "նպատակ",
                "cost": "արժեք",
                "maintenance_cost": "սպասարկման արժեք",
                "lifespan": "ծառայության ժամկետ"
              }
            ]
          },
          "profit_loss_statement": {
            "page_name": "Profit & Loss Statement",
            "monthly_pnl": {
              "year_1": {
                "january": {
                  "revenue": "եկամուտ",
                  "cogs": "ապրանքի արժեք",
                  "gross_profit": "համախառն շահույթ",
                  "operating_expenses": "գործառնական ծախսեր",
                  "net_profit": "զուտ շահույթ"
                }
              }
            },
            "key_metrics": {
              "gross_margin": "համախառն մարժա",
              "operating_margin": "գործառնական մարժա",
              "net_margin": "զուտ մարժա",
              "ebitda": "EBITDA"
            },
            "profitability_timeline": {
              "break_even_point": "անկման կետ",
              "profitability_milestone": "շահութաբերության հիմնական իրադարձություն",
              "target_profit_margin": "թիրախային շահույթի մարժա"
            }
          },
          "cash_flow_analysis": {
            "page_name": "Cash Flow Analysis",
            "operating_cash_flow": {
              "monthly_cash_in": "դրամական մուտքեր",
              "monthly_cash_out": "դրամական ելքեր",
              "net_cash_flow": "զուտ դրամական հոսք"
            },
            "investing_cash_flow": {
              "equipment_purchases": "սարքավորումների գնումներ",
              "property_investments": "գույքի ներդրումներ",
              "r_and_d_investments": "գիտահետազոտական և փորձարարական ներդրումներ"
            },
            "financing_cash_flow": {
              "loan_proceeds": "վարկի միջոցներ",
              "equity_investments": "կապիտալ ներդրումներ",
              "dividend_payments": "շահաբաթինների վճարումներ"
            },
            "cash_balance_forecast": {
              "minimum_cash_balance": "նվազագույն դրամական մնացորդ",
              "working_capital_requirements": "աշխատանքային կապիտալի պահանջներ",
              "cash_buffer": "դրամական բուֆեր"
            }
          },
          "funding_requirements": {
            "page_name": "Funding Requirements",
            "startup_capital": {
              "amount_needed": "պահանջվող գումար",
              "use_of_funds": {
                "equipment": "սարքավորումներ",
                "inventory": "պաշար",
                "marketing": "մարքեթինգ",
                "working_capital": "աշխատանքային կապիտալ",
                "legal_registration": "իրավաբանական գրանցում",
                "pre_launch_expenses": "մեկնարկից առաջ ծախսեր"
              },
              "funding_sources": {
                "personal_savings": "անձնական խնայողություններ",
                "bank_loans": "բանկային վարկեր",
                "investors": "ներդրողներ",
                "grants": "նվիրատվություններ"
              }
            },
            "growth_funding": {
              "phase_1_funding": "փուլ 1 ֆինանսավորում",
              "phase_2_funding": "փուլ 2 ֆինանսավորում",
              "phase_3_funding": "փուլ 3 ֆինանսավորում"
            },
            "return_expectations": {
              "investor_roi": "ներդրողների ներդրման վերադարձ",
              "payback_period": "վերադարձման ժամանակահատված",
              "exit_strategy": {
                "acquisition_possibilities": "գնման հնարավորություններ",
                "ipo_potential": "IPO հնարավորություն",
                "management_buyout": "կառավարման գնում",
                "liquidation_plan": "լիկվիդացիայի պլան"
              }
            }
          },
          "contingency_fund": {
            "page_name": "Contingency Fund",
            "percentage_of_budget": "բյուջեի տոկոս",
            "specific_scenarios_covered": [
              "սցենար 1",
              "սցենար 2",
              "սցենար 3"
            ],
            "access_conditions": "մուտքի պայմաններ",
            "replenishment_strategy": "վերալիցքավորման ռազմավարություն"
          }
        },
        "operations": {
          "page_name": "Operations",
          "organizational_structure": {
            "page_name": "Organizational Structure",
            "management_team": [
              {
                "position": "պաշտոն",
                "name": "անուն",
                "qualifications": "որակավորումներ",
                "responsibilities": ["պարտականություն 1", "պարտականություն 2"],
                "experience": "փորձ",
                "salary_details": {
                  "base_salary": "հիմնական աշխատավարձ",
                  "bonus_structure": "բոնուսային կառուցվածք",
                  "benefits_package": "օնլայն փաթեթ"
                }
              }
            ],
            "staffing_plan": {
              "immediate_hires": [
                {
                  "position": "պաշտոն",
                  "experience_level": "փորձի մակարդակ",
                  "salary_range": "աշխատավարձի միջակայք",
                  "hiring_budget": "աշխատանքի ընդունման բյուջե"
                }
              ],
              "year_1_hires": ["աշխատակից 1", "աշխատակից 2"],
              "year_2_hires": ["աշխատակից 1", "աշխատակից 2"],
              "year_3_hires": ["աշխատակից 1", "աշխատակից 2"],
              "seasonal_staffing_needs": {
                "high_season": "բարձր սեզոն",
                "low_season": "ցածր սեզոն",
                "staffing_levels": "աշխատակազմի մակարդակներ"
              }
            },
            "organizational_chart": "կազմակերպչական սխեմա",
            "human_resources_details": {
              "hiring_budget_breakdown": {
                "advertising_costs": "գովազդային ծախսեր",
                "agency_fees": "գործակալության վճարներ",
                "background_checks": "ստուգումներ",
                "onboarding_costs": {
                  "uniforms": "համազգեստ",
                  "equipment": "սարքավորում",
                  "training_materials": "ուսուցման նյութեր"
                }
              },
              "employee_benefits_package": {
                "health_insurance": "առողջության ապահովագրություն",
                "retirement_plans": "կենսաթոշակային պլաններ",
                "paid_time_off": "վճարովի արձակուրդ",
                "other_benefits": "այլ նպաստներ"
              },
              "training_development_budget": "ուսուցման և զարգացման բյուջե",
              "hr_policies": "մարդկային ռեսուրսների քաղաքականություն",
              "team_development": {
                "professional_development_budget": "մասնագիտական զարգացման բյուջե",
                "team_building_activities": "թիմային շինարարության գործողություններ",
                "performance_bonuses": "կատարողականության բոնուսներ",
                "equity_stock_options": "բաժնետոմսերի ընտրանքներ"
              }
            }
          },
          "facilities_equipment": {
            "page_name": "Facilities & Equipment",
            "location_analysis": {
              "site_selection": "տեղանքի ընտրություն",
              "facility_requirements": "հարմարությունների պահանջներ",
              "expansion_potential": "ընդլայնման պոտենցիալ"
            },
            "equipment_list": [
              {
                "equipment_id": "EQ001",
                "name": "սարքավորում 1",
                "purpose": "նպատակ",
                "cost": "արժեք",
                "maintenance_schedule": "սպասարկման ժամանակացույց",
                "brand_model": "բրենդ/մոդել"
              }
            ],
            "technology_stack": {
              "hardware": ["սարքավորում 1", "սարքավորում 2"],
              "software": ["ծրագրային ապահովում 1", "ծրագրային ապահովում 2"],
              "it_infrastructure": "ՏՀ ինֆրակառուցվածք"
            },
            "technology_infrastructure": {
              "website_development_costs": "կայքի մշակման ծախսեր",
              "software_licenses": "ծրագրային ապահովման լիցենզիաներ",
              "it_support_maintenance": "ՏՀ աջակցություն և սպասարկում",
              "cybersecurity_measures": "կիբերանվտանգության միջոցառումներ"
            },
            "physical_location_details": {
              "exact_square_footage": "ճշգրիտ տարածք",
              "space_requirements": "տարածքի պահանջներ",
              "layout_plans": "դասավորության պլաններ",
              "renovation_construction_costs": "վերանորոգման/կառուցման ծախսեր",
              "signage_branding": "ցուցանակներ/բրենդավորում",
              "parking_accessibility": "ավտոկայանատեղի/մատչելիություն",
              "security_systems": "անվտանգության համակարգեր"
            }
          },
          "supply_chain": {
            "page_name": "Supply Chain",
            "supplier_network": [
              {
                "supplier_id": "SUP001",
                "name": "մատակարար 1",
                "materials_provided": "մատակարարվող նյութեր",
                "lead_time": "արտադրության ժամկետ",
                "payment_terms": "վճարման պայմաններ",
                "minimum_order_quantities": "նվազագույն պատվերի քանակներ",
                "quality_requirements": "որակի պահանջներ"
              }
            ],
            "inventory_management": {
              "inventory_levels": "պաշարների մակարդակներ",
              "reorder_points": "կրկնակի պատվերի կետեր",
              "storage_requirements": "պահեստավորման պահանջներ"
            },
            "logistics": {
              "shipping_methods": "առաքման մեթոդներ",
              "delivery_times": "առաքման ժամանակներ",
              "cost_structure": "ծախսերի կառուցվածք"
            },
            "supplier_details": {
              "backup_suppliers": ["պահեստային մատակարար 1", "պահեստային մատակարար 2"],
              "quality_control_requirements": "որակի հսկողության պահանջներ",
              "contract_terms": "պայմանագրի պայմաններ"
            }
          },
          "quality_control": {
            "page_name": "Quality Control",
            "quality_standards": ["ստանդարտ 1", "ստանդարտ 2"],
            "inspection_procedures": ["ստուգման ընթացակարգ 1", "ստուգման ընթացակարգ 2"],
            "quality_metrics": {
              "defect_rate": "թերի տոկոս",
              "customer_complaints": "հաճախորդների բողոքներ",
              "return_rate": "վերադարձի տոկոս"
            }
          },
          "environmental_sustainability": {
            "page_name": "Environmental Sustainability",
            "waste_management_costs": "թափոնների կառավարման ծախսեր",
            "energy_efficiency_investments": "էներգաարդյունավետության ներդրումներ",
            "sustainability_certifications": "կայունության սերտիֆիկատներ",
            "environmental_compliance": "շրջակա միջավայրի համապատասխանություն"
          }
        },
        "risk_management": {
          "page_name": "Risk Management",
          "risk_identification": {
            "page_name": "Risk Identification",
            "market_risks": ["շուկայական ռիսկ 1", "շուկայական ռիսկ 2"],
            "financial_risks": ["ֆինանսական ռիսկ 1", "ֆինանսական ռիսկ 2"],
            "operational_risks": ["գործառնական ռիսկ 1", "գործառնական ռիսկ 2"],
            "compliance_risks": ["համապատասխանության ռիսկ 1", "համապատասխանության ռիսկ 2"]
          },
          "risk_assessment": {
            "page_name": "Risk Assessment",
            "probability_analysis": "հավանականության վերլուծություն",
            "impact_analysis": "ազդեցության վերլուծություն",
            "risk_prioritization": "ռիսկերի առաջնահերթություն"
          },
          "mitigation_strategies": {
            "page_name": "Mitigation Strategies",
            "preventive_measures": ["կանխարգելիչ միջոցառում 1", "կանխարգելիչ միջոցառում 2"],
            "contingency_plans": ["պահեստային պլան 1", "պահեստային պլան 2"],
            "insurance_coverage": "ապահովագրական ծածկույթ"
          },
          "monitoring_plan": {
            "page_name": "Monitoring Plan",
            "key_risk_indicators": ["հիմնական ռիսկի ցուցանիշ 1", "հիմնական ռիսկի ցուցանիշ 2"],
            "review_frequency": "վերանայման հաճախականություն",
            "reporting_structure": "հաշվետվության կառուցվածք"
          }
        },
        "implementation_timeline": {
          "page_name": "Implementation Timeline",
          "pre_launch_phase": {
            "page_name": "Pre-Launch Phase",
            "phase_duration": "փուլի տևողություն",
            "key_milestones": [
              {
                "milestone_id": "MIL001",
                "name": "հիմնական իրադարձություն 1",
                "description": "նկարագրություն",
                "due_date": "${new Date(Date.now() + 2592000000).toISOString().split('T')[0]}",
                "dependencies": "կախվածություններ",
                "responsible_party": "պատասխանատու կողմ"
              }
            ],
            "critical_path": "քննադատական ուղի",
            "resource_allocation": "ռեսուրսների հատկացում"
          },
          "launch_phase": {
            "page_name": "Launch Phase",
            "launch_date": "${new Date(Date.now() + 7776000000).toISOString().split('T')[0]}",
            "launch_activities": ["գործողություն 1", "գործողություն 2"],
            "post_launch_support": "մեկնարկից հետո աջակցություն",
            "performance_monitoring": "կատարողականության մոնիտորինգ"
          },
          "growth_phase": {
            "page_name": "Growth Phase",
            "expansion_timeline": "ընդլայնման ժամանակացույց",
            "market_penetration": "շուկայի ներթափանցում",
            "scaling_strategy": "մասշտաբավորման ռազմավարություն"
          },
          "five_year_roadmap": {
            "page_name": "Five Year Roadmap",
            "quarterly_objectives": {
              "year_1": {
                "q1": ["նպատակ 1", "նպատակ 2"],
                "q2": ["նպատակ 1", "նպատակ 2"],
                "q3": ["նպատակ 1", "նպատակ 2"],
                "q4": ["նպատակ 1", "նպատակ 2"]
              },
              "year_2": {
                "q1": ["նպատակ 1", "նպատակ 2"],
                "q2": ["նպատակ 1", "նպատակ 2"],
                "q3": ["նպատակ 1", "նպատակ 2"],
                "q4": ["նպատակ 1", "նպատակ 2"]
              }
            },
            "annual_goals": {
              "year_1": ["նպատակ 1", "նպատակ 2", "նպատակ 3"],
              "year_2": ["նպատակ 1", "նպատակ 2", "նպատակ 3"],
              "year_3": ["նպատակ 1", "նպատակ 2", "նպատակ 3"],
              "year_4": ["նպատակ 1", "նպատակ 2", "նպատակ 3"],
              "year_5": ["նպատակ 1", "նպատակ 2", "նպատակ 3"]
            },
            "success_metrics": {
              "financial_metrics": ["ֆինանսական ցուցանիշ 1", "ֆինանսական ցուցանիշ 2"],
              "operational_metrics": ["գործառնական ցուցանիշ 1", "գործառնական ցուցանիշ 2"],
              "customer_metrics": ["հաճախորդների ցուցանիշ 1", "հաճախորդների ցուցանիշ 2"]
            }
          }
        }
      }
    }

    Պահպանիր ճշգրիտ JSON կառուցվածքը:
    `;

  const chat = useAiChat({
    history: [
      {
        role: "user",
        text: initialMessage,
      },
    ],
  });

  const extractJSONFromResponse = (text: string) => {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    const directJsonMatch = text.match(/\{[\s\S]*\}/);
    if (directJsonMatch) {
      return directJsonMatch[0].trim();
    }

    return text.trim();
  };

  const generateBusinessPlan = async () => {
    if (!activeCompany?.id) {
      Alert.alert("Սխալ", "Չկա ակտիվ բիզնես պլան");
      return;
    }
    try {
      setIsCreatingBizPlan(true);

      const templateResponse = await chat.sendMessage({
        message: businessPlanStructurePrompt
      });

      const jsonText = extractJSONFromResponse(templateResponse.text!);
      const cleanedJSON = jsonText;

      let parsedTemplate;
      try {
        parsedTemplate = JSON.parse(cleanedJSON);
      } catch (parseError) {
        try {
          parsedTemplate = JSON.parse(cleanedJSON);
        } catch (e) {
          const fixedJSON = cleanedJSON
            .replace(/:\s*"([^"]*?)[\n\r]+([^"]*?)"/g, ': "$1 $2"')
            .replace(/:\s*"([^"]*)"([^",}])/g, ': "$1"$2')
            .replace(/[\x00-\x1F\x7F]/g, ' ');

          parsedTemplate = JSON.parse(fixedJSON);
        }
      }

      if (parsedTemplate) {
        if (!parsedTemplate.business_plan) {
          console.error("Parsed template missing business_plan property");
          throw new Error("Invalid business plan structure");
        }

        const { pages, sections } = convertRendererSectionsToPageFormat(parsedTemplate);
        const total_pages = pages.length;

        const companyAdditionalData: CompanyAdditionalDataDto = {
          business_plan: {
            ...parsedTemplate.business_plan,
            metadata: {
              ...parsedTemplate.business_plan.metadata,
              total_pages,
              version: parsedTemplate.business_plan.metadata?.version || "1.0.0"
            },
            presentation: {
              theme: {
                primary_color: "#001941",
                secondary_color: "#ffffff",
                font_family: "System",
                base_font_size: 14
              },
              sections,
              pages,
              table_of_contents: tableOfContents
            }
          }
        };

        await addBusinessPlan.mutateAsync({
          companyId: activeCompany.id,
          data: companyAdditionalData.business_plan
        });

        Alert.alert("Հաջողություն", "Ամբողջական բիզնես պլանը ստեղծված է");
      } else {
        throw new Error("Could not parse JSON response");
      }
    } catch (error) {
      console.error("Error generating business plan:", error);
      Alert.alert("Սխալ", "Չհաջողվեց ստեղծել բիզնես պլանը։ Խնդրում ենք փորձել կրկին։");
    } finally {
      setIsCreatingBizPlan(false);
    }
  };

  useEffect(() => {
    if (activeCompany?.id && !isAdditionalDataLoading) {
      if (!companyAdditionalData?.business_plan) {
        generateBusinessPlan();
      }
    }
  }, [activeCompany, isAdditionalDataLoading]);

  const renderContent = () => {
    if (isActiveCompanyDataLoading || isAdditionalDataLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Բեռնվում է...</Text>
        </View>
      );
    }

    if (activePlanError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Սխալ բեռնման ժամանակ</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refreshActivePlanData()}
          >
            <Text style={styles.retryButtonText}>Կրկին փորձել</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.cardsGrid}>
            {cardData.map((data) => (
              <Card
                key={data.id}
                addBusinessPlan={addBusinessPlan}
                data={data as CardDataItem}
                companyData={companyData}
                isCreatingBizPlan={isCreatingBizPlan}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#001941',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  generateContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  generateButton: {
    backgroundColor: "#001941",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: "#ffffffa6",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "bold",
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001941',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  planSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  pagesContainer: {
    padding: 20,
  },
  pageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001941',
    marginBottom: 5,
  },
  pageNumber: {
    fontSize: 14,
    color: '#666',
  },
  page: {
    backgroundColor: '#ffffff',
    height: "100%",
    padding: 8,
    borderColor: "rgba(0, 0, 0, .1)",
    borderWidth: 1
  },
  pageContainer: {
    position: 'relative',
    overflow: "hidden",
    borderRadius: 8
  },
  backPageOne: {
    position: "absolute",
    width: "100%",
    top: 0,
    left: 6,
    backgroundColor: "#fff",
    zIndex: -1,
    transform: [{ scaleY: .95 }],
    borderRadius: 8,
    borderColor: "rgba(0, 0, 0, .1)",
    borderWidth: 1,
  },
  backPageTwo: {
    position: "absolute",
    width: "100%",
    top: 0,
    left: 11,
    backgroundColor: "#fff",
    zIndex: -2,
    transform: [{ scaleY: .9 }],
    borderRadius: 8,
    borderColor: "rgba(0, 0, 0, .1)",
    borderWidth: 1
  },
  pageWrapper: {
    width: "45%",
    position: "relative",
  },
  cardsGrid: {
    display: "flex",
    gap: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10
  }
});

export default Content;
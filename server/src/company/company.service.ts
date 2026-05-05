
import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { BusinessPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateBusinessPlanDto } from './dto/business-plan.dto';

export interface ApiResponse<T = any> {
   success: boolean;
   data?: T;
   message?: string;
   error?: string;
   statusCode?: number;
}

type SupportedPlanLanguage = 'en' | 'ru' | 'hy';
type BusinessPlanGenerationState = 'idle' | 'generating' | 'ready' | 'failed';

type BusinessPlanGenerationStatus = {
   status: BusinessPlanGenerationState;
   language?: SupportedPlanLanguage;
   startedAt?: string;
   finishedAt?: string;
   error?: string | null;
};

type PageBlockType = 'heading' | 'paragraph' | 'list' | 'table' | 'image' | 'chart' | 'divider' | 'quote';
type PageType = 'cover' | 'toc' | 'content' | 'financial' | 'custom';

type BackendPageBlock = {
   id: string;
   type: PageBlockType;
   content: any;
   styles: Record<string, any>;
   metadata?: Record<string, any>;
};

type BackendPage = {
   id: string;
   pageNumber: number;
   type: PageType;
   title: string;
   section: string;
   blocks: BackendPageBlock[];
   styles: Record<string, any>;
   formatting: {
      backgroundColor: string;
      backgroundImage?: string;
      border?: string;
      shadow?: string;
   };
};

@Injectable()
export class BusinessPlansService {
   constructor(private readonly prisma: PrismaService) { }

   private readonly nvidiaNimModel =
      process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-8b-instruct';

   private readonly nvidiaNimBaseUrl =
      process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';

   private getNvidiaNimApiKey() {
      return process.env.NVIDIA_NIM_API_KEY || '';
   }

   private createSuccessResponse<T>(
      data: T,
      message = 'Operation successful',
      statusCode: number = HttpStatus.OK,
   ): ApiResponse<T> {
      return { success: true, data, message, statusCode };
   }

   private createErrorResponse(
      message: string,
      error?: string,
      statusCode: number = HttpStatus.BAD_REQUEST,
   ): ApiResponse {
      return { success: false, message, error, statusCode };
   }

   private getLanguageLabel(language: SupportedPlanLanguage = 'en') {
      if (language === 'ru') return 'Russian';
      if (language === 'hy') return 'Armenian';
      return 'English';
   }

   private buildGenerationStatus(
      status: BusinessPlanGenerationState,
      language: SupportedPlanLanguage = 'en',
      previous?: BusinessPlanGenerationStatus | null,
      error?: string | null,
   ): BusinessPlanGenerationStatus {
      const now = new Date().toISOString();
      return {
         status,
         language,
         startedAt: status === 'generating' ? now : previous?.startedAt ?? now,
         finishedAt: status === 'generating' ? undefined : now,
         error: error ?? null,
      };
   }

   private async updateBusinessPlanAdditionalData(
      id: string,
      currentAdditionalData: Record<string, any>,
      patch: Record<string, any>,
   ) {
      return this.prisma.businessPlan.update({
         where: { id },
         data: {
            additionalData: {
               ...currentAdditionalData,
               ...patch,
            },
            updatedAt: new Date(),
         },
      });
   }

   private extractJsonFromText(text: string) {
      const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fencedMatch) return fencedMatch[1].trim();

      const directMatch = text.match(/\{[\s\S]*\}/);
      if (directMatch) return directMatch[0].trim();

      return text.trim();
   }

   private normalizeJsonCandidate(input: string) {
      return input
         .replace(/^\uFEFF/, '')
         .replace(/[\u201C\u201D]/g, '"')
         .replace(/[\u2018\u2019]/g, "'")
         .replace(/,\s*([}\]])/g, '$1')
         .trim();
   }

   private repairMissingPropertyCommas(input: string) {
      return input
         .replace(/("(?:(?:\\.|[^"\\])*)")\s*("[-\w]+"\s*:)/g, '$1,$2')
         .replace(/([}\]])\s*("[-\w]+"\s*:)/g, '$1,$2')
         .replace(/(true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*("[-\w]+"\s*:)/g, '$1,$2');
   }

   private parseAiJson(responseText: string): any {
      const extracted = this.extractJsonFromText(responseText);
      const firstBraceIndex = extracted.indexOf('{');
      const lastBraceIndex = extracted.lastIndexOf('}');
      const braceSliced =
         firstBraceIndex !== -1 && lastBraceIndex > firstBraceIndex
            ? extracted.slice(firstBraceIndex, lastBraceIndex + 1)
            : extracted;

      const candidates = [
         extracted,
         this.normalizeJsonCandidate(extracted),
         this.repairMissingPropertyCommas(this.normalizeJsonCandidate(extracted)),
         braceSliced,
         this.normalizeJsonCandidate(braceSliced),
         this.repairMissingPropertyCommas(this.normalizeJsonCandidate(braceSliced)),
      ];

      for (const candidate of candidates) {
         try {
            return JSON.parse(candidate);
         } catch {
            // try next
         }
      }

      return JSON.parse(this.repairMissingPropertyCommas(this.normalizeJsonCandidate(braceSliced)));
   }

   private async requestNvidiaNimJson(prompt: string) {
      const apiKey = this.getNvidiaNimApiKey();

      if (!apiKey) {
         const error = new Error('Missing NVIDIA_NIM_API_KEY');
         (error as Error & { statusCode?: number }).statusCode = HttpStatus.BAD_REQUEST;
         throw error;
      }

      const promptAttempt = `${prompt}

      STRICT OUTPUT RULES:
         - Return only one valid JSON object.
         - No markdown.
         - No explanation.
         - No repeated symbols.
         - Never output XML-like tokens, "</", "<|", or code fences.
         - Do not include presentation, pages, sections, or table_of_contents.
         - Backend generates presentation locally.
      `;

      const response = await fetch(`${this.nvidiaNimBaseUrl}/chat/completions`, {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
         },
         body: JSON.stringify({
            model: this.nvidiaNimModel,
            temperature: 0,
            max_tokens: Number(process.env.NVIDIA_NIM_MAX_TOKENS || 3500),
            response_format: { type: 'json_object' },
            messages: [
               {
                  role: 'system',
                  content:
                     'You are a strict JSON generator for business plans. Return only valid compact JSON. No markdown.',
               },
               { role: 'user', content: promptAttempt },
            ],
         }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
         const error = new Error(JSON.stringify(payload || { status: response.status }));
         (error as Error & { statusCode?: number }).statusCode = response.status;
         throw error;
      }

      const responseText = payload?.choices?.[0]?.message?.content?.trim();

      if (!responseText) {
         const error = new Error('NVIDIA NIM returned an empty response');
         (error as Error & { statusCode?: number }).statusCode = HttpStatus.BAD_GATEWAY;
         throw error;
      }

      const isCorrupted =
         responseText.includes('</</') ||
         responseText.includes('<|') ||
         /(.{2,12})\1{15,}/.test(responseText);

      if (isCorrupted) {
         console.error('NVIDIA NIM returned corrupted repeated output.');
         console.error(responseText.slice(-2000));
         const error = new Error('NVIDIA NIM returned corrupted repeated output.');
         (error as Error & { statusCode?: number }).statusCode = HttpStatus.BAD_GATEWAY;
         throw error;
      }

      try {
         const parsed = this.parseAiJson(responseText);
         if (parsed?.business_plan) {
            delete parsed.business_plan.presentation;
            delete parsed.business_plan.pages;
            delete parsed.business_plan.sections;
            delete parsed.business_plan.table_of_contents;
         }
         return parsed;
      } catch (error) {
         console.error('NVIDIA NIM returned invalid JSON.');
         console.error(responseText.slice(0, 2000));

         const invalidJsonError = new Error('NVIDIA NIM returned invalid JSON. Check backend logs.');
         (invalidJsonError as Error & { statusCode?: number; cause?: unknown; rawResponsePreview?: string }).statusCode =
            HttpStatus.BAD_GATEWAY;
         (invalidJsonError as Error & { statusCode?: number; cause?: unknown; rawResponsePreview?: string }).cause = error;
         (invalidJsonError as Error & { statusCode?: number; cause?: unknown; rawResponsePreview?: string }).rawResponsePreview =
            responseText.slice(0, 2000);
         throw invalidJsonError;
      }
   }

   private async requestAiJson(prompt: string) {
      return this.requestNvidiaNimJson(prompt);
   }

   private buildBaseBusinessPlanPrompt(plan: BusinessPlan, language: SupportedPlanLanguage = 'en') {
      const today = new Date().toISOString().split('T')[0];
      const businessName = plan.businessName || 'Business Plan';
      const idea = plan.idea || '';
      const location = plan.place || '';
      const tags = plan.uniqueTags || [];

      return `
         Create a practical business plan in ${this.getLanguageLabel(language)}.

         Business input:
         - Business name: ${businessName}
         - Idea: ${idea}
         - Location: ${location}
         - Unique tags: ${tags.join(', ')}

       IMPORTANT CONTENT RULES:
         - The JSON structure below is only a schema.
        - Do NOT output placeholder values in any language.
         - Do NOT output: "", "Value 2", "Goal 1", "Goal 2",
         "Business Concept", "Mission Statement", "Vision Statement",
         "Revenue", "Cost", "Amount", "Percentage", "Strategy", "Description", "Purpose",
         "արժեք 1", "արժեք 2", "արժեք 3",
         "նպատակ 1", "նպատակ 2", "նպատակ 3",
         "նկարագրություն", "նպատակ", "արժեք", "տոկոս", "ռազմավարություն",
         "գործողություն 1", "գործողություն 2",
         "սցենար 1", "սցենար 2", "սցենար 3",
         "մրցակից 1", "մրցակից 2",
         "մատակարար 1", "սարքավորում 1",
         "Значение 1", "Значение 2", "Цель 1", "Цель 2",
         "Описание", "Цель", "Стоимость", "Процент", "Стратегия".
         - Replace every placeholder with real, specific, useful content for this exact business:
         Business name: ${businessName}
         Idea: ${idea}
         Location: ${location}
         Tags: ${tags.join(', ')}
         - If a field cannot be exact, write a realistic estimate or practical explanation.
         - For legal IDs, use "To be obtained", not fake numbers.
         - For competitors, use realistic competitor categories or local alternatives, not "Competitor 1".
         - For financial fields, use realistic ranges or assumptions, not "Amount", "Cost", or "Revenue".

         All JSON keys must stay the same.
All JSON values must be written in ${this.getLanguageLabel(language)}.
Every array must contain real business-specific items, not numbered placeholders.
All empty arrays in the schema must be filled with 2-4 real business-specific values.
All empty strings in the schema must be filled with real business-specific text.
Never leave arrays empty in the final JSON.
Never leave strings empty in the final JSON.
If exact data is unknown, write a realistic estimate or practical explanation.

      Return exactly this JSON shape:
      !!!Պատասխանդ պետք է լինի միայն JSON օբյեկտ՝ առանց որևէ լրացուցիչ տեքստի, բացատրությունների կամ կոդի բլոկի:
      !!!Չօգտագործեք markdown կոդի բլոկներ(\`\`\`), միայն մաքուր JSON:

      Բիզնեսի անունը: ${businessName}
      Իդեա: ${idea}
      Վայրը: ${location}
      Յուրահատկւթյունները: ${tags.join(', ')}

      Խնդրում եմ ստեղծել միայն JSON պատասխան հետևյալ ճշգրիտ կառուցվածքով.
      Ահա JSON կառուցվածքը, որը պետք է հետևես.
    {
      "business_plan": {
        "metadata": {
          "business_name": "${businessName}",
          "idea": "${idea}",
          "location": "${location}",
          "unique_tags": ${JSON.stringify(tags)},
          "created_date": "${new Date().toISOString().split('T')[0]}",
          "last_updated": "${new Date().toISOString().split('T')[0]}",
          "version": "1.0.0",
          "page_name": "Business Plan"
        },
        "overview": {
          "page_name": "Overview",
          "executive_summary": {
            "page_name": "Executive Summary",
            "business_concept": "",
            "mission_statement": "",
            "vision_statement": "",
            "core_values": [],
            "unique_selling_proposition": "",
            "short_term_goals": {
              "months_1_3": [],
              "months_4_6": [],
              "months_7_12": []
            },
            "long_term_goals": {
              "year_1": [],
              "year_2": [],
              "year_3": [],
              "year_4": [],
              "year_5": []
            }
          },
          "swot_analysis": {
            "page_name": "SWOT Analysis",
            "strengths": {
              "internal_advantages": [],
              "competitive_edges": [],
              "resources": [],
              "capabilities": []
            },
            "weaknesses": {
              "internal_limitations": [],
              "gaps": [],
              "vulnerabilities": [],
              "constraints": []
            },
            "opportunities": {
              "market_opportunities": [],
              "technological_advancements": [],
              "partnership_potentials": [],
              "expansion_possibilities": []
            },
            "threats": {
              "market_threats": [],
              "competitive_pressures": [],
              "regulatory_risks": [],
              "economic_factors": []
            }
          },
          "business_models": {
            "page_name": "Business Models",
            "primary_model": {
              "name": "",
              "description": "",
              "revenue_streams": [],
              "cost_structure": [],
              "key_partners": []
            },
            "secondary_models": [
              {
                "name": "",
                "description": "",
                "implementation_timeline": ""
              },
              {
                "name": "",
                "description": "",
                "implementation_timeline": ""
              }
            ],
            "hybrid_approaches": []
          },
          "viability_analysis": {
            "page_name": "Viability Analysis",
            "market_viability": {
              "demand_assessment": "",
              "competitive_landscape": "",
              "market_entry_barriers": ""
            },
            "financial_viability": {
              "startup_costs": "",
              "break_even_analysis": "",
              "profitability_timeline": ""
            },
            "operational_viability": {
              "resource_availability": "",
              "skill_requirements": "",
              "infrastructure_needs": ""
            },
            "risk_assessment": {
              "high_risks": [],
              "medium_risks": [],
              "low_risks": []
            }
          },
          "legal_compliance": {
            "page_name": "Legal Compliance",
            "business_registration": {
              "legal_structure": "",
              "registration_number": "",
              "tax_identification_number": ""
            },
            "licenses_permits": [
              {
                "license_name": "",
                "issuing_authority": "",
                "renewal_date": "${new Date(Date.now() + 31536000000).toISOString().split('T')[0]}",
                "cost": ""
              },
              {
                "license_name": "",
                "issuing_authority": "",
                "renewal_date": "${new Date(Date.now() + 31536000000).toISOString().split('T')[0]}",
                "cost": ""
              }
            ],
            "tax_obligations": {
              "vat_registration": "",
              "income_tax": "",
              "payroll_taxes": "",
              "tax_filing_schedule": ""
            },
            "insurance_requirements": [
              {
                "insurance_type": "",
                "coverage_amount": "",
                "premium_cost": "",
                "provider": ""
              }
            ]
          }
        },
        "market_research": {
          "page_name": "Market Research",
          "industry_analysis": {
            "page_name": "Industry Analysis",
            "industry_overview": "",
            "key_industry_players": [],
            "industry_trends": {
              "current_trends": [],
              "emerging_trends": [],
              "future_predictions": []
            },
            "regulatory_environment": "",
            "technological_impact": ""
          },
          "target_audience": {
            "page_name": "Target Audience",
            "demographics": {
              "age_distribution": {
                "teenagers_13_17": "",
                "young_adults_18_25": "",
                "adults_26_35": "",
                "middle_aged_36_50": "",
                "seniors_51_plus": ""
              },
              "gender_distribution": {
                "male": "",
                "female": "",
                "other": ""
              },
              "income_levels": {
                "low_income": "",
                "middle_income": "",
                "high_income": ""
              },
              "geographic_distribution": {
                "urban": "",
                "suburban": "",
                "rural": ""
              },
              "education_levels": {
                "high_school": "",
                "college": "",
                "university": "",
                "postgraduate": ""
              }
            },
            "psychographics": {
              "lifestyle_patterns": [],
              "values_beliefs": [],
              "interests_hobbies": [],
              "personality_traits": [],
              "buying_behavior": {
                "purchase_frequency": "",
                "spending_habits": "",
                "brand_loyalty": ""
              }
            },
            "needs_analysis": {
              "functional_needs": [],
              "emotional_needs": [],
              "social_needs": [],
              "unmet_needs": []
            },
            "pain_points": {
              "current_pain_points": [],
              "anticipated_pain_points": [],
              "pain_point_severity": {
                "mild": [],
                "moderate": [],
                "severe": []
              }
            }
          },
          "market_size_trends": {
            "page_name": "Market Size & Trends",
            "current_market_size": {
              "local": "",
              "regional": "",
              "national": "",
              "total_addressable_market": "",
              "serviceable_available_market": "",
              "serviceable_obtainable_market": ""
            },
            "growth_metrics": {
              "historical_growth_rate": "",
              "projected_growth_rate": "",
              "compound_annual_growth_rate": ""
            },
            "market_trends": {
              "seasonal_trends": [],
              "cyclical_trends": [],
              "secular_trends": []
            },
            "forecast_analysis": {
              "optimistic_scenario": "",
              "pessimistic_scenario": "",
              "realistic_scenario": "",
              "quarterly_projections": {
                "q1_2024": "",
                "q2_2024": "",
                "q3_2024": "",
                "q4_2024": ""
              }
            }
          },
          "competitor_analysis": {
            "page_name": "Competitor Analysis",
            "direct_competitors": [
              {
                "name": "",
                "market_share": "",
                "strengths": [],
                "weaknesses": [],
                "pricing_strategy": "",
                "target_audience": ""
              },
              {
                "name": "",
                "market_share": "",
                "strengths": [],
                "weaknesses": [],
                "pricing_strategy": "",
                "target_audience": ""
              }
            ],
            "indirect_competitors": [
              {
                "name": "",
                "competitive_threat": "",
                "market_overlap": ""
              },
              {
                "name": "",
                "competitive_threat": "",
                "market_overlap": ""
              }
            ],
            "competitive_matrix": {
              "price_comparison": "",
              "quality_comparison": "",
              "service_comparison": ""
            },
            "swot_comparison": {
              "our_strengths": [],
              "competitor_weaknesses": [],
              "competitive_gaps": []
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
                "name": "",
                "description": "",
                "features": [],
                "benefits": [],
                "target_customer": "",
                "development_stage": "",
                "launch_date": "${new Date(Date.now() + 7776000000).toISOString().split('T')[0]}",
                "detailed_pricing": {
                  "unit_cost": "",
                  "wholesale_price": "",
                  "retail_price": "",
                  "profit_margin_percentage": "",
                  "discount_structures": {
                    "volume_discounts": "",
                    "seasonal_discounts": "",
                    "promotional_discounts": ""
                  }
                }
              }
            ],
            "secondary_products": [
              {
                "product_id": "PROD002",
                "name": "",
                "description": "",
                "purpose": "",
                "target_market": "",
                "pricing_details": {
                  "unit_price": "",
                  "profit_margin_percentage": ""
                }
              }
            ],
            "future_products": [
              {
                "product_id": "PROD003",
                "name": "",
                "concept": "",
                "expected_launch": "${new Date(Date.now() + 157680000000).toISOString().split('T')[0]}",
                "development_timeline": "",
                "estimated_pricing": ""
              }
            ]
          },
          "service_offerings": {
            "page_name": "Service Offerings",
            "core_services": [
              {
                "service_id": "SERV001",
                "name": "",
                "description": "",
                "delivery_method": "",
                "service_level": "",
                "pricing_tiers": [
                  {
                    "tier_name": "",
                    "price": "",
                    "features_included": [],
                    "profit_margin": ""
                  },
                  {
                    "tier_name": "",
                    "price": "",
                    "features_included": [],
                    "profit_margin": ""
                  }
                ],
                "pricing_strategy": ""
              }
            ],
            "premium_services": [
              {
                "service_id": "SERV002",
                "name": "",
                "description": "",
                "value_added": "",
                "target_clients": "",
                "premium_pricing": "",
                "profit_margin_percentage": ""
              }
            ],
            "custom_services": [
              {
                "service_id": "SERV003",
                "name": "",
                "description": "",
                "customization_options": [],
                "minimum_order": "",
                "pricing_model": "",
                "quotation_process": ""
              }
            ]
          },
          "innovation_pipeline": {
            "page_name": "Innovation Pipeline",
            "r_and_d_projects": [
              {
                "project_id": "RD001",
                "name": "",
                "description": "",
                "status": "",
                "expected_completion": "${new Date(Date.now() + 15552000000).toISOString().split('T')[0]}",
                "budget_allocation": ""
              }
            ],
            "technology_roadmap": {
              "phase_1": [],
              "phase_2": [],
              "phase_3": []
            },
            "intellectual_property": {
              "patents": [],
              "trademarks": [],
              "trade_secrets": [],
              "trademark_registration_costs": [],
              "patent_application_costs": [],
              "copyright_protection_costs": "",
              "non_disclosure_agreements": ""
            }
          },
          "quality_assurance": {
            "page_name": "Quality Assurance",
            "quality_standards": [],
            "testing_procedures": [],
            "quality_metrics": {
              "defect_rate": "",
              "customer_satisfaction": "",
              "return_rate": ""
            },
            "continuous_improvement": {
              "feedback_mechanisms": [],
              "improvement_initiatives": []
            },
            "quality_certifications": {
              "iso_certification_costs": "",
              "industry_specific_certifications": [],
              "inspection_fees": "",
              "compliance_audit_costs": ""
            }
          }
        },
        "sales_marketing": {
          "page_name": "Sales & Marketing",
          "marketing_strategy": {
            "page_name": "Marketing Strategy",
            "positioning_statement": "",
            "value_proposition": "",
            "messaging_framework": {
              "core_messages": [],
              "tone_of_voice": "",
              "brand_personality": ""
            },
            "marketing_mix": {
              "product_strategy": "",
              "price_strategy": "",
              "place_strategy": "",
              "promotion_strategy": ""
            },
            "marketing_campaign_details": {
              "specific_campaign_budgets": {
                "launch_campaign": "",
                "seasonal_campaign": "",
                "digital_campaign": ""
              },
              "agency_fees": "",
              "promotional_materials_costs": {
                "printing_costs": "",
                "merchandise_costs": "",
                "display_materials": ""
              },
              "event_sponsorship_costs": ""
            }
          },
          "sales_strategy": {
            "page_name": "Sales Strategy",
            "sales_process": {
              "lead_generation": "",
              "qualification": "",
              "presentation": "",
              "proposal": "",
              "closing": "",
              "follow_up": ""
            },
            "sales_channels": {
              "direct_sales": "",
              "online_sales": "",
              "retail_partners": "",
              "distribution_network": ""
            },
            "sales_targets": {
              "monthly_targets": {
                "month_1": "",
                "month_2": "",
                "month_3": ""
              },
              "quarterly_targets": {
                "q1": "",
                "q2": "",
                "q3": "",
                "q4": ""
              },
              "annual_targets": {
                "year_1": "",
                "year_2": "",
                "year_3": ""
              }
            }
          },
          "digital_marketing": {
            "page_name": "Digital Marketing",
            "content_strategy": {
              "content_types": [],
              "content_calendar": {
                "daily_posts": "",
                "weekly_themes": "",
                "monthly_campaigns": ""
              },
              "seo_strategy": {
                "primary_keywords": [],
                "secondary_keywords": [],
                "local_seo": ""
              }
            },
            "social_media_plan": {
              "platform_strategies": {
                "facebook": "",
                "instagram": "",
                "twitter": "",
                "linkedin": "",
                "tiktok": ""
              },
              "engagement_metrics": {
                "follower_growth": "",
                "engagement_rate": "",
                "conversion_rate": ""
              },
              "advertising_budget": {
                "monthly_budget": "",
                "ad_allocations": {
                  "facebook_ads": "",
                  "google_ads": "",
                  "instagram_ads": ""
                }
              }
            },
            "email_marketing": {
              "list_segmentation": {
                "new_subscribers": "",
                "active_customers": "",
                "inactive_customers": "",
                "loyal_customers": ""
              },
              "campaign_schedule": {
                "weekly_newsletter": "",
                "promotional_emails": "",
                "abandoned_cart_emails": ""
              },
              "performance_metrics": {
                "open_rate": "",
                "click_through_rate": "",
                "conversion_rate": ""
              }
            },
            "analytics_measurement": {
              "analytics_software_costs": "",
              "market_research_budget": "",
              "customer_survey_costs": "",
              "data_analysis_tools": ""
            }
          },
          "brand_development": {
            "page_name": "Brand Development",
            "brand_identity": {
              "logo_design": "",
              "color_palette": [],
              "typography": [],
              "visual_elements": []
            },
            "brand_voice": {
              "tone": "",
              "language_style": "",
              "communication_style": ""
            },
            "brand_positioning": {
              "market_position": "",
              "competitive_differentiation": "",
              "target_perception": ""
            },
            "community_engagement": {
              "local_sponsorship_budget": "",
              "charity_donations": "",
              "community_events": "",
              "public_relations_costs": ""
            }
          },
          "customer_service": {
            "page_name": "Customer Service",
            "support_channels": {
              "phone_support": "",
              "email_support": "",
              "live_chat": "",
              "social_media_support": ""
            },
            "service_level_agreements": {
              "response_time": "",
              "resolution_time": "",
              "availability": ""
            },
            "customer_feedback_systems": {
              "feedback_forms": "",
              "review_platforms": "",
              "customer_satisfaction_surveys": ""
            },
            "complaint_resolution_process": {
              "escalation_procedures": "",
              "refund_policies": "",
              "customer_recovery_strategies": ""
            }
          }
        },
        "financials": {
          "page_name": "Financials",
          "revenue_projections": {
            "page_name": "Revenue Projections",
            "monthly_revenue": {
              "year_1": {
                "january": "",
                "february": "",
                "march": "",
                "april": "",
                "may": "",
                "june": "",
                "july": "",
                "august": "",
                "september": "",
                "october": "",
                "november": "",
                "december": ""
              },
              "year_2": {
                "january": "",
                "february": "",
                "march": "",
                "april": "",
                "may": "",
                "june": "",
                "july": "",
                "august": "",
                "september": "",
                "october": "",
                "november": "",
                "december": ""
              },
              "year_3": {
                "january": "",
                "february": "",
                "march": "",
                "april": "",
                "may": "",
                "june": "",
                "july": "",
                "august": "",
                "september": "",
                "october": "",
                "november": "",
                "december": ""
              }
            },
            "revenue_streams": {
              "product_sales": {
                "percentage": "",
                "growth_rate": "",
                "seasonality": ""
              },
              "service_revenue": {
                "percentage": "",
                "growth_rate": "",
                "recurring_revenue": ""
              },
              "subscription_revenue": {
                "percentage": "",
                "growth_rate": "",
                "churn_rate": ""
              },
              "other_revenue": {
                "percentage": "",
                "sources": []
              }
            },
            "pricing_strategy": {
              "price_points": [],
              "discount_strategy": "",
              "competitive_pricing": "",
              "value_based_pricing": ""
            }
          },
          "expense_breakdown": {
            "page_name": "Expense Breakdown",
            "fixed_costs": {
              "rent": "",
              "utilities": {
                "electricity": "",
                "water": "",
                "internet": "",
                "telephone": "",
                "monthly_total": ""
              },
              "insurance": "",
              "software_subscriptions": "",
              "business_banking_fees": {
                "account_maintenance": "",
                "transaction_fees": "",
                "credit_card_processing": ""
              },
              "professional_fees": {
                "accountant": "",
                "lawyer": "",
                "consultant": ""
              }
            },
            "variable_costs": {
              "materials": "",
              "production": "",
              "shipping": "",
              "commission": "",
              "marketing": "",
              "inventory_shrinkage": "",
              "returns_refunds": ""
            },
            "operational_costs": {
              "maintenance": "",
              "repairs": "",
              "training": "",
              "travel": "",
              "professional_services": "",
              "emergency_repairs": ""
            },
            "detailed_equipment_costs": [
              {
                "equipment_id": "EQ001",
                "name": "",
                "brand_model": "",
                "purpose": "",
                "cost": "",
                "maintenance_cost": "",
                "lifespan": ""
              }
            ]
          },
          "profit_loss_statement": {
            "page_name": "Profit & Loss Statement",
            "monthly_pnl": {
              "year_1": {
                "january": {
                  "revenue": "",
                  "cogs": "",
                  "gross_profit": "",
                  "operating_expenses": "",
                  "net_profit": ""
                }
              }
            },
            "key_metrics": {
              "gross_margin": "",
              "operating_margin": "",
              "net_margin": "",
              "ebitda": "EBITDA"
            },
            "profitability_timeline": {
              "break_even_point": "",
              "profitability_milestone": "",
              "target_profit_margin": ""
            }
          },
          "cash_flow_analysis": {
            "page_name": "Cash Flow Analysis",
            "operating_cash_flow": {
              "monthly_cash_in": "",
              "monthly_cash_out": "",
              "net_cash_flow": ""
            },
            "investing_cash_flow": {
              "equipment_purchases": "",
              "property_investments": "",
              "r_and_d_investments": ""
            },
            "financing_cash_flow": {
              "loan_proceeds": "",
              "equity_investments": "",
              "dividend_payments": ""
            },
            "cash_balance_forecast": {
              "minimum_cash_balance": "",
              "working_capital_requirements": "",
              "cash_buffer": ""
            }
          },
          "funding_requirements": {
            "page_name": "Funding Requirements",
            "startup_capital": {
              "amount_needed": "",
              "use_of_funds": {
                "equipment": "",
                "inventory": "",
                "marketing": "",
                "working_capital": "",
                "legal_registration": "",
                "pre_launch_expenses": ""
              },
              "funding_sources": {
                "personal_savings": "",
                "bank_loans": "",
                "investors": "",
                "grants": ""
              }
            },
            "growth_funding": {
              "phase_1_funding": "",
              "phase_2_funding": "",
              "phase_3_funding": ""
            },
            "return_expectations": {
              "investor_roi": "",
              "payback_period": "",
              "exit_strategy": {
                "acquisition_possibilities": "",
                "ipo_potential": "",
                "management_buyout": "",
                "liquidation_plan": ""
              }
            }
          },
          "contingency_fund": {
            "page_name": "Contingency Fund",
            "percentage_of_budget": "",
            "specific_scenarios_covered": [
              "սցենար 1",
              "սցենար 2",
              "սցենար 3"
            ],
            "access_conditions": "",
            "replenishment_strategy": ""
          }
        },
        "operations": {
          "page_name": "Operations",
          "organizational_structure": {
            "page_name": "Organizational Structure",
            "management_team": [
              {
                "position": "",
                "name": "",
                "qualifications": "",
                "responsibilities": [],
                "experience": "",
                "salary_details": {
                  "base_salary": "",
                  "bonus_structure": "",
                  "benefits_package": ""
                }
              }
            ],
            "staffing_plan": {
              "immediate_hires": [
                {
                  "position": "",
                  "experience_level": "",
                  "salary_range": "",
                  "hiring_budget": ""
                }
              ],
              "year_1_hires": [],
              "year_2_hires": [],
              "year_3_hires": [],
              "seasonal_staffing_needs": {
                "high_season": "",
                "low_season": "",
                "staffing_levels": ""
              }
            },
            "organizational_chart": "",
            "human_resources_details": {
              "hiring_budget_breakdown": {
                "advertising_costs": "",
                "agency_fees": "",
                "background_checks": "",
                "onboarding_costs": {
                  "uniforms": "",
                  "equipment": "սարքավորում",
                  "training_materials": ""
                }
              },
              "employee_benefits_package": {
                "health_insurance": "",
                "retirement_plans": "",
                "paid_time_off": "",
                "other_benefits": ""
              },
              "training_development_budget": "",
              "hr_policies": "",
              "team_development": {
                "professional_development_budget": "",
                "team_building_activities": "",
                "performance_bonuses": "",
                "equity_stock_options": ""
              }
            }
          },
          "facilities_equipment": {
            "page_name": "Facilities & Equipment",
            "location_analysis": {
              "site_selection": "",
              "facility_requirements": "",
              "expansion_potential": ""
            },
            "equipment_list": [
              {
                "equipment_id": "EQ001",
                "name": "",
                "purpose": "",
                "cost": "",
                "maintenance_schedule": "",
                "brand_model": ""
              }
            ],
            "technology_stack": {
              "hardware": [],
              "software": [],
              "it_infrastructure": ""
            },
            "technology_infrastructure": {
              "website_development_costs": "",
              "software_licenses": "",
              "it_support_maintenance": "",
              "cybersecurity_measures": ""
            },
            "physical_location_details": {
              "exact_square_footage": "",
              "space_requirements": "",
              "layout_plans": "",
              "renovation_construction_costs": "",
              "signage_branding": "",
              "parking_accessibility": "",
              "security_systems": ""
            }
          },
          "supply_chain": {
            "page_name": "Supply Chain",
            "supplier_network": [
              {
                "supplier_id": "SUP001",
                "name": "",
                "materials_provided": "",
                "lead_time": "",
                "payment_terms": "",
                "minimum_order_quantities": "",
                "quality_requirements": ""
              }
            ],
            "inventory_management": {
              "inventory_levels": "",
              "reorder_points": "",
              "storage_requirements": ""
            },
            "logistics": {
              "shipping_methods": "",
              "delivery_times": "",
              "cost_structure": ""
            },
            "supplier_details": {
              "backup_suppliers": [],
              "quality_control_requirements": "",
              "contract_terms": ""
            }
          },
          "quality_control": {
            "page_name": "Quality Control",
            "quality_standards": [],
            "inspection_procedures": [],
            "quality_metrics": {
              "defect_rate": "",
              "customer_complaints": "",
              "return_rate": ""
            }
          },
          "environmental_sustainability": {
            "page_name": "Environmental Sustainability",
            "waste_management_costs": "",
            "energy_efficiency_investments": "",
            "sustainability_certifications": "",
            "environmental_compliance": ""
          }
        },
        "risk_management": {
          "page_name": "Risk Management",
          "risk_identification": {
            "page_name": "Risk Identification",
            "market_risks": [],
            "financial_risks": [],
            "operational_risks": [],
            "compliance_risks": []
          },
          "risk_assessment": {
            "page_name": "Risk Assessment",
            "probability_analysis": "",
            "impact_analysis": "",
            "risk_prioritization": ""
          },
          "mitigation_strategies": {
            "page_name": "Mitigation Strategies",
            "preventive_measures": [],
            "contingency_plans": [],
            "insurance_coverage": ""
          },
          "monitoring_plan": {
            "page_name": "Monitoring Plan",
            "key_risk_indicators": [],
            "review_frequency": "",
            "reporting_structure": ""
          }
        },
        "implementation_timeline": {
          "page_name": "Implementation Timeline",
          "pre_launch_phase": {
            "page_name": "Pre-Launch Phase",
            "phase_duration": "",
            "key_milestones": [
              {
                "milestone_id": "MIL001",
                "name": "",
                "description": "նկարագրություն",
                "due_date": "${new Date(Date.now() + 2592000000).toISOString().split('T')[0]}",
                "dependencies": "",
                "responsible_party": ""
              }
            ],
            "critical_path": "",
            "resource_allocation": ""
          },
          "launch_phase": {
            "page_name": "Launch Phase",
            "launch_date": "${new Date(Date.now() + 7776000000).toISOString().split('T')[0]}",
            "launch_activities": [],
            "post_launch_support": "",
            "performance_monitoring": ""
          },
          "growth_phase": {
            "page_name": "Growth Phase",
            "expansion_timeline": "",
            "market_penetration": "",
            "scaling_strategy": ""
          },
          "five_year_roadmap": {
            "page_name": "Five Year Roadmap",
            "quarterly_objectives": {
              "year_1": {
                "q1": [],
                "q2": [],
                "q3": [],
                "q4": []
              },
              "year_2": {
                "q1": [],
                "q2": [],
                "q3": [],
                "q4": []
              }
            },
            "annual_goals": {
              "year_1": [],
              "year_2": [],
              "year_3": [],
              "year_4": [],
              "year_5": []
            },
            "success_metrics": {
              "financial_metrics": [],
              "operational_metrics": [],
              "customer_metrics": []
            }
          }
        }
      }
    }

    Պահպանիր ճշգրիտ JSON կառուցվածքը:
      `;
   }


   private containsPlaceholderValue(value: any): boolean {
      const placeholderPatterns = [
         /^value\s*\d+$/i,
         /^goal\s*\d+$/i,
         /^description$/i,
         /^purpose$/i,
         /^strategy$/i,
         /^cost$/i,
         /^amount$/i,
         /^percentage$/i,
         /^revenue$/i,
         /^price$/i,
         /^budget$/i,

         /^արժեք\s*\d+$/i,
         /^նպատակ\s*\d+$/i,
         /^գործողություն\s*\d+$/i,
         /^սցենար\s*\d+$/i,
         /^մրցակից\s*\d+$/i,
         /^մատակարար\s*\d+$/i,
         /^սարքավորում\s*\d+$/i,
         /^աշխատակից\s*\d+$/i,
         /^ռիսկ\s*\d+$/i,
         /^գործոն\s*\d+$/i,
         /^խաղացող\s*\d+$/i,
         /^աղբյուր\s*\d+$/i,
         /^նկարագրություն$/i,
         /^նպատակ$/i,
         /^արժեք$/i,
         /^տոկոս$/i,
         /^ռազմավարություն$/i,
         /^գին$/i,
         /^բյուջե$/i,
         /^կարգավիճակ$/i,
         /^կանխատեսում$/i,
         /^անուն$/i,
         /^պաշտոն$/i,
         /^փորձ$/i,

         /^значение\s*\d+$/i,
         /^цель\s*\d+$/i,
         /^действие\s*\d+$/i,
         /^сценарий\s*\d+$/i,
         /^конкурент\s*\d+$/i,
         /^поставщик\s*\d+$/i,
         /^оборудование\s*\d+$/i,
         /^описание$/i,
         /^цель$/i,
         /^стоимость$/i,
         /^процент$/i,
         /^стратегия$/i,
         /^цена$/i,
         /^бюджет$/i,
      ];

      if (typeof value === 'string') {
         const trimmed = value.trim();
         return placeholderPatterns.some((pattern) => pattern.test(trimmed));
      }

      if (Array.isArray(value)) {
         return value.some((item) => this.containsPlaceholderValue(item));
      }

      if (value && typeof value === 'object') {
         return Object.values(value).some((item) => this.containsPlaceholderValue(item));
      }

      return false;
   }

   private objectToReadableText(value: any): string {
      if (value === undefined || value === null || value === '') {
         return 'Not specified';
      }

      if (typeof value === 'string') {
         return value;
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
         return String(value);
      }

      if (Array.isArray(value)) {
         return value
            .map((item) => this.objectToReadableText(item))
            .filter(Boolean)
            .join(', ');
      }

      if (typeof value === 'object') {
         return Object.entries(value)
            .map(([key, item]) => {
               const label = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (char) => char.toUpperCase());

               return `${label}: ${this.objectToReadableText(item)}`;
            })
            .join('; ');
      }

      return String(value);
   }

   private objectToLines(value: any): string[] {
      if (value === undefined || value === null || value === '') {
         return [];
      }

      if (Array.isArray(value)) {
         return value.map((item) => this.objectToReadableText(item));
      }

      if (typeof value === 'object') {
         return Object.entries(value).map(([key, item]) => {
            const label = key
               .replace(/_/g, ' ')
               .replace(/\b\w/g, (char) => char.toUpperCase());

            return `${label}: ${this.objectToReadableText(item)}`;
         });
      }

      return [String(value)];
   }

   private block(
      id: string,
      type: PageBlockType,
      content: any,
      styles: Record<string, any> = {},
      metadata: Record<string, any> = {},
   ): BackendPageBlock {
      return { id, type, content: content ?? '', styles, metadata };
   }

   private page(
      id: string,
      pageNumber: number,
      type: PageType,
      title: string,
      section: string,
      blocks: BackendPageBlock[],
   ): BackendPage {
      return {
         id,
         pageNumber,
         type,
         title,
         section,
         blocks,
         styles: {},
         formatting: { backgroundColor: '#ffffff' },
      };
   }

   private asArray(value: any, fallback: any[] = []): any[] {
      if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null);
      if (value === undefined || value === null || value === '') return fallback;
      return [value];
   }

   private joinArray(value: any, fallback = ''): string {
      const items = this.asArray(value);
      if (!items.length) return fallback;
      return items.map((item) => this.objectToReadableText(item)).join(', ');
   }

   private text(value: any, fallback = ''): string {
      if (value === undefined || value === null || value === '') return fallback;
      if (typeof value === 'string') return value;
      return this.objectToReadableText(value);
   }

   private readonly tableOfContents = [
      { title: 'Overview', items: [{ name: 'Executive Summary', page: 2 }, { name: 'SWOT Analysis', page: 3 }, { name: 'Business Models', page: 4 }, { name: 'Viability Analysis', page: 5 }] },
      { title: 'Market Research', items: [{ name: 'Industry Overview', page: 6 }, { name: 'Target Audience', page: 7 }, { name: 'Market Size & Trends', page: 8 }, { name: 'Competitor Analysis', page: 9 }] },
      { title: 'Products & Services', items: [{ name: 'Core Offering', page: 10 }, { name: 'Expansion Opportunities', page: 11 }, { name: 'Secondary Offering', page: 12 }, { name: 'Customer Service', page: 13 }] },
      { title: 'Sales & Marketing', items: [{ name: 'Marketing Overview', page: 14 }, { name: 'Branding & Identity', page: 15 }, { name: 'Customer Retention', page: 16 }, { name: 'Online Presence', page: 17 }, { name: 'Social Media', page: 18 }, { name: 'SEO & Content', page: 19 }, { name: 'Digital Marketing', page: 20 }, { name: 'Community Engagement', page: 21 }] },
      { title: 'Financials', items: [{ name: 'Revenue', page: 22 }, { name: 'Expenses', page: 23 }, { name: 'Financing', page: 24 }, { name: 'Dividends', page: 25 }] },
      { title: 'Taxes', items: [{ name: 'Profit & Loss', page: 26 }, { name: 'Balance Sheet', page: 27 }, { name: 'Cash Flow', page: 28 }, { name: 'Funding Plan', page: 29 }] },
      { title: 'Operations', items: [{ name: 'Team & Roles', page: 30 }, { name: 'Operation Plan', page: 31 }, { name: 'Risk Analysis', page: 32 }, { name: 'Regulatory Compliance', page: 33 }] },
      { title: 'Implementation Plan', items: [{ name: 'Pre-Launch', page: 34 }, { name: 'Post-Launch', page: 35 }, { name: '5 Year Plan', page: 36 }] },
   ];

   private buildContentPage(
      id: string,
      pageNumber: number,
      type: PageType,
      title: string,
      section: string,
      items: Array<{ label?: string; value?: any; list?: any[]; fallback?: any; color?: string }>,
   ) {
      const blocks: BackendPageBlock[] = [
         this.block(`${id}-title`, 'heading', title, {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#001941',
            marginBottom: 18,
         }, { level: 1 }),
      ];

      items.forEach((item, index) => {
         const label = item.label;
         const contentValue = item.list ?? item.value;
         const isList = Array.isArray(contentValue);

         if (label) {
            blocks.push(this.block(`${id}-label-${index}`, 'heading', label, {
               fontSize: 16,
               fontWeight: '600',
               color: item.color || '#001941',
               marginTop: 12,
               marginBottom: 6,
            }, { level: 2 }));
         }

         if (isList) {
            blocks.push(this.block(`${id}-list-${index}`, 'list', this.asArray(contentValue).length ? this.asArray(contentValue) : this.asArray(item.fallback), {
               fontSize: 14,
               lineHeight: 22,
               color: '#333',
            }, { listType: 'bullet' }));
         } else {
            blocks.push(this.block(`${id}-text-${index}`, 'paragraph', this.text(contentValue, this.text(item.fallback)), {
               fontSize: 14,
               lineHeight: 22,
               color: '#333',
            }));
         }
      });

      return this.page(id, pageNumber, type, title, section, blocks);
   }

   private buildPresentationFromBusinessPlan(plan: any) {
      const businessName = plan.metadata?.business_name || 'Business Plan';

      const sections = [
         { id: 'document', title: 'Document' },
         { id: 'overview', title: 'Overview' },
         { id: 'market-research', title: 'Market Research' },
         { id: 'products-services', title: 'Products & Services' },
         { id: 'sales-marketing', title: 'Sales & Marketing' },
         { id: 'financials', title: 'Financials' },
         { id: 'taxes', title: 'Taxes' },
         { id: 'operations', title: 'Operations' },
         { id: 'implementation-plan', title: 'Implementation Plan' },
      ];

      const platformStrategies =
         plan.sales_marketing?.digital_marketing?.social_media_plan?.platform_strategies || {};

      const contentStrategy =
         plan.sales_marketing?.digital_marketing?.content_strategy || {};

      const seoStrategy =
         plan.sales_marketing?.digital_marketing?.content_strategy?.seo_strategy || {};

      const advertisingBudget =
         plan.sales_marketing?.digital_marketing?.social_media_plan?.advertising_budget || {};

      const customerService =
         plan.sales_marketing?.customer_service ||
         plan.products_services?.customer_service ||
         {};

      const customerRetention =
         plan.sales_marketing?.customer_retention || {};

      const communityEngagement =
         plan.sales_marketing?.brand_development?.community_engagement ||
         plan.sales_marketing?.community_engagement ||
         {};

      const marketingCampaignDetails =
         plan.sales_marketing?.marketing_strategy?.marketing_campaign_details || {};

      const coreProducts =
         this.asArray(plan.products_services?.product_line?.core_products);

      const coreServices =
         this.asArray(plan.products_services?.service_offerings?.core_services);

      const secondaryProducts =
         this.asArray(plan.products_services?.product_line?.secondary_products);

      const secondaryServices = [
         ...this.asArray(plan.products_services?.service_offerings?.secondary_services),
         ...this.asArray(plan.products_services?.service_offerings?.premium_services),
         ...this.asArray(plan.products_services?.service_offerings?.custom_services),
      ];

      const futureProducts =
         this.asArray(plan.products_services?.product_line?.future_products);

      const expansionOpportunities = [
         ...this.asArray(plan.products_services?.expansion_opportunities),
         ...this.objectToLines(plan.products_services?.innovation_pipeline?.technology_roadmap),
         ...this.asArray(plan.products_services?.innovation_pipeline?.r_and_d_projects).map((project: any) =>
            typeof project === 'string'
               ? project
               : `${project.name || 'R&D project'} — ${project.description || project.status || ''}`,
         ),
      ];

      const serviceStandards = [
         ...this.asArray(plan.products_services?.customer_service?.service_standards),
         ...this.asArray(plan.products_services?.quality_assurance?.quality_standards),
         ...this.objectToLines(customerService?.service_level_agreements),
      ];

      const supportProcess =
         plan.products_services?.customer_service?.support_process ||
         this.objectToReadableText(customerService?.support_channels) ||
         this.objectToReadableText(customerService?.complaint_resolution_process);

      const riskIdentification =
         plan.risk_management?.risk_identification || {};

      const mitigation =
         plan.risk_management?.mitigation_plan ||
         plan.risk_management?.mitigation_strategies ||
         {};

      const implementation =
         plan.implementation_timeline || {};

      const preLaunch =
         implementation.pre_launch_phase || {};

      const launch =
         implementation.launch_phase || {};

      const postLaunch =
         implementation.post_launch_phase || implementation.growth_phase || {};

      const fiveYearRoadmap =
         implementation.five_year_roadmap || {};

      const pages: BackendPage[] = [
         this.page('cover', 0, 'cover', 'Cover Page', 'document', [
            this.block('logo-placeholder', 'image', 'LOGO', {
               width: 100,
               height: 50,
               backgroundColor: '#f0f0f0',
               justifyContent: 'center',
               alignItems: 'center',
               marginBottom: 40,
               borderRadius: 8,
               textAlign: 'center',
            }, { imageSrc: 'logo' }),
            this.block('business-name', 'heading', businessName, {
               fontSize: 18,
               fontWeight: 'bold',
               textAlign: 'center',
               color: '#001941',
               marginBottom: 8,
            }, { level: 1 }),
            this.block('business-plan-text', 'paragraph', 'BUSINESS PLAN', {
               fontSize: 20,
               textAlign: 'center',
               color: '#666',
               marginBottom: 40,
            }),
            this.block('divider', 'divider', '', {
               width: '80%',
               height: 2,
               backgroundColor: '#001941',
               marginVertical: 30,
               alignSelf: 'center',
            }),
            this.block('contact-info', 'list', [
               plan.metadata?.location || 'Location not specified',
               plan.metadata?.idea || 'Business idea not specified',
            ], {
               alignItems: 'center',
               textAlign: 'center',
            }, { listType: 'bullet' }),
         ]),

         this.page('toc', 1, 'toc', 'Table of Contents', 'document', [
            this.block('toc-title', 'heading', 'Table Of Contents', {
               fontSize: 24,
               fontWeight: 'bold',
               textAlign: 'center',
               color: '#001941',
               marginBottom: 30,
            }, { level: 1 }),
            this.block('toc-content', 'table', this.tableOfContents, {
               fontSize: 14,
               lineHeight: 20,
               color: '#333',
            }),
         ]),

         this.buildContentPage('executive-summary', 2, 'content', 'Executive Summary', 'overview', [
            {
               label: 'Business Concept',
               value: plan.overview?.executive_summary?.business_concept,
               fallback: 'Business concept not available',
            },
            {
               label: 'Mission',
               value: plan.overview?.executive_summary?.mission_statement,
               fallback: 'Mission statement not available',
            },
            {
               label: 'Vision',
               value: plan.overview?.executive_summary?.vision_statement,
               fallback: 'Vision statement not available',
            },
            {
               label: 'Core Values',
               list: plan.overview?.executive_summary?.core_values,
               fallback: ['Quality', 'Trust'],
            },
            {
               label: 'Short-term Goals',
               list: [
                  ...this.asArray(plan.overview?.executive_summary?.short_term_goals?.months_1_3),
                  ...this.asArray(plan.overview?.executive_summary?.short_term_goals?.months_4_6),
                  ...this.asArray(plan.overview?.executive_summary?.short_term_goals?.months_7_12),
               ],
               fallback: ['Validate demand', 'Launch MVP'],
            },
            {
               label: 'Long-term Goals',
               list: [
                  ...this.asArray(plan.overview?.executive_summary?.long_term_goals?.year_1),
                  ...this.asArray(plan.overview?.executive_summary?.long_term_goals?.year_2),
                  ...this.asArray(plan.overview?.executive_summary?.long_term_goals?.year_3),
                  ...this.asArray(plan.overview?.executive_summary?.long_term_goals?.year_4),
                  ...this.asArray(plan.overview?.executive_summary?.long_term_goals?.year_5),
               ],
               fallback: ['Build a sustainable business'],
            },
            {
               label: 'Unique Selling Proposition',
               value: plan.overview?.executive_summary?.unique_selling_proposition,
               fallback: 'Unique selling proposition not specified',
            },
         ]),

         this.buildContentPage('swot-analysis', 3, 'content', 'SWOT Analysis', 'overview', [
            {
               label: 'Strengths',
               list: [
                  ...this.asArray(plan.overview?.swot_analysis?.strengths?.internal_advantages),
                  ...this.asArray(plan.overview?.swot_analysis?.strengths?.competitive_edges),
                  ...this.asArray(plan.overview?.swot_analysis?.strengths?.resources),
                  ...this.asArray(plan.overview?.swot_analysis?.strengths?.capabilities),
               ],
               fallback: ['Clear positioning'],
            },
            {
               label: 'Weaknesses',
               list: [
                  ...this.asArray(plan.overview?.swot_analysis?.weaknesses?.internal_limitations),
                  ...this.asArray(plan.overview?.swot_analysis?.weaknesses?.gaps),
                  ...this.asArray(plan.overview?.swot_analysis?.weaknesses?.vulnerabilities),
                  ...this.asArray(plan.overview?.swot_analysis?.weaknesses?.constraints),
               ],
               fallback: ['Limited starting resources'],
            },
            {
               label: 'Opportunities',
               list: [
                  ...this.asArray(plan.overview?.swot_analysis?.opportunities?.market_opportunities),
                  ...this.asArray(plan.overview?.swot_analysis?.opportunities?.technological_advancements),
                  ...this.asArray(plan.overview?.swot_analysis?.opportunities?.partnership_potentials),
                  ...this.asArray(plan.overview?.swot_analysis?.opportunities?.expansion_possibilities),
               ],
               fallback: ['Market growth'],
            },
            {
               label: 'Threats',
               list: [
                  ...this.asArray(plan.overview?.swot_analysis?.threats?.market_threats),
                  ...this.asArray(plan.overview?.swot_analysis?.threats?.competitive_pressures),
                  ...this.asArray(plan.overview?.swot_analysis?.threats?.regulatory_risks),
                  ...this.asArray(plan.overview?.swot_analysis?.threats?.economic_factors),
               ],
               fallback: ['Competition'],
            },
         ]),

         this.buildContentPage('business-models', 4, 'content', 'Business Models', 'overview', [
            {
               label: 'Primary Model',
               value: `${this.text(plan.overview?.business_models?.primary_model?.name, 'Primary model')} — ${this.text(plan.overview?.business_models?.primary_model?.description, 'Description not specified')}`,
            },
            {
               label: 'Revenue Streams',
               list: plan.overview?.business_models?.primary_model?.revenue_streams,
               fallback: ['Sales'],
            },
            {
               label: 'Cost Structure',
               list: plan.overview?.business_models?.primary_model?.cost_structure,
               fallback: ['Operations'],
            },
            {
               label: 'Key Partners',
               list: plan.overview?.business_models?.primary_model?.key_partners,
               fallback: ['Suppliers'],
            },
            {
               label: 'Secondary Models',
               list: this.asArray(plan.overview?.business_models?.secondary_models).map((model: any) =>
                  typeof model === 'string'
                     ? model
                     : `${model.name || 'Secondary model'} — ${model.description || model.implementation_timeline || ''}`,
               ),
               fallback: ['Secondary business model not specified'],
            },
            {
               label: 'Hybrid Approaches',
               list: plan.overview?.business_models?.hybrid_approaches,
               fallback: ['Online and offline mix'],
            },
         ]),

         this.buildContentPage('viability-analysis', 5, 'content', 'Viability Analysis', 'overview', [
            {
               label: 'Market Viability',
               value: plan.overview?.viability_analysis?.market_viability?.demand_assessment,
               fallback: 'Market viability not specified',
            },
            {
               label: 'Competitive Landscape',
               value: plan.overview?.viability_analysis?.market_viability?.competitive_landscape,
               fallback: 'Competitive landscape not specified',
            },
            {
               label: 'Financial Viability',
               value: plan.overview?.viability_analysis?.financial_viability?.break_even_analysis,
               fallback: 'Financial viability not specified',
            },
            {
               label: 'Operational Viability',
               value: plan.overview?.viability_analysis?.operational_viability?.resource_availability,
               fallback: 'Operational viability not specified',
            },
            {
               label: 'High Risks',
               list: plan.overview?.viability_analysis?.risk_assessment?.high_risks,
               fallback: ['Demand risk'],
            },
         ]),

         this.buildContentPage('industry-overview', 6, 'content', 'Industry Overview', 'market-research', [
            {
               label: 'Industry Overview',
               value: plan.market_research?.industry_analysis?.industry_overview,
               fallback: 'Industry overview not specified',
            },
            {
               label: 'Key Players',
               list: plan.market_research?.industry_analysis?.key_industry_players,
               fallback: ['Key players not specified'],
            },
            {
               label: 'Current Trends',
               list: plan.market_research?.industry_analysis?.industry_trends?.current_trends,
               fallback: ['Current trends not specified'],
            },
            {
               label: 'Emerging Trends',
               list: plan.market_research?.industry_analysis?.industry_trends?.emerging_trends,
               fallback: ['Emerging trends not specified'],
            },
            {
               label: 'Regulatory Environment',
               value: plan.market_research?.industry_analysis?.regulatory_environment,
               fallback: 'Regulatory environment not specified',
            },
            {
               label: 'Technological Impact',
               value: plan.market_research?.industry_analysis?.technological_impact,
               fallback: 'Technological impact not specified',
            },
         ]),

         this.buildContentPage('target-audience', 7, 'content', 'Target Audience', 'market-research', [
            {
               label: 'Demographics',
               list: this.objectToLines(plan.market_research?.target_audience?.demographics),
               fallback: ['Demographics not specified'],
            },
            {
               label: 'Lifestyle Patterns',
               list: plan.market_research?.target_audience?.psychographics?.lifestyle_patterns,
               fallback: ['Lifestyle patterns not specified'],
            },
            {
               label: 'Values & Beliefs',
               list: plan.market_research?.target_audience?.psychographics?.values_beliefs,
               fallback: ['Values and beliefs not specified'],
            },
            {
               label: 'Buying Behavior',
               list: this.objectToLines(plan.market_research?.target_audience?.psychographics?.buying_behavior),
               fallback: ['Buying behavior not specified'],
            },
            {
               label: 'Functional Needs',
               list: plan.market_research?.target_audience?.needs_analysis?.functional_needs,
               fallback: ['Functional needs not specified'],
            },
            {
               label: 'Pain Points',
               list: plan.market_research?.target_audience?.pain_points?.current_pain_points,
               fallback: ['Pain points not specified'],
            },
         ]),

         this.buildContentPage('market-size-trends', 8, 'content', 'Market Size & Trends', 'market-research', [
            {
               label: 'Current Market Size',
               list: this.objectToLines(plan.market_research?.market_size_trends?.current_market_size),
               fallback: ['Current market size not specified'],
            },
            {
               label: 'Growth Metrics',
               list: this.objectToLines(plan.market_research?.market_size_trends?.growth_metrics),
               fallback: ['Growth metrics not specified'],
            },
            {
               label: 'Market Trends',
               list: [
                  ...this.asArray(plan.market_research?.market_size_trends?.market_trends?.seasonal_trends),
                  ...this.asArray(plan.market_research?.market_size_trends?.market_trends?.cyclical_trends),
                  ...this.asArray(plan.market_research?.market_size_trends?.market_trends?.secular_trends),
               ],
               fallback: ['Market trends not specified'],
            },
            {
               label: 'Forecast Analysis',
               list: this.objectToLines(plan.market_research?.market_size_trends?.forecast_analysis),
               fallback: ['Forecast analysis not specified'],
            },
         ]),

         this.buildContentPage('competitor-analysis', 9, 'content', 'Competitor Analysis', 'market-research', [
            {
               label: 'Direct Competitors',
               list: this.asArray(plan.market_research?.competitor_analysis?.direct_competitors).map((c: any) =>
                  typeof c === 'string'
                     ? c
                     : `${c.name || 'Competitor'} — ${c.pricing_strategy || c.market_share || c.target_audience || ''}`,
               ),
               fallback: ['Direct competitors not specified'],
            },
            {
               label: 'Indirect Competitors',
               list: this.asArray(plan.market_research?.competitor_analysis?.indirect_competitors).map((c: any) =>
                  typeof c === 'string'
                     ? c
                     : `${c.name || 'Competitor'} — ${c.competitive_threat || c.market_overlap || ''}`,
               ),
               fallback: ['Indirect competitors not specified'],
            },
            {
               label: 'Competitive Matrix',
               list: this.objectToLines(plan.market_research?.competitor_analysis?.competitive_matrix),
               fallback: ['Competitive matrix not specified'],
            },
            {
               label: 'SWOT Comparison',
               list: this.objectToLines(plan.market_research?.competitor_analysis?.swot_comparison),
               fallback: ['Competitor SWOT comparison not specified'],
            },
         ]),

         this.buildContentPage('core-offering', 10, 'content', 'Core Offering', 'products-services', [
            {
               label: 'Core Products',
               list: coreProducts.map((p: any) =>
                  typeof p === 'string'
                     ? p
                     : `${p.name || 'Product'} — ${p.description || p.purpose || p.target_customer || ''}`,
               ),
               fallback: ['Core products not specified'],
            },
            {
               label: 'Core Services',
               list: coreServices.map((s: any) =>
                  typeof s === 'string'
                     ? s
                     : `${s.name || 'Service'} — ${s.description || s.delivery_method || s.service_level || ''}`,
               ),
               fallback: ['Core services not specified'],
            },
            {
               label: 'Quality Standards',
               list: plan.products_services?.quality_assurance?.quality_standards,
               fallback: ['Quality standards not specified'],
            },
         ]),

         this.buildContentPage('expansion-opportunities', 11, 'content', 'Expansion Opportunities', 'products-services', [
            {
               label: 'Future Products',
               list: futureProducts.map((p: any) =>
                  typeof p === 'string'
                     ? p
                     : `${p.name || 'Future product'} — ${p.description || p.concept || p.expected_launch || ''}`,
               ),
               fallback: ['Future products not specified'],
            },
            {
               label: 'Innovation Pipeline',
               list: expansionOpportunities,
               fallback: ['Expansion opportunities not specified'],
            },
            {
               label: 'Technology Roadmap',
               list: this.objectToLines(plan.products_services?.innovation_pipeline?.technology_roadmap),
               fallback: ['Technology roadmap not specified'],
            },
         ]),

         this.buildContentPage('secondary-offering', 12, 'content', 'Secondary Offering', 'products-services', [
            {
               label: 'Secondary Products',
               list: secondaryProducts.map((p: any) =>
                  typeof p === 'string'
                     ? p
                     : `${p.name || 'Secondary product'} — ${p.description || p.purpose || p.target_market || ''}`,
               ),
               fallback: ['Secondary products not specified'],
            },
            {
               label: 'Secondary Services',
               list: secondaryServices.map((s: any) =>
                  typeof s === 'string'
                     ? s
                     : `${s.name || 'Secondary service'} — ${s.description || s.value_added || s.pricing_model || s.premium_pricing || ''}`,
               ),
               fallback: ['Secondary services not specified'],
            },
         ]),

         this.buildContentPage('customer-service', 13, 'content', 'Customer Service', 'products-services', [
            {
               label: 'Service Standards',
               list: serviceStandards,
               fallback: ['Service standards not specified'],
            },
            {
               label: 'Support Channels',
               list: this.objectToLines(customerService?.support_channels),
               fallback: ['Support channels not specified'],
            },
            {
               label: 'Support Process',
               value: supportProcess,
               fallback: 'Support process not specified',
            },
            {
               label: 'Feedback Systems',
               list: this.objectToLines(customerService?.customer_feedback_systems),
               fallback: ['Feedback systems not specified'],
            },
            {
               label: 'Complaint Resolution',
               list: this.objectToLines(customerService?.complaint_resolution_process),
               fallback: ['Complaint resolution process not specified'],
            },
         ]),

         this.buildContentPage('marketing-overview', 14, 'content', 'Marketing Overview', 'sales-marketing', [
            {
               label: 'Positioning Statement',
               value: plan.sales_marketing?.marketing_strategy?.positioning_statement,
               fallback: 'Positioning statement not specified',
            },
            {
               label: 'Value Proposition',
               value: plan.sales_marketing?.marketing_strategy?.value_proposition,
               fallback: 'Value proposition not specified',
            },
            {
               label: 'Marketing Mix',
               list: this.objectToLines(plan.sales_marketing?.marketing_strategy?.marketing_mix),
               fallback: ['Marketing mix not specified'],
            },
            {
               label: 'Sales Channels',
               list: this.objectToLines(plan.sales_marketing?.sales_strategy?.sales_channels),
               fallback: ['Sales channels not specified'],
            },
            {
               label: 'Sales Process',
               list: this.objectToLines(plan.sales_marketing?.sales_strategy?.sales_process),
               fallback: ['Sales process not specified'],
            },
         ]),

         this.buildContentPage('branding-identity', 15, 'content', 'Branding & Identity', 'sales-marketing', [
            {
               label: 'Brand Identity',
               list: this.objectToLines(plan.sales_marketing?.brand_development?.brand_identity),
               fallback: ['Brand identity not specified'],
            },
            {
               label: 'Brand Voice',
               list: this.objectToLines(plan.sales_marketing?.brand_development?.brand_voice),
               fallback: ['Brand voice not specified'],
            },
            {
               label: 'Market Position',
               value: plan.sales_marketing?.brand_development?.brand_positioning?.market_position,
               fallback: 'Market position not specified',
            },
            {
               label: 'Differentiation',
               value: plan.sales_marketing?.brand_development?.brand_positioning?.competitive_differentiation,
               fallback: 'Differentiation not specified',
            },
            {
               label: 'Target Perception',
               value: plan.sales_marketing?.brand_development?.brand_positioning?.target_perception,
               fallback: 'Target perception not specified',
            },
         ]),

         this.buildContentPage('customer-retention', 16, 'content', 'Customer Retention', 'sales-marketing', [
            {
               label: 'Retention Strategies',
               list: customerRetention?.retention_strategies,
               fallback: ['Follow-up campaigns', 'Loyalty incentives', 'Customer feedback loops'],
            },
            {
               label: 'Loyalty Program',
               value: customerRetention?.loyalty_program,
               fallback: 'Use repeat-order discounts and partner offers for loyal customers.',
            },
            {
               label: 'Customer Feedback Systems',
               list: this.objectToLines(customerService?.customer_feedback_systems),
               fallback: ['Customer feedback systems not specified'],
            },
            {
               label: 'Service Level Agreements',
               list: this.objectToLines(customerService?.service_level_agreements),
               fallback: ['Service level agreements not specified'],
            },
         ]),

         this.buildContentPage('online-presence', 17, 'content', 'Online Presence', 'sales-marketing', [
            {
               label: 'Website Strategy',
               value: plan.sales_marketing?.digital_marketing?.website_strategy ||
                  plan.sales_marketing?.digital_marketing?.content_strategy?.seo_strategy?.local_seo,
               fallback: 'Build a clear website with vendor onboarding, customer ordering, tracking, and support.',
            },
            {
               label: 'Online Sales',
               value: plan.sales_marketing?.sales_strategy?.sales_channels?.online_sales,
               fallback: 'Use website and mobile app ordering as the main online sales channel.',
            },
            {
               label: 'Content Calendar',
               list: this.objectToLines(contentStrategy?.content_calendar),
               fallback: ['Content calendar not specified'],
            },
            {
               label: 'Analytics & Measurement',
               list: this.objectToLines(plan.sales_marketing?.digital_marketing?.analytics_measurement),
               fallback: ['Analytics and measurement not specified'],
            },
         ]),

         this.buildContentPage('social-media', 18, 'content', 'Social Media', 'sales-marketing', [
            {
               label: 'Facebook',
               value: platformStrategies?.facebook,
               fallback: 'Post local vendor stories, delivery updates, offers, and community highlights.',
            },
            {
               label: 'Instagram',
               value: platformStrategies?.instagram,
               fallback: 'Share food visuals, small-business spotlights, reels, and customer testimonials.',
            },
            {
               label: 'LinkedIn',
               value: platformStrategies?.linkedin,
               fallback: 'Target restaurant owners, local business managers, and B2B partners.',
            },
            {
               label: 'TikTok',
               value: platformStrategies?.tiktok,
               fallback: 'Create short delivery journey videos and local vendor behind-the-scenes content.',
            },
            {
               label: 'Engagement Metrics',
               list: this.objectToLines(plan.sales_marketing?.digital_marketing?.social_media_plan?.engagement_metrics),
               fallback: ['Engagement metrics not specified'],
            },
         ]),

         this.buildContentPage('seo-content', 19, 'content', 'SEO & Content', 'sales-marketing', [
            {
               label: 'Content Types',
               list: contentStrategy?.content_types,
               fallback: ['Blog posts', 'Vendor stories', 'Local delivery guides'],
            },
            {
               label: 'Content Calendar',
               list: this.objectToLines(contentStrategy?.content_calendar),
               fallback: ['Content calendar not specified'],
            },
            {
               label: 'Primary Keywords',
               list: seoStrategy?.primary_keywords || plan.sales_marketing?.digital_marketing?.seo_keywords,
               fallback: ['local delivery service', 'restaurant delivery Austin', 'small business delivery'],
            },
            {
               label: 'Secondary Keywords',
               list: seoStrategy?.secondary_keywords,
               fallback: ['last-mile logistics', 'on-demand courier', 'same-day local delivery'],
            },
            {
               label: 'Local SEO',
               value: seoStrategy?.local_seo,
               fallback: 'Optimize Google Business Profile, local landing pages, and vendor-specific delivery searches.',
            },
         ]),

         this.buildContentPage('digital-marketing', 20, 'content', 'Digital Marketing', 'sales-marketing', [
            {
               label: 'Campaign Budgets',
               list: this.objectToLines(marketingCampaignDetails?.specific_campaign_budgets),
               fallback: ['Campaign budgets not specified'],
            },
            {
               label: 'Promotional Materials',
               list: this.objectToLines(marketingCampaignDetails?.promotional_materials_costs),
               fallback: ['Promotional materials not specified'],
            },
            {
               label: 'Advertising Budget',
               list: this.objectToLines(advertisingBudget),
               fallback: ['Advertising budget not specified'],
            },
            {
               label: 'Email Marketing',
               list: this.objectToLines(plan.sales_marketing?.digital_marketing?.email_marketing),
               fallback: ['Email marketing not specified'],
            },
            {
               label: 'Analytics Measurement',
               list: this.objectToLines(plan.sales_marketing?.digital_marketing?.analytics_measurement),
               fallback: ['Analytics measurement not specified'],
            },
         ]),

         this.buildContentPage('community-engagement', 21, 'content', 'Community Engagement', 'sales-marketing', [
            {
               label: 'Community Events',
               value: communityEngagement?.community_events,
               fallback: 'Host vendor launch events, neighborhood delivery promotions, and local business showcases.',
            },
            {
               label: 'Local Sponsorship Budget',
               value: communityEngagement?.local_sponsorship_budget,
               fallback: 'Allocate a small monthly budget for local partnerships and community visibility.',
            },
            {
               label: 'Charity Donations',
               value: communityEngagement?.charity_donations,
               fallback: 'Support local food drives or small-business community initiatives.',
            },
            {
               label: 'Public Relations Costs',
               value: communityEngagement?.public_relations_costs,
               fallback: 'Budget for local press outreach and launch announcements.',
            },
            {
               label: 'Partnership Opportunities',
               list: plan.overview?.swot_analysis?.opportunities?.partnership_potentials,
               fallback: ['Local business partnerships', 'Restaurant partnerships', 'Community partnerships'],
            },
         ]),

         this.buildContentPage('revenue', 22, 'financial', 'Revenue', 'financials', [
            {
               label: 'Price Points',
               list: plan.financials?.revenue_projections?.pricing_strategy?.price_points,
               fallback: ['Pricing not specified'],
            },
            {
               label: 'Discount Strategy',
               value: plan.financials?.revenue_projections?.pricing_strategy?.discount_strategy,
               fallback: 'Discount strategy not specified',
            },
            {
               label: 'Competitive Pricing',
               value: plan.financials?.revenue_projections?.pricing_strategy?.competitive_pricing,
               fallback: 'Competitive pricing not specified',
            },
            {
               label: 'Value-Based Pricing',
               value: plan.financials?.revenue_projections?.pricing_strategy?.value_based_pricing,
               fallback: 'Value-based pricing not specified',
            },
            {
               label: 'Revenue Streams',
               list: this.objectToLines(plan.financials?.revenue_projections?.revenue_streams),
               fallback: ['Revenue streams not specified'],
            },
            {
               label: 'Monthly Revenue',
               list: this.objectToLines(plan.financials?.revenue_projections?.monthly_revenue),
               fallback: ['Monthly revenue not specified'],
            },
         ]),

         this.buildContentPage('expenses', 23, 'financial', 'Expenses', 'financials', [
            {
               label: 'Fixed Costs',
               list: this.objectToLines(plan.financials?.expense_breakdown?.fixed_costs),
               fallback: ['Fixed costs not specified'],
            },
            {
               label: 'Variable Costs',
               list: this.objectToLines(plan.financials?.expense_breakdown?.variable_costs),
               fallback: ['Variable costs not specified'],
            },
            {
               label: 'Operational Costs',
               list: this.objectToLines(plan.financials?.expense_breakdown?.operational_costs),
               fallback: ['Operational costs not specified'],
            },
            {
               label: 'Detailed Equipment Costs',
               list: this.objectToLines(plan.financials?.expense_breakdown?.detailed_equipment_costs),
               fallback: ['Detailed equipment costs not specified'],
            },
         ]),

         this.buildContentPage('financing', 24, 'financial', 'Financing', 'financials', [
            {
               label: 'Startup Capital',
               list: this.objectToLines(plan.financials?.funding_requirements?.startup_capital),
               fallback: ['Startup capital not specified'],
            },
            {
               label: 'Growth Funding',
               list: this.objectToLines(plan.financials?.funding_requirements?.growth_funding),
               fallback: ['Growth funding not specified'],
            },
            {
               label: 'Return Expectations',
               list: this.objectToLines(plan.financials?.funding_requirements?.return_expectations),
               fallback: ['Return expectations not specified'],
            },
         ]),

         this.buildContentPage('dividends', 25, 'financial', 'Dividends', 'financials', [
            {
               label: 'Dividend Policy',
               value: plan.financials?.dividends?.policy,
               fallback: 'Initial profits should prioritize reinvestment.',
            },
            {
               label: 'Reinvestment Strategy',
               value: plan.financials?.dividends?.reinvestment_strategy,
               fallback: 'Reinvest into growth and operational stability.',
            },
            {
               label: 'Contingency Fund',
               list: this.objectToLines(plan.financials?.contingency_fund),
               fallback: ['Contingency fund not specified'],
            },
         ]),

         this.buildContentPage('profit-loss', 26, 'financial', 'Profit & Loss', 'taxes', [
            {
               label: 'Key Metrics',
               list: this.objectToLines(plan.financials?.profit_loss_statement?.key_metrics),
               fallback: ['Profit and loss metrics not specified'],
            },
            {
               label: 'Profitability Timeline',
               list: this.objectToLines(plan.financials?.profit_loss_statement?.profitability_timeline),
               fallback: ['Profitability timeline not specified'],
            },
            {
               label: 'Monthly P&L',
               list: this.objectToLines(plan.financials?.profit_loss_statement?.monthly_pnl),
               fallback: ['Monthly profit and loss not specified'],
            },
         ]),

         this.buildContentPage('balance-sheet', 27, 'financial', 'Balance Sheet', 'taxes', [
            {
               label: 'Balance Sheet',
               list: this.objectToLines(plan.financials?.balance_sheet),
               fallback: [
                  'Assets, liabilities, and equity should be finalized after accounting setup.',
                  'Track delivery vehicles, software assets, cash balance, loans, and founder equity.',
               ],
            },
         ]),

         this.buildContentPage('cash-flow', 28, 'financial', 'Cash Flow', 'taxes', [
            {
               label: 'Operating Cash Flow',
               list: this.objectToLines(plan.financials?.cash_flow_analysis?.operating_cash_flow),
               fallback: ['Operating cash flow not specified'],
            },
            {
               label: 'Investing Cash Flow',
               list: this.objectToLines(plan.financials?.cash_flow_analysis?.investing_cash_flow),
               fallback: ['Investing cash flow not specified'],
            },
            {
               label: 'Financing Cash Flow',
               list: this.objectToLines(plan.financials?.cash_flow_analysis?.financing_cash_flow),
               fallback: ['Financing cash flow not specified'],
            },
            {
               label: 'Cash Balance Forecast',
               list: this.objectToLines(plan.financials?.cash_flow_analysis?.cash_balance_forecast),
               fallback: ['Cash balance forecast not specified'],
            },
         ]),

         this.buildContentPage('funding-plan', 29, 'financial', 'Funding Plan', 'taxes', [
            {
               label: 'Startup Capital',
               list: this.objectToLines(plan.financials?.funding_requirements?.startup_capital),
               fallback: ['Startup capital not specified'],
            },
            {
               label: 'Growth Funding',
               list: this.objectToLines(plan.financials?.funding_requirements?.growth_funding),
               fallback: ['Growth funding not specified'],
            },
            {
               label: 'Return Expectations',
               list: this.objectToLines(plan.financials?.funding_requirements?.return_expectations),
               fallback: ['Return expectations not specified'],
            },
            {
               label: 'Contingency Fund',
               list: this.objectToLines(plan.financials?.contingency_fund),
               fallback: ['Contingency fund not specified'],
            },
         ]),

         this.buildContentPage('team-roles', 30, 'content', 'Team & Roles', 'operations', [
            {
               label: 'Management Team',
               list: this.asArray(plan.operations?.organizational_structure?.management_team).map((m: any) =>
                  typeof m === 'string'
                     ? m
                     : `${m.position || 'Role'} — ${this.joinArray(m.responsibilities, this.text(m.experience || m.qualifications))}`,
               ),
               fallback: ['Management team not specified'],
            },
            {
               label: 'Immediate Hires',
               list: this.asArray(plan.operations?.organizational_structure?.staffing_plan?.immediate_hires).map((hire: any) =>
                  typeof hire === 'string'
                     ? hire
                     : `${hire.position || 'Hire'} — ${hire.experience_level || ''}; ${hire.salary_range || ''}`,
               ),
               fallback: ['Immediate hires not specified'],
            },
            {
               label: 'Year 1 Hires',
               list: plan.operations?.organizational_structure?.staffing_plan?.year_1_hires,
               fallback: ['Year 1 hires not specified'],
            },
            {
               label: 'Year 2 Hires',
               list: plan.operations?.organizational_structure?.staffing_plan?.year_2_hires,
               fallback: ['Year 2 hires not specified'],
            },
            {
               label: 'HR Details',
               list: this.objectToLines(plan.operations?.organizational_structure?.human_resources_details),
               fallback: ['Human resources details not specified'],
            },
         ]),

         this.buildContentPage('operation-plan', 31, 'content', 'Operation Plan', 'operations', [
            {
               label: 'Location Analysis',
               list: this.objectToLines(plan.operations?.facilities_equipment?.location_analysis),
               fallback: ['Location analysis not specified'],
            },
            {
               label: 'Physical Location Details',
               list: this.objectToLines(plan.operations?.facilities_equipment?.physical_location_details),
               fallback: ['Physical location details not specified'],
            },
            {
               label: 'Equipment List',
               list: this.asArray(plan.operations?.facilities_equipment?.equipment_list).map((e: any) =>
                  typeof e === 'string'
                     ? e
                     : `${e.name || 'Equipment'} — ${e.purpose || ''}; ${e.cost || ''}; ${e.brand_model || ''}`,
               ),
               fallback: ['Equipment list not specified'],
            },
            {
               label: 'Technology Stack',
               list: this.objectToLines(plan.operations?.facilities_equipment?.technology_stack),
               fallback: ['Technology stack not specified'],
            },
            {
               label: 'Technology Infrastructure',
               list: this.objectToLines(plan.operations?.facilities_equipment?.technology_infrastructure),
               fallback: ['Technology infrastructure not specified'],
            },
            {
               label: 'Supply Chain',
               list: this.objectToLines(plan.operations?.supply_chain),
               fallback: ['Supply chain not specified'],
            },
            {
               label: 'Environmental Sustainability',
               list: this.objectToLines(plan.operations?.environmental_sustainability),
               fallback: ['Environmental sustainability not specified'],
            },
         ]),

         this.buildContentPage('risk-analysis', 32, 'content', 'Risk Analysis', 'operations', [
            {
               label: 'Market Risks',
               list: riskIdentification?.market_risks,
               fallback: ['Market risks not specified'],
            },
            {
               label: 'Financial Risks',
               list: riskIdentification?.financial_risks,
               fallback: ['Financial risks not specified'],
            },
            {
               label: 'Operational Risks',
               list: riskIdentification?.operational_risks,
               fallback: ['Operational risks not specified'],
            },
            {
               label: 'Compliance Risks',
               list: riskIdentification?.compliance_risks || riskIdentification?.legal_risks,
               fallback: ['Compliance risks not specified'],
            },
            {
               label: 'Risk Assessment',
               list: this.objectToLines(plan.risk_management?.risk_assessment),
               fallback: ['Risk assessment not specified'],
            },
            {
               label: 'Mitigation',
               list: [
                  ...this.asArray(mitigation?.preventive_actions),
                  ...this.asArray(mitigation?.preventive_measures),
                  ...this.asArray(mitigation?.contingency_actions),
                  ...this.asArray(mitigation?.contingency_plans),
               ],
               fallback: ['Mitigation plan not specified'],
            },
            {
               label: 'Monitoring Plan',
               list: this.objectToLines(plan.risk_management?.monitoring_plan),
               fallback: ['Monitoring plan not specified'],
            },
         ]),

         this.buildContentPage('regulatory-compliance', 33, 'content', 'Regulatory Compliance', 'operations', [
            {
               label: 'Legal Structure',
               value: plan.overview?.legal_compliance?.business_registration?.legal_structure,
               fallback: 'Legal structure not specified',
            },
            {
               label: 'Business Registration',
               list: this.objectToLines(plan.overview?.legal_compliance?.business_registration),
               fallback: ['Business registration not specified'],
            },
            {
               label: 'Licenses & Permits',
               list: this.asArray(plan.overview?.legal_compliance?.licenses_permits).map((l: any) =>
                  typeof l === 'string'
                     ? l
                     : `${l.license_name || 'License'} — ${l.issuing_authority || ''}; ${l.cost || ''}; renews ${l.renewal_date || 'TBD'}`,
               ),
               fallback: ['Licenses and permits not specified'],
            },
            {
               label: 'Tax Obligations',
               list: this.objectToLines(plan.overview?.legal_compliance?.tax_obligations),
               fallback: ['Tax obligations not specified'],
            },
            {
               label: 'Insurance',
               list: this.asArray(plan.overview?.legal_compliance?.insurance_requirements).map((i: any) =>
                  typeof i === 'string'
                     ? i
                     : `${i.insurance_type || 'Insurance'} — ${i.coverage_amount || ''}; ${i.premium_cost || ''}; ${i.provider || ''}`,
               ),
               fallback: ['Insurance requirements not specified'],
            },
         ]),

         this.buildContentPage('pre-launch', 34, 'content', 'Pre-Launch', 'implementation-plan', [
            {
               label: 'Phase Duration',
               value: preLaunch?.phase_duration,
               fallback: 'Pre-launch duration not specified',
            },
            {
               label: 'Key Milestones',
               list: this.asArray(preLaunch?.key_milestones).map((m: any) =>
                  typeof m === 'string'
                     ? m
                     : `${m.name || 'Milestone'} — ${m.description || ''}; due ${m.due_date || 'TBD'}`,
               ),
               fallback: ['Pre-launch milestones not specified'],
            },
            {
               label: 'Critical Path',
               value: preLaunch?.critical_path,
               fallback: 'Critical path not specified',
            },
            {
               label: 'Resource Allocation',
               value: preLaunch?.resource_allocation,
               fallback: 'Resource allocation not specified',
            },
         ]),

         this.buildContentPage('post-launch', 35, 'content', 'Post-Launch', 'implementation-plan', [
            {
               label: 'Launch Date',
               value: launch?.launch_date,
               fallback: 'Launch date not specified',
            },
            {
               label: 'Launch Activities',
               list: launch?.launch_activities,
               fallback: ['Launch activities not specified'],
            },
            {
               label: 'Post-Launch Support',
               value: launch?.post_launch_support,
               fallback: 'Post-launch support not specified',
            },
            {
               label: 'Performance Monitoring',
               value: launch?.performance_monitoring,
               fallback: 'Performance monitoring not specified',
            },
            {
               label: 'Growth Phase',
               list: this.objectToLines(postLaunch),
               fallback: ['Growth phase not specified'],
            },
         ]),

         this.buildContentPage('five-year-plan', 36, 'content', '5 Year Plan', 'implementation-plan', [
            {
               label: 'Year 1',
               list: fiveYearRoadmap?.annual_goals?.year_1 || plan.overview?.executive_summary?.long_term_goals?.year_1,
               fallback: ['Year 1 goals not specified'],
            },
            {
               label: 'Year 2',
               list: fiveYearRoadmap?.annual_goals?.year_2 || plan.overview?.executive_summary?.long_term_goals?.year_2,
               fallback: ['Year 2 goals not specified'],
            },
            {
               label: 'Year 3',
               list: fiveYearRoadmap?.annual_goals?.year_3 || plan.overview?.executive_summary?.long_term_goals?.year_3,
               fallback: ['Year 3 goals not specified'],
            },
            {
               label: 'Year 4',
               list: fiveYearRoadmap?.annual_goals?.year_4 || plan.overview?.executive_summary?.long_term_goals?.year_4,
               fallback: ['Year 4 goals not specified'],
            },
            {
               label: 'Year 5',
               list: fiveYearRoadmap?.annual_goals?.year_5 || plan.overview?.executive_summary?.long_term_goals?.year_5,
               fallback: ['Year 5 goals not specified'],
            },
            {
               label: 'Success Metrics',
               list: this.objectToLines(fiveYearRoadmap?.success_metrics),
               fallback: ['Success metrics not specified'],
            },
            {
               label: 'Quarterly Objectives',
               list: this.objectToLines(fiveYearRoadmap?.quarterly_objectives),
               fallback: ['Quarterly objectives not specified'],
            },
         ]),
      ];

      return {
         theme: {
            primary_color: '#001941',
            secondary_color: '#ffffff',
            font_family: 'System',
            base_font_size: 14,
         },
         sections,
         pages,
         table_of_contents: this.tableOfContents,
      };
   }


   private sanitizeGeneratedBusinessPlan(plan: any) {
      const cleanPlan = plan?.business_plan ?? plan ?? {};
      delete cleanPlan.presentation;
      delete cleanPlan.pages;
      delete cleanPlan.sections;
      delete cleanPlan.table_of_contents;
      return cleanPlan;
   }

   private mergeGeneratedBusinessPlan(plan: BusinessPlan, generatedPayload: any, currentBusinessPlan: any, options?: GenerateBusinessPlanDto) {
      const today = new Date().toISOString().split('T')[0];
      const generatedBusinessPlan = this.sanitizeGeneratedBusinessPlan(generatedPayload);
      const overwrite = options?.overwrite || !currentBusinessPlan;

      const mergedBusinessPlan = overwrite
         ? generatedBusinessPlan
         : { ...(currentBusinessPlan || {}), ...generatedBusinessPlan };

      return {
         ...mergedBusinessPlan,
         metadata: {
            ...(currentBusinessPlan?.metadata || {}),
            ...(generatedBusinessPlan?.metadata || {}),
            business_name: plan.businessName,
            idea: plan.idea,
            location: plan.place,
            unique_tags: plan.uniqueTags || [],
            created_date: currentBusinessPlan?.metadata?.created_date || generatedBusinessPlan?.metadata?.created_date || today,
            last_updated: today,
            version: generatedBusinessPlan?.metadata?.version || currentBusinessPlan?.metadata?.version || '1.0.0',
         },
      };
   }

   private buildFallbackBusinessPlan(plan: BusinessPlan, language: SupportedPlanLanguage = 'en') {
      const today = new Date().toISOString().split('T')[0];
      const businessName = plan.businessName || 'Business Plan';
      const idea = plan.idea || '';
      const location = plan.place || '';
      const mission =
         language === 'hy'
            ? 'Տրամադրել հստակ արժեք ընտրված հաճախորդներին։'
            : language === 'ru'
               ? 'Давать понятную ценность выбранным клиентам.'
               : 'Provide reliable value to a clearly defined customer segment.';

      return {
         business_plan: {
            metadata: { business_name: businessName, idea, location, unique_tags: plan.uniqueTags || [], created_date: today, last_updated: today, version: '1.0.0' },
            overview: {
               executive_summary: {
                  business_concept: `${businessName} is focused on ${idea} in ${location}.`,
                  mission_statement: mission,
                  vision_statement: 'Build a sustainable, recognizable, and scalable business.',
                  core_values: ['Quality', 'Trust'],
                  unique_selling_proposition: 'A focused offer adapted to customer needs.',
                  short_term_goals: { months_1_3: ['Validate demand', 'Prepare launch'], months_4_6: ['Launch MVP', 'Collect feedback'], months_7_12: ['Grow customers', 'Optimize costs'] },
                  long_term_goals: { year_1: ['Launch and stabilize'], year_2: ['Increase revenue'], year_3: ['Expand offer'], year_4: ['Strengthen brand'], year_5: ['Scale operations'] },
               },
               swot_analysis: {
                  strengths: { internal_advantages: ['Clear idea'], competitive_edges: ['Focused niche'], resources: ['Founder effort'], capabilities: ['Fast testing'] },
                  weaknesses: { internal_limitations: ['Limited budget'], gaps: ['Need market data'], vulnerabilities: ['New brand'], constraints: ['Time and capital'] },
                  opportunities: { market_opportunities: ['Local demand'], technological_advancements: ['Automation'], partnership_potentials: ['Local partners'], expansion_possibilities: ['New segments'] },
                  threats: { market_threats: ['Competition'], competitive_pressures: ['Price pressure'], regulatory_risks: ['Compliance changes'], economic_factors: ['Inflation'] },
               },
               business_models: { primary_model: { name: 'Direct sales', description: 'Sell directly to customers.', revenue_streams: ['Sales'], cost_structure: ['Marketing', 'Operations'], key_partners: ['Suppliers'] }, secondary_models: [{ name: 'Recurring revenue', description: 'Encourage repeat purchases.', implementation_timeline: '6-12 months' }], hybrid_approaches: ['Online and offline sales'] },
               viability_analysis: { market_viability: { demand_assessment: 'Validate with interviews and small tests.', competitive_landscape: 'Competition exists but differentiation is possible.', market_entry_barriers: 'Brand trust and acquisition cost.' }, financial_viability: { startup_costs: 'Start lean.', break_even_analysis: 'Depends on stable monthly sales.', profitability_timeline: 'After demand validation.' }, operational_viability: { resource_availability: 'Basic resources are available.', skill_requirements: 'Sales, operations, marketing.', infrastructure_needs: 'Simple tools and processes.' }, risk_assessment: { high_risks: ['Weak demand'], medium_risks: ['Operational delays'], low_risks: ['Minor process issues'] } },
               legal_compliance: { business_registration: { legal_structure: 'To be selected', registration_number: 'To be obtained', tax_identification_number: 'To be obtained' }, licenses_permits: [], tax_obligations: { vat_registration: 'Check local rules', income_tax: 'Follow local rules', payroll_taxes: 'If hiring', tax_filing_schedule: 'Ask accountant' }, insurance_requirements: [] },
            },
            market_research: { industry_analysis: { industry_overview: `Research the market for ${idea} in ${location}.`, key_industry_players: ['Local competitors'], industry_trends: { current_trends: ['Convenience'], emerging_trends: ['Automation'], future_predictions: ['More competition'] }, regulatory_environment: 'Check local requirements.', technological_impact: 'Technology can improve efficiency.' }, target_audience: { psychographics: { lifestyle_patterns: ['Busy customers'], values_beliefs: ['Convenience'], interests_hobbies: ['Relevant interests'], personality_traits: ['Practical'], buying_behavior: { purchase_frequency: 'To validate', spending_habits: 'To validate', brand_loyalty: 'Depends on quality' } }, needs_analysis: { functional_needs: ['Reliable solution'], emotional_needs: ['Trust'], social_needs: ['Recommendations'], unmet_needs: ['Better service'] }, pain_points: { current_pain_points: ['Limited options'], anticipated_pain_points: ['Higher prices'] } }, market_size_trends: { current_market_size: {}, growth_metrics: {}, market_trends: {}, forecast_analysis: {} }, competitor_analysis: { direct_competitors: [], indirect_competitors: [], competitive_matrix: {} } },
            products_services: { product_line: { core_products: [{ name: businessName, description: idea }] }, service_offerings: { core_services: [] }, customer_service: { service_standards: ['Clear communication'], support_process: 'Respond quickly.' }, expansion_opportunities: ['New services'] },
            sales_marketing: { marketing_strategy: { positioning_statement: `${businessName} offers a focused solution.`, value_proposition: 'Useful, reliable, and simple.' }, sales_strategy: { sales_channels: { direct_sales: 'Direct outreach', online_sales: 'Social media', retail_partners: 'Later', distribution_network: 'To build' } }, digital_marketing: { social_media_plan: { platform_strategies: {} } }, brand_development: { brand_positioning: {} }, customer_retention: { retention_strategies: ['Follow-up'], loyalty_program: 'Later' }, community_engagement: { initiatives: ['Local outreach'], partnerships: ['Local partners'] } },
            financials: { revenue_projections: { pricing_strategy: { price_points: ['Starter price'] } }, expense_breakdown: { fixed_costs: {}, variable_costs: {} }, profit_loss_statement: { key_metrics: {} }, balance_sheet: {}, cash_flow_analysis: { operating_cash_flow: {} }, funding_requirements: { startup_capital: {}, return_expectations: {} }, dividends: {}, contingency_fund: { specific_scenarios_covered: [] } },
            operations: { organizational_structure: { management_team: [{ position: 'Founder', responsibilities: ['Sales', 'Operations'] }], staffing_plan: {} }, facilities_equipment: { location_analysis: {}, equipment_list: [] }, supply_chain: { supplier_details: {} }, quality_control: { quality_standards: ['Consistency'] }, environmental_sustainability: {} },
            risk_management: { risk_identification: { market_risks: ['Weak demand'], financial_risks: ['Cash flow'], operational_risks: ['Delays'] }, mitigation_plan: { preventive_actions: ['Track metrics'], contingency_actions: ['Reduce costs'], monitoring_process: 'Weekly review' } },
            implementation_timeline: { pre_launch_phase: { key_milestones: [{ name: 'Research', description: 'Validate demand' }] }, launch_phase: { launch_activities: ['Launch small'] }, post_launch_phase: { key_milestones: [{ name: 'Optimize', description: 'Improve offer' }] } },
         },
      };
   }

   private async generateBusinessPlanOnce(plan: BusinessPlan, currentBusinessPlan: any, options?: GenerateBusinessPlanDto) {
      const requestedLanguage = (options?.language || 'en') as SupportedPlanLanguage;
      const generatedPayload = await this.requestAiJson(this.buildBaseBusinessPlanPrompt(plan, requestedLanguage));
      const mergedBusinessPlan = this.mergeGeneratedBusinessPlan(plan, generatedPayload, currentBusinessPlan, options);
      return { business_plan: mergedBusinessPlan };
   }

   async create(userId: string, planData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const result = await this.prisma.businessPlan.create({ data: { ...planData, userId } });
         return this.createSuccessResponse(result, 'Business plan created successfully', HttpStatus.CREATED);
      } catch (error) {
         return this.createErrorResponse('Failed to create business plan', error instanceof Error ? error.message : 'Unknown error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
   }

   async findAll(userId: string): Promise<ApiResponse<BusinessPlan[]>> {
      try {
         const result = await this.prisma.businessPlan.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
         return this.createSuccessResponse(result, 'Business plans retrieved successfully');
      } catch (error) {
         return this.createErrorResponse('Failed to retrieve business plans', error instanceof Error ? error.message : 'Unknown error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
   }

   async findOne(id: string, userId: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const result = await this.prisma.businessPlan.findFirst({ where: { id, userId } });
         if (!result) throw new NotFoundException('Business plan not found');
         return this.createSuccessResponse(result, 'Business plan retrieved successfully');
      } catch (error) {
         if (error instanceof NotFoundException) return this.createErrorResponse(error.message, 'Not Found', HttpStatus.NOT_FOUND);
         return this.createErrorResponse('Failed to retrieve business plan', error instanceof Error ? error.message : 'Unknown error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
   }

   async findActive(userId: string): Promise<ApiResponse<BusinessPlan | null>> {
      try {
         const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { activeBusinessPlanId: true },
         });

         let result: BusinessPlan | null = null;

         if (user?.activeBusinessPlanId) {
            result = await this.prisma.businessPlan.findFirst({
               where: {
                  id: user.activeBusinessPlanId,
                  userId,
               },
            });
         }

         if (!result) {
            result = await this.prisma.businessPlan.findFirst({
               where: { userId },
               orderBy: { updatedAt: 'desc' },
            });
         }

         return this.createSuccessResponse(
            result,
            'Active business plan retrieved successfully',
         );
      } catch (error) {
         return this.createErrorResponse(
            'Failed to retrieve active business plan',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async update(id: string, userId: string, updateData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({ where: { id, userId } });
         if (!existing) throw new NotFoundException('Business plan not found');
         const result = await this.prisma.businessPlan.update({ where: { id }, data: updateData });
         return this.createSuccessResponse(result, 'Business plan updated successfully');
      } catch (error) {
         if (error instanceof NotFoundException) return this.createErrorResponse(error.message, 'Not Found', HttpStatus.NOT_FOUND);
         return this.createErrorResponse('Failed to update business plan', error instanceof Error ? error.message : 'Unknown error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
   }

   async remove(id: string, userId: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({ where: { id, userId } });
         if (!existing) throw new NotFoundException('Business plan not found');
         const result = await this.prisma.businessPlan.delete({ where: { id } });
         return this.createSuccessResponse(result, 'Business plan deleted successfully');
      } catch (error) {
         if (error instanceof NotFoundException) return this.createErrorResponse(error.message, 'Not Found', HttpStatus.NOT_FOUND);
         return this.createErrorResponse('Failed to delete business plan', error instanceof Error ? error.message : 'Unknown error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
   }

   async setActive(id: string, userId: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({
            where: { id, userId },
         });

         if (!existing) {
            throw new NotFoundException('Business plan not found');
         }

         await this.prisma.user.update({
            where: { id: userId },
            data: {
               activeBusinessPlanId: id,
            },
         });

         return this.createSuccessResponse(
            existing,
            'Active business plan changed successfully',
         );
      } catch (error) {
         if (error instanceof NotFoundException) {
            return this.createErrorResponse(
               error.message,
               'Not Found',
               HttpStatus.NOT_FOUND,
            );
         }

         return this.createErrorResponse(
            'Failed to set active business plan',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async generateBusinessPlan(id: string, userId: string, options?: GenerateBusinessPlanDto): Promise<ApiResponse<any>> {
      const existing = await this.prisma.businessPlan.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundException('Business plan not found');

      const additionalData = (existing.additionalData as Record<string, any>) || {};
      const requestedLanguage = (options?.language || 'en') as SupportedPlanLanguage;
      const previousStatus = additionalData.business_plan_generation as BusinessPlanGenerationStatus | undefined;

      await this.updateBusinessPlanAdditionalData(id, additionalData, {
         business_plan_generation: this.buildGenerationStatus('generating', requestedLanguage, previousStatus, null),
      });

      try {
         let generatedPayload: any;
         try {
            generatedPayload = await this.generateBusinessPlanOnce(
               existing,
               additionalData.business_plan,
               options,
            );
         } catch (error) {
            console.error('NVIDIA NIM generation failed:', error);

            throw new Error(
               error instanceof Error
                  ? `NVIDIA NIM generation failed: ${error.message}`
                  : 'NVIDIA NIM generation failed',
            );
         }

         const baseBusinessPlan = this.mergeGeneratedBusinessPlan(existing, generatedPayload, options?.overwrite ? null : additionalData.business_plan, options);

         const presentation = this.buildPresentationFromBusinessPlan(baseBusinessPlan);

         const planWithPresentation = {
            ...baseBusinessPlan,
            metadata: {
               ...baseBusinessPlan.metadata,
               total_pages: presentation.pages.length,
               version: baseBusinessPlan.metadata?.version || '1.0.0',
            },
            presentation,
         };

         const currentTranslations = additionalData.business_plan_translations || {};
         const patch: Record<string, any> = {
            business_plan_generation: this.buildGenerationStatus('ready', requestedLanguage, previousStatus, null),
         };

         if (requestedLanguage === 'en') {
            patch.business_plan = planWithPresentation;
         } else {
            patch.business_plan = additionalData.business_plan || planWithPresentation;
            patch.business_plan_translations = { ...currentTranslations, [requestedLanguage]: planWithPresentation };
         }

         await this.updateBusinessPlanAdditionalData(id, additionalData, patch);
         return this.createSuccessResponse({ business_plan: planWithPresentation }, 'Business plan generated successfully');
      } catch (error) {
         const latest = await this.prisma.businessPlan.findUnique({ where: { id } });
         const latestAdditionalData = (latest?.additionalData as Record<string, any>) || additionalData;

         await this.updateBusinessPlanAdditionalData(id, latestAdditionalData, {
            business_plan_generation: this.buildGenerationStatus('failed', requestedLanguage, previousStatus, error instanceof Error ? error.message : 'Generation failed'),
         });

         return this.createErrorResponse('Failed to generate business plan', error instanceof Error ? error.message : 'Unknown error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
   }

   async getActive(userId: string): Promise<ApiResponse<BusinessPlan | null>> {
      return this.findActive(userId);
   }

   async addFinancialData(
      id: string,
      userId: string,
      financialData: any,
   ): Promise<ApiResponse<BusinessPlan>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({
            where: { id, userId },
         });

         if (!existing) {
            throw new NotFoundException('Business plan not found');
         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               financialData: {
                  ...((existing.financialData as Record<string, any>) || {}),
                  ...financialData,
               },
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(
            result,
            'Financial data updated successfully',
         );
      } catch (error) {
         if (error instanceof NotFoundException) {
            return this.createErrorResponse(
               error.message,
               'Not Found',
               HttpStatus.NOT_FOUND,
            );
         }

         return this.createErrorResponse(
            'Failed to update financial data',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async search(
      userId: string,
      searchTerm: string,
   ): Promise<ApiResponse<BusinessPlan[]>> {
      try {
         const term = searchTerm?.trim();

         const result = await this.prisma.businessPlan.findMany({
            where: {
               userId,
               ...(term
                  ? {
                     OR: [
                        {
                           businessName: {
                              contains: term,
                              mode: 'insensitive',
                           },
                        },
                        {
                           place: {
                              contains: term,
                              mode: 'insensitive',
                           },
                        },
                        {
                           idea: {
                              contains: term,
                              mode: 'insensitive',
                           },
                        },
                     ],
                  }
                  : {}),
            },
            orderBy: { updatedAt: 'desc' },
         });

         return this.createSuccessResponse(
            result,
            'Business plans search completed successfully',
         );
      } catch (error) {
         return this.createErrorResponse(
            'Failed to search business plans',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async getStats(userId: string): Promise<ApiResponse<any>> {
      try {
         const [plans, user] = await Promise.all([
            this.prisma.businessPlan.findMany({
               where: { userId },
               orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.user.findUnique({
               where: { id: userId },
               select: { activeBusinessPlanId: true },
            }),
         ]);

         const uniqueTags = Array.from(
            new Set(plans.flatMap((plan) => plan.uniqueTags || [])),
         );

         const stats = {
            totalPlans: plans.length,
            activeBusinessPlanId: user?.activeBusinessPlanId || null,
            hasActivePlan: Boolean(user?.activeBusinessPlanId),
            totalUniqueTags: uniqueTags.length,
            uniqueTags,
            latestPlan: plans[0] || null,
         };

         return this.createSuccessResponse(
            stats,
            'Business plan stats retrieved successfully',
         );
      } catch (error) {
         return this.createErrorResponse(
            'Failed to retrieve business plan stats',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async getAdditionalData(id: string, userId: string): Promise<ApiResponse<any>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({
            where: { id, userId },
         });

         if (!existing) {
            throw new NotFoundException('Business plan not found');
         }

         return this.createSuccessResponse(
            existing.additionalData || {},
            'Additional data retrieved successfully',
         );
      } catch (error) {
         if (error instanceof NotFoundException) {
            return this.createErrorResponse(
               error.message,
               'Not Found',
               HttpStatus.NOT_FOUND,
            );
         }

         return this.createErrorResponse(
            'Failed to retrieve additional data',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async updateAdditionalData(
      id: string,
      userId: string,
      additionalData: any,
   ): Promise<ApiResponse<BusinessPlan>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({
            where: { id, userId },
         });

         if (!existing) {
            throw new NotFoundException('Business plan not found');
         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: additionalData || {},
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(
            result,
            'Additional data updated successfully',
         );
      } catch (error) {
         if (error instanceof NotFoundException) {
            return this.createErrorResponse(
               error.message,
               'Not Found',
               HttpStatus.NOT_FOUND,
            );
         }

         return this.createErrorResponse(
            'Failed to update additional data',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async patchAdditionalData(
      id: string,
      userId: string,
      additionalData: any,
   ): Promise<ApiResponse<BusinessPlan>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({
            where: { id, userId },
         });

         if (!existing) {
            throw new NotFoundException('Business plan not found');
         }

         const currentAdditionalData =
            (existing.additionalData as Record<string, any>) || {};

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: {
                  ...currentAdditionalData,
                  ...(additionalData || {}),
               },
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(
            result,
            'Additional data patched successfully',
         );
      } catch (error) {
         if (error instanceof NotFoundException) {
            return this.createErrorResponse(
               error.message,
               'Not Found',
               HttpStatus.NOT_FOUND,
            );
         }

         return this.createErrorResponse(
            'Failed to patch additional data',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async removeAdditionalDataKey(
      id: string,
      userId: string,
      key: string,
   ): Promise<ApiResponse<BusinessPlan>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({
            where: { id, userId },
         });

         if (!existing) {
            throw new NotFoundException('Business plan not found');
         }

         const currentAdditionalData =
            (existing.additionalData as Record<string, any>) || {};

         const { [key]: _removed, ...remainingAdditionalData } =
            currentAdditionalData;

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: remainingAdditionalData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(
            result,
            'Additional data key removed successfully',
         );
      } catch (error) {
         if (error instanceof NotFoundException) {
            return this.createErrorResponse(
               error.message,
               'Not Found',
               HttpStatus.NOT_FOUND,
            );
         }

         return this.createErrorResponse(
            'Failed to remove additional data key',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async addAdditionalDataKey(
      id: string,
      userId: string,
      key: string,
      value: any,
   ): Promise<ApiResponse<BusinessPlan>> {
      return this.updateAdditionalDataKey(id, userId, key, value);
   }

   async updateAdditionalDataKey(
      id: string,
      userId: string,
      key: string,
      value: any,
   ): Promise<ApiResponse<BusinessPlan>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({
            where: { id, userId },
         });

         if (!existing) {
            throw new NotFoundException('Business plan not found');
         }

         const currentAdditionalData =
            (existing.additionalData as Record<string, any>) || {};

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: {
                  ...currentAdditionalData,
                  [key]: value,
               },
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(
            result,
            'Additional data key updated successfully',
         );
      } catch (error) {
         if (error instanceof NotFoundException) {
            return this.createErrorResponse(
               error.message,
               'Not Found',
               HttpStatus.NOT_FOUND,
            );
         }

         return this.createErrorResponse(
            'Failed to update additional data key',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }

   async getAdditionalDataKeys(
      id: string,
      userId: string,
   ): Promise<ApiResponse<string[]>> {
      try {
         const existing = await this.prisma.businessPlan.findFirst({
            where: { id, userId },
         });

         if (!existing) {
            throw new NotFoundException('Business plan not found');
         }

         const additionalData =
            (existing.additionalData as Record<string, any>) || {};

         return this.createSuccessResponse(
            Object.keys(additionalData),
            'Additional data keys retrieved successfully',
         );
      } catch (error) {
         if (error instanceof NotFoundException) {
            return this.createErrorResponse(
               error.message,
               'Not Found',
               HttpStatus.NOT_FOUND,
            );
         }

         return this.createErrorResponse(
            'Failed to retrieve additional data keys',
            error instanceof Error ? error.message : 'Unknown error',
            HttpStatus.INTERNAL_SERVER_ERROR,
         );
      }
   }
}

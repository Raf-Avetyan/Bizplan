import { Injectable, NotFoundException, BadRequestException, ForbiddenException, HttpStatus } from '@nestjs/common';
import { BusinessPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateBusinessPlanDto } from './dto/business-plan.dto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface ApiResponse<T = any> {
   success: boolean;
   data?: T;
   message?: string;
   error?: string;
   statusCode?: number;
}

@Injectable()
export class BusinessPlansService {
   constructor(private readonly prisma: PrismaService) { }

   private readonly geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

   private createSuccessResponse<T>(data: T, message?: string, statusCode: number = HttpStatus.OK): ApiResponse<T> {
      return {
         success: true,
         data,
         message: message || 'Operation successful',
         statusCode
      };
   }

   private createErrorResponse(message: string, error?: string, statusCode: number = HttpStatus.BAD_REQUEST): ApiResponse {
      return {
         success: false,
         message,
         error,
         statusCode
      };
   }

   private getGeminiApiKey() {
      const directKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GOOGLEAI_API_KEY;
      if (directKey) {
         return directKey;
      }

      const candidatePaths = [
         join(process.cwd(), '..', 'client', '.env'),
         join(process.cwd(), 'client', '.env'),
      ];

      const clientEnvPath = candidatePaths.find((path) => existsSync(path));
      if (!clientEnvPath) {
         return '';
      }

      const clientEnv = readFileSync(clientEnvPath, 'utf8');
      const matchedLine = clientEnv
         .split(/\r?\n/)
         .find((line) => line.startsWith('EXPO_PUBLIC_GOOGLEAI_API_KEY='));

      return matchedLine ? matchedLine.split('=').slice(1).join('=').trim() : '';
   }

   private extractJsonFromText(text: string) {
      const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fencedMatch) {
         return fencedMatch[1].trim();
      }

      const directMatch = text.match(/\{[\s\S]*\}/);
      if (directMatch) {
         return directMatch[0].trim();
      }

      return text.trim();
   }

   private normalizeJsonCandidate(input: string): string {
      return input
         .replace(/^\uFEFF/, '')
         .replace(/[\u201C\u201D]/g, '"')
         .replace(/[\u2018\u2019]/g, "'")
         .replace(/,\s*([}\]])/g, '$1')
         .trim();
   }

   private escapeLikelyInnerQuotes(input: string): string {
      let result = '';
      let inString = false;
      let escaped = false;

      const isLikelyStringTerminator = (source: string, index: number) => {
         let i = index + 1;
         while (i < source.length && /\s/.test(source[i])) {
            i += 1;
         }
         const next = source[i];
         return next === ',' || next === '}' || next === ']' || next === ':' || next === undefined;
      };

      for (let i = 0; i < input.length; i += 1) {
         const ch = input[i];

         if (inString && (ch === '\n' || ch === '\r')) {
            if (ch === '\r' && input[i + 1] === '\n') {
               i += 1;
            }
            result += '\\n';
            escaped = false;
            continue;
         }

         if (ch === '"' && !escaped) {
            if (!inString) {
               inString = true;
               result += ch;
               continue;
            }

            if (isLikelyStringTerminator(input, i)) {
               inString = false;
               result += ch;
               continue;
            }

            // Quote inside string value that should have been escaped.
            result += '\\"';
            continue;
         }

         result += ch;
         escaped = ch === '\\' && !escaped;
         if (ch !== '\\') {
            escaped = false;
         }
      }

      return result;
   }

   private repairMissingPropertyCommas(input: string): string {
      return input
         .replace(/("(?:(?:\\.|[^"\\])*)")\s*("[-\w]+"\s*:)/g, '$1,$2')
         .replace(/([}\]])\s*("[-\w]+"\s*:)/g, '$1,$2')
         .replace(/(true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*("[-\w]+"\s*:)/g, '$1,$2');
   }

   private parseGeminiJson(responseText: string): any {
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
         this.escapeLikelyInnerQuotes(this.normalizeJsonCandidate(extracted)),
         this.repairMissingPropertyCommas(this.normalizeJsonCandidate(extracted)),
         this.repairMissingPropertyCommas(this.escapeLikelyInnerQuotes(this.normalizeJsonCandidate(extracted))),
         braceSliced,
         this.normalizeJsonCandidate(braceSliced),
         this.escapeLikelyInnerQuotes(this.normalizeJsonCandidate(braceSliced)),
         this.repairMissingPropertyCommas(this.normalizeJsonCandidate(braceSliced)),
         this.repairMissingPropertyCommas(this.escapeLikelyInnerQuotes(this.normalizeJsonCandidate(braceSliced))),
      ];

      for (const candidate of candidates) {
         try {
            return JSON.parse(candidate);
         } catch {
            // Try next candidate.
         }
      }

      const normalized = this.normalizeJsonCandidate(extracted);
      const escapedQuotes = this.escapeLikelyInnerQuotes(normalized);
      const repaired = this.repairMissingPropertyCommas(escapedQuotes);
      return JSON.parse(repaired);
   }

   private getGeminiResponseText(payload: any): string {
      const parts = payload?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) {
         return '';
      }

      return parts
         .map((part) => (typeof part?.text === 'string' ? part.text : ''))
         .join('')
         .trim();
   }

   private buildBaseBusinessPlanPrompt(plan: BusinessPlan) {
      const today = new Date().toISOString().split('T')[0];

      return `
Return only valid JSON. Do not use markdown fences. Keep the response concise but useful.

Create a compact initial business plan for:
- Business name: ${plan.businessName}
- Idea: ${plan.idea}
- Location: ${plan.place}
- Unique tags: ${(plan.uniqueTags || []).join(', ')}

Requirements:
- Be practical and realistic.
- Keep items short.
- Use arrays with 2-4 items where sensible.
- Use strings for money values.
- Use YYYY-MM-DD for dates.
- This is an initial version, not a huge final document.

Return exactly this shape:
{
  "business_plan": {
    "metadata": {
      "business_name": "${plan.businessName}",
      "idea": "${plan.idea}",
      "location": "${plan.place}",
      "unique_tags": ${JSON.stringify(plan.uniqueTags || [])},
      "created_date": "${today}",
      "last_updated": "${today}",
      "version": "1.0.0"
    },
    "overview": {
      "executive_summary": {
        "business_concept": "string",
        "mission_statement": "string",
        "vision_statement": "string",
        "core_values": ["string"],
        "unique_selling_proposition": "string",
        "short_term_goals": {
          "months_1_3": ["string"],
          "months_4_6": ["string"],
          "months_7_12": ["string"]
        },
        "long_term_goals": {
          "year_1": ["string"],
          "year_2": ["string"],
          "year_3": ["string"],
          "year_4": ["string"],
          "year_5": ["string"]
        }
      },
      "swot_analysis": {
        "strengths": {
          "internal_advantages": ["string"],
          "competitive_edges": ["string"],
          "resources": ["string"],
          "capabilities": ["string"]
        },
        "weaknesses": {
          "internal_limitations": ["string"],
          "gaps": ["string"],
          "vulnerabilities": ["string"],
          "constraints": ["string"]
        },
        "opportunities": {
          "market_opportunities": ["string"],
          "technological_advancements": ["string"],
          "partnership_potentials": ["string"],
          "expansion_possibilities": ["string"]
        },
        "threats": {
          "market_threats": ["string"],
          "competitive_pressures": ["string"],
          "regulatory_risks": ["string"],
          "economic_factors": ["string"]
        }
      },
      "business_models": {
        "primary_model": {
          "name": "string",
          "description": "string",
          "revenue_streams": ["string"],
          "cost_structure": ["string"],
          "key_partners": ["string"]
        },
        "secondary_models": [
          {
            "name": "string",
            "description": "string",
            "implementation_timeline": "string"
          }
        ],
        "hybrid_approaches": ["string"]
      },
      "viability_analysis": {
        "market_viability": {
          "demand_assessment": "string",
          "competitive_landscape": "string",
          "market_entry_barriers": "string"
        },
        "financial_viability": {
          "startup_costs": "string",
          "break_even_analysis": "string",
          "profitability_timeline": "string"
        },
        "operational_viability": {
          "resource_availability": "string",
          "skill_requirements": "string",
          "infrastructure_needs": "string"
        },
        "risk_assessment": {
          "high_risks": ["string"],
          "medium_risks": ["string"],
          "low_risks": ["string"]
        }
      },
      "legal_compliance": {
        "business_registration": {
          "legal_structure": "string",
          "registration_number": "string",
          "tax_identification_number": "string"
        },
        "licenses_permits": [
          {
            "license_name": "string",
            "issuing_authority": "string",
            "renewal_date": "string",
            "cost": "string"
          }
        ],
        "tax_obligations": {
          "vat_registration": "string",
          "income_tax": "string",
          "payroll_taxes": "string",
          "tax_filing_schedule": "string"
        },
        "insurance_requirements": [
          {
            "insurance_type": "string",
            "coverage_amount": "string",
            "premium_cost": "string",
            "provider": "string"
          }
        ]
      }
    },
    "market_research": {
      "industry_analysis": {
        "industry_overview": "string",
        "key_industry_players": ["string"],
        "industry_trends": {
          "current_trends": ["string"],
          "emerging_trends": ["string"],
          "future_predictions": ["string"]
        },
        "regulatory_environment": "string",
        "technological_impact": "string"
      },
      "target_audience": {
        "psychographics": {
          "lifestyle_patterns": ["string"],
          "values_beliefs": ["string"],
          "interests_hobbies": ["string"],
          "personality_traits": ["string"],
          "buying_behavior": {
            "purchase_frequency": "string",
            "spending_habits": "string",
            "brand_loyalty": "string"
          }
        },
        "needs_analysis": {
          "functional_needs": ["string"],
          "emotional_needs": ["string"],
          "social_needs": ["string"],
          "unmet_needs": ["string"]
        },
        "pain_points": {
          "current_pain_points": ["string"],
          "anticipated_pain_points": ["string"]
        }
      },
      "competitor_analysis": {
        "direct_competitors": [
          {
            "name": "string",
            "market_share": "string",
            "strengths": ["string"],
            "weaknesses": ["string"],
            "pricing_strategy": "string",
            "target_audience": "string"
          }
        ],
        "indirect_competitors": [
          {
            "name": "string",
            "competitive_threat": "string",
            "market_overlap": "string"
          }
        ],
        "competitive_matrix": {
          "price_comparison": "string",
          "quality_comparison": "string",
          "service_comparison": "string"
        }
      }
    },
    "products_services": {
      "product_line": {
        "core_products": [
          {
            "product_id": "string",
            "name": "string",
            "description": "string",
            "features": ["string"],
            "benefits": ["string"],
            "target_customer": "string",
            "development_stage": "string",
            "launch_date": "string",
            "detailed_pricing": {
              "unit_cost": "string",
              "wholesale_price": "string",
              "retail_price": "string",
              "profit_margin_percentage": "string"
            }
          }
        ]
      },
      "service_offerings": {
        "core_services": [
          {
            "service_id": "string",
            "name": "string",
            "description": "string",
            "delivery_method": "string",
            "service_level": "string",
            "pricing_strategy": "string"
          }
        ]
      }
    },
    "sales_marketing": {
      "marketing_strategy": {
        "positioning_statement": "string",
        "value_proposition": "string"
      },
      "sales_strategy": {
        "sales_channels": {
          "direct_sales": "string",
          "online_sales": "string",
          "retail_partners": "string",
          "distribution_network": "string"
        }
      },
      "digital_marketing": {
        "social_media_plan": {
          "platform_strategies": {
            "facebook": "string",
            "instagram": "string",
            "twitter": "string",
            "linkedin": "string",
            "tiktok": "string"
          }
        }
      },
      "brand_development": {
        "brand_positioning": {
          "market_position": "string",
          "competitive_differentiation": "string",
          "target_perception": "string"
        }
      }
    },
    "financials": {
      "revenue_projections": {
        "pricing_strategy": {
          "price_points": ["string"],
          "discount_strategy": "string",
          "competitive_pricing": "string",
          "value_based_pricing": "string"
        }
      },
      "expense_breakdown": {
        "fixed_costs": {
          "rent": "string",
          "insurance": "string",
          "software_subscriptions": "string"
        },
        "variable_costs": {
          "materials": "string",
          "production": "string",
          "shipping": "string",
          "marketing": "string"
        }
      },
      "profit_loss_statement": {
        "key_metrics": {
          "gross_margin": "string",
          "operating_margin": "string",
          "net_margin": "string",
          "ebitda": "string"
        }
      },
      "cash_flow_analysis": {
        "operating_cash_flow": {
          "monthly_cash_in": "string",
          "monthly_cash_out": "string",
          "net_cash_flow": "string"
        }
      },
      "funding_requirements": {
        "startup_capital": {
          "amount_needed": "string"
        },
        "return_expectations": {
          "investor_roi": "string",
          "payback_period": "string"
        }
      },
      "contingency_fund": {
        "percentage_of_budget": "string",
        "specific_scenarios_covered": ["string"],
        "access_conditions": "string",
        "replenishment_strategy": "string"
      }
    },
    "operations": {
      "organizational_structure": {
        "management_team": [
          {
            "position": "string",
            "name": "string",
            "qualifications": "string",
            "responsibilities": ["string"],
            "experience": "string",
            "salary_details": {
              "base_salary": "string",
              "bonus_structure": "string",
              "benefits_package": "string"
            }
          }
        ],
        "staffing_plan": {
          "year_1_hires": ["string"],
          "year_2_hires": ["string"],
          "year_3_hires": ["string"]
        }
      },
      "facilities_equipment": {
        "location_analysis": {
          "site_selection": "string",
          "facility_requirements": "string",
          "expansion_potential": "string"
        },
        "equipment_list": [
          {
            "equipment_id": "string",
            "name": "string",
            "purpose": "string",
            "cost": "string",
            "maintenance_schedule": "string",
            "brand_model": "string"
          }
        ]
      },
      "supply_chain": {
        "supplier_details": {
          "backup_suppliers": ["string"],
          "quality_control_requirements": "string",
          "contract_terms": "string"
        }
      },
      "quality_control": {
        "quality_standards": ["string"],
        "inspection_procedures": ["string"]
      },
      "environmental_sustainability": {
        "waste_management_costs": "string",
        "energy_efficiency_investments": "string",
        "sustainability_certifications": ["string"],
        "environmental_compliance": "string"
      }
    },
    "risk_management": {
      "risk_identification": {
        "market_risks": ["string"],
        "financial_risks": ["string"],
        "operational_risks": ["string"],
        "compliance_risks": ["string"]
      },
      "risk_assessment": {
        "probability_analysis": "string",
        "impact_analysis": "string",
        "risk_prioritization": "string"
      },
      "mitigation_strategies": {
        "preventive_measures": ["string"],
        "contingency_plans": ["string"],
        "insurance_coverage": "string"
      },
      "monitoring_plan": {
        "key_risk_indicators": ["string"],
        "review_frequency": "string",
        "reporting_structure": "string"
      }
    },
    "implementation_timeline": {
      "pre_launch_phase": {
        "phase_duration": "string",
        "key_milestones": [
          {
            "milestone_id": "string",
            "name": "string",
            "description": "string",
            "due_date": "string",
            "dependencies": "string",
            "responsible_party": "string"
          }
        ],
        "critical_path": "string",
        "resource_allocation": "string"
      },
      "launch_phase": {
        "launch_date": "string",
        "launch_activities": ["string"],
        "post_launch_support": "string",
        "performance_monitoring": "string"
      },
      "growth_phase": {
        "expansion_timeline": "string",
        "market_penetration": "string",
        "scaling_strategy": "string"
      },
      "five_year_roadmap": {
        "annual_goals": {
          "year_1": ["string"],
          "year_2": ["string"],
          "year_3": ["string"],
          "year_4": ["string"],
          "year_5": ["string"]
        },
        "success_metrics": {
          "financial_metrics": ["string"],
          "operational_metrics": ["string"],
          "customer_metrics": ["string"]
        }
      }
    }
  }
}`;
   }

   private buildSectionExpansionPrompt(plan: BusinessPlan, currentBusinessPlan: any, sections: string[]) {
      const today = new Date().toISOString().split('T')[0];

      return `
Return only valid JSON. Do not use markdown fences.

Expand or regenerate only these top-level business plan sections: ${sections.join(', ')}.

Business context:
- Business name: ${plan.businessName}
- Idea: ${plan.idea}
- Location: ${plan.place}
- Unique tags: ${(plan.uniqueTags || []).join(', ')}

Current plan summary:
${JSON.stringify({
         metadata: currentBusinessPlan?.metadata || null,
         availableSections: Object.keys(currentBusinessPlan || {}).filter((key) => key !== 'presentation'),
      })}

Return JSON in this shape:
{
  "business_plan": {
    "metadata": {
      "business_name": "${plan.businessName}",
      "idea": "${plan.idea}",
      "location": "${plan.place}",
      "unique_tags": ${JSON.stringify(plan.uniqueTags || [])},
      "last_updated": "${today}",
      "version": "1.0.0"
    },
    ${sections.map((section) => `"${section}": {}`).join(',\n    ')}
  }
}

Only include metadata plus the requested top-level sections.
`;
   }

   private async generateBusinessPlanContent(plan: BusinessPlan, currentBusinessPlan: any, options?: GenerateBusinessPlanDto) {
      const apiKey = this.getGeminiApiKey();
      if (!apiKey) {
         const error = new Error('Missing GEMINI_API_KEY');
         (error as Error & { statusCode?: number }).statusCode = HttpStatus.BAD_REQUEST;
         throw error;
      }

      const sections = options?.sections?.filter(Boolean) || [];
      const prompt =
         sections.length > 0
            ? this.buildSectionExpansionPrompt(plan, currentBusinessPlan, sections)
            : this.buildBaseBusinessPlanPrompt(plan);

      const response = await fetch(
         `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${apiKey}`,
         {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               contents: [
                  {
                     parts: [{ text: prompt }],
                  },
               ],
               generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.2,
                  maxOutputTokens: 8192,
               },
            }),
         },
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
         const error = new Error(JSON.stringify(payload || { status: response.status }));
         (error as Error & { statusCode?: number }).statusCode = response.status;
         throw error;
      }

      const responseText = this.getGeminiResponseText(payload);
      if (!responseText) {
         const error = new Error('Gemini returned an empty response');
         (error as Error & { statusCode?: number }).statusCode = HttpStatus.BAD_GATEWAY;
         throw error;
      }

      return this.parseGeminiJson(responseText);
   }

   private chunkSections(sections: string[], chunkSize: number): string[][] {
      const chunks: string[][] = [];
      for (let i = 0; i < sections.length; i += chunkSize) {
         chunks.push(sections.slice(i, i + chunkSize));
      }
      return chunks;
   }

   private getDefaultTopLevelSections(): string[] {
      return [
         'overview',
         'market_research',
         'products_services',
         'sales_marketing',
         'financials',
         'operations',
         'risk_management',
         'implementation_timeline',
      ];
   }

   private async generateBusinessPlanInChunks(
      plan: BusinessPlan,
      currentBusinessPlan: any,
      options?: GenerateBusinessPlanDto,
   ) {
      const requestedSections = options?.sections?.filter(Boolean) || [];
      const sectionsToGenerate =
         requestedSections.length > 0 ? requestedSections : this.getDefaultTopLevelSections();
      const sectionGroups = this.chunkSections(sectionsToGenerate, 2);

      let mergedBusinessPlan = options?.overwrite ? {} : (currentBusinessPlan || {});

      for (const sections of sectionGroups) {
         const generatedPayload = await this.generateBusinessPlanContent(plan, mergedBusinessPlan, {
            ...options,
            sections,
            overwrite: false,
         });

         mergedBusinessPlan = this.mergeGeneratedBusinessPlan(
            plan,
            generatedPayload,
            mergedBusinessPlan,
            { ...options, overwrite: false },
         );
      }

      return { business_plan: mergedBusinessPlan };
   }

   private mergeGeneratedBusinessPlan(
      plan: BusinessPlan,
      generatedPayload: any,
      currentBusinessPlan: any,
      options?: GenerateBusinessPlanDto,
   ) {
      const today = new Date().toISOString().split('T')[0];
      const generatedBusinessPlan = generatedPayload?.business_plan ?? generatedPayload ?? {};
      const overwrite = options?.overwrite || !currentBusinessPlan;

      const mergedBusinessPlan = overwrite
         ? generatedBusinessPlan
         : {
            ...currentBusinessPlan,
            ...generatedBusinessPlan,
         };

      return {
         ...mergedBusinessPlan,
         metadata: {
            ...(currentBusinessPlan?.metadata || {}),
            ...(generatedBusinessPlan?.metadata || {}),
            business_name: plan.businessName,
            idea: plan.idea,
            location: plan.place,
            unique_tags: plan.uniqueTags || [],
            created_date: currentBusinessPlan?.metadata?.created_date || today,
            last_updated: today,
            version: generatedBusinessPlan?.metadata?.version || currentBusinessPlan?.metadata?.version || '1.0.0',
         },
      };
   }

   async create(userId: string, planData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const result = await this.prisma.businessPlan.create({
            data: {
               ...planData,
               userId,
            },
         });

         return this.createSuccessResponse(result, 'Business plan created successfully', HttpStatus.CREATED);
      } catch (error) {
         return this.createErrorResponse(
            'Failed to create business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async findAll(userId: string): Promise<ApiResponse<BusinessPlan[]>> {
      try {
         const result = await this.prisma.businessPlan.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
         });

         return this.createSuccessResponse(result, 'Business plans retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to retrieve business plans',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async findOne(id: string, userId?: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const where: any = { id };

         if (userId) {
            where.userId = userId;
         }

         const plan = await this.prisma.businessPlan.findUnique({
            where,
         });

         if (!plan) {
            return this.createErrorResponse(
               'Business plan not found',
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         return this.createSuccessResponse(plan, 'Business plan retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to retrieve business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async update(id: string, userId: string, updateData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               ...updateData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Business plan updated successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to update business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async remove(id: string, userId: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const result = await this.prisma.businessPlan.delete({
            where: { id },
         });

         return this.createSuccessResponse(result, 'Business plan deleted successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to delete business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async setActive(userId: string, planId: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(planId, userId);
         if (!findResult.success) {
            return findResult;
         }

         await this.prisma.user.update({
            where: { id: userId },
            data: { activeBusinessPlanId: planId },
         });

         return this.createSuccessResponse(findResult.data!, 'Business plan set as active');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to set active business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async getActive(userId: string): Promise<ApiResponse<BusinessPlan | null>> {
      try {
         const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { activeBusinessPlanId: true },
         });

         if (!user?.activeBusinessPlanId) {
            return this.createSuccessResponse(null, 'No active business plan');
         }

         return await this.findOne(user.activeBusinessPlanId, userId);
      } catch (error) {
         return this.createErrorResponse(
            'Failed to get active business plan',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async addFinancialData(planId: string, userId: string, financialData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(planId, userId);
         if (!findResult.success) {
            return findResult;
         }

         const updatedFinancialData = { ...financialData };
         if (financialData.revenue !== undefined && financialData.expenses !== undefined) {
            updatedFinancialData.profit = financialData.revenue - financialData.expenses;
         }

         const result = await this.prisma.businessPlan.update({
            where: { id: planId },
            data: { financialData: updatedFinancialData },
         });

         return this.createSuccessResponse(result, 'Financial data added successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to add financial data',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async generateBusinessPlan(id: string, userId: string, options?: GenerateBusinessPlanDto): Promise<ApiResponse<any>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const plan = findResult.data!;
         const currentAdditionalData =
            plan.additionalData && typeof plan.additionalData === 'object' ? (plan.additionalData as Record<string, any>) : {};
         const currentBusinessPlan = currentAdditionalData.business_plan || null;

         const generatedPayload = await this.generateBusinessPlanInChunks(plan, currentBusinessPlan, options);
         const mergedBusinessPlan = generatedPayload.business_plan;

         await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: {
                  ...currentAdditionalData,
                  business_plan: mergedBusinessPlan,
               },
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(
            { business_plan: mergedBusinessPlan },
            'Business plan content generated successfully',
         );
      } catch (error) {
         const statusCode = (error as Error & { statusCode?: number })?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
         return this.createErrorResponse(
            'Failed to generate business plan content',
            error.message,
            statusCode,
         );
      }
   }

   async search(userId: string, searchTerm: string): Promise<ApiResponse<BusinessPlan[]>> {
      try {
         const result = await this.prisma.businessPlan.findMany({
            where: {
               userId,
               OR: [
                  { businessName: { contains: searchTerm, mode: 'insensitive' } },
                  { place: { contains: searchTerm, mode: 'insensitive' } },
                  { idea: { contains: searchTerm, mode: 'insensitive' } },
               ],
            },
         });

         return this.createSuccessResponse(result, 'Search results retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to search business plans',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async getStats(userId: string): Promise<ApiResponse<any>> {
      try {
         const totalPlans = await this.prisma.businessPlan.count({
            where: { userId },
         });


         const recentPlans = await this.prisma.businessPlan.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
         });

         const stats = {
            totalPlans,
            recentPlans,
         };

         return this.createSuccessResponse(stats, 'Statistics retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to get statistics',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async getAdditionalData(id: string, userId: string): Promise<ApiResponse<any>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const additionalData = findResult.data!.additionalData || {};
         return this.createSuccessResponse(additionalData, 'Additional data retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to get additional data',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async updateAdditionalData(id: string, userId: string, additionalData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data updated successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to update additional data',
            error.message,
            HttpStatus.NOT_FOUND
         );
      }
   }

   async patchAdditionalData(id: string, userId: string, additionalData: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const plan = findResult.data!;
         const currentData = plan.additionalData;

         let mergedData: any;

         if (!currentData) {
            mergedData = additionalData;
         } else if (typeof currentData === 'object' && currentData !== null) {
            mergedData = {
               ...(currentData as object),
               ...additionalData,
            };
         } else {
            mergedData = additionalData;
         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: mergedData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data patched successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to patch additional data',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async removeAdditionalDataKey(id: string, userId: string, key: string): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const plan = findResult.data!;
         const currentData = plan.additionalData;

         if (!currentData || typeof currentData !== 'object' || currentData === null) {
            return this.createErrorResponse(
               `Key "${key}" not found in additional data`,
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         const dataObject = currentData as Record<string, any>;

         if (dataObject[key] === undefined) {
            return this.createErrorResponse(
               `Key "${key}" not found in additional data`,
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         const { [key]: removed, ...updatedData } = dataObject;

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: updatedData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data key removed successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to remove additional data key',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async addAdditionalDataKey(id: string, userId: string, key: string, value: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const plan = findResult.data!;
         const currentData = plan.additionalData;

         let updatedData: any;

         if (!currentData || typeof currentData !== 'object' || currentData === null) {
            updatedData = { [key]: value };
         } else {
            const dataObject = currentData as Record<string, any>;

            if (dataObject[key] !== undefined) {
               return this.createErrorResponse(
                  `Key "${key}" already exists in additional data`,
                  'DUPLICATE_KEY',
                  HttpStatus.BAD_REQUEST
               );
            }

            updatedData = {
               ...dataObject,
               [key]: value,
            };

         }

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: updatedData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data key added successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to add additional data key',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async updateAdditionalDataKey(id: string, userId: string, key: string, value: any): Promise<ApiResponse<BusinessPlan>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return findResult;
         }

         const plan = findResult.data!;
         const currentData = plan.additionalData;

         if (!currentData || typeof currentData !== 'object' || currentData === null) {
            return this.createErrorResponse(
               `Key "${key}" not found in additional data`,
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         const dataObject = currentData as Record<string, any>;

         if (dataObject[key] === undefined) {
            return this.createErrorResponse(
               `Key "${key}" not found in additional data`,
               'NOT_FOUND',
               HttpStatus.NOT_FOUND
            );
         }

         const updatedData = {
            ...dataObject,
            [key]: value,
         };

         const result = await this.prisma.businessPlan.update({
            where: { id },
            data: {
               additionalData: updatedData,
               updatedAt: new Date(),
            },
         });

         return this.createSuccessResponse(result, 'Additional data key updated successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to update additional data key',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }

   async getAdditionalDataKeys(id: string, userId: string): Promise<ApiResponse<string[]>> {
      try {
         const findResult = await this.findOne(id, userId);
         if (!findResult.success) {
            return {
               success: false,
               message: findResult.message,
               error: findResult.error,
               statusCode: findResult.statusCode
            } as ApiResponse<string[]>;
         }

         const plan = findResult.data!;
         const data = plan.additionalData;

         if (!data || typeof data !== 'object' || data === null) {
            return this.createSuccessResponse([], 'Additional data keys retrieved successfully');
         }

         const keys = Object.keys(data as object);
         return this.createSuccessResponse(keys, 'Additional data keys retrieved successfully');
      } catch (error) {
         return this.createErrorResponse(
            'Failed to get additional data keys',
            error.message,
            HttpStatus.INTERNAL_SERVER_ERROR
         );
      }
   }
}

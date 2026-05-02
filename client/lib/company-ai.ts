import { generateJson } from "./gemini";
import { CompanyFinancialDataDto } from "@/types/company.types";

type CompanyDraft = {
  businessName: string;
  idea: string;
  place: string;
  uniqueTags: string[];
  financialData?: CompanyFinancialDataDto;
};

function normalizeDraft(input: Partial<CompanyDraft>): CompanyDraft {
  return {
    businessName: (input.businessName ?? "").trim(),
    idea: (input.idea ?? "").trim(),
    place: (input.place ?? "").trim(),
    uniqueTags: Array.isArray(input.uniqueTags)
      ? input.uniqueTags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8)
      : [],
    financialData: input.financialData,
  };
}

export async function generateCompanyDraft(prompt: string, current?: Partial<CompanyDraft>) {
  const result = await generateJson<CompanyDraft>(`
You are helping prepare company creation fields for a business planning app.
Return JSON only with this shape:
{
  "businessName": "string",
  "idea": "string",
  "place": "string",
  "uniqueTags": ["string"],
  "financialData": {
    "startupCost": number,
    "monthlyRevenue": number,
    "monthlyCost": number,
    "fundingNeeded": number
  }
}

Rules:
- Keep "idea" concise but specific, 1-3 sentences.
- "uniqueTags" should be 3-6 short tags.
- If exact location is unknown, infer a sensible one or use "Remote".
- Use realistic rough estimates for financialData.
- Preserve any useful details from the current draft below when they fit.

Current draft:
${JSON.stringify(current ?? {}, null, 2)}

User prompt:
${prompt}
  `);

  return normalizeDraft(result);
}

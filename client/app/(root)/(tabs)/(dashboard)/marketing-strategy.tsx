import ToolWorkspaceScreen from "@/components/tools/ToolWorkspaceScreen";

export default function MarketingStrategyScreen() {
  return (
    <ToolWorkspaceScreen
      type="marketing-strategy"
      eyebrow="Planning tool"
      title="Marketing strategy"
      description="Generate a practical marketing strategy for your active company and save the result into documents."
      promptLabel="What should this strategy focus on?"
      promptPlaceholder="Describe your target market, goal, budget, launch phase, or the campaign angle you want..."
      suggestions={[
        "Create a 90-day launch marketing strategy for my business.",
        "Build a local growth strategy for Yerevan customers.",
        "Give me a social-first marketing strategy with low budget actions.",
      ]}
      buildPrompt={({ company, userPrompt }) => `
You are a senior marketing strategist.

Create a clear, detailed marketing strategy document.

Company context:
- Business name: ${company?.businessName ?? "Unknown"}
- Idea: ${company?.idea ?? "Not provided"}
- Location: ${company?.place ?? "Not provided"}
- Tags: ${company?.uniqueTags?.join(", ") || "None"}

User request:
${userPrompt}

Requirements:
- Write in clear business English.
- Use clean section titles without Markdown symbols.
- Include target audience, positioning, channels, content plan, offers, KPIs, and a 30/60/90 day action plan.
- Keep it practical and implementation-ready.
- Do not use **, ---, or Markdown heading symbols.
`}
    />
  );
}


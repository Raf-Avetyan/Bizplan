import ToolWorkspaceScreen from "@/components/tools/ToolWorkspaceScreen";

export default function ProductSalesSheetScreen() {
  return (
    <ToolWorkspaceScreen
      type="product-sales-sheet"
      eyebrow="Create content"
      title="Product sales sheet"
      description="Generate a sales-oriented product sheet with key benefits, positioning, objections, and talking points."
      promptLabel="What product or offer should this sheet cover?"
      promptPlaceholder="Describe the product, its audience, differentiators, pricing context, or the offer you need to present..."
      suggestions={[
        "Create a one-page sales sheet for my main offer.",
        "Make a product sheet focused on B2B buyers.",
        "Write a premium positioning sales sheet with objection handling.",
      ]}
      buildPrompt={({ company, userPrompt }) => `
You are a B2B sales enablement writer.

Create a product sales sheet for this company:
- Business name: ${company?.businessName ?? "Unknown"}
- Idea: ${company?.idea ?? "Not provided"}
- Location: ${company?.place ?? "Not provided"}
- Tags: ${company?.uniqueTags?.join(", ") || "None"}

User request:
${userPrompt}

Requirements:
- Use strong headings.
- Include: overview, key benefits, target customer, differentiators, proof points, objections and responses, CTA.
- Make it practical for sales conversations and leave it polished enough for a document.
`}
    />
  );
}


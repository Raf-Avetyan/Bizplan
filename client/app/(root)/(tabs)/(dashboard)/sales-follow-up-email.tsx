import ToolWorkspaceScreen from "@/components/tools/ToolWorkspaceScreen";

export default function SalesFollowUpEmailScreen() {
  return (
    <ToolWorkspaceScreen
      type="sales-follow-up-email"
      eyebrow="Create content"
      title="Sales follow-up email"
      description="Generate strong follow-up emails for leads, buyers, partners, or investors and keep the best versions saved."
      promptLabel="What follow-up should this email handle?"
      promptPlaceholder="Describe who you are following up with, the previous conversation, and the goal of this email..."
      suggestions={[
        "Write a warm follow-up email after a discovery call.",
        "Create a concise sales follow-up for a silent lead.",
        "Write a partnership follow-up email with a clear CTA.",
      ]}
      buildPrompt={({ company, userPrompt }) => `
You are a sales email writer.

Create a follow-up email package for this company:
- Business name: ${company?.businessName ?? "Unknown"}
- Idea: ${company?.idea ?? "Not provided"}
- Location: ${company?.place ?? "Not provided"}
- Tags: ${company?.uniqueTags?.join(", ") || "None"}

User request:
${userPrompt}

Requirements:
- Provide 3 email variations.
- For each, include a subject line and the email body.
- Keep it persuasive, professional, and easy to send.
- Add a note on which version is best for conversion and why.
`}
    />
  );
}


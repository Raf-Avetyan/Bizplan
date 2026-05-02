import ToolWorkspaceScreen from "@/components/tools/ToolWorkspaceScreen";

export default function FacebookPostScreen() {
  return (
    <ToolWorkspaceScreen
      type="facebook-post"
      eyebrow="Create content"
      title="Facebook post"
      description="Generate Facebook-ready post copy for your active company and save the best versions for reuse."
      promptLabel="What kind of post do you want?"
      promptPlaceholder="Describe the offer, update, product, campaign, or event you want to post about..."
      suggestions={[
        "Write a launch announcement for my business.",
        "Create a Facebook promo post for a limited-time offer.",
        "Write a community-focused post that invites comments.",
      ]}
      buildPrompt={({ company, userPrompt }) => `
You are a social media copywriter.

Create a Facebook post package for this company:
- Business name: ${company?.businessName ?? "Unknown"}
- Idea: ${company?.idea ?? "Not provided"}
- Location: ${company?.place ?? "Not provided"}
- Tags: ${company?.uniqueTags?.join(", ") || "None"}

User request:
${userPrompt}

Requirements:
- Return ONLY valid JSON. Do not use Markdown, **, ---, headings, or commentary.
- Create one polished Facebook post, not multiple variations.
- Keep the post concise: 55-110 words.
- Avoid hashtags unless they are very useful; maximum 3 hashtags.
- Include a strong hook, useful body, and clear CTA inside the caption.
- Include a visualPrompt describing the image/creative that should appear in the post preview.

JSON shape:
{
  "authorName": "company/page name",
  "handle": "pagehandle",
  "caption": "final Facebook post copy",
  "hashtags": ["#optional"],
  "cta": "short next action",
  "visualPrompt": "clear image/creative direction for the post preview",
  "altText": "short accessible image description"
}
`}
    />
  );
}


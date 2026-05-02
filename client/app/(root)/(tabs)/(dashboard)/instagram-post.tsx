import ToolWorkspaceScreen from "@/components/tools/ToolWorkspaceScreen";

export default function InstagramPostScreen() {
  return (
    <ToolWorkspaceScreen
      type="instagram-post"
      eyebrow="Create content"
      title="Instagram post"
      description="Generate Instagram captions, hooks, and hashtag-ready content for your active company."
      promptLabel="What should the Instagram post promote?"
      promptPlaceholder="Describe the product, mood, visual angle, launch, or campaign message you want..."
      suggestions={[
        "Create an Instagram launch caption for my company.",
        "Write a polished post for a behind-the-scenes business story.",
        "Make a high-conversion caption for a product spotlight.",
      ]}
      buildPrompt={({ company, userPrompt }) => `
You are an Instagram content strategist.

Create an Instagram content package for this company:
- Business name: ${company?.businessName ?? "Unknown"}
- Idea: ${company?.idea ?? "Not provided"}
- Location: ${company?.place ?? "Not provided"}
- Tags: ${company?.uniqueTags?.join(", ") || "None"}

User request:
${userPrompt}

Requirements:
- Return ONLY valid JSON. Do not use Markdown, **, ---, headings, or commentary.
- Create one polished Instagram post, not multiple variations.
- Keep the caption concise: 45-95 words.
- Include a scroll-stopping first sentence, useful body, and clear CTA inside the caption.
- Include 5-8 relevant hashtags in the hashtags array.
- Include a visualPrompt describing the image/creative that should appear in the post preview.

JSON shape:
{
  "authorName": "company/profile name",
  "handle": "profilehandle",
  "caption": "final Instagram caption",
  "hashtags": ["#example"],
  "cta": "short next action",
  "visualPrompt": "clear image/creative direction for the post preview",
  "altText": "short accessible image description"
}
`}
    />
  );
}


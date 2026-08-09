import { OpenRouter } from "@openrouter/sdk";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4";

function getOpenRouterClient(): OpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to .env locally, or as a Zerops project environment variable."
    );
  }
  return new OpenRouter({
    apiKey,
    appTitle: "The Roast Room",
  });
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((part: { type?: string; text?: string }) => {
      if (typeof part === "string") {
        return part;
      }
      if (part?.type === "text" && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join("")
    .trim();
}

export async function callClaude(
  system: string,
  messages: ChatMessage[],
  maxTokens = 300
): Promise<string> {
  const client = getOpenRouterClient();
  const completion = await client.chat.send({
    chatRequest: {
      model: MODEL,
      maxTokens,
      messages: [{ role: "system", content: system }, ...messages],
    },
  });
  if (!("choices" in completion)) {
    throw new Error("Unexpected streaming response from OpenRouter");
  }
  return extractTextContent(completion.choices[0]?.message?.content);
}

/** Strip ```json fences if the model wraps its JSON response in them anyway. */
export function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

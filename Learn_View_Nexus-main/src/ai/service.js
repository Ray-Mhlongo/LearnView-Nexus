import { buildRelevantContext, SYSTEM_PROMPT } from "./context.js";

const AI_SERVICE_URL = "https://learnview-ai.infolearnview.workers.dev";
const AI_SERVICE_MODELS = ["auto"];

export function getAiSettings() {
  return {
    hasService: true,
    serviceUrl: AI_SERVICE_URL,
    model: "Automatic"
  };
}

export function saveAiSettings() {
  return true;
}

export function clearAiKey() {
  return true;
}

async function callAiService(messages, model) {
  const response = await fetch(AI_SERVICE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages
    })
  });

  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.details?.error?.message ||
      data?.details?.message ||
      `AI service request failed with status ${response.status}.`
    );
  }

  return data;
}

export async function askLearnViewAi(question) {
  const context = buildRelevantContext(question);

  if (!context.hasData) {
    throw new Error("No relevant LearnView data is available for that question.");
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        `Tutor question: ${question}`,
        "Use only the structured LearnView data below. If the answer cannot be found in this data, say what is unavailable.",
        JSON.stringify(context, null, 2)
      ].join("\n\n")
    }
  ];

  let lastError = null;

  for (const model of AI_SERVICE_MODELS) {
    try {
      const data = await callAiService(messages, model);
      const answer = data.choices?.[0]?.message?.content?.trim();

      if (answer) {
        return { answer, context, modelUsed: model };
      }

      lastError = new Error("LearnView AI did not return a response.");
    } catch (error) {
      lastError = error;
    }
  }

  console.error("LearnView AI service failed:", lastError);

  throw new Error("LearnView AI is currently unavailable. Please try again later.");
}

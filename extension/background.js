const DEFAULT_SETTINGS = {
  apiBaseUrl: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  model: "gpt-4o-mini",
  categories: [
    "Animals",
    "Architecture",
    "Business",
    "Food",
    "Nature",
    "People",
    "Technology",
    "Travel"
  ].join("\n")
};

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => resolve(items));
  });
}

function buildPrompt({ filename, existingTitle, existingCategory, categories }) {
  const categoryList = categories
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(", ");

  return [
    "You are helping fill metadata for Adobe Stock uploads.",
    "Given a filename and optional hints, produce a concise, descriptive title and pick exactly one category from the list.",
    "Return JSON only: {\"title\": string, \"category\": string}.",
    "",
    `Filename: ${filename || "(unknown)"}`,
    existingTitle ? `Existing title: ${existingTitle}` : "",
    existingCategory ? `Existing category: ${existingCategory}` : "",
    "",
    `Categories: ${categoryList}`
  ]
    .filter(Boolean)
    .join("\n");
}

async function callAiApi(payload, settings) {
  const response = await fetch(settings.apiBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        {
          role: "system",
          content: "You are a metadata assistant for stock media."
        },
        {
          role: "user",
          content: buildPrompt({
            filename: payload.filename,
            existingTitle: payload.existingTitle,
            existingCategory: payload.existingCategory,
            categories: settings.categories
          })
        }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response.");
  }

  return JSON.parse(content);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "generateMetadata") {
    return false;
  }

  (async () => {
    try {
      const settings = await loadSettings();
      if (!settings.apiKey) {
        throw new Error("API key is missing. Open extension options to configure it.");
      }

      const result = await callAiApi(message.payload, settings);
      sendResponse({ ok: true, result });
    } catch (error) {
      sendResponse({ ok: false, error: error.message });
    }
  })();

  return true;
});

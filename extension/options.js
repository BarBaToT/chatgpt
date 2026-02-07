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

function restoreSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    document.getElementById("apiBaseUrl").value = items.apiBaseUrl;
    document.getElementById("apiKey").value = items.apiKey;
    document.getElementById("model").value = items.model;
    document.getElementById("categories").value = items.categories;
  });
}

function saveSettings() {
  const apiBaseUrl = document.getElementById("apiBaseUrl").value.trim();
  const apiKey = document.getElementById("apiKey").value.trim();
  const model = document.getElementById("model").value.trim();
  const categories = document.getElementById("categories").value.trim();

  chrome.storage.sync.set(
    {
      apiBaseUrl: apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl,
      apiKey,
      model: model || DEFAULT_SETTINGS.model,
      categories: categories || DEFAULT_SETTINGS.categories
    },
    () => {
      const status = document.getElementById("status");
      status.textContent = "Settings saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 2000);
    }
  );
}

document.getElementById("save").addEventListener("click", saveSettings);

document.addEventListener("DOMContentLoaded", restoreSettings);

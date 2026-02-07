const BUTTON_ID = "adobe-stock-ai-autofill";
const STATUS_ID = "adobe-stock-ai-status";

function createButton() {
  if (document.getElementById(BUTTON_ID)) {
    return;
  }

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.textContent = "AI Autofill";
  button.style.cssText = [
    "position: fixed",
    "bottom: 24px",
    "right: 24px",
    "z-index: 9999",
    "padding: 12px 16px",
    "border-radius: 999px",
    "border: none",
    "background: #ff7a18",
    "color: #fff",
    "font-weight: 600",
    "cursor: pointer",
    "box-shadow: 0 6px 18px rgba(0,0,0,0.2)"
  ].join(";");

  button.addEventListener("click", handleAutofill);
  document.body.appendChild(button);

  const status = document.createElement("div");
  status.id = STATUS_ID;
  status.style.cssText = [
    "position: fixed",
    "bottom: 84px",
    "right: 24px",
    "z-index: 9999",
    "background: #1f2937",
    "color: #fff",
    "padding: 8px 12px",
    "border-radius: 8px",
    "font-size: 12px",
    "display: none"
  ].join(";");
  document.body.appendChild(status);
}

function setStatus(message, isVisible = true) {
  const status = document.getElementById(STATUS_ID);
  if (!status) {
    return;
  }
  status.textContent = message;
  status.style.display = isVisible ? "block" : "none";
}

function getAssetContainers() {
  const selectors = [
    "[data-asset-id]",
    ".asset-item",
    ".upload-item",
    ".file-card"
  ];
  const elements = selectors.flatMap((selector) =>
    Array.from(document.querySelectorAll(selector))
  );
  return Array.from(new Set(elements));
}

function extractFilename(container) {
  const filenameSelectors = [
    "[data-filename]",
    ".filename",
    ".file-name",
    "[title]",
    "img[alt]"
  ];
  for (const selector of filenameSelectors) {
    const element = container.querySelector(selector);
    if (!element) {
      continue;
    }
    const name =
      element.getAttribute("data-filename") ||
      element.getAttribute("title") ||
      element.getAttribute("alt") ||
      element.textContent;
    if (name && name.trim()) {
      return name.trim();
    }
  }
  return "";
}

function findTitleInput(container) {
  const inputs = Array.from(container.querySelectorAll("input, textarea"));
  return (
    inputs.find((input) =>
      /title/i.test(input.getAttribute("name") || "")
    ) ||
    inputs.find((input) =>
      /title/i.test(input.getAttribute("placeholder") || "")
    ) ||
    inputs.find((input) => /title/i.test(input.getAttribute("aria-label") || ""))
  );
}

function findCategoryInput(container) {
  const inputs = Array.from(container.querySelectorAll("select, input"));
  return (
    inputs.find((input) =>
      /category/i.test(input.getAttribute("name") || "")
    ) ||
    inputs.find((input) =>
      /category/i.test(input.getAttribute("aria-label") || "")
    ) ||
    inputs.find((input) =>
      /category/i.test(input.getAttribute("placeholder") || "")
    )
  );
}

function setInputValue(input, value) {
  if (!input || !value) {
    return;
  }
  input.focus();
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.blur();
}

function setCategory(input, category) {
  if (!input || !category) {
    return;
  }
  if (input.tagName === "SELECT") {
    const option = Array.from(input.options).find((opt) =>
      opt.textContent.toLowerCase().includes(category.toLowerCase())
    );
    if (option) {
      input.value = option.value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return;
  }

  setInputValue(input, category);
}

async function requestMetadata(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "generateMetadata", payload },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "Unknown error"));
          return;
        }
        resolve(response.result);
      }
    );
  });
}

async function handleAutofill() {
  const containers = getAssetContainers();
  if (!containers.length) {
    setStatus("No assets found on this page.");
    setTimeout(() => setStatus("", false), 3000);
    return;
  }

  let processed = 0;
  setStatus(`Processing ${containers.length} assets...`);

  for (const container of containers) {
    const titleInput = findTitleInput(container);
    const categoryInput = findCategoryInput(container);
    if (!titleInput && !categoryInput) {
      continue;
    }

    const filename = extractFilename(container);
    const existingTitle = titleInput?.value?.trim() || "";
    const existingCategory = categoryInput?.value?.trim() || "";

    try {
      const result = await requestMetadata({
        filename,
        existingTitle,
        existingCategory
      });
      if (titleInput && !existingTitle) {
        setInputValue(titleInput, result.title);
      }
      if (categoryInput && !existingCategory) {
        setCategory(categoryInput, result.category);
      }
      processed += 1;
      setStatus(`Processed ${processed}/${containers.length} assets...`);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error("AI autofill error", error);
      break;
    }
  }

  setStatus(`Done. Updated ${processed} assets.`);
  setTimeout(() => setStatus("", false), 4000);
}

createButton();

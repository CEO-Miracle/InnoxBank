// i18n.js
(async () => {
  const LANG_DIR = "./languages/";
  const DEFAULT_LANG = "en";

  const LANGUAGES = [
    ["en", "English"],
    ["zh-hk", "Hong Kong"],
    ["zh", "China"],
    ["ms", "Malaysia"],
    ["ja", "Japan"],
    ["it", "Italy"],
    ["es", "Spain"],
    ["pt", "Brazil"],
    ["fr", "France"],
    ["ko", "Korea"],
    ["hi", "Hindi (India)"],
    ["ig", "Igbo"],
    ["fil", "Filipino"],
    ["th", "Thailand"],
    ["vi", "Vietnamese"],
    ["ar", "Arabic"],
    ["ru", "Russian"],
    ["de", "German"],
    ["tr", "Turkish"],
    ["bn", "Bengali"],
    ["sw", "Swahili"],
    ["yo", "Yoruba"],
  ];

  const langButton = document.getElementById("langButton");
  const langButtonLabel = document.getElementById("langButtonLabel");
  const langPanel = document.getElementById("langPanel");
  const languageList = document.getElementById("languageList");
  const languageSearch = document.getElementById("languageSearch");

  if (!langButton || !langPanel || !languageList) return;

  function renderLanguageList(filter = "") {
    const q = filter.trim().toLowerCase();
    languageList.innerHTML = "";
    LANGUAGES.forEach(([code, name]) => {
      if (q && !name.toLowerCase().includes(q) && !code.includes(q)) return;
      const li = document.createElement("li");
      li.dataset.lang = code;
      li.tabIndex = 0;
      li.setAttribute("role", "option");
      li.textContent = name;
      li.addEventListener("click", () => selectLanguage(code));
      languageList.appendChild(li);
    });
  }
  renderLanguageList();

  langButton.addEventListener("click", () => {
    langPanel.classList.toggle("open");
    const isOpen = langPanel.classList.contains("open");
    langPanel.setAttribute("aria-hidden", !isOpen);
    langButton.setAttribute("aria-expanded", isOpen);
    if (isOpen) languageSearch.focus();
  });

  languageSearch.addEventListener("input", () => {
    renderLanguageList(languageSearch.value);
  });

  document.addEventListener("click", (e) => {
    if (!langPanel.contains(e.target) && e.target !== langButton) {
      langPanel.classList.remove("open");
    }
  });

  // Apply translations
  function applyTranslations(dict) {
    window._innoxDict = dict; // Save globally for t()
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = el.dataset.i18n.split(".").reduce((o, k) => o?.[k], dict);
      if (val) el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const val = el.dataset.i18nPlaceholder
        .split(".")
        .reduce((o, k) => o?.[k], dict);
      if (val) el.placeholder = val;
    });
    document.querySelectorAll("[data-i18n-value]").forEach((el) => {
      const val = el.dataset.i18nValue
        .split(".")
        .reduce((o, k) => o?.[k], dict);
      if (val) el.value = val;
    });
  }

  async function loadLanguageFile(code) {
    try {
      const res = await fetch(`${LANG_DIR}${code}.json`, { cache: "no-cache" });
      if (!res.ok) throw new Error("Language file not found");
      const data = await res.json();
      applyTranslations(data);
      langButtonLabel.textContent =
        LANGUAGES.find((l) => l[0] === code)?.[1] || code;
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async function selectLanguage(code) {
    const ok = await loadLanguageFile(code);
    if (!ok) await loadLanguageFile(DEFAULT_LANG);
    localStorage.setItem("innox-lang", code);
    langPanel.classList.remove("open");
  }

  const savedLang = localStorage.getItem("innox-lang") || DEFAULT_LANG;
  await loadLanguageFile(savedLang);
  window.innoxSetLanguage = selectLanguage;

  // Form dropdown
  const languageSelector = document.getElementById("languageSelector");
  if (languageSelector) {
    LANGUAGES.forEach(([code, name]) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = name;
      languageSelector.appendChild(option);
    });
    languageSelector.value = savedLang;
    languageSelector.addEventListener("change", (e) => {
      window.innoxSetLanguage(e.target.value);
    });
  }

  window.t = (key) => {
    const dict = window._innoxDict || {};
    return key.split(".").reduce((o, k) => o?.[k], dict) || key;
  };
})();

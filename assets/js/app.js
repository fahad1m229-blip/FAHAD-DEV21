/**
 * FAHAD DEV — Main Application Controller (ES Module)
 */

import { FirebaseService, SEED_DATA, validateSafeUrl } from "./firebase-service.js";
import { initThreeBackground } from "./three-background.js";
import { TRANSLATIONS } from "./translations.js";
import {
  attachTiltEffects,
  escapeHtml,
  extractYoutubeId,
  getIconSvg,
  observeReveals,
  renderAdSlot,
  showToast
} from "./ui.js";

const STORAGE_KEYS = {
  theme: "fahad_dev_theme",
  lang: "fahad_dev_lang",
  communityDismissed: "fahad_dev_community_dismissed"
};

const state = {
  lang: localStorage.getItem(STORAGE_KEYS.lang) === "bn" ? "bn" : "en",
  theme: localStorage.getItem(STORAGE_KEYS.theme) === "light" ? "light" : "dark",
  searchQuery: "",
  publicSettings: SEED_DATA.publicSettings,
  seo: SEED_DATA.seo,
  ads: SEED_DATA.ads,
  community: SEED_DATA.community,
  maintenance: SEED_DATA.maintenance,
  announcement: SEED_DATA.announcement,
  menu: SEED_DATA.menu,
  social: SEED_DATA.social,
  categories: [],
  activeCategory: null,
  activeVersions: [],
  activeVersion: null,
  activeLinks: [],
  isLoadingCategories: true,
  isLiveFirestore: false,
  deferredInstallPrompt: null
};

const firebaseService = new FirebaseService();
let typingTimer = null;

function t(key) {
  return TRANSLATIONS[state.lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

function localized(obj, fieldBase) {
  if (!obj) return "";
  if (state.lang === "bn") {
    return obj[`${fieldBase}Bn`] || obj[`${fieldBase}En`] || obj[fieldBase] || "";
  }
  return obj[`${fieldBase}En`] || obj[`${fieldBase}Bn`] || obj[fieldBase] || "";
}

/* --------------------------------------------------------------------------
 * Theme & Language
 * -------------------------------------------------------------------------- */
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEYS.theme, theme);

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", theme === "light" ? "#F4F7FF" : "#05070F");
  }

  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.setAttribute("aria-pressed", String(theme === "light"));
    themeBtn.dataset.mode = theme;
  }
}

function applyLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = lang === "bn" ? "bn" : "en";
  localStorage.setItem(STORAGE_KEYS.lang, lang);

  const langLabel = document.getElementById("lang-toggle-label");
  if (langLabel) langLabel.textContent = lang === "bn" ? "EN" : "বাং";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.placeholder = t("searchPlaceholder");

  renderAll();
  startTypingEffect();
}

/* --------------------------------------------------------------------------
 * Typing Animation
 * -------------------------------------------------------------------------- */
function startTypingEffect() {
  const targetEl = document.getElementById("hero-typing-text");
  if (!targetEl) return;

  if (typingTimer) clearTimeout(typingTimer);

  const phrases = state.lang === "en" && state.publicSettings?.heroSubtitle
    ? [state.publicSettings.heroSubtitle, ...TRANSLATIONS.en.heroSubtitles.slice(1)]
    : TRANSLATIONS[state.lang].heroSubtitles;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    targetEl.textContent = phrases[0];
    return;
  }

  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;

  const tick = () => {
    const current = phrases[phraseIdx] || "";
    if (!deleting) {
      charIdx++;
      targetEl.textContent = current.slice(0, charIdx);
      if (charIdx >= current.length) {
        deleting = true;
        typingTimer = setTimeout(tick, 1900);
        return;
      }
      typingTimer = setTimeout(tick, 52);
    } else {
      charIdx--;
      targetEl.textContent = current.slice(0, Math.max(0, charIdx));
      if (charIdx <= 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        typingTimer = setTimeout(tick, 320);
        return;
      }
      typingTimer = setTimeout(tick, 28);
    }
  };
  tick();
}

/* --------------------------------------------------------------------------
 * Render Sections
 * -------------------------------------------------------------------------- */
function renderHeaderAndSeo() {
  const pub = state.publicSettings || SEED_DATA.publicSettings;
  const brandEls = document.querySelectorAll(".brand-name-text");
  brandEls.forEach((el) => {
    el.textContent = pub.siteName || "FAHAD DEV";
  });

  const heroBadge = document.getElementById("hero-badge-text");
  if (heroBadge) heroBadge.textContent = state.lang === "bn" ? t("heroBadge") : (pub.heroBadge || t("heroBadge"));

  const heroTitle = document.getElementById("hero-title-text");
  if (heroTitle) heroTitle.textContent = pub.heroTitle || "FAHAD DEV";

  const videoTitle = document.getElementById("video-card-title");
  if (videoTitle) videoTitle.textContent = state.lang === "bn" ? t("watchVideoTitle") : (pub.heroVideoTitle || t("watchVideoTitle"));

  const codeEl = document.getElementById("hero-code-block");
  if (codeEl) {
    const snippet = pub.codeSnippet || SEED_DATA.publicSettings.codeSnippet;
    codeEl.innerHTML = `<span class="tok-kw">const</span> <span class="tok-var">dev</span> <span class="tok-op">=</span> <span class="tok-brace">{</span>
  <span class="tok-prop">name</span>: <span class="tok-str">"${escapeHtml(snippet.name)}"</span>,
  <span class="tok-prop">role</span>: <span class="tok-str">"${escapeHtml(snippet.role)}"</span>,
  <span class="tok-prop">passion</span>: <span class="tok-str">"${escapeHtml(snippet.passion)}"</span>,
  <span class="tok-prop">status</span>: <span class="tok-str">"${escapeHtml(snippet.status)}"</span>
<span class="tok-brace">};</span>`;
  }

  if (state.seo?.title) document.title = state.seo.title;
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta && state.seo?.description) descMeta.setAttribute("content", state.seo.description);

  const syncStatus = document.getElementById("sync-status-pill");
  if (syncStatus) {
    syncStatus.textContent = state.isLiveFirestore ? t("dataModeLive") : t("dataModeSeed");
    syncStatus.classList.toggle("is-live", state.isLiveFirestore);
  }
}

function renderAnnouncementAndMaintenance() {
  const bar = document.getElementById("announcement-bar");
  const textEl = document.getElementById("announcement-text");
  const ann = state.announcement;
  if (bar && textEl) {
    const msg = state.lang === "bn" ? ann?.textBn || ann?.textEn : ann?.textEn || ann?.textBn;
    if (ann?.enabled && msg) {
      textEl.textContent = msg;
      bar.hidden = false;
    } else {
      bar.hidden = true;
    }
  }

  const maintOverlay = document.getElementById("maintenance-overlay");
  const maintMsg = document.getElementById("maintenance-message");
  if (maintOverlay && maintMsg) {
    if (state.maintenance?.enabled) {
      maintMsg.textContent =
        (state.lang === "bn" ? state.maintenance.messageBn : state.maintenance.messageEn) ||
        t("maintenanceDesc");
      maintOverlay.hidden = false;
    } else {
      maintOverlay.hidden = true;
    }
  }
}

function renderDrawerMenu() {
  const listEl = document.getElementById("drawer-menu-list");
  if (!listEl) return;

  listEl.innerHTML = (state.menu || []).map((item) => {
    const label = escapeHtml(localized(item, "title"));
    const iconSvg = getIconSvg(item.icon || "web");
    const categoryAttr = item.categoryId ? `data-category-id="${escapeHtml(item.categoryId)}"` : "";
    const targetAttr = escapeHtml(item.target || "#hero");
    return `
      <li>
        <button type="button" class="drawer-nav-item" data-target="${targetAttr}" ${categoryAttr}>
          <span class="drawer-nav-icon" aria-hidden="true">${iconSvg}</span>
          <span>${label}</span>
        </button>
      </li>
    `;
  }).join("");
}

function renderSocialButtons() {
  const containers = [
    document.getElementById("hero-social-buttons"),
    document.getElementById("footer-social-links")
  ];

  const html = (state.social || [])
    .filter((s) => s.enabled !== false)
    .map((s) => {
      const safeUrl = validateSafeUrl(s.url);
      if (!safeUrl) return "";
      const name = escapeHtml(s.name || s.id);
      const iconKey = escapeHtml((s.icon || s.id || "").toLowerCase());
      return `
        <a class="social-pill social-${iconKey}" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${name}">
          <span class="social-icon" aria-hidden="true">${getIconSvg(iconKey)}</span>
          <span>${name}</span>
        </a>
      `;
    })
    .join("");

  containers.forEach((c) => {
    if (c) c.innerHTML = html;
  });
}

function renderExploreGrid() {
  const grid = document.getElementById("explore-grid");
  if (!grid) return;

  const items = state.categories.length ? state.categories : SEED_DATA.categories;
  grid.innerHTML = items.map((cat, idx) => {
    const num = escapeHtml(cat.number || String(idx + 1).padStart(2, "0"));
    const title = escapeHtml(localized(cat, "title"));
    return `
      <button type="button" class="explore-card tilt-card reveal-on-scroll" data-open-category="${escapeHtml(cat.id)}" aria-label="${num} — ${title}">
        <div class="explore-top">
          <span class="explore-num">${num}</span>
          <span class="explore-icon" aria-hidden="true">${getIconSvg(cat.icon)}</span>
        </div>
        <div class="explore-title">${title}</div>
        <div class="explore-arrow" aria-hidden="true">→</div>
      </button>
    `;
  }).join("");

  attachTiltEffects(grid);
  observeReveals(grid);
}

function renderCategoryGrid() {
  const grid = document.getElementById("categories-grid");
  if (!grid) return;

  if (state.isLoadingCategories) {
    grid.innerHTML = Array.from({ length: 4 }).map(() => `
      <div class="category-card skeleton-card" aria-hidden="true">
        <div class="skeleton-line w-40"></div>
        <div class="skeleton-line w-75"></div>
        <div class="skeleton-line w-90"></div>
        <div class="skeleton-btn"></div>
      </div>
    `).join("");
    return;
  }

  const query = state.searchQuery.trim().toLowerCase();
  const filtered = state.categories.filter((cat) => {
    if (!query) return true;
    const text = [
      cat.titleEn,
      cat.titleBn,
      cat.descEn,
      cat.descBn,
      cat.ribbon,
      cat.id,
      ...(SEED_DATA.seedVersions.map((v) => v.version))
    ].join(" ").toLowerCase();
    return text.includes(query);
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state glass-panel">${escapeHtml(t("searchEmpty"))}</div>`;
    return;
  }

  const cardsHtml = [];
  const hasNativeAd = Boolean(
    state.ads?.categoryNative?.enabled &&
    state.ads?.categoryNative?.trustedApproved &&
    state.ads?.categoryNative?.html?.trim()
  );

  filtered.forEach((cat, index) => {
    const title = escapeHtml(localized(cat, "title"));
    const desc = escapeHtml(localized(cat, "desc"));
    const ribbon = escapeHtml(cat.ribbon || "DEV");
    const num = escapeHtml(cat.number || String(index + 1).padStart(2, "0"));

    cardsHtml.push(`
      <article id="cat-${escapeHtml(cat.id)}" class="category-card tilt-card reveal-on-scroll">
        <div class="ribbon-badge" aria-hidden="true">${ribbon}</div>
        <div class="cat-card-header">
          <div class="cat-icon-box" aria-hidden="true">${getIconSvg(cat.icon)}</div>
          <div class="cat-badges">
            <span class="badge badge-free">${escapeHtml(t("freeBadge"))}</span>
            ${cat.isNew ? `<span class="badge badge-new">${escapeHtml(t("newBadge"))}</span>` : ""}
            ${cat.isPopular ? `<span class="badge badge-popular">${escapeHtml(t("popularBadge"))}</span>` : ""}
          </div>
        </div>
        <div class="cat-index">${num}</div>
        <h3 class="cat-title">${title}</h3>
        <p class="cat-desc">${desc}</p>
        <div class="cat-actions">
          <button type="button" class="btn-primary view-cat-btn" data-open-category="${escapeHtml(cat.id)}">
            <span>${escapeHtml(t("viewBtn"))}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </article>
    `);

    // Category native ads after every two cards when enabled
    if (hasNativeAd && (index + 1) % 2 === 0 && index + 1 < filtered.length) {
      cardsHtml.push(`<div class="ad-slot ad-slot-native native-ad-target" data-ad-slot="categoryNative"></div>`);
    }
  });

  grid.innerHTML = cardsHtml.join("");
  grid.querySelectorAll(".native-ad-target").forEach((el) => {
    renderAdSlot(el, state.ads.categoryNative, t("adLabel"));
  });

  attachTiltEffects(grid);
  observeReveals(grid);
}

function renderAllAds() {
  renderAdSlot(document.getElementById("ad-header-banner"), state.ads?.headerBanner, t("adLabel"));
  renderAdSlot(document.getElementById("ad-hero-bottom"), state.ads?.heroBottom, t("adLabel"));
  renderAdSlot(document.getElementById("ad-footer-banner"), state.ads?.footerBanner, t("adLabel"));
  renderAdSlot(document.getElementById("ad-version-modal"), state.ads?.versionModal, t("adLabel"));

  const stickyWrap = document.getElementById("sticky-ad-bar");
  const stickyContent = document.getElementById("ad-sticky-bottom");
  if (stickyWrap && stickyContent) {
    renderAdSlot(stickyContent, state.ads?.stickyBottom, t("adLabel"));
    stickyWrap.hidden = stickyContent.hidden;
  }
}

function renderAll() {
  renderHeaderAndSeo();
  renderAnnouncementAndMaintenance();
  renderDrawerMenu();
  renderSocialButtons();
  renderExploreGrid();
  renderCategoryGrid();
  renderAllAds();
  if (state.activeCategory) {
    if (state.activeVersion) {
      renderVersionLinksView();
    } else {
      renderVersionsListView();
    }
  }
}

/* --------------------------------------------------------------------------
 * Version Modal & Dynamic Resource Links
 * -------------------------------------------------------------------------- */
function openCategoryModal(categoryId) {
  const category = state.categories.find((c) => c.id === categoryId) ||
    SEED_DATA.categories.find((c) => c.id === categoryId);
  if (!category) return;

  state.activeCategory = category;
  state.activeVersion = null;
  state.activeVersions = [];
  state.activeLinks = [];

  const modal = document.getElementById("version-modal");
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("modal-open");

  firebaseService.trackEvent({ type: "view_category", categoryId: category.id });
  renderVersionsLoading();

  firebaseService.subscribeVersions(
    category.id,
    (versions) => {
      state.activeVersions = versions;
      if (!state.activeVersion) renderVersionsListView();
    },
    () => {
      showToast(t("loadingError"), "error");
      state.activeVersions = SEED_DATA.seedVersions;
      if (!state.activeVersion) renderVersionsListView();
    }
  );

  document.getElementById("modal-close-btn")?.focus();
}

function closeCategoryModal() {
  const modal = document.getElementById("version-modal");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
  state.activeCategory = null;
  state.activeVersion = null;
  firebaseService.clearModalListeners();
}

function renderVersionsLoading() {
  const titleEl = document.getElementById("modal-title");
  const subEl = document.getElementById("modal-subtitle");
  const bodyEl = document.getElementById("modal-body");
  if (titleEl && state.activeCategory) {
    titleEl.textContent = `${localized(state.activeCategory, "title")} — ${t("versionsModalTitle")}`;
  }
  if (subEl) subEl.textContent = t("versionsModalSubtitle");
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="version-list">
        ${Array.from({ length: 4 }).map(() => `<div class="skeleton-line h-56"></div>`).join("")}
      </div>
    `;
  }
}

function renderVersionsListView() {
  const titleEl = document.getElementById("modal-title");
  const subEl = document.getElementById("modal-subtitle");
  const bodyEl = document.getElementById("modal-body");
  if (!bodyEl || !state.activeCategory) return;

  if (titleEl) {
    titleEl.textContent = `${localized(state.activeCategory, "title")} — ${t("versionsModalTitle")}`;
  }
  if (subEl) subEl.textContent = t("versionsModalSubtitle");

  if (!state.activeVersions.length) {
    bodyEl.innerHTML = `<div class="empty-state">${escapeHtml(t("versionsEmpty"))}</div>`;
    return;
  }

  bodyEl.innerHTML = `
    <div class="version-list">
      ${state.activeVersions.map((ver) => {
        const verTag = escapeHtml(ver.version || ver.id);
        const notes = escapeHtml(localized(ver, "notes"));
        const dlCount = firebaseService.getLocalDownloadCount(state.activeCategory.id, ver.id, ver.downloads);
        return `
          <div class="version-row">
            <div class="version-info">
              <div class="version-top-row">
                <span class="version-chip">${verTag}</span>
                ${ver.isNew ? `<span class="badge badge-new">${escapeHtml(t("newBadge"))}</span>` : ""}
                ${ver.isPopular ? `<span class="badge badge-popular">${escapeHtml(t("popularBadge"))}</span>` : ""}
                <span class="dl-counter">${escapeHtml(t("downloadsLabel"))}: <strong>${dlCount}</strong></span>
              </div>
              <p class="version-notes">${notes}</p>
            </div>
            <button type="button" class="btn-primary btn-sm" data-open-version="${escapeHtml(ver.id)}">
              ${escapeHtml(t("viewBtn"))}
            </button>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function openVersionLinks(versionId) {
  const version = state.activeVersions.find((v) => v.id === versionId);
  if (!version || !state.activeCategory) return;

  state.activeVersion = version;
  firebaseService.trackEvent({
    type: "view_version",
    categoryId: state.activeCategory.id,
    versionId: version.id
  });

  const bodyEl = document.getElementById("modal-body");
  if (bodyEl) {
    bodyEl.innerHTML = `<div class="links-grid">${Array.from({ length: 4 }).map(() => `<div class="skeleton-line h-96"></div>`).join("")}</div>`;
  }

  firebaseService.subscribeVersionLinks(
    state.activeCategory.id,
    version.id,
    (links) => {
      state.activeLinks = links;
      renderVersionLinksView();
    },
    () => {
      showToast(t("loadingError"), "error");
      state.activeLinks = SEED_DATA.seedLinkProviders;
      renderVersionLinksView();
    }
  );
}

function renderVersionLinksView() {
  const titleEl = document.getElementById("modal-title");
  const subEl = document.getElementById("modal-subtitle");
  const bodyEl = document.getElementById("modal-body");
  if (!bodyEl || !state.activeCategory || !state.activeVersion) return;

  const dlCount = firebaseService.getLocalDownloadCount(
    state.activeCategory.id,
    state.activeVersion.id,
    state.activeVersion.downloads
  );

  if (titleEl) {
    titleEl.textContent = `${localized(state.activeCategory, "title")} • ${state.activeVersion.version || state.activeVersion.id}`;
  }
  if (subEl) {
    subEl.textContent = localized(state.activeVersion, "notes") || t("versionsModalSubtitle");
  }

  const linksHtml = state.activeLinks.length
    ? state.activeLinks.map((link) => {
        const provider = escapeHtml((link.type || link.id || "download").toLowerCase());
        const label = escapeHtml(link.label || link.name || link.type || "Resource");
        const safeUrl = validateSafeUrl(link.url);
        const ytId = provider === "youtube" ? extractYoutubeId(link.url) : null;

        return `
          <div class="resource-card ${safeUrl ? "" : "is-unconfigured"}">
            <div class="resource-head">
              <div class="resource-icon" aria-hidden="true">${getIconSvg(provider)}</div>
              <div>
                <div class="resource-label">${label}</div>
                <div class="resource-status ${safeUrl ? "status-ready" : "status-pending"}">
                  ${safeUrl ? "Verified HTTPS" : escapeHtml(t("linkUnconfigured"))}
                </div>
              </div>
            </div>
            ${!safeUrl ? `<p class="resource-hint">${escapeHtml(t("linkUnconfiguredHint"))}</p>` : ""}
            ${ytId ? `<div class="yt-embed-slot" data-yt-id="${escapeHtml(ytId)}"></div>` : ""}
            <div class="resource-actions">
              ${safeUrl ? `
                <a class="btn-primary btn-sm resource-open-btn"
                   href="${escapeHtml(safeUrl)}"
                   target="_blank"
                   rel="noopener noreferrer"
                   data-track-link="${escapeHtml(link.id)}">
                  ${escapeHtml(t("openLink"))}
                </a>
                <button type="button" class="btn-glass btn-sm" data-copy-url="${escapeHtml(safeUrl)}">
                  ${escapeHtml(t("copyLink"))}
                </button>
                <button type="button" class="btn-glass btn-sm" data-share-url="${escapeHtml(safeUrl)}" data-share-title="${label}">
                  ${escapeHtml(t("shareLink"))}
                </button>
                ${ytId ? `<button type="button" class="btn-glass btn-sm" data-load-yt="${escapeHtml(ytId)}">${escapeHtml(t("watchTutorial"))}</button>` : ""}
              ` : `
                <button type="button" class="btn-glass btn-sm" disabled>${escapeHtml(t("linkUnconfigured"))}</button>
              `}
            </div>
          </div>
        `;
      }).join("")
    : `<div class="empty-state">${escapeHtml(t("linksEmpty"))}</div>`;

  bodyEl.innerHTML = `
    <div class="links-toolbar">
      <button type="button" class="btn-glass btn-sm" id="back-to-versions-btn">
        ← ${escapeHtml(t("linksBackBtn"))}
      </button>
      <div class="dl-pill">
        <span>${escapeHtml(t("downloadsLabel"))}:</span>
        <strong id="active-version-dl-count">${dlCount}</strong>
      </div>
    </div>
    <div class="links-grid">${linksHtml}</div>
  `;
}

/* --------------------------------------------------------------------------
 * Video Preview & Community Popup
 * -------------------------------------------------------------------------- */
function openVideoPlayer() {
  const url = state.publicSettings?.heroVideoUrl;
  const ytId = extractYoutubeId(url);
  const slot = document.getElementById("hero-video-embed-slot");
  if (!ytId || !slot) {
    showToast(t("linkUnconfiguredHint"), "info");
    return;
  }

  slot.innerHTML = `
    <iframe
      src="https://www.youtube-nocookie.com/embed/${escapeHtml(ytId)}?autoplay=1&rel=0"
      title="FAHAD DEV Featured Video"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  `;
  slot.hidden = false;
}

function maybeShowCommunityPopup() {
  if (localStorage.getItem(STORAGE_KEYS.communityDismissed) === "1") return;
  if (!state.community?.enabled) return;

  setTimeout(() => {
    const popup = document.getElementById("community-popup");
    if (!popup || state.maintenance?.enabled) return;
    if (localStorage.getItem(STORAGE_KEYS.communityDismissed) === "1") return;

    const title = document.getElementById("community-title");
    const sub = document.getElementById("community-subtitle");
    const tg = document.getElementById("community-tg-btn");
    const yt = document.getElementById("community-yt-btn");

    if (title) {
      title.textContent = state.lang === "bn"
        ? state.community.titleBn || t("communityTitle")
        : state.community.titleEn || t("communityTitle");
    }
    if (sub) {
      sub.textContent = state.lang === "bn"
        ? state.community.subtitleBn || t("communitySubtitle")
        : state.community.subtitleEn || t("communitySubtitle");
    }

    const safeTg = validateSafeUrl(state.community.telegramUrl);
    const safeYt = validateSafeUrl(state.community.youtubeUrl);
    if (tg) tg.href = safeTg || "https://t.me/";
    if (yt) yt.href = safeYt || "https://www.youtube.com/";

    popup.hidden = false;
  }, 4500);
}

/* --------------------------------------------------------------------------
 * Event Listeners & Initialization
 * -------------------------------------------------------------------------- */
function setupEventHandlers() {
  // Drawer toggle
  const drawer = document.getElementById("nav-drawer");
  const drawerBackdrop = document.getElementById("drawer-backdrop");
  const openDrawer = () => {
    if (drawer) drawer.hidden = false;
    if (drawerBackdrop) drawerBackdrop.hidden = false;
    document.body.classList.add("modal-open");
  };
  const closeDrawer = () => {
    if (drawer) drawer.hidden = true;
    if (drawerBackdrop) drawerBackdrop.hidden = true;
    if (document.getElementById("version-modal")?.hidden) {
      document.body.classList.remove("modal-open");
    }
  };

  document.getElementById("menu-toggle-btn")?.addEventListener("click", openDrawer);
  document.getElementById("drawer-close-btn")?.addEventListener("click", closeDrawer);
  drawerBackdrop?.addEventListener("click", closeDrawer);

  document.getElementById("drawer-menu-list")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-target]");
    if (!btn) return;
    closeDrawer();
    const catId = btn.dataset.categoryId;
    const target = btn.dataset.target;
    if (target && target !== "#hero") {
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (catId) {
      setTimeout(() => openCategoryModal(catId), 260);
    }
  });

  // Search toggle & live search
  const searchPanel = document.getElementById("search-bar-panel");
  const searchInput = document.getElementById("search-input");
  document.getElementById("search-toggle-btn")?.addEventListener("click", () => {
    if (!searchPanel) return;
    searchPanel.hidden = !searchPanel.hidden;
    if (!searchPanel.hidden) searchInput?.focus();
  });
  document.getElementById("search-clear-btn")?.addEventListener("click", () => {
    state.searchQuery = "";
    if (searchInput) searchInput.value = "";
    renderCategoryGrid();
  });
  searchInput?.addEventListener("input", (e) => {
    state.searchQuery = e.target.value || "";
    renderCategoryGrid();
  });

  // Theme & Language toggles
  document.getElementById("theme-toggle-btn")?.addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });
  document.getElementById("lang-toggle-btn")?.addEventListener("click", () => {
    applyLanguage(state.lang === "en" ? "bn" : "en");
  });

  // Global delegation for Explore cards, Category VIEW, Version buttons, Copy/Share/YT
  document.addEventListener("click", async (e) => {
    const openCat = e.target.closest("[data-open-category]");
    if (openCat) {
      openCategoryModal(openCat.dataset.openCategory);
      return;
    }

    const openVer = e.target.closest("[data-open-version]");
    if (openVer) {
      openVersionLinks(openVer.dataset.openVersion);
      return;
    }

    if (e.target.closest("#back-to-versions-btn")) {
      state.activeVersion = null;
      firebaseService.subscribeVersions(
        state.activeCategory.id,
        (versions) => {
          state.activeVersions = versions;
          renderVersionsListView();
        },
        () => renderVersionsListView()
      );
      return;
    }

    const copyBtn = e.target.closest("[data-copy-url]");
    if (copyBtn) {
      const safe = validateSafeUrl(copyBtn.dataset.copyUrl);
      if (!safe) {
        showToast(t("invalidUrlToast"), "error");
        return;
      }
      try {
        await navigator.clipboard.writeText(safe);
        showToast(t("copiedToast"), "success");
      } catch {
        showToast(t("copyFailToast"), "error");
      }
      return;
    }

    const shareBtn = e.target.closest("[data-share-url]");
    if (shareBtn) {
      const safe = validateSafeUrl(shareBtn.dataset.shareUrl);
      if (!safe) {
        showToast(t("invalidUrlToast"), "error");
        return;
      }
      firebaseService.trackEvent({
        type: "share_click",
        categoryId: state.activeCategory?.id || "general",
        versionId: state.activeVersion?.id || null
      });
      if (navigator.share) {
        try {
          await navigator.share({ title: shareBtn.dataset.shareTitle || "FAHAD DEV", url: safe });
          showToast(t("sharedToast"), "success");
          return;
        } catch {}
      }
      try {
        await navigator.clipboard.writeText(safe);
        showToast(t("copiedToast"), "success");
      } catch {
        showToast(t("copyFailToast"), "error");
      }
      return;
    }

    const ytBtn = e.target.closest("[data-load-yt]");
    if (ytBtn) {
      const ytId = ytBtn.dataset.loadYt;
      const card = ytBtn.closest(".resource-card");
      const slot = card?.querySelector(".yt-embed-slot");
      if (slot && /^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
        slot.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${ytId}?rel=0" title="YouTube Tutorial" loading="lazy" allowfullscreen></iframe>`;
        ytBtn.remove();
      }
      return;
    }

    const trackLink = e.target.closest("[data-track-link]");
    if (trackLink && state.activeCategory && state.activeVersion) {
      const nextCount = await firebaseService.trackEvent({
        type: "download_click",
        categoryId: state.activeCategory.id,
        versionId: state.activeVersion.id,
        linkId: trackLink.dataset.trackLink
      });
      const countEl = document.getElementById("active-version-dl-count");
      if (countEl) {
        countEl.textContent = String(Number(state.activeVersion.downloads || 0) + nextCount);
      }
      showToast(t("downloadToast"), "info");
    }
  });

  // Modal close & Escape key
  document.getElementById("modal-close-btn")?.addEventListener("click", closeCategoryModal);
  document.getElementById("version-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "version-modal") closeCategoryModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCategoryModal();
      closeDrawer();
      const popup = document.getElementById("community-popup");
      if (popup) popup.hidden = true;
    }
  });

  // Hero Video preview
  document.getElementById("watch-video-btn")?.addEventListener("click", openVideoPlayer);

  // Community popup controls
  const closeCommunity = () => {
    const popup = document.getElementById("community-popup");
    const chk = document.getElementById("community-dont-show");
    if (chk?.checked) {
      localStorage.setItem(STORAGE_KEYS.communityDismissed, "1");
    }
    if (popup) popup.hidden = true;
  };
  document.getElementById("community-close-btn")?.addEventListener("click", closeCommunity);
  document.getElementById("community-popup")?.addEventListener("click", (e) => {
    if (e.target.id === "community-popup") closeCommunity();
  });

  // Sticky Ad close
  document.getElementById("sticky-ad-close")?.addEventListener("click", () => {
    const bar = document.getElementById("sticky-ad-bar");
    if (bar) bar.hidden = true;
  });

  // Announcement close
  document.getElementById("announcement-close")?.addEventListener("click", () => {
    const bar = document.getElementById("announcement-bar");
    if (bar) bar.hidden = true;
  });

  // Back to top button
  const btt = document.getElementById("back-to-top-btn");
  window.addEventListener("scroll", () => {
    if (!btt) return;
    btt.classList.toggle("visible", window.scrollY > 360);
  }, { passive: true });
  btt?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Offline / Online Banner
  const offlineBanner = document.getElementById("offline-banner");
  const syncOnlineState = () => {
    if (offlineBanner) offlineBanner.hidden = navigator.onLine;
  };
  window.addEventListener("online", syncOnlineState);
  window.addEventListener("offline", syncOnlineState);
  syncOnlineState();

  // PWA Install Prompt
  const installBtn = document.getElementById("pwa-install-btn");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });
  installBtn?.addEventListener("click", async () => {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((err) => {
        console.debug("[SW] Registration skipped:", err);
      });
    });
  }
}

async function bootstrap() {
  applyTheme(state.theme);
  applyLanguage(state.lang);
  setupEventHandlers();
  registerServiceWorker();

  // Initialize Three.js 3D background
  initThreeBackground(document.getElementById("three-bg-canvas"));

  // Dismiss intro cyber loader cleanly
  const loader = document.getElementById("intro-loader");
  setTimeout(() => {
    loader?.classList.add("is-hidden");
    setTimeout(() => loader?.remove(), 450);
  }, 550);

  // Connect Firebase Firestore real-time listeners
  const { live } = await firebaseService.init({
    onPublicSettings: (d) => { state.publicSettings = d; renderHeaderAndSeo(); startTypingEffect(); },
    onSeo: (d) => { state.seo = d; renderHeaderAndSeo(); },
    onAds: (d) => { state.ads = d; renderAllAds(); renderCategoryGrid(); },
    onCommunity: (d) => { state.community = d; },
    onMaintenance: (d) => { state.maintenance = d; renderAnnouncementAndMaintenance(); },
    onAnnouncement: (d) => { state.announcement = d; renderAnnouncementAndMaintenance(); },
    onMenu: (items) => { state.menu = items; renderDrawerMenu(); },
    onSocial: (items) => { state.social = items; renderSocialButtons(); },
    onCategories: (items) => {
      state.categories = items;
      state.isLoadingCategories = false;
      renderExploreGrid();
      renderCategoryGrid();
    },
    onError: () => {
      showToast(t("loadingError"), "error");
    }
  });

  state.isLiveFirestore = live;
  renderHeaderAndSeo();
  maybeShowCommunityPopup();
}

bootstrap();

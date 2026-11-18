/**
 * FAHAD DEV — Public API Service & Seed Fallback
 * Connects User Panel to /api/public/* endpoints without requiring authentication.
 */

export const SEED_DATA = {
  publicSettings: {
    siteName: "FAHAD DEV",
    heroBadge: "WELCOME TO DEVELOPER WEBSITE",
    heroTitle: "FAHAD DEV",
    heroSubtitle: "Creative Developer • Video Creator",
    heroVideoTitle: "WATCH THIS VIDEO",
    heroVideoUrl: "",
    codeSnippet: {
      name: "FAHAD DEV",
      role: "Creative Developer",
      passion: "Building Digital Experiences",
      status: "Available"
    }
  },
  seo: {
    title: "FAHAD DEV — Futuristic 3D Developer Portfolio & Resource Hub",
    description:
      "Explore free website templates, APK builds, bots, security guides, API tools, review projects, and PC utilities by FAHAD DEV.",
    ogImage: "./assets/img/og-banner.svg"
  },
  announcement: {
    enabled: true,
    textEn: "New V16.0 developer resource slots are live!",
    textBn: "নতুন V16.0 ডেভেলপার রিসোর্স স্লট এখন লাইভ!"
  },
  maintenance: {
    enabled: false,
    messageEn: "FAHAD DEV is upgrading systems. Please check back soon.",
    messageBn: "FAHAD DEV সিস্টেম আপগ্রেড করা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আসুন।"
  },
  community: {
    enabled: true,
    titleEn: "Join Our Developer Community!",
    titleBn: "আমাদের ডেভেলপার কমিউনিটিতে যোগ দিন।",
    subtitleEn: "Get instant updates on free websites, APK builds, bots, APIs & tutorials.",
    subtitleBn: "ফ্রি ওয়েবসাইট, APK বিল্ড, বট, API ও টিউটোরিয়ালের তাৎক্ষণিক আপডেট পান।",
    telegramUrl: "https://t.me/",
    youtubeUrl: "https://www.youtube.com/"
  },
  ads: {
    headerBanner: { enabled: false, trustedApproved: false, html: "" },
    heroBottom: { enabled: false, trustedApproved: false, html: "" },
    categoryNative: { enabled: false, trustedApproved: false, html: "" },
    versionModal: { enabled: false, trustedApproved: false, html: "" },
    footerBanner: { enabled: false, trustedApproved: false, html: "" },
    stickyBottom: { enabled: false, trustedApproved: false, html: "" }
  },
  menu: [
    { id: "home", order: 1, titleEn: "Home", titleBn: "হোম", target: "#hero", icon: "home", categoryId: null },
    { id: "free-website", order: 2, titleEn: "Free Website", titleBn: "ফ্রি ওয়েবসাইট", target: "#cat-free-website", icon: "web", categoryId: "free-website" },
    { id: "apk-building", order: 3, titleEn: "APK Building", titleBn: "APK বিল্ডিং", target: "#cat-apk-building", icon: "apk", categoryId: "apk-building" },
    { id: "bot-making", order: 4, titleEn: "Bot Making", titleBn: "বট মেকিং", target: "#cat-bot-making", icon: "bot", categoryId: "bot-making" },
    { id: "security", order: 5, titleEn: "Security", titleBn: "সিকিউরিটি", target: "#cat-security", icon: "security", categoryId: "security" },
    { id: "api-key", order: 6, titleEn: "API Key", titleBn: "API কী", target: "#cat-api-key", icon: "api", categoryId: "api-key" },
    { id: "review-project", order: 7, titleEn: "Review Project", titleBn: "রিভিউ প্রজেক্ট", target: "#cat-review-project", icon: "review", categoryId: "review-project" },
    { id: "pc-tools", order: 8, titleEn: "PC Tools", titleBn: "পিসি টুলস", target: "#cat-pc-tools", icon: "pc", categoryId: "pc-tools" }
  ],
  social: [
    { id: "telegram", order: 1, name: "Telegram", url: "https://t.me/", icon: "telegram", enabled: true },
    { id: "youtube", order: 2, name: "YouTube", url: "https://www.youtube.com/", icon: "youtube", enabled: true },
    { id: "tiktok", order: 3, name: "TikTok", url: "https://www.tiktok.com/", icon: "tiktok", enabled: true }
  ],
  categories: [
    {
      id: "free-website",
      number: "01",
      order: 1,
      ribbon: "WEB",
      icon: "web",
      titleEn: "Free Website",
      titleBn: "ফ্রি ওয়েবসাইট",
      descEn: "Responsive 3D glassmorphism templates, portfolios, and static deployment kits.",
      descBn: "রেসপন্সিভ ৩ডি গ্লাসমরফিজম টেমপ্লেট, পোর্টফোলিও এবং স্ট্যাটিক ডিপ্লয়মেন্ট কিট।",
      isNew: true,
      isPopular: true,
      published: true
    },
    {
      id: "apk-building",
      number: "02",
      order: 2,
      ribbon: "APK",
      icon: "apk",
      titleEn: "APK Building",
      titleBn: "APK বিল্ডিং",
      descEn: "Modern Android Kotlin & Web-to-APK project structures with clean Material 3 UI.",
      descBn: "মডার্ন অ্যান্ড্রয়েড কটলিন এবং ম্যাটেরিয়াল ৩ ইউআই ভিত্তিক APK বিল্ড প্রজেক্ট।",
      isNew: false,
      isPopular: true,
      published: true
    },
    {
      id: "bot-making",
      number: "03",
      order: 3,
      ribbon: "BOT",
      icon: "bot",
      titleEn: "Bot Making",
      titleBn: "বট মেকিং",
      descEn: "Automated Telegram & Discord workflow bots with webhook and server support.",
      descBn: "ওয়েবহুক ও সার্ভার সাপোর্টসহ অটোমেটেড টেলিগ্রাম ও ডিসকর্ড বট সিস্টেম।",
      isNew: true,
      isPopular: false,
      published: true
    },
    {
      id: "security",
      number: "04",
      order: 4,
      ribbon: "SEC",
      icon: "security",
      titleEn: "Security",
      titleBn: "সিকিউরিটি",
      descEn: "Hardened server authentication, URL sanitizers, and defensive web audits.",
      descBn: "সুরক্ষিত সার্ভার অথেনটিকেশন, URL ভ্যালিডেশন ও ওয়েব সিকিউরিটি গাইড।",
      isNew: false,
      isPopular: false,
      published: true
    },
    {
      id: "api-key",
      number: "05",
      order: 5,
      ribbon: "API",
      icon: "api",
      titleEn: "API Key",
      titleBn: "API কী",
      descEn: "REST & JSON integration blueprints, proxy patterns, and token management tools.",
      descBn: "REST ও JSON ইন্টিগ্রেশন ব্লুপ্রিন্ট, প্রক্সি প্যাটার্ন এবং কী ম্যানেজমেন্ট টুলস।",
      isNew: false,
      isPopular: true,
      published: true
    },
    {
      id: "review-project",
      number: "06",
      order: 6,
      ribbon: "REV",
      icon: "review",
      titleEn: "Review Project",
      titleBn: "রিভিউ প্রজেক্ট",
      descEn: "Featured community builds, code walkthroughs, and benchmark showcase projects.",
      descBn: "কমিউনিটি প্রজেক্ট রিভিউ, কোড ওয়াকথ্রু এবং পারফরম্যান্স শোকেস প্রজেক্ট।",
      isNew: false,
      isPopular: false,
      published: true
    },
    {
      id: "pc-tools",
      number: "07",
      order: 7,
      ribbon: "PC",
      icon: "pc",
      titleEn: "PC Tools",
      titleBn: "পিসি টুলস",
      descEn: "Developer CLI utilities, Windows productivity scripts, and environment helpers.",
      descBn: "ডেভেলপার CLI ইউটিলিটি, উইন্ডোজ প্রোডাক্টিভিটি স্ক্রিপ্ট ও সেটআপ টুলস।",
      isNew: true,
      isPopular: false,
      published: true
    }
  ],
  seedVersions: ["V11.0", "V11.5", "V12.0", "V13.0", "V14.0", "V15.0", "V16.0"].map((tag, idx) => ({
    id: tag.toLowerCase().replace(".", "-"),
    version: tag,
    order: idx + 1,
    titleEn: `${tag} Release Build`,
    titleBn: `${tag} রিলিজ বিল্ড`,
    notesEn: `Release ${tag} build ready.`,
    notesBn: `রিলিজ ${tag}।`,
    isNew: tag === "V16.0",
    isPopular: tag === "V15.0" || tag === "V16.0",
    downloads: 0,
    published: true
  })),
  seedLinkProviders: [
    { id: "render", type: "render", label: "Render", order: 1, url: "" },
    { id: "github", type: "github", label: "GitHub", order: 2, url: "" },
    { id: "netlify", type: "netlify", label: "Netlify", order: 3, url: "" },
    { id: "postimages", type: "postimages", label: "Postimages", order: 4, url: "" },
    { id: "download", type: "download", label: "Download Main File", order: 5, url: "" },
    { id: "youtube", type: "youtube", label: "YouTube Tutorial", order: 6, url: "" }
  ]
};

export function validateSafeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export class ApiService {
  constructor() {
    this.isLive = false;
  }

  async init(handlers) {
    try {
      const res = await fetch("/api/public/bootstrap", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      this.isLive = true;

      handlers.onPublicSettings?.(payload.publicSettings || SEED_DATA.publicSettings);
      handlers.onSeo?.(payload.seo || SEED_DATA.seo);
      handlers.onAds?.(payload.ads || SEED_DATA.ads);
      handlers.onCommunity?.(payload.community || SEED_DATA.community);
      handlers.onMaintenance?.(payload.maintenance || SEED_DATA.maintenance);
      handlers.onAnnouncement?.(payload.announcement || SEED_DATA.announcement);
      handlers.onMenu?.(payload.menu || SEED_DATA.menu);
      handlers.onSocial?.(payload.social || SEED_DATA.social);
      handlers.onCategories?.(payload.categories || SEED_DATA.categories);

      return { live: true };
    } catch (err) {
      console.warn("[FAHAD DEV] Public API unavailable; using cached seed fallback.", err);
      this.isLive = false;
      this.emitSeedState(handlers);
      return { live: false, error: err };
    }
  }

  emitSeedState(handlers) {
    handlers.onPublicSettings?.(SEED_DATA.publicSettings);
    handlers.onSeo?.(SEED_DATA.seo);
    handlers.onAds?.(SEED_DATA.ads);
    handlers.onCommunity?.(SEED_DATA.community);
    handlers.onMaintenance?.(SEED_DATA.maintenance);
    handlers.onAnnouncement?.(SEED_DATA.announcement);
    handlers.onMenu?.(SEED_DATA.menu);
    handlers.onSocial?.(SEED_DATA.social);
    handlers.onCategories?.(SEED_DATA.categories);
  }

  async subscribeVersions(categoryId, onUpdate, onError) {
    if (!this.isLive) {
      onUpdate(SEED_DATA.seedVersions);
      return;
    }
    try {
      const res = await fetch(`/api/public/categories/${encodeURIComponent(categoryId)}/versions`, {
        cache: "no-store"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      onUpdate(data.versions || []);
    } catch (err) {
      onError?.(err);
    }
  }

  async subscribeVersionLinks(categoryId, versionId, onUpdate, onError) {
    if (!this.isLive) {
      onUpdate(SEED_DATA.seedLinkProviders);
      return;
    }
    try {
      const res = await fetch(
        `/api/public/categories/${encodeURIComponent(categoryId)}/versions/${encodeURIComponent(versionId)}/links`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      onUpdate(data.links || []);
    } catch (err) {
      onError?.(err);
    }
  }

  async trackEvent({ type, categoryId, versionId = null, linkId = null }) {
    const localKey = `fahad_dev_clicks_${categoryId}_${versionId || "cat"}`;
    const prev = Number(localStorage.getItem(localKey) || "0");
    localStorage.setItem(localKey, String(prev + 1));

    if (!this.isLive) return prev + 1;

    try {
      await fetch("/api/public/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, categoryId, versionId, linkId })
      });
    } catch {}
    return prev + 1;
  }

  getLocalDownloadCount(categoryId, versionId, baseDownloads = 0) {
    const localKey = `fahad_dev_clicks_${categoryId}_${versionId}`;
    const localClicks = Number(localStorage.getItem(localKey) || "0");
    return Number(baseDownloads || 0) + localClicks;
  }

  clearModalListeners() {}
  destroy() {}
}

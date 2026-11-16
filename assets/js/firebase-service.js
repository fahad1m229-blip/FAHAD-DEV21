/**
 * FAHAD DEV — Firebase Firestore Real-Time Service & Seed Fallback
 * ---------------------------------------------------------------------------
 * Connects to Firebase Firestore using real-time onSnapshot() listeners for:
 *   settings/public, settings/seo, settings/ads, settings/community,
 *   settings/maintenance, settings/announcement,
 *   menu/{menuId}, categories/{categoryId},
 *   categories/{categoryId}/versions/{versionId},
 *   categories/{categoryId}/versions/{versionId}/links/{linkId},
 *   social/{socialId}, analytics/{eventId}
 *
 * When Firebase credentials are not yet configured in firebase-config.js,
 * the service gracefully exposes the seed schema without inventing fake URLs.
 */

import { FIREBASE_CONFIG, FIRESTORE_DATABASE_ID, isFirebaseConfigured } from "./firebase-config.js";

// Sample Seed Data (used only before Firestore is populated/configured)
export const SEED_DATA = {
  publicSettings: {
    siteName: "FAHAD DEV",
    heroBadge: "WELCOME TO DEVELOPER WEBSITE",
    heroTitle: "FAHAD DEV",
    heroSubtitle: "Creative Developer • Video Creator",
    heroVideoTitle: "WATCH THIS VIDEO",
    heroVideoUrl: "", // Admin configures real YouTube URL in settings/public
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
    textEn: "New V16.0 developer resource slots are live — real-time Firestore ready!",
    textBn: "নতুন V16.0 ডেভেলপার রিসোর্স স্লট এখন লাইভ — রিয়েল-টাইম Firestore প্রস্তুত!"
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
      descEn: "Automated Telegram & Discord workflow bots with webhook and Firestore support.",
      descBn: "ওয়েবহুক ও ফায়ারস্টোর সাপোর্টসহ অটোমেটেড টেলিগ্রাম ও ডিসকর্ড বট সিস্টেম।",
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
      descEn: "Hardened Firestore security rules, URL sanitizers, and defensive web audits.",
      descBn: "সুরক্ষিত Firestore সিকিউরিটি রুলস, URL ভ্যালিডেশন ও ওয়েব সিকিউরিটি গাইড।",
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
    notesEn: `Sample seed release ${tag}. Connect Firestore to manage live release notes & verified URLs.`,
    notesBn: `স্যাম্পল সিড রিলিজ ${tag}। লাইভ লিংক ও নোট ম্যানেজ করতে Firestore সংযুক্ত করুন।`,
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

/**
 * Validates that a URL uses http: or https: and is not a dangerous protocol.
 */
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

export class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.firestoreMod = null;
    this.isLive = false;
    this.unsubscribers = [];
    this.modalUnsubscribers = [];
  }

  async init(handlers) {
    if (!isFirebaseConfigured()) {
      console.info("[FAHAD DEV] Firebase credentials not yet configured; running in Seed Mode.");
      this.isLive = false;
      this.emitSeedState(handlers);
      return { live: false };
    }

    try {
      const [appMod, fsMod, authMod] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js")
      ]);

      this.firestoreMod = fsMod;
      this.app = appMod.initializeApp(FIREBASE_CONFIG);
      this.db = FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== "(default)"
        ? fsMod.getFirestore(this.app, FIRESTORE_DATABASE_ID)
        : fsMod.getFirestore(this.app);
      this.auth = authMod.getAuth(this.app);
      this.isLive = true;

      this.attachCoreListeners(handlers);
      return { live: true };
    } catch (error) {
      console.error("[FAHAD DEV] Firebase initialization error:", error);
      this.isLive = false;
      handlers.onError?.(error);
      this.emitSeedState(handlers);
      return { live: false, error };
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

  attachCoreListeners(handlers) {
    const { doc, collection, query, orderBy, onSnapshot } = this.firestoreMod;

    const watchDoc = (pathSegments, fallback, cb) => {
      const ref = doc(this.db, ...pathSegments);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          cb(snap.exists() ? { ...fallback, ...snap.data() } : fallback);
        },
        (err) => {
          console.warn(`[Firestore] Listener error on ${pathSegments.join("/")}:`, err);
          cb(fallback);
        }
      );
      this.unsubscribers.push(unsub);
    };

    watchDoc(["settings", "public"], SEED_DATA.publicSettings, (d) => handlers.onPublicSettings?.(d));
    watchDoc(["settings", "seo"], SEED_DATA.seo, (d) => handlers.onSeo?.(d));
    watchDoc(["settings", "ads"], SEED_DATA.ads, (d) => handlers.onAds?.(d));
    watchDoc(["settings", "community"], SEED_DATA.community, (d) => handlers.onCommunity?.(d));
    watchDoc(["settings", "maintenance"], SEED_DATA.maintenance, (d) => handlers.onMaintenance?.(d));
    watchDoc(["settings", "announcement"], SEED_DATA.announcement, (d) => handlers.onAnnouncement?.(d));

    const watchCol = (colName, fallback, cb) => {
      const q = query(collection(this.db, colName), orderBy("order", "asc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          if (snap.empty) {
            cb(fallback);
            return;
          }
          const items = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((item) => item.enabled !== false && item.published !== false);
          cb(items);
        },
        (err) => {
          console.warn(`[Firestore] Collection listener error on ${colName}:`, err);
          handlers.onError?.(err);
          cb(fallback);
        }
      );
      this.unsubscribers.push(unsub);
    };

    watchCol("menu", SEED_DATA.menu, (items) => handlers.onMenu?.(items));
    watchCol("social", SEED_DATA.social, (items) => handlers.onSocial?.(items));
    watchCol("categories", SEED_DATA.categories, (items) => handlers.onCategories?.(items));
  }

  /**
   * Real-time listener for versions inside a category.
   */
  subscribeVersions(categoryId, onUpdate, onError) {
    this.clearModalListeners();

    if (!this.isLive || !this.db) {
      onUpdate(SEED_DATA.seedVersions);
      return;
    }

    const { collection, query, orderBy, onSnapshot } = this.firestoreMod;
    const q = query(
      collection(this.db, "categories", categoryId, "versions"),
      orderBy("order", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          onUpdate([]);
          return;
        }
        const versions = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((v) => v.published !== false);
        onUpdate(versions);
      },
      (err) => {
        console.warn("[Firestore] Versions listener error:", err);
        onError?.(err);
      }
    );

    this.modalUnsubscribers.push(unsub);
  }

  /**
   * Real-time listener for links inside a version.
   */
  subscribeVersionLinks(categoryId, versionId, onUpdate, onError) {
    if (!this.isLive || !this.db) {
      onUpdate(SEED_DATA.seedLinkProviders);
      return;
    }

    const { collection, query, orderBy, onSnapshot } = this.firestoreMod;
    const q = query(
      collection(this.db, "categories", categoryId, "versions", versionId, "links"),
      orderBy("order", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const links = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((l) => l.enabled !== false);
        onUpdate(links);
      },
      (err) => {
        console.warn("[Firestore] Links listener error:", err);
        onError?.(err);
      }
    );

    this.modalUnsubscribers.push(unsub);
  }

  /**
   * Records an append-only analytics event in Firestore (protected by firestore.rules).
   * Public users never mutate categories/versions documents directly.
   */
  async trackEvent({ type, categoryId, versionId = null, linkId = null }) {
    const localKey = `fahad_dev_clicks_${categoryId}_${versionId || "cat"}`;
    const prev = Number(localStorage.getItem(localKey) || "0");
    localStorage.setItem(localKey, String(prev + 1));

    if (!this.isLive || !this.db) return prev + 1;

    try {
      const { collection, addDoc, serverTimestamp } = this.firestoreMod;
      const payload = {
        type,
        categoryId: String(categoryId).slice(0, 80),
        platform: "web",
        createdAt: serverTimestamp()
      };
      if (versionId) payload.versionId = String(versionId).slice(0, 80);
      if (linkId) payload.linkId = String(linkId).slice(0, 80);

      await addDoc(collection(this.db, "analytics"), payload);
    } catch (err) {
      // Non-blocking analytics failure
      console.debug("[Analytics] Event skipped:", err?.message || err);
    }
    return prev + 1;
  }

  getLocalDownloadCount(categoryId, versionId, baseDownloads = 0) {
    const localKey = `fahad_dev_clicks_${categoryId}_${versionId}`;
    const localClicks = Number(localStorage.getItem(localKey) || "0");
    return Number(baseDownloads || 0) + localClicks;
  }

  clearModalListeners() {
    while (this.modalUnsubscribers.length) {
      const fn = this.modalUnsubscribers.pop();
      try { fn(); } catch {}
    }
  }

  destroy() {
    this.clearModalListeners();
    while (this.unsubscribers.length) {
      const fn = this.unsubscribers.pop();
      try { fn(); } catch {}
    }
  }
}

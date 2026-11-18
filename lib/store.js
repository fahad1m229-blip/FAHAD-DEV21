/**
 * FAHAD DEV — Server-Side Persistent JSON Store
 * Replaces cloud Firestore so User Panel and Single-Admin Dashboard share live dynamic state.
 */

import fs from "node:fs/promises";
import path from "node:path";

export function createInitialSeedData() {
  const seedVersions = ["V11.0", "V11.5", "V12.0", "V13.0", "V14.0", "V15.0", "V16.0"].map((tag, idx) => ({
    id: tag.toLowerCase().replace(".", "-"),
    version: tag,
    name: tag,
    order: idx + 1,
    titleEn: `${tag} Release Build`,
    titleBn: `${tag} রিলিজ বিল্ড`,
    notesEn: `Release ${tag} build ready. Manage release notes & verified URLs from Admin Dashboard.`,
    notesBn: `রিলিজ ${tag}। অ্যাডমিন ড্যাশবোর্ড থেকে লিংক ও নোট পরিচালনা করুন।`,
    isNew: tag === "V16.0",
    isPopular: tag === "V15.0" || tag === "V16.0",
    downloads: 0,
    published: true,
    visible: true,
    links: [
      { id: "render", type: "render", label: "Render", order: 1, url: "", enabled: true },
      { id: "github", type: "github", label: "GitHub", order: 2, url: "", enabled: true },
      { id: "netlify", type: "netlify", label: "Netlify", order: 3, url: "", enabled: true },
      { id: "postimages", type: "postimages", label: "Postimages", order: 4, url: "", enabled: true },
      { id: "download", type: "download", label: "Download Main File", order: 5, url: "", enabled: true },
      { id: "youtube", type: "youtube", label: "YouTube Tutorial", order: 6, url: "", enabled: true }
    ]
  }));

  const categories = [
    {
      id: "free-website",
      number: "01",
      order: 1,
      ribbon: "WEB",
      icon: "web",
      title: "Free Website",
      titleEn: "Free Website",
      titleBn: "ফ্রি ওয়েবসাইট",
      descEn: "Responsive 3D glassmorphism templates, portfolios, and static deployment kits.",
      descBn: "রেসপন্সিভ ৩ডি গ্লাসমরফিজম টেমপ্লেট, পোর্টফোলিও এবং স্ট্যাটিক ডিপ্লয়মেন্ট কিট।",
      isNew: true,
      isPopular: true,
      visible: true,
      published: true,
      versions: structuredClone(seedVersions)
    },
    {
      id: "apk-building",
      number: "02",
      order: 2,
      ribbon: "APK",
      icon: "apk",
      title: "APK Building",
      titleEn: "APK Building",
      titleBn: "APK বিল্ডিং",
      descEn: "Modern Android Kotlin & Web-to-APK project structures with clean Material 3 UI.",
      descBn: "মডার্ন অ্যান্ড্রয়েড কটলিন এবং ম্যাটেরিয়াল ৩ ইউআই ভিত্তিক APK বিল্ড প্রজেক্ট।",
      isNew: false,
      isPopular: true,
      visible: true,
      published: true,
      versions: structuredClone(seedVersions)
    },
    {
      id: "bot-making",
      number: "03",
      order: 3,
      ribbon: "BOT",
      icon: "bot",
      title: "Bot Making",
      titleEn: "Bot Making",
      titleBn: "বট মেকিং",
      descEn: "Automated Telegram & Discord workflow bots with webhook and server support.",
      descBn: "ওয়েবহুক ও সার্ভার সাপোর্টসহ অটোমেটেড টেলিগ্রাম ও ডিসকর্ড বট সিস্টেম।",
      isNew: true,
      isPopular: false,
      visible: true,
      published: true,
      versions: structuredClone(seedVersions)
    },
    {
      id: "security",
      number: "04",
      order: 4,
      ribbon: "SEC",
      icon: "security",
      title: "Security",
      titleEn: "Security",
      titleBn: "সিকিউরিটি",
      descEn: "Hardened server authentication, URL sanitizers, and defensive web audits.",
      descBn: "সুরক্ষিত সার্ভার অথেনটিকেশন, URL ভ্যালিডেশন ও ওয়েব সিকিউরিটি গাইড।",
      isNew: false,
      isPopular: false,
      visible: true,
      published: true,
      versions: structuredClone(seedVersions)
    },
    {
      id: "api-key",
      number: "05",
      order: 5,
      ribbon: "API",
      icon: "api",
      title: "API Key",
      titleEn: "API Key",
      titleBn: "API কী",
      descEn: "REST & JSON integration blueprints, proxy patterns, and token management tools.",
      descBn: "REST ও JSON ইন্টিগ্রেশন ব্লুপ্রিন্ট, প্রক্সি প্যাটার্ন এবং কী ম্যানেজমেন্ট টুলস।",
      isNew: false,
      isPopular: true,
      visible: true,
      published: true,
      versions: structuredClone(seedVersions)
    },
    {
      id: "review-project",
      number: "06",
      order: 6,
      ribbon: "REV",
      icon: "review",
      title: "Review Project",
      titleEn: "Review Project",
      titleBn: "রিভিউ প্রজেক্ট",
      descEn: "Featured community builds, code walkthroughs, and benchmark showcase projects.",
      descBn: "কমিউনিটি প্রজেক্ট রিভিউ, কোড ওয়াকথ্রু এবং পারফরম্যান্স শোকেস প্রজেক্ট।",
      isNew: false,
      isPopular: false,
      visible: true,
      published: true,
      versions: structuredClone(seedVersions)
    },
    {
      id: "pc-tools",
      number: "07",
      order: 7,
      ribbon: "PC",
      icon: "pc",
      title: "PC Tools",
      titleEn: "PC Tools",
      titleBn: "পিসি টুলস",
      descEn: "Developer CLI utilities, Windows productivity scripts, and environment helpers.",
      descBn: "ডেভেলপার CLI ইউটিলিটি, উইন্ডোজ প্রোডাক্টিভিটি স্ক্রিপ্ট ও সেটআপ টুলস।",
      isNew: true,
      isPopular: false,
      visible: true,
      published: true,
      versions: structuredClone(seedVersions)
    }
  ];

  return {
    settings: {
      site: {
        siteName: "FAHAD DEV",
        logo: "./assets/img/logo.svg",
        favicon: "./assets/img/favicon.png",
        title: "FAHAD DEV — Futuristic 3D Developer Portfolio & Resource Hub",
        description: "Explore free website templates, APK builds, bots, security guides, API tools, review projects, and PC utilities by FAHAD DEV.",
        theme: "dark",
        font: "Orbitron + Inter",
        verifiedBadge: true,
        footer: "Futuristic 3D Developer Portfolio & Resource Ecosystem.",
        copyright: "© 2026 FAHAD DEV",
        primaryColor: "#3B6CFF",
        violetColor: "#8B5CF6",
        goldColor: "#F5C451",
        backgroundColor: "#05070F",
        customCss: "",
        customJs: "",
        maintenance: false,
        animations: true
      },
      public: {
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
        description: "Explore free website templates, APK builds, bots, security guides, API tools, review projects, and PC utilities by FAHAD DEV.",
        ogImage: "./assets/img/og-banner.svg"
      },
      announcement: {
        enabled: true,
        textEn: "New V16.0 developer resource slots are live — real-time server sync ready!",
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
      }
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
    categories,
    users: [],
    adminProfile: {
      name: "FAHAD",
      avatar: "",
      role: "owner"
    },
    stats: {},
    logs: []
  };
}

export class SiteDataStore {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.resolve(process.cwd(), "data");
    this.dataFile = path.join(this.dataDir, "site-data.json");
    this.data = null;
    this._writeQueue = Promise.resolve();
  }

  async init() {
    if (this.data) return this.data;
    try {
      const raw = await fs.readFile(this.dataFile, "utf8");
      this.data = JSON.parse(raw);
    } catch {
      this.data = createInitialSeedData();
      await this.persist();
    }
    return this.data;
  }

  async persist() {
    this._writeQueue = this._writeQueue.then(async () => {
      await fs.mkdir(this.dataDir, { recursive: true });
      const tmp = `${this.dataFile}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(this.data, null, 2));
      await fs.rename(tmp, this.dataFile);
    });
    return this._writeQueue;
  }

  async getPublicBootstrap() {
    await this.init();
    const today = new Date().toISOString().slice(0, 10);
    if (!this.data.stats[today]) {
      this.data.stats[today] = { visits: 0, views: 0, clicks: 0, downloads: 0 };
    }
    this.data.stats[today].visits += 1;
    await this.persist();

    const s = this.data.settings;
    return {
      publicSettings: {
        ...s.public,
        siteName: s.site?.siteName || s.public?.siteName || "FAHAD DEV"
      },
      seo: {
        ...s.seo,
        title: s.site?.title || s.seo?.title,
        description: s.site?.description || s.seo?.description
      },
      ads: s.ads,
      community: s.community,
      maintenance: {
        ...s.maintenance,
        enabled: Boolean(s.maintenance?.enabled ?? s.site?.maintenance)
      },
      announcement: s.announcement,
      menu: [...(this.data.menu || [])]
        .filter((m) => m.enabled !== false && m.visible !== false)
        .sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999)),
      social: [...(this.data.social || [])]
        .filter((item) => item.enabled !== false)
        .sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999)),
      categories: [...(this.data.categories || [])]
        .filter((c) => c.published !== false && c.visible !== false)
        .sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999))
        .map(({ versions, ...rest }) => rest)
    };
  }

  async getPublicVersions(categoryId) {
    await this.init();
    const cat = (this.data.categories || []).find(
      (c) => c.id === categoryId && c.published !== false && c.visible !== false
    );
    if (!cat) return [];
    return [...(cat.versions || [])]
      .filter((v) => v.published !== false && v.visible !== false)
      .sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999))
      .map(({ links, ...rest }) => rest);
  }

  async getPublicLinks(categoryId, versionId) {
    await this.init();
    const cat = (this.data.categories || []).find(
      (c) => c.id === categoryId && c.published !== false && c.visible !== false
    );
    const ver = cat?.versions?.find(
      (v) => v.id === versionId && v.published !== false && v.visible !== false
    );
    if (!ver) return [];
    return [...(ver.links || [])]
      .filter((l) => l.enabled !== false && l.active !== false)
      .sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999));
  }

  async recordPublicAnalytics({ type, categoryId, versionId }) {
    await this.init();
    const today = new Date().toISOString().slice(0, 10);
    if (!this.data.stats[today]) {
      this.data.stats[today] = { visits: 0, views: 0, clicks: 0, downloads: 0 };
    }
    if (type === "view_category" || type === "view_version") {
      this.data.stats[today].views += 1;
    } else if (type === "download_click") {
      this.data.stats[today].clicks += 1;
      this.data.stats[today].downloads += 1;
      const cat = (this.data.categories || []).find((c) => c.id === categoryId);
      const ver = cat?.versions?.find((v) => v.id === versionId);
      if (ver) ver.downloads = Number(ver.downloads || 0) + 1;
    } else if (type === "share_click") {
      this.data.stats[today].clicks += 1;
    }
    await this.persist();
  }

  addLog(adminEmail, action, before = {}, after = {}) {
    this.data.logs = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        admin: adminEmail,
        action,
        before,
        after,
        time: new Date().toISOString()
      },
      ...(this.data.logs || [])
    ].slice(0, 50);
  }

  async getOverview() {
    await this.init();
    const cats = [...(this.data.categories || [])].sort(
      (a, b) => Number(a.order ?? 999) - Number(b.order ?? 999)
    );
    let totalVersions = 0;
    let totalLinks = 0;
    const mappedCats = cats.map((c) => {
      const vers = Array.isArray(c.versions) ? c.versions : [];
      totalVersions += vers.length;
      for (const v of vers) {
        totalLinks += Array.isArray(v.links) ? v.links.length : 0;
      }
      return {
        id: c.id,
        title: c.title || c.titleEn || c.id,
        titleEn: c.titleEn,
        icon: c.icon,
        _versionCount: vers.length
      };
    });

    const users = this.data.users || [];
    const activeUsers = users.filter((u) => u.active !== false && u.status !== "blocked").length;
    const statsDocs = Object.entries(this.data.stats || {})
      .map(([day, vals]) => ({ day, ...vals }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-30);

    return {
      totalUsers: users.length,
      activeUsers,
      totalAdmins: 1,
      categories: mappedCats,
      totalVersions,
      totalLinks,
      statsDocs,
      logs: (this.data.logs || []).slice(0, 10),
      siteSettings: this.data.settings?.site || {},
      maintenance: this.data.settings?.maintenance || {}
    };
  }

  async getUsers() {
    await this.init();
    return [...(this.data.users || [])];
  }

  async toggleUserStatus(uid, active, adminEmail) {
    await this.init();
    const user = (this.data.users || []).find((u) => u.uid === uid);
    if (!user) return null;
    const prev = user.active !== false;
    user.active = Boolean(active);
    user.status = user.active ? "active" : "blocked";
    user.updatedAt = new Date().toISOString();
    this.addLog(adminEmail, user.active ? "ENABLE_USER" : "DISABLE_USER", { uid, active: prev }, { uid, active: user.active });
    await this.persist();
    return user;
  }

  async getAdminProfile(adminEmail) {
    await this.init();
    return {
      uid: "single-admin",
      role: "owner",
      email: adminEmail,
      name: this.data.adminProfile?.name || "FAHAD",
      avatar: this.data.adminProfile?.avatar || ""
    };
  }

  async updateAdminProfile(adminEmail, { name, avatar }) {
    await this.init();
    this.data.adminProfile = {
      role: "owner",
      name: String(name || "FAHAD").trim().slice(0, 80),
      avatar: String(avatar || "").trim().slice(0, 300)
    };
    this.addLog(adminEmail, "UPDATE_ADMIN_PROFILE", {}, { name: this.data.adminProfile.name });
    await this.persist();
    return this.getAdminProfile(adminEmail);
  }

  async getCategories() {
    await this.init();
    return [...(this.data.categories || [])]
      .sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999))
      .map(({ versions, ...rest }) => ({
        ...rest,
        versionCount: Array.isArray(versions) ? versions.length : 0
      }));
  }

  async upsertCategory(payload, adminEmail) {
    await this.init();
    const cleanId = String(payload.id || "").trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (!cleanId || !String(payload.titleEn || "").trim()) {
      throw new Error("Category ID and Title are required.");
    }
    const idx = (this.data.categories || []).findIndex((c) => c.id === cleanId);
    const existing = idx >= 0 ? this.data.categories[idx] : null;
    const record = {
      id: cleanId,
      number: existing?.number || String((this.data.categories?.length || 0) + 1).padStart(2, "0"),
      order: Number(payload.order) || 1,
      ribbon: String(payload.ribbon || "DEV").trim().toUpperCase().slice(0, 10),
      icon: existing?.icon || "web",
      title: String(payload.titleEn).trim(),
      titleEn: String(payload.titleEn).trim(),
      titleBn: String(payload.titleBn || payload.titleEn).trim(),
      descEn: String(payload.descEn || "").trim(),
      descBn: String(payload.descEn || "").trim(),
      isNew: Boolean(payload.isNew),
      isPopular: Boolean(payload.isPopular),
      visible: Boolean(payload.visible),
      published: Boolean(payload.visible),
      updatedAt: new Date().toISOString(),
      versions: existing?.versions || []
    };

    if (idx >= 0) {
      this.data.categories[idx] = record;
    } else {
      this.data.categories.push(record);
    }
    this.addLog(adminEmail, "SAVE_CATEGORY", {}, { id: cleanId, title: record.titleEn });
    await this.persist();
    return record;
  }

  async deleteCategory(catId, adminEmail) {
    await this.init();
    const before = (this.data.categories || []).length;
    this.data.categories = (this.data.categories || []).filter((c) => c.id !== catId);
    if (this.data.categories.length === before) return false;
    this.addLog(adminEmail, "DELETE_CATEGORY", { id: catId }, {});
    await this.persist();
    return true;
  }

  async getCategoryVersions(catId) {
    await this.init();
    const cat = (this.data.categories || []).find((c) => c.id === catId);
    if (!cat) return null;
    return [...(cat.versions || [])].sort(
      (a, b) => Number(a.order ?? 999) - Number(b.order ?? 999)
    );
  }

  async upsertVersion(catId, payload, adminEmail) {
    await this.init();
    const cat = (this.data.categories || []).find((c) => c.id === catId);
    if (!cat) return null;
    const cleanVer = String(payload.versionTag || "").trim();
    if (!cleanVer) throw new Error("Version tag is required.");
    const verId = cleanVer.toLowerCase().replace(/[^a-z0-9-_]/g, "-");

    if (!Array.isArray(cat.versions)) cat.versions = [];
    const idx = cat.versions.findIndex((v) => v.id === verId);
    const existing = idx >= 0 ? cat.versions[idx] : null;
    const links = existing?.links ? [...existing.links] : [];

    const upsertLink = (id, type, label, url, order) => {
      if (!url) return;
      const lIdx = links.findIndex((l) => l.id === id);
      const item = { id, type, label, url, order, enabled: true, active: true };
      if (lIdx >= 0) links[lIdx] = item;
      else links.push(item);
    };

    if (payload.downloadUrl) upsertLink("download", "download", "Download Main File", payload.downloadUrl, 1);
    if (payload.youtubeUrl) upsertLink("youtube", "youtube", "YouTube Tutorial", payload.youtubeUrl, 2);

    const record = {
      id: verId,
      version: cleanVer,
      name: cleanVer,
      order: Number(payload.order) || 1,
      titleEn: `${cleanVer} Release Build`,
      titleBn: `${cleanVer} রিলিজ বিল্ড`,
      notesEn: String(payload.notesEn || "").trim(),
      notesBn: String(payload.notesEn || "").trim(),
      visible: true,
      published: true,
      isNew: true,
      downloads: existing?.downloads || 0,
      updatedAt: new Date().toISOString(),
      links
    };

    if (idx >= 0) cat.versions[idx] = record;
    else cat.versions.push(record);

    this.addLog(adminEmail, "SAVE_VERSION", {}, { categoryId: catId, version: cleanVer });
    await this.persist();
    return record;
  }

  async deleteVersion(catId, verId, adminEmail) {
    await this.init();
    const cat = (this.data.categories || []).find((c) => c.id === catId);
    if (!cat || !Array.isArray(cat.versions)) return false;
    const before = cat.versions.length;
    cat.versions = cat.versions.filter((v) => v.id !== verId);
    if (cat.versions.length === before) return false;
    this.addLog(adminEmail, "DELETE_VERSION", { categoryId: catId, versionId: verId }, {});
    await this.persist();
    return true;
  }

  async getSiteSettings() {
    await this.init();
    return {
      ...(this.data.settings?.site || {}),
      maintenance: Boolean(this.data.settings?.maintenance?.enabled ?? this.data.settings?.site?.maintenance)
    };
  }

  async updateSiteSettings(payload, adminEmail) {
    await this.init();
    const prev = this.data.settings?.site || {};
    const nextSite = {
      ...prev,
      siteName: String(payload.siteName ?? prev.siteName ?? "FAHAD DEV").slice(0, 80),
      logo: String(payload.logo ?? prev.logo ?? "./assets/img/logo.svg").slice(0, 300),
      favicon: String(payload.favicon ?? prev.favicon ?? "./assets/img/favicon.png").slice(0, 300),
      title: String(payload.title ?? prev.title ?? "").slice(0, 160),
      description: String(payload.description ?? prev.description ?? "").slice(0, 400),
      theme: payload.theme === "light" ? "light" : "dark",
      font: String(payload.font ?? prev.font ?? "Orbitron + Inter").slice(0, 80),
      verifiedBadge: Boolean(payload.verifiedBadge),
      footer: String(payload.footer ?? prev.footer ?? "").slice(0, 240),
      copyright: String(payload.copyright ?? prev.copyright ?? "").slice(0, 120),
      primaryColor: String(payload.primaryColor ?? prev.primaryColor ?? "#3B6CFF").slice(0, 20),
      violetColor: String(payload.violetColor ?? prev.violetColor ?? "#8B5CF6").slice(0, 20),
      goldColor: String(payload.goldColor ?? prev.goldColor ?? "#F5C451").slice(0, 20),
      backgroundColor: String(payload.backgroundColor ?? prev.backgroundColor ?? "#05070F").slice(0, 20),
      customCss: String(payload.customCss ?? prev.customCss ?? "").slice(0, 10000),
      customJs: String(payload.customJs ?? prev.customJs ?? "").slice(0, 10000),
      maintenance: Boolean(payload.maintenance),
      animations: Boolean(payload.animations),
      updatedAt: new Date().toISOString()
    };

    this.data.settings.site = nextSite;
    this.data.settings.maintenance = {
      ...(this.data.settings.maintenance || {}),
      enabled: Boolean(payload.maintenance)
    };
    this.addLog(
      adminEmail,
      "PUBLISH_SITE_SETTINGS",
      { siteName: prev.siteName, maintenance: Boolean(prev.maintenance) },
      { siteName: nextSite.siteName, maintenance: Boolean(nextSite.maintenance) }
    );
    await this.persist();
    return nextSite;
  }
}

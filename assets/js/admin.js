/**
 * FAHAD DEV Admin — Main Application Controller (Phase 1)
 */

import { initThreeBackground } from "./three-background.js";
import { AdminAuthService } from "./admin-auth.js";
import { AdminDashboardModule } from "./admin-dashboard.js";
import { AdminSettingsModule } from "./admin-settings.js";
import { ADMIN_I18N, escapeHtml, openConfirmModal, showAdminToast } from "./admin-ui.js";

const STORAGE = {
  theme: "fahad_admin_theme",
  lang: "fahad_admin_lang",
  inactivityMin: "fahad_admin_inactivity_min"
};

const SIDEBAR_ITEMS = [
  { id: "dashboard", i18n: "dashboard", phase: 1, icon: "grid" },
  { id: "siteSettings", i18n: "siteSettings", phase: 1, icon: "sliders" },
  { id: "heroContent", i18n: "heroContent", phase: 2, icon: "sparkles", collection: "settings/hero" },
  { id: "categories", i18n: "categories", phase: 2, icon: "folder", collection: "categories/{id}" },
  { id: "versionsLinks", i18n: "versionsLinks", phase: 2, icon: "layers", collection: "categories/{id}/versions/{vid}" },
  { id: "menuManager", i18n: "menuManager", phase: 3, icon: "list", collection: "menu/{id}" },
  { id: "adsManager", i18n: "adsManager", phase: 3, icon: "megaphone", collection: "settings/ads" },
  { id: "communityPopup", i18n: "communityPopup", phase: 3, icon: "users", collection: "settings/community" },
  { id: "announcement", i18n: "announcement", phase: 3, icon: "bell", collection: "settings/announcement" },
  { id: "socialLinks", i18n: "socialLinks", phase: 3, icon: "share", collection: "settings/social" },
  { id: "analytics", i18n: "analytics", phase: 4, icon: "chart", collection: "stats/{day}" },
  { id: "adminUsers", i18n: "adminUsers", phase: 4, icon: "shield", collection: "admins/{uid}" },
  { id: "backupLogs", i18n: "backupLogs", phase: 4, icon: "database", collection: "logs/{id}" },
  { id: "seo", i18n: "seo", phase: 4, icon: "globe", collection: "settings/seo" }
];

const authService = new AdminAuthService();

const state = {
  theme: localStorage.getItem(STORAGE.theme) === "light" ? "light" : "dark",
  lang: localStorage.getItem(STORAGE.lang) === "bn" ? "bn" : "en",
  activeSection: "dashboard",
  adminProfile: null,
  currentUser: null,
  activeModule: null
};

const dashboardMod = new AdminDashboardModule(
  authService,
  () => state.lang,
  (sec) => navigateTo(sec)
);
const settingsMod = new AdminSettingsModule(
  authService,
  () => state.adminProfile,
  () => state.lang
);

function t(key) {
  return ADMIN_I18N[state.lang]?.[key] ?? ADMIN_I18N.en[key] ?? key;
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE.theme, theme);
}

function applyLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = lang === "bn" ? "bn" : "en";
  localStorage.setItem(STORAGE.lang, lang);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  const langBtn = document.getElementById("admin-lang-label");
  if (langBtn) langBtn.textContent = lang === "bn" ? "EN" : "বাং";

  renderSidebar();
  renderSection();
}

function getNavIcon(name) {
  const icons = {
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>`,
    folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg>`,
    megaphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
    globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  };
  return icons[name] || icons.grid;
}

function renderSidebar() {
  const nav = document.getElementById("admin-sidebar-nav");
  if (!nav) return;

  nav.innerHTML = SIDEBAR_ITEMS.map((item) => {
    const active = state.activeSection === item.id ? "active" : "";
    const phaseBadge = item.phase > 1 ? `<span class="phase-tag">P${item.phase}</span>` : "";
    return `
      <button type="button" class="nav-item ${active}" data-section="${item.id}">
        <span class="nav-item-left">
          ${getNavIcon(item.icon)}
          <span>${escapeHtml(t(item.i18n))}</span>
        </span>
        ${phaseBadge}
      </button>
    `;
  }).join("");

  document.querySelectorAll(".bottom-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === state.activeSection);
  });
}

async function navigateTo(sectionId) {
  if (state.activeSection === "siteSettings" && settingsMod.hasUnsavedChanges && sectionId !== "siteSettings") {
    const ok = await openConfirmModal({
      title: t("siteSettings"),
      message: t("unsavedPrompt"),
      confirmLabel: state.lang === "bn" ? "চলে যান" : "Leave",
      cancelLabel: state.lang === "bn" ? "থাকুন" : "Stay"
    });
    if (!ok) return;
  }

  state.activeSection = sectionId;
  closeMobileDrawer();
  renderSidebar();
  renderSection();
}

function renderSection() {
  const container = document.getElementById("admin-view-container");
  const titleEl = document.getElementById("admin-page-title");
  if (!container) return;

  const item = SIDEBAR_ITEMS.find((i) => i.id === state.activeSection) || SIDEBAR_ITEMS[0];
  if (titleEl) titleEl.textContent = t(item.i18n);

  if (state.activeModule) {
    state.activeModule.unmount();
    state.activeModule = null;
  }

  if (item.id === "dashboard") {
    state.activeModule = dashboardMod;
    dashboardMod.mount(container);
    return;
  }

  if (item.id === "siteSettings") {
    state.activeModule = settingsMod;
    settingsMod.mount(container);
    return;
  }

  const isBn = state.lang === "bn";
  container.innerHTML = `
    <div class="glass-card panel-card">
      <div class="panel-head">
        <h2>${escapeHtml(t(item.i18n))}</h2>
        <span class="role-pill">Phase ${item.phase}</span>
      </div>
      <p style="margin:0;color:var(--muted);">
        ${escapeHtml(t("phaseLockedMsg"))}
      </p>
      <div class="activity-row">
        <span>${isBn ? "লক্ষ্য Firestore পাথ" : "Target Firestore Path"}</span>
        <code style="color:var(--cyan);">${escapeHtml(item.collection || "")}</code>
      </div>
      <div>
        <button type="button" class="btn btn-primary btn-sm" id="back-to-dash-btn">
          ← ${escapeHtml(t("dashboard"))}
        </button>
      </div>
    </div>
  `;
  container.querySelector("#back-to-dash-btn")?.addEventListener("click", () => navigateTo("dashboard"));
}

function renderProfileHeader() {
  const p = state.adminProfile;
  if (!p) return;
  const initials = (p.name || p.email || "A").slice(0, 2).toUpperCase();
  const avatarSlot = document.getElementById("header-avatar-slot");
  if (avatarSlot) {
    avatarSlot.innerHTML = p.avatar
      ? `<img src="${escapeHtml(p.avatar)}" alt="${escapeHtml(p.name)}" class="avatar-circle" />`
      : `<div class="avatar-circle">${escapeHtml(initials)}</div>`;
  }
  const roleBadge = document.getElementById("sidebar-role-badge");
  if (roleBadge) roleBadge.textContent = p.role;
  const dropName = document.getElementById("profile-drop-name");
  const dropEmail = document.getElementById("profile-drop-email");
  const dropRole = document.getElementById("profile-drop-role");
  if (dropName) dropName.textContent = p.name;
  if (dropEmail) dropEmail.textContent = p.email;
  if (dropRole) dropRole.textContent = `Role: ${p.role.toUpperCase()}`;
}

function closeMobileDrawer() {
  document.getElementById("admin-sidebar")?.classList.remove("open");
  const bd = document.getElementById("sidebar-backdrop");
  if (bd) bd.hidden = true;
}

function setupLoginForm() {
  const form = document.getElementById("admin-login-form");
  const emailIn = document.getElementById("login-email");
  const passIn = document.getElementById("login-password");
  const rememberChk = document.getElementById("login-remember");
  const submitBtn = document.getElementById("login-submit-btn");
  const alertBox = document.getElementById("login-alert");

  const showAlert = (msg, isInfo = false) => {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `auth-alert ${isInfo ? "info" : ""}`;
    alertBox.hidden = false;
  };

  document.getElementById("toggle-password-btn")?.addEventListener("click", () => {
    if (!passIn) return;
    passIn.type = passIn.type === "password" ? "text" : "password";
  });

  document.getElementById("forgot-password-btn")?.addEventListener("click", async () => {
    const email = emailIn?.value?.trim();
    if (!email) {
      showAlert(t("enterEmailFirst"));
      return;
    }
    const res = await authService.resetPassword(email, state.lang);
    if (res.ok) {
      showAlert(t("resetSent"), true);
    } else {
      showAlert(res.message);
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (alertBox) alertBox.hidden = true;

    const remaining = authService.getLockoutRemainingMs();
    if (remaining > 0) {
      showAlert(`${t("lockoutWait")} (${Math.ceil(remaining / 1000)}s)`);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = t("signingIn");

    const res = await authService.signIn(
      emailIn.value,
      passIn.value,
      Boolean(rememberChk?.checked),
      state.lang
    );

    submitBtn.disabled = false;
    submitBtn.textContent = t("signInBtn");

    if (!res.ok) {
      showAlert(res.reason === "not_admin" ? t("notAdminError") : res.message);
    }
  });
}

function setupShellInteractions() {
  // Sidebar & Mobile Drawer & Bottom Nav
  document.getElementById("admin-sidebar-nav")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-section]");
    if (btn) navigateTo(btn.dataset.section);
  });
  document.querySelectorAll(".bottom-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => navigateTo(btn.dataset.section));
  });

  document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
    document.getElementById("admin-sidebar")?.classList.add("open");
    const bd = document.getElementById("sidebar-backdrop");
    if (bd) bd.hidden = false;
  });
  document.getElementById("sidebar-backdrop")?.addEventListener("click", closeMobileDrawer);

  // Theme & Language Switches
  document.getElementById("admin-theme-btn")?.addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });
  document.getElementById("admin-lang-btn")?.addEventListener("click", () => {
    applyLanguage(state.lang === "en" ? "bn" : "en");
  });

  // Dropdowns (Profile & Three-dot Menu)
  const profileMenu = document.getElementById("profile-dropdown-menu");
  const threeDotMenu = document.getElementById("threedot-dropdown-menu");

  document.getElementById("profile-dropdown-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (threeDotMenu) threeDotMenu.hidden = true;
    if (profileMenu) profileMenu.hidden = !profileMenu.hidden;
  });

  document.getElementById("threedot-menu-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (profileMenu) profileMenu.hidden = true;
    if (threeDotMenu) threeDotMenu.hidden = !threeDotMenu.hidden;
  });

  document.addEventListener("click", () => {
    if (profileMenu) profileMenu.hidden = true;
    if (threeDotMenu) threeDotMenu.hidden = true;
  });

  // Three-dot Actions
  document.getElementById("td-refresh-btn")?.addEventListener("click", () => {
    if (state.activeSection === "dashboard") dashboardMod.refresh();
    showAdminToast(state.lang === "bn" ? "ডেটা রিফ্রেশ হয়েছে।" : "Data refreshed.", "success");
  });

  document.getElementById("td-clear-cache-btn")?.addEventListener("click", async () => {
    localStorage.removeItem("fahad_admin_site_settings_draft");
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    showAdminToast(state.lang === "bn" ? "ক্যাশ পরিষ্কার হয়েছে।" : "Cache cleared.", "success");
  });

  document.getElementById("td-maintenance-btn")?.addEventListener("click", () => {
    navigateTo("siteSettings");
  });
  document.getElementById("td-backup-btn")?.addEventListener("click", () => navigateTo("backupLogs"));
  document.getElementById("td-restore-btn")?.addEventListener("click", () => navigateTo("backupLogs"));
  document.getElementById("td-logs-btn")?.addEventListener("click", () => navigateTo("backupLogs"));

  document.getElementById("td-help-btn")?.addEventListener("click", () => {
    openConfirmModal({
      title: "FAHAD DEV Admin — Phase 1",
      message: state.lang === "bn"
        ? "Phase 1 এ Firebase Auth, admins/{uid} রোল যাচাই, ড্যাশবোর্ড এবং সাইট সেটিংস সক্রিয় আছে।"
        : "Phase 1 includes Firebase Auth, admins/{uid} role gating, Live Dashboard, and Site Settings.",
      confirmLabel: "OK",
      cancelLabel: "Close"
    });
  });

  document.getElementById("admin-notify-btn")?.addEventListener("click", () => {
    navigateTo("dashboard");
    showAdminToast(state.lang === "bn" ? "সাম্প্রতিক লগ ড্যাশবোর্ডে দেখুন।" : "View recent activity logs on Dashboard.", "info");
  });

  // Inactivity timeout selector
  const timeoutSel = document.getElementById("inactivity-timeout-select");
  if (timeoutSel) {
    timeoutSel.value = localStorage.getItem(STORAGE.inactivityMin) || "30";
    timeoutSel.addEventListener("change", () => {
      localStorage.setItem(STORAGE.inactivityMin, timeoutSel.value);
      authService.startInactivityWatcher(Number(timeoutSel.value), handleAutoLogout);
    });
  }

  // Logout Buttons
  const doLogout = async () => {
    await authService.signOut();
  };
  document.getElementById("profile-logout-btn")?.addEventListener("click", doLogout);
  document.getElementById("td-logout-btn")?.addEventListener("click", doLogout);
}

async function handleAutoLogout() {
  await authService.signOut();
  showAdminToast(t("autoLoggedOut"), "info");
}

async function bootstrap() {
  applyTheme(state.theme);
  applyLanguage(state.lang);
  setupLoginForm();
  setupShellInteractions();

  initThreeBackground(document.getElementById("admin-three-canvas"));

  const { configured } = await authService.init();
  const loginScreen = document.getElementById("admin-login-screen");
  const shellScreen = document.getElementById("admin-app-shell");
  const alertBox = document.getElementById("login-alert");

  if (!configured) {
    if (alertBox) {
      alertBox.textContent = t("firebaseNotConfigured");
      alertBox.className = "auth-alert info";
      alertBox.hidden = false;
    }
    return;
  }

  authService.onAuthChange((session) => {
    if (!session) {
      state.currentUser = null;
      state.adminProfile = null;
      if (state.activeModule) {
        state.activeModule.unmount();
        state.activeModule = null;
      }
      if (shellScreen) shellScreen.hidden = true;
      if (loginScreen) loginScreen.hidden = false;
      return;
    }

    if (session.unauthorized) {
      if (alertBox) {
        alertBox.textContent = t("notAdminError");
        alertBox.className = "auth-alert";
        alertBox.hidden = false;
      }
      if (shellScreen) shellScreen.hidden = true;
      if (loginScreen) loginScreen.hidden = false;
      return;
    }

    state.currentUser = session.user;
    state.adminProfile = session.adminProfile;
    if (loginScreen) loginScreen.hidden = true;
    if (shellScreen) shellScreen.hidden = false;

    renderProfileHeader();
    renderSidebar();
    renderSection();

    const mins = Number(localStorage.getItem(STORAGE.inactivityMin) || "30");
    authService.startInactivityWatcher(mins, handleAutoLogout);
  });
}

bootstrap();

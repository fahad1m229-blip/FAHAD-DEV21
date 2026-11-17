/**
 * FAHAD DEV — Hidden Admin Panel Controller & Protected Router (/FAHAD/admin)
 */

import { initThreeBackground } from "./three-background.js";
import { AdminAuthService } from "./admin-auth.js";
import { AdminDashboardModule } from "./admin-dashboard.js";
import { AdminSettingsModule } from "./admin-settings.js";
import { AdminUsersModule } from "./admin-users.js";
import { AdminContentModule } from "./admin-content.js";
import {
  ADMIN_I18N,
  escapeHtml,
  getAdminBasePath,
  getSiteRoot,
  openConfirmModal,
  showAdminToast
} from "./admin-ui.js";

const STORAGE = {
  theme: "fahad_admin_theme",
  lang: "fahad_admin_lang",
  inactivityMin: "fahad_admin_inactivity_min",
  pendingRoute: "fahad_pending_admin_route"
};

const ROUTES = {
  overview: { id: "overview", path: "overview", i18n: "overview", icon: "grid" },
  users: { id: "users", path: "users", i18n: "userManagement", icon: "users" },
  content: { id: "content", path: "content", i18n: "contentManagement", icon: "folder" },
  settings: { id: "settings", path: "settings", i18n: "siteSettings", icon: "sliders" },
  profile: { id: "profile", path: "profile", i18n: "adminProfile", icon: "shield" }
};

const authService = new AdminAuthService();

const state = {
  theme: localStorage.getItem(STORAGE.theme) === "light" ? "light" : "dark",
  lang: localStorage.getItem(STORAGE.lang) === "bn" ? "bn" : "en",
  activeRoute: "overview",
  adminProfile: null,
  currentUser: null,
  activeModule: null
};

const doLogout = async () => {
  await authService.signOut();
};

const dashboardMod = new AdminDashboardModule(
  authService,
  () => state.lang,
  (routeId) => navigateTo(routeId)
);
const usersMod = new AdminUsersModule(
  authService,
  () => state.adminProfile,
  () => state.lang,
  doLogout
);
const contentMod = new AdminContentModule(
  authService,
  () => state.adminProfile,
  () => state.lang
);
const settingsMod = new AdminSettingsModule(
  authService,
  () => state.adminProfile,
  () => state.lang
);

function t(key) {
  return ADMIN_I18N[state.lang]?.[key] ?? ADMIN_I18N.en[key] ?? key;
}

function getRequestedSubRoute() {
  const pending = sessionStorage.getItem(STORAGE.pendingRoute);
  if (pending) {
    sessionStorage.removeItem(STORAGE.pendingRoute);
    if (ROUTES[pending]) return pending;
  }

  const hash = window.location.hash.replace(/^#\/?/, "").trim();
  if (hash && ROUTES[hash]) return hash;

  const base = getAdminBasePath();
  const path = window.location.pathname;
  if (path.startsWith(base)) {
    const rest = path.slice(base.length).replace(/^\/+|\/+$/g, "");
    if (rest && ROUTES[rest]) return rest;
  }
  return null;
}

function syncBrowserUrl(routeOrLogin) {
  const base = getAdminBasePath();
  const target = routeOrLogin === "login"
    ? `${base}/`
    : `${base}/${ROUTES[routeOrLogin]?.path || "overview"}`;
  try {
    if (window.location.pathname !== target) {
      window.history.replaceState({ route: routeOrLogin }, "", target);
    }
  } catch {}
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
  if (state.currentUser && state.adminProfile) {
    renderSection();
  }
}

function getNavIcon(name) {
  const icons = {
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  };
  return icons[name] || icons.grid;
}

function renderSidebar() {
  const nav = document.getElementById("admin-sidebar-nav");
  if (!nav) return;

  nav.innerHTML = Object.values(ROUTES).map((route) => {
    const active = state.activeRoute === route.id ? "active" : "";
    return `
      <button type="button" class="nav-item ${active}" data-section="${route.id}">
        <span class="nav-item-left">
          ${getNavIcon(route.icon)}
          <span>${escapeHtml(t(route.i18n))}</span>
        </span>
      </button>
    `;
  }).join("") + `
    <button type="button" class="nav-item" id="sidebar-logout-btn" style="margin-top:auto;color:var(--danger);">
      <span class="nav-item-left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>${escapeHtml(t("logout"))}</span>
      </span>
    </button>
  `;

  nav.querySelector("#sidebar-logout-btn")?.addEventListener("click", doLogout);

  document.querySelectorAll(".bottom-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === state.activeRoute);
  });
}

async function navigateTo(routeId) {
  // Protected Route Guard: Redirect unauthorized users to Login immediately
  if (!state.currentUser || !state.adminProfile) {
    enforceLoggedOutState();
    return;
  }

  const target = ROUTES[routeId] ? routeId : "overview";
  if (state.activeRoute === "settings" && settingsMod.hasUnsavedChanges && target !== "settings") {
    const ok = await openConfirmModal({
      title: t("siteSettings"),
      message: t("unsavedPrompt"),
      confirmLabel: state.lang === "bn" ? "চলে যান" : "Leave",
      cancelLabel: state.lang === "bn" ? "থাকুন" : "Stay"
    });
    if (!ok) return;
  }

  state.activeRoute = target;
  syncBrowserUrl(target);
  closeMobileDrawer();
  renderSidebar();
  renderSection();
}

function renderSection() {
  if (!state.currentUser || !state.adminProfile) {
    enforceLoggedOutState();
    return;
  }

  const container = document.getElementById("admin-view-container");
  const titleEl = document.getElementById("admin-page-title");
  if (!container) return;

  const route = ROUTES[state.activeRoute] || ROUTES.overview;
  if (titleEl) titleEl.textContent = t(route.i18n);

  if (state.activeModule) {
    state.activeModule.unmount();
    state.activeModule = null;
  }

  if (route.id === "overview") {
    state.activeModule = dashboardMod;
    dashboardMod.mount(container);
  } else if (route.id === "users") {
    state.activeModule = usersMod;
    usersMod.mount(container, "users");
  } else if (route.id === "content") {
    state.activeModule = contentMod;
    contentMod.mount(container);
  } else if (route.id === "settings") {
    state.activeModule = settingsMod;
    settingsMod.mount(container);
  } else if (route.id === "profile") {
    state.activeModule = usersMod;
    usersMod.mount(container, "profile");
  }
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

function enforceLoggedOutState(errorMessage = null) {
  state.currentUser = null;
  state.adminProfile = null;
  if (state.activeModule) {
    state.activeModule.unmount();
    state.activeModule = null;
  }
  const container = document.getElementById("admin-view-container");
  if (container) container.innerHTML = "";

  const shellScreen = document.getElementById("admin-app-shell");
  const loginScreen = document.getElementById("admin-login-screen");
  if (shellScreen) shellScreen.hidden = true;
  if (loginScreen) loginScreen.hidden = false;

  syncBrowserUrl("login");

  if (errorMessage) {
    const alertBox = document.getElementById("login-alert");
    if (alertBox) {
      alertBox.textContent = errorMessage;
      alertBox.className = "auth-alert";
      alertBox.hidden = false;
    }
  }
}

function setupLoginForm() {
  const form = document.getElementById("admin-login-form");
  const emailIn = document.getElementById("login-email");
  const passIn = document.getElementById("login-password");
  const rememberChk = document.getElementById("login-remember");
  const submitBtn = document.getElementById("login-submit-btn");
  const forgotBtn = document.getElementById("forgot-password-btn");
  const alertBox = document.getElementById("login-alert");
  let isSubmitting = false;

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

  forgotBtn?.addEventListener("click", async () => {
    const email = emailIn?.value?.trim();
    if (!email) {
      showAlert(t("enterEmailFirst"));
      return;
    }
    forgotBtn.disabled = true;
    try {
      const res = await authService.resetPassword(email, state.lang);
      if (res.ok) {
        showAlert(t("resetSent"), true);
      } else {
        showAlert(res.message);
      }
    } catch (err) {
      console.error("[AdminLogin] Forgot password error:", {
        code: err?.code || "RESET_ERROR",
        message: err?.message || String(err)
      });
      showAlert(err?.message || "Password reset failed.");
    } finally {
      forgotBtn.disabled = false;
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (alertBox) alertBox.hidden = true;

    const remaining = authService.getLockoutRemainingMs();
    if (remaining > 0) {
      showAlert(`${t("lockoutWait")} (${Math.ceil(remaining / 1000)}s)`);
      return;
    }

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = t("signingIn");
    console.info("[AdminLogin] Form submitted; awaiting authentication.");

    try {
      const res = await authService.signIn(
        emailIn.value,
        passIn.value,
        Boolean(rememberChk?.checked),
        state.lang
      );

      if (!res.ok) {
        const triesLeft = authService.getRemainingAttempts();
        const baseMsg = res.message || (res.reason === "not_admin" ? t("notAdminError") : t("firebaseNotConfigured"));
        const suffix = res.showAttemptsLeft && triesLeft > 0 ? ` (${triesLeft} left)` : "";
        showAlert(`${baseMsg}${suffix}`);
      }
    } catch (err) {
      console.error("[AdminLogin] Unhandled error during sign-in:", {
        code: err?.code || "LOGIN_SUBMIT_ERROR",
        message: err?.message || String(err)
      });
      showAlert(err?.message || "Login request failed. Please try again.");
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.textContent = t("signInBtn");
      console.info("[AdminLogin] Submit handler completed; button restored.");
    }
  });
}

function setupShellInteractions() {
  const siteHomeUrl = `${getSiteRoot()}index.html`;
  document.querySelectorAll(".js-view-website").forEach((el) => {
    el.setAttribute("href", siteHomeUrl);
  });

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

  document.getElementById("admin-theme-btn")?.addEventListener("click", () => {
    applyTheme(state.theme === "dark" ? "light" : "dark");
  });
  document.getElementById("admin-lang-btn")?.addEventListener("click", () => {
    applyLanguage(state.lang === "en" ? "bn" : "en");
  });

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

  document.getElementById("td-refresh-btn")?.addEventListener("click", () => {
    if (state.activeRoute === "overview") dashboardMod.refresh();
    showAdminToast(state.lang === "bn" ? "ডেটা রিফ্রেশ হয়েছে।" : "Data refreshed.", "success");
  });

  document.getElementById("td-clear-cache-btn")?.addEventListener("click", async () => {
    localStorage.removeItem("fahad_admin_site_settings_draft");
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    showAdminToast(state.lang === "bn" ? "ক্যাশ পরিষ্কার হয়েছে।" : "Cache cleared.", "success");
  });

  document.getElementById("td-maintenance-btn")?.addEventListener("click", () => navigateTo("settings"));
  document.getElementById("profile-open-btn")?.addEventListener("click", () => navigateTo("profile"));

  document.getElementById("td-help-btn")?.addEventListener("click", () => {
    openConfirmModal({
      title: "Hidden Admin Route Security",
      message: state.lang === "bn"
        ? "এই প্যানেলটি /FAHAD/admin রুটে সুরক্ষিত। সকল ডেটা Firebase Auth এবং Firestore Security Rules দ্বারা নিয়ন্ত্রিত।"
        : "Protected at /FAHAD/admin. Access is gated by Firebase Auth, admins/{uid} verification, and Firestore Security Rules.",
      confirmLabel: "OK",
      cancelLabel: "Close"
    });
  });

  document.getElementById("admin-notify-btn")?.addEventListener("click", () => {
    navigateTo("overview");
  });

  const timeoutSel = document.getElementById("inactivity-timeout-select");
  if (timeoutSel) {
    timeoutSel.value = localStorage.getItem(STORAGE.inactivityMin) || "30";
    timeoutSel.addEventListener("change", () => {
      localStorage.setItem(STORAGE.inactivityMin, timeoutSel.value);
      authService.startInactivityWatcher(Number(timeoutSel.value), handleAutoLogout);
    });
  }

  document.getElementById("profile-logout-btn")?.addEventListener("click", doLogout);
  document.getElementById("td-logout-btn")?.addEventListener("click", doLogout);

  window.addEventListener("popstate", () => {
    if (!state.currentUser || !state.adminProfile) {
      enforceLoggedOutState();
      return;
    }
    const sub = getRequestedSubRoute() || "overview";
    state.activeRoute = sub;
    renderSidebar();
    renderSection();
  });
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

  let requestedSubRoute = getRequestedSubRoute();
  let initRes;
  try {
    initRes = await authService.init();
  } catch (err) {
    console.error("[AdminLogin] Bootstrap auth initialization threw error:", {
      code: err?.code || "BOOTSTRAP_INIT_ERROR",
      message: err?.message || String(err)
    });
    initRes = { configured: true, sdkError: err };
  }

  if (!initRes.configured) {
    enforceLoggedOutState();
    const alertBox = document.getElementById("login-alert");
    if (alertBox) {
      alertBox.textContent = t("firebaseNotConfigured");
      alertBox.className = "auth-alert info";
      alertBox.hidden = false;
    }
    return;
  }

  if (initRes.sdkError) {
    enforceLoggedOutState(t("sdkLoadError"));
    return;
  }

  authService.onAuthChange((session) => {
    if (!session) {
      enforceLoggedOutState();
      return;
    }

    if (session.unauthorized) {
      const msgKey =
        session.reason === "inactive"
          ? "adminInactiveError"
          : session.reason === "permission_denied"
          ? "dbPermissionError"
          : session.reason === "db_timeout" || session.reason === "db_error"
          ? "dbTimeoutError"
          : "notAdminError";
      enforceLoggedOutState(t(msgKey));
      return;
    }

    state.currentUser = session.user;
    state.adminProfile = session.adminProfile;

    const loginScreen = document.getElementById("admin-login-screen");
    const shellScreen = document.getElementById("admin-app-shell");
    if (loginScreen) loginScreen.hidden = true;
    if (shellScreen) shellScreen.hidden = false;

    state.activeRoute = requestedSubRoute || "overview";
    requestedSubRoute = null;
    syncBrowserUrl(state.activeRoute);
    renderProfileHeader();
    renderSidebar();
    renderSection();

    const mins = Number(localStorage.getItem(STORAGE.inactivityMin) || "30");
    authService.startInactivityWatcher(mins, handleAutoLogout);
  });
}

bootstrap();

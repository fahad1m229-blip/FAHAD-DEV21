/**
 * FAHAD DEV Admin — UI Helpers, Path Resolution, Bilingual Dictionary (EN/BN)
 */

import { validateSafeUrl } from "./api-service.js";

/**
 * Resolves the public User Panel root path regardless of whether the site is
 * hosted at domain root (/) or a subpath.
 */
export function getSiteRoot() {
  const path = window.location.pathname;
  const idx = path.indexOf("/FAHAD/admin");
  if (idx !== -1) {
    return path.slice(0, idx) + "/";
  }
  const legacyIdx = path.indexOf("/admin");
  if (legacyIdx !== -1) {
    return path.slice(0, legacyIdx) + "/";
  }
  return "/";
}

export function getAdminBasePath() {
  const root = getSiteRoot();
  return `${root}FAHAD/admin`;
}

export const ADMIN_I18N = {
  en: {
    loginTitle: "FAHAD DEV ADMIN",
    loginSubtitle: "Restricted Gateway • Authenticate to access protected admin routes.",
    emailLabel: "Admin Email",
    passwordLabel: "Admin Password",
    rememberMe: "Remember me",
    singleAdminBadge: "Single-Admin Auth",
    signInBtn: "Authenticate & Enter",
    signingIn: "Verifying credentials...",
    lockoutWait: "Too many failed login attempts. Temporarily locked for security.",
    serverNotConfigured: "Server administrator environment variables (ADMIN_EMAIL, ADMIN_PASSWORD_HASH, SESSION_SECRET) are not configured.",
    invalidCredentials: "Invalid administrator email or password.",
    networkError: "Unable to reach authentication server. Check your connection and try again.",
    authTimeoutError: "Authentication request timed out. Please try again.",
    unauthorizedSession: "Your admin session has expired or was invalidated. Please sign in again.",
    overview: "Overview",
    dashboard: "Overview",
    userManagement: "User Management",
    contentManagement: "Content Management",
    siteSettings: "Website Settings",
    adminProfile: "Admin Profile",
    totalUsers: "Total Users",
    activeUsers: "Active Users",
    totalCategories: "Total Categories",
    totalVersions: "Total Versions",
    totalLinks: "Total Links",
    todayVisitors: "Today's Visitors",
    totalDownloads: "Total Download Clicks",
    websiteStatus: "Website Status",
    online: "Live",
    maintenanceOn: "Maintenance ON",
    recentActivities: "Recent Activities",
    quickActions: "Quick Actions",
    topCategories: "Top Categories",
    systemStatus: "System Status",
    saveDraft: "Save Draft",
    publish: "Publish Changes",
    unsavedPrompt: "You have unpublished changes in Website Settings. Leave without publishing?",
    viewWebsite: "View User Panel",
    refreshData: "Refresh Data",
    clearCache: "Clear Cache",
    maintenanceMode: "Maintenance Mode",
    help: "Security Info",
    logout: "Logout",
    autoLoggedOut: "Session expired due to inactivity. Redirected to login."
  },
  bn: {
    loginTitle: "FAHAD DEV অ্যাডমিন",
    loginSubtitle: "সুরক্ষিত গেটওয়ে • অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে প্রমাণীকরণ করুন।",
    emailLabel: "অ্যাডমিন ইমেইল",
    passwordLabel: "অ্যাডমিন পাসওয়ার্ড",
    rememberMe: "আমাকে মনে রাখুন",
    singleAdminBadge: "সিঙ্গেল-অ্যাডমিন অথ",
    signInBtn: "লগইন করুন",
    signingIn: "যাচাই করা হচ্ছে...",
    lockoutWait: "অতিরিক্ত ভুল লগইন চেষ্টার কারণে সাময়িকভাবে লক করা হয়েছে।",
    serverNotConfigured: "সার্ভার এনভায়রনমেন্ট ভেরিয়েবল (ADMIN_EMAIL, ADMIN_PASSWORD_HASH, SESSION_SECRET) সেট করা নেই।",
    invalidCredentials: "অ্যাডমিন ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।",
    networkError: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।",
    authTimeoutError: "লগইন রিকোয়েস্টের সময় শেষ (Timeout) হয়েছে। আবার চেষ্টা করুন।",
    unauthorizedSession: "আপনার অ্যাডমিন সেশন শেষ বা বাতিল হয়েছে। অনুগ্রহ করে আবার লগইন করুন।",
    overview: "ওভারভিউ",
    dashboard: "ওভারভিউ",
    userManagement: "ইউজার ম্যানেজমেন্ট",
    contentManagement: "কন্টেন্ট ম্যানেজমেন্ট",
    siteSettings: "ওয়েবসাইট সেটিংস",
    adminProfile: "অ্যাডমিন প্রোফাইল",
    totalUsers: "মোট ইউজার",
    activeUsers: "সক্রিয় ইউজার",
    totalCategories: "মোট ক্যাটাগরি",
    totalVersions: "মোট ভার্সন",
    totalLinks: "মোট লিংক",
    todayVisitors: "আজকের ভিজিটর",
    totalDownloads: "মোট ডাউনলোড ক্লিক",
    websiteStatus: "ওয়েবসাইট স্ট্যাটাস",
    online: "লাইভ",
    maintenanceOn: "মেইনটেন্যান্স চালু",
    recentActivities: "সাম্প্রতিক কার্যক্রম",
    quickActions: "দ্রুত অ্যাকশন",
    topCategories: "শীর্ষ ক্যাটাগরি",
    systemStatus: "সিস্টেম স্ট্যাটাস",
    saveDraft: "ড্রাফট সংরক্ষণ",
    publish: "পাবলিশ করুন",
    unsavedPrompt: "ওয়েবসাইট সেটিংসে অপ্রকাশিত পরিবর্তন রয়েছে। সেভ না করেই চলে যাবেন?",
    viewWebsite: "ইউজার প্যানেল দেখুন",
    refreshData: "ডেটা রিফ্রেশ",
    clearCache: "ক্যাশ পরিষ্কার",
    maintenanceMode: "মেইনটেন্যান্স মোড",
    help: "সিকিউরিটি তথ্য",
    logout: "লগআউট",
    autoLoggedOut: "দীর্ঘক্ষণ নিষ্ক্রিয় থাকার কারণে লগআউট করা হয়েছে।"
  }
};

export function escapeHtml(val) {
  return String(val ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function safeUrlOrEmpty(raw) {
  return validateSafeUrl(raw) || "";
}

export function showAdminToast(message, type = "info") {
  const container = document.getElementById("admin-toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("role", "status");
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3400);
}

export function openConfirmModal({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel" }) {
  return new Promise((resolve) => {
    const modal = document.getElementById("admin-confirm-modal");
    const titleEl = document.getElementById("confirm-modal-title");
    const msgEl = document.getElementById("confirm-modal-msg");
    const okBtn = document.getElementById("confirm-modal-ok");
    const cancelBtn = document.getElementById("confirm-modal-cancel");
    if (!modal || !okBtn || !cancelBtn) {
      resolve(window.confirm(message));
      return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = confirmLabel;
    cancelBtn.textContent = cancelLabel;
    modal.hidden = false;

    const cleanup = (result) => {
      modal.hidden = true;
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(result);
    };

    okBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
  });
}

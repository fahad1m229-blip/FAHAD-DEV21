/**
 * FAHAD DEV Admin — UI Helpers, Path Resolution, Bilingual Dictionary (EN/BN)
 */

import { validateSafeUrl } from "./firebase-service.js";

/**
 * Resolves the public User Panel root path regardless of whether the site is
 * hosted at domain root (/) or a GitHub Pages subpath (/repo/).
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
    emailLabel: "Admin Username or Email",
    passwordLabel: "Admin Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    signInBtn: "Authenticate & Enter",
    signingIn: "Verifying credentials...",
    resetSent: "Password reset email sent. Check your inbox.",
    enterEmailFirst: "Enter your admin email address first to reset password.",
    usernameNeedsDomain: "Enter your Firebase Admin email address (or configure ADMIN_USERNAME_DOMAIN in firebase-config.js).",
    lockoutWait: "Too many failed login attempts. Temporarily locked for security.",
    notAdminError: "Unauthorized Access: Your account is not registered in the Firestore admins collection.",
    adminInactiveError: "Access Denied: Your admin account is marked inactive in Firestore.",
    dbPermissionError: "Firestore blocked reading admins/{uid}. Verify Firestore Security Rules.",
    dbTimeoutError: "Database verification timed out while contacting Firestore. Please retry.",
    authTimeoutError: "Authentication request timed out. Check network connectivity and try again.",
    sdkLoadError: "Unable to load Firebase SDK modules. Check your network or firewall.",
    firebaseNotConfigured: "Configure /assets/js/firebase-config.js with your Firebase Web App credentials before signing in.",
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
    noStatsYet: "No live stats/{day} records yet",
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
    emailLabel: "অ্যাডমিন ইউজারনেম বা ইমেইল",
    passwordLabel: "অ্যাডমিন পাসওয়ার্ড",
    rememberMe: "আমাকে মনে রাখুন",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    signInBtn: "লগইন করুন",
    signingIn: "যাচাই করা হচ্ছে...",
    resetSent: "পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে। ইনবক্স চেক করুন।",
    enterEmailFirst: "পাসওয়ার্ড রিসেট করতে প্রথমে আপনার অ্যাডমিন ইমেইল লিখুন।",
    usernameNeedsDomain: "Firebase Admin ইমেইল লিখুন (অথবা firebase-config.js-এ ADMIN_USERNAME_DOMAIN সেট করুন)।",
    lockoutWait: "অতিরিক্ত ভুল লগইন চেষ্টার কারণে সাময়িকভাবে লক করা হয়েছে।",
    notAdminError: "অননুমোদিত অ্যাক্সেস: আপনার অ্যাকাউন্ট Firestore admins কালেকশনে অনুমোদিত নয়।",
    adminInactiveError: "অ্যাক্সেস বাতিল: আপনার অ্যাডমিন অ্যাকাউন্টটি Firestore-এ নিষ্ক্রিয় করা আছে।",
    dbPermissionError: "Firestore থেকে admins/{uid} পড়ার অনুমতি পাওয়া যায়নি। Security Rules যাচাই করুন।",
    dbTimeoutError: "Firestore ডাটাবেস যাচাই করতে সময় শেষ (Timeout) হয়েছে। আবার চেষ্টা করুন।",
    authTimeoutError: "লগইন রিকোয়েস্টের সময় শেষ (Timeout) হয়েছে। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।",
    sdkLoadError: "Firebase SDK লোড করা যায়নি। নেটওয়ার্ক বা ফায়ারওয়াল যাচাই করুন।",
    firebaseNotConfigured: "সাইন ইন করার আগে /assets/js/firebase-config.js ফাইলে আপনার Firebase Web কনফিগ যোগ করুন।",
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
    noStatsYet: "এখনো stats/{day} লাইভ ডেটা নেই",
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

export function mapAuthErrorToMessage(err, lang = "en") {
  const code = err?.code || "";
  const isBn = lang === "bn";
  switch (code) {
    case "auth/invalid-email":
      return isBn ? "সঠিক ইমেইল বা ইউজারনেম দিন।" : "Please enter a valid email or username.";
    case "auth/user-disabled":
      return isBn ? "এই অ্যাডমিন অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।" : "This admin account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return isBn ? "ইউজারনেম/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।" : "Invalid username/email or password.";
    case "auth/too-many-requests":
      return isBn ? "অতিরিক্ত চেষ্টার কারণে সার্ভার থেকে সাময়িকভাবে ব্লক করা হয়েছে।" : "Too many failed attempts. Temporarily rate-limited by Firebase Auth.";
    case "auth/network-request-failed":
      return isBn ? "নেটওয়ার্ক সংযোগে সমস্যা হয়েছে। ইন্টারনেট যাচাই করুন।" : "Network error. Please check your internet connection.";
    case "auth/invalid-api-key":
    case "auth/configuration-not-found":
      return isBn ? "Firebase Auth কনফিগারেশন সঠিক নয়।" : "Firebase Auth configuration is invalid or not enabled.";
    case "auth/operation-not-allowed":
      return isBn ? "Firebase Console-এ Email/Password লগইন চালু নেই।" : "Email/Password sign-in is disabled in Firebase Console.";
    case "auth/unauthorized-domain":
      return isBn ? "এই ডোমেইনটি Firebase Authorized Domains-এ যুক্ত নেই।" : "This domain is not authorized in Firebase Authentication settings.";
    case "AUTH_TIMEOUT":
      return ADMIN_I18N[lang]?.authTimeoutError || ADMIN_I18N.en.authTimeoutError;
    default:
      return isBn
        ? `সাইন ইন ব্যর্থ হয়েছে: ${err?.message || "অজানা ত্রুটি"}`
        : `Authentication failed: ${err?.message || "Unknown error"}`;
  }
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

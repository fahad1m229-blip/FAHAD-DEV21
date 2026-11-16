/**
 * FAHAD DEV Admin — UI Helpers, Bilingual Dictionary (EN/BN), Toast & Modals
 */

import { validateSafeUrl } from "./firebase-service.js";

export const ADMIN_I18N = {
  en: {
    loginTitle: "FAHAD DEV ADMIN",
    loginSubtitle: "Sign in with your authorized Firebase administrator account.",
    emailLabel: "Admin Email",
    passwordLabel: "Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    signInBtn: "Sign In to Dashboard",
    signingIn: "Verifying credentials...",
    resetSent: "Password reset email sent. Check your inbox.",
    enterEmailFirst: "Enter your admin email first to reset password.",
    lockoutWait: "Too many failed attempts in this browser. Please wait before trying again. (Note: Server-side protection is enforced by Firebase Auth & Firestore Security Rules.)",
    notAdminError: "Access Denied: Your account UID is not registered in the Firestore admins collection.",
    firebaseNotConfigured: "Configure /assets/js/firebase-config.js with your Firebase Web App credentials before signing in.",
    dashboard: "Dashboard",
    siteSettings: "Site Settings",
    heroContent: "Hero & Content",
    categories: "Categories",
    versionsLinks: "Versions & Links",
    menuManager: "Menu Manager",
    adsManager: "Ads Manager",
    communityPopup: "Community Popup",
    announcement: "Announcement",
    socialLinks: "Social Links",
    analytics: "Analytics",
    adminUsers: "Admin Users & Roles",
    backupLogs: "Backup & Logs",
    seo: "SEO",
    totalCategories: "Total Categories",
    totalVersions: "Total Versions",
    totalLinks: "Total Links",
    todayVisitors: "Today's Visitors",
    totalDownloads: "Total Download Clicks",
    websiteStatus: "Website Status",
    maintenanceStatus: "Maintenance Status",
    online: "Live",
    maintenanceOn: "Maintenance ON",
    maintenanceOff: "Normal",
    noStatsYet: "No live stats/{day} records yet",
    recentActivities: "Recent Activities",
    quickActions: "Quick Actions",
    topCategories: "Top Categories",
    systemStatus: "System Status",
    saveDraft: "Save Draft",
    publish: "Publish Changes",
    draftSaved: "Draft saved locally.",
    publishedOk: "Published to Firestore successfully!",
    readOnlyViewer: "Viewer role is read-only. Changes cannot be published.",
    ownerOnlyScript: "Custom CSS/JS is restricted to Owner accounts only.",
    unsavedPrompt: "You have unpublished changes in Site Settings. Leave without publishing?",
    phaseLockedMsg: "This module will be unlocked in the next implementation phase.",
    viewWebsite: "View Website",
    refreshData: "Refresh Data",
    clearCache: "Clear Cache",
    maintenanceMode: "Maintenance Mode",
    backupDownload: "Backup Download",
    restoreBackup: "Restore Backup",
    activityLog: "Activity Log",
    help: "Help",
    logout: "Logout",
    autoLoggedOut: "Session expired due to inactivity. Please sign in again."
  },
  bn: {
    loginTitle: "FAHAD DEV অ্যাডমিন",
    loginSubtitle: "আপনার অনুমোদিত Firebase অ্যাডমিন অ্যাকাউন্ট দিয়ে সাইন ইন করুন।",
    emailLabel: "অ্যাডমিন ইমেইল",
    passwordLabel: "পাসওয়ার্ড",
    rememberMe: "আমাকে মনে রাখুন",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    signInBtn: "ড্যাশবোর্ডে প্রবেশ করুন",
    signingIn: "যাচাই করা হচ্ছে...",
    resetSent: "পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে। ইনবক্স চেক করুন।",
    enterEmailFirst: "পাসওয়ার্ড রিসেট করতে প্রথমে আপনার ইমেইল লিখুন।",
    lockoutWait: "অনেকবার ভুল চেষ্টা হয়েছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন। (নোট: সার্ভার-সাইড সুরক্ষা Firebase Auth এবং Firestore Rules দ্বারা নিয়ন্ত্রিত।)",
    notAdminError: "অ্যাক্সেস অনুমোদিত নয়: আপনার UID Firestore-এর admins কালেকশনে নিবন্ধিত নেই।",
    firebaseNotConfigured: "সাইন ইন করার আগে /assets/js/firebase-config.js ফাইলে আপনার Firebase Web কনফিগ যোগ করুন।",
    dashboard: "ড্যাশবোর্ড",
    siteSettings: "সাইট সেটিংস",
    heroContent: "হিরো ও কন্টেন্ট",
    categories: "ক্যাটাগরি",
    versionsLinks: "ভার্সন ও লিংক",
    menuManager: "মেনু ম্যানেজার",
    adsManager: "বিজ্ঞাপন ম্যানেজার",
    communityPopup: "কমিউনিটি পপআপ",
    announcement: "ঘোষণা বার",
    socialLinks: "সোশ্যাল লিংক",
    analytics: "অ্যানালিটিক্স",
    adminUsers: "অ্যাডমিন ও রোল",
    backupLogs: "ব্যাকআপ ও লগ",
    seo: "এসইও (SEO)",
    totalCategories: "মোট ক্যাটাগরি",
    totalVersions: "মোট ভার্সন",
    totalLinks: "মোট লিংক",
    todayVisitors: "আজকের ভিজিটর",
    totalDownloads: "মোট ডাউনলোড ক্লিক",
    websiteStatus: "ওয়েবসাইট স্ট্যাটাস",
    maintenanceStatus: "মেইনটেন্যান্স স্ট্যাটাস",
    online: "লাইভ",
    maintenanceOn: "মেইনটেন্যান্স চালু",
    maintenanceOff: "স্বাভাবিক",
    noStatsYet: "এখনো stats/{day} লাইভ ডেটা নেই",
    recentActivities: "সাম্প্রতিক কার্যক্রম",
    quickActions: "দ্রুত অ্যাকশন",
    topCategories: "শীর্ষ ক্যাটাগরি",
    systemStatus: "সিস্টেম স্ট্যাটাস",
    saveDraft: "ড্রাফট সংরক্ষণ",
    publish: "পাবলিশ করুন",
    draftSaved: "ড্রাফট লোকালি সংরক্ষিত হয়েছে।",
    publishedOk: "Firestore-এ সফলভাবে পাবলিশ হয়েছে!",
    readOnlyViewer: "Viewer রোল শুধুমাত্র দেখার জন্য; পরিবর্তন পাবলিশ করা যাবে না।",
    ownerOnlyScript: "Custom CSS/JS শুধুমাত্র Owner অ্যাকাউন্টের জন্য সংরক্ষিত।",
    unsavedPrompt: "সাইট সেটিংসে অপ্রকাশিত পরিবর্তন রয়েছে। সেভ না করেই চলে যাবেন?",
    phaseLockedMsg: "এই মডিউলটি পরবর্তী ধাপে যুক্ত করা হবে।",
    viewWebsite: "ওয়েবসাইট দেখুন",
    refreshData: "ডেটা রিফ্রেশ",
    clearCache: "ক্যাশ পরিষ্কার",
    maintenanceMode: "মেইনটেন্যান্স মোড",
    backupDownload: "ব্যাকআপ ডাউনলোড",
    restoreBackup: "ব্যাকআপ রিস্টোর",
    activityLog: "অ্যাক্টিভিটি লগ",
    help: "সাহায্য",
    logout: "লগআউট",
    autoLoggedOut: "দীর্ঘক্ষণ নিষ্ক্রিয় থাকার কারণে লগআউট করা হয়েছে। আবার সাইন ইন করুন।"
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
      return isBn ? "সঠিক ইমেইল ঠিকানা দিন।" : "Please enter a valid email address.";
    case "auth/user-disabled":
      return isBn ? "এই অ্যাডমিন অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।" : "This admin account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return isBn ? "ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।" : "Invalid email or password.";
    case "auth/too-many-requests":
      return isBn ? "অতিরিক্ত চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। পরে চেষ্টা করুন।" : "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return isBn ? "নেটওয়ার্ক সংযোগে সমস্যা হয়েছে। ইন্টারনেট যাচাই করুন।" : "Network error. Please check your internet connection.";
    default:
      return isBn
        ? `সাইন ইন ব্যর্থ হয়েছে: ${err?.message || "অজানা ত্রুটি"}`
        : `Sign-in failed: ${err?.message || "Unknown error"}`;
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

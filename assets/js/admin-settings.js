/**
 * FAHAD DEV Admin — Website Settings & Admin Password Management Module
 * Persists website settings via /api/admin/settings and supports secure
 * admin password rotation (invalidating all existing sessions).
 */

import { escapeHtml, getSiteRoot, safeUrlOrEmpty, showAdminToast } from "./admin-ui.js";

const DRAFT_KEY = "fahad_admin_site_settings_draft";

const DEFAULT_SITE_SETTINGS = {
  siteName: "FAHAD DEV",
  logo: "./assets/img/logo.svg",
  favicon: "./assets/img/favicon.png",
  title: "FAHAD DEV — Futuristic 3D Developer Portfolio & Resource Hub",
  description: "Explore free website templates, APK builds, bots, security guides, API tools, and PC utilities.",
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
};

export class AdminSettingsModule {
  constructor(authService, getAdminProfile, getLang, onSessionInvalidated) {
    this.authService = authService;
    this.getAdminProfile = getAdminProfile;
    this.getLang = getLang;
    this.onSessionInvalidated = onSessionInvalidated;
    this.persisted = { ...DEFAULT_SITE_SETTINGS };
    this.form = { ...DEFAULT_SITE_SETTINGS };
    this.hasUnsavedChanges = false;
    this.previewMode = "desktop";
    this.isSaving = false;
    this.isChangingPw = false;
    this._keyHandler = null;
  }

  mount(container) {
    this.container = container;
    this.render();
    this.loadSettings();
    this.bindShortcut();
  }

  unmount() {
    if (this._keyHandler) {
      window.removeEventListener("keydown", this._keyHandler);
      this._keyHandler = null;
    }
  }

  bindShortcut() {
    this._keyHandler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        this.saveDraft();
      }
    };
    window.addEventListener("keydown", this._keyHandler);
  }

  async loadSettings() {
    try {
      const data = await this.authService.apiFetch("/api/admin/settings");
      const remote = data.settings || {};
      this.persisted = { ...DEFAULT_SITE_SETTINGS, ...remote };

      const draftRaw = localStorage.getItem(DRAFT_KEY);
      if (draftRaw) {
        try {
          this.form = { ...this.persisted, ...JSON.parse(draftRaw) };
          this.hasUnsavedChanges = true;
        } catch {
          this.form = { ...this.persisted };
          this.hasUnsavedChanges = false;
        }
      } else if (!this.hasUnsavedChanges) {
        this.form = { ...this.persisted };
      }
      this.render();
    } catch (err) {
      if (err?.status !== 401) {
        console.warn("[SiteSettings] Load failed:", err?.message || err);
      }
    }
  }

  saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(this.form));
    const isBn = this.getLang() === "bn";
    showAdminToast(isBn ? "ড্রাফট লোকালি সংরক্ষিত হয়েছে।" : "Draft saved locally.", "info");
  }

  async publish() {
    const isBn = this.getLang() === "bn";

    for (const urlField of ["logo", "favicon"]) {
      const val = (this.form[urlField] || "").trim();
      if (val && !val.startsWith("./") && !val.startsWith("../") && !safeUrlOrEmpty(val)) {
        showAdminToast(
          isBn ? `${urlField} এর জন্য সঠিক HTTPS URL দিন।` : `Invalid URL for ${urlField}.`,
          "error"
        );
        return;
      }
    }

    this.isSaving = true;
    this.render();

    try {
      const res = await this.authService.apiFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.form)
      });

      localStorage.removeItem(DRAFT_KEY);
      this.hasUnsavedChanges = false;
      this.persisted = { ...DEFAULT_SITE_SETTINGS, ...(res.settings || this.form) };
      this.form = { ...this.persisted };
      showAdminToast(isBn ? "সফলভাবে সেভ ও পাবলিশ হয়েছে!" : "Settings saved & published!", "success");

      const iframe = this.container?.querySelector("#site-preview-iframe");
      if (iframe) iframe.src = `${getSiteRoot()}index.html?preview=${Date.now()}`;
    } catch (err) {
      if (err?.status !== 401) {
        showAdminToast(
          isBn ? `পাবলিশ ব্যর্থ হয়েছে: ${err.message}` : `Publish failed: ${err.message}`,
          "error"
        );
      }
    } finally {
      this.isSaving = false;
      this.render();
    }
  }

  async handlePasswordChange(e) {
    e.preventDefault();
    const isBn = this.getLang() === "bn";
    const curEl = this.container.querySelector("#pw-current");
    const newEl = this.container.querySelector("#pw-new");
    const confEl = this.container.querySelector("#pw-confirm");
    const msgEl = this.container.querySelector("#pw-change-alert");

    const showMsg = (text, isSuccess = false) => {
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.className = `auth-alert ${isSuccess ? "info" : ""}`;
      msgEl.hidden = false;
    };

    const currentPassword = curEl?.value || "";
    const newPassword = newEl?.value || "";
    const confirmPassword = confEl?.value || "";

    if (!currentPassword || !newPassword) {
      showMsg(isBn ? "বর্তমান এবং নতুন পাসওয়ার্ড দিন।" : "Enter both current and new password.");
      return;
    }
    if (newPassword.length < 10) {
      showMsg(isBn ? "নতুন পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।" : "New password must be at least 10 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMsg(isBn ? "নতুন পাসওয়ার্ড দুটি মেলেনি।" : "New password confirmation does not match.");
      return;
    }
    if (newPassword === currentPassword) {
      showMsg(isBn ? "নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ডের চেয়ে ভিন্ন হতে হবে।" : "New password must differ from current password.");
      return;
    }

    this.isChangingPw = true;
    const btn = this.container.querySelector("#btn-change-password");
    if (btn) {
      btn.disabled = true;
      btn.textContent = isBn ? "আপডেট হচ্ছে..." : "Updating Password...";
    }

    try {
      const res = await this.authService.changePassword({ currentPassword, newPassword });
      if (!res.ok) {
        showMsg(res.message);
        return;
      }

      if (curEl) curEl.value = "";
      if (newEl) newEl.value = "";
      if (confEl) confEl.value = "";

      showAdminToast(
        isBn
          ? "পাসওয়ার্ড আপডেট হয়েছে। সব সেশন বাতিল করা হয়েছে; আবার লগইন করুন।"
          : "Password updated. All existing sessions invalidated; please sign in again.",
        "success"
      );

      this.onSessionInvalidated?.(
        isBn
          ? "পাসওয়ার্ড পরিবর্তিত হয়েছে। নিরাপত্তার জন্য সব সেশন বন্ধ করা হয়েছে — নতুন পাসওয়ার্ড দিয়ে লগইন করুন।"
          : "Password updated. All active sessions were invalidated — please sign in with your new password."
      );
    } finally {
      this.isChangingPw = false;
      if (btn && document.body.contains(btn)) {
        btn.disabled = false;
        btn.textContent = isBn ? "পাসওয়ার্ড পরিবর্তন করুন" : "Update Admin Password";
      }
    }
  }

  render() {
    if (!this.container) return;
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    const siteHomeUrl = `${getSiteRoot()}index.html`;

    this.container.innerHTML = `
      <div class="glass-card sticky-save-bar">
        <div>
          <strong>${isBn ? "সার্ভার কনফিগারেশন" : "Site Configuration"}</strong>
          <span style="margin-left:10px;font-size:12.5px;color:${this.hasUnsavedChanges ? "var(--gold)" : "var(--success)"};">
            ${this.hasUnsavedChanges ? (isBn ? "অপ্রকাশিত পরিবর্তন রয়েছে" : "Unsaved draft changes") : (isBn ? "সিঙ্ক করা আছে" : "Synced with server")}
          </span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" class="btn btn-glass btn-sm" id="btn-save-draft">
            ${isBn ? "ড্রাফট সংরক্ষণ (Ctrl+S)" : "Save Draft (Ctrl+S)"}
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="btn-publish-site" ${this.isSaving ? "disabled" : ""}>
            ${this.isSaving ? (isBn ? "পাবলিশ হচ্ছে..." : "Publishing...") : (isBn ? "পাবলিশ করুন" : "Publish Changes")}
          </button>
        </div>
      </div>

      <div class="settings-layout">
        <div style="display:flex;flex-direction:column;gap:18px;">
          <form id="site-settings-form" class="glass-card panel-card" onsubmit="return false;">
            <div class="panel-head">
              <h2>${isBn ? "ওয়েবসাইট সেটিংস" : "Website Settings"}</h2>
              <span class="role-pill">${escapeHtml(profile?.role || "owner")}</span>
            </div>

            <div class="form-grid">
              <div class="field">
                <label for="ss-siteName">${isBn ? "সাইটের নাম" : "Site Name"}</label>
                <input id="ss-siteName" type="text" value="${escapeHtml(this.form.siteName)}" data-field="siteName" />
              </div>
              <div class="field">
                <label for="ss-theme">${isBn ? "ডিফল্ট থিম" : "Default Theme"}</label>
                <select id="ss-theme" data-field="theme">
                  <option value="dark" ${this.form.theme === "dark" ? "selected" : ""}>Dark Cyber</option>
                  <option value="light" ${this.form.theme === "light" ? "selected" : ""}>Light</option>
                </select>
              </div>
              <div class="field">
                <label for="ss-logo">${isBn ? "লোগো URL" : "Logo URL"}</label>
                <input id="ss-logo" type="text" value="${escapeHtml(this.form.logo)}" data-field="logo" />
              </div>
              <div class="field">
                <label for="ss-favicon">${isBn ? "ফ্যাভিকন URL" : "Favicon URL"}</label>
                <input id="ss-favicon" type="text" value="${escapeHtml(this.form.favicon)}" data-field="favicon" />
              </div>
              <div class="field full">
                <label for="ss-title">${isBn ? "সাইট টাইটেল" : "Site Title"}</label>
                <input id="ss-title" type="text" value="${escapeHtml(this.form.title)}" data-field="title" />
              </div>
              <div class="field full">
                <label for="ss-desc">${isBn ? "সাইট বিবরণ" : "Site Description"}</label>
                <textarea id="ss-desc" data-field="description">${escapeHtml(this.form.description)}</textarea>
              </div>
              <div class="field">
                <label for="ss-font">${isBn ? "ফন্ট পেয়ারিং" : "Font Family"}</label>
                <select id="ss-font" data-field="font">
                  <option value="Orbitron + Inter" ${this.form.font === "Orbitron + Inter" ? "selected" : ""}>Orbitron + Inter</option>
                  <option value="Orbitron + Hind Siliguri" ${this.form.font === "Orbitron + Hind Siliguri" ? "selected" : ""}>Orbitron + Hind Siliguri</option>
                  <option value="JetBrains Mono + Inter" ${this.form.font === "JetBrains Mono + Inter" ? "selected" : ""}>JetBrains Mono + Inter</option>
                </select>
              </div>
              <div class="field">
                <label for="ss-copyright">${isBn ? "কপিরাইট টেক্সট" : "Copyright"}</label>
                <input id="ss-copyright" type="text" value="${escapeHtml(this.form.copyright)}" data-field="copyright" />
              </div>
              <div class="field full">
                <label for="ss-footer">${isBn ? "ফুটার ট্যাগলাইন" : "Footer Tagline"}</label>
                <input id="ss-footer" type="text" value="${escapeHtml(this.form.footer)}" data-field="footer" />
              </div>

              <div class="field">
                <label for="ss-primary">${isBn ? "প্রাইমারি কালার" : "Primary Color"}</label>
                <div class="color-field">
                  <input id="ss-primary" type="color" value="${escapeHtml(this.form.primaryColor || "#3B6CFF")}" data-field="primaryColor" />
                  <span style="font-family:'JetBrains Mono',monospace;font-size:12px;">${escapeHtml(this.form.primaryColor)}</span>
                </div>
              </div>
              <div class="field">
                <label for="ss-violet">${isBn ? "ভায়োলেট কালার" : "Violet Color"}</label>
                <div class="color-field">
                  <input id="ss-violet" type="color" value="${escapeHtml(this.form.violetColor || "#8B5CF6")}" data-field="violetColor" />
                  <span style="font-family:'JetBrains Mono',monospace;font-size:12px;">${escapeHtml(this.form.violetColor)}</span>
                </div>
              </div>
              <div class="field">
                <label for="ss-gold">${isBn ? "গোল্ড কালার" : "Gold Color"}</label>
                <div class="color-field">
                  <input id="ss-gold" type="color" value="${escapeHtml(this.form.goldColor || "#F5C451")}" data-field="goldColor" />
                  <span style="font-family:'JetBrains Mono',monospace;font-size:12px;">${escapeHtml(this.form.goldColor)}</span>
                </div>
              </div>
              <div class="field">
                <label for="ss-bg">${isBn ? "ব্যাকগ্রাউন্ড কালার" : "Background Color"}</label>
                <div class="color-field">
                  <input id="ss-bg" type="color" value="${escapeHtml(this.form.backgroundColor || "#05070F")}" data-field="backgroundColor" />
                  <span style="font-family:'JetBrains Mono',monospace;font-size:12px;">${escapeHtml(this.form.backgroundColor)}</span>
                </div>
              </div>

              <div class="toggle-row full">
                <span>${isBn ? "ব্লু ভেরিফাইড ব্যাজ দেখান" : "Show Blue Verified Badge"}</span>
                <input type="checkbox" data-check="verifiedBadge" ${this.form.verifiedBadge ? "checked" : ""} />
              </div>
              <div class="toggle-row full">
                <span>${isBn ? "৩ডি ও স্ক্রল অ্যানিমেশন চালু" : "Enable 3D & UI Animations"}</span>
                <input type="checkbox" data-check="animations" ${this.form.animations ? "checked" : ""} />
              </div>
              <div class="toggle-row full">
                <span>${isBn ? "মেইনটেন্যান্স মোড (পাবলিক সাইট সাময়িক বন্ধ)" : "Maintenance Mode"}</span>
                <input type="checkbox" data-check="maintenance" ${this.form.maintenance ? "checked" : ""} />
              </div>

              <div class="field full">
                <label for="ss-css">
                  <span>Custom CSS</span>
                  <span style="font-size:11px;color:var(--gold);">Owner Only</span>
                </label>
                <textarea id="ss-css" data-field="customCss" placeholder="/* Trusted owner CSS overrides */">${escapeHtml(this.form.customCss)}</textarea>
              </div>
              <div class="field full">
                <label for="ss-js">
                  <span>Custom JS</span>
                  <span style="font-size:11px;color:var(--gold);">Owner Only • Isolated</span>
                </label>
                <textarea id="ss-js" data-field="customJs" placeholder="// Trusted owner script configuration">${escapeHtml(this.form.customJs)}</textarea>
              </div>
            </div>
          </form>

          <form id="admin-password-form" class="glass-card panel-card">
            <div class="panel-head">
              <h2>${isBn ? "অ্যাডমিন পাসওয়ার্ড পরিবর্তন" : "Admin Password Management"}</h2>
              <span class="role-pill">scrypt</span>
            </div>
            <p style="margin:0;font-size:12.5px;color:var(--muted);">
              ${isBn
                ? "বর্তমান পাসওয়ার্ড যাচাই করে নতুন পাসওয়ার্ড সেট করুন। পরিবর্তন হলে চলমান সব সেশন তাৎক্ষণিক বাতিল হবে।"
                : "Verify your current password to set a new administrator password. Updating your password hashes it with scrypt and invalidates all existing sessions."}
            </p>
            <div id="pw-change-alert" class="auth-alert" role="alert" hidden></div>
            <div class="form-grid">
              <div class="field full">
                <label for="pw-current">${isBn ? "বর্তমান পাসওয়ার্ড" : "Current Password"}</label>
                <input id="pw-current" type="password" required autocomplete="current-password" placeholder="••••••••" />
              </div>
              <div class="field">
                <label for="pw-new">${isBn ? "নতুন পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)" : "New Password (min 10 chars)"}</label>
                <input id="pw-new" type="password" required minlength="10" autocomplete="new-password" placeholder="••••••••••" />
              </div>
              <div class="field">
                <label for="pw-confirm">${isBn ? "নতুন পাসওয়ার্ড নিশ্চিত করুন" : "Confirm New Password"}</label>
                <input id="pw-confirm" type="password" required minlength="10" autocomplete="new-password" placeholder="••••••••••" />
              </div>
            </div>
            <div>
              <button id="btn-change-password" type="submit" class="btn btn-primary btn-sm" ${this.isChangingPw ? "disabled" : ""}>
                ${isBn ? "পাসওয়ার্ড পরিবর্তন করুন" : "Update Admin Password"}
              </button>
            </div>
          </form>
        </div>

        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "লাইভ ওয়েবসাইট প্রিভিউ" : "Live Website Preview"}</h2>
            <div class="chip-group">
              <button type="button" class="chip-btn ${this.previewMode === "desktop" ? "active" : ""}" data-preview="desktop">Desktop</button>
              <button type="button" class="chip-btn ${this.previewMode === "mobile" ? "active" : ""}" data-preview="mobile">Mobile</button>
              <button type="button" class="chip-btn" id="refresh-preview-btn">↻</button>
            </div>
          </div>
          <p style="margin:0;font-size:12px;color:var(--muted);">
            ${isBn ? "সিকিউরিটি আইসোলেশন: প্রিভিউ iframe অ্যাডমিন সেশন অ্যাক্সেস করতে পারবে না।" : "Sandboxed preview: iframe is origin-isolated from admin session controls."}
          </p>
          <div class="preview-frame-wrap ${this.previewMode === "mobile" ? "mobile-mode" : ""}">
            <iframe
              id="site-preview-iframe"
              src="${escapeHtml(siteHomeUrl)}"
              title="FAHAD DEV Live Website Preview"
              sandbox="allow-scripts"
              loading="lazy">
            </iframe>
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll("[data-field]").forEach((el) => {
      el.addEventListener("input", () => {
        this.form[el.dataset.field] = el.value;
        this.hasUnsavedChanges = true;
      });
    });

    this.container.querySelectorAll("[data-check]").forEach((el) => {
      el.addEventListener("change", () => {
        this.form[el.dataset.check] = el.checked;
        this.hasUnsavedChanges = true;
      });
    });

    this.container.querySelectorAll("[data-preview]").forEach((btn) => {
      btn.onclick = () => {
        this.previewMode = btn.dataset.preview;
        this.render();
      };
    });

    this.container.querySelector("#refresh-preview-btn")?.addEventListener("click", () => {
      const iframe = this.container.querySelector("#site-preview-iframe");
      if (iframe) iframe.src = `${getSiteRoot()}index.html?preview=${Date.now()}`;
    });

    this.container.querySelector("#btn-save-draft")?.addEventListener("click", () => this.saveDraft());
    this.container.querySelector("#btn-publish-site")?.addEventListener("click", () => this.publish());
    this.container.querySelector("#admin-password-form")?.addEventListener("submit", (e) => this.handlePasswordChange(e));
  }
}

/**
 * FAHAD DEV Admin — Phase 1 Site Settings Module (settings/site)
 * Supports color pickers, Owner-restricted customCss/customJs, Save Draft,
 * Publish to Firestore + Activity Logging, and isolated Live Preview.
 */

import { escapeHtml, safeUrlOrEmpty, showAdminToast } from "./admin-ui.js";

const DRAFT_KEY = "fahad_admin_site_settings_draft";

const DEFAULT_SITE_SETTINGS = {
  siteName: "FAHAD DEV",
  logo: "../assets/img/logo.svg",
  favicon: "../assets/img/favicon.png",
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
  constructor(authService, getAdminProfile, getLang) {
    this.authService = authService;
    this.getAdminProfile = getAdminProfile;
    this.getLang = getLang;
    this.unsub = null;
    this.persisted = { ...DEFAULT_SITE_SETTINGS };
    this.form = { ...DEFAULT_SITE_SETTINGS };
    this.hasUnsavedChanges = false;
    this.previewMode = "desktop";
    this.isSaving = false;
    this._keyHandler = null;
  }

  mount(container) {
    this.container = container;
    this.render();
    this.subscribe();
    this.bindShortcut();
  }

  unmount() {
    if (this.unsub) {
      try { this.unsub(); } catch {}
      this.unsub = null;
    }
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

  subscribe() {
    const db = this.authService.db;
    const { doc, onSnapshot } = this.authService.fsMod;
    if (!db) return;

    this.unsub = onSnapshot(doc(db, "settings", "site"), (snap) => {
      const remote = snap.exists() ? snap.data() : {};
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
    });
  }

  saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(this.form));
    const isBn = this.getLang() === "bn";
    showAdminToast(isBn ? "ড্রাফট লোকালি সংরক্ষিত হয়েছে।" : "Draft saved locally.", "info");
  }

  async publish() {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    const role = profile?.role || "viewer";

    if (role === "viewer") {
      showAdminToast(isBn ? "Viewer রোল শুধুমাত্র দেখার জন্য।" : "Viewer role is read-only.", "error");
      return;
    }

    const customScriptChanged =
      this.form.customCss !== this.persisted.customCss ||
      this.form.customJs !== this.persisted.customJs;

    if (role !== "owner" && customScriptChanged) {
      showAdminToast(
        isBn ? "Custom CSS/JS শুধুমাত্র Owner পরিবর্তন করতে পারবেন।" : "Only Owner accounts may modify Custom CSS/JS.",
        "error"
      );
      return;
    }

    // Validate optional URL fields if non-empty and external
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
      const db = this.authService.db;
      const { doc, setDoc, addDoc, collection, serverTimestamp } = this.authService.fsMod;

      const payload = {
        ...this.form,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid
      };
      if (role !== "owner") {
        payload.customCss = this.persisted.customCss || "";
        payload.customJs = this.persisted.customJs || "";
      }

      await setDoc(doc(db, "settings", "site"), payload, { merge: true });
      await setDoc(
        doc(db, "settings", "maintenance"),
        { enabled: Boolean(this.form.maintenance), updatedAt: serverTimestamp() },
        { merge: true }
      );

      await addDoc(collection(db, "logs"), {
        admin: profile.name || profile.email || "Admin",
        adminUid: profile.uid,
        action: "PUBLISH_SITE_SETTINGS",
        before: { siteName: this.persisted.siteName, maintenance: Boolean(this.persisted.maintenance) },
        after: { siteName: this.form.siteName, maintenance: Boolean(this.form.maintenance) },
        time: serverTimestamp()
      });

      localStorage.removeItem(DRAFT_KEY);
      this.hasUnsavedChanges = false;
      this.persisted = { ...this.form };
      showAdminToast(isBn ? "Firestore-এ সফলভাবে পাবলিশ হয়েছে!" : "Published to Firestore successfully!", "success");

      const iframe = this.container?.querySelector("#site-preview-iframe");
      if (iframe) iframe.src = `../index.html?preview=${Date.now()}`;
    } catch (err) {
      console.error("[SiteSettings] Publish error:", err);
      showAdminToast(
        isBn ? `পাবলিশ ব্যর্থ হয়েছে: ${err.message}` : `Publish failed: ${err.message}`,
        "error"
      );
    } finally {
      this.isSaving = false;
      this.render();
    }
  }

  render() {
    if (!this.container) return;
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    const isOwner = profile?.role === "owner";
    const isViewer = profile?.role === "viewer";

    this.container.innerHTML = `
      <div class="glass-card sticky-save-bar">
        <div>
          <strong>settings/site</strong>
          <span style="margin-left:10px;font-size:12.5px;color:${this.hasUnsavedChanges ? "var(--gold)" : "var(--success)"};">
            ${this.hasUnsavedChanges ? (isBn ? "অপ্রকাশিত পরিবর্তন রয়েছে" : "Unsaved draft changes") : (isBn ? "সিঙ্ক করা আছে" : "Synced with Firestore")}
          </span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" class="btn btn-glass btn-sm" id="btn-save-draft" ${isViewer ? "disabled" : ""}>
            ${isBn ? "ড্রাফট সংরক্ষণ (Ctrl+S)" : "Save Draft (Ctrl+S)"}
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="btn-publish-site" ${isViewer || this.isSaving ? "disabled" : ""}>
            ${this.isSaving ? (isBn ? "পাবলিশ হচ্ছে..." : "Publishing...") : (isBn ? "পাবলিশ করুন" : "Publish Changes")}
          </button>
        </div>
      </div>

      <div class="settings-layout">
        <form id="site-settings-form" class="glass-card panel-card" onsubmit="return false;">
          <div class="panel-head">
            <h2>${isBn ? "সাইট কনফিগারেশন" : "General & Theme Settings"}</h2>
            <span class="role-pill">${escapeHtml(profile?.role || "viewer")}</span>
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

            <!-- Theme Color Pickers -->
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

            <!-- Switches -->
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

            <!-- Owner-Restricted Custom CSS / JS -->
            <div class="field full">
              <label for="ss-css">
                <span>Custom CSS</span>
                <span style="font-size:11px;color:var(--gold);">${isOwner ? "Owner Only" : "Locked (Owner Only)"}</span>
              </label>
              <textarea id="ss-css" data-field="customCss" ${isOwner ? "" : "disabled"} placeholder="/* Trusted owner CSS overrides */">${escapeHtml(this.form.customCss)}</textarea>
            </div>
            <div class="field full">
              <label for="ss-js">
                <span>Custom JS</span>
                <span style="font-size:11px;color:var(--gold);">${isOwner ? "Owner Only • Never auto-executed here" : "Locked (Owner Only)"}</span>
              </label>
              <textarea id="ss-js" data-field="customJs" ${isOwner ? "" : "disabled"} placeholder="// Trusted owner script configuration">${escapeHtml(this.form.customJs)}</textarea>
            </div>
          </div>
        </form>

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
            ${isBn ? "সিকিউরিটি আইসোলেশন: প্রিভিউ iframe অ্যাডমিন ক্রেডেনশিয়াল অ্যাক্সেস করতে পারবে না।" : "Sandboxed preview: iframe is origin-isolated from admin auth credentials."}
          </p>
          <div class="preview-frame-wrap ${this.previewMode === "mobile" ? "mobile-mode" : ""}">
            <iframe
              id="site-preview-iframe"
              src="../index.html"
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
      if (iframe) iframe.src = `../index.html?preview=${Date.now()}`;
    });

    this.container.querySelector("#btn-save-draft")?.addEventListener("click", () => this.saveDraft());
    this.container.querySelector("#btn-publish-site")?.addEventListener("click", () => this.publish());
  }
}

/**
 * FAHAD DEV Admin — Content Management Module
 * Real Firestore CRUD for categories/{id} and nested versions/{vid} + links.
 */

import { escapeHtml, openConfirmModal, safeUrlOrEmpty, showAdminToast } from "./admin-ui.js";

export class AdminContentModule {
  constructor(authService, getAdminProfile, getLang) {
    this.authService = authService;
    this.getAdminProfile = getAdminProfile;
    this.getLang = getLang;
    this.unsubs = [];
    this.categories = [];
    this.selectedCategoryId = null;
    this.versions = [];
    this.search = "";
  }

  mount(container) {
    this.container = container;
    this.render();
    this.subscribeCategories();
  }

  unmount() {
    while (this.unsubs.length) {
      const u = this.unsubs.pop();
      try { u(); } catch {}
    }
  }

  subscribeCategories() {
    const db = this.authService.db;
    const { collection, query, orderBy, onSnapshot } = this.authService.fsMod;
    if (!db) return;

    this.unsubs.push(
      onSnapshot(
        query(collection(db, "categories"), orderBy("order", "asc")),
        (snap) => {
          this.categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          if (!this.selectedCategoryId && this.categories.length) {
            this.selectCategory(this.categories[0].id);
          } else {
            this.render();
          }
        },
        (err) => {
          console.warn("[Content] Categories error:", err);
        }
      )
    );
  }

  selectCategory(catId) {
    this.selectedCategoryId = catId;
    if (this._versionUnsub) {
      try { this._versionUnsub(); } catch {}
    }
    const db = this.authService.db;
    const { collection, query, orderBy, onSnapshot } = this.authService.fsMod;
    if (!db || !catId) {
      this.versions = [];
      this.render();
      return;
    }

    this._versionUnsub = onSnapshot(
      query(collection(db, "categories", catId, "versions"), orderBy("order", "asc")),
      (snap) => {
        this.versions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.render();
      },
      () => {
        this.versions = [];
        this.render();
      }
    );
    this.unsubs.push(this._versionUnsub);
  }

  async saveCategory({ id, titleEn, titleBn, ribbon, descEn, order, isNew, isPopular, visible }) {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    if (profile?.role === "viewer") {
      showAdminToast(isBn ? "Viewer রোল শুধুমাত্র দেখার জন্য।" : "Viewer role is read-only.", "error");
      return;
    }
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (!cleanId || !titleEn.trim()) {
      showAdminToast(isBn ? "সঠিক ID এবং টাইটেল দিন।" : "Category ID and Title are required.", "error");
      return;
    }

    try {
      const db = this.authService.db;
      const { doc, setDoc, addDoc, collection, serverTimestamp } = this.authService.fsMod;
      await setDoc(
        doc(db, "categories", cleanId),
        {
          title: titleEn.trim(),
          titleEn: titleEn.trim(),
          titleBn: titleBn.trim() || titleEn.trim(),
          ribbon: ribbon.trim().toUpperCase() || "DEV",
          descEn: descEn.trim(),
          descBn: descEn.trim(),
          order: Number(order) || 1,
          isNew: Boolean(isNew),
          isPopular: Boolean(isPopular),
          visible: Boolean(visible),
          published: Boolean(visible),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      await addDoc(collection(db, "logs"), {
        admin: profile.name || profile.email,
        adminUid: profile.uid,
        action: "SAVE_CATEGORY",
        before: {},
        after: { id: cleanId, title: titleEn.trim() },
        time: serverTimestamp()
      });
      showAdminToast(isBn ? "ক্যাটাগরি সংরক্ষিত হয়েছে!" : "Category saved to Firestore!", "success");
    } catch (err) {
      showAdminToast(err.message, "error");
    }
  }

  async deleteCategory(catId) {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    if (profile?.role === "viewer") return;

    const ok = await openConfirmModal({
      title: isBn ? "ক্যাটাগরি মুছুন" : "Delete Category",
      message: isBn ? `${catId} ক্যাটাগরিটি মুছে ফেলবেন?` : `Delete category "${catId}" from Firestore?`,
      confirmLabel: isBn ? "মুছুন" : "Delete",
      cancelLabel: isBn ? "বাতিল" : "Cancel"
    });
    if (!ok) return;

    try {
      const db = this.authService.db;
      const { doc, deleteDoc, addDoc, collection, serverTimestamp } = this.authService.fsMod;
      await deleteDoc(doc(db, "categories", catId));
      await addDoc(collection(db, "logs"), {
        admin: profile.name || profile.email,
        adminUid: profile.uid,
        action: "DELETE_CATEGORY",
        before: { id: catId },
        after: {},
        time: serverTimestamp()
      });
      if (this.selectedCategoryId === catId) this.selectedCategoryId = null;
      showAdminToast(isBn ? "ক্যাটাগরি মুছে ফেলা হয়েছে।" : "Category deleted.", "success");
    } catch (err) {
      showAdminToast(err.message, "error");
    }
  }

  async saveVersion({ versionTag, notesEn, order, downloadUrl, youtubeUrl }) {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    if (profile?.role === "viewer" || !this.selectedCategoryId) return;

    const cleanVer = versionTag.trim();
    if (!cleanVer) return;
    const verId = cleanVer.toLowerCase().replace(/[^a-z0-9-_]/g, "-");

    const safeDl = downloadUrl.trim() ? safeUrlOrEmpty(downloadUrl) : "";
    const safeYt = youtubeUrl.trim() ? safeUrlOrEmpty(youtubeUrl) : "";
    if ((downloadUrl.trim() && !safeDl) || (youtubeUrl.trim() && !safeYt)) {
      showAdminToast(isBn ? "সঠিক HTTPS URL দিন।" : "Please provide valid HTTPS/HTTP URLs.", "error");
      return;
    }

    try {
      const db = this.authService.db;
      const { doc, setDoc, addDoc, collection, serverTimestamp } = this.authService.fsMod;

      await setDoc(
        doc(db, "categories", this.selectedCategoryId, "versions", verId),
        {
          version: cleanVer,
          name: cleanVer,
          order: Number(order) || 1,
          notesEn: notesEn.trim(),
          notesBn: notesEn.trim(),
          visible: true,
          published: true,
          isNew: true,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      if (safeDl) {
        await setDoc(
          doc(db, "categories", this.selectedCategoryId, "versions", verId, "links", "download"),
          { type: "download", label: "Download Main File", url: safeDl, order: 1, enabled: true, active: true },
          { merge: true }
        );
      }
      if (safeYt) {
        await setDoc(
          doc(db, "categories", this.selectedCategoryId, "versions", verId, "links", "youtube"),
          { type: "youtube", label: "YouTube Tutorial", url: safeYt, order: 2, enabled: true, active: true },
          { merge: true }
        );
      }

      await addDoc(collection(db, "logs"), {
        admin: profile.name || profile.email,
        adminUid: profile.uid,
        action: "SAVE_VERSION",
        before: {},
        after: { categoryId: this.selectedCategoryId, version: cleanVer },
        time: serverTimestamp()
      });
      showAdminToast(isBn ? "ভার্সন সংরক্ষিত হয়েছে!" : "Version & links saved!", "success");
    } catch (err) {
      showAdminToast(err.message, "error");
    }
  }

  async deleteVersion(verId) {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    if (profile?.role === "viewer" || !this.selectedCategoryId) return;
    try {
      const db = this.authService.db;
      const { doc, deleteDoc } = this.authService.fsMod;
      await deleteDoc(doc(db, "categories", this.selectedCategoryId, "versions", verId));
      showAdminToast(isBn ? "ভার্সন মুছে ফেলা হয়েছে।" : "Version deleted.", "success");
    } catch (err) {
      showAdminToast(err.message, "error");
    }
  }

  render() {
    if (!this.container) return;
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    const isViewer = profile?.role === "viewer";

    const q = this.search.trim().toLowerCase();
    const filteredCats = this.categories.filter((c) => {
      if (!q) return true;
      return `${c.id} ${c.titleEn || c.title || ""} ${c.ribbon || ""}`.toLowerCase().includes(q);
    });

    this.container.innerHTML = `
      <div class="dash-grid">
        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "ক্যাটাগরি ম্যানেজার" : "Categories (Firestore)"}</h2>
            <span class="role-pill">${this.categories.length} total</span>
          </div>

          <div class="field">
            <input id="cat-search-input" type="text" value="${escapeHtml(this.search)}" placeholder="${isBn ? "ক্যাটাগরি খুঁজুন..." : "Search categories..."}" />
          </div>

          <div class="activity-list">
            ${filteredCats.length
              ? filteredCats.map((c) => `
                  <div class="activity-row" style="border-color:${this.selectedCategoryId === c.id ? "var(--cyan)" : "var(--border)"};">
                    <button type="button" data-select-cat="${escapeHtml(c.id)}" style="background:none;border:none;color:var(--text);text-align:left;cursor:pointer;flex:1;">
                      <strong>${escapeHtml(c.titleEn || c.title || c.id)}</strong>
                      <div style="font-size:12px;color:var(--muted);">ID: ${escapeHtml(c.id)} • ${escapeHtml(c.ribbon || "DEV")} • #${c.order ?? 1}</div>
                    </button>
                    <div style="display:flex;gap:6px;">
                      <button type="button" class="btn btn-glass btn-sm" data-select-cat="${escapeHtml(c.id)}">${isBn ? "ভার্সন" : "Versions"}</button>
                      ${!isViewer ? `<button type="button" class="btn btn-danger btn-sm" data-del-cat="${escapeHtml(c.id)}">✕</button>` : ""}
                    </div>
                  </div>
                `).join("")
              : `<div class="activity-row" style="color:var(--muted);">${isBn ? "কোনো ক্যাটাগরি নেই।" : "No categories found in Firestore."}</div>`
            }
          </div>

          ${!isViewer ? `
            <form id="new-category-form" style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--border);padding-top:14px;">
              <strong style="font-size:13.5px;">${isBn ? "নতুন ক্যাটাগরি যোগ বা আপডেট" : "Add / Update Category"}</strong>
              <div class="form-grid">
                <div class="field"><input id="cat-id" type="text" required placeholder="id (e.g. free-website)" /></div>
                <div class="field"><input id="cat-ribbon" type="text" required placeholder="Ribbon (e.g. WEB)" /></div>
                <div class="field"><input id="cat-title-en" type="text" required placeholder="Title (English)" /></div>
                <div class="field"><input id="cat-title-bn" type="text" placeholder="Title (Bangla)" /></div>
                <div class="field full"><input id="cat-desc-en" type="text" placeholder="Short description" /></div>
                <div class="field"><input id="cat-order" type="number" value="1" min="1" /></div>
                <div class="field" style="justify-content:center;">
                  <label class="checkbox-label"><input id="cat-visible" type="checkbox" checked /> Visible</label>
                </div>
              </div>
              <button type="submit" class="btn btn-primary btn-sm">${isBn ? "ক্যাটাগরি সংরক্ষণ" : "Save Category"}</button>
            </form>
          ` : ""}
        </div>

        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "ভার্সন ও রিসোর্স" : "Versions & Links"}</h2>
            <span class="role-pill">${escapeHtml(this.selectedCategoryId || "None")}</span>
          </div>

          <div class="activity-list">
            ${this.versions.length
              ? this.versions.map((v) => `
                  <div class="activity-row">
                    <div>
                      <strong>${escapeHtml(v.version || v.name || v.id)}</strong>
                      <div style="font-size:12px;color:var(--muted);">${escapeHtml(v.notesEn || v.desc || "")}</div>
                    </div>
                    ${!isViewer ? `<button type="button" class="btn btn-danger btn-sm" data-del-ver="${escapeHtml(v.id)}">✕</button>` : ""}
                  </div>
                `).join("")
              : `<div class="activity-row" style="color:var(--muted);">${isBn ? "কোনো ভার্সন যোগ করা হয়নি।" : "No versions in this category yet."}</div>`
            }
          </div>

          ${!isViewer && this.selectedCategoryId ? `
            <form id="new-version-form" style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--border);padding-top:14px;">
              <strong style="font-size:13.5px;">${isBn ? "ভার্সন ও ডাউনলোড লিংক যোগ করুন" : "Add / Update Version"}</strong>
              <div class="field"><input id="ver-tag" type="text" required placeholder="Version (e.g. V16.0)" /></div>
              <div class="field"><input id="ver-notes" type="text" placeholder="Release notes" /></div>
              <div class="field"><input id="ver-order" type="number" value="1" min="1" /></div>
              <div class="field"><input id="ver-dl-url" type="url" placeholder="Download HTTPS URL (optional)" /></div>
              <div class="field"><input id="ver-yt-url" type="url" placeholder="YouTube Tutorial HTTPS URL (optional)" /></div>
              <button type="submit" class="btn btn-primary btn-sm">${isBn ? "ভার্সন সংরক্ষণ" : "Save Version"}</button>
            </form>
          ` : ""}
        </div>
      </div>
    `;

    this.container.querySelector("#cat-search-input")?.addEventListener("input", (e) => {
      this.search = e.target.value;
      this.render();
    });
    this.container.querySelectorAll("[data-select-cat]").forEach((el) => {
      el.onclick = () => this.selectCategory(el.dataset.selectCat);
    });
    this.container.querySelectorAll("[data-del-cat]").forEach((el) => {
      el.onclick = () => this.deleteCategory(el.dataset.delCat);
    });
    this.container.querySelectorAll("[data-del-ver]").forEach((el) => {
      el.onclick = () => this.deleteVersion(el.dataset.delVer);
    });
    this.container.querySelector("#new-category-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveCategory({
        id: this.container.querySelector("#cat-id").value,
        ribbon: this.container.querySelector("#cat-ribbon").value,
        titleEn: this.container.querySelector("#cat-title-en").value,
        titleBn: this.container.querySelector("#cat-title-bn").value,
        descEn: this.container.querySelector("#cat-desc-en").value,
        order: this.container.querySelector("#cat-order").value,
        isNew: true,
        isPopular: false,
        visible: this.container.querySelector("#cat-visible").checked
      });
    });
    this.container.querySelector("#new-version-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveVersion({
        versionTag: this.container.querySelector("#ver-tag").value,
        notesEn: this.container.querySelector("#ver-notes").value,
        order: this.container.querySelector("#ver-order").value,
        downloadUrl: this.container.querySelector("#ver-dl-url").value,
        youtubeUrl: this.container.querySelector("#ver-yt-url").value
      });
    });
  }
}

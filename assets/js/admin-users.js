/**
 * FAHAD DEV Admin — User Management (users & admins) & Admin Profile Module
 */

import { escapeHtml, openConfirmModal, safeUrlOrEmpty, showAdminToast } from "./admin-ui.js";

export class AdminUsersModule {
  constructor(authService, getAdminProfile, getLang, onLogout) {
    this.authService = authService;
    this.getAdminProfile = getAdminProfile;
    this.getLang = getLang;
    this.onLogout = onLogout;
    this.unsubs = [];
    this.users = [];
    this.admins = [];
    this.search = "";
    this.filter = "all";
    this.mode = "users"; // "users" | "profile"
  }

  mount(container, mode = "users") {
    this.container = container;
    this.mode = mode;
    this.render();
    this.subscribe();
  }

  unmount() {
    while (this.unsubs.length) {
      const u = this.unsubs.pop();
      try { u(); } catch {}
    }
  }

  subscribe() {
    const db = this.authService.db;
    const { collection, onSnapshot } = this.authService.fsMod;
    if (!db) return;

    this.unsubs.push(
      onSnapshot(
        collection(db, "users"),
        (snap) => {
          this.users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
          this.render();
        },
        () => {
          this.users = [];
          this.render();
        }
      )
    );

    this.unsubs.push(
      onSnapshot(
        collection(db, "admins"),
        (snap) => {
          this.admins = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
          this.render();
        },
        () => {
          this.admins = [];
          this.render();
        }
      )
    );
  }

  async toggleUserStatus(uid, currentActive) {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    if (profile?.role === "viewer") {
      showAdminToast(isBn ? "Viewer রোল পরিবর্তন করতে পারবে না।" : "Viewer role is read-only.", "error");
      return;
    }

    try {
      const db = this.authService.db;
      const { doc, updateDoc, addDoc, collection, serverTimestamp } = this.authService.fsMod;
      const nextActive = !currentActive;
      await updateDoc(doc(db, "users", uid), {
        active: nextActive,
        status: nextActive ? "active" : "blocked",
        updatedAt: serverTimestamp()
      });
      await addDoc(collection(db, "logs"), {
        admin: profile.name || profile.email,
        adminUid: profile.uid,
        action: nextActive ? "ENABLE_USER" : "DISABLE_USER",
        before: { uid, active: currentActive },
        after: { uid, active: nextActive },
        time: serverTimestamp()
      });
      showAdminToast(isBn ? "ইউজারের অবস্থা আপডেট হয়েছে।" : "User status updated.", "success");
    } catch (err) {
      showAdminToast(err.message, "error");
    }
  }

  async saveAdminRole(uid, role, name, email) {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    if (profile?.role !== "owner") {
      showAdminToast(isBn ? "শুধুমাত্র Owner অ্যাডমিন রোল পরিবর্তন করতে পারবেন।" : "Only Owner can manage admin roles.", "error");
      return;
    }
    if (!uid.trim() || !email.trim()) {
      showAdminToast(isBn ? "UID এবং ইমেইল প্রয়োজন।" : "UID and Email are required.", "error");
      return;
    }

    try {
      const db = this.authService.db;
      const { doc, setDoc, addDoc, collection, serverTimestamp } = this.authService.fsMod;
      await setDoc(
        doc(db, "admins", uid.trim()),
        {
          uid: uid.trim(),
          role,
          name: name.trim() || "Admin",
          email: email.trim(),
          active: true,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      await addDoc(collection(db, "logs"), {
        admin: profile.name || profile.email,
        adminUid: profile.uid,
        action: "UPSERT_ADMIN_ROLE",
        before: {},
        after: { uid: uid.trim(), role },
        time: serverTimestamp()
      });
      showAdminToast(isBn ? "অ্যাডমিন রোল সংরক্ষিত হয়েছে।" : "Admin role saved.", "success");
    } catch (err) {
      showAdminToast(err.message, "error");
    }
  }

  async removeAdmin(uid) {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    if (profile?.role !== "owner") {
      showAdminToast(isBn ? "শুধুমাত্র Owner অ্যাডমিন সরাতে পারবেন।" : "Only Owner can remove admins.", "error");
      return;
    }
    if (uid === profile.uid) {
      showAdminToast(isBn ? "আপনি নিজের অ্যাডমিন অ্যাক্সেস মুছতে পারবেন না।" : "You cannot remove your own admin access.", "error");
      return;
    }

    const ok = await openConfirmModal({
      title: isBn ? "অ্যাডমিন সরান" : "Remove Admin",
      message: isBn ? `UID ${uid} এর অ্যাডমিন অ্যাক্সেস মুছে ফেলবেন?` : `Revoke admin access for UID ${uid}?`,
      confirmLabel: isBn ? "মুছুন" : "Revoke",
      cancelLabel: isBn ? "বাতিল" : "Cancel"
    });
    if (!ok) return;

    try {
      const db = this.authService.db;
      const { doc, deleteDoc, addDoc, collection, serverTimestamp } = this.authService.fsMod;
      await deleteDoc(doc(db, "admins", uid));
      await addDoc(collection(db, "logs"), {
        admin: profile.name || profile.email,
        adminUid: profile.uid,
        action: "REMOVE_ADMIN",
        before: { uid },
        after: {},
        time: serverTimestamp()
      });
      showAdminToast(isBn ? "অ্যাডমিন অ্যাক্সেস বাতিল করা হয়েছে।" : "Admin access revoked.", "success");
    } catch (err) {
      showAdminToast(err.message, "error");
    }
  }

  render() {
    if (!this.container) return;
    if (this.mode === "profile") {
      this.renderProfileView();
    } else {
      this.renderUsersView();
    }
  }

  renderUsersView() {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    const isOwner = profile?.role === "owner";
    const activeCount = this.users.filter((u) => u.active !== false && u.status !== "blocked").length;

    const q = this.search.trim().toLowerCase();
    const filteredUsers = this.users.filter((u) => {
      const isActive = u.active !== false && u.status !== "blocked";
      if (this.filter === "active" && !isActive) return false;
      if (this.filter === "blocked" && isActive) return false;
      if (!q) return true;
      return `${u.name || ""} ${u.email || ""} ${u.uid}`.toLowerCase().includes(q);
    });

    this.container.innerHTML = `
      <section class="kpi-grid">
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "মোট ইউজার" : "Total Users"}</span>
          <div class="kpi-value">${this.users.length}</div>
          <span class="kpi-sub">Firestore: users</span>
        </div>
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "সক্রিয় ইউজার" : "Active Users"}</span>
          <div class="kpi-value" style="color:var(--success);">${activeCount}</div>
          <span class="kpi-sub">${this.users.length - activeCount} ${isBn ? "নিষ্ক্রিয়/ব্লকড" : "blocked/inactive"}</span>
        </div>
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "অনুমোদিত অ্যাডমিন" : "Authorized Admins"}</span>
          <div class="kpi-value" style="color:var(--cyan);">${this.admins.length}</div>
          <span class="kpi-sub">Firestore: admins/{uid}</span>
        </div>
      </section>

      <div class="dash-grid">
        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "ইউজার ডিরেক্টরি" : "User Management"}</h2>
            <div class="chip-group">
              <button type="button" class="chip-btn ${this.filter === "all" ? "active" : ""}" data-ufilter="all">${isBn ? "সব" : "All"}</button>
              <button type="button" class="chip-btn ${this.filter === "active" ? "active" : ""}" data-ufilter="active">${isBn ? "সক্রিয়" : "Active"}</button>
              <button type="button" class="chip-btn ${this.filter === "blocked" ? "active" : ""}" data-ufilter="blocked">${isBn ? "ব্লকড" : "Blocked"}</button>
            </div>
          </div>

          <div class="field">
            <input id="user-search-input" type="text" value="${escapeHtml(this.search)}" placeholder="${isBn ? "নাম, ইমেইল বা UID খুঁজুন..." : "Search by name, email or UID..."}" />
          </div>

          <div class="activity-list">
            ${filteredUsers.length
              ? filteredUsers.map((u) => {
                  const isActive = u.active !== false && u.status !== "blocked";
                  return `
                    <div class="activity-row">
                      <div>
                        <strong>${escapeHtml(u.name || "User")}</strong>
                        <div style="font-size:12px;color:var(--muted);">${escapeHtml(u.email || u.uid)}</div>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px;">
                        <span class="role-pill" style="color:${isActive ? "var(--success)" : "var(--danger)"};">
                          ${isActive ? (isBn ? "সক্রিয়" : "Active") : (isBn ? "ব্লকড" : "Blocked")}
                        </span>
                        <button type="button" class="btn btn-glass btn-sm" data-toggle-user="${escapeHtml(u.uid)}" data-active="${isActive}">
                          ${isActive ? (isBn ? "ব্লক" : "Disable") : (isBn ? "সক্রিয়" : "Enable")}
                        </button>
                      </div>
                    </div>
                  `;
                }).join("")
              : `<div class="activity-row" style="color:var(--muted);">${isBn ? "কোনো ইউজার রেকর্ড পাওয়া যায়নি।" : "No registered user records found in Firestore users/."}</div>`
            }
          </div>
        </div>

        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "অ্যাডমিন রোলস (admins/{uid})" : "Authorized Admins"}</h2>
          </div>
          <div class="activity-list">
            ${this.admins.map((a) => `
              <div class="activity-row">
                <div>
                  <strong>${escapeHtml(a.name || a.username || "Admin")}</strong>
                  <div style="font-size:12px;color:var(--muted);">${escapeHtml(a.email || a.uid)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span class="role-pill">${escapeHtml(a.role || "viewer")}</span>
                  ${isOwner && a.uid !== profile.uid
                    ? `<button type="button" class="btn btn-danger btn-sm" data-rm-admin="${escapeHtml(a.uid)}">✕</button>`
                    : ""}
                </div>
              </div>
            `).join("")}
          </div>

          ${isOwner ? `
            <form id="add-admin-form" style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--border);padding-top:14px;">
              <strong style="font-size:13.5px;">${isBn ? "নতুন অ্যাডমিন রোল যুক্ত/আপডেট করুন" : "Assign Admin Role by Firebase UID"}</strong>
              <p style="margin:0;font-size:12px;color:var(--muted);">
                ${isBn ? "প্রথমে Firebase Console -> Authentication থেকে ইউজার তৈরি করে UID কপি করুন।" : "Create the Auth user in Firebase Console first, then register their UID here."}
              </p>
              <div class="field"><input id="new-admin-uid" type="text" required placeholder="Firebase Auth UID" /></div>
              <div class="field"><input id="new-admin-name" type="text" required placeholder="Admin Name" /></div>
              <div class="field"><input id="new-admin-email" type="email" required placeholder="admin@domain.com" /></div>
              <div class="field">
                <select id="new-admin-role">
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary btn-sm">${isBn ? "রোল সংরক্ষণ করুন" : "Save Admin Role"}</button>
            </form>
          ` : ""}
        </div>
      </div>
    `;

    this.container.querySelectorAll("[data-ufilter]").forEach((btn) => {
      btn.onclick = () => {
        this.filter = btn.dataset.ufilter;
        this.render();
      };
    });
    this.container.querySelector("#user-search-input")?.addEventListener("input", (e) => {
      this.search = e.target.value;
      this.render();
    });
    this.container.querySelectorAll("[data-toggle-user]").forEach((btn) => {
      btn.onclick = () => this.toggleUserStatus(btn.dataset.toggleUser, btn.dataset.active === "true");
    });
    this.container.querySelectorAll("[data-rm-admin]").forEach((btn) => {
      btn.onclick = () => this.removeAdmin(btn.dataset.rmAdmin);
    });
    this.container.querySelector("#add-admin-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveAdminRole(
        this.container.querySelector("#new-admin-uid").value,
        this.container.querySelector("#new-admin-role").value,
        this.container.querySelector("#new-admin-name").value,
        this.container.querySelector("#new-admin-email").value
      );
    });
  }

  renderProfileView() {
    const isBn = this.getLang() === "bn";
    const profile = this.getAdminProfile();
    if (!profile) return;

    this.container.innerHTML = `
      <div class="dash-grid">
        <form id="admin-profile-form" class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "অ্যাডমিন প্রোফাইল" : "Admin Profile"}</h2>
            <span class="role-pill">${escapeHtml(profile.role)}</span>
          </div>
          <div class="field">
            <label>UID</label>
            <input type="text" value="${escapeHtml(profile.uid)}" disabled />
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" value="${escapeHtml(profile.email)}" disabled />
          </div>
          <div class="field">
            <label for="prof-name">${isBn ? "নাম" : "Display Name"}</label>
            <input id="prof-name" type="text" value="${escapeHtml(profile.name)}" required />
          </div>
          <div class="field">
            <label for="prof-avatar">${isBn ? "অ্যাভাটার URL (ঐচ্ছিক)" : "Avatar URL (Optional)"}</label>
            <input id="prof-avatar" type="url" value="${escapeHtml(profile.avatar || "")}" placeholder="https://..." />
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button type="submit" class="btn btn-primary btn-sm">${isBn ? "প্রোফাইল আপডেট" : "Save Profile"}</button>
            <button type="button" id="prof-reset-pw-btn" class="btn btn-glass btn-sm">${isBn ? "পাসওয়ার্ড রিসেট ইমেইল" : "Send Password Reset"}</button>
          </div>
        </form>

        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "সেশন ও নিরাপত্তা" : "Session & Security"}</h2>
          </div>
          <div class="activity-list">
            <div class="activity-row">
              <span>${isBn ? "সক্রিয় রোল" : "Verified Role"}</span>
              <span class="role-pill">${escapeHtml(profile.role)}</span>
            </div>
            <div class="activity-row">
              <span>${isBn ? "সুরক্ষিত রুট" : "Hidden Route"}</span>
              <code style="color:var(--cyan);">/FAHAD/admin</code>
            </div>
          </div>
          <button type="button" id="prof-logout-btn" class="btn btn-danger">${isBn ? "নিরাপদ লগআউট" : "Logout Session"}</button>
        </div>
      </div>
    `;

    this.container.querySelector("#admin-profile-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nextName = this.container.querySelector("#prof-name").value.trim();
      const rawAvatar = this.container.querySelector("#prof-avatar").value.trim();
      const nextAvatar = rawAvatar ? safeUrlOrEmpty(rawAvatar) : "";
      if (rawAvatar && !nextAvatar) {
        showAdminToast(isBn ? "সঠিক HTTPS অ্যাভাটার URL দিন।" : "Invalid avatar URL.", "error");
        return;
      }
      try {
        const db = this.authService.db;
        const { doc, updateDoc, serverTimestamp } = this.authService.fsMod;
        await updateDoc(doc(db, "admins", profile.uid), {
          name: nextName,
          avatar: nextAvatar,
          updatedAt: serverTimestamp()
        });
        profile.name = nextName;
        profile.avatar = nextAvatar;
        showAdminToast(isBn ? "প্রোফাইল আপডেট হয়েছে!" : "Profile updated!", "success");
      } catch (err) {
        showAdminToast(err.message, "error");
      }
    });

    this.container.querySelector("#prof-reset-pw-btn")?.addEventListener("click", async () => {
      const res = await this.authService.resetPassword(profile.email, this.getLang());
      showAdminToast(
        res.ok ? (isBn ? "রিসেট ইমেইল পাঠানো হয়েছে।" : "Password reset email sent.") : res.message,
        res.ok ? "success" : "error"
      );
    });

    this.container.querySelector("#prof-logout-btn")?.addEventListener("click", () => this.onLogout?.());
  }
}

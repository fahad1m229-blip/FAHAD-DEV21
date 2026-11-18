/**
 * FAHAD DEV Admin — User Management & Single-Admin Profile Module
 */

import { escapeHtml, safeUrlOrEmpty, showAdminToast } from "./admin-ui.js";

export class AdminUsersModule {
  constructor(authService, getAdminProfile, getLang, onLogout, onNavigate) {
    this.authService = authService;
    this.getAdminProfile = getAdminProfile;
    this.getLang = getLang;
    this.onLogout = onLogout;
    this.onNavigate = onNavigate;
    this.users = [];
    this.search = "";
    this.filter = "all";
    this.mode = "users"; // "users" | "profile"
  }

  mount(container, mode = "users") {
    this.container = container;
    this.mode = mode;
    this.render();
    this.loadData();
  }

  unmount() {}

  async loadData() {
    try {
      const [usersRes, profRes] = await Promise.all([
        this.authService.apiFetch("/api/admin/users"),
        this.authService.apiFetch("/api/admin/profile")
      ]);
      this.users = Array.isArray(usersRes.users) ? usersRes.users : [];
      const activeProfile = this.getAdminProfile();
      if (activeProfile && profRes.profile) {
        activeProfile.name = profRes.profile.name;
        activeProfile.avatar = profRes.profile.avatar;
      }
      this.render();
    } catch (err) {
      if (err?.status !== 401) {
        console.warn("[Users] Failed to load admin users/profile:", err?.message || err);
      }
    }
  }

  async toggleUserStatus(uid, currentActive) {
    const isBn = this.getLang() === "bn";
    try {
      const nextActive = !currentActive;
      await this.authService.apiFetch(`/api/admin/users/${encodeURIComponent(uid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive })
      });
      await this.loadData();
      showAdminToast(isBn ? "ইউজারের অবস্থা আপডেট হয়েছে।" : "User status updated.", "success");
    } catch (err) {
      if (err?.status !== 401) {
        showAdminToast(err.message, "error");
      }
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
          <span class="kpi-sub">${isBn ? "পাবলিক ইউজার রেকর্ড" : "Directory Records"}</span>
        </div>
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "সক্রিয় ইউজার" : "Active Users"}</span>
          <div class="kpi-value" style="color:var(--success);">${activeCount}</div>
          <span class="kpi-sub">${this.users.length - activeCount} ${isBn ? "নিষ্ক্রিয়/ব্লকড" : "blocked/inactive"}</span>
        </div>
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "অনুমোদিত অ্যাডমিন" : "Authorized Admin"}</span>
          <div class="kpi-value" style="color:var(--cyan);">1</div>
          <span class="kpi-sub">${isBn ? "সিঙ্গেল-অ্যাডমিন লকড" : "Single-Admin Locked"}</span>
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
            <input id="user-search-input" type="text" value="${escapeHtml(this.search)}" placeholder="${isBn ? "নাম, ইমেইল বা আইডি খুঁজুন..." : "Search by name, email or ID..."}" />
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
              : `<div class="activity-row" style="color:var(--muted);">${isBn ? "পাবলিক ইউজার প্যানেলে কোনো রেজিস্ট্রেশন ছাড়াই সবাই অ্যাক্সেস পাচ্ছে।" : "Public User Panel requires no registration. No blocked user records."}</div>`
            }
          </div>
        </div>

        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "একক অনুমোদিত অ্যাডমিন" : "Single Authorized Admin"}</h2>
            <span class="role-pill">OWNER</span>
          </div>
          <div class="activity-list">
            <div class="activity-row">
              <div>
                <strong>${escapeHtml(profile?.name || "FAHAD")}</strong>
                <div style="font-size:12px;color:var(--muted);">${escapeHtml(profile?.email || "")}</div>
              </div>
              <span class="role-pill" style="color:var(--success);">ACTIVE</span>
            </div>
            <div class="activity-row">
              <span>${isBn ? "পাবলিক রেজিস্ট্রেশন" : "Public Registration"}</span>
              <span style="color:var(--gold);font-weight:600;">${isBn ? "সম্পূর্ণ নিষ্ক্রিয়" : "Disabled (Single-Admin Only)"}</span>
            </div>
            <div class="activity-row">
              <span>${isBn ? "অথেনটিকেশন মোড" : "Authentication"}</span>
              <span style="color:var(--cyan);font-weight:600;">scrypt + HttpOnly Cookie</span>
            </div>
          </div>
          <p style="margin:0;font-size:12.5px;color:var(--muted);">
            ${isBn
              ? "নিরাপত্তার জন্য শুধুমাত্র একটি অ্যাডমিন অ্যাকাউন্ট অনুমোদিত। নতুন অ্যাডমিন তৈরি করা যাবে না।"
              : "By security policy, only one authorized administrator account is permitted. Public registration and extra admin creation are blocked."}
          </p>
          <div>
            <button type="button" id="go-change-pw-btn" class="btn btn-glass btn-sm">
              ${isBn ? "সেটিংস থেকে পাসওয়ার্ড পরিবর্তন করুন" : "Manage Password in Settings"}
            </button>
          </div>
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
    this.container.querySelector("#go-change-pw-btn")?.addEventListener("click", () => {
      this.onNavigate?.("settings");
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
            <label>Admin Email (Env Configured)</label>
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
            <button type="button" id="prof-pw-settings-btn" class="btn btn-glass btn-sm">${isBn ? "পাসওয়ার্ড পরিবর্তন" : "Change Password"}</button>
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
            <div class="activity-row">
              <span>${isBn ? "কুকি নিরাপত্তা" : "Session Cookie"}</span>
              <span style="color:var(--success);font-weight:600;">HttpOnly • Signed HMAC</span>
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
        const res = await this.authService.apiFetch("/api/admin/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nextName, avatar: nextAvatar })
        });
        if (res.profile) {
          profile.name = res.profile.name;
          profile.avatar = res.profile.avatar;
        }
        showAdminToast(isBn ? "প্রোফাইল আপডেট হয়েছে!" : "Profile updated!", "success");
      } catch (err) {
        if (err?.status !== 401) {
          showAdminToast(err.message, "error");
        }
      }
    });

    this.container.querySelector("#prof-pw-settings-btn")?.addEventListener("click", () => {
      this.onNavigate?.("settings");
    });

    this.container.querySelector("#prof-logout-btn")?.addEventListener("click", () => this.onLogout?.());
  }
}

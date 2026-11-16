/**
 * FAHAD DEV Admin — Phase 1 Live Firestore Dashboard Module
 * Displays real Firestore counts, stats/{day} charts (7d/30d), and logs.
 * Never fabricates demo analytics as live data.
 */

import { escapeHtml, showAdminToast } from "./admin-ui.js";

export class AdminDashboardModule {
  constructor(authService, getLang, onNavigate) {
    this.authService = authService;
    this.getLang = getLang;
    this.onNavigate = onNavigate;
    this.unsubs = [];
    this.rangeDays = 7;
    this.activeMetric = "visits";
    this.data = {
      categories: [],
      totalVersions: 0,
      totalLinks: 0,
      statsDocs: [],
      logs: [],
      siteSettings: {},
      maintenance: {}
    };
  }

  mount(container) {
    this.container = container;
    this.render();
    this.subscribe();
  }

  unmount() {
    while (this.unsubs.length) {
      const u = this.unsubs.pop();
      try { u(); } catch {}
    }
  }

  refresh() {
    this.unmount();
    this.subscribe();
  }

  subscribe() {
    const db = this.authService.db;
    const { collection, doc, query, orderBy, limit, onSnapshot, getDocs } = this.authService.fsMod;
    if (!db) return;

    // 1. Categories + nested versions & links count
    const catUnsub = onSnapshot(
      query(collection(db, "categories"), orderBy("order", "asc")),
      async (snap) => {
        const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        let versionsCount = 0;
        let linksCount = 0;

        await Promise.all(
          cats.map(async (cat) => {
            try {
              const vSnap = await getDocs(collection(db, "categories", cat.id, "versions"));
              cat._versionCount = vSnap.size;
              versionsCount += vSnap.size;
              for (const vDoc of vSnap.docs) {
                const vData = vDoc.data();
                if (Array.isArray(vData.links)) {
                  linksCount += vData.links.length;
                }
                try {
                  const lSnap = await getDocs(
                    collection(db, "categories", cat.id, "versions", vDoc.id, "links")
                  );
                  linksCount += lSnap.size;
                } catch {}
              }
            } catch {
              cat._versionCount = 0;
            }
          })
        );

        this.data.categories = cats;
        this.data.totalVersions = versionsCount;
        this.data.totalLinks = linksCount;
        this.render();
      },
      (err) => {
        console.warn("[Dashboard] Categories error:", err);
      }
    );
    this.unsubs.push(catUnsub);

    // 2. Stats/{day} (last 30 days)
    const statsUnsub = onSnapshot(
      query(collection(db, "stats"), limit(30)),
      (snap) => {
        this.data.statsDocs = snap.docs
          .map((d) => ({ day: d.id, ...d.data() }))
          .sort((a, b) => a.day.localeCompare(b.day));
        this.render();
      },
      () => {
        this.data.statsDocs = [];
        this.render();
      }
    );
    this.unsubs.push(statsUnsub);

    // 3. Recent Activity Logs
    const logsUnsub = onSnapshot(
      query(collection(db, "logs"), orderBy("time", "desc"), limit(8)),
      (snap) => {
        this.data.logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.render();
      },
      () => {
        this.data.logs = [];
        this.render();
      }
    );
    this.unsubs.push(logsUnsub);

    // 4. Site & Maintenance Status
    this.unsubs.push(
      onSnapshot(doc(db, "settings", "site"), (snap) => {
        this.data.siteSettings = snap.exists() ? snap.data() : {};
        this.render();
      })
    );
    this.unsubs.push(
      onSnapshot(doc(db, "settings", "maintenance"), (snap) => {
        this.data.maintenance = snap.exists() ? snap.data() : {};
        this.render();
      })
    );
  }

  renderChartSvg(statsSlice, metric, isBn) {
    if (!statsSlice.length) {
      return `
        <div style="text-align:center;color:var(--muted);padding:28px 12px;">
          <p style="margin:0 0 6px;font-weight:600;">${isBn ? "এখনো কোনো লাইভ অ্যানালিটিক্স ডেটা নেই" : "No live stats/{day} records yet"}</p>
          <span style="font-size:12px;">${isBn ? "ভিজিটর ও ক্লিক ডেটা stats/{YYYY-MM-DD} থেকে রিয়েল-টাইমে দেখাবে।" : "Real metrics will render automatically as stats/{YYYY-MM-DD} documents are recorded."}</span>
        </div>
      `;
    }

    const w = 640;
    const h = 180;
    const padX = 28;
    const padY = 22;
    const vals = statsSlice.map((s) => Number(s[metric] || 0));
    const maxVal = Math.max(1, ...vals);

    const points = vals.map((v, i) => {
      const x = statsSlice.length === 1
        ? w / 2
        : padX + (i / (statsSlice.length - 1)) * (w - padX * 2);
      const y = h - padY - (v / maxVal) * (h - padY * 2);
      return { x, y, v, day: statsSlice[i].day };
    });

    const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${points[0].x.toFixed(1)},${h - padY} ${polyline} ${points[points.length - 1].x.toFixed(1)},${h - padY}`;

    return `
      <svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Analytics chart">
        <defs>
          <linearGradient id="dashChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3B6CFF" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#22D3EE" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <line x1="${padX}" y1="${h - padY}" x2="${w - padX}" y2="${h - padY}" stroke="rgba(108,140,255,0.25)" />
        <polygon points="${area}" fill="url(#dashChartFill)" />
        <polyline points="${polyline}" fill="none" stroke="#22D3EE" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        ${points.map((p) => `
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#3B6CFF" stroke="#EAF0FF" stroke-width="1.5">
            <title>${escapeHtml(p.day)}: ${p.v}</title>
          </circle>
        `).join("")}
      </svg>
    `;
  }

  render() {
    if (!this.container) return;
    const isBn = this.getLang() === "bn";
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayDoc = this.data.statsDocs.find((d) => d.day === todayKey);
    const totalDownloads = this.data.statsDocs.reduce((sum, d) => sum + Number(d.downloads || 0), 0);
    const isMaint = Boolean(this.data.maintenance?.enabled ?? this.data.siteSettings?.maintenance);
    const slice = this.data.statsDocs.slice(-this.rangeDays);

    this.container.innerHTML = `
      <section class="kpi-grid" aria-label="Key Statistics">
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "মোট ক্যাটাগরি" : "Total Categories"}</span>
          <div class="kpi-value">${this.data.categories.length}</div>
          <span class="kpi-sub">Firestore: categories</span>
        </div>
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "মোট ভার্সন" : "Total Versions"}</span>
          <div class="kpi-value">${this.data.totalVersions}</div>
          <span class="kpi-sub">Nested subcollections</span>
        </div>
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "মোট লিংক" : "Total Links"}</span>
          <div class="kpi-value">${this.data.totalLinks}</div>
          <span class="kpi-sub">Verified resources</span>
        </div>
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "আজকের ভিজিটর" : "Today's Visitors"}</span>
          <div class="kpi-value">${todayDoc ? Number(todayDoc.visits || 0) : 0}</div>
          <span class="kpi-sub">${todayDoc ? escapeHtml(todayKey) : (isBn ? "রেকর্ড নেই" : "No stats/{day} yet")}</span>
        </div>
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "মোট ডাউনলোড ক্লিক" : "Total Download Clicks"}</span>
          <div class="kpi-value">${totalDownloads}</div>
          <span class="kpi-sub">${this.data.statsDocs.length} ${isBn ? "দিনের ডেটা" : "day(s) tracked"}</span>
        </div>
        <div class="glass-card kpi-card">
          <span class="kpi-label">${isBn ? "ওয়েবসাইট ও মেইনটেন্যান্স" : "Site & Maintenance"}</span>
          <div class="kpi-value" style="font-size:18px;color:${isMaint ? "var(--gold)" : "var(--success)"}">
            ${isMaint ? (isBn ? "মেইনটেন্যান্স চালু" : "Maintenance ON") : (isBn ? "লাইভ" : "Online • Live")}
          </div>
          <span class="kpi-sub">${escapeHtml(this.data.siteSettings?.siteName || "FAHAD DEV")}</span>
        </div>
      </section>

      <section class="dash-grid">
        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "ট্র্যাফিক ও ক্লিক চার্ট" : "Analytics Overview"}</h2>
            <div class="chip-group">
              <button type="button" class="chip-btn ${this.rangeDays === 7 ? "active" : ""}" data-range="7">${isBn ? "৭ দিন" : "7 Days"}</button>
              <button type="button" class="chip-btn ${this.rangeDays === 30 ? "active" : ""}" data-range="30">${isBn ? "৩০ দিন" : "30 Days"}</button>
            </div>
          </div>
          <div class="chip-group">
            <button type="button" class="chip-btn ${this.activeMetric === "visits" ? "active" : ""}" data-metric="visits">${isBn ? "ভিজিটর" : "Visitors"}</button>
            <button type="button" class="chip-btn ${this.activeMetric === "views" ? "active" : ""}" data-metric="views">${isBn ? "ক্যাটাগরি ভিউ" : "Category Views"}</button>
            <button type="button" class="chip-btn ${this.activeMetric === "clicks" ? "active" : ""}" data-metric="clicks">${isBn ? "লিংক ক্লিক" : "Link Clicks"}</button>
          </div>
          <div class="chart-box">
            ${this.renderChartSvg(slice, this.activeMetric, isBn)}
          </div>
        </div>

        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "দ্রুত অ্যাকশন" : "Quick Actions"}</h2>
          </div>
          <div class="quick-actions-grid">
            <button type="button" class="btn btn-primary btn-sm" data-nav="siteSettings">${isBn ? "সাইট সেটিংস" : "Site Settings"}</button>
            <a class="btn btn-glass btn-sm" href="../index.html" target="_blank" rel="noopener noreferrer">${isBn ? "ওয়েবসাইট দেখুন" : "View Website"}</a>
            <button type="button" class="btn btn-glass btn-sm" id="dash-refresh-btn">${isBn ? "ডেটা রিফ্রেশ" : "Refresh Data"}</button>
            <button type="button" class="btn btn-glass btn-sm" data-nav="categories">${isBn ? "ক্যাটাগরি" : "Categories"}</button>
          </div>

          <div class="panel-head" style="margin-top:6px;">
            <h2>${isBn ? "সিস্টেম স্ট্যাটাস" : "System Status"}</h2>
          </div>
          <div class="activity-list">
            <div class="activity-row">
              <span>Firebase Auth</span>
              <span style="color:var(--success);font-weight:600;">${isBn ? "সংযুক্ত" : "Verified"}</span>
            </div>
            <div class="activity-row">
              <span>Firestore Real-Time Sync</span>
              <span style="color:var(--cyan);font-weight:600;">onSnapshot</span>
            </div>
            <div class="activity-row">
              <span>Admin Access Boundary</span>
              <span style="color:var(--gold);font-weight:600;">admins/{uid}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="dash-grid">
        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "সাম্প্রতিক কার্যক্রম (Logs)" : "Recent Activities"}</h2>
          </div>
          <div class="activity-list">
            ${this.data.logs.length
              ? this.data.logs.map((log) => `
                  <div class="activity-row">
                    <div>
                      <strong>${escapeHtml(log.action || "UPDATE")}</strong>
                      <div style="font-size:12px;color:var(--muted);">${escapeHtml(log.admin || "Admin")}</div>
                    </div>
                    <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);">
                      ${log.time?.toDate ? log.time.toDate().toLocaleString() : "—"}
                    </span>
                  </div>
                `).join("")
              : `<div class="activity-row" style="color:var(--muted);">${isBn ? "এখনো কোনো অ্যাক্টিভিটি লগ নেই।" : "No activity logs recorded yet."}</div>`
            }
          </div>
        </div>

        <div class="glass-card panel-card">
          <div class="panel-head">
            <h2>${isBn ? "শীর্ষ ক্যাটাগরি" : "Top Categories"}</h2>
          </div>
          <div class="activity-list">
            ${this.data.categories.length
              ? this.data.categories.slice(0, 5).map((cat) => `
                  <div class="activity-row">
                    <span>${escapeHtml(cat.icon || "📁")} ${escapeHtml(cat.title || cat.titleEn || cat.id)}</span>
                    <span class="role-pill">${cat._versionCount ?? 0} ver</span>
                  </div>
                `).join("")
              : `<div class="activity-row" style="color:var(--muted);">${isBn ? "Firestore-এ এখনো কোনো ক্যাটাগরি নেই।" : "No categories found in Firestore yet."}</div>`
            }
          </div>
        </div>
      </section>
    `;

    this.container.querySelectorAll("[data-range]").forEach((btn) => {
      btn.onclick = () => {
        this.rangeDays = Number(btn.dataset.range);
        this.render();
      };
    });
    this.container.querySelectorAll("[data-metric]").forEach((btn) => {
      btn.onclick = () => {
        this.activeMetric = btn.dataset.metric;
        this.render();
      };
    });
    this.container.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.onclick = () => this.onNavigate?.(btn.dataset.nav);
    });
    this.container.querySelector("#dash-refresh-btn")?.addEventListener("click", () => {
      this.refresh();
      showAdminToast(isBn ? "ডেটা রিফ্রেশ হয়েছে।" : "Dashboard data refreshed.", "success");
    });
  }
}

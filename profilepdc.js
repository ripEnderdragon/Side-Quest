<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PDC 2026 – Dashboard & Profile</title>

  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800&display=swap" rel="stylesheet" />

  <style>
    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: Nunito, Arial, sans-serif !important;
    }

    html, body {
      width: 100% !important;
      min-height: 100vh !important;
      background: linear-gradient(180deg, #a5c4ff 0%, #4d81e3 100%) !important;
    }

    a, a:hover, a:visited, a:focus, a:active {
      color: #323289 !important;
      text-decoration: none !important;
    }

    /* ── BACKGROUND LAYERS ── */
    .bg-top {
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 100% !important; height: 50% !important;
      z-index: 0 !important;
      pointer-events: none !important;
    }
    .bg-top img {
      width: 100% !important; height: 100% !important;
      object-fit: cover !important;
    }
    .bg-bottom {
      position: fixed !important;
      bottom: 0 !important; left: 0 !important;
      width: 100% !important; height: 50% !important;
      z-index: 0 !important;
      pointer-events: none !important;
    }
    .bg-bottom img {
      width: 100% !important; height: 100% !important;
      object-fit: cover !important;
    }

    /* ── SIDEBAR ── */
    .sidebar {
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: 120px !important;
      height: 100vh !important;
      background: #3F3FA4 !important;
      box-shadow: 0 4px 4px rgba(0,0,0,0.25) !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      z-index: 10 !important;
      padding-top: 15px !important;
    }
    .sidebar-logo {
      width: 92px !important;
      height: 92px !important;
      object-fit: contain !important;
    }
    .sidebar-title {
      font-size: 8px !important;
      font-weight: 700 !important;
      color: #fff !important;
      text-align: center !important;
      line-height: 12px !important;
      margin-top: 8px !important;
      padding: 0 5px !important;
    }

    /* ── NAV BUTTONS (sidebar) ── */
    .nav-btn {
      width: 100% !important;
      height: 90px !important;
      border: none !important;
      border-radius: 0 !important;
      background: transparent !important;
      cursor: pointer !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      color: #fff !important;
      transition: background 0.15s !important;
      margin-top: 2px !important;
      outline: none !important;
      -webkit-appearance: none !important;
      appearance: none !important;
    }
    .nav-btn:hover, .nav-btn.active { background: #323289 !important; }
    .nav-btn svg {
      width: 24px !important; height: 24px !important;
      stroke: #fff !important; fill: none !important;
      stroke-width: 2 !important;
      stroke-linecap: round !important; stroke-linejoin: round !important;
    }
    .nav-btn span {
      font-size: 11px !important;
      font-weight: 800 !important;
      color: #fff !important;
      text-shadow: 0 1.8px 5.5px rgba(0,0,0,0.25) !important;
    }

    /* ── PAGE HEADER (desktop) ── */
    .page-header {
      position: fixed !important;
      top: 25px !important;
      left: 160px !important; right: 40px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      z-index: 5 !important;
      color: #323289 !important;
      pointer-events: none !important;
    }
    .page-header h2 { font-size: 28px !important; font-weight: 800 !important; }
    .page-header p  { font-size: 15px !important; font-weight: 700 !important; }

    /* ── MAIN PAGE LAYOUT ── */
    .page {
      margin-left: 120px !important;
      min-height: 100vh !important;
      display: flex !important;
      align-items: flex-start !important;
      justify-content: center !important;
      flex-wrap: wrap !important;
      gap: 24px !important;
      padding: 100px 24px 48px !important;
      position: relative !important;
      z-index: 2 !important;
    }

    /* ── PROFILE CARD ── */
    .profile-card {
      width: 256px !important;
      flex-shrink: 0 !important;
      background: #fff !important;
      border-radius: 30px !important;
      box-shadow: 0 5px 0 #3f3fa4 !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      padding: 0 0 28px !important;
      overflow: hidden !important;
      margin-top: 73px !important;
      align-self: flex-start !important;
    }
    .profile-avatar-bar {
      width: 100% !important;
      background: #3F3FA4 !important;
      display: flex !important;
      justify-content: center !important;
      padding: 25px 0 0 !important;
    }
    .profile-icon {
      width: 100px !important; height: 100px !important;
      border-radius: 50% !important;
      background: #fff !important;
      object-fit: cover !important;
      border: 3px solid #fff !important;
    }
    .profile-name {
      font-size: 20px !important; font-weight: 800 !important;
      color: #323289 !important; text-align: center !important;
      margin-top: 12px !important; line-height: 1.3 !important;
      padding: 0 12px !important; word-break: break-word !important;
    }
    .profile-fields {
      width: 100% !important;
      padding: 8px 20px 0 !important;
      display: flex !important; flex-direction: column !important; gap: 4px !important;
    }
    .field-row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      font-size: 14px !important; color: #323289 !important;
      border-bottom: 0.5px solid #e0e0f0 !important;
      padding: 6px 0 !important;
    }
    .field-row:last-child { border-bottom: none !important; }
    .field-label {
      font-weight: 800 !important; color: #6666bb !important;
      min-width: 60px !important; flex-shrink: 0 !important;
    }
    .field-value {
      text-align: right !important; color: #323289 !important;
      overflow: hidden !important; text-overflow: ellipsis !important;
      white-space: nowrap !important; max-width: 140px !important;
    }
    .status-badge {
      margin-top: 20px !important;
      border-radius: 12px !important;
      padding: 8px 32px !important;
      color: #fff !important;
      font-size: 14px !important; font-weight: 700 !important;
      background: #797980 !important;
    }

    /* ── WIDGET / CONTENT CARD ── */
    .widget-card {
      flex: 1 1 300px !important;
      max-width: 760px !important;
      min-height: 438px !important;
      background: #fff !important;
      border-radius: 30px !important;
      box-shadow: 0 5px 0 #3f3fa4 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      padding: 32px 36px 28px !important;
      text-align: left !important;
      font-size: 16px !important;
      font-weight: 500 !important;
      color: #323289 !important;
      line-height: 1.5 !important;
      align-self: flex-start !important;
      margin-top: 73px !important;
      overflow-x: auto !important;
      scrollbar-width: none !important;
    }

    /* ── PROFILE FORM (inside widget card on profile page) ── */
    .profile-form-title {
      font-size: 22px !important;
      font-weight: 800 !important;
      color: #3F3FA4 !important;
      margin-bottom: 20px !important;
    }
    .form-group {
      display: flex !important;
      flex-direction: column !important;
      gap: 4px !important;
      margin-bottom: 16px !important;
    }
    .form-group label {
      font-size: 13px !important;
      font-weight: 800 !important;
      color: #6666bb !important;
    }
    .form-group input,
    .form-group select,
    .form-group textarea {
      border: 1.5px solid #d0d0f0 !important;
      border-radius: 10px !important;
      padding: 10px 14px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #323289 !important;
      outline: none !important;
      width: 100% !important;
      background: #f7f7fd !important;
      transition: border-color 0.15s !important;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      border-color: #3F3FA4 !important;
      background: #fff !important;
    }
    .form-row {
      display: flex !important;
      gap: 16px !important;
    }
    .form-row .form-group { flex: 1 !important; }
    .form-submit-btn {
      margin-top: 8px !important;
      background: #3F3FA4 !important;
      color: #fff !important;
      border: none !important;
      border-radius: 12px !important;
      padding: 12px 36px !important;
      font-size: 15px !important;
      font-weight: 800 !important;
      cursor: pointer !important;
      box-shadow: 0 4px 0 #25256e !important;
      transition: opacity 0.15s, transform 0.1s !important;
    }
    .form-submit-btn:hover { opacity: 0.9 !important; transform: translateY(1px) !important; }

    /* ── PAGE TABS ── */
    .page-tabs {
      display: flex !important;
      gap: 0 !important;
      margin-bottom: 24px !important;
      border-bottom: 2px solid #e0e0f0 !important;
    }
    .tab-btn {
      background: none !important;
      border: none !important;
      padding: 10px 24px !important;
      font-size: 15px !important;
      font-weight: 800 !important;
      color: #aaaacc !important;
      cursor: pointer !important;
      border-bottom: 3px solid transparent !important;
      margin-bottom: -2px !important;
      transition: color 0.15s, border-color 0.15s !important;
    }
    .tab-btn.active {
      color: #3F3FA4 !important;
      border-bottom-color: #3F3FA4 !important;
    }

    /* ── VIEW VISIBILITY ── */
    .view { display: none !important; }
    .view.active { display: block !important; }

    /* ── MOBILE TOP BAR ── */
    .top-bar { display: none !important; }

    /* ── MOBILE BOTTOM BAR ── */
    .bottom-bar { display: none !important; }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .sidebar { display: none !important; }
      .page-header { display: none !important; }

      .top-bar {
        display: flex !important;
        position: sticky !important;
        top: 0 !important;
        z-index: 10 !important;
        background: #3F3FA4 !important;
        align-items: center !important;
        gap: 12px !important;
        padding: 10px 16px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
      }
      .top-bar img { width: 40px !important; height: 40px !important; object-fit: contain !important; }
      .top-bar-title { font-size: 13px !important; font-weight: 800 !important; color: #fff !important; line-height: 1.3 !important; }
      .top-bar-email {
        margin-left: auto !important;
        font-size: 11px !important; font-weight: 700 !important;
        color: rgba(255,255,255,0.8) !important;
        text-align: right !important; max-width: 140px !important;
        overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;
      }

      .bottom-bar {
        display: flex !important;
        position: fixed !important;
        bottom: 0 !important; left: 0 !important;
        width: 100% !important; height: 60px !important;
        background: #3F3FA4 !important;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.25) !important;
        z-index: 20 !important;
      }
      .bottom-bar .nav-btn {
        height: 100% !important; margin-top: 0 !important;
        flex: 1 !important; border-radius: 0 !important;
      }
      .bottom-bar .nav-btn svg { width: 22px !important; height: 22px !important; }
      .bottom-bar .nav-btn span { font-size: 10px !important; }

      .page {
        margin-left: 0 !important;
        padding: 20px 16px 80px !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 16px !important;
      }

      .profile-card {
        width: 100% !important; max-width: 420px !important;
        margin-top: 0 !important; border-radius: 24px !important;
      }
      .profile-icon { width: 90px !important; height: 90px !important; }
      .profile-name { font-size: 20px !important; }

      .widget-card {
        width: 100% !important; max-width: 420px !important;
        min-height: 200px !important; font-size: 15px !important;
        border-radius: 24px !important; padding: 24px 20px !important;
        margin-top: 0 !important;
      }

      .form-row { flex-direction: column !important; gap: 0 !important; }
    }

    @media (max-width: 480px) {
      .widget-card { font-size: 14px !important; line-height: 1.4 !important; }
    }
  </style>
</head>
<body>

  <!-- ── BACKGROUND LAYERS ── -->
  <div class="bg-top">
    <img src="https://github.com/caatz38/pdc-gassin/blob/main/assets/dashboard/Vector.png?raw=true" alt="" />
  </div>
  <div class="bg-bottom">
    <img src="https://github.com/caatz38/pdc-gassin/blob/main/assets/dashboard/bottom.png?raw=true" alt="" />
  </div>

  <!-- ── DESKTOP SIDEBAR ── -->
  <aside class="sidebar">
    <img class="sidebar-logo"
      src="https://github.com/caatz38/pdc-gassin/blob/main/assets/pdc%20logo.avif?raw=true"
      alt="PDC Logo" />
    <p class="sidebar-title">Pradita Dirgantara<br />Competition 2026</p>

    <button class="nav-btn" id="sidebarHome" aria-label="Home">
      <svg viewBox="0 0 24 24"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      <span>Home</span>
    </button>

    <button class="nav-btn" id="sidebarProfile" aria-label="Profile">
      <svg viewBox="0 0 24 24"><path d="M11.5 15H7a4 4 0 0 0-4 4v2"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="7" r="4"/></svg>
      <span>Profile</span>
    </button>

    <button class="nav-btn" id="logoutBtn" aria-label="Logout">
      <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <span>Logout</span>
    </button>
  </aside>

  <!-- ── MOBILE TOP BAR ── -->
  <header class="top-bar">
    <img src="https://github.com/caatz38/pdc-gassin/blob/main/assets/pdc%20logo.avif?raw=true" alt="PDC Logo" />
    <div class="top-bar-title">Pradita Dirgantara<br/>Competition 2026</div>
    <div class="top-bar-email" id="userEmailMobile">Checking session...</div>
  </header>

  <!-- ── PAGE HEADER (desktop) ── -->
  <div class="page-header">
    <h2 id="pageTitle">Dashboard</h2>
    <p>Logged in as: <span id="userEmail">Checking session...</span></p>
  </div>

  <!-- ── MAIN CONTENT ── -->
  <main class="page">

    <!-- Left: profile summary card -->
    <section class="profile-card">
      <div class="profile-avatar-bar">
        <img class="profile-icon"
          src="https://github.com/caatz38/pdc-gassin/blob/main/assets/pdc%20logo.avif?raw=true"
          alt="Avatar" id="profileAvatar" />
      </div>
      <h2 class="profile-name" id="displayFullName">Loading profile...</h2>
      <div class="profile-fields">
        <div class="field-row">
          <span class="field-label">School</span>
          <span class="field-value" id="displaySchool">Loading...</span>
        </div>
        <div class="field-row">
          <span class="field-label">NISN</span>
          <span class="field-value" id="displayNisn">Loading...</span>
        </div>
        <div class="field-row">
          <span class="field-label">Phone</span>
          <span class="field-value" id="displayPhone">Loading...</span>
        </div>
        <div class="field-row">
          <span class="field-label">Grade</span>
          <span class="field-value" id="displayGrade">Loading...</span>
        </div>
      </div>
      <div class="status-badge" id="displayStatus">Checking...</div>
    </section>

    <!-- Right: tab-switched content card -->
    <div class="widget-card">

      <!-- TABS -->
      <div class="page-tabs">
        <button class="tab-btn active" id="tabDashboard">Dashboard</button>
        <button class="tab-btn" id="tabProfile">Profile</button>
      </div>

      <!-- DASHBOARD VIEW -->
      <div class="view active" id="viewDashboard">
        <div id="widgetMainText" style="font-size:28px;font-weight:800;text-align:center;padding:40px 0;">
          Please complete your profile to register a competition!
        </div>
      </div>

      <!-- PROFILE / FORM VIEW -->
      <div class="view" id="viewProfile">
        <div class="profile-form-title">Edit Profile</div>

        <div class="form-row">
          <div class="form-group">
            <label for="fieldFullName">Full Name</label>
            <input type="text" id="fieldFullName" placeholder="Your full name" />
          </div>
          <div class="form-group">
            <label for="fieldNisn">NISN</label>
            <input type="text" id="fieldNisn" placeholder="Your NISN" />
          </div>
        </div>

        <div class="form-group">
          <label for="fieldSchool">School Name</label>
          <input type="text" id="fieldSchool" placeholder="Your school" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="fieldGrade">Grade</label>
            <select id="fieldGrade">
              <option value="">Select grade</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </div>
          <div class="form-group">
            <label for="fieldPhone">Phone / WhatsApp</label>
            <input type="tel" id="fieldPhone" placeholder="+62..." />
          </div>
        </div>

        <div class="form-group">
          <label for="fieldAddress">Address</label>
          <textarea id="fieldAddress" rows="3" placeholder="Your address"></textarea>
        </div>

        <button class="form-submit-btn" id="saveProfileBtn">Save Profile</button>
        <div id="formStatus" style="margin-top:12px;font-size:13px;font-weight:700;color:#3F3FA4;display:none;"></div>
      </div>

    </div><!-- .widget-card -->

  </main>

  <!-- ── MOBILE BOTTOM BAR ── -->
  <nav class="bottom-bar">
    <button class="nav-btn active" id="mobileHome" aria-label="Home">
      <svg viewBox="0 0 24 24"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      <span>Home</span>
    </button>
    <button class="nav-btn" id="mobileProfile" aria-label="Profile">
      <svg viewBox="0 0 24 24"><path d="M11.5 15H7a4 4 0 0 0-4 4v2"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="7" r="4"/></svg>
      <span>Profile</span>
    </button>
    <button class="nav-btn" id="logoutBtnMobile" aria-label="Logout">
      <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <span>Logout</span>
    </button>
  </nav>

  <!-- ── SCRIPTS ── -->
  <script>
    /* ──────────────────────────────────────────────
       NAVIGATION / TAB SWITCHING
    ────────────────────────────────────────────── */
    function showView(name) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('view' + name).classList.add('active');
      document.getElementById('tab' + name).classList.add('active');
      document.getElementById('pageTitle').textContent = name === 'Dashboard' ? 'Dashboard' : 'Profile';

      // Sync sidebar & mobile bottom bar active states
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      if (name === 'Dashboard') {
        document.getElementById('sidebarHome').classList.add('active');
        document.getElementById('mobileHome').classList.add('active');
      } else {
        document.getElementById('sidebarProfile').classList.add('active');
        document.getElementById('mobileProfile').classList.add('active');
      }
    }

    document.getElementById('tabDashboard').addEventListener('click',   () => showView('Dashboard'));
    document.getElementById('tabProfile').addEventListener('click',     () => showView('Profile'));
    document.getElementById('sidebarHome').addEventListener('click',    () => showView('Dashboard'));
    document.getElementById('sidebarProfile').addEventListener('click', () => showView('Profile'));
    document.getElementById('mobileHome').addEventListener('click',     () => showView('Dashboard'));
    document.getElementById('mobileProfile').addEventListener('click',  () => showView('Profile'));

    /* ──────────────────────────────────────────────
       EMAIL MIRRORING (desktop → mobile top bar)
    ────────────────────────────────────────────── */
    const emailEl       = document.getElementById('userEmail');
    const emailMobileEl = document.getElementById('userEmailMobile');
    const emailObserver = new MutationObserver(() => {
      if (emailMobileEl) emailMobileEl.textContent = emailEl.textContent;
    });
    if (emailEl) emailObserver.observe(emailEl, { childList: true, subtree: true, characterData: true });

    /* ──────────────────────────────────────────────
       LOGOUT
    ────────────────────────────────────────────── */
    function handleLogout() {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut()
          .then(() => { window.location.href = '/'; })
          .catch(console.error);
      }
    }
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('logoutBtnMobile').addEventListener('click', handleLogout);

    /* ──────────────────────────────────────────────
       FIREBASE AUTH + FIRESTORE
       Replace the firebaseConfig below with your own.
    ────────────────────────────────────────────── */
    // const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", ... };
    // firebase.initializeApp(firebaseConfig);

    // Helper: populate profile summary card
    function populateProfileCard(data) {
      document.getElementById('displayFullName').textContent = data.fullName  || '—';
      document.getElementById('displaySchool').textContent   = data.school    || '—';
      document.getElementById('displayNisn').textContent     = data.nisn      || '—';
      document.getElementById('displayPhone').textContent    = data.phone     || '—';
      document.getElementById('displayGrade').textContent    = data.grade ? 'Grade ' + data.grade : '—';

      const badge = document.getElementById('displayStatus');
      if (data.fullName && data.school && data.nisn) {
        badge.textContent        = 'Profile Complete';
        badge.style.background   = '#3F3FA4';
        document.getElementById('widgetMainText').innerHTML =
          'Welcome back, <strong>' + data.fullName + '</strong>!<br/>You can now register for a competition.';
      } else {
        badge.textContent        = 'Incomplete';
        badge.style.background   = '#797980';
      }

      // Pre-fill form fields
      document.getElementById('fieldFullName').value = data.fullName || '';
      document.getElementById('fieldNisn').value     = data.nisn     || '';
      document.getElementById('fieldSchool').value   = data.school   || '';
      document.getElementById('fieldGrade').value    = data.grade    || '';
      document.getElementById('fieldPhone').value    = data.phone    || '';
      document.getElementById('fieldAddress').value  = data.address  || '';
    }

    // Auth state listener
    if (typeof firebase !== 'undefined') {
      firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
          window.location.href = '/';
          return;
        }

        emailEl.textContent = user.email;

        const db   = firebase.firestore();
        const ref  = db.collection('users').doc(user.uid);

        // Load profile
        ref.get().then(doc => {
          if (doc.exists) populateProfileCard(doc.data());
          else populateProfileCard({});
        }).catch(console.error);

        // Save profile
        document.getElementById('saveProfileBtn').addEventListener('click', function() {
          const payload = {
            fullName : document.getElementById('fieldFullName').value.trim(),
            nisn     : document.getElementById('fieldNisn').value.trim(),
            school   : document.getElementById('fieldSchool').value.trim(),
            grade    : document.getElementById('fieldGrade').value,
            phone    : document.getElementById('fieldPhone').value.trim(),
            address  : document.getElementById('fieldAddress').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };

          const statusEl = document.getElementById('formStatus');
          statusEl.style.display = 'block';
          statusEl.textContent   = 'Saving…';

          ref.set(payload, { merge: true })
            .then(() => {
              statusEl.textContent = '✓ Profile saved successfully!';
              populateProfileCard(payload);
              setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
            })
            .catch(err => {
              statusEl.textContent = '✗ Error: ' + err.message;
            });
        });
      });
    } else {
      // Demo mode (no Firebase loaded)
      emailEl.textContent = 'demo@pdc2026.id';
      populateProfileCard({
        fullName : 'Demo User',
        school   : 'SMA Pradita Dirgantara',
        nisn     : '1234567890',
        phone    : '+62 812-3456-7890',
        grade    : '11'
      });
    }
  </script>

</body>
</html>
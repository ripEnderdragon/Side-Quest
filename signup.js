<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap');

        .pdc-root,
        .pdc-root * {
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Nunito', Arial, sans-serif !important;
        }

        .pdc-root a,
        .pdc-root a:hover,
        .pdc-root a:focus,
        .pdc-root a:active,
        .pdc-root a:visited {
            font-size: inherit !important;
            color: #fff !important;
            text-decoration: none !important;
            line-height: inherit !important;
        }

        .pdc-root { width: 100% !important; overflow-x: hidden !important; }

        /* ── NAVBAR ── */
        .pdc-nav {
            width: 100% !important;
            height: 71px !important;
            background-image: linear-gradient(to right, #607EBD, #5480D4, #5480D4) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 0 34px !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 100 !important;
        }

        .pdc-nav-links {
            display: flex !important;
            align-items: center !important;
            gap: 34px !important;
            list-style: none !important;
        }
        .pdc-nav-links li { list-style: none !important; }
        .pdc-nav-links a {
            color: #fff !important;
            text-decoration: none !important;
            font-size: 18px !important;
            font-weight: 600 !important;
            letter-spacing: -0.02em !important;
        }
        .pdc-nav-links a:hover { opacity: 0.8 !important; }

        /* Burger */
        .pdc-burger {
            display: none !important;
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            color: #fff !important;
            padding: 4px !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .pdc-drawer-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 200;
        }
        .pdc-drawer {
            position: fixed !important;
            top: 0 !important;
            left: -280px !important;
            width: 260px !important;
            height: 100vh !important;
            background: #111 !important;
            z-index: 201 !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 20px !important;
            gap: 4px !important;
            transition: left 0.3s ease !important;
        }
        .pdc-drawer.pdc-open { left: 0 !important; }
        .pdc-drawer-close {
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            color: #fff !important;
            align-self: flex-end !important;
            padding: 4px !important;
            margin-bottom: 16px !important;
        }
        .pdc-drawer a {
            color: #fff !important;
            font-size: 18px !important;
            font-weight: 600 !important;
            text-decoration: none !important;
            padding: 12px 8px !important;
            border-bottom: 1px solid rgba(255,255,255,0.1) !important;
            display: block !important;
        }
        @media (max-width: 768px) {
            .pdc-nav-links { display: none !important; }
            .pdc-burger { display: flex !important; }
        }
        @media (min-width: 769px) {
            .pdc-burger { display: none !important; }
            .pdc-drawer { left: -280px !important; }
            .pdc-drawer.pdc-open { left: -280px !important; }
        }

        /* ── SIGNUP PAGE ── */
        .pdc-signup-page {
            width: 100% !important;
            min-height: calc(100vh - 71px) !important;
            background: radial-gradient(172.37% 141.42% at 100% 100%, #a5c4ff, #4d81e2 55.92%, #627eba) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
            overflow: hidden !important;
            padding: 40px 20px !important;
        }

        .pdc-signup-bg-left {
            position: absolute !important;
            left: 0 !important; bottom: 0 !important;
            height: 90% !important;
            object-fit: contain !important;
            pointer-events: none !important;
            z-index: 0 !important;
        }
        .pdc-signup-bg-right {
            position: absolute !important;
            right: 0 !important; bottom: 0 !important;
            height: 80% !important;
            object-fit: contain !important;
            pointer-events: none !important;
            z-index: 0 !important;
        }
        .pdc-signup-logo {
            position: absolute !important;
            top: -16px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 120px !important;
            object-fit: contain !important;
            z-index: 2 !important;
            pointer-events: none !important;
        }

        /* Card */
        .pdc-signup-card {
            position: relative !important;
            z-index: 1 !important;
            width: 100% !important;
            max-width: 430px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 0 !important;
            padding-top: 80px !important;
        }

        .pdc-signup-title {
            color: #fff !important;
            font-size: 40px !important;
            font-weight: 800 !important;
            letter-spacing: -0.02em !important;
            line-height: 145% !important;
            text-align: center !important;
            margin-bottom: 20px !important;
        }

        /* Input */
        .pdc-input-group {
            width: 100% !important;
            position: relative !important;
            margin-bottom: 12px !important;
        }

        .pdc-input {
            width: 100% !important;
            height: 44px !important;
            background: rgba(174,166,253,0.5) !important;
            border: 2px solid rgba(255,255,255,0.5) !important;
            border-radius: 50px !important;
            color: #fff !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            padding: 0 44px 0 16px !important;
            outline: none !important;
            font-family: 'Nunito', Arial, sans-serif !important;
            transition: border-color 0.2s !important;
        }
        .pdc-input::placeholder { color: rgba(255,255,255,0.6) !important; }
        .pdc-input:focus { border-color: #fff !important; }

        /* Password toggle eye button */
        .pdc-eye-btn {
            position: absolute !important;
            right: 14px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            color: rgba(255,255,255,0.7) !important;
            padding: 4px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 3 !important;
        }
        .pdc-eye-btn:hover { color: #fff !important; }

        /* Password strength bar */
        .pdc-strength-bar {
            width: 100% !important;
            height: 4px !important;
            background: rgba(255,255,255,0.2) !important;
            border-radius: 99px !important;
            margin-top: -6px !important;
            margin-bottom: 8px !important;
            overflow: hidden !important;
        }
        .pdc-strength-fill {
            height: 100% !important;
            border-radius: 99px !important;
            width: 0% !important;
            transition: width 0.3s, background 0.3s !important;
        }
        .pdc-strength-label {
            font-size: 11px !important;
            font-weight: 700 !important;
            color: rgba(255,255,255,0.75) !important;
            text-align: right !important;
            width: 100% !important;
            margin-top: -4px !important;
            margin-bottom: 8px !important;
            display: block !important;
        }

        /* Sign Up button */
        .pdc-signup-btn {
            width: 100% !important;
            height: 44px !important;
            background: radial-gradient(50% 50% at 50% 50%, #b9bbff, #8f7eff) !important;
            border: none !important;
            border-radius: 50px !important;
            color: #fff !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            margin-top: 8px !important;
            margin-bottom: 12px !important;
            transition: opacity 0.2s !important;
            font-family: 'Nunito', Arial, sans-serif !important;
        }
        .pdc-signup-btn:hover  { opacity: 0.85 !important; }
        .pdc-signup-btn:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }

        .pdc-or {
            color: #fff !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            text-align: center !important;
            margin-bottom: 12px !important;
        }

        /* Google button */
        .pdc-google-btn {
            width: 100% !important;
            height: 44px !important;
            background: #fff !important;
            border: none !important;
            border-radius: 50px !important;
            color: #000 !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
            transition: background 0.2s !important;
            font-family: 'Nunito', Arial, sans-serif !important;
        }
        .pdc-google-btn:hover    { background: #e6e6e6 !important; }
        .pdc-google-btn:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }
        .pdc-google-icon { width: 18px !important; height: 18px !important; }

        .pdc-already {
            color: #fff !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            text-align: center !important;
        }
        .pdc-already a {
            font-weight: 800 !important;
            color: #fff !important;
            text-decoration: underline !important;
        }

        /* ── STATUS BANNER ── */
        .pdc-msg {
            width: 100% !important;
            border-radius: 12px !important;
            padding: 12px 16px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            text-align: center !important;
            margin-bottom: 12px !important;
            display: none;
            line-height: 1.5 !important;
        }
        .pdc-msg.show    { display: block !important; }
        .pdc-msg.info    { background: rgba(255,255,255,0.15) !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.4)  !important; }
        .pdc-msg.success { background: rgba(46,204,113,0.25)  !important; color: #fff !important; border: 1px solid rgba(46,204,113,0.6)   !important; }
        .pdc-msg.error   { background: rgba(231,76,60,0.25)   !important; color: #fff !important; border: 1px solid rgba(231,76,60,0.6)    !important; }
        .pdc-msg.warning { background: rgba(243,156,18,0.25)  !important; color: #fff !important; border: 1px solid rgba(243,156,18,0.6)   !important; }

        /* success state — hides form fields */
        .pdc-form-fields { width: 100% !important; }
        .pdc-form-fields.pdc-hidden { display: none !important; }

        @media (max-width: 500px) {
            .pdc-signup-title { font-size: 32px !important; }
            .pdc-signup-bg-left, .pdc-signup-bg-right { display: none !important; }
        }
    </style>
</head>
<body>

    <div class="pdc-root">

        <nav class="pdc-nav">
            <button class="pdc-burger" id="pdcBurger" aria-label="Open menu">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
            </button>
            <ul class="pdc-nav-links">
                <li><a href="/home">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/competitions">Competitions</a></li>
                <li><a href="/faqs">FAQs</a></li>
            </ul>
        </nav>

        <div class="pdc-drawer-overlay" id="pdcOverlay"></div>
        <div class="pdc-drawer" id="pdcDrawer">
            <button class="pdc-drawer-close" id="pdcClose" aria-label="Close menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <a href="/home">Home</a>
            <a href="/about">About</a>
            <a href="/competitions">Competitions</a>
            <a href="/faqs">FAQs</a>
        </div>

        <div class="pdc-signup-page">

            <img class="pdc-signup-bg-left"  src="https://raw.githubusercontent.com/caatz38/pdc-gassin/refs/heads/main/assets/mascto/radi.avif" alt="" />
            <img class="pdc-signup-bg-right" src="https://raw.githubusercontent.com/caatz38/pdc-gassin/refs/heads/main/assets/mascto/aeru.avif" alt="" />

            <div class="pdc-signup-card">

                <img class="pdc-signup-logo" src="https://github.com/caatz38/pdc-gassin/blob/main/assets/pdc%20logo.avif?raw=true" alt="PDC Logo" />

                <h1 class="pdc-signup-title">Sign Up!</h1>

                <!-- Status banner -->
                <div id="msg" class="pdc-msg info"></div>

                <!-- Form fields — hidden after successful register -->
                <div class="pdc-form-fields" id="formFields">

                    <div class="pdc-input-group">
                        <input id="email" class="pdc-input" type="email" placeholder="Email Address*" autocomplete="email" />
                    </div>

                    <div class="pdc-input-group">
                        <input id="password" class="pdc-input" type="password" placeholder="Password* (min. 6 characters)" autocomplete="new-password" />
                        <!-- Show / hide password toggle -->
                        <button type="button" class="pdc-eye-btn" id="eyeBtn" aria-label="Toggle password visibility">
                            <!-- eye open -->
                            <svg id="eyeOpen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            <!-- eye closed (hidden by default) -->
                            <svg id="eyeClosed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        </button>
                    </div>

                    <!-- Password strength bar -->
                    <div class="pdc-strength-bar"><div class="pdc-strength-fill" id="strengthFill"></div></div>
                    <span class="pdc-strength-label" id="strengthLabel"></span>

                    <div class="pdc-input-group">
                        <input id="confirmPassword" class="pdc-input" type="password" placeholder="Confirm Password*" autocomplete="new-password" />
                    </div>

                    <button type="button" id="registerBtn" class="pdc-signup-btn">Sign Up</button>

                    <p class="pdc-or">Or</p>

                    <button type="button" id="googleBtn" class="pdc-google-btn">
                        <svg class="pdc-google-icon" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 2.9l6-6C34.5 3.1 29.5 1 24 1 14.7 1 6.9 6.6 3.4 14.6l7 5.4C12.1 13.4 17.6 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7c4.3-4 6.8-9.9 6.8-16.9z"/>
                            <path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 019.5 24c0-1.6.3-3.1.8-4.6l-7-5.4A23.9 23.9 0 000 24c0 3.9.9 7.5 2.6 10.7l7.8-6.1z"/>
                            <path fill="#34A853" d="M24 47c5.5 0 10.1-1.8 13.5-4.9l-7.4-5.7c-1.8 1.2-4.1 2-6.1 2-6.4 0-11.8-4-13.6-9.8l-7.8 6.1C6.9 41.4 14.7 47 24 47z"/>
                        </svg>
                        Sign up with Google
                    </button>

                    <p class="pdc-already">Already have an account? <a href="/login">Login</a></p>

                </div><!-- #formFields -->

            </div>
        </div>

        <!-- Burger script -->
        <script>
            var pdcB = document.getElementById('pdcBurger');
            var pdcD = document.getElementById('pdcDrawer');
            var pdcO = document.getElementById('pdcOverlay');
            var pdcC = document.getElementById('pdcClose');
            function pdcOpen()  { pdcD.classList.add('pdc-open');    pdcO.style.display = 'block'; }
            function pdcClose() { pdcD.classList.remove('pdc-open'); pdcO.style.display = 'none';  }
            if (pdcB) pdcB.addEventListener('click', pdcOpen);
            if (pdcC) pdcC.addEventListener('click', pdcClose);
            if (pdcO) pdcO.addEventListener('click', pdcClose);
        </script>

    </div><!-- .pdc-root -->

    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js"></script>

    <script>
        // ============================================================
        //  PDC 2026 — SIGN UP PAGE SCRIPT
        //  Handles: email/password register + email verification send,
        //           Google SSO, password strength meter, confirm check.
        // ============================================================

        const firebaseConfig = {
            apiKey           : "AIzaSyAGkfAghVtw0SKgvYVuUxmjDHXoyR8kfug",
            authDomain       : "pdc-2026.firebaseapp.com",
            projectId        : "pdc-2026",
            storageBucket    : "pdc-2026.firebasestorage.app",
            messagingSenderId: "768259094990",
            appId            : "1:768259094990:web:f4e6c6bee85d8f2382939f",
            measurementId    : "G-P4GX80LWCT"
        };

        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

        // After clicking the email link, Firebase sends user here
        const VERIFY_CONTINUE_URL = "https://pdc.praditadirgantara.sch.id/login";

        document.addEventListener("DOMContentLoaded", () => {

            const auth = firebase.auth();
            const db   = firebase.firestore();

            const msgEl           = document.getElementById("msg");
            const formFields      = document.getElementById("formFields");
            const registerBtn     = document.getElementById("registerBtn");
            const googleBtn       = document.getElementById("googleBtn");
            const emailInput      = document.getElementById("email");
            const passwordInput   = document.getElementById("password");
            const confirmInput    = document.getElementById("confirmPassword");
            const eyeBtn          = document.getElementById("eyeBtn");
            const eyeOpen         = document.getElementById("eyeOpen");
            const eyeClosed       = document.getElementById("eyeClosed");
            const strengthFill    = document.getElementById("strengthFill");
            const strengthLabel   = document.getElementById("strengthLabel");

            // ── helpers ───────────────────────────────────────────
            function showMsg(text, type = "info") {
                msgEl.textContent = text;
                msgEl.className   = "pdc-msg show " + type;
            }

            function setLoading(on) {
                registerBtn.disabled    = on;
                googleBtn.disabled      = on;
                registerBtn.textContent = on ? "Please wait…" : "Sign Up";
            }

            function friendlyError(code) {
                const map = {
                    "auth/email-already-in-use"   : "An account with this email already exists. Try logging in instead.",
                    "auth/invalid-email"           : "Please enter a valid email address.",
                    "auth/weak-password"           : "Password is too weak. Use at least 6 characters.",
                    "auth/network-request-failed"  : "Network error. Check your internet connection.",
                    "auth/too-many-requests"       : "Too many attempts. Please wait a moment."
                };
                return map[code] || "Something went wrong. Please try again.";
            }

            // ── Password strength meter ───────────────────────────
            function getStrength(pw) {
                let score = 0;
                if (pw.length >= 6)  score++;
                if (pw.length >= 10) score++;
                if (/[A-Z]/.test(pw)) score++;
                if (/[0-9]/.test(pw)) score++;
                if (/[^A-Za-z0-9]/.test(pw)) score++;
                return score; // 0-5
            }

            passwordInput.addEventListener("input", () => {
                const pw    = passwordInput.value;
                const score = getStrength(pw);
                const pct   = pw.length === 0 ? 0 : Math.max(20, (score / 5) * 100);

                const colors = ["#e74c3c", "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#27ae60"];
                const labels = ["", "Too weak", "Weak", "Fair", "Strong", "Very strong"];

                strengthFill.style.width      = pw.length ? pct + "%" : "0%";
                strengthFill.style.background = colors[score] || colors[0];
                strengthLabel.textContent     = pw.length ? labels[score] : "";
                strengthLabel.style.color     = colors[score] || "rgba(255,255,255,0.75)";
            });

            // ── Show / hide password ──────────────────────────────
            eyeBtn.addEventListener("click", () => {
                const isHidden = passwordInput.type === "password";
                passwordInput.type  = isHidden ? "text" : "password";
                eyeOpen.style.display   = isHidden ? "none"  : "";
                eyeClosed.style.display = isHidden ? ""      : "none";
            });

            // ── Enter key support ─────────────────────────────────
            [emailInput, passwordInput, confirmInput].forEach(el => {
                el.addEventListener("keydown", e => { if (e.key === "Enter") registerBtn.click(); });
            });

            // ── show success state — hides form, shows big message ─
            function showSuccess(email) {
                formFields.classList.add("pdc-hidden");
                showMsg(
                    "Account created! We sent a verification email to " + email + ". Please check your inbox (and spam folder), then log in.",
                    "success"
                );
            }

            // ============================================================
            //  EMAIL / PASSWORD REGISTER
            // ============================================================
            registerBtn.addEventListener("click", async () => {
                const email    = emailInput.value.trim();
                const password = passwordInput.value;
                const confirm  = confirmInput.value;

                // ── Client-side validation ────────────────────────
                if (!email || !password || !confirm) {
                    showMsg("Please fill in all fields.", "error");
                    return;
                }
                if (password.length < 6) {
                    showMsg("Password must be at least 6 characters.", "error");
                    return;
                }
                if (password !== confirm) {
                    showMsg("Passwords do not match. Please try again.", "error");
                    confirmInput.focus();
                    return;
                }

                setLoading(true);
                showMsg("Creating your account…", "info");

                try {
                    // Flag so the global auth listener doesn't interfere during registration
                    window.__pdcRegistering = true;
                    
                    // 1. Create the Firebase Auth account
                    const cred = await auth.createUserWithEmailAndPassword(email, password);
                    const user = cred.user;

                    // 2. Send verification email BEFORE writing to Firestore
                    await user.sendEmailVerification({ url: VERIFY_CONTINUE_URL });

                    // 3. Create a minimal Firestore doc (status: unverified)
                    await db.collection("users").doc(user.uid).set({
                        email           : email,
                        role            : "participant",
                        profileComplete : false,
                        dataLocked      : false,
                        status          : "unverified",
                        createdAt       : firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // 4. Sign out — user must verify email before logging in
                    await auth.signOut();

                    // 5. Show success state
                    showSuccess(email);
                    window.__pdcRegistering = false;

                } catch (err) {
                    window.__pdcRegistering = false;
                    console.error(err);
                    showMsg("" + friendlyError(err.code), "error");
                    setLoading(false);
                }
            });

            // ============================================================
            //  GOOGLE SIGN-UP
            //  Google accounts are pre-verified — go straight to dashboard.
            // ============================================================
            googleBtn.addEventListener("click", async () => {
                setLoading(true);
                showMsg("Opening Google sign-in…", "info");

                try {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    const result   = await auth.signInWithPopup(provider);
                    const user     = result.user;

                    // Upsert Firestore doc (merge so we don't overwrite existing data)
                    await db.collection("users").doc(user.uid).set({
                        email           : user.email,
                        role            : "participant",
                        profileComplete : false,
                        dataLocked      : false,
                        status          : "unverified",
                        createdAt       : firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    showMsg("✅ Google sign-up successful! Redirecting…", "success");
                    window.location.href = "https://pdc.praditadirgantara.sch.id/dashboard";

                } catch (err) {
                    console.error(err);
                    if (err.code !== "auth/popup-closed-by-user") {
                        showMsg("❌ " + friendlyError(err.code), "error");
                    } else {
                        showMsg("Google sign-up was cancelled.", "info");
                    }
                    setLoading(false);
                }
            });

        }); // end DOMContentLoaded
    </script>
</body>
</html>
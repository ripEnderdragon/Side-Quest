// ════════════════════════════════════════════════════════════
//  PART 1 — GLOBAL APP  (firebase.js)
//  v2 — adds admin role support (/admin page + dashboard branch)
//       and fixes several minor bugs (see CHANGELOG at bottom).
// ════════════════════════════════════════════════════════════

window.pdcDebugLog = window.pdcDebugLog || function (...args) {
    const el = document.getElementById("debugLog");
    console.info("[PDC Debug]", ...args);
    if (el) {
        el.textContent += "[PDC Debug] " + args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : a).join(" ") + "\n";
        el.scrollTop = el.scrollHeight;
    }
};

window.pdcIsSubmitting   = window.pdcIsSubmitting   || false;
window.pdcSubmitMode     = window.pdcSubmitMode     || "";
window.db                = window.db                || null;
window.pdcAppInitialized = window.pdcAppInitialized || false;
window.__pdcRegistering  = window.__pdcRegistering  || false;

const FORM_LINKS = {
    "Math Olympiad"     : "https://pdc.praditadirgantara.sch.id/register-math",
    "Science Olympiad"  : "https://pdc.praditadirgantara.sch.id/register-science",
    "Scientific Writing": "https://pdc.praditadirgantara.sch.id/register-scientific-writing",
    "Logic Olympiad"    : "https://pdc.praditadirgantara.sch.id/register-logic",
    "Solo Vocal"        : "https://pdc.praditadirgantara.sch.id/register-solo-vocal",
    "Speech"            : "https://pdc.praditadirgantara.sch.id/register-speech",
    "Basket"            : "https://pdc.praditadirgantara.sch.id/register-basket"
};

const WHATSAPP_LINKS = {
    "Math Olympiad"     : "https://chat.whatsapp.com/K1W4KI8s2h2LKq1XeQG3cp?mode=gi_t",
    "Science Olympiad"  : "https://chat.whatsapp.com/HVkvUDGt5kE76I73O1TQOA",
    "Scientific Writing": "https://chat.whatsapp.com/EjjrzzZMeK7HfI2ZKXDkdn?mode=gi_t",
    "Logic Olympiad"    : "https://chat.whatsapp.com/LFuiahTnMYM7cpZMb0sFUS?mode=gi_t",
    "Solo Vocal"        : "https://chat.whatsapp.com/G6Tl8VpfHLwCkRXuVAri2E",
    "Speech"            : "https://chat.whatsapp.com/FVMD7CmVnCtEuQLet8B8Jb?mode=gi_t",
    "Basket"            : "https://chat.whatsapp.com/JDuiATkzIqKD2K566YbUND?mode=gi_t"
};

const EMAIL_VERIFY_CONTINUE_URL = "https://pdc.praditadirgantara.sch.id/login";

// ── Route lists ──────────────────────────────────────────────
const PUBLIC_ROUTES    = ["/login", "/signup", "/register", "/home", "/about", "/competitions", "/faqs"];
const ADMIN_ROUTES     = ["/admin"];
const PROTECTED_ROUTES = [
    "/profile", "/dashboard",
    "/register-math", "/register-science", "/register-scientific-writing",
    "/register-logic", "/register-solo-vocal", "/register-speech", "/register-basket",
    ...ADMIN_ROUTES
];

function pdcIsPublicRoute(path)  { return PUBLIC_ROUTES.some(r => path.includes(r)); }
function pdcIsProtectedRoute(path) { return PROTECTED_ROUTES.some(r => path.includes(r)); }
function pdcIsAdminRoute(path)   { return ADMIN_ROUTES.some(r => path.includes(r)); }

(function () {
    if (window.pdcAppInitialized) {
        window.pdcDebugLog("Script already initialised. Skipping duplicate execution.");
        return;
    }
    window.pdcAppInitialized = true;

    const show = id => { const e = document.getElementById(id); if (e) e.style.display = ""; };
    const hide = id => { const e = document.getElementById(id); if (e) e.style.display = "none"; };

    function showBanner(containerId, message, type = "info") {
        const colors = {
            info    : { bg: "#EBF5FB", border: "#3498DB", text: "#1A5276" },
            success : { bg: "#EAFAF1", border: "#2ECC71", text: "#1E8449" },
            warning : { bg: "#FEF9E7", border: "#F39C12", text: "#9A7D0A" },
            error   : { bg: "#FDEDEC", border: "#E74C3C", text: "#922B21" }
        };
        const c = colors[type] || colors.info;
        const container = document.getElementById(containerId);
        if (!container) return;
        let banner = document.getElementById("pdc-banner-" + containerId);
        if (!banner) {
            banner = document.createElement("div");
            banner.id = "pdc-banner-" + containerId;
            banner.style.cssText = `border-radius:10px; padding:14px 18px; font-size:14px; font-weight:600; margin-bottom:16px; border-left:4px solid; transition: all 0.3s;`;
            container.prepend(banner);
        }
        banner.style.background  = c.bg;
        banner.style.borderColor = c.border;
        banner.style.color       = c.text;
        banner.textContent       = message;
        banner.style.display     = "block";
    }

    // Small HTML-escape helper — used anywhere we inject user-controlled
    // strings (name, school, etc.) into innerHTML, to reduce stored-XSS risk.
    // DOM-based escape — avoids embedding literal HTML entities in this
    // script's source. The CMS's "Simple Custom CSS and JS" text field
    // HTML-decodes entities like &quot; on save, which previously turned
    // this function into unterminated strings and threw a SyntaxError
    // that killed the entire script block (nothing in firebase.js ran).
    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = String(str ?? "");
        return div.innerHTML;
    }

    // ============================================================
    //  FIREBASE INIT
    // ============================================================
    const initPdcApp = () => {
        window.pdcDebugLog("Starting Firebase and App initialisation check…");

        if (typeof firebase === "undefined")       { setTimeout(initPdcApp, 1000); return; }
        if (typeof firebase.app === "undefined")   { setTimeout(initPdcApp, 500);  return; }
        if (!firebase.auth || !firebase.firestore) { setTimeout(initPdcApp, 500);  return; }

        const firebaseConfig = {
            apiKey           : "AIzaSyAGkfAghVtw0SKgvYVuUxmjDHXoyR8kfug",
            authDomain       : "pdc-2026.firebaseapp.com",
            projectId        : "pdc-2026",
            storageBucket    : "pdc-2026.firebasestorage.app",
            messagingSenderId: "768259094990",
            appId            : "1:768259094990:web:f4e6c6bee85d8f2382939f",
            measurementId    : "G-P4GX80LWCT"
        };

        try {
            if (firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);
            window.auth = firebase.auth();
            window.db   = firebase.firestore();
        } catch (e) {
            window.pdcDebugLog("FATAL Firebase init error:", e.message);
            return;
        }

        const auth = window.auth;
        const db   = window.db;

        let storage = null;
        try {
            storage = firebase.storage ? firebase.storage() : firebase.app().storage();
            window.pdcDebugLog("Firebase Storage ready.");
        } catch (e) {
            window.pdcDebugLog("Storage not available:", e.message);
        }

        window.pdcDebugLog("PDC App System Ready.");

        // ============================================================
        //  ① REGISTRATION
        //  NOTE: Only used when firebase.js login form (#pdc-register-form)
        //  is present. The standalone signup.html uses its own handler (Part 2).
        // ============================================================
        async function handleRegistration(email, password) {
            window.pdcDebugLog("handleRegistration() called for:", email);
            try {
                window.__pdcRegistering = true;
                const cred = await auth.createUserWithEmailAndPassword(email, password);
                const user = cred.user;
                await user.sendEmailVerification({ url: EMAIL_VERIFY_CONTINUE_URL, handleCodeInApp: false });
                window.pdcDebugLog("Verification email sent to:", email);
                await db.collection("users").doc(user.uid).set({
                    email      : email,
                    role       : "participant", // FIX: role now set consistently on every signup path
                    status     : "unverified",
                    dataLocked : false,
                    createdAt  : firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                await auth.signOut();
                window.__pdcRegistering = false;
                showBanner("pdc-register-wrapper",
                    "Account created! We sent a verification link to " + email + ". Please check your inbox (and spam folder), then log in.",
                    "success"
                );
            } catch (err) {
                window.__pdcRegistering = false;
                window.pdcDebugLog("Registration error:", err.message);
                const friendly = {
                    "auth/email-already-in-use"  : "This email is already registered. Please log in instead.",
                    "auth/invalid-email"          : "The email address is not valid.",
                    "auth/weak-password"          : "Password must be at least 6 characters.",
                    "auth/network-request-failed" : "Network error. Please check your connection."
                };
                showBanner("pdc-register-wrapper", "" + (friendly[err.code] || err.message), "error");
            }
        }

        // ============================================================
        //  ② LOGIN
        //  NOTE: Only wired to #pdc-login-form (Forminator/WordPress embed).
        //  The standalone login.html has its own self-contained login script.
        // ============================================================
        async function handleLogin(email, password) {
            window.pdcDebugLog("handleLogin() called for:", email);
            try {
                const cred = await auth.signInWithEmailAndPassword(email, password);
                const user = cred.user;
                if (!user.emailVerified) {
                    window.pdcDebugLog("Email not verified. Blocking login.");
                    await auth.signOut();
                    showBanner("pdc-login-wrapper",
                        "Your email is not verified yet. Please click the link we sent to " + email + ". Use the button below to resend it.",
                        "warning"
                    );
                    // ── FIX: Use the existing #pdc-resend-btn if present; don't inject duplicates ──
                    let resendBtn = document.getElementById("pdc-resend-btn");
                    if (!resendBtn) {
                        resendBtn = document.createElement("button");
                        resendBtn.id          = "pdc-resend-btn";
                        resendBtn.type        = "button";
                        resendBtn.textContent = "📧 Resend Verification Email";
                        resendBtn.style.cssText = "margin-top:12px; padding:10px 24px; background:#3498DB; color:#fff; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:14px;";
                        const wrapper = document.getElementById("pdc-login-wrapper");
                        if (wrapper) wrapper.appendChild(resendBtn);
                    }
                    resendBtn.style.display = "inline-block";
                    // ── FIX: don't stash the raw password in a DOM dataset attribute
                    // (visible in DevTools). Keep it in the closure instead and
                    // just re-bind the click handler each time we get here.
                    resendBtn.onclick = async () => {
                        try {
                            const tempCred = await auth.signInWithEmailAndPassword(email, password);
                            await tempCred.user.sendEmailVerification({ url: EMAIL_VERIFY_CONTINUE_URL });
                            await auth.signOut();
                            showBanner("pdc-login-wrapper", "Verification email resent! Check your inbox.", "success");
                        } catch (e) {
                            showBanner("pdc-login-wrapper", "Could not resend: " + e.message, "error");
                        }
                    };
                    return;
                }
                window.pdcDebugLog("Email verified. Login successful. Redirecting to /dashboard.");
                window.location.href = "https://pdc.praditadirgantara.sch.id/dashboard";
            } catch (err) {
                window.pdcDebugLog("Login error:", err.message);
                const friendly = {
                    "auth/user-not-found"        : "No account found with that email.",
                    "auth/wrong-password"         : "Incorrect password.",
                    "auth/invalid-email"          : "The email address is not valid.",
                    "auth/too-many-requests"      : "Too many attempts. Please wait a few minutes.",
                    "auth/network-request-failed" : "Network error. Please check your connection."
                };
                showBanner("pdc-login-wrapper", "" + (friendly[err.code] || err.message), "error");
            }
        }

        // ============================================================
        //  ③ FORGOT PASSWORD
        // ============================================================
        async function handlePasswordReset(email) {
            window.pdcDebugLog("handlePasswordReset() for:", email);
            try {
                await auth.sendPasswordResetEmail(email, { url: EMAIL_VERIFY_CONTINUE_URL });
                showBanner("pdc-login-wrapper", "📨 Password reset email sent to " + email + ". Check your inbox.", "success");
            } catch (err) {
                showBanner("pdc-login-wrapper", "❌ " + err.message, "error");
            }
        }

        // ============================================================
        //  ④ LOGOUT BUTTONS
        // ============================================================
        ["actionLogout", "logoutBtn"].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("click", async e => {
                    e.preventDefault();
                    await auth.signOut();
                    window.location.href = "https://pdc.praditadirgantara.sch.id/login";
                });
            }
        });

        // ── NISN field: auto pad to 10 digits with leading zeros ──
        setInterval(() => {
            const nisnInput = document.querySelector("input[name^='number-']")
                           || document.querySelector(".forminator-field-number input")
                           || document.getElementById("number-1");
            if (nisnInput && !nisnInput.dataset.pdcNisnReady) {
                nisnInput.dataset.pdcNisnReady = "true";
                nisnInput.maxLength = 10;
                nisnInput.addEventListener("blur", () => {
                    const v = nisnInput.value.trim();
                    if (v) nisnInput.value = v.padStart(10, "0");
                });
            }
        }, 1000);

        // ============================================================
        //  ⑤ FORMINATOR BUTTON INTERCEPTOR
        // ============================================================
        setInterval(() => {
            const submitBtns = document.querySelectorAll(".forminator-button-submit");
            submitBtns.forEach(originalBtn => {
                if (originalBtn.dataset.pdcIntercepted === "true" || originalBtn.style.display === "none") return;
                const formEl = originalBtn.closest("form");
                if (!formEl) return;

                const submissionFormIds = ["10492", "10504", "10491", "10500", "10490", "10488", "10487"];
                const isSubmissionForm  = formEl.id && submissionFormIds.some(id => formEl.id.includes(id));

                if (isSubmissionForm) {
                    originalBtn.dataset.pdcIntercepted = "true";
                    const cloneBtn = originalBtn.cloneNode(true);
                    cloneBtn.id          = "pdc-submission-submit-btn";
                    cloneBtn.type        = "button";
                    cloneBtn.textContent = "Upload & Submit Works";
                    cloneBtn.classList.add("pdc-custom-submit-btn");
                    originalBtn.style.display = "none";
                    originalBtn.parentNode.insertBefore(cloneBtn, originalBtn);
                    cloneBtn.addEventListener("click", async e => {
                        e.preventDefault();
                        await handleSubmissionUploadPipeline(cloneBtn, originalBtn, formEl);
                    });
                } else if (!formEl.querySelector("#pdc-custom-btn-group")) {
                    originalBtn.dataset.pdcIntercepted = "true";

                    const btnGroup = document.createElement("div");
                    btnGroup.id = "pdc-custom-btn-group";
                    btnGroup.style.cssText = "display:inline-flex; gap:10px; width:100%; margin-top:15px; flex-wrap:wrap; justify-content:center;";

                    const saveBtn = document.createElement("button");
                    saveBtn.id          = "pdc-save-draft-btn";
                    saveBtn.type        = "button";
                    saveBtn.textContent = "Save Draft (Editable)";
                    saveBtn.className   = originalBtn.className;
                    saveBtn.style.backgroundColor = "#E67E22";
                    saveBtn.classList.add("pdc-custom-action-btn");

                    const finalBtn = document.createElement("button");
                    finalBtn.id          = "pdc-final-submit-btn";
                    finalBtn.type        = "button";
                    finalBtn.textContent = "Final Submit (Lock Data)";
                    finalBtn.className   = originalBtn.className;
                    finalBtn.classList.add("pdc-custom-action-btn");

                    btnGroup.appendChild(saveBtn);
                    btnGroup.appendChild(finalBtn);
                    originalBtn.style.display = "none";
                    originalBtn.parentNode.insertBefore(btnGroup, originalBtn);

                    saveBtn.onclick  = async e => { e.preventDefault(); await handleFormSyncPipeline(false, saveBtn,  finalBtn, originalBtn); };
                    finalBtn.onclick = async e => {
                        e.preventDefault();
                        if (confirm("Are you absolutely sure the data is correct?\n\nOnce submitted, your profile will be LOCKED and you will not be able to edit it anymore.")) {
                            await handleFormSyncPipeline(true, finalBtn, saveBtn, originalBtn);
                        }
                    };
                }
            });
        }, 1000);

        // ============================================================
        //  ⑥ SUBMISSION UPLOAD PIPELINE
        // ============================================================
        async function handleSubmissionUploadPipeline(clickedBtn, originalBtn, formEl) {
            window.pdcDebugLog("handleSubmissionUploadPipeline triggered.");
            if (!formEl.checkValidity()) { formEl.reportValidity(); return; }
            const user = auth.currentUser;
            if (!user) { alert("Session Timeout. Please refresh and log in again."); return; }

            const originalText = clickedBtn.textContent;
            clickedBtn.textContent = "Uploading Submissions…";
            clickedBtn.disabled    = true;

            try {
                if (!storage) throw new Error("Firebase Storage not available.");
                const payload = { submissionTimestamp: firebase.firestore.FieldValue.serverTimestamp() };
                let filesCount = 0;
                for (let i = 1; i <= 6; i++) {
                    const fileInput = formEl.querySelector(`input[type='file'][name^='upload-${i}']`) || formEl.querySelector(`#upload-${i}`);
                    const file = fileInput?.files?.[0];
                    if (file) {
                        const ref  = storage.ref(`competitionSubmissions/${user.uid}/slot-${i}_${Date.now()}_${file.name}`);
                        const snap = await ref.put(file);
                        payload[`submissionFileUrl_${i}`] = await snap.ref.getDownloadURL();
                        filesCount++;
                    }
                }
                if (filesCount === 0) {
                    alert("You must upload at least one file before submitting.");
                    clickedBtn.textContent = originalText;
                    clickedBtn.disabled    = false;
                    return;
                }
                const checkboxEl = formEl.querySelector(`input[type='checkbox'][name^='checkbox-1']`) || formEl.querySelector(`#checkbox-1`);
                if (checkboxEl) payload["submissionCheckboxAgreement"] = checkboxEl.checked;
                await db.collection("users").doc(user.uid).set(payload, { merge: true });
                originalBtn.click();
                clickedBtn.textContent = "Uploaded Successfully! Redirecting…";
                window.location.href   = "https://pdc.praditadirgantara.sch.id/dashboard";
            } catch (error) {
                window.pdcDebugLog("Submission upload failure:", error);
                alert("Upload Error: " + error.message);
                clickedBtn.textContent = originalText;
                clickedBtn.disabled    = false;
            }
        }

        // ============================================================
        //  ⑦ PROFILE FORM SYNC PIPELINE (draft / final)
        // ============================================================
        async function handleFormSyncPipeline(isFinalSubmit, clickedBtn, otherBtn, originalBtn) {
            window.pdcDebugLog(`handleFormSyncPipeline — final: ${isFinalSubmit}`);
            const formEl = originalBtn.closest("form");
            if (formEl && !formEl.checkValidity()) { formEl.reportValidity(); return; }
            const user = auth.currentUser;
            if (!user) { alert("Authentication error. Please refresh the page."); return; }

            const origText = clickedBtn.textContent;
            clickedBtn.textContent = isFinalSubmit ? "Locking Profile…" : "Saving to Database…";
            clickedBtn.disabled    = true;
            if (otherBtn) otherBtn.disabled = true;
            window.pdcSubmitMode   = isFinalSubmit ? "final" : "draft";
            window.pdcIsSubmitting = true;

            try {
                const getVal  = sel => document.querySelector(sel)?.value?.trim() || "";
                const getFile = sel => document.querySelector(sel)?.files?.[0];

                const fullNameValue = getVal("input[name^='name-']")    || getVal(".forminator-field-name input")    || getVal("#name-1");
                const phoneValue    = getVal("input[name^='phone-']")   || getVal(".forminator-field-phone input")   || getVal("#phone-1");
                const nisnValue     = getVal("input[name^='number-']")  || getVal(".forminator-field-number input")  || getVal("#number-1");
                const schoolValue   = getVal("input[name^='text-']")    || getVal(".forminator-field-text input")    || getVal("#text-1");
                const gradeValue    = getVal("select[name^='select-']") || getVal(".forminator-field-select select") || getVal("#select-1");

                const studentFile = getFile("input[type='file'][name^='upload-1']") || getFile("#upload-1");
                const idFile      = getFile("input[type='file'][name^='upload-2']") || getFile("#upload-2");

                const uploadFile = async (file, folder) => {
                    if (!storage || !file) return "";
                    const ref  = storage.ref(`${folder}/${user.uid}_${Date.now()}_${file.name}`);
                    const snap = await ref.put(file);
                    return await snap.ref.getDownloadURL();
                };

                const studentCardURL = await uploadFile(studentFile, "studentCards");
                const idCardURL      = await uploadFile(idFile,      "idCards");

                const payload = {
                    email           : user.email,
                    updatedAt       : firebase.firestore.FieldValue.serverTimestamp(),
                    profileComplete : isFinalSubmit,
                    dataLocked      : isFinalSubmit,
                    status          : isFinalSubmit ? "waiting" : "draft"
                };
                if (fullNameValue)  payload.fullName       = fullNameValue;
                if (phoneValue)     payload.phoneNumber    = phoneValue;
                if (nisnValue)      payload.nisn           = nisnValue;
                if (schoolValue)    payload.school         = schoolValue;
                if (gradeValue)     payload.grade          = gradeValue;
                if (studentCardURL) payload.studentCardURL = studentCardURL;
                if (idCardURL)      payload.idCardURL      = idCardURL;

                await db.collection("users").doc(user.uid).set(payload, { merge: true });
                window.pdcDebugLog("Firestore write OK");
                originalBtn.click();
                clickedBtn.textContent = "Saved! Redirecting…";
                window.location.href   = "https://pdc.praditadirgantara.sch.id/dashboard";
            } catch (err) {
                window.pdcDebugLog("Profile sync failure:", err);
                alert("Save Error: " + err.message);
            } finally {
                clickedBtn.textContent = origText;
                clickedBtn.disabled    = false;
                if (otherBtn) otherBtn.disabled = false;
                window.pdcIsSubmitting = false;
            }
        }

        // ============================================================
        //  ⑧ LOCKED PROFILE DATA CARD — renders inside #widgetMainText
        //  or #dynamicWorkspaceMount when dataLocked && profileComplete.
        //  Layout matches the design: user data on the left, status text
        //  ("Wait for your profile to get accepted!") on the right.
        //  Both dashboard and profile page use the same layout.
        // ============================================================
        function renderLockedProfileCard(data, target, compact) {
            const val    = v => escapeHtml(v || "");
            const NA     = "—";
            const status = (data.status || "waiting");

            // Status badge color
            const statusColors = {
                "waiting"         : { bg:"#555", text:"#fff" },
                "draft"           : { bg:"#E67E22", text:"#fff" },
                "verified"        : { bg:"#2E7D32", text:"#fff" },
                "accepted"        : { bg:"#2E7D32", text:"#fff" },
                "pending_profile" : { bg:"#555", text:"#fff" }
            };
            const sc = statusColors[status] || statusColors["waiting"];
            const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");

            // Right-panel message — can be extended per status if needed
            const waitMsg = "Wait for your profile to get accepted!";

            // ── FIX: was `src=idCardURL` (literal string, not the data value).
            // Now correctly binds to the uploaded ID card / student card URL,
            // and falls back to a blank transparent pixel if neither exists
            // so the <img> doesn't show a broken-image icon.
            const avatarSrc = data.idCardURL || data.studentCardURL || "";

            target.innerHTML = `
            <div style="
                width:100%; display:flex; gap:16px; align-items:stretch;
                flex-wrap:wrap; font-family:'Nunito',Arial,sans-serif;
                box-sizing:border-box;">

                <!-- ── LEFT: User data card ── -->
                <div style="
                    flex:0 0 220px; min-width:200px;
                    background:#fff; border-radius:20px;
                    padding:28px 22px 24px;
                    box-shadow:0 4px 24px rgba(50,50,137,0.10);
                    display:flex; flex-direction:column; align-items:center;
                    gap:0; box-sizing:border-box;">

                    <!-- Avatar circle -->
                    <div style="width:80px; height:80px; border-radius:50%; background:#1a1a7a; margin-bottom:16px; flex-shrink:0; overflow:hidden; display:flex; justify-content:center; align-items:center;">
                        ${avatarSrc
                            ? `<img src="${escapeHtml(avatarSrc)}" alt="ID photo" style="width:100%; height:100%; object-fit:cover;">`
                            : `<span style="color:#fff; font-size:28px; font-weight:800;">${escapeHtml((data.fullName || "?").charAt(0).toUpperCase())}</span>`}
                    </div>

                    <!-- Full name -->
                    <p style="
                        margin:0 0 14px 0; font-size:18px; font-weight:800;
                        color:#1a1a7a; text-align:center; line-height:1.3;
                        word-break:break-word;">
                        ${val(data.fullName) || NA}
                    </p>

                    <!-- Info rows -->
                    <div style="width:100%; display:flex; flex-direction:column; gap:4px; margin-bottom:18px;">
                        <p style="margin:0; font-size:13px; font-weight:700; color:#323289; text-align:center;">
                            ${val(data.school) || NA}
                        </p>
                        <p style="margin:0; font-size:13px; font-weight:700; color:#323289; text-align:center;">
                            NISN: ${val(data.nisn) || NA}
                        </p>
                        <p style="margin:0; font-size:13px; font-weight:700; color:#323289; text-align:center;">
                            ${val(data.phoneNumber) || NA}
                        </p>
                        <p style="margin:0; font-size:13px; font-weight:700; color:#323289; text-align:center;">
                            Grade ${val(data.grade) || NA}
                        </p>
                    </div>

                    <!-- Status badge -->
                    <div style="
                        background:${sc.bg}; color:${sc.text};
                        font-size:13px; font-weight:800;
                        padding:9px 28px; border-radius:10px;
                        letter-spacing:0.01em; text-align:center; width:100%;">
                        Status: ${statusLabel}
                    </div>
                </div>

                <!-- ── RIGHT: "Wait for your profile to get accepted!" ── -->
                <div style="
                    flex:1; min-width:220px;
                    background:#fff; border-radius:20px;
                    box-shadow:0 4px 24px rgba(50,50,137,0.10);
                    display:flex; align-items:center; justify-content:center;
                    padding:32px 24px; box-sizing:border-box; position:relative;
                    overflow:hidden;">
                    <p style="
                        margin:0; font-size:clamp(20px,3vw,32px);
                        font-weight:800; color:#323289;
                        text-align:center; line-height:1.35;
                        position:relative; z-index:1;">
                        ${waitMsg}
                    </p>
                </div>

            </div>`;
        }

        // ============================================================
        //  ⑧b ADMIN VIEWS (new)
        //  - renderAdminDashboardWidget(): small summary widget shown
        //    inside #widgetMainText / #dynamicWorkspaceMount on /dashboard
        //    (or on "/") when the logged-in user has role === "admin".
        //  - initAdminPanel(): full registrant management table, shown
        //    on the dedicated /admin page inside #adminPanelMount.
        //  Neither of these touches participant-facing rendering logic.
        // ============================================================
        function renderAdminDashboardWidget(target) {
            target.innerHTML = `
                <div style="text-align:center; width:100%;">
                    <span style="font-size:15px; font-weight:700; color:#73739d; text-transform:uppercase; letter-spacing:0.05em;">❖ Admin</span>
                    <h2 style="color:#323289; font-weight:800; margin:8px 0 16px 0;">Admin Overview</h2>
                    <p style="color:#73739d; margin-bottom:20px;">You're signed in as an administrator. Participant tools are hidden on this account.</p>
                    <a href="https://pdc.praditadirgantara.sch.id/admin"
                       style="background:#323289; color:#fff; font-weight:700; padding:14px 32px;
                              border-radius:12px; text-decoration:none; display:inline-block;">
                        Open Admin Panel
                    </a>
                </div>`;
        }

        let __pdcAdminRowsCache = null; // avoid re-fetching on every snapshot tick

        async function initAdminPanel(user) {
            const mount = document.getElementById("adminPanelMount");
            if (!mount) { window.pdcDebugLog("No #adminPanelMount on this page — skipping admin panel render."); return; }
            if (mount.dataset.pdcAdminLoaded === "true") return; // only build the table once per page load
            mount.dataset.pdcAdminLoaded = "true";
            mount.innerHTML = `<p style="color:#73739d;">Loading registrants…</p>`;

            try {
                const snap = await db.collection("users").where("role", "==", "participant").get();
                __pdcAdminRowsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                renderAdminTable(mount, __pdcAdminRowsCache);
            } catch (err) {
                window.pdcDebugLog("Admin panel load failed:", err.message);
                mount.innerHTML = `<p style="color:#E74C3C;">Failed to load registrants: ${escapeHtml(err.message)}</p>
                    <p style="color:#73739d; font-size:13px;">This usually means Firestore security rules don't allow this account to list the users collection.</p>`;
            }
        }

        function renderAdminTable(mount, fullList) {
            mount.innerHTML = `
                <div style="margin-bottom:16px; display:flex; gap:10px; flex-wrap:wrap;">
                    <input id="adminSearch" placeholder="Search name / school…"
                           style="flex:1; min-width:200px; padding:10px; border-radius:8px; border:1px solid #ccc;">
                    <select id="adminFilter" style="padding:10px; border-radius:8px; border:1px solid #ccc;">
                        <option value="all">All statuses</option>
                        <option value="unverified">Unverified</option>
                        <option value="draft">Draft</option>
                        <option value="verified">Verified</option>
                    </select>
                </div>
                <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; font-size:14px; min-width:640px;">
                    <thead><tr style="text-align:left; border-bottom:2px solid #323289;">
                        <th style="padding:8px;">Name</th><th style="padding:8px;">School</th>
                        <th style="padding:8px;">NISN</th><th style="padding:8px;">Competition</th>
                        <th style="padding:8px;">Status</th><th style="padding:8px;">Actions</th>
                    </tr></thead>
                    <tbody id="adminTbody"></tbody>
                </table>
                </div>`;

            const renderRows = (list) => {
                const tbody = document.getElementById("adminTbody");
                if (!list.length) {
                    tbody.innerHTML = `<tr><td colspan="6" style="padding:16px; text-align:center; color:#73739d;">No matching registrants.</td></tr>`;
                    return;
                }
                tbody.innerHTML = list.map(u => `
                    <tr data-uid="${u.id}" style="border-bottom:1px solid #eee;">
                        <td style="padding:8px;">${escapeHtml(u.fullName) || "—"}</td>
                        <td style="padding:8px;">${escapeHtml(u.school) || "—"}</td>
                        <td style="padding:8px;">${escapeHtml(u.nisn) || "—"}</td>
                        <td style="padding:8px;">${escapeHtml(u.registeredCompetition) || "—"}</td>
                        <td style="padding:8px;" class="pdc-admin-status-cell">${escapeHtml(u.status) || "—"}</td>
                        <td style="padding:8px; white-space:nowrap;">
                            <button class="pdc-admin-verify" style="background:#2E7D32;color:#fff;border:none;border-radius:6px;padding:6px 10px;margin-right:4px;cursor:pointer;">Verify</button>
                            <button class="pdc-admin-accept-comp" style="background:#4D81E3;color:#fff;border:none;border-radius:6px;padding:6px 10px;cursor:pointer;">Accept Comp</button>
                        </td>
                    </tr>`).join("");

                tbody.querySelectorAll(".pdc-admin-verify").forEach(btn => {
                    btn.onclick = async () => {
                        const uid = btn.closest("tr").dataset.uid;
                        btn.disabled = true;
                        try {
                            await db.collection("users").doc(uid).update({ status: "verified" });
                            btn.closest("tr").querySelector(".pdc-admin-status-cell").textContent = "verified";
                            const rec = __pdcAdminRowsCache?.find(r => r.id === uid);
                            if (rec) rec.status = "verified";
                        } catch (e) {
                            alert("Could not verify: " + e.message);
                        } finally {
                            btn.disabled = false;
                        }
                    };
                });
                tbody.querySelectorAll(".pdc-admin-accept-comp").forEach(btn => {
                    btn.onclick = async () => {
                        const uid = btn.closest("tr").dataset.uid;
                        btn.disabled = true;
                        try {
                            await db.collection("users").doc(uid).update({ competitionStatus: "accepted" });
                            alert("Competition acceptance saved.");
                        } catch (e) {
                            alert("Could not accept: " + e.message);
                        } finally {
                            btn.disabled = false;
                        }
                    };
                });
            };

            renderRows(fullList);

            document.getElementById("adminSearch").addEventListener("input", (e) => {
                const q = e.target.value.toLowerCase();
                const filterVal = document.getElementById("adminFilter").value;
                let list = fullList.filter(u => (u.fullName || "").toLowerCase().includes(q) || (u.school || "").toLowerCase().includes(q));
                if (filterVal !== "all") list = list.filter(u => u.status === filterVal);
                renderRows(list);
            });
            document.getElementById("adminFilter").addEventListener("change", (e) => {
                const v = e.target.value;
                const q = document.getElementById("adminSearch").value.toLowerCase();
                let list = v === "all" ? fullList : fullList.filter(u => u.status === v);
                if (q) list = list.filter(u => (u.fullName || "").toLowerCase().includes(q) || (u.school || "").toLowerCase().includes(q));
                renderRows(list);
            });
        }

        // ============================================================
        //  ⑨ onAuthStateChanged — session guard + email verification
        // ============================================================
        auth.onAuthStateChanged(user => {
            // Stand down during active signup flow
            if (window.__pdcRegistering) return;

            const path = window.location.pathname;

            if (!user) {
                window.pdcDebugLog("No user — checking protected routes…");
                if (pdcIsProtectedRoute(path)) {
                    window.location.href = "https://pdc.praditadirgantara.sch.id/login";
                }
                hide("logoutBtn");
                hide("actionLogout");
                return;
            }

            // ── Email-verification gate must NOT fire on login/signup pages ──
            // On those pages the user may briefly be signed in (e.g. right after
            // account creation before signOut() completes), and firing signOut()
            // again there causes a redirect loop or race condition.
            if (!user.emailVerified && !pdcIsPublicRoute(path)) {
                window.pdcDebugLog("User not email-verified. Forcing sign-out (protected route only).");
                auth.signOut().then(() => {
                    if (pdcIsProtectedRoute(path)) {
                        window.location.href = "https://pdc.praditadirgantara.sch.id/login?error=unverified";
                    }
                });
                return;
            }

            // ── Public route with unverified user — just stand down ──
            if (!user.emailVerified && pdcIsPublicRoute(path)) {
                window.pdcDebugLog("Unverified user on public route — standing down.");
                return;
            }

            // Verified user
            window.pdcDebugLog("Verified user logged in:", user.email);
            const emailDisplay = document.getElementById("userEmail") || document.getElementById("authEmailStatus");
            if (emailDisplay) emailDisplay.textContent = user.email;

            // Real-time Firestore listener
            db.collection("users").doc(user.uid).onSnapshot(doc => {
                if (!doc.exists) { window.pdcDebugLog("User doc missing in Firestore."); return; }
                const data = doc.data();
                window.pdcDebugLog("Firestore snapshot:", data);

                // ── NEW: role-based branch ─────────────────────────
                // Admins never see participant-only UI (locked-profile card,
                // competition picker, Forminator autofill, etc). Non-admins
                // are bounced out of /admin back to their dashboard.
                const isAdmin = data.role === "admin";

                if (pdcIsAdminRoute(path) && !isAdmin) {
                    window.pdcDebugLog("Non-admin tried to access /admin — redirecting.");
                    window.location.href = "https://pdc.praditadirgantara.sch.id/dashboard";
                    return;
                }

                if (isAdmin) {
                    if (pdcIsAdminRoute(path)) {
                        initAdminPanel(user);
                    } else if (path.includes("/dashboard") || path === "/") {
                        const mount = document.getElementById("widgetMainText") || document.getElementById("dynamicWorkspaceMount");
                        if (mount) renderAdminDashboardWidget(mount);
                    }
                    const displayStatus = document.getElementById("displayStatus") || document.getElementById("metaStatusPill");
                    if (displayStatus) { displayStatus.textContent = "Admin"; displayStatus.style.backgroundColor = "#323289"; }
                    return; // skip everything below — that's all participant-only rendering
                }
                // ── end role branch — everything below this line is
                // unchanged participant behaviour ──────────────────

                const textMap = {
                    "displayFullName": data.fullName,
                    "metaName"       : data.fullName,
                    "displaySchool"  : data.school      || "",
                    "metaSchool"     : data.school      || "",
                    "displayNisn"    : data.nisn        || "",
                    "metaNisn"       : data.nisn        || "",
                    "displayPhone"   : data.phoneNumber || "",
                    "metaPhone"      : data.phoneNumber || "",
                    "displayGrade"   : data.grade       || "",
                    "metaGrade"      : data.grade       || ""
                };
                Object.keys(textMap).forEach(id => {
                    const el = document.getElementById(id);
                    if (el && textMap[id]) el.textContent = textMap[id];
                });

                const imgContainer  = document.getElementById("imageDisplayContainer");
                const uiStudentCard = document.getElementById("uiStudentCard");
                const uiIdCard      = document.getElementById("uiIdCard");
                let hasImages = false;
                if (data.studentCardURL && uiStudentCard) { uiStudentCard.src = data.studentCardURL; hasImages = true; }
                if (data.idCardURL      && uiIdCard)      { uiIdCard.src      = data.idCardURL;      hasImages = true; }
                if (imgContainer) imgContainer.style.display = hasImages ? "flex" : "none";

                const isLocked = data.dataLocked === true || data.profileComplete === true;
                if (!isLocked && !window.pdcIsSubmitting) {
                    const nameInput   = document.querySelector("input[name^='name-']")    || document.querySelector(".forminator-field-name input")    || document.getElementById("name-1");
                    const phoneInput  = document.querySelector("input[name^='phone-']")   || document.querySelector(".forminator-field-phone input")   || document.getElementById("phone-1");
                    const nisnInput   = document.querySelector("input[name^='number-']")  || document.querySelector(".forminator-field-number input")  || document.getElementById("number-1");
                    const schoolInput = document.querySelector("input[name^='text-']")    || document.querySelector(".forminator-field-text input")    || document.getElementById("text-1");
                    const gradeSelect = document.querySelector("select[name^='select-']") || document.querySelector(".forminator-field-select select") || document.getElementById("select-1");
                    if (nameInput   && !nameInput.value)   nameInput.value   = data.fullName    || "";
                    if (phoneInput  && !phoneInput.value)  phoneInput.value  = data.phoneNumber || "";
                    if (nisnInput   && !nisnInput.value)   nisnInput.value   = data.nisn        || "";
                    if (schoolInput && !schoolInput.value) schoolInput.value = data.school      || "";
                    if (gradeSelect && !gradeSelect.value) gradeSelect.value = data.grade       || "";
                }

                const accountStatus = (data.status || "incomplete").toLowerCase();
                const displayStatus = document.getElementById("displayStatus") || document.getElementById("metaStatusPill");
                if (displayStatus) {
                    let label = "Incomplete", color = "#797980";
                    if (isLocked) { label = "Waiting"; color = "#E67E22"; }
                    if (accountStatus === "verified" || accountStatus === "accepted") { label = "Verified"; color = "#2E7D32"; }
                    displayStatus.textContent           = label;
                    displayStatus.style.backgroundColor = color;
                }

                // ── Profile page ──────────────────────────────────
                if (path.includes("/profile")) {
                    const formWrapper = document.querySelector(".profile-form-card") || document.getElementById("profileFormWrapper");
                    if (formWrapper && isLocked && !window.pdcIsSubmitting) {
                        renderLockedProfileCard(data, formWrapper, false);
                    }
                }

                // ── Dashboard page ────────────────────────────────
                const widgetMount = document.getElementById("widgetMainText") || document.getElementById("dynamicWorkspaceMount");
                const compStatus  = (data.competitionStatus || "none").toLowerCase();

                if (widgetMount && (path.includes("/dashboard") || path === "/")) {

                    if (!isLocked) {
                        widgetMount.innerHTML = `<div style="text-align:center; font-size:24px; font-weight:800; color:#323289; line-height:34px; width:100%;">Please complete and lock your profile to register a competition!</div>`;

                    } else if (accountStatus === "waiting" || accountStatus === "draft" ||
                               (isLocked && accountStatus !== "verified" && accountStatus !== "accepted")) {
                        renderLockedProfileCard(data, widgetMount, true);

                    } else if (accountStatus === "verified" || accountStatus === "accepted") {
                        if (!data.registeredCompetition || compStatus === "none") {
                            const btnStyle = "padding:20px 16px; border:none; border-radius:16px; font-weight:800; font-size:14px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.08); transition:transform 0.2s;";
                            const imgStyle = "width:100%; height:100%; object-fit:cover; border-radius:8px;";
                            const compThemes = {
                                "Math Olympiad"     : { bg:"#FADBD8", fg:"#C0392B", img:"https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/math%20olympiad.avif" },
                                "Science Olympiad"  : { bg:"#D4EFDF", fg:"#196F3D", img:"https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/scienolymp.avif" },
                                "Scientific Writing": { bg:"#D4E6F1", fg:"#1F618D", img:"https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/sciriwirirr.avif" },
                                "Logic Olympiad"    : { bg:"#FFA0D8", fg:"#B7950B", img:"https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/logicz.avif" },
                                "Solo Vocal"        : { bg:"#EBDEF0", fg:"#7D3C98", img:"https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/solvocc.avif" },
                                "Speech"            : { bg:"#F9E79F", fg:"#E67E22", img:"https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/speechv.avif" },
                                "Basket"            : { bg:"#F5CBA7", fg:"#D35400", img:"https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/b%20asqet.avif" }
                            };
                            let cards = `<div style="width:100%;"><p style="color:#323289; font-size:22px; font-weight:800; margin-bottom:20px; text-align:center;">Please select a competition to register:</p><div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:16px; width:100%;">`;
                            Object.keys(FORM_LINKS).forEach(id => {
                                const t = compThemes[id] || { bg:"#E0E0E0", fg:"#424242", img:"" };
                                cards += `<button class="pdc-comp-card-btn" data-id="${id}" style="${btnStyle} background:${t.bg}; color:${t.fg};">${t.img ? `<img src="${t.img}" style="${imgStyle}">` : ""}<span>${id}</span></button>`;
                            });
                            cards += `</div></div>`;
                            widgetMount.innerHTML = cards;

                            widgetMount.querySelectorAll(".pdc-comp-card-btn").forEach(btn => {
                                btn.addEventListener("click", function () {
                                    const compId = this.getAttribute("data-id");
                                    widgetMount.style.opacity = "0.4";
                                    db.collection("users").doc(user.uid).update({
                                        registeredCompetition: compId,
                                        competitionStatus    : "pending"
                                    }).then(() => {
                                        window.open(FORM_LINKS[compId], "_blank");
                                        widgetMount.style.opacity = "1";
                                    }).catch(err => {
                                        widgetMount.style.opacity = "1";
                                        alert("Error: " + err.message);
                                    });
                                });
                            });

                        // ── FIX: operator precedence bug. The original
                        // `compStatus === "pending" || compStatus === "waiting" && registeredCompetition === "Math Olympiad"`
                        // evaluated as `pending || (waiting && registeredCompetition===...)` where
                        // `registeredCompetition` was an undeclared variable — this threw a
                        // ReferenceError and broke the whole snapshot callback whenever
                        // compStatus was "waiting". Simplified to the clearly-intended check,
                        // using data.registeredCompetition.
                        } else if (compStatus === "pending" || compStatus === "waiting") {
                            const formRegisLomba = FORM_LINKS[data.registeredCompetition] || "#";
                            widgetMount.innerHTML = `
                                <div style="text-align:center; display:flex; flex-direction:column; align-items:center; width:100%; gap:12px;">
                                    <span style="font-size:15px; font-weight:700; color:#73739d; text-transform:uppercase; letter-spacing:0.05em;">❖ Competition</span>
                                    <h1 style="font-size:38px; font-weight:800; color:#323289; margin:8px 0 20px 0;">${escapeHtml(data.registeredCompetition)}</h1>
                                    <div style="background:#AEB6BF; color:#fff; font-size:15px; font-weight:700; padding:12px 36px; border-radius:12px;">Please wait for your form to be accepted.</div>
                                    <a style="background:#AEB6BF; color:#fff; font-size:15px; font-weight:700; padding:12px 36px; border-radius:12px; text-decoration:none; display:inline-block;" href="${formRegisLomba}" target="_blank">${escapeHtml(data.registeredCompetition)} Registration Form</a>
                                </div>`;
                            // ── FIX: original href was malformed ( href=">${...}" ) and would
                            // not render as a working link. Fixed and added target="_blank".

                        } else if (compStatus === "verified" || compStatus === "accepted") {
                            const waLink = WHATSAPP_LINKS[data.registeredCompetition] || "https://chat.whatsapp.com/";
                            widgetMount.innerHTML = `
                                <div style="text-align:center; display:flex; flex-direction:column; align-items:center; width:100%; gap:12px;">
                                    <span style="font-size:15px; font-weight:700; color:#73739d; text-transform:uppercase; letter-spacing:0.05em;">❖ Competition</span>
                                    <h1 style="font-size:38px; font-weight:800; color:#323289; margin:8px 0 16px 0;">${escapeHtml(data.registeredCompetition)}</h1>
                                    <div style="background:#4D81E3; color:#fff; font-size:15px; font-weight:700; padding:10px 45px; border-radius:12px; margin-bottom:16px;">Status: Accepted</div>
                                    <a href="${waLink}" target="_blank" style="background:#2ECC71 !important; color:#fff !important; font-size:16px !important; font-weight:800 !important; padding:14px 32px !important; border-radius:12px !important; text-decoration:none !important; display:inline-flex !important; align-items:center !important;">Click here to join WhatsApp group</a>
                                </div>`;
                        }

                    } else {
                        widgetMount.innerHTML = `<div style="text-align:center;"><h3>Profile Under Review</h3><p>Please wait for verification.</p></div>`;
                    }
                }
            }); // end onSnapshot
        }); // end onAuthStateChanged

        // ============================================================
        //  ⑩ WIRE UP LOGIN / REGISTER FORMS  (Forminator/WordPress embeds)
        //  These IDs (#pdc-login-form, #pdc-register-form) are used by
        //  WordPress shortcode embeds — not by the standalone login.html /
        //  signup.html which have their own self-contained scripts.
        // ============================================================
        const loginForm = document.getElementById("pdc-login-form");
        if (loginForm) {
            loginForm.addEventListener("submit", async e => {
                e.preventDefault();
                const email    = document.getElementById("pdc-login-email")?.value?.trim();
                const password = document.getElementById("pdc-login-password")?.value;
                if (email && password) await handleLogin(email, password);
            });
        }

        const registerForm = document.getElementById("pdc-register-form");
        if (registerForm) {
            registerForm.addEventListener("submit", async e => {
                e.preventDefault();
                const email    = document.getElementById("pdc-register-email")?.value?.trim();
                const password = document.getElementById("pdc-register-password")?.value;
                if (email && password) await handleRegistration(email, password);
            });
        }

        const forgotLink = document.getElementById("pdc-forgot-password");
        if (forgotLink) {
            forgotLink.addEventListener("click", async e => {
                e.preventDefault();
                const email = document.getElementById("pdc-login-email")?.value?.trim()
                           || prompt("Enter your registered email address:");
                if (email) await handlePasswordReset(email);
            });
        }

        if (window.location.search.includes("error=unverified")) {
            showBanner("pdc-login-wrapper",
                "Your email is not yet verified. Please check your inbox and click the verification link before logging in.",
                "warning"
            );
        }

    }; // end initPdcApp

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(initPdcApp, 200);
    } else {
        document.addEventListener("DOMContentLoaded", () => setTimeout(initPdcApp, 200));
    }

})();


// ════════════════════════════════════════════════════════════
//  PART 2 — SIGNUP PAGE  (signup.js)
//  Only runs on /signup — all elements are guarded with a
//  presence check so nothing errors on other pages.
// ════════════════════════════════════════════════════════════

(function () {
    // Only activate on the signup page
    const onSignup = window.location.pathname.includes("/signup");
    if (!onSignup) return;

    const VERIFY_CONTINUE_URL = "https://pdc.praditadirgantara.sch.id/login";

    function waitForFirebase(cb) {
        if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0) {
            cb();
        } else {
            setTimeout(() => waitForFirebase(cb), 300);
        }
    }

    waitForFirebase(() => {
        const auth = firebase.auth();
        const db   = firebase.firestore();

        const msgEl         = document.getElementById("msg");
        const formFields    = document.getElementById("formFields");
        const registerBtn   = document.getElementById("registerBtn");
        const googleBtn     = document.getElementById("googleBtn");
        const emailInput    = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const confirmInput  = document.getElementById("confirmPassword");
        const eyeBtn        = document.getElementById("eyeBtn");
        const eyeOpen       = document.getElementById("eyeOpen");
        const eyeClosed     = document.getElementById("eyeClosed");
        const strengthFill  = document.getElementById("strengthFill");
        const strengthLabel = document.getElementById("strengthLabel");

        // Guard — if any critical element is missing, bail silently
        if (!registerBtn || !googleBtn || !msgEl) return;

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
                "auth/email-already-in-use"  : "An account with this email already exists. Try logging in instead.",
                "auth/invalid-email"          : "Please enter a valid email address.",
                "auth/weak-password"          : "Password is too weak. Use at least 6 characters.",
                "auth/network-request-failed" : "Network error. Check your internet connection.",
                "auth/too-many-requests"      : "Too many attempts. Please wait a moment."
            };
            return map[code] || "Check your email for email verification link (might be in spam) or something went wrong. Please try again.";
        }

        // ── Password strength meter ───────────────────────────
        function getStrength(pw) {
            let score = 0;
            if (pw.length >= 6)           score++;
            if (pw.length >= 10)          score++;
            if (/[A-Z]/.test(pw))         score++;
            if (/[0-9]/.test(pw))         score++;
            if (/[^A-Za-z0-9]/.test(pw))  score++;
            return score;
        }

        if (passwordInput && strengthFill && strengthLabel) {
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
        }

        // ── Show / hide password ──────────────────────────────
        if (eyeBtn && passwordInput && eyeOpen && eyeClosed) {
            eyeBtn.addEventListener("click", () => {
                const isHidden = passwordInput.type === "password";
                passwordInput.type      = isHidden ? "text"  : "password";
                eyeOpen.style.display   = isHidden ? "none"  : "";
                eyeClosed.style.display = isHidden ? ""      : "none";
            });
        }

        // ── Enter key support ─────────────────────────────────
        [emailInput, passwordInput, confirmInput].forEach(el => {
            if (el) el.addEventListener("keydown", e => { if (e.key === "Enter") registerBtn.click(); });
        });

        function showSuccess(email) {
            if (formFields) formFields.classList.add("pdc-hidden");
            showMsg(
                "Account created! We sent a verification email to " + email + ". Please check your inbox (and spam folder), then log in.",
                "success"
            );
        }

        // ============================================================
        //  EMAIL / PASSWORD REGISTER
        // ============================================================
        registerBtn.addEventListener("click", async () => {
            const email    = emailInput?.value.trim();
            const password = passwordInput?.value;
            const confirm  = confirmInput?.value;

            if (!email || !password || !confirm) { showMsg("Please fill in all fields.", "error"); return; }
            if (password.length < 6)             { showMsg("Password must be at least 6 characters.", "error"); return; }
            if (password !== confirm) {
                showMsg("Passwords do not match. Please try again.", "error");
                confirmInput.focus();
                return;
            }

            setLoading(true);
            showMsg("Creating your account…", "info");

            try {
                // ── Raise flag BEFORE creating the account so
                //    onAuthStateChanged in Part 1 stands down completely ──
                window.__pdcRegistering = true;

                const cred = await auth.createUserWithEmailAndPassword(email, password);
                const user = cred.user;

                await user.sendEmailVerification({ url: VERIFY_CONTINUE_URL });

                await db.collection("users").doc(user.uid).set({
                    email           : email,
                    role            : "participant",
                    profileComplete : false,
                    dataLocked      : false,
                    status          : "unverified",
                    createdAt       : firebase.firestore.FieldValue.serverTimestamp()
                });

                await auth.signOut();
                window.__pdcRegistering = false;
                showSuccess(email);

            } catch (err) {
                window.__pdcRegistering = false;
                console.error(err);
                showMsg(friendlyError(err.code), "error");
                setLoading(false);
            }
        });

        // ============================================================
        //  GOOGLE SIGN-UP
        //  Google accounts are already verified by Google so we
        //  set status:"draft" instead of "unverified".
        //  This prevents the user being stuck in "Profile Under Review"
        //  before they've even filled in their profile.
        // ============================================================
        googleBtn.addEventListener("click", async () => {
            setLoading(true);
            showMsg("Opening Google sign-in…", "info");
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result   = await auth.signInWithPopup(provider);
                const user     = result.user;

                // Check whether this is a brand-new user or a returning one
                const isNewUser = result.additionalUserInfo && result.additionalUserInfo.isNewUser;

                if (isNewUser) {
                    // New Google sign-up — create Firestore doc.
                    // status:"draft" means email is verified (Google guarantees it)
                    // but profile data hasn't been submitted yet.
                    await db.collection("users").doc(user.uid).set({
                        email           : user.email,
                        role            : "participant",
                        profileComplete : false,
                        dataLocked      : false,
                        status          : "draft",
                        createdAt       : firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
                // Returning Google user — don't overwrite their existing status/role

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
    });
})();


// ════════════════════════════════════════════════════════════
//  CHANGELOG (v2)
// ════════════════════════════════════════════════════════════
// NEW — Admin role support:
//   • /admin added to ADMIN_ROUTES + PROTECTED_ROUTES. Logged-out users
//     are bounced to /login; logged-in non-admins are bounced to /dashboard.
//   • onSnapshot now branches on data.role === "admin" right after the
//     redirect check, BEFORE any participant-only rendering runs.
//   • renderAdminDashboardWidget(): small "you're an admin" widget shown
//     inside #widgetMainText/#dynamicWorkspaceMount on /dashboard.
//   • initAdminPanel() + renderAdminTable(): full registrant table on
//     /admin inside #adminPanelMount — search box, status filter,
//     per-row "Verify" and "Accept Comp" action buttons.
//   ⚠ role is still a plain client-writable Firestore field. You MUST add
//     security rules that forbid users from setting their own `role`
//     field (or move role assignment server-side / Cloud Functions),
//     otherwise anyone can grant themselves admin from the console.
//     Ask if you want the matching firestore.rules drafted.
//
// FIXED — bugs from the previous version:
//   1. renderLockedProfileCard avatar: was `<img src=idCardURL>` (the
//      literal word "idCardURL", not the data value) — now correctly
//      binds to data.idCardURL / data.studentCardURL, with an initials
//      fallback instead of a broken image icon.
//   2. Operator precedence bug in the competition-status branch:
//      `compStatus === "pending" || compStatus === "waiting" && registeredCompetition === "Math Olympiad"`
//      — `&&` bound tighter than `||`, and `registeredCompetition` was an
//      undeclared global, so this threw ReferenceError and broke the
//      whole onSnapshot callback whenever compStatus was "waiting".
//      Simplified to `compStatus === "pending" || compStatus === "waiting"`.
//   3. Malformed link markup in that same branch: `href=">${formregislomba}"`
//      — extra `>` and broken quoting meant the link never rendered
//      correctly. Fixed, and added target="_blank".
//   4. Resend-verification button stored the user's plaintext password in
//      a `dataset.password` attribute (readable via DevTools). Now kept
//      in the enclosing closure instead.
//   5. role:"participant" is now set consistently across ALL signup paths
//      (Part 1 handleRegistration, Part 2 email signup, Part 2 Google
//      signup) — previously Part 1's handleRegistration didn't set role
//      at all, which would have made role-based checks unreliable for
//      any account created through that path.
//   6. Added a basic escapeHtml() helper and used it wherever
//      user-controlled Firestore fields (name, school, competition, etc.)
//      are interpolated into innerHTML, to reduce stored-XSS exposure.
// ════════════════════════════════════════════════════════════
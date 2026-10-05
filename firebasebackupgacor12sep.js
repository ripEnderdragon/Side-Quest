// ════════════════════════════════════════════════════════════
//  PART 1 — GLOBAL APP  (firebase.js)
// ════════════════════════════════════════════════════════════

window.pdcDebugLog = window.pdcDebugLog || function (...args) {
    const el = document.getElementById("debugLog");
    console.info("[PDC Debug]", ...args);
    if (el) {
        el.textContent += "[PDC Debug] " + args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : a).join(" ") + "\n";
        el.scrollTop = el.scrollHeight;
    }
};

// ── BUILD STAMP ──────────────────────────────────────────────
//  Bumped whenever this file changes. Type  PDC_BUILD  in the browser
//  console on any page of the site: if it does not match the value
//  here, the snippet in WordPress is an older copy and none of the
//  newer fixes are live. Deliberately outside the pdcAppInitialized
//  guard below, so it reports even on a page that already ran.
const PDC_BUILD_ID = "2026-08-28-submission-validation";
window.PDC_BUILD = PDC_BUILD_ID;
console.info("[PDC] build " + PDC_BUILD_ID + " loaded");

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

// ============================================================
//  COMPETITION LABEL SAFETY
//
//  registeredCompetition is looked up in FORM_LINKS / WHATSAPP_LINKS
//  to build the links shown on the dashboard, so an unexpected value
//  used to render href="undefined". Accounts created before the site
//  rewrite can hold legacy spellings; these helpers map those back to
//  a canonical label instead of producing a dead link.
//
//  Order matters below: "scientific" is tested BEFORE "science",
//  because a plain substring match makes "Scientific Writing" match
//  "science" and turn into "Science Olympiad".
// ============================================================
const COMPETITION_ALIAS_RULES = [
    [/scientific|karya\s*tulis|\bkti\b|\blkti\b/i, "Scientific Writing"],
    [/science|\bsains\b|\bipa\b/i,                  "Science Olympiad"],
    [/math|matemat/i,                                 "Math Olympiad"],
    [/logic|logika/i,                                 "Logic Olympiad"],
    [/vocal|vokal|nyanyi/i,                           "Solo Vocal"],
    [/speech|pidato/i,                                "Speech"],
    [/basket/i,                                       "Basket"]
];

// Returns one of the seven FORM_LINKS keys, or null when the value is
// empty or unrecognisable. Never guesses.
function pdcCanonicalCompetition(raw) {
    const value = String(raw || "").trim();
    if (!value) return null;
    if (FORM_LINKS[value]) return value;                       // already canonical

    for (const rule of COMPETITION_ALIAS_RULES) {
        if (rule[0].test(value)) return rule[1];
    }
    console.warn("[PDC] Unrecognised registeredCompetition:", raw);
    return null;
}

// Link lookups that degrade to the competitions page / generic WhatsApp
// entry point rather than emitting "undefined" into an href.
function pdcFormLink(raw) {
    const c = pdcCanonicalCompetition(raw);
    return (c && FORM_LINKS[c]) || "https://pdc.praditadirgantara.sch.id/competitions";
}
function pdcWhatsappLink(raw) {
    const c = pdcCanonicalCompetition(raw);
    return (c && WHATSAPP_LINKS[c]) || "https://chat.whatsapp.com/";
}
// Display name: the canonical label when we can resolve it, otherwise
// whatever is stored, so the card never renders "null" or "undefined".
function pdcCompetitionName(raw) {
    return pdcCanonicalCompetition(raw) || String(raw || "").trim() || "Your competition";
}

const EMAIL_VERIFY_CONTINUE_URL = "https://pdc.praditadirgantara.sch.id/login";

// ── Helper: list of routes where auth guards must NOT redirect or sign-out ──
const PUBLIC_ROUTES  = ["/login", "/signup", "/register", "/home", "/about", "/competitions", "/faqs"];
const PROTECTED_ROUTES = ["/profile", "/dashboard", "/register-math", "/register-science", "/register-scientific-writing", "/register-logic", "/register-solo-vocal", "/register-speech", "/register-basket"];

function pdcIsPublicRoute(path) {
    return PUBLIC_ROUTES.some(r => path.includes(r));
}
function pdcIsProtectedRoute(path) {
    return PROTECTED_ROUTES.some(r => path.includes(r));
}

(function () {
    if (window.pdcAppInitialized) {
        window.pdcDebugLog("Script already initialised. Skipping duplicate execution.");
        return;
    }
    window.pdcAppInitialized = true;

    //  Which copy actually took control. If two copies of this script are on
    //  the page — an old site-wide snippet plus a newer per-page one — the
    //  first to run wins and every later copy returns at the guard above.
    //  window.PDC_BUILD then reports the newest file LOADED while the OLD
    //  code is the one running, which looks exactly like a fix that did not
    //  work. Compare the two in the console: they must be equal.
    window.PDC_ACTIVE_BUILD = PDC_BUILD_ID;
    console.info("[PDC] build " + PDC_BUILD_ID + " is the ACTIVE one");

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

    // ============================================================
    //  CONFIRMATION MODAL — used before locking in a competition
    //  choice. Looks for the static markup (#pdcConfirmModal) that
    //  ships with the dashboard HTML; falls back to a plain
    //  window.confirm() if that markup isn't present on the page.
    // ============================================================
    function pdcConfirm(competitionName) {
    return new Promise(resolve => {
        const modal = document.getElementById("pdcConfirmModal");
        if (!modal) {
            resolve(window.confirm(`Daftar untuk ${competitionName}?`));
            return;
        }
        const nameEl     = document.getElementById("pdcConfirmModalComp");
        const confirmBtn = document.getElementById("pdcConfirmModalConfirm");
        const cancelBtn  = document.getElementById("pdcConfirmModalCancel");
        if (nameEl) nameEl.textContent = competitionName;

        modal.classList.add("show");   // was: modal.style.display = "flex";

        function cleanup(result) {
            modal.classList.remove("show");   // was: modal.style.display = "none";
            confirmBtn.removeEventListener("click", onConfirm);
            cancelBtn.removeEventListener("click", onCancel);
            modal.removeEventListener("click", onOverlayClick);
            resolve(result);
        }
        function onConfirm() { cleanup(true); }
        function onCancel()  { cleanup(false); }
        function onOverlayClick(e) { if (e.target === modal) cleanup(false); }

        confirmBtn.addEventListener("click", onConfirm);
        cancelBtn.addEventListener("click", onCancel);
        modal.addEventListener("click", onOverlayClick);
    });
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
                // Document first — see the note in the signup handler below.
                // A failed verification email is recoverable; a missing
                // document is not.
                await db.collection("users").doc(user.uid).set({
                    email      : email,
                    role       : "participant",
                    status     : "unverified",
                    dataLocked : false,
                    createdAt  : firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                try {
                    await user.sendEmailVerification({ url: EMAIL_VERIFY_CONTINUE_URL, handleCodeInApp: false });
                    window.pdcDebugLog("Verification email sent to:", email);
                } catch (mailErr) {
                    window.pdcDebugLog("Verification email FAILED (account still created):", mailErr.message);
                }
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
                    // Stamp credentials onto the button so the handler can re-auth
                    resendBtn.dataset.email    = email;
                    resendBtn.dataset.password = password;
                    resendBtn.onclick = async () => {
                        try {
                            const tempCred = await auth.signInWithEmailAndPassword(
                                resendBtn.dataset.email,
                                resendBtn.dataset.password
                            );
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
		//biar nisn +0
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
        //  ④b SUBMISSION FORM VALIDATION  (runs before any upload)
        //
        //  The custom "Upload & Submit Works" button calls
        //  preventDefault(), so Forminator's own validator never runs on a
        //  submission form. The only gate left was formEl.checkValidity() —
        //  and Forminator does not put the native `required` attribute on
        //  its fields, it validates in its own JS — so an entry sailed
        //  through with upload slots empty. The pipeline then accepted
        //  anything carrying at least ONE file, which is why the sheet has
        //  rows with "Submitted At" filled and only one of three
        //  File Submission columns.
        //
        //  Everything below runs BEFORE the first byte is uploaded. A slot
        //  counts as filled if the student picks a file now OR the matching
        //  submissionFileUrl_N is already in Firestore, so re-submitting
        //  does not force a re-upload of files that are already stored.
        // ============================================================

        // Slots a form is allowed to leave empty, keyed by the digits in the
        // Forminator form id (<form id="forminator-module-10492…">).
        //
        // THIS STAYS EMPTY. There are no optional upload slots in PDC 2026 —
        // every slot a submission form shows is required on every competition.
        // Do not read Forminator's own required markers as permission to relax
        // that: only 2 of Solo Vocal's 7 upload fields are marked required in
        // the form builder, and all 7 are mandatory. An entry short of a file
        // is an incomplete entry, not a valid one with a blank.
        //
        // The map exists only so a future competition with a genuinely
        // optional slot can be handled without touching the validator:
        //   "10492": [7]   → slot 7 may be empty on form 10492.
        const SUBMISSION_OPTIONAL_SLOTS = {};

        // How many upload fields each competition's form carried when the
        // validation was last checked against the live site (28 Aug 2026).
        // An upload field deleted in the form builder would otherwise just
        // become one less file anyone has to send, silently — the exact class
        // of failure this whole section exists to stop. Console warning only:
        // a form the committee legitimately changed must never block a
        // student mid-submission.
        const SUBMISSION_EXPECTED_SLOTS = {
            "10487": 3,   // Math Olympiad
            "10490": 3,   // Science Olympiad
            "10488": 3,   // Logic Olympiad
            "10500": 4,   // Basket        — no consent checkbox on this form
            "10492": 6,   // Speech
            "10491": 7,   // Scientific Writing
            "10504": 7    // Solo Vocal
        };

        // Solo Vocal needs 7 upload slots. Keep this in step with the
        // File Submission columns in SyncFirestoreToSheet.gs, export-users.js
        // and merge-ghosts.js: a file dropped into a slot that has no column
        // is uploaded nowhere and lost without any error.
        const MAX_SUBMISSION_SLOTS = 7;

        function pdcEscapeHtml(s) {
            return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
                "&": "&", "<": "<", ">": ">", '"': """, "'": "'"
            }[c]));
        }

        function pdcFormNumericId(formEl) {
            const m = String((formEl && formEl.id) || "").match(/\d{3,}/);
            return m ? m[0] : "";
        }

        // Whether a field is really on the form for the student to fill in.
        //
        //  Never judge the <input> itself. Forminator renders the real file
        //  input and the real checkbox invisible and lays its own styled
        //  widget on top, so offsetParent / getClientRects on the control
        //  report "hidden" for a field the student can plainly see. Judging
        //  the control is how the Solo Vocal form (10504) came back with zero
        //  upload slots and zero fields while its markup held both.
        //
        //  Start at the input's PARENT and walk every ancestor up to <body>.
        //  A container the browser is not rendering means the field genuinely
        //  is not in play — that is how Forminator's conditional logic hides a
        //  field, and how Elementor hides the duplicate copy of a widget it
        //  sometimes renders alongside the real one. The walk must not stop at
        //  the <form>: Elementor hides that duplicate by styling a wrapper
        //  ABOVE the form, so stopping there let a ghost form's fields count.
        function pdcFieldIsActive(el) {
            if (!el || el.type === "hidden" || el.disabled) return false;
            let node = el.parentElement;
            while (node && node !== document.body) {
                const cs = window.getComputedStyle(node);
                if (cs && (cs.display === "none" || cs.visibility === "hidden")) return false;
                node = node.parentElement;
            }
            return true;
        }

        // What the student gets told is missing. Forminator only renders a
        // <label> when the field has one set, and five of Solo Vocal's seven
        // upload boxes have none — which would put "upload-3" in front of a
        // student as the name of the thing they forgot. Fall through the
        // other places the question text can live, then to a caller-supplied
        // fallback ("File 3"), which at least matches the order on screen and
        // the red outline drawn on the field itself.
        function pdcFieldLabel(el, fallback) {
            const clean  = t => String(t || "").replace(/\s+/g, " ").replace(/[*:\s]+$/, "").trim();
            // Scientific Writing's sixth upload is labelled "]" in the form
            // builder — a stray keystroke someone left behind. Telling a
            // student that "]" is missing is worse than saying "File 6", so
            // any candidate without a letter or digit in it is discarded.
            const usable = t => t.length >= 2 && /[\p{L}\p{N}]/u.test(t);
            const pick   = t => { const c = clean(t); return usable(c) ? c : ""; };
            const box = el.closest(".forminator-field, .forminator-col, .forminator-row");
            let text = "";
            if (box) {
                const lab = box.querySelector(".forminator-label, label");
                if (lab) text = pick(lab.textContent);
                if (!text) {
                    const desc = box.querySelector(".forminator-description");
                    if (desc) text = pick(desc.textContent);
                }
            }
            if (!text && el.id) {
                const lab = document.querySelector('label[for="' + el.id.replace(/"/g, '\\"') + '"]');
                if (lab) text = pick(lab.textContent);
            }
            if (!text) text = pick(el.getAttribute("aria-label") || el.getAttribute("data-label") || "");
            // A short line of text sitting directly above the field: these
            // forms often carry the question in a separate HTML block.
            if (!text && box && box.previousElementSibling) {
                const near = clean(box.previousElementSibling.textContent);
                if (usable(near) && near.length <= 80) text = near;
            }
            return text || fallback || el.name || el.id || "Field ini";
        }

        // Forminator marks a required field with a <span class="forminator-required">
        // asterisk rather than the native attribute, so check every signal.
        function pdcFieldIsRequired(el) {
            if (el.required || el.getAttribute("aria-required") === "true") return true;
            if (el.dataset && (el.dataset.required === "true" || el.dataset.required === "1")) return true;
            const box = el.closest(".forminator-field, .forminator-col, .forminator-row");
            if (!box) return false;
            if (box.querySelector(".forminator-required")) return true;
            if (/(^|[\s_-])required/i.test(box.className)) return true;
            const lab = box.querySelector(".forminator-label, label");
            return !!(lab && /\*\s*$/.test(lab.textContent.trim()));
        }

        // Pairs each upload field on the form with the File Submission column
        // it writes to. The old code looked up `input[name^='upload-N']` for
        // N = 1..7, which is a PREFIX match: on a form whose fields ended up
        // numbered upload-10..upload-12 (Forminator renumbers when a field is
        // deleted and re-added) "upload-1" matched upload-10 and the other two
        // files were silently dropped. Honour a clean 1..7 numbering when the
        // form has one, and fall back to document order when it does not.
        function pdcSubmissionSlotMap(formEl) {
            const inputs = Array.from(formEl.querySelectorAll("input[type='file']"))
                                .filter(pdcFieldIsActive);
            const used  = new Set();
            const slots = inputs.map(el => {
                const m = String(el.name || el.id || "").match(/upload-(\d+)/);
                const n = m ? parseInt(m[1], 10) : 0;
                if (n >= 1 && n <= MAX_SUBMISSION_SLOTS && !used.has(n)) {
                    used.add(n);
                    return { slot: n, el: el };
                }
                return { slot: 0, el: el };
            });
            let next = 1;
            slots.forEach(s => {
                if (s.slot) return;
                while (used.has(next)) next++;
                if (next <= MAX_SUBMISSION_SLOTS) { s.slot = next; used.add(next); }
            });
            return slots;                       // slot === 0 → no column for it
        }

        // Returns { ok, problems: [{ el, label, message }] }.
        function pdcValidateSubmissionForm(formEl, slotMap, existing) {
            const stored   = existing || {};
            const problems = [];
            const seen     = new Set();
            const add = (el, message, fallbackLabel) => {
                if (!el || seen.has(el)) return;
                seen.add(el);
                problems.push({ el: el, label: pdcFieldLabel(el, fallbackLabel), message: message });
            };

            // ── 1. Every upload slot the form shows ──────────────────────
            const optional = SUBMISSION_OPTIONAL_SLOTS[pdcFormNumericId(formEl)] || [];
            slotMap.forEach(entry => {
                if (!entry.slot) return;                     // no column; logged by the caller
                if (optional.indexOf(entry.slot) !== -1) return;
                if (entry.el.files && entry.el.files[0]) return;
                if (String(stored["submissionFileUrl_" + entry.slot] || "").trim()) return;
                add(entry.el, "file belum dipilih / no file chosen", "File " + entry.slot);
            });

            // ── 2. The consent checkbox the pipeline stores ──────────────
            //  Only when it is a single box — a Forminator checkbox field with
            //  several options shares the same name prefix, and there "the
            //  first one must be ticked" would be wrong.
            const agreeGroup = Array.from(formEl.querySelectorAll("input[type='checkbox'][name^='checkbox-1']"));
            if (agreeGroup.length === 1 && pdcFieldIsActive(agreeGroup[0]) && !agreeGroup[0].checked) {
                add(agreeGroup[0], "harus dicentang / must be ticked");
            }

            // ── 3. Everything else Forminator marks as required ──────────
            //  If the markup carries no required marker anywhere, treat every
            //  visible field as required rather than letting the form through
            //  unchecked — an unmarked form is exactly the case this block
            //  exists to stop.
            const others = Array.from(formEl.querySelectorAll("input, select, textarea")).filter(el => {
                if (["file", "hidden", "submit", "button", "reset", "image"].indexOf(el.type) !== -1) return false;
                return pdcFieldIsActive(el);
            });
            // Judged over the WHOLE form, upload fields included: a form that
            // marks only its uploads required still counts as marked, so its
            // genuinely optional text fields stay optional.
            const markersPresent = others.concat(slotMap.map(s => s.el)).some(pdcFieldIsRequired);
            if (!markersPresent) {
                window.pdcDebugLog("No required markers on this form — treating every visible field as required.");
            }
            const groupsDone = new Set();
            others.forEach(el => {
                if (markersPresent && !pdcFieldIsRequired(el)) return;
                if (el.type === "checkbox" || el.type === "radio") {
                    const key = el.type + ":" + (el.name || el.id || "");
                    if (groupsDone.has(key)) return;
                    groupsDone.add(key);
                    const group = el.name
                        ? Array.from(formEl.querySelectorAll(
                              "input[type='" + el.type + "'][name=\"" + el.name.replace(/"/g, '\\"') + "\"]"
                          )).filter(pdcFieldIsActive)
                        : [el];
                    if (!group.some(g => g.checked)) {
                        add(el, el.type === "checkbox" ? "belum dicentang / not ticked"
                                                       : "belum dipilih / not selected");
                    }
                    return;
                }
                if (!String(el.value || "").trim()) add(el, "belum diisi / still empty");
            });

            return { ok: problems.length === 0, problems: problems };
        }

        // ── The panel students actually read, plus a red outline on each
        //    offending field so they can see what is missing without having
        //    to phone anyone. Both clear themselves as the fields are fixed.
        function pdcUnmarkProblem(box) {
            box.removeAttribute("data-pdc-problem");
            box.style.outline       = "";
            box.style.outlineOffset = "";
        }

        function pdcClearFormProblems(formEl) {
            const panel = formEl.querySelector("#pdc-form-problems");
            if (panel) panel.style.display = "none";
            formEl.querySelectorAll("[data-pdc-problem='true']").forEach(pdcUnmarkProblem);
        }

        function pdcWatchProblemFields(formEl) {
            if (formEl.dataset.pdcProblemWatcher === "true") return;
            formEl.dataset.pdcProblemWatcher = "true";
            const clearOne = e => {
                const box = e.target.closest("[data-pdc-problem='true']");
                if (!box) return;
                pdcUnmarkProblem(box);
                if (!formEl.querySelector("[data-pdc-problem='true']")) {
                    const panel = formEl.querySelector("#pdc-form-problems");
                    if (panel) panel.style.display = "none";
                }
            };
            formEl.addEventListener("input",  clearOne);
            formEl.addEventListener("change", clearOne);
        }

        // One panel, two tones: the red "you left something empty" list, and a
        // blue "nothing new to send" notice. Both sit directly above the
        // submit button so nobody has to hunt for the reason.
        const PDC_NOTICE_TONES = {
            error : { bg: "#FDEDEC", border: "#E74C3C", text: "#922B21" },
            info  : { bg: "#EBF5FB", border: "#3498DB", text: "#1A5276" }
        };

        function pdcRenderFormNotice(formEl, anchorBtn, opts) {
            const tone = PDC_NOTICE_TONES[opts.tone] || PDC_NOTICE_TONES.error;
            let panel = formEl.querySelector("#pdc-form-problems");
            if (!panel) {
                panel = document.createElement("div");
                panel.id = "pdc-form-problems";
                panel.setAttribute("role", "alert");
                panel.style.cssText = "border-left:4px solid; border-radius:10px; padding:14px 18px;" +
                    "margin:16px 0; font-size:14px; font-weight:700; line-height:1.6;" +
                    "text-align:left; box-sizing:border-box;";
                const host = (anchorBtn && anchorBtn.parentNode) || formEl;
                host.insertBefore(panel, (anchorBtn && anchorBtn.parentNode === host) ? anchorBtn : null);
            }
            panel.style.background  = tone.bg;
            panel.style.borderColor = tone.border;
            panel.style.color       = tone.text;
            panel.innerHTML =
                "<div>" + pdcEscapeHtml(opts.heading) + "</div>" +
                "<div style=\"font-weight:500; margin-top:2px;\">" + pdcEscapeHtml(opts.sub) + "</div>" +
                (opts.items && opts.items.length
                    ? "<ul style=\"margin:8px 0 0 18px; padding:0; font-weight:500;\">" +
                      opts.items.map(t => "<li style=\"margin:2px 0;\">" + pdcEscapeHtml(t) + "</li>").join("") +
                      "</ul>"
                    : "");
            panel.style.display = "block";
            panel.scrollIntoView({ behavior: "smooth", block: "center" });
            return panel;
        }

        function pdcShowFormProblems(formEl, anchorBtn, problems) {
            pdcRenderFormNotice(formEl, anchorBtn, {
                tone    : "error",
                heading : "Belum bisa dikirim — " + problems.length +
                          " bagian masih kosong. Lengkapi dulu, lalu tekan tombolnya lagi.",
                sub     : "Can't submit yet — " + problems.length +
                          " item" + (problems.length === 1 ? "" : "s") + " still missing:",
                items   : problems.map(p => p.label + " — " + p.message)
            });

            problems.forEach(p => {
                const box = p.el.closest(".forminator-field, .forminator-col, .forminator-row") || p.el;
                box.dataset.pdcProblem  = "true";
                box.style.outline       = "2px solid #E74C3C";
                box.style.outlineOffset = "4px";
            });
            pdcWatchProblemFields(formEl);
        }

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
                    saveBtn.textContent = "Simpan Draf (Dapat Diedit)";
                    saveBtn.className   = originalBtn.className;
                    saveBtn.style.setProperty("background-color", "#2281e6", "important");
                    saveBtn.style.setProperty("border-color",     "#2281e6", "important");
                    saveBtn.classList.add("pdc-custom-action-btn");

                    const finalBtn = document.createElement("button");
                    finalBtn.id          = "pdc-final-submit-btn";
                    finalBtn.type        = "button";
                    finalBtn.textContent = "Submit Final (Kunci Profil)";
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
            const user = auth.currentUser;
            if (!user) { alert("Session Timeout. Please refresh and log in again."); return; }

            const originalText = clickedBtn.textContent;
            const slotMap      = pdcSubmissionSlotMap(formEl);
            if (!slotMap.length) {
                alert("This form has no upload field. Please refresh the page — if it keeps happening, contact the committee.");
                return;
            }
            const expectedSlots = SUBMISSION_EXPECTED_SLOTS[pdcFormNumericId(formEl)];
            if (expectedSlots && slotMap.length !== expectedSlots) {
                window.pdcDebugLog(`Slot count changed: form shows ${slotMap.length}, expected ${expectedSlots}.`);
                console.error(`[PDC] Form ${pdcFormNumericId(formEl)} shows ${slotMap.length} upload fields; ` +
                              `${expectedSlots} were expected. If the form was changed on purpose, update ` +
                              `SUBMISSION_EXPECTED_SLOTS in firebase.js — otherwise a required file has gone missing.`);
            }
            const unmapped = slotMap.filter(s => !s.slot).length;
            if (unmapped) {
                window.pdcDebugLog(`Form exposes ${slotMap.length} upload fields but only ${MAX_SUBMISSION_SLOTS} slots are wired up.`);
                console.error(`[PDC] Submission form has ${slotMap.length} file inputs; pipeline handles ${MAX_SUBMISSION_SLOTS}. ${unmapped} of them have no column and will NOT be saved.`);
            }

            // Read what is already stored first, so a student re-submitting is
            // not forced to pick files again that a previous attempt uploaded.
            clickedBtn.disabled    = true;
            clickedBtn.textContent = "Checking your submission…";
            let existing = {};
            try {
                const snap = await db.collection("users").doc(user.uid).get();
                existing = (snap.exists && snap.data()) || {};
            } catch (err) {
                window.pdcDebugLog("Could not read the existing submission, continuing:", err.message);
            }

            const check = pdcValidateSubmissionForm(formEl, slotMap, existing);
            clickedBtn.disabled    = false;
            clickedBtn.textContent = originalText;
            if (!check.ok) {
                window.pdcDebugLog("Submission blocked — missing:", check.problems.map(p => p.label).join(", "));
                pdcShowFormProblems(formEl, clickedBtn, check.problems);
                return;
            }
            pdcClearFormProblems(formEl);
            if (!formEl.checkValidity()) { formEl.reportValidity(); return; }

            // A click that picks no new file at all. Validation passed only
            // because an earlier attempt already stored those files, so going
            // ahead would upload nothing, re-stamp submissionTimestamp and
            // bounce the student to the dashboard — which reads exactly like
            // the button ignoring an empty form. Never redirect on a no-op:
            // say what is actually going on and stay on the page.
            const toUpload = slotMap.filter(s => s.slot && s.el.files && s.el.files[0]);
            if (!toUpload.length) {
                const storedSlots = slotMap
                    .filter(s => s.slot && String(existing[`submissionFileUrl_${s.slot}`] || "").trim())
                    .map(s => s.slot);
                window.pdcDebugLog("No new file picked. Already stored slots:", storedSlots.join(", ") || "none");
                if (storedSlots.length) {
                    pdcRenderFormNotice(formEl, clickedBtn, {
                        tone    : "info",
                        heading : "Karya kamu sudah terkirim. Tidak ada file baru yang dipilih, jadi tidak ada yang dikirim ulang.",
                        sub     : "Already submitted — no new file chosen, so nothing was sent. " +
                                  "Pick a file to replace one, or open the dashboard to check your status.",
                        items   : storedSlots.map(n => "File " + n + " — sudah tersimpan / already stored")
                    });
                } else {
                    pdcShowFormProblems(formEl, clickedBtn, slotMap.filter(s => s.slot).map(s => ({
                        el: s.el, label: pdcFieldLabel(s.el, "File " + s.slot),
                        message: "file belum dipilih / no file chosen"
                    })));
                }
                return;
            }
            clickedBtn.disabled = true;
            try {
                if (!storage) throw new Error("Firebase Storage not available.");
                const payload = {
                    submissionTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    competitionStatus  : "pending"   // ← advances step 3 → 4
                };
                let done = 0;
                for (const entry of toUpload) {
                    const file = entry.el.files[0];
                    clickedBtn.textContent = `Uploading ${done + 1} of ${toUpload.length}…`;
                    const ref  = storage.ref(`competitionSubmissions/${user.uid}/slot-${entry.slot}_${Date.now()}_${file.name}`);
                    const snap = await ref.put(file);
                    payload[`submissionFileUrl_${entry.slot}`] = await snap.ref.getDownloadURL();
                    done++;
                }
                window.pdcDebugLog(`Uploaded ${done} file(s); writing submission.`);
                clickedBtn.textContent = "Saving…";
                const agreeEl = formEl.querySelector("input[type='checkbox'][name^='checkbox-1']")
                             || formEl.querySelector("#checkbox-1");
                if (agreeEl) payload["submissionCheckboxAgreement"] = agreeEl.checked;
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
                // Look inside THIS form first. These used to be plain
                // document.querySelector, which returns the first match
                // anywhere on the page — and Elementor frequently renders a
                // second, hidden copy of a widget. Whenever the hidden copy
                // came first in the DOM, the value read was always the empty
                // one, so the field silently saved as blank.
                const scope   = formEl || document;
                const pickEl  = sel => scope.querySelector(sel) || document.querySelector(sel);
                const getVal  = sel => pickEl(sel)?.value?.trim() || "";
                const getFile = sel => pickEl(sel)?.files?.[0];

                const fullNameValue = getVal("input[name^='name-']")    || getVal(".forminator-field-name input")    || getVal("#name-1");
                const phoneValue    = getVal("input[name^='phone-']")   || getVal(".forminator-field-phone input")   || getVal("#phone-1");
                const nisnValue     = getVal("input[name^='number-']")  || getVal(".forminator-field-number input")  || getVal("#number-1");
                const schoolValue   = getVal("input[name^='text-']")    || getVal(".forminator-field-text input")    || getVal("#text-1");
                const gradeValue    = getVal("select[name^='select-']") || getVal(".forminator-field-select select") || getVal("#select-1");

                // Forminator numbers its fields when they are created, so the
                // second upload box is NOT reliably called "upload-2" — if a
                // field was ever deleted and re-added, the numbering skips and
                // the old fixed selector below silently matched nothing. That
                // is why the ID photo saved sometimes and not others: no file
                // was ever found, so no URL was written.
                //
                // Take the file inputs in the order they appear inside this
                // form instead, which does not depend on their names, and keep
                // the old name-based lookup only as a fallback.
                const formFileInputs = Array.from(
                    (formEl || document).querySelectorAll("input[type='file']")
                );
                window.pdcDebugLog(
                    "Upload fields found:",
                    formFileInputs.map(function (i, n) {
                        return "[" + n + "] name=" + (i.name || "(none)") +
                               " id=" + (i.id || "(none)") +
                               " file=" + (i.files && i.files[0] ? i.files[0].name : "none");
                    }).join("  |  ") || "NONE"
                );

                const studentFile = formFileInputs[0]?.files?.[0]
                    || getFile("input[type='file'][name^='upload-1']") || getFile("#upload-1");
                const idFile      = formFileInputs[1]?.files?.[0]
                    || getFile("input[type='file'][name^='upload-2']") || getFile("#upload-2");

                const uploadFile = async (file, folder) => {
                    if (!storage || !file) return "";
                    const ref  = storage.ref(`${folder}/${user.uid}_${Date.now()}_${file.name}`);
                    const snap = await ref.put(file);
                    return await snap.ref.getDownloadURL();
                };

                const studentCardURL = await uploadFile(studentFile, "studentCards");
                const idCardURL      = await uploadFile(idFile,      "idCards");

                // Exactly what got picked up, so a field that saves blank can
                // be identified from the console instead of guessed at.
                window.pdcDebugLog("Field values read:", JSON.stringify({
                    fullName : fullNameValue,
                    phone    : phoneValue,
                    nisn     : nisnValue,
                    school   : schoolValue,
                    grade    : gradeValue,
                    studentFile : studentFile ? studentFile.name : null,
                    idFile      : idFile      ? idFile.name      : null
                }));
                [["fullName", fullNameValue], ["phone", phoneValue], ["nisn", nisnValue],
                 ["school", schoolValue], ["grade", gradeValue]].forEach(function (f) {
                    if (!f[1]) window.pdcDebugLog("EMPTY — not saved this run:", f[0]);
                });

                const payload = {
                    email           : user.email,
                    updatedAt       : firebase.firestore.FieldValue.serverTimestamp(),
                    profileComplete : isFinalSubmit,
                    dataLocked      : isFinalSubmit,
                    status          : isFinalSubmit ? "verified" : "draft"
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
            const val    = v => v || "";
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
        //  ⑧ᶜ PROFILE LOCKED NOTICE — replaces the Forminator form on
        //  /profile once the account is fully verified.
        // ============================================================
        function showProfileLockedNotice(formWrapper) {
            const elementorForm = formWrapper.querySelector("form")
                                || formWrapper.querySelector(".forminator-custom-form");
            if (elementorForm) elementorForm.style.display = "none";

            const placeholder = formWrapper.querySelector("div");
            if (placeholder && !elementorForm) placeholder.style.display = "none";

            let notice = document.getElementById("pdcProfileLockedNotice");
            if (!notice) {
                notice = document.createElement("div");
                notice.id = "pdcProfileLockedNotice";
                notice.style.cssText = `
                    width:100%; text-align:center; padding:40px 24px;
                    font-family:'Nunito',Arial,sans-serif;
                    font-size:18px; font-weight:800; color:#323289;
                `;
                formWrapper.appendChild(notice);
            }
            notice.textContent = "Kamu telah mengunci profilmu. Kamu bisa di lanjut ke dashboard untuk melanjutkan pendaftaran! Jika ada kesalahan, hubungi: +62 81287870627 (Kak Lio) untuk memperbaikinya. ";
            notice.style.display = "block";
        }
		
		

        // ============================================================
        //  ⑧ᵇ ALUR PENDAFTARAN — highlights the current step of the
        //  5-box registration flow on the dashboard:
        //    1. Lengkapi profil anda.
        //    2. Pilih kompetisi
        //    3. Isi formulir pendaftaran
        //    4. Verifikasi oleh admin
        //    5. Terdaftar!
        //  Steps are looked up by id="flowStep1" … "flowStep5".
        // ============================================================
        function computePdcFlowStep(data, isLocked, accountStatus, compStatus) {
    if (!isLocked) return 1;
    if (accountStatus !== "verified" && accountStatus !== "accepted") return 1;
    if (!data.registeredCompetition || compStatus === "none") return 2;

    // NEW: competition picked, external form not submitted/reviewed yet
    if (compStatus === "form_pending") return 3;

    const pendingLike = compStatus === "pending" ||
        (compStatus === "waiting" && pdcCanonicalCompetition(data.registeredCompetition) === "Math Olympiad");
    if (pendingLike) return 4;

    if (compStatus === "verified" || compStatus === "accepted") return 5;

    return 2;
}

        function updatePdcFlowStep(stepNumber) {
            // Defensive: if we ever get handed something that isn't 1-5
            // (bad data, a thrown error upstream, etc.) fall back to step 1
            // instead of letting classList.toggle() strip .active from
            // every box at once.
            const valid = [1, 2, 3, 4, 5].includes(stepNumber) ? stepNumber : 1;
            for (let i = 1; i <= 5; i++) {
                const el = document.getElementById("flowStep" + i);
                if (!el) continue;
                el.classList.remove("active", "done");
                if (i < valid) el.classList.add("done");       // completed — green
                else if (i === valid) el.classList.add("active"); // current — blue + pin
                // steps after the active one are left with no extra class (grey)
            }
        }

        // ============================================================
        //  COMPETITION CARD HOVER
        //  The cards are built with inline styles, and an inline style
        //  cannot express :hover — so the hover effect needs a real
        //  stylesheet rule. Injected once, on first render.
        //
        //  scale(1.3) makes a card overlap its neighbours, so the hovered
        //  one is lifted with z-index; without that it would be drawn
        //  underneath the cards to its right and below it.
        // ============================================================
        function pdcEnsureCompCardStyles() {
            if (document.getElementById("pdc-comp-card-styles")) return;
            const style = document.createElement("style");
            style.id = "pdc-comp-card-styles";
            style.textContent = [
                ".pdc-comp-card-btn {",
                "    position: relative;",
                "    z-index: 1;",
                "    transform: scale(1);",
                "    transition: transform 0.2s ease;",
                "}",
                ".pdc-comp-card-btn:hover,",
                ".pdc-comp-card-btn:focus-visible {",
                "    transform: scale(1.3);",
                "    z-index: 5;",
                "}",
                ".pdc-comp-card-btn:focus-visible {",
                "    outline: 3px solid #4D81E3;",
                "    outline-offset: 3px;",
                "}",
                "@media (prefers-reduced-motion: reduce) {",
                "    .pdc-comp-card-btn { transition: none; }",
                "}"
            ].join("\n");
            document.head.appendChild(style);
        }

        // ============================================================
        //  ⑨ onAuthStateChanged — session guard + email verification
        // ============================================================
        auth.onAuthStateChanged(async user => {
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

            // ── FIX: Email-verification gate must NOT fire on login/signup pages ──
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

            // The security rules test request.auth.token.email_verified —
            // a claim baked into the ID TOKEN, which Firebase caches for an
            // hour. Someone who clicks the verification link in another tab
            // still carries a token saying false, so their own document
            // comes back "Missing or insufficient permissions" even though
            // the account is verified. Forcing a refresh makes the claim
            // current before anything is read.
            try {
                await user.getIdToken(true);
            } catch (tokenErr) {
                window.pdcDebugLog("Token refresh failed:", tokenErr.message);
            }
            const emailDisplay = document.getElementById("userEmail") || document.getElementById("authEmailStatus");
            if (emailDisplay) emailDisplay.textContent = user.email;

            // Real-time Firestore listener
            db.collection("users").doc(user.uid).onSnapshot(doc => {
                if (!doc.exists) { window.pdcDebugLog("User doc missing in Firestore."); return; }
                const data = doc.data();
                window.pdcDebugLog("Firestore snapshot:", data);

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

                // Dashboard "Profil" card: show the "belum melengkapi profil"
                // prompt until the profile is complete & locked, then swap
                // to the filled-in field card.
                const profileEmptyCard  = document.getElementById("profileEmptyCard");
                const profileFilledCard = document.getElementById("profileFilledCard");
                if (profileEmptyCard && profileFilledCard) {
                    profileEmptyCard.classList.toggle("pdc-hidden", isLocked);
                    profileFilledCard.classList.toggle("pdc-hidden", !isLocked);
                }

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

                    // A browser cannot put a file back into a file input — that
                    // is a security rule, not a bug we can fix. So a saved
                    // upload always looks missing when you reopen a draft.
                    // Show what is actually stored underneath each box, so it
                    // is obvious the file is safe and does not need re-picking.
                    const uploadInputs = Array.from(document.querySelectorAll("input[type='file']"));
                    [[uploadInputs[0], data.studentCardURL, "Student card"],
                     [uploadInputs[1], data.idCardURL,      "ID photo 3x4"]]
                    .forEach(function (pair) {
                        const input = pair[0], url = pair[1], label = pair[2];
                        if (!input || !url) return;

                        const holder = input.closest(".forminator-field") || input.parentElement;
                        if (!holder || holder.querySelector(".pdc-saved-upload")) return;  // already shown

                        const note = document.createElement("div");
                        note.className = "pdc-saved-upload";
                        note.style.cssText = "display:flex;align-items:center;gap:10px;margin-top:8px;" +
                            "padding:8px 10px;border:1px solid #cfe3d4;border-radius:8px;" +
                            "background:#f1f8f3;font-family:'Nunito',Arial,sans-serif;font-size:13px;color:#2E7D32;";
                        note.innerHTML =
                            '<img src="' + url + '" alt="" style="width:34px;height:34px;object-fit:cover;' +
                            'border-radius:5px;flex:none;background:#fff;">' +
                            '<span style="flex:1;">' + label + ' sudah tersimpan. ' +
                            'Tidak perlu meng-upload kembali. Hanya upload ketika ingin mengganti file saja.</span>' +
                            '<a href="' + url + '" target="_blank" rel="noopener" ' +
                            'style="color:#1a1a7a;font-weight:700;text-decoration:underline;">Lihat</a>';
                        holder.appendChild(note);
                    });
                }

                const accountStatus = (data.status || "incomplete").toLowerCase();
				const isVerified = accountStatus === "verified" || accountStatus === "accepted";

const editBtn = document.getElementById("editProfileBtn");
if (editBtn) editBtn.classList.toggle("pdc-hidden", isVerified);
				
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
    const formWrapper = document.getElementById("profileFormWrapper");
    const isVerified  = accountStatus === "verified" || accountStatus === "accepted";

    if (formWrapper && isVerified && !window.pdcIsSubmitting) {
        showProfileLockedNotice(formWrapper);
    } else if (formWrapper && isLocked && !window.pdcIsSubmitting) {
        renderLockedProfileCard(data, formWrapper, false);
    }
}

                // Toggle the editable form vs. the "profile is locked" card.
                // Gated on the elements existing (not the URL) so it can't
                // silently no-op if the page's path doesn't literally
                // contain "/profile".
                const formCard   = document.getElementById("profileFormCard");
                const lockedCard = document.getElementById("profileLockedCard");
                if (formCard && lockedCard) {
                    formCard.classList.toggle("pdc-hidden", isLocked);
                    lockedCard.classList.toggle("pdc-hidden", !isLocked);
                }

                // ── Dashboard page ────────────────────────────────
                const widgetMount = document.getElementById("widgetMainText") || document.getElementById("dynamicWorkspaceMount");
                const compStatus  = (data.competitionStatus || "none").toLowerCase();

                if (document.getElementById("flowStep1")) {
                    try {
                        const flowStep = computePdcFlowStep(data, isLocked, accountStatus, compStatus);
                        window.pdcDebugLog("Alur Pendaftaran → step", flowStep, {
                            isLocked, accountStatus, compStatus,
                            registeredCompetition: data.registeredCompetition || null
                        });
                        updatePdcFlowStep(flowStep);
                    } catch (e) {
                        window.pdcDebugLog("Alur Pendaftaran update failed:", e.message);
                        updatePdcFlowStep(1); // fail safe — still show step 1 instead of nothing
                    }
                }

                if (widgetMount && (path.includes("/dashboard") || path === "/")) {

                    if (!isLocked) {
                        // ── FIX: Show locked data card in dashboard too when applicable ──
                        widgetMount.innerHTML = `<div style="text-align:center; font-size:24px; font-weight:800; color:#323289; line-height:34px; width:100%;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lock-icon lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>`;

                    } else if (accountStatus === "waiting" || accountStatus === "draft" ||
                               (isLocked && accountStatus !== "verified" && accountStatus !== "accepted")) {
                        // ── NEW: Show submitted data card while profile is under review ──
                        renderLockedProfileCard(data, widgetMount, true);

                    } else if (accountStatus === "verified" || accountStatus === "accepted") {
                        if (!data.registeredCompetition || compStatus === "none") {
                            const btnStyle = "padding:20px 16px; border:none; border-radius:16px; font-weight:800; font-size:14px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;";
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
                            let cards = `<div style="width:100%;"><p style="color:#323289; font-size:22px; font-weight:800; margin-bottom:20px; text-align:center;">Pilih kompetisi yang ingin kamu daftar!</p><div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:16px; width:100%;">`;
                            Object.keys(FORM_LINKS).forEach(id => {
                                const t = compThemes[id] || { bg:"#E0E0E0", fg:"#424242", img:"" };
                                cards += `<button class="pdc-comp-card-btn" data-id="${id}" style="${btnStyle} background-color: transparent; font-size: 0px; color:${t.fg};">${t.img ? `<img src="${t.img}" style="${imgStyle}">` : ""}<span>${id}</span></button>`;
                            });
                            cards += `</div></div>`;
                            pdcEnsureCompCardStyles();
                            widgetMount.innerHTML = cards;

                            widgetMount.querySelectorAll(".pdc-comp-card-btn").forEach(btn => {
    btn.addEventListener("click", async function () {
        const compId = this.getAttribute("data-id");
        const confirmed = await pdcConfirm(compId);
        if (!confirmed) return;

        widgetMount.style.opacity = "0.4";
        db.collection("users").doc(user.uid).update({
            registeredCompetition: compId,
            competitionStatus    : "form_pending"   // was "pending"
        }).then(() => {
            window.open(FORM_LINKS[compId], "_blank");
            widgetMount.style.opacity = "1";
        }).catch(err => {
            widgetMount.style.opacity = "1";
            alert("Error: " + err.message);
        });
    });
});
							
							} else if (compStatus === "form_pending") {
    const formregislomba = pdcFormLink(data.registeredCompetition);
    widgetMount.innerHTML = `
        <div style="text-align:center; display:flex; flex-direction:column; align-items:center; width:100%; gap:12px;">
            <h1 style="font-size:38px; font-weight:700; color:#323289; margin:8px 0 20px 0;">${pdcCompetitionName(data.registeredCompetition)}</h1>
            <div style="background:#E67E22; color:#fff; font-size:15px; font-weight:700; padding:12px 36px; border-radius:12px;">Silakan lengkapi formulir pendaftaran di bawah ini.</div>
            <a style="background:#4D81E3; color:#fff; font-size:15px; font-weight:700; padding:12px 36px; border-radius:12px; text-decoration:none; display:inline-block;" href="${formregislomba}" target="_blank">Buka Formulir Pendaftaran ${pdcCompetitionName(data.registeredCompetition)}</a>
        </div>`;

                        } else if (compStatus === "pending" || compStatus === "waiting" && pdcCanonicalCompetition(data.registeredCompetition) === "Math Olympiad") { const formregislomba = pdcFormLink(data.registeredCompetition);
                            widgetMount.innerHTML = `
                                <div style="text-align:center; display:flex; flex-direction:column; align-items:center; width:100%; gap:12px;">
                                    <h1 style="font-size:38px; font-weight:800; color:#323289; margin:8px 0 20px 0;">${pdcCompetitionName(data.registeredCompetition)}</h1>
                                    <div style="background:#AEB6BF; color:#fff; font-size:15px; font-weight:700; padding:12px 36px; border-radius:12px;">Kami akan memverifikasi formulir Anda. Mohon tunggu.</div>
                                    <div style="background:#858c94; color:#fff; font-size:15px; font-weight:700; padding:12px 36px; border-radius:12px;">Formulirmu sedang kami verifikasi. Proses ini akan memakan waktu 1 hingga 2 hari kerja. Mohon bersabar. Jika ada kendala, silakan hubungi +62 81287870627. (Kak Lio)</div>
                                </div>`;

                        } else if (compStatus === "verified" || compStatus === "accepted") {
                            const waLink = pdcWhatsappLink(data.registeredCompetition);
                            widgetMount.innerHTML = `
                                <div style="text-align:center; display:flex; flex-direction:column; align-items:center; width:100%; gap:12px;">
                                    <h1 style="font-size:38px; font-weight:800; color:#323289; margin:8px 0 16px 0;">${pdcCompetitionName(data.registeredCompetition)}</h1>
                                    <div style="background:#4D81E3; color:#fff; font-size:15px; font-weight:700; padding:10px 45px; border-radius:12px; margin-bottom:16px;">Status: Terdaftar!</div>
                                    <a href="${waLink}" target="_blank" style="background:#2ECC71 !important; color:#fff !important; font-size:16px !important; font-weight:800 !important; padding:14px 32px !important; border-radius:12px !important; text-decoration:none !important; display:inline-flex !important; align-items:center !important;">Klik di sini untuk bergabung ke grup WhatsApp!</a>
                                </div>`;
                        }

                    } else {
                        widgetMount.innerHTML = `<div style="text-align:center;"><h3>Profile Under Review</h3><p>Please wait for verification.</p></div>`;
                    }
                }
            }, function (snapErr) {
                // onSnapshot used to have no error handler, so a rules
                // rejection failed silently and the page just sat blank.
                window.pdcDebugLog("Firestore listener error:", snapErr.code, snapErr.message);
                if (snapErr.code === "permission-denied") {
                    window.pdcDebugLog(
                        "permission-denied reading your own user document. " +
                        "Usually a stale ID token (email verified in another tab) — " +
                        "signing out and back in refreshes it.");
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
            return map[code] || "Check your email for email verification link! (might be in spam btw)";
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
                // ── FIX: Raise flag BEFORE creating the account so
                //    onAuthStateChanged in Part 1 stands down completely ──
                window.__pdcRegistering = true;

                const cred = await auth.createUserWithEmailAndPassword(email, password);
                const user = cred.user;

                // ── ORDER MATTERS HERE ──
                // The Firestore document used to be written AFTER
                // sendEmailVerification(), inside the same try. Firebase
                // rate-limits verification emails, so on a busy signup day
                // that call throws — and it took the document write down
                // with it. The result was an Auth account with no Firestore
                // document: the person can log in, but the dashboard finds
                // nothing and renders a blank page ("User doc missing in
                // Firestore"). 459 accounts ended up in that state.
                //
                // The document is now written first. A failed email is
                // recoverable — there is a resend button — but a missing
                // document leaves someone permanently stuck.
                await db.collection("users").doc(user.uid).set({
                    email           : email,
                    role            : "participant",
                    profileComplete : false,
                    dataLocked      : false,
                    status          : "unverified",
                    createdAt       : firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                // Its own try/catch, so it cannot take the signup down.
                let emailSent = true;
                try {
                    await user.sendEmailVerification({ url: VERIFY_CONTINUE_URL });
                } catch (mailErr) {
                    emailSent = false;
                    console.error("[PDC] Verification email failed:", mailErr);
                }

                await auth.signOut();
                window.__pdcRegistering = false;
                if (emailSent) {
                    showSuccess(email);
                } else {
                    // The account exists and is usable; only the email failed.
                    if (formFields) formFields.classList.add("pdc-hidden");
                    showMsg("Akun berhasil dibuat, tetapi email verifikasi gagal terkirim. " +
                            "Silakan login dan gunakan tombol kirim ulang verifikasi.", "warning");
                }

            } catch (err) {
                window.__pdcRegistering = false;
                console.error(err);
                showMsg(friendlyError(err.code), "error");
                setLoading(false);
            }
        });

        // ============================================================
        //  GOOGLE SIGN-UP
        //  FIX: Google accounts are already verified by Google so we
        //  set status:"pending" instead of "unverified".
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

                // This used to run only `if (isNewUser)`. A returning Google
                // user whose document had never been created — because an
                // earlier attempt failed — could therefore sign in forever
                // and never get one. Check for the document itself instead
                // of trusting isNewUser.
                const ref  = db.collection("users").doc(user.uid);
                const snap = await ref.get();
                if (!snap.exists) {
                    // Google guarantees the email is verified, so the account
                    // starts at "draft": past email verification, profile not
                    // yet filled in.
                    await ref.set({
                        email           : user.email,
                        role            : "participant",
                        profileComplete : false,
                        dataLocked      : false,
                        status          : "draft",
                        createdAt       : firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    window.pdcDebugLog("Created missing Firestore doc for Google user:", user.email);
                }
                // Existing document — never overwrite their status.

                showMsg("Google sign-up successful! Redirecting…", "success");
                window.location.href = "https://pdc.praditadirgantara.sch.id/dashboard";

            } catch (err) {
                console.error(err);
                if (err.code !== "auth/popup-closed-by-user") {
                    showMsg(friendlyError(err.code), "error");
                } else {
                    showMsg("Google sign-up was cancelled.", "info");
                }
                setLoading(false);
            }
        });
    });
})();
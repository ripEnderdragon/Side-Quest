/* =========================================================================
   1. GLOBAL LIVE SCREEN SYSTEM DIAGNOSTIC OVERRIDES & STATE FLAGS
   ========================================================================= */
const debugLogElement = document.getElementById("debugLog");
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    if (debugLogElement) {
        debugLogElement.textContent += args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : a).join(" ") + "\n";
        debugLogElement.scrollTop = debugLogElement.scrollHeight;
    }
};

console.error = function(...args) {
    originalConsoleError.apply(console, args);
    if (debugLogElement) {
        debugLogElement.textContent += "ERROR: " + args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : a).join(" ") + "\n";
        debugLogElement.scrollTop = debugLogElement.scrollHeight;
    }
};

window.pdcIsSubmitting = false;
window.pdcSubmitMode = "";

// External Links Configuration Lookup Vectors
const FORM_LINKS = {
    "Math Olympiad": "https://forms.gle/your-custom-math-form-link",
    "Science Olympiad": "https://forms.gle/your-custom-science-form-link",
    "Scientific Writing": "https://forms.gle/your-custom-writing-form-link",
    "Logic Olympiad": "https://forms.gle/your-custom-logic-form-link",
    "Solo Vocal": "https://forms.gle/your-custom-vocal-form-link",
    "Speech": "pdc.praditadirgantara.sch.id/register-speech",
    "Basket": "https://forms.gle/your-custom-basket-form-link"
};

const WHATSAPP_LINKS = {
    "Math Olympiad": "https://chat.whatsapp.com/example-math-group",
    "Science Olympiad": "https://chat.whatsapp.com/example-science-group",
    "Scientific Writing": "https://chat.whatsapp.com/example-writing-group",
    "Logic Olympiad": "https://chat.whatsapp.com/example-logic-group",
    "Solo Vocal": "https://chat.whatsapp.com/example-vocal-group",
    "Speech": "https://chat.whatsapp.com/example-speech-group",
    "Basket": "https://chat.whatsapp.com/example-basket-group"
};

/* =========================================================================
   2. ISOLATED RUNTIME SCOPING & ENGINE BINDINGS
   ========================================================================= */
{
    const initPdcApp = () => {
        if (typeof firebase === "undefined" || typeof firebase.app === "undefined") {
            console.warn("[PDC Debug] Firebase core elements not yet bound to window instance. Retrying...");
            setTimeout(initPdcApp, 500);
            return;
        }
        if (typeof firebase.auth === "undefined" || typeof firebase.firestore === "undefined") {
            console.warn("[PDC Debug] Firebase Auth/Firestore not yet available. Retrying...");
            setTimeout(initPdcApp, 500);
            return;
        }

        const firebaseConfig = {
            apiKey: "AIzaSyAGkfAghVtw0SKgvYVuUxmjDHXoyR8kfug",
            authDomain: "pdc-2026.firebaseapp.com",
            projectId: "pdc-2026",
            storageBucket: "pdc-2026.firebasestorage.app",
            messagingSenderId: "768259094990",
            appId: "1:768259094990:web:f4e6c6bee85d8f2382939f",
            measurementId: "G-P4GX80LWCT"
        };

        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log("[PDC Debug] Firebase initialized.");
        }

        const auth = firebase.auth();
        const db = firebase.firestore();
        
        let storage = null;
        try {
            if (typeof firebase.storage === "function") {
                storage = firebase.storage();
            } else if (firebase.app().storage) {
                storage = firebase.app().storage();
            }
        } catch(e) {
            console.warn("[PDC Debug] Storage module invocation bypass applied:", e.message);
        }

        // Global UI Logout Bindings Hooks
        document.getElementById("actionLogout")?.addEventListener("click", () => {
            auth.signOut().then(() => { window.location.href = "/login"; });
        });
        document.getElementById("logoutBtn")?.addEventListener("click", () => {
            auth.signOut().then(() => { window.location.href = "/login"; });
        });

        // ==========================================
        // PROXY BUTTON INJECTION ENGINE (MULTI-FORM AWARE)
        // ==========================================
        const injectCustomButtons = () => {
            const submitBtns = document.querySelectorAll(".forminator-button-submit");
            
            submitBtns.forEach(originalBtn => {
                if (originalBtn.dataset.pdcIntercepted || originalBtn.style.display === "none") return;
                
                const formEl = originalBtn.closest("form");
                if (!formEl) return;

                // Detect if this is your specific submission form 10492
                const isSubmissionForm = formEl.id && formEl.id.includes("10492");

                if (isSubmissionForm) {
                    /* -----------------------------------------------------------------
                       SCENARIO A: COMPETITION FILE SUBMISSION FORM (DIRECT UPLOAD)
                       ----------------------------------------------------------------- */
                    originalBtn.dataset.pdcIntercepted = "true";
                    
                    const cloneBtn = originalBtn.cloneNode(true);
                    cloneBtn.id = "pdc-submission-submit-btn";
                    cloneBtn.type = "button";
                    cloneBtn.textContent = "Upload & Submit Works";
                    
                    originalBtn.style.display = "none";
                    originalBtn.parentNode.insertBefore(cloneBtn, originalBtn);

                    cloneBtn.addEventListener("click", async (e) => {
                        e.preventDefault();
                        await handleSubmissionUploadPipeline(cloneBtn, originalBtn, formEl);
                    });

                } else if (!document.getElementById("pdc-custom-btn-group")) {
                    /* -----------------------------------------------------------------
                       SCENARIO B: MAIN PROFILE REGISTRATION FORM (DRAFT / LOCK)
                       ----------------------------------------------------------------- */
                    originalBtn.dataset.pdcIntercepted = "true";
                    
                    const btnGroup = document.createElement("div");
                    btnGroup.id = "pdc-custom-btn-group";
                    btnGroup.style.display = "inline-flex";
                    btnGroup.style.gap = "10px";
                    btnGroup.style.width = "100%";
                    btnGroup.style.marginTop = "15px";

                    const saveBtn = document.createElement("button");
                    saveBtn.id = "pdc-save-draft-btn";
                    saveBtn.type = "button"; 
                    saveBtn.textContent = "Save Draft (Editable)";
                    saveBtn.className = originalBtn.className; 
                    saveBtn.style.backgroundColor = "#E67E22"; 

                    const finalBtn = document.createElement("button");
                    finalBtn.id = "pdc-final-submit-btn";
                    finalBtn.type = "button";
                    finalBtn.textContent = "Final Submit (Lock Data)";
                    finalBtn.className = originalBtn.className;

                    btnGroup.appendChild(saveBtn);
                    btnGroup.appendChild(finalBtn);

                    originalBtn.style.display = "none";
                    originalBtn.parentNode.insertBefore(btnGroup, originalBtn);

                    saveBtn.onclick = async (e) => {
                        e.preventDefault();
                        await handleFormSyncPipeline(false, saveBtn, finalBtn, originalBtn);
                    };

                    finalBtn.onclick = async (e) => {
                        e.preventDefault();
                        if (confirm("⚠️ Are you absolutely sure the data is correct? \n\nOnce submitted, your profile will be LOCKED and you will not be able to edit it anymore.")) {
                            await handleFormSyncPipeline(true, finalBtn, saveBtn, originalBtn);
                        }
                    };
                }
            });
        };
        setInterval(injectCustomButtons, 1000);

        // ==========================================
        // PIPELINE A: FILE SUBMISSION DIRECT UPLOAD (FORM 10492)
        // ==========================================
        async function handleSubmissionUploadPipeline(clickedBtn, originalBtn, formEl) {
            if (!formEl.checkValidity()) {
                formEl.reportValidity();
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                alert("❌ Session Timeout: Active session not detected. Please refresh and log in again.");
                return;
            }

            const originalText = clickedBtn.textContent;
            clickedBtn.textContent = "Uploading Submissions...";
            clickedBtn.disabled = true;

            try {
                if (!storage) throw new Error("Firebase Storage module not available.");

                const payload = {
                    submissionTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                };

                let filesUploadedCount = 0;

                // Loop through all potential 6 upload inputs dynamically
                for (let i = 1; i <= 6; i++) {
                    const fileInput = formEl.querySelector(`input[type='file'][name^='upload-${i}']`) || formEl.querySelector(`#upload-${i}`);
                    const file = fileInput?.files?.[0];

                    if (file) {
                        console.log(`[PDC Debug] Processing submission file slot upload-${i}: ${file.name}`);
                        const ref = storage.ref(`competitionSubmissions/${user.uid}/slot-${i}_${Date.now()}_${file.name}`);
                        const snap = await ref.put(file);
                        const downloadURL = await snap.ref.getDownloadURL();
                        
                        // Map them inside your Firestore document payload
                        payload[`submissionFileUrl_${i}`] = downloadURL;
                        filesUploadedCount++;
                    }
                }

                if (filesUploadedCount === 0) {
                    alert("⚠️ Submission Denied: You must upload at least one file (PDF or Image) before submitting.");
                    clickedBtn.textContent = originalText;
                    clickedBtn.disabled = false;
                    return;
                }

                // Handle checkbox-1 tracking state safely
                const checkboxEl = formEl.querySelector(`input[type='checkbox'][name^='checkbox-1']`) || formEl.querySelector(`#checkbox-1`);
                if (checkboxEl) {
                    payload["submissionCheckboxAgreement"] = checkboxEl.checked;
                }

                // Push values to user document inside Firestore
                await db.collection("users").doc(user.uid).set(payload, { merge: true });
                console.log(`[PDC Debug] Successfully uploaded ${filesUploadedCount} file(s) and logged metadata to Firestore.`);

                // Release tracking control down to Forminator native modules
                originalBtn.click();

            } catch (error) {
                console.error("[PDC Debug] Submission upload processing failure:", error);
                alert("❌ Server Upload Error: Unable to process your files. Please check your internet connection.");
                
                clickedBtn.textContent = originalText;
                clickedBtn.disabled = false;
            }
        }

        // ==========================================
        // PIPELINE B: MAIN PROFILE FORM INTERCEPTOR (DRAFT / LOCK)
        // ==========================================
        async function handleFormSyncPipeline(isFinalSubmit, clickedBtn, otherBtn, originalBtn) {
            const formEl = originalBtn.closest("form");
            if (formEl && !formEl.checkValidity()) {
                formEl.reportValidity();
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                alert("❌ Authentication error: Active session not detected. Please refresh the page.");
                return;
            }

            const originalText = clickedBtn.textContent;
            clickedBtn.textContent = isFinalSubmit ? "Locking Profile..." : "Saving to Database...";
            clickedBtn.disabled = true;
            otherBtn.disabled = true;

            window.pdcSubmitMode = isFinalSubmit ? "final" : "draft";
            window.pdcIsSubmitting = true;

            try {
                const nameEl   = document.querySelector("input[name^='name-']") || document.querySelector(".forminator-field-name input") || document.getElementById("name-1");
                const phoneEl  = document.querySelector("input[name^='phone-']") || document.querySelector(".forminator-field-phone input") || document.getElementById("phone-1");
                const nisnEl   = document.querySelector("input[name^='number-']") || document.querySelector(".forminator-field-number input") || document.getElementById("number-1");
                const schoolEl = document.querySelector("input[name^='text-']") || document.querySelector(".forminator-field-text input") || document.getElementById("text-1");
                const gradeEl  = document.querySelector("select[name^='select-']") || document.querySelector(".forminator-field-select select") || document.getElementById("select-1");

                const fullNameValue = nameEl ? nameEl.value.trim() : "";
                const phoneValue    = phoneEl ? phoneEl.value.trim() : "";
                const nisnValue     = nisnEl ? nisnEl.value.trim() : "";
                const schoolValue   = schoolEl ? schoolEl.value.trim() : "";
                const gradeValue    = gradeEl ? gradeEl.value : "";

                const studentFileInput = document.querySelector("input[type='file'][name^='upload-1']") || document.getElementById("upload-1");
                const studentFile = studentFileInput?.files?.[0];

                const idFileInput = document.querySelector("input[type='file'][name^='upload-2']") || document.getElementById("upload-2");
                const idFile = idFileInput?.files?.[0];

                const uploadFile = async (file, path) => {
                    if (!storage || !file) return "";
                    try {
                        const ref = storage.ref(`${path}/${Date.now()}_${file.name}`);
                        const snap = await ref.put(file);
                        return await snap.ref.getDownloadURL();
                    } catch (err) {
                        console.error(`[PDC Debug] Upload skipped/failed for ${path}:`, err);
                        return "";
                    }
                };

                const studentCardURL = await uploadFile(studentFile, "studentCards");
                const idCardURL      = await uploadFile(idFile, "idCards");

                const payload = {
                    email: user.email,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (isFinalSubmit) {
                    payload.profileComplete = true; 
                    payload.dataLocked = true; 
                    payload.status = "waiting"; 
                } else {
                    payload.profileComplete = false;
                    payload.dataLocked = false;
                    payload.status = "draft"; 
                }

                if (fullNameValue) payload.fullName = fullNameValue;
                if (phoneValue) payload.phoneNumber = phoneValue;
                if (nisnValue) payload.nisn = nisnValue;
                if (schoolValue) payload.school = schoolValue;
                if (gradeValue) payload.grade = gradeValue;
                
                if (studentCardURL) payload.studentCardURL = studentCardURL;
                if (idCardURL)      payload.idCardURL = idCardURL;

                await db.collection("users").doc(user.uid).set(payload, { merge: true });
                console.log("[PDC Debug] Firestore securely updated.");

                originalBtn.click();

            } catch (error) {
                console.error("[PDC Debug] Processing workflow failed:", error);
                alert("❌ Connection Error: Unable to save to database. Please check your network connection.");
                
                clickedBtn.textContent = originalText;
                clickedBtn.disabled = false;
                otherBtn.disabled = false;
                window.pdcIsSubmitting = false;
            }
        }

        // ==========================================
        // DATA POPULATION & REALTIME APP CONTROLLER STATE MATRIX
        // ==========================================
        auth.onAuthStateChanged((user) => {
            if (user) {
                const userEmailSpan = document.getElementById("userEmail") || document.getElementById("authEmailStatus");
                if (userEmailSpan) userEmailSpan.textContent = user.email;

                db.collection("users").doc(user.uid).onSnapshot((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        
                        const fields = [
                            { el: "displayFullName", val: data.fullName },
                            { el: "metaName", val: data.fullName },
                            { el: "displaySchool", val: data.school ? `School: ${data.school}` : "" },
                            { el: "metaSchool", val: data.school ? `School: ${data.school}` : "" },
                            { el: "displayNisn", val: data.nisn ? `NISN: ${data.nisn}` : "" },
                            { el: "metaNisn", val: data.nisn ? `NISN: ${data.nisn}` : "" },
                            { el: "displayPhone", val: data.phoneNumber ? `Phone: ${data.phoneNumber}` : "" },
                            { el: "metaPhone", val: data.phoneNumber ? `Phone: ${data.phoneNumber}` : "" },
                            { el: "displayGrade", val: data.grade ? `Grade: ${data.grade}` : "" },
                            { el: "metaGrade", val: data.grade ? `Grade: ${data.grade}` : "" }
                        ];
                        fields.forEach(f => {
                            const element = document.getElementById(f.el);
                            if (element && f.val) element.textContent = f.val;
                        });

                        const imageContainer = document.getElementById("imageDisplayContainer");
                        const uiStudentCard = document.getElementById("uiStudentCard");
                        const uiIdCard = document.getElementById("uiIdCard");
                        
                        let hasImages = false;
                        if (data.studentCardURL && uiStudentCard) { uiStudentCard.src = data.studentCardURL; hasImages = true; }
                        if (data.idCardURL && uiIdCard) { uiIdCard.src = data.idCardURL; hasImages = true; }
                        if (imageContainer) imageContainer.style.display = hasImages ? "flex" : "none";

                        const isLocked = data.dataLocked === true || data.profileComplete === true;
                        const accountStatus = data.status ? data.status.toLowerCase() : "not verified";
                        const compStatus = data.competitionStatus ? data.competitionStatus.toLowerCase() : "none";

                        const displayStatus = document.getElementById("displayStatus") || document.getElementById("metaStatusPill");
                        const statusBadgeBg = document.getElementById("statusBadgeBg");
                        const widgetMainText = document.getElementById("widgetMainText") || document.getElementById("dynamicWorkspaceMount");

                        if (displayStatus) {
                            if (!isLocked) {
                                displayStatus.textContent = accountStatus === "draft" ? "Draft Saved" : "Incomplete";
                                if (statusBadgeBg) statusBadgeBg.style.backgroundColor = accountStatus === "draft" ? "#E67E22" : "#797980";
                                displayStatus.style.backgroundColor = accountStatus === "draft" ? "#E67E22" : "#797980";
                            } else if (accountStatus === "verified" || accountStatus === "accepted") {
                                displayStatus.textContent = "Verified";
                                if (statusBadgeBg) statusBadgeBg.style.backgroundColor = "#2E7D32";
                                displayStatus.style.backgroundColor = "#2E7D32";
                            } else {
                                displayStatus.textContent = "Waiting";
                                if (statusBadgeBg) statusBadgeBg.style.backgroundColor = "#E67E22";
                                displayStatus.style.backgroundColor = "#E67E22";
                            }
                        }

                        /* PROFILE LAYOUT INTERFACE VIEW RENDERER */
                        if (isLocked && !window.pdcIsSubmitting) {
                            const formWrapper = document.querySelector(".profile-form-card") || document.getElementById("profileFormWrapper");
                            if (formWrapper && window.location.pathname.includes('/profile')) {
                                formWrapper.innerHTML = `
                                    <div style="width:100%; display:flex; flex-direction:column; gap:20px; padding: 10px; box-sizing: border-box;">
                                        <div style="border-bottom: 2px solid #3F3FA4; padding-bottom: 10px;">
                                            <h2 style="margin:0; color:#3F3FA4; font-size:24px;">Profile Data 🔒</h2>
                                            <p style="margin:5px 0 0 0; color:#6b7280; font-size:14px;">Your profile registration metrics are frozen during verification pipelines review.</p>
                                        </div>
                                        
                                        <div style="display:grid; grid-template-columns: 1fr 2fr; gap:12px; background:#f8fafc; padding:20px; border-radius:12px; border: 1px solid #e2e8f0;">
                                            <strong style="color:#475569;">Full Name:</strong> <span style="font-weight:700; color:#1e293b;">${data.fullName || '-'}</span>
                                            <strong style="color:#475569;">Active Phone:</strong> <span style="font-weight:700; color:#1e293b;">${data.phoneNumber || '-'}</span>
                                            <strong style="color:#475569;">NISN:</strong> <span style="font-weight:700; color:#1e293b;">${data.nisn || '-'}</span>
                                            <strong style="color:#475569;">School Name:</strong> <span style="font-weight:700; color:#1e293b;">${data.school || '-'}</span>
                                            <strong style="color:#475569;">Grade:</strong> <span style="font-weight:700; color:#1e293b;">${data.grade || '-'}</span>
                                        </div>

                                        <div style="display:flex; gap:20px; margin-top:10px; flex-wrap: wrap;">
                                            ${data.studentCardURL ? `<div style="flex:1; min-width:240px;"><strong style="color:#475569;">Student Card:</strong><br><img src="${data.studentCardURL}" style="max-width:100%; border-radius:10px; margin-top:8px; border: 1px solid #e2e8f0;"></div>` : ''}
                                            ${data.idCardURL ? `<div style="flex:1; min-width:240px;"><strong style="color:#475569;">ID Card:</strong><br><img src="${data.idCardURL}" style="max-width:100%; border-radius:10px; margin-top:8px; border: 1px solid #e2e8f0;"></div>` : ''}
                                        </div>
                                    </div>
                                `;
                            }
                        } else if (!isLocked && !window.pdcIsSubmitting) {
                            const nameInput  = document.querySelector("input[name^='name-']") || document.querySelector(".forminator-field-name input") || document.getElementById("name-1");
                            const phoneInput = document.querySelector("input[name^='phone-']") || document.querySelector(".forminator-field-phone input") || document.getElementById("phone-1");
                            const nisnInput  = document.querySelector("input[name^='number-']") || document.querySelector(".forminator-field-number input") || document.getElementById("number-1");
                            const schoolInput= document.querySelector("input[name^='text-']") || document.querySelector(".forminator-field-text input") || document.getElementById("text-1");
                            const gradeSelect= document.querySelector("select[name^='select-']") || document.querySelector(".forminator-field-select select") || document.getElementById("select-1");

                            if (nameInput && !nameInput.value) nameInput.value = data.fullName || "";
                            if (phoneInput && !phoneInput.value) phoneInput.value = data.phoneNumber || "";
                            if (nisnInput && !nisnInput.value) nisnInput.value = data.nisn || "";
                            if (schoolInput && !schoolInput.value) schoolInput.value = data.school || "";
                            if (gradeSelect && !gradeSelect.value) gradeSelect.value = data.grade || "";
                        }

                        /* MAIN DASHBOARD APPLICATION INTERFACES WRAPPERS */
                        if (window.location.pathname.includes('/dashboard') || window.location.pathname === "/" || document.getElementById("dynamicWorkspaceMount")) {
                            if (!isLocked) {
                                if (widgetMainText) widgetMainText.innerHTML = `<div style="text-align:center; font-size:24px; font-weight:800; color:#323289; line-height:34px; width:100%;">Please complete and lock your profile to register a competition!</div>`;
                            } 
                            else if (isLocked && (accountStatus === "not verified" || accountStatus === "waiting" || accountStatus === "pending")) {
                                if (widgetMainText) widgetMainText.innerHTML = `
                                    <div style="display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center; width:100%;">
                                        <span style="font-size:28px; font-weight:800; color:#323289;">Wait for your profile to get verified!</span>
                                        <p style="font-size:16px; font-weight:700; color:#6b7280; margin:0; max-width:480px;">Our administration accounts are validating your submission documents now.</p>
                                    </div>`;
                            } 
                            else if (accountStatus === "verified" || accountStatus === "accepted") {
                                
                                if (!data.registeredCompetition || compStatus === "none") {
                                    if (widgetMainText) {
                                        const btnStyle = "padding:20px 16px; border:none; border-radius:16px; font-weight:800; font-size:14px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); transition: transform 0.2s;";
                                        const imgStyle = "width:50px; height:50px; object-fit:contain; border-radius:8px;";

                                        widgetMainText.innerHTML = `
                                            <div style="width: 100%;">
                                                <p style="color:#323289; font-size: 22px; font-weight: 800; margin-bottom: 20px; text-align: center;">Please select a competition to register:</p>
                                                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; width:100%;">
                                                    <button class="pdc-comp-card-btn" data-id="Math Olympiad" style="${btnStyle} background:#FADBD8; color:#C0392B;">
                                                        <img src="https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/math%20olympiad.avif" style="${imgStyle}">
                                                        <span>Math Olympiad</span>
                                                    </button>
                                                    <button class="pdc-comp-card-btn" data-id="Science Olympiad" style="${btnStyle} background:#D4EFDF; color:#196F3D;">
                                                        <img src="https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/scienolymp.avif" style="${imgStyle}">
                                                        <span>Science Olympiad</span>
                                                    </button>
                                                    <button class="pdc-comp-card-btn" data-id="Scientific Writing" style="${btnStyle} background:#D4E6F1; color:#1F618D;">
                                                        <img src="https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/sciriwirirr.avif" style="${imgStyle}">
                                                        <span>Scientific Writing</span>
                                                    </button>
                                                    <button class="pdc-comp-card-btn" data-id="Logic Olympiad" style="${btnStyle} background:#FCF3CF; color:#B7950B;">
                                                        <img src="https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/logicz.avif" style="${imgStyle}">
                                                        <span>Logic Olympiad</span>
                                                    </button>
                                                    <button class="pdc-comp-card-btn" data-id="Solo Vocal" style="${btnStyle} background:#EBDEF0; color:#7D3C98;">
                                                        <img src="https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/solvocc.avif" style="${imgStyle}">
                                                        <span>Solo Vocal</span>
                                                    </button>
                                                    <button class="pdc-comp-card-btn" data-id="Speech" style="${btnStyle} background:#F5CBA7; color:#E67E22;">
                                                        <img src="https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/speechv.avif" style="${imgStyle}">
                                                        <span>Speech</span>
                                                    </button>
                                                    <button class="pdc-comp-card-btn" data-id="Basket" style="${btnStyle} background:#F9E79F; color:#D35400;">
                                                        <img src="https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/b%20asqet.avif" style="${imgStyle}">
                                                        <span>Basket</span>
                                                    </button>
                                                </div>
                                            </div>`;

                                        widgetMainText.querySelectorAll(".pdc-comp-card-btn").forEach(btn => {
                                            btn.addEventListener("click", function() {
                                                const compId = this.getAttribute("data-id");
                                                const externalTargetForm = FORM_LINKS[compId] || "https://forms.google.com";
                                                widgetMainText.style.opacity = "0.4";

                                                db.collection("users").doc(user.uid).update({
                                                    registeredCompetition: compId,
                                                    competitionStatus: "pending"
                                                })
                                                .then(() => { window.open(externalTargetForm, '_blank'); })
                                                .catch(err => {
                                                    widgetMainText.style.opacity = "1";
                                                    alert("Network data mutation dropped: " + err.message);
                                                });
                                            });
                                        });
                                    }
                                } 
                                else if (compStatus === "pending" || compStatus === "waiting") {
                                    if (widgetMainText) {
                                        widgetMainText.innerHTML = `
                                            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 100%; gap: 12px;">
                                                <span style="font-size:15px; font-weight:700; color:#73739d; text-transform:uppercase; letter-spacing:0.05em;"><span>❖</span> Competition</span>
                                                <h1 style="font-size:38px; font-weight:800; color:#323289; margin: 8px 0 20px 0;">${data.registeredCompetition}</h1>
                                                <div style="background-color: #AEB6BF; color: #ffffff; font-size: 15px; font-weight: 700; padding: 12px 36px; border-radius: 12px; box-shadow: 0px 4px 10px rgba(0,0,0,0.05);">
                                                    Please wait for your form to be accepted.
                                                </div>
                                            </div>`;
                                    }
                                } 
                                else if (compStatus === "verified" || compStatus === "accepted") {
                                    if (widgetMainText) {
                                        const waInviteLink = WHATSAPP_LINKS[data.registeredCompetition] || "https://chat.whatsapp.com/";
                                        widgetMainText.innerHTML = `
                                            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 100%; gap: 12px;">
                                                <span style="font-size:15px; font-weight:700; color:#73739d; text-transform:uppercase; letter-spacing:0.05em;"><span>❖</span> Competition</span>
                                                <h1 style="font-size:38px; font-weight:800; color:#323289; margin: 8px 0 16px 0;">${data.registeredCompetition}</h1>
                                                
                                                <div style="background-color: #4D81E3; color: #ffffff; font-size: 15px; font-weight: 700; padding: 10px 45px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0px 4px 10px rgba(0,0,0,0.05);">
                                                    Status: Accepted
                                                </div>

                                                <a href="${waInviteLink}" target="_blank" style="background-color: #2ECC71 !important; color: #ffffff !important; font-size: 16px !important; font-weight: 800 !important; padding: 14px 32px !important; border-radius: 12px !important; box-shadow: 0px 4px 12px rgba(46, 204, 113, 0.3) !important; display: inline-flex !important; align-items: center !important; text-decoration: none !important;">
                                                    Click here to join Whatsapp group
                                                </a>
                                            </div>`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(initPdcApp, 200);
    } else {
        document.addEventListener("DOMContentLoaded", () => setTimeout(initPdcApp, 200));
    }
}
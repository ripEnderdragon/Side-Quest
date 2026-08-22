window.pdcDebugLog = window.pdcDebugLog || function(...args) {
    const debugLogElement = document.getElementById("debugLog");
    console.info("[PDC Debug]", ...args); // biar g ngeloop lognya
    if (debugLogElement) {
        debugLogElement.textContent += "[PDC Debug] " + args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : a).join(" ") + "\n";
        debugLogElement.scrollTop = debugLogElement.scrollHeight;
    }
};

window.pdcIsSubmitting = window.pdcIsSubmitting || false; //biar g double sync
window.pdcSubmitMode = window.pdcSubmitMode || ""; // final or draft
window.db = window.db || null;
window.pdcAppInitialized = window.pdcAppInitialized || false; // biar g initialization double
//config nya bos
const FORM_LINKS = {
    "Math Olympiad": "pdc.praditadirgantara.sch.id/register-math",
    "Science Olympiad": "pdc.praditadirgantara.sch.id/register-science",
    "Scientific Writing": "pdc.praditadirgantara.sch.id/register-scientific-writing",
    "Logic Olympiad": "pdc.praditadirgantara.sch.id/register-logic",
    "Solo Vocal": "pdc.praditadirgantara.sch.id/register-solo-vocal",
    "Speech": "pdc.praditadirgantara.sch.id/register-speech",
    "Basket": "pdc.praditadirgantara.sch.id/register-basket"
};

const WHATSAPP_LINKS = {
    "Math Olympiad": "https://chat.whatsapp.com/FWXG5uepuej5QkdPjKPekT?mode=gi_t",
    "Science Olympiad": "https://chat.whatsapp.com/HVkvUDGt5kE76I73O1TQOA",
    "Scientific Writing": "https://chat.whatsapp.com/EjjrzzZMeK7HfI2ZKXDkdn?mode=gi_t",
    "Logic Olympiad": "https://chat.whatsapp.com/LFuiahTnMYM7cpZMb0sFUS?mode=gi_t",
    "Solo Vocal": "https://chat.whatsapp.com/G6Tl8VpfHLwCkRXuVAri2E",
    "Speech": "https://chat.whatsapp.com/FVMD7CmVnCtEuQLet8B8Jb?mode=gi_t",
    "Basket": "https://chat.whatsapp.com/JDuiATkzIqKD2K566YbUND?mode=gi_t"
};

// jantung web pdc JANGAN DIAPA2IN BAHAYA WOY
(function() {
    if (window.pdcAppInitialized) {
        window.pdcDebugLog("Script already fully initialized. Skipping duplicate execution.");
        return;
    }
    window.pdcAppInitialized = true;

    const initPdcApp = () => {
        window.pdcDebugLog("Starting Firebase and App initialization check...");

        // cek ada SDK firebase kagak
        if (typeof firebase === "undefined") {
            window.pdcDebugLog("Firebase SDK not found. Retrying in 1s...");
            setTimeout(initPdcApp, 1000);
            return;
        }
        if (typeof firebase.app === "undefined") {
            window.pdcDebugLog("Firebase Core App not ready. Retrying in 500ms...");
            setTimeout(initPdcApp, 500);
            return;
        }
        if (typeof firebase.auth === "undefined" || typeof firebase.firestore === "undefined") {
            window.pdcDebugLog("Firebase Auth/Firestore modules not ready. Retrying in 500ms...");
            setTimeout(initPdcApp, 500);
            return;
        }

        // firebase config
        const firebaseConfig = {
            apiKey: "AIzaSyAGkfAghVtw0SKgvYVuUxmjDHXoyR8kfug", 
            authDomain: "pdc-2026.firebaseapp.com",
            projectId: "pdc-2026",
            storageBucket: "pdc-2026.firebasestorage.app",
            messagingSenderId: "768259094990",
            appId: "1:768259094990:web:f4e6c6bee85d8f2382939f",
            measurementId: "G-P4GX80LWCT"
        };

        // start firebase
        try {
            if (firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
                window.pdcDebugLog("Firebase initialized successfully.");
            } else {
                window.pdcDebugLog("Firebase already initialized by another process or previous run.");
            }

            // Assign instances to window for broader access (e.g., other scripts, console debugging)
            window.auth = firebase.auth();
            window.db = firebase.firestore();
        } catch (e) {
            window.pdcDebugLog("FATAL ERROR during Firebase initialization:", e.message);
            return; // Stop execution if Firebase cannot be initialized
        }
        
        const auth = window.auth;
        const db = window.db;
        
        let storage = null;
        try {
            if (typeof firebase.storage === "function") {
                storage = firebase.storage();
            } else if (firebase.app().storage) { // Fallback for older Firebase versions or different init patterns
                storage = firebase.app().storage();
            }
            window.pdcDebugLog("Firebase Storage module initialized.");
        } catch(e) {
            window.pdcDebugLog("Firebase Storage module not available or failed to initialize:", e.message);
            // Storage is not critical for all functions, so we allow the script to continue
        }

        window.pdcDebugLog("PDC App System Ready. Starting event listeners...");

        // ==========================================
        // LOGOUT BINDINGS
        // ==========================================
        const setupLogoutButton = (id) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("click", async (e) => {
                    e.preventDefault();
                    window.pdcDebugLog("Logout button clicked:", id);
                    try {
                        await auth.signOut();
                        window.pdcDebugLog("User signed out. Redirecting to /login.");
                        window.location.href = "/login";
                    } catch (error) {
                        window.pdcDebugLog("Error signing out:", error);
                        alert("Error signing out. Please try again.");
                    }
                });
            }
        };
        setupLogoutButton("actionLogout"); // Example ID from your code
        setupLogoutButton("logoutBtn"); // Example ID from your code

        // proxy button
        setInterval(() => {
            const submitBtns = document.querySelectorAll(".forminator-button-submit");
            submitBtns.forEach(originalBtn => {
                // Prevent re-processing already intercepted buttons
                if (originalBtn.dataset.pdcIntercepted === "true" || originalBtn.style.display === "none") return;
                
                const formEl = originalBtn.closest("form");
                if (!formEl) return;

                const submissionFormIds = ["10492", "10504", "10491", "10500", "10490", "10488", "10487"];
				const isSubmissionForm = formEl.id && submissionFormIds.some(id => formEl.id.includes(id));
                if (isSubmissionForm) {
                    // For the submission form, replace the original submit with our custom one
                    originalBtn.dataset.pdcIntercepted = "true";
                    
                    const cloneBtn = originalBtn.cloneNode(true);
                    cloneBtn.id = "pdc-submission-submit-btn";
                    cloneBtn.type = "button"; // Change to button to prevent default form submission
                    cloneBtn.textContent = "Upload & Submit Works";
                    cloneBtn.classList.add("pdc-custom-submit-btn"); // Add a custom class for styling/identification
                    
                    originalBtn.style.display = "none"; // Hide original button
                    originalBtn.parentNode.insertBefore(cloneBtn, originalBtn);

                    cloneBtn.addEventListener("click", async (e) => {
                        e.preventDefault();
                        await handleSubmissionUploadPipeline(cloneBtn, originalBtn, formEl);
                    });

                } else if (!formEl.querySelector("#pdc-custom-btn-group")) { // Ensure we only inject once per form
                    // For other profile forms, inject Save Draft and Final Submit buttons
                    originalBtn.dataset.pdcIntercepted = "true";
                    
                    const btnGroup = document.createElement("div");
                    btnGroup.id = "pdc-custom-btn-group";
                    btnGroup.style.cssText = "display:inline-flex; gap:10px; width:100%; margin-top:15px; flex-wrap: wrap; justify-content: center;";

                    const saveBtn = document.createElement("button");
                    saveBtn.id = "pdc-save-draft-btn";
                    saveBtn.type = "button"; 
                    saveBtn.textContent = "Save Draft (Editable)";
                    saveBtn.className = originalBtn.className; 
                    saveBtn.style.backgroundColor = "#E67E22"; // Custom color for draft
                    saveBtn.classList.add("pdc-custom-action-btn");

                    const finalBtn = document.createElement("button");
                    finalBtn.id = "pdc-final-submit-btn";
                    finalBtn.type = "button";
                    finalBtn.textContent = "Final Submit (Lock Data)";
                    finalBtn.className = originalBtn.className;
                    finalBtn.classList.add("pdc-custom-action-btn");

                    btnGroup.appendChild(saveBtn);
                    btnGroup.appendChild(finalBtn);

                    originalBtn.style.display = "none"; // Hide original button
                    originalBtn.parentNode.insertBefore(btnGroup, originalBtn);

                    saveBtn.onclick = async (e) => {
                        e.preventDefault();
                        await handleFormSyncPipeline(false, saveBtn, finalBtn, originalBtn);
                    };

                    finalBtn.onclick = async (e) => {
                        e.preventDefault();
                        if (confirm("Are you absolutely sure the data is correct? \n\nOnce submitted, your profile will be LOCKED and you will not be able to edit it anymore.")) {
                            await handleFormSyncPipeline(true, finalBtn, saveBtn, originalBtn);
                        }
                    };
                }
            });
        }, 1000);

        // buat form regis lomba
        async function handleSubmissionUploadPipeline(clickedBtn, originalBtn, formEl) {
            window.pdcDebugLog("handleSubmissionUploadPipeline triggered.");
            if (!formEl.checkValidity()) {
                formEl.reportValidity();
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                alert("Session Timeout: Active session not detected. Please refresh and log in again.");
                return;
            }

            const originalText = clickedBtn.textContent;
            clickedBtn.textContent = "Uploading Submissions...";
            clickedBtn.disabled = true;

            try {
                if (!storage) throw new Error("Firebase Storage module not available. Cannot upload files.");

                const payload = {
                    submissionTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                };

                let filesUploadedCount = 0;

                for (let i = 1; i <= 6; i++) {
                    const fileInput = formEl.querySelector(`input[type=\'file\'][name^=\'upload-${i}\']`) || formEl.querySelector(`#upload-${i}`);
                    const file = fileInput?.files?.[0];

                    if (file) {
                        window.pdcDebugLog(`Processing submission file slot upload-${i}: ${file.name}`);
                        const ref = storage.ref(`competitionSubmissions/${user.uid}/slot-${i}_${Date.now()}_${file.name}`);
                        const snap = await ref.put(file);
                        const downloadURL = await snap.ref.getDownloadURL();
                        
                        payload[`submissionFileUrl_${i}`] = downloadURL;
                        filesUploadedCount++;
                    }
                }

                if (filesUploadedCount === 0) {
                    alert("Submission Denied: You must upload file (PDF or Image) before submitting.");
                    clickedBtn.textContent = originalText;
                    clickedBtn.disabled = false;
                    return;
                }

                const checkboxEl = formEl.querySelector(`input[type=\'checkbox\'][name^=\'checkbox-1\']`) || formEl.querySelector(`#checkbox-1`);
                if (checkboxEl) {
                    payload["submissionCheckboxAgreement"] = checkboxEl.checked;
                }

                await db.collection("users").doc(user.uid).set(payload, { merge: true });
                window.pdcDebugLog(`Successfully uploaded ${filesUploadedCount} file(s) and logged metadata to Firestore.`);
                
                // Trigger original Forminator submission to handle its own success actions (e.g., redirects, messages)
				originalBtn.click();
				clickedBtn.textContent = "Uploaded Successfully! Redirecting...";
				window.location.href = "pdc.praditadirgantara.sch.id/dashboard"

            } catch (error) {
                window.pdcDebugLog("Submission upload processing failure:", error);
                alert("Server Upload Error: Unable to process your files. Please check your internet connection and Firebase Storage rules.");
                
                clickedBtn.textContent = originalText;
                clickedBtn.disabled = false;
            }
        }

        // interceptor form regis profil (draft or LOCKKK ARKANA)
        async function handleFormSyncPipeline(isFinalSubmit, clickedBtn, otherBtn, originalBtn) {
            window.pdcDebugLog(`handleFormSyncPipeline triggered. Final Submit: ${isFinalSubmit}`);
            const formEl = originalBtn.closest("form");
            if (formEl && !formEl.checkValidity()) {
                formEl.reportValidity();
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                alert("Authentication error: Active session not detected. Please refresh the page.");
                return;
            }

            const originalText = clickedBtn.textContent;
            clickedBtn.textContent = isFinalSubmit ? "Locking Profile..." : "Saving to Database...";
            clickedBtn.disabled = true;
            if (otherBtn) otherBtn.disabled = true;

            window.pdcSubmitMode = isFinalSubmit ? "final" : "draft";
            window.pdcIsSubmitting = true;

            try {
                // capture form data
                const getVal = (sel) => document.querySelector(sel)?.value?.trim() || "";
                const getFile = (sel) => document.querySelector(sel)?.files?.[0];

                const fullNameValue = getVal("input[name^=\'name-\']") || getVal(".forminator-field-name input") || getVal("#name-1");
                const phoneValue    = getVal("input[name^=\'phone-\']") || getVal(".forminator-field-phone input") || getVal("#phone-1");
                const nisnValue     = getVal("input[name^=\'number-\']") || getVal(".forminator-field-number input") || getVal("#number-1");
                const schoolValue   = getVal("input[name^=\'text-\']") || getVal(".forminator-field-text input") || getVal("#text-1");
                const gradeValue    = getVal("select[name^=\'select-\']") || getVal(".forminator-field-select select") || getVal("#select-1");

                const studentFile = getFile("input[type=\'file\'][name^=\'upload-1\']") || getFile("#upload-1");
                const idFile = getFile("input[type=\'file\'][name^=\'upload-2\']") || getFile("#upload-2");

                window.pdcDebugLog("Captured form data:", { fullNameValue, phoneValue, nisnValue, schoolValue, gradeValue, studentFile: studentFile?.name, idFile: idFile?.name });

                // file upload
                const uploadFileToStorage = async (file, path) => {
                    if (!storage) {
                        window.pdcDebugLog("Firebase Storage not initialized. Skipping file upload.");
                        return "";
                    }
                    if (!file) {
                        window.pdcDebugLog(`No file provided for path: ${path}. Skipping upload.`);
                        return "";
                    }

                    window.pdcDebugLog(`Attempting to upload file: ${file.name} to ${path}`);
                    try {
                        const ref = storage.ref(`${path}/${user.uid}_${Date.now()}_${file.name}`); // Unique name per user
                        const snap = await ref.put(file);
                        const downloadURL = await snap.ref.getDownloadURL();
                        window.pdcDebugLog(`File uploaded: ${file.name}, URL: ${downloadURL}`);
                        return downloadURL;
                    } catch (uploadError) {
                        window.pdcDebugLog(`Error uploading file ${file.name} to ${path}:`, uploadError);
                        return "";
                    }
                };

                const studentCardURL = await uploadFileToStorage(studentFile, "studentCards");
                const idCardURL      = await uploadFileToStorage(idFile, "idCards");

                // construct payload ---
                const payload = {
                    email: user.email,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    profileComplete: isFinalSubmit,
                    dataLocked: isFinalSubmit,
                    status: isFinalSubmit ? "waiting" : "draft" 
                };

                // only add fields to payload if they have a captured value
                if (fullNameValue) payload.fullName = fullNameValue;
                if (phoneValue) payload.phoneNumber = phoneValue;
                if (nisnValue) payload.nisn = nisnValue;
                if (schoolValue) payload.school = schoolValue;
                if (gradeValue) payload.grade = gradeValue;
                if (studentCardURL) payload.studentCardURL = studentCardURL;
                if (idCardURL) payload.idCardURL = idCardURL;

                window.pdcDebugLog("Writing payload to Firestore path users/" + user.uid, payload);
                await db.collection("users").doc(user.uid).set(payload, { merge: true });
                window.pdcDebugLog("Firestore write successful!");
                
                // trigger original Forminator submission to handle its own success actions
                originalBtn.click();
				clickedBtn.textContent = "Uploaded Successfully! Redirecting...";
				window.location.href = "pdc.praditadirgantara.sch.id/dashboard"

            } catch (err) {
                window.pdcDebugLog("Profile sync processing failure:", err);
                alert("Save Error: Unable to save your profile. Please check your internet connection.");
            } finally {
                clickedBtn.textContent = originalText;
                clickedBtn.disabled = false;
                if (otherBtn) otherBtn.disabled = false;
                window.pdcIsSubmitting = false; // Reset global flag
            }
        }

        // data sama realtime controller
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.pdcDebugLog("User is logged out. Checking for protected routes...");
                const protectedRoutes = ["/profile", "/dashboard"]; // Add your protected routes here
                if (protectedRoutes.some(r => window.location.pathname.includes(r))) {
                    window.pdcDebugLog("On protected route, redirecting to /login.");
                    window.location.href = "/login";
                }
                // Hide logout button if user is logged out
                const logoutBtn = document.getElementById("logoutBtn");
                if (logoutBtn) logoutBtn.style.display = "none";
                const actionLogout = document.getElementById("actionLogout");
                if (actionLogout) actionLogout.style.display = "none";
                return;
            }

            window.pdcDebugLog("User logged in as:", user.email);
            const userEmailSpan = document.getElementById("userEmail") || document.getElementById("authEmailStatus");
            if (userEmailSpan) userEmailSpan.textContent = user.email;

            // Listen for real-time updates to the user's document in Firestore
            db.collection("users").doc(user.uid).onSnapshot((doc) => {
                if (!doc.exists) {
                    window.pdcDebugLog("User document does not exist in Firestore.");
                    return;
                }
                const data = doc.data();
                window.pdcDebugLog("Firestore user data updated:", data);
                
                // --- Update Text Displays ---
                const textDisplayMap = {
                    "displayFullName": data.fullName,
                    "metaName": data.fullName,
                    "displaySchool": data.school ? `${data.school}` : "",
                    "metaSchool": data.school ? `${data.school}` : "",
                    "displayNisn": data.nisn ? `${data.nisn}` : "",
                    "metaNisn": data.nisn ? `${data.nisn}` : "",
                    "displayPhone": data.phoneNumber ? `${data.phoneNumber}` : "",
                    "metaPhone": data.phoneNumber ? `${data.phoneNumber}` : "",
                    "displayGrade": data.grade ? `${data.grade}` : "",
                    "metaGrade": data.grade ? `${data.grade}` : ""
                };
                Object.keys(textDisplayMap).forEach(id => {
                    const el = document.getElementById(id);
                    if (el && textDisplayMap[id]) el.textContent = textDisplayMap[id];
                });

                // --- Image Displays ---
                const imageContainer = document.getElementById("imageDisplayContainer");
                const uiStudentCard = document.getElementById("uiStudentCard");
                const uiIdCard = document.getElementById("uiIdCard");
                
                let hasImages = false;
                if (data.studentCardURL && uiStudentCard) { uiStudentCard.src = data.studentCardURL; hasImages = true; }
                if (data.idCardURL && uiIdCard) { uiIdCard.src = data.idCardURL; hasImages = true; }
                if (imageContainer) imageContainer.style.display = hasImages ? "flex" : "none";

                // --- Form Auto-fill (only if not locked and not currently submitting) ---
                const isLocked = data.dataLocked === true || data.profileComplete === true;
                if (!isLocked && !window.pdcIsSubmitting) {
                    const nameInput  = document.querySelector("input[name^=\'name-\']") || document.querySelector(".forminator-field-name input") || document.getElementById("name-1");
                    const phoneInput = document.querySelector("input[name^=\'phone-\']") || document.querySelector(".forminator-field-phone input") || document.getElementById("phone-1");
                    const nisnInput  = document.querySelector("input[name^=\'number-\']") || document.querySelector(".forminator-field-number input") || document.getElementById("number-1");
                    const schoolInput= document.querySelector("input[name^=\'text-\']") || document.querySelector(".forminator-field-text input") || document.getElementById("text-1");
                    const gradeSelect= document.querySelector("select[name^=\'select-\']") || document.querySelector(".forminator-field-select select") || document.getElementById("select-1");

                    // Only fill if the field is currently empty to avoid overwriting user input
                    if (nameInput && !nameInput.value) nameInput.value = data.fullName || "";
                    if (phoneInput && !phoneInput.value) phoneInput.value = data.phoneNumber || "";
                    if (nisnInput && !nisnInput.value) nisnInput.value = data.nisn || "";
                    if (schoolInput && !schoolInput.value) schoolInput.value = data.school || "";
                    if (gradeSelect && !gradeSelect.value) gradeSelect.value = data.grade || "";
                }

                // --- Status Badge & UI Lock Logic ---
                const accountStatus = (data.status || "incomplete").toLowerCase();
                const compStatus = (data.competitionStatus || "none").toLowerCase();
                const widgetMainText = document.getElementById("widgetMainText") || document.getElementById("dynamicWorkspaceMount");

                const displayStatus = document.getElementById("displayStatus") || document.getElementById("metaStatusPill");
                if (displayStatus) {
                    let label = "Incomplete", color = "#797980";
                    if (isLocked) { label = "Waiting"; color = "#E67E22"; }
                    if (accountStatus === "verified" || accountStatus === "accepted") { label = "Verified"; color = "#2E7D32"; }
                    displayStatus.textContent = label;
                    displayStatus.style.backgroundColor = color;
                }

                // Profile Page UI Rendering
                if (window.location.pathname.includes("/profile")) {
                    const formWrapper = document.querySelector(".profile-form-card") || document.getElementById("profileFormWrapper");
                    if (formWrapper) {
                        if (isLocked && !window.pdcIsSubmitting) {
                            // Display locked profile view
                            formWrapper.innerHTML = `
                                <div style="width:100%; display:flex; flex-direction:column; gap:20px; padding: 10px; box-sizing: border-box;">
                                    <div style="border-bottom: 2px solid #3F3FA4; padding-bottom: 10px;">
                                        <h2 style="margin:0; color:#3F3FA4; font-size:24px;">Profile Data</h2>
                                    </div>
                                    
                                    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:12px; background:#f8fafc; padding:20px; border-radius:12px; border: 1px solid #e2e8f0;">
                                        <strong style="color:#475569;">Full Name:</strong> <span style="font-weight:700; color:#1e293b;">${data.fullName || 'Not Provided'}</span>
                                        <strong style="color:#475569;">Active Phone:</strong> <span style="font-weight:700; color:#1e293b;">${data.phoneNumber || 'Not Provided'}</span>
                                        <strong style="color:#475569;">NISN:</strong> <span style="font-weight:700; color:#1e293b;">${data.nisn || 'Not Provided'}</span>
                                        <strong style="color:#475569;">School Name:</strong> <span style="font-weight:700; color:#1e293b;">${data.school || 'Not Provided'}</span>
                                        <strong style="color:#475569;">Grade:</strong> <span style="font-weight:700; color:#1e293b;">${data.grade || 'Not Provided'}</span>
                                    </div>

                                    <div style="display:flex; gap:20px; margin-top:10px; flex-wrap: wrap;">
                                        ${data.studentCardURL ? `<div style="flex:1; min-width:240px;"><strong style="color:#475569;">Student Card:</strong><br><img src="${data.studentCardURL}" style="max-width:100%; border-radius:10px; margin-top:8px; border: 1px solid #e2e8f0;"></div>` : ''}
                                        ${data.idCardURL ? `<div style="flex:1; min-width:240px;"><strong style="color:#475569;">ID Card:</strong><br><img src="${data.idCardURL}" style="max-width:100%; border-radius:10px; margin-top:8px; border: 1px solid #e2e8f0;"></div>` : ''}
                                    </div>
                                </div>
                            `;
                        } else if (!isLocked && !window.pdcIsSubmitting) {
                            // Ensure form is visible and editable
                            // This block might be redundant if Forminator handles its own visibility
                            // but serves as a fallback to ensure the form is not hidden by our script.
                            const originalForm = formWrapper.querySelector("form");
                            if (originalForm) originalForm.style.display = "block";
                        }
                    }
                }

                // Dashboard Page UI Rendering
                if (widgetMainText && (window.location.pathname.includes("/dashboard") || window.location.pathname === "/")) {
                    if (!isLocked) {
                        widgetMainText.innerHTML = `<div style="text-align:center; font-size:24px; font-weight:800; color:#323289; line-height:34px; width:100%;">Please complete and lock your profile to register a competition!</div>`;
                    } else if (accountStatus === "verified" || accountStatus === "accepted") {
                        if (!data.registeredCompetition || compStatus === "none") {
                            // Render Competition Cards
                            let cardsHtml = `
                                <div style="width: 100%;">
                                    <p style="color:#323289; font-size: 22px; font-weight: 800; margin-bottom: 20px; text-align: center;">Please select a competition to register:</p>
                                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; width:100%;">
                            `;
                            const btnStyle = "padding:20px 16px; border:none; border-radius:16px; font-weight:800; font-size:14px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); transition: transform 0.2s;";
                            const imgStyle = "width:100%; height:100%; object-fit:cover; border-radius:8px;";

                            Object.keys(FORM_LINKS).forEach(id => {
                                let bgColor, textColor, imgSrc;
                                switch(id) {
                                    case "Math Olympiad": bgColor = "#FADBD8"; textColor = "#C0392B"; imgSrc = "https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/math%20olympiad.avif"; break;
                                    case "Science Olympiad": bgColor = "#D4EFDF"; textColor = "#196F3D"; imgSrc = "https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/scienolymp.avif"; break;
                                    case "Scientific Writing": bgColor = "#D4E6F1"; textColor = "#1F618D"; imgSrc = "https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/sciriwirirr.avif"; break;
                                    case "Logic Olympiad": bgColor = "#FFA0D8"; textColor = "#B7950B"; imgSrc = "https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/logicz.avif"; break;
                                    case "Solo Vocal": bgColor = "#EBDEF0"; textColor = "#7D3C98"; imgSrc = "https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/solvocc.avif"; break;
                                    case "Speech": bgColor = "#F9E79F"; textColor = "#E67E22"; imgSrc = "https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/speechv.avif"; break;
                                    case "Basket": bgColor = "#F5CBA7"; textColor = "#D35400"; imgSrc = "https://raw.githubusercontent.com/caatz38/pdc-gassin/72abc2f6bcf296819d273d6a53291b24e513f1c9/assets/comps/b%20asqet.avif"; break;
                                    default: bgColor = "#E0E0E0"; textColor = "#424242"; imgSrc = ""; break;
                                }
                                cardsHtml += `
                                    <button class="pdc-comp-card-btn" data-id="${id}" style="${btnStyle} background:${bgColor}; color:${textColor};">
                                        ${imgSrc ? `<img src="${imgSrc}" style="${imgStyle}">` : ''}
                                        <span>${id}</span>
                                    </button>
                                `;
                            });
                            cardsHtml += `</div></div>`;
                            widgetMainText.innerHTML = cardsHtml;

                            widgetMainText.querySelectorAll(".pdc-comp-card-btn").forEach(btn => {
                                btn.addEventListener("click", function() {
                                    const compId = this.getAttribute("data-id");
                                    const externalTargetForm = FORM_LINKS[compId] || "https://forms.google.com";
                                    widgetMainText.style.opacity = "0.4"; // Visual feedback

                                    db.collection("users").doc(user.uid).update({
                                        registeredCompetition: compId,
                                        competitionStatus: "pending"
                                    })
                                    .then(() => { 
                                        window.pdcDebugLog(`Registered for ${compId}. Opening form: ${externalTargetForm}`);
                                        window.open(externalTargetForm, '_blank'); 
                                        widgetMainText.style.opacity = "1"; // Reset opacity
                                    })
                                    .catch(err => {
                                        window.pdcDebugLog("Error registering competition:", err);
                                        widgetMainText.style.opacity = "1";
                                        alert("Network data mutation dropped: " + err.message);
                                    });
                                });
                            });
                        } else if (compStatus === "pending" || compStatus === "waiting") {
                            widgetMainText.innerHTML = `
                                <div style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 100%; gap: 12px;">
                                    <span style="font-size:15px; font-weight:700; color:#73739d; text-transform:uppercase; letter-spacing:0.05em;"><span>❖</span> Competition</span>
                                    <h1 style="font-size:38px; font-weight:800; color:#323289; margin: 8px 0 20px 0;">${data.registeredCompetition}</h1>
                                    <div style="background-color: #AEB6BF; color: #ffffff; font-size: 15px; font-weight: 700; padding: 12px 36px; border-radius: 12px; box-shadow: 0px 4px 10px rgba(0,0,0,0.05);">
                                        Please wait for your form to be accepted.
                                    </div>
                                </div>`;
                        } else if (compStatus === "verified" || compStatus === "accepted") {
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
                    } else {
                        widgetMainText.innerHTML = `<div style="text-align:center;"><h3>Profile Under Review</h3><p>Please wait for verification.</p></div>`;
                    }
                }
            });
        });
    };

    // --- Initial App Load Trigger ---
    // Ensures initPdcApp runs after DOM is ready and potentially after other scripts.
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(initPdcApp, 200); // Small delay to ensure all external scripts are parsed
    } else {
        document.addEventListener("DOMContentLoaded", () => setTimeout(initPdcApp, 200));
    }
})();
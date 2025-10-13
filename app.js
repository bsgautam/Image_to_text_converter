document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Element Selection ---
    const uploadBtn = document.getElementById("uploadBtn");
    const cameraBtn = document.getElementById("cameraBtn");
    const fileInput = document.getElementById("fileInput");
    const resultDiv = document.getElementById("result");
    const translatedResultDiv = document.getElementById("translatedResult"); // For Auto-Save
    const darkModeToggle = document.getElementById("darkModeToggle");
    const typingHeader = document.getElementById("typing-header");
    const ocrLangSelect = document.getElementById("ocrLangSelect");
    const handwritingMode = document.getElementById("handwritingMode"); // NEW: Handwriting Mode
    const copyBtn = document.getElementById("copyBtn");
    const readAloudBtn = document.getElementById("readAloudBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const clearBtn = document.getElementById("clearBtn");
    const translateBtn = document.getElementById("translateBtn");
    const translationLangSelect = document.getElementById("translationLangSelect");
    const resultCharCount = document.getElementById("resultCharCount");
    // Modals & Overlays
    const cropperModal = document.getElementById("cropperModal");
    const cameraModal = document.getElementById("cameraModal");
    const downloadModal = document.getElementById("downloadModal");
    const imageToCrop = document.getElementById("imageToCrop");
    const confirmCropBtn = document.getElementById("confirmCropBtn");
    const cancelCropBtn = document.getElementById("cancelCropBtn");
    const cameraFeed = document.getElementById("cameraFeed");
    const captureBtn = document.getElementById("captureBtn");
    const cancelCameraBtn = document.getElementById("cancelCameraBtn");
    const cancelDownloadBtn = document.getElementById("cancelDownloadBtn");
    const downloadOptionsGrid = document.querySelector(".download-options-grid");
    const loader = document.getElementById("loader");
    const toastContainer = document.getElementById("toastContainer");
    // History Panel
    const historyBtn = document.getElementById("historyBtn");
    const historyPanel = document.getElementById("historyPanel");
    const closeHistoryBtn = document.getElementById("closeHistoryBtn");
    const historyList = document.getElementById("historyList");
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");
    // NEW: Image Pre-processing Controls
    const grayscaleBtn = document.getElementById("grayscaleBtn");
    const contrastBtn = document.getElementById("contrastBtn");
    const rotateLeftBtn = document.getElementById("rotateLeftBtn"); // NEW: Deskew control
    const rotateRightBtn = document.getElementById("rotateRightBtn"); // NEW: Deskew control
    // NEW: TTS Controls
    const ttsControls = document.getElementById("ttsControls");
    const ttsPlayPauseBtn = document.getElementById("ttsPlayPauseBtn");
    const ttsStopBtn = document.getElementById("ttsStopBtn");
    const ttsVoiceSelect = document.getElementById("ttsVoiceSelect");
    const ttsRateRange = document.getElementById("ttsRateRange");
    const ttsRateValue = document.getElementById("ttsRateValue");

    // --- State Variables ---
    let cropper = null;
    let imageFilters = { grayscale: false, contrast: false };
    const synth = window.speechSynthesis; // TTS API
    let currentUtterance = null;
    const AUTO_SAVE_KEY = 'ocrDraft'; // Auto-Save Key

    // --- Utility Functions ---
    function showToast(message, duration = 3000) {
        const toast = document.createElement("div");
        toast.classList.add("toast");
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // Force reflow to ensure the transition is triggered
        void toast.offsetWidth;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
            toast.addEventListener("transitionend", () => toast.remove());
        }, duration);
    }

    function updateCharCount(element, counter) {
        const count = element.textContent.length;
        counter.textContent = `${count} characters`;
    }

    // Debounce function for Auto-Saving
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    // --- NEW: Auto-Save Logic (Feature from previous response) ---
    function saveDraft() {
        const draft = {
            original: resultDiv.innerHTML,
            translated: translatedResultDiv.textContent
        };
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(draft));
    }

    function loadDraft() {
        const draftJson = localStorage.getItem(AUTO_SAVE_KEY);
        if (!draftJson) return;

        try {
            const draft = JSON.parse(draftJson);
            if (draft.original && resultDiv.innerHTML.trim() === '') {
                resultDiv.innerHTML = draft.original;
                translatedResultDiv.textContent = draft.translated;
                updateCharCount(resultDiv, resultCharCount);
                showToast("Restored previous draft.");
            }
        } catch (e) {
            console.error("Failed to parse auto-save draft:", e);
            localStorage.removeItem(AUTO_SAVE_KEY);
        }
    }
    const debouncedSave = debounce(saveDraft, 500);
    // Attach debounced save to content changes
    resultDiv.addEventListener("input", () => {
        updateCharCount(resultDiv, resultCharCount);
        debouncedSave();
    });
    translatedResultDiv.addEventListener("input", debouncedSave);
    
    // --- Dark Mode Logic ---
    function loadDarkModeSetting() {
        const isDarkMode = localStorage.getItem("darkMode") === "true";
        document.body.classList.toggle("dark-mode", isDarkMode);
        darkModeToggle.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
    }

    darkModeToggle.addEventListener("click", () => {
        const isDarkMode = document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", isDarkMode);
        darkModeToggle.textContent = isDarkMode ? "Light Mode" : "Dark Mode";
    });
    
    // --- History Logic ---
    function getHistory() {
        return JSON.parse(localStorage.getItem("translationHistory")) || [];
    }
    function renderHistory() { /* ... (History rendering logic remains the same) ... */
        const history = getHistory();
        historyList.innerHTML = history.length
          ? ""
          : '<li><div class="original-text">No history yet.</div></li>';
        history.forEach((item) => {
          const li = document.createElement("li");
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = item.originalHTML;
          li.innerHTML = `<div class="original-text">${tempDiv.textContent.substring(0, 50)}...</div><div class="translated-text">${item.translated.substring(0, 50)}...</div>`;
          li.addEventListener("click", () => {
            resultDiv.innerHTML = item.originalHTML;
            translatedResultDiv.textContent = item.translated;
            updateCharCount(resultDiv, resultCharCount);
            historyPanel.classList.remove("show");
          });
          historyList.appendChild(li);
        });
    }

    function saveToHistory(originalHTML, translated) {
        let history = getHistory();
        history.unshift({ originalHTML, translated });
        if (history.length > 20) history = history.slice(0, 20);
        localStorage.setItem("translationHistory", JSON.stringify(history));
        renderHistory();
    }
    function clearHistory() {
        localStorage.removeItem("translationHistory");
        renderHistory();
        showToast("History cleared.");
    }
    historyBtn.addEventListener("click", () => historyPanel.classList.add("show"));
    closeHistoryBtn.addEventListener("click", () => historyPanel.classList.remove("show"));
    clearHistoryBtn.addEventListener("click", clearHistory);

    // --- Core OCR & Image Processing ---
    async function performOCR(imageSource) {
        loader.classList.add("show");
        const selectedLang = ocrLangSelect.value;
        const isHandwritingMode = handwritingMode.checked; // NEW: Handwriting Mode Check
        let langCode = selectedLang;

        if (selectedLang === 'auto') {
            langCode = 'eng+spa+fra'; 
        }
        
        // NEW: Enhance langCode for handwriting (Feature from previous response)
        if (isHandwritingMode) {
            if (langCode.includes('eng') || langCode.includes('spa') || langCode.includes('fra')) {
                langCode += '+script/Latin';
            } 
            loader.querySelector('p').textContent = `Recognizing text (Handwriting Mode: ${langCode})...`;
        } else {
            loader.querySelector('p').textContent = `Recognizing text (Language: ${langCode})...`;
        }

        try {
            const worker = await Tesseract.createWorker(langCode, 1); // 1 worker is often better for client-side

            const {
                data: { text, hocr },
            } = await worker.recognize(imageSource, "hocr", {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        loader.querySelector('p').textContent = `Progress: ${Math.round(m.progress * 100)}%`;
                    }
                },
            });
            
            await worker.terminate();

            // Process text to insert links (emails, URLs) using hocr/DOM parsing
            const hocrDoc = new DOMParser().parseFromString(hocr, 'text/html');
            const pElements = hocrDoc.querySelectorAll('.ocr_page .ocr_text');
            let formattedHTML = '';

            pElements.forEach(p => {
                let pText = p.innerHTML;
                
                // Regex to wrap URLs and emails in anchors (basic version)
                pText = pText.replace(
                    /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b)/ig,
                    (match, url, protocol, email) => {
                        if (url) {
                            return `<a href="${url}" target="_blank" class="ocr-link">${match}</a>`;
                        } else if (email) {
                            return `<a href="mailto:${email}" class="ocr-link">${match}</a>`;
                        }
                        return match;
                    }
                );
                formattedHTML += `<p>${pText}</p>`;
            });

            resultDiv.innerHTML = formattedHTML || text;
            translatedResultDiv.textContent = "";
            updateCharCount(resultDiv, resultCharCount);
            saveToHistory(resultDiv.innerHTML, translatedResultDiv.textContent);
            showToast("Text extraction complete!");
            
        } catch (err) {
            console.error("OCR Error:", err);
            showToast("OCR failed. Check your image quality and selected language.", 5000);
        } finally {
            loader.classList.remove("show");
        }
    }

    function toggleFilter(filter) {
        imageFilters[filter] = !imageFilters[filter];
        const btn = document.getElementById(filter + "Btn");
        btn.classList.toggle("primary", imageFilters[filter]);
        showToast(`${filter.charAt(0).toUpperCase() + filter.slice(1)} ${imageFilters[filter] ? 'Enabled' : 'Disabled'}`);
    }
    grayscaleBtn.addEventListener("click", () => toggleFilter("grayscale"));
    contrastBtn.addEventListener("click", () => toggleFilter("contrast"));


    function initCropper(imageURL) {
        cropperModal.classList.remove("hidden");
        imageToCrop.src = imageURL;
        
        if (cropper) {
            cropper.destroy();
        }
        
        cropper = new Cropper(imageToCrop, {
            aspectRatio: NaN,
            viewMode: 1,
            autoCropArea: 0.9,
            background: false,
        });

        // NEW: Rotation button event listeners (Feature 2: Deskew)
        rotateLeftBtn.onclick = () => {
            if (cropper) cropper.rotate(-5); // Rotate 5 degrees counter-clockwise
        };
        rotateRightBtn.onclick = () => {
            if (cropper) cropper.rotate(5); // Rotate 5 degrees clockwise
        };
    }

    function processCroppedImage() {
        if (!cropper) return;
        
        let canvas = cropper.getCroppedCanvas(); 
        
        // Check if any filters are applied
        if (imageFilters.grayscale || imageFilters.contrast) {
            // Get the final, rotated, cropped image as a data URL
            const finalImageURL = canvas.toDataURL();

            // Create a NEW canvas to apply filters
            const filteredCanvas = document.createElement('canvas');
            filteredCanvas.width = canvas.width;
            filteredCanvas.height = canvas.height;
            const ctx = filteredCanvas.getContext('2d');
            
            // Apply CSS filters to the context
            ctx.filter = `${imageFilters.grayscale ? 'grayscale(100%)' : ''} ${imageFilters.contrast ? 'contrast(200%)' : ''}`.trim();

            // Draw the final image onto the filtered canvas
            const tempImage = new Image();
            tempImage.onload = () => {
                ctx.drawImage(tempImage, 0, 0, filteredCanvas.width, filteredCanvas.height);
                closeCropper();
                performOCR(filteredCanvas); // Send the filtered canvas
            };
            tempImage.src = finalImageURL;
            
        } else {
            // No filters: proceed with the raw cropped and rotated canvas
            closeCropper();
            performOCR(canvas);
        }
    }

    function closeCropper() {
        cropperModal.classList.add("hidden");
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        // Reset filter buttons and state
        imageFilters = { grayscale: false, contrast: false };
        grayscaleBtn.classList.remove("primary");
        contrastBtn.classList.remove("primary");
    }

    confirmCropBtn.addEventListener("click", processCroppedImage);
    cancelCropBtn.addEventListener("click", closeCropper);

    // --- TTS Control Logic (NEW FEATURE 1) ---
    function populateVoiceList() {
        const voices = synth.getVoices();
        ttsVoiceSelect.innerHTML = ''; 
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            // Attempt to select a voice matching the current OCR/Translation context (e.g., English)
            if (voice.lang.includes('en') && voice.default) {
                option.selected = true;
            }
            ttsVoiceSelect.appendChild(option);
        });
    }

    // Load voices. They are often loaded asynchronously.
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = populateVoiceList;
    } else {
        populateVoiceList();
    }
    
    function updateTtsUi(speaking, paused) {
        ttsControls.classList.add("show");
        ttsControls.classList.remove("hidden");
        
        if (speaking && !paused) {
            ttsPlayPauseBtn.innerHTML = '<span class="tts-icon">⏸️</span>'; // Pause Icon
            ttsPlayPauseBtn.classList.remove('primary');
        } else if (speaking && paused) {
            ttsPlayPauseBtn.innerHTML = '<span class="tts-icon">▶️</span>'; // Play Icon
            ttsPlayPauseBtn.classList.add('primary');
        } else {
            // Not speaking (Stopped or Finished)
            ttsPlayPauseBtn.innerHTML = '<span class="tts-icon">▶️</span>'; // Play Icon
            ttsPlayPauseBtn.classList.add('primary');
            // Hide controls if completely stopped after a delay
            setTimeout(() => {
                if (!synth.speaking && !synth.paused) {
                    ttsControls.classList.add("hidden");
                }
            }, 500);
        }
    }

    function speakText() {
        // Use translated text if available, otherwise use original text
        const textToSpeak = translatedResultDiv.textContent.trim() || resultDiv.textContent.trim();

        if (!textToSpeak) return showToast("Nothing to read aloud.");
        
        // If already speaking or paused, interrupt and restart
        if (synth.speaking || synth.paused) {
            synth.cancel();
        }

        currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // Set voice
        const selectedVoiceName = ttsVoiceSelect.value;
        const voices = synth.getVoices();
        const selectedVoice = voices.find(v => v.name === selectedVoiceName);
        if (selectedVoice) {
            currentUtterance.voice = selectedVoice;
        }

        // Set rate
        currentUtterance.rate = parseFloat(ttsRateRange.value);

        // Event handlers for UI updates
        currentUtterance.onstart = () => updateTtsUi(true, false);
        currentUtterance.onpause = () => updateTtsUi(true, true);
        currentUtterance.onresume = () => updateTtsUi(true, false);
        currentUtterance.onend = () => {
            updateTtsUi(false, false);
            currentUtterance = null;
        };
        currentUtterance.onerror = (event) => {
            console.error("TTS Error:", event.error);
            showToast("Speech synthesis failed: " + event.error);
            updateTtsUi(false, false);
            currentUtterance = null;
        };

        synth.speak(currentUtterance);
        updateTtsUi(true, false);
    }
    
    // TTS Control Button Handlers
    readAloudBtn.addEventListener("click", speakText);

    ttsPlayPauseBtn.addEventListener("click", () => {
        if (!currentUtterance || (!synth.speaking && !synth.paused)) {
            speakText(); // Start speaking if stopped
        } else if (synth.paused) {
            synth.resume();
            updateTtsUi(true, false);
        } else if (synth.speaking) {
            synth.pause();
            updateTtsUi(true, true);
        }
    });

    ttsStopBtn.addEventListener("click", () => {
        if (synth.speaking || synth.paused) {
            synth.cancel();
            updateTtsUi(false, false);
            currentUtterance = null;
        }
    });

    // Rate slider feedback and instant rate change
    ttsRateRange.addEventListener("input", (e) => {
        const newRate = parseFloat(e.target.value).toFixed(1);
        ttsRateValue.textContent = `${newRate}x`;
        // Immediately apply new rate to the current utterance if it exists
        if (currentUtterance) {
             currentUtterance.rate = parseFloat(newRate);
             // Note: Changing rate mid-utterance is often browser-dependent.
             // Best practice is to stop and restart, but we'll try to apply it directly.
             // If the utterance has not started yet, the new rate will be applied when speak() is called.
             // If it's already speaking, it may take effect on the next sentence/word or not at all.
        }
    });
    
    ttsVoiceSelect.addEventListener("change", () => {
        // Stop current speech and let the user click 'Play' again with the new voice
        if (synth.speaking || synth.paused) {
            synth.cancel();
            updateTtsUi(false, false);
            currentUtterance = null;
            showToast("Voice changed. Click 'Read Aloud' again to use the new voice.");
        }
    });

    // --- Data Management & File Handling ---
    function clearAll() {
        resultDiv.innerHTML = "";
        translatedResultDiv.textContent = "";
        updateCharCount(resultDiv, resultCharCount);
        localStorage.removeItem(AUTO_SAVE_KEY); // Clear auto-save draft
        showToast("Content cleared!");
    }
    clearBtn.addEventListener("click", clearAll);

    // Initial load logic
    loadDarkModeSetting();
    loadDraft(); 
    renderHistory();
    // Typing animation for the header
    const fullText = "Advanced Image to Text Tool";
    let i = 0;
    function typeWriter() {
        if (i < fullText.length) {
            typingHeader.innerHTML += fullText.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    }
    typeWriter();

    // --- File Input & Cropper Initialization ---
    uploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => initCropper(e.target.result);
            reader.readAsDataURL(file);
        }
        fileInput.value = ''; // Reset file input
    });

    // --- Camera Logic ---
    cameraBtn.addEventListener("click", () => {
        cameraModal.classList.remove("hidden");
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                cameraFeed.srcObject = stream;
            })
            .catch((err) => {
                console.error("Camera access denied or failed: ", err);
                showToast("Camera access required to use this feature.");
                cameraModal.classList.add("hidden");
            });
    });

    captureBtn.addEventListener("click", () => {
        const canvas = document.createElement('canvas');
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);
        
        // Stop the camera stream
        const stream = cameraFeed.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        cameraModal.classList.add("hidden");
        
        // Send to cropper for final adjustments before OCR
        initCropper(canvas.toDataURL('image/jpeg'));
    });

    cancelCameraBtn.addEventListener("click", () => {
        const stream = cameraFeed.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        cameraModal.classList.add("hidden");
    });

    // --- Translation Logic ---
    translateBtn.addEventListener("click", async () => {
        const textToTranslate = resultDiv.textContent.trim();
        if (!textToTranslate) return showToast("No text to translate.");

        const targetLang = translationLangSelect.value;
        const sourceLang = ocrLangSelect.value;
        const translationLoader = loader;
        translationLoader.classList.add("show");
        translationLoader.querySelector('p').textContent = "Translating...";
        
        try {
            // Mock function call (actual implementation in services/translationService.js)
            const translatedText = await translateText(textToTranslate, targetLang, sourceLang);
            translatedResultDiv.textContent = translatedText;
            showToast("Translation successful!");
            saveToHistory(resultDiv.innerHTML, translatedText); // Save with new translation
        } catch (error) {
            console.error("Translation Error:", error);
            showToast("Translation failed. Check network connection or service limits.");
        } finally {
            translationLoader.classList.remove("show");
        }
    });

    // --- Download Logic (Requires jspdf library) ---
    downloadBtn.addEventListener("click", () => {
        if (!resultDiv.textContent.trim()) return showToast("Nothing to download.");
        downloadModal.classList.remove("hidden");
    });
    cancelDownloadBtn.addEventListener("click", () => downloadModal.classList.add("hidden"));

    downloadOptionsGrid.addEventListener("click", (e) => {
        let target = e.target.closest(".download-option");
        if (!target) return;

        const format = target.getAttribute("data-format");
        const originalText = resultDiv.textContent.trim();
        const translatedText = translatedResultDiv.textContent.trim();
        const finalContent = translatedText || originalText;

        if (!finalContent) {
            downloadModal.classList.add("hidden");
            return showToast("No content to download.");
        }

        const fileNameBase = "extracted_text";
        
        switch (format) {
            case "txt":
                const blob = new Blob([finalContent], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${fileNameBase}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast("TXT file generated!");
                break;
            case "pdf":
                // Uses jspdf (global variable jsPDF)
                if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
                    showToast("PDF generation library not loaded.");
                    return;
                }
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setFontSize(12);
                
                // Split text to fit in PDF pages
                const lines = doc.splitTextToSize(finalContent, 180);
                
                let y = 10;
                const lineSpacing = 7;
                const pageHeight = doc.internal.pageSize.height;
                
                lines.forEach(line => {
                    if (y > pageHeight - 20) {
                        doc.addPage();
                        y = 10; // Reset y coordinate for new page
                    }
                    doc.text(line, 10, y);
                    y += lineSpacing;
                });
                
                doc.save(`${fileNameBase}.pdf`);
                showToast("PDF file generated!");
                break;
            case "doc":
            case "other":
            default:
                showToast(`Download format ${format.toUpperCase()} is not yet supported.`, 3000);
                return; // Do not close modal for unsupported formats
        }
        downloadModal.classList.add("hidden");
    });

});
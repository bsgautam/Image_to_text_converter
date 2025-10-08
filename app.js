document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element Selection ---
  const uploadBtn = document.getElementById("uploadBtn");
  const cameraBtn = document.getElementById("cameraBtn");
  const fileInput = document.getElementById("fileInput");
  const resultDiv = document.getElementById("result");
  const darkModeToggle = document.getElementById("darkModeToggle");
  const typingHeader = document.getElementById("typing-header"); // For typing effect
  // Modals & Overlays
  const cropperModal = document.getElementById("cropperModal");
  const cameraModal = document.getElementById("cameraModal");
  const downloadModal = document.getElementById("downloadModal"); // Download Modal
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
  // Action Buttons
  const copyBtn = document.getElementById("copyBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const readOriginalBtn = document.getElementById("readOriginalBtn");
  const clearBtn = document.getElementById("clearBtn");
  // Translation
  const translateBtn = document.getElementById("translateBtn");
  const translatedResultDiv = document.getElementById("translatedResult");
  // History
  const historyBtn = document.getElementById("historyBtn");
  const historyPanel = document.getElementById("historyPanel");
  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  // Character Counters
  const resultCharCount = document.getElementById("resultCharCount");

  let cropper = null;
  let cameraStream = null;

  // --- Typing Effect Implementation ---
  const headerText = "Advanced Image to Text Tool";
  let charIndex = 0;
  let isDeleting = false;
  const typingSpeed = 100; // milliseconds
  const deletingSpeed = 50;
  const pauseBeforeDelete = 1500; // milliseconds

  function typeWriter() {
    const fullText = headerText;
    let delay = typingSpeed;

    if (isDeleting) {
      charIndex--;
      delay = deletingSpeed;
    } else {
      charIndex++;
    }

    typingHeader.textContent = fullText.substring(0, charIndex);

    if (!isDeleting && charIndex === fullText.length) {
      isDeleting = true;
      delay = pauseBeforeDelete;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      // Loop is automatic as the function calls itself
    }

    setTimeout(typeWriter, delay);
  }

  // Start the typing effect
  typeWriter();

  // --- Event Listeners ---
  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
  cameraBtn.addEventListener("click", startCamera);
  darkModeToggle.addEventListener("click", () =>
    document.body.classList.toggle("dark-mode")
  );

  // Modal Controls
  cancelCropBtn.addEventListener("click", closeCropper);
  confirmCropBtn.addEventListener("click", processCroppedImage);
  captureBtn.addEventListener("click", captureImage);
  cancelCameraBtn.addEventListener("click", closeCamera);
  cancelDownloadBtn.addEventListener("click", () =>
    downloadModal.classList.remove("show")
  );

  // Action Controls
  clearBtn.addEventListener("click", clearAll);

  // Updated: Copy button uses feedback function
  copyBtn.addEventListener("click", () =>
    copyToClipboard(resultDiv.textContent)
  );
  // Updated: Download button shows modal
  downloadBtn.addEventListener("click", () => {
    if (resultDiv.textContent.trim().length === 0) {
      return showToast("No text to download.");
    }
    downloadModal.classList.add("show");
  });
  // Handle download option selection
  downloadOptionsGrid.addEventListener("click", handleDownloadSelection);

  readOriginalBtn.addEventListener("click", () =>
    speakText(resultDiv.textContent, "en-US")
  );
  resultDiv.addEventListener("input", () =>
    updateCharCount(resultDiv, resultCharCount)
  );

  // Translation & History Controls
  translateBtn.addEventListener("click", performTranslation);
  historyBtn.addEventListener("click", () =>
    historyPanel.classList.toggle("show")
  );
  clearHistoryBtn.addEventListener("click", clearHistory);

  // --- Button Feedback Function ---
  function showButtonFeedback(button, message) {
    const defaultHtml = button.getAttribute("data-default-html");
    if (!defaultHtml) return;

    button.classList.add("success");
    // Checkmark SVG for success
    button.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg><span>${message}</span>`;

    // Revert button after 1.5 seconds
    setTimeout(() => {
      button.classList.remove("success");
      button.innerHTML = defaultHtml;
    }, 1500);
  }

  // --- Download Handling ---
  function handleDownloadSelection(e) {
    const option = e.target.closest(".download-option");
    if (!option) return;

    const format = option.getAttribute("data-format");
    const text = resultDiv.textContent;
    downloadModal.classList.remove("show");

    if (!text) return showToast("No text to download.");

    switch (format) {
      case "txt":
        downloadText(text, "extracted-text.txt");
        break;
      case "pdf":
        downloadPDF(text, "extracted-text.pdf");
        break;
      case "docx":
        downloadDOCX(text, "extracted-text.doc"); // Use .doc for compatibility
        break;
      default:
        showToast("Unsupported file format.");
        break;
    }
  }

  function downloadText(text, filename) {
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showButtonFeedback(downloadBtn, "Downloaded");
  }

  // New Function: Download PDF using jsPDF
  function downloadPDF(text, filename) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      return showToast("PDF library not ready. Try again.");
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set font to a web-safe monospace font or a standard font that supports many characters
    // Note: Full Unicode/Hindi support requires font embedding, but we'll use a basic font here.
    doc.setFont("courier");

    // Split text into lines to fit page width (180mm width standard)
    const lines = doc.splitTextToSize(text, 180);
    let y = 10;

    lines.forEach((line) => {
      if (y > 280) {
        // Page overflow check
        doc.addPage();
        y = 10;
      }
      doc.text(line, 10, y);
      y += 7; // Line height
    });

    doc.save(filename);
    showButtonFeedback(downloadBtn, "Downloaded");
  }

  // New Function: Download Word-compatible file
  function downloadDOCX(text, filename) {
    // Use a simple HTML-based blob to create a file with a .doc extension
    const content = `
                    <html>
                    <head>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${text}</pre>
                    </body>
                    </html>
                `;
    // Use 'application/msword' MIME type for compatibility
    const blob = new Blob([content], { type: "application/msword" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showButtonFeedback(downloadBtn, "Downloaded");
  }


  // --- Camera Functions ---
  async function startCamera() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        cameraFeed.srcObject = cameraStream;
        cameraModal.classList.add("show");
      } else {
        showToast("Your browser does not support camera access.");
      }
    } catch (err) {
      console.error("Camera Error:", err);
      showToast("Could not access the camera. Please grant permission.");
    }
  }

  function captureImage() {
    const canvas = document.createElement("canvas");
    canvas.width = cameraFeed.videoWidth;
    canvas.height = cameraFeed.videoHeight;
    canvas.getContext("2d").drawImage(cameraFeed, 0, 0);
    closeCamera();
    canvas.toBlob((blob) => handleFile(blob));
  }

  function closeCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    cameraModal.classList.remove("show");
  }

  // --- Cropper Functions ---
  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      imageToCrop.src = e.target.result;
      cropperModal.classList.add("show");
      if (cropper) cropper.destroy();
      cropper = new Cropper(imageToCrop, {
        viewMode: 1,
        background: false,
        autoCropArea: 0.9,
      });
    };
    reader.readAsDataURL(file);
    fileInput.value = ""; // Reset file input
  }

  function closeCropper() {
    cropperModal.classList.remove("show");
    if (cropper) cropper.destroy();
  }

  function processCroppedImage() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas();
    closeCropper();
    performOCR(canvas);
  }

  // --- Core OCR & Interactive Text ---
  async function performOCR(imageSource) {
    loader.classList.add("show");
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(imageSource, "eng");
      const interactiveText = createInteractiveText(text);
      resultDiv.innerHTML = interactiveText;
      updateCharCount(resultDiv, resultCharCount);
    } catch (err) {
      console.error(err);
      resultDiv.textContent = "Error during text recognition.";
      showToast("Could not recognize text.");
    } finally {
      loader.classList.remove("show");
    }
  }

  function createInteractiveText(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const phoneRegex =
      /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?[\d\s-]{7,10}/g;
    return text
      .replace(
        urlRegex,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      .replace(emailRegex, '<a href="mailto:$1">$1</a>')
      .replace(phoneRegex, '<a href="tel:$&">$&</a>');
  }

  // --- Translation ---
  async function performTranslation() {
    const textToTranslate = resultDiv.textContent.trim();
    if (!textToTranslate) return showToast("Nothing to translate.");
    translatedResultDiv.textContent = "Translating...";
    try {
      const translatedText = await translateText(textToTranslate, "hi", "en");
      translatedResultDiv.textContent = translatedText;
      saveToHistory(resultDiv.innerHTML, translatedText); // Save original HTML and translated text
    } catch (err) {
      translatedResultDiv.textContent = "Translation failed.";
      showToast("Translation error.");
    }
  }

  // --- Action & Helper Functions ---
  function clearAll() {
    resultDiv.innerHTML = "";
    translatedResultDiv.textContent = "";
    updateCharCount(resultDiv, resultCharCount);
    speechSynthesis.cancel();
    showToast("Cleared all fields.");
  }

  function updateCharCount(element, counterElement) {
    const count = element.textContent.length;
    counterElement.textContent = `${count} characters`;
  }

  async function copyToClipboard(text, message) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showButtonFeedback(copyBtn, "Copied");
      showToast("Original text copied!");
    } catch (e) {
      console.error("Clipboard write failed:", e);
      // Fallback for environments where navigator.clipboard is restricted
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showButtonFeedback(copyBtn, "Copied");
        showToast("Original text copied! (Fallback)");
      } catch (err) {
        console.error("Manual copy failed:", err);
        showToast("Failed to copy.");
      }
    }
  }

  function speakText(text, lang) {
    speechSynthesis.cancel();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      toast.addEventListener("transitionend", () => toast.remove());
    }, 3000);
  }

  // --- History Logic ---
  function getHistory() {
    return JSON.parse(localStorage.getItem("translationHistory")) || [];
  }

  function renderHistory() {
    const history = getHistory();
    historyList.innerHTML = history.length
      ? ""
      : '<li><div class="original-text">No history yet.</div></li>';
    history.forEach((item) => {
      const li = document.createElement("li");
      // Display plain text in history panel for cleanliness
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = item.originalHTML;
      li.innerHTML = `<div class="original-text">${tempDiv.textContent}</div><div class="translated-text">${item.translated}</div>`;
      li.addEventListener("click", () => {
        resultDiv.innerHTML = item.originalHTML; // Restore with links
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

  // Initial render of history on page load
  renderHistory();
});

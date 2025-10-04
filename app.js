// --- DOM Element Selection ---
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const preview = document.getElementById('preview');
const extractBtn = document.getElementById('extractBtn');
const result = document.getElementById('result');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const langSelect = document.getElementById('langSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const translateBtn = document.getElementById('translateBtn');
const translatedResult = document.getElementById('translatedResult');
const copyTranslationBtn = document.getElementById('copyTranslationBtn');
const readOriginalBtn = document.getElementById('readOriginalBtn');
const readTranslatedBtn = document.getElementById('readTranslatedBtn');
const historyBtn = document.getElementById('historyBtn');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
// NEW: Selectors for new elements
const loader = document.getElementById('loader');
const toastContainer = document.getElementById('toastContainer');
const resultCharCount = document.getElementById('resultCharCount');
const translatedCharCount = document.getElementById('translatedCharCount');

let selectedFile = null;

// --- Event Listeners ---
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag');
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
darkModeToggle.addEventListener("click", () => document.body.classList.toggle("dark-mode"));
extractBtn.addEventListener('click', performOCR);
clearBtn.addEventListener('click', clearAll);

// --- NEW: Character Count Listeners ---
result.addEventListener('input', () => updateCharCount(result, resultCharCount));
translatedResult.addEventListener('input', () => updateCharCount(translatedResult, translatedCharCount));

// --- Core Functions ---
function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Please select a valid image file.');
    return;
  }
  selectedFile = file;
  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.onload = () => URL.revokeObjectURL(url);
}

async function performOCR() {
  if (!selectedFile) {
    showToast('Please select an image first.');
    return;
  }
  loader.classList.add('show'); // Show loader
  try {
    const worker = await Tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(selectedFile);
    result.value = text;
    updateCharCount(result, resultCharCount); // Update count after OCR
    await worker.terminate();
  } catch (err) {
    console.error(err);
    result.value = 'Error: ' + err.message;
  } finally {
    loader.classList.remove('show'); // Hide loader
  }
}

function clearAll() {
  preview.src = '';
  selectedFile = null;
  result.value = '';
  translatedResult.value = '';
  fileInput.value = '';
  updateCharCount(result, resultCharCount);
  updateCharCount(translatedResult, translatedCharCount);
  speechSynthesis.cancel();
  showToast('Cleared all fields.');
}

// --- NEW: Toast Notification Function ---
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
  // Animate out and remove
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
}

// --- NEW: Character Count Function ---
function updateCharCount(textarea, counterElement) {
    const count = textarea.value.length;
    counterElement.textContent = `${count} characters`;
}

// --- Translation, History, and Speech Synthesis (with updated notifications) ---
const translationDictionary = { "hello": "नमस्ते", "good morning": "शुभ प्रभात", "how are you": "आप कैसे हैं", "thank you": "धन्यवाद", "please": "कृपया", "yes": "हाँ", "no": "नहीं" };
function translateToHindi(text) { /* Unchanged */ return text.toLowerCase().split(/[\s\n]+/).map(w => translationDictionary[w.replace(/[.,!?;:"']/g, '')] || w).join(' '); }
translateBtn.addEventListener('click', () => {
    const textToTranslate = result.value.trim();
    if (!textToTranslate) return showToast('Nothing to translate.');
    translatedResult.value = 'Translating...';
    setTimeout(() => {
        const translation = translateToHindi(textToTranslate);
        translatedResult.value = translation;
        updateCharCount(translatedResult, translatedCharCount);
        saveToHistory(textToTranslate, translation);
    }, 500);
});

copyBtn.addEventListener('click', () => copyToClipboard(result.value, 'Original text copied!'));
copyTranslationBtn.addEventListener('click', () => copyToClipboard(translatedResult.value, 'Translated text copied!'));
async function copyToClipboard(text, message) {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        showToast(message);
    } catch (e) { showToast('Failed to copy.'); }
}

downloadBtn.addEventListener('click', () => {
    if (!result.value) return;
    const blob = new Blob([result.value], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'extracted.txt';
    a.click();
});

function speakText(text, lang) {
  speechSynthesis.cancel();
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  speechSynthesis.speak(utterance);
}
readOriginalBtn.addEventListener('click', () => speakText(result.value, 'en-US'));
readTranslatedBtn.addEventListener('click', () => speakText(translatedResult.value, 'hi-IN'));

function getHistory() { return JSON.parse(localStorage.getItem('translationHistory')) || []; }
function renderHistory() { /* Unchanged */ }
function saveToHistory(original, translated) { /* Unchanged */ }
historyBtn.addEventListener('click', () => historyPanel.classList.toggle('show'));
clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('translationHistory');
    renderHistory();
    showToast('History cleared.');
});
document.addEventListener('DOMContentLoaded', renderHistory);
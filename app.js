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

// NEW: Get references for History elements
const historyBtn = document.getElementById('historyBtn');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

let selectedFile = null;

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag');
  const f = e.dataTransfer.files[0];
  if (f) handleFile(f);
});
fileInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (f) handleFile(f);
});
darkModeToggle.addEventListener("click", () => document.body.classList.toggle("dark-mode"));
extractBtn.addEventListener('click', async () => {
  if (!selectedFile) return alert('Please select an image first.');
  result.value = 'Recognizing text...';
  // ... (rest of OCR logic is unchanged)
  try {
    const worker = await Tesseract.createWorker({ logger: m => console.log(m) });
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(selectedFile);
    result.value = text;
    await worker.terminate();
  } catch (err) { console.error(err); result.value = 'Error: ' + err.message; }
});
copyBtn.addEventListener('click', async () => { /* unchanged */ });
downloadBtn.addEventListener('click', () => { /* unchanged */ });
clearBtn.addEventListener('click', () => {
  preview.src = '';
  selectedFile = null;
  result.value = '';
  fileInput.value = '';
  translatedResult.value = ''; 
  speechSynthesis.cancel();
});

// Translation Logic
const translationDictionary = {
    "hello": "नमस्ते", "good morning": "शुभ प्रभात", "how are you": "आप कैसे हैं",
    "thank you": "धन्यवाद", "please": "कृपया", "yes": "हाँ", "no": "नहीं",
    "water": "पानी", "food": "खाना", "friend": "दोस्त", "family": "परिवार",
    "love": "प्यार", "peace": "शांति", "beautiful": "सुंदर", "india": "भारत",
};
function translateToHindi(text) { /* unchanged */ }

translateBtn.addEventListener('click', () => {
    const textToTranslate = result.value.trim();
    if (!textToTranslate || textToTranslate.startsWith('Recognizing text...')) {
        return alert('Please extract some text first.');
    }
    translatedResult.value = 'Translating...';
    setTimeout(() => {
        const translation = translateToHindi(textToTranslate);
        translatedResult.value = translation;
        // NEW: Save the successful translation to history
        saveToHistory(textToTranslate, translation);
    }, 500);
});

copyTranslationBtn.addEventListener('click', async () => { /* unchanged */ });

// Text-to-Speech Logic
function speakText(text, lang) { /* unchanged */ }
readOriginalBtn.addEventListener('click', () => speakText(result.value, 'en-US'));
readTranslatedBtn.addEventListener('click', () => speakText(translatedResult.value, 'hi-IN'));

// --- NEW: HISTORY LOGIC ---

// Function to get history from localStorage
function getHistory() {
    return JSON.parse(localStorage.getItem('translationHistory')) || [];
}

// Function to render history items in the panel
function renderHistory() {
    const history = getHistory();
    historyList.innerHTML = ''; // Clear current list

    if (history.length === 0) {
        historyList.innerHTML = '<li><div class="original-text">No history yet.</div></li>';
        return;
    }

    history.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="original-text">${item.original}</div>
            <div class="translated-text">${item.translated}</div>
        `;
        // Add event listener to restore this item on click
        li.addEventListener('click', () => {
            result.value = item.original;
            translatedResult.value = item.translated;
            historyPanel.classList.remove('show'); // Hide panel after selection
        });
        historyList.appendChild(li);
    });
}

// Function to save a new item to history
function saveToHistory(original, translated) {
    let history = getHistory();
    // Add new item to the beginning of the array
    history.unshift({ original, translated });
    // Keep history limited to the last 20 items
    if (history.length > 20) {
        history = history.slice(0, 20);
    }
    // Save back to localStorage
    localStorage.setItem('translationHistory', JSON.stringify(history));
    // Re-render the history panel to show the new item
    renderHistory();
}

// Event listener to toggle the history panel
historyBtn.addEventListener('click', () => {
    historyPanel.classList.toggle('show');
});

// Event listener for the "Clear All" button
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all translation history?')) {
        localStorage.removeItem('translationHistory');
        renderHistory(); // Re-render the now-empty list
    }
});

// Initial render of history when the page loads
document.addEventListener('DOMContentLoaded', renderHistory);
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

// NEW: Get references for the new Text-to-Speech buttons
const readOriginalBtn = document.getElementById('readOriginalBtn');
const readTranslatedBtn = document.getElementById('readTranslatedBtn');

let selectedFile = null;

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

darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

function handleFile(file){
  if (!file.type.startsWith('image/')) return alert('Please select an image file.');
  selectedFile = file;
  const url = URL.createObjectURL(file);
  preview.src = url;
  preview.onload = () => URL.revokeObjectURL(url);
}

extractBtn.addEventListener('click', async () => {
  if (!selectedFile) return alert('Please select an image first.');
  result.value = 'Recognizing text... (this runs locally in your browser)';
  const lang = langSelect.value || 'eng';
  try {
    const worker = await Tesseract.createWorker({
      logger: m => console.log(m)
    });
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    const { data: { text } } = await worker.recognize(selectedFile);
    result.value = text;
    await worker.terminate();
  } catch (err) {
    console.error(err);
    result.value = 'Error: ' + err.message;
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(result.value);
    alert('Copied to clipboard!');
  } catch (e) {
    alert('Unable to copy: ' + e.message);
  }
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([result.value], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'extracted.txt';
  a.click();
});

clearBtn.addEventListener('click', () => {
  preview.src = '';
  selectedFile = null;
  result.value = '';
  fileInput.value = '';
  translatedResult.value = ''; 
  speechSynthesis.cancel(); // NEW: Stop any speech when clearing
});


// --- TRANSLATION LOGIC ---
const translationDictionary = {
    "hello": "नमस्ते", "good morning": "शुभ प्रभात", "how are you": "आप कैसे हैं",
    "thank you": "धन्यवाद", "please": "कृपया", "yes": "हाँ", "no": "नहीं",
    "water": "पानी", "food": "खाना", "friend": "दोस्त", "family": "परिवार",
    "love": "प्यार", "peace": "शांति", "beautiful": "सुंदर", "india": "भारत",
    "language": "भाषा", "translate": "अनुवाद करना", "computer": "कंप्यूटर",
    "internet": "इंटरनेट", "mobile": "मोबाइल", "book": "किताब", "pen": "कलम",
    "school": "स्कूल", "teacher": "शिक्षक", "student": "छात्र", "house": "घर",
    "car": "कार", "tree": "पेड़", "sun": "सूरज", "moon": "चाँद", "star": "तारा"
};

function translateToHindi(text) {
    if (!text) return '';
    const words = text.toLowerCase().split(/[\s\n]+/); 
    const translatedText = words.map(word => {
        const cleanWord = word.replace(/[.,!?;:"']/g, '');
        return translationDictionary[cleanWord] || word;
    }).join(' ');
    return translatedText;
}

translateBtn.addEventListener('click', () => {
    const textToTranslate = result.value;
    if (!textToTranslate || textToTranslate.startsWith('Recognizing text...')) {
        return alert('Please extract some text from an image first.');
    }
    translatedResult.value = 'Translating...';
    setTimeout(() => {
        const translation = translateToHindi(textToTranslate);
        translatedResult.value = translation;
    }, 500);
});

copyTranslationBtn.addEventListener('click', async () => {
    if (!translatedResult.value || translatedResult.value === 'Translating...') return;
    try {
        await navigator.clipboard.writeText(translatedResult.value);
        alert('Translated text copied to clipboard!');
    } catch (e) {
        alert('Unable to copy: ' + e.message);
    }
});


// --- NEW: TEXT-TO-SPEECH LOGIC ---

function speakText(text, lang) {
  // Stop any currently speaking utterance
  speechSynthesis.cancel();
  
  if (!text) return; // Don't speak if text is empty

  // Create a new speech utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set the language for correct pronunciation
  utterance.lang = lang;
  
  // Speak the text
  speechSynthesis.speak(utterance);
}

readOriginalBtn.addEventListener('click', () => {
  speakText(result.value, 'en-US'); // Language code for US English
});

readTranslatedBtn.addEventListener('click', () => {
  speakText(translatedResult.value, 'hi-IN'); // Language code for Hindi
});
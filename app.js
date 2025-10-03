const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const preview = document.getElementById('preview');
const extractBtn = document.getElementById('extractBtn');
const result = document.getElementById('result');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const langSelect = document.getElementById('langSelect');

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
    const worker = Tesseract.createWorker({
      logger: m => console.log(m)
    });
    await worker.load();
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
});

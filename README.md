# Image to Text Converter (Web App)

A simple client-side Image → Text converter using **Tesseract.js**. Drag & drop images, extract editable text right in the browser. No server required.

## Features
- Drag & drop or file picker image input
- Client-side OCR with Tesseract.js
- Language selection (English, Hindi, Spanish, French — add more via language codes)
- Preview image, copy text, download text file
- Demo screenshot included

## How to run
1. Unzip the folder.
2. Open `index.html` in a modern browser (Chrome/Edge/Firefox).
3. Click the drop area or drag an image, then click **Extract Text**.

## Notes
- OCR runs locally in the browser and uses CPU; large images may take time.
- To add more languages, include the appropriate Tesseract language traineddata (Tesseract will fetch it automatically when supported).


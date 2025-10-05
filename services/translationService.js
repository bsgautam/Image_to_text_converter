const FREE_TRANSLATE_API_URL = 'https://ftapi.pythonanywhere.com/translate';
const CORS_PROXY_BASE_URL = 'https://api.allorigins.win/get?cache=false&url=';

/**
 * Translates text using https://ftapi.pythonanywhere.com/ API with CORS 
 * @param {string} text - The text to translate
 * @param {string} targetLang - The target language code (e.g., 'hi' for Hindi)
 * @param {string} sourceLang - The source language code (default: 'en')
 * @returns {Promise<string>} - The translated text
 */
window.translateText = async function(text, targetLang = 'hi', sourceLang = 'en') {
    if (!text || text.trim() === '') {
        return '';
    }

    // Build GET request URL for the upstream API
    const apiUrl = `${FREE_TRANSLATE_API_URL}?sl=${encodeURIComponent(sourceLang)}&dl=${encodeURIComponent(targetLang)}&text=${encodeURIComponent(text)}`;

    try {
        const proxyUrl = `${CORS_PROXY_BASE_URL}${encodeURIComponent(apiUrl)}`;
        const proxyResponse = await fetch(proxyUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!proxyResponse.ok) {
            throw new Error(`Translation proxy error: ${proxyResponse.status}`);
        }

        const proxyPayload = await proxyResponse.json();
        if (!proxyPayload || typeof proxyPayload.contents !== 'string') {
            throw new Error('Unexpected proxy response format.');
        }

        const data = JSON.parse(proxyPayload.contents);
        return data["destination-text"] || 'Translation failed';
    } catch (error) {
        console.error('Translation error:', error);
        throw new Error('Unable to translate. Please check your internet connection.');
    }
}

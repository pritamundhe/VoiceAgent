import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Delay for a specified number of milliseconds.
 * @param {number} ms 
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates content using Gemini with exponential backoff for 429 errors.
 * 
 * @param {string} prompt The prompt to send to Gemini.
 * @param {Object} options Configuration options.
 * @param {string} options.model Name of the model (default: gemini-1.5-flash).
 * @param {number} options.maxRetries Maximum number of retries (default: 3).
 * @param {number} options.initialDelay Initial delay in ms (default: 2000).
 * @returns {Promise<string>} The generated text.
 */
export async function generateContentWithRetry(prompt, options = {}) {
    const {
        model: modelName = 'gemini-2.5-flash',
        maxRetries = 3,
        initialDelay = 2000
    } = options;

    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    let lastError;
    let currentDelay = initialDelay;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            lastError = error;
            
            // Check if it's a 429 (Too Many Requests) or 500/503 (Server Error)
            const isRetryable = error.status === 429 || error.status === 500 || error.status === 503 || 
                               (error.message && (error.message.includes('429') || error.message.includes('Too Many Requests')));

            if (isRetryable && i < maxRetries) {
                console.warn(`Gemini API Error (${error.status || 'Unknown'}). Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await delay(currentDelay);
                currentDelay *= 2; // Exponential backoff
                continue;
            }
            
            // If not retryable or reached max retries, throw
            console.error('Gemini API Error after retries or non-retryable:', error);
            throw error;
        }
    }
}

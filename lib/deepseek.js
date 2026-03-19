/**
 * Delay for a specified number of milliseconds.
 * @param {number} ms 
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates content using DeepSeek with exponential backoff for retryable errors.
 * 
 * @param {string} prompt The prompt to send to DeepSeek.
 * @param {Object} options Configuration options.
 * @param {string} options.model Name of the model (default: deepseek-chat).
 * @param {number} options.maxRetries Maximum number of retries (default: 3).
 * @param {number} options.initialDelay Initial delay in ms (default: 2000).
 * @returns {Promise<string>} The generated text.
 */
export async function generateDeepSeekContent(prompt, options = {}) {
    const {
        model = 'deepseek-chat',
        maxRetries = 3,
        initialDelay = 2000
    } = options;

    if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = 'https://api.deepseek.com/chat/completions';

    let lastError;
    let currentDelay = initialDelay;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const error = new Error(`DeepSeek API Error: ${errorData.error?.message || response.statusText}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            lastError = error;
            
            // Check if it's a retryable error (e.g., 429, 500, 503)
            const isRetryable = error.status === 429 || error.status === 500 || error.status === 503;

            if (isRetryable && i < maxRetries) {
                console.warn(`DeepSeek API Error (${error.status}). Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await delay(currentDelay);
                currentDelay *= 2; // Exponential backoff
                continue;
            }
            
            console.error('DeepSeek API Error after retries or non-retryable:', error);
            throw error;
        }
    }
}

/**
 * Delay for a specified number of milliseconds.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates content using OpenAI API via direct fetch (zero-dependency).
 * 
 * @param {string} prompt The prompt to send to OpenAI.
 * @param {Object} options Configuration options.
 * @param {string} options.model Name of the model (default: gpt-4o-mini).
 * @param {number} options.maxRetries Maximum number of retries (default: 3).
 * @param {number} options.initialDelay Initial delay in ms (default: 2000).
 * @returns {Promise<string>} The generated text.
 */
export async function generateOpenAIContent(prompt, options = {}) {
    const {
        model = 'gpt-4o-mini',
        maxRetries = 3,
        initialDelay = 2000
    } = options;

    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

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
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const error = new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            lastError = error;
            
            // Retryable errors: 429 (Rate Limit), 500, 503 (Server Errors)
            const isRetryable = error.status === 429 || error.status === 500 || error.status === 503;

            if (isRetryable && i < maxRetries) {
                console.warn(`OpenAI API Error (${error.status}). Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await delay(currentDelay);
                currentDelay *= 2; // Exponential backoff
                continue;
            }
            
            console.error('OpenAI API Error after retries or non-retryable:', error);
            throw error;
        }
    }
}

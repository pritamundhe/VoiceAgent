import dotenv from 'dotenv';
import { generateDeepSeekContent } from '../lib/deepseek.js';

dotenv.config();

async function testDeepSeek() {
    console.log('Testing DeepSeek API...');
    try {
        const prompt = 'Say "DeepSeek is working!" in a very enthusiastic way.';
        const response = await generateDeepSeekContent(prompt);
        console.log('Response from DeepSeek:', response);
    } catch (error) {
        console.error('DeepSeek Test Failed:', error);
    }
}

testDeepSeek();

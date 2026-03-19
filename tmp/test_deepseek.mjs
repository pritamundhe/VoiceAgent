import dotenv from 'dotenv';
import { generateDeepSeekContent } from '../lib/deepseek.js';

dotenv.config();

async function testDeepSeek() {
    process.stdout.write('Testing DeepSeek API...\n');
    try {
        const prompt = 'Say "DeepSeek is working!" in a very enthusiastic way.';
        const response = await generateDeepSeekContent(prompt);
        process.stdout.write(`Response from DeepSeek: ${response}\n`);
    } catch (error) {
        process.stderr.write(`DeepSeek Test Failed: ${error.message}\n`);
    }
}

testDeepSeek();

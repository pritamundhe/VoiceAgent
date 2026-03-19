import https from 'https';
import querystring from 'querystring';

export async function POST(request) {
    try {
        const { text } = await request.json();
        if (!text || !text.trim()) {
            return Response.json({ matches: [] });
        }

        const bodyData = querystring.stringify({
            text,
            language: 'en-US',
            disabledRules: 'WHITESPACE_RULE,PUNCTUATION_PARAGRAPH_END'
        });

        const options = {
            hostname: 'api.languagetool.org',
            path: '/v2/check',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(bodyData)
            }
        };

        const matches = await new Promise((resolve, reject) => {
            const ltReq = https.request(options, (ltRes) => {
                let raw = '';
                ltRes.on('data', (chunk) => raw += chunk);
                ltRes.on('end', () => {
                    try {
                        const data = JSON.parse(raw);
                        resolve(data.matches || []);
                    } catch (e) {
                        resolve([]);
                    }
                });
            });

            ltReq.on('error', (e) => {
                console.error('LanguageTool error:', e.message);
                resolve([]);
            });

            ltReq.write(bodyData);
            ltReq.end();
        });

        return Response.json({ matches });

    } catch (error) {
        console.error('Grammar API failure:', error);
        return Response.json({ matches: [] });
    }
}

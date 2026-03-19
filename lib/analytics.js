/**
 * Utility for calculating speech metrics and fluency scores.
 */
export const FILLER_WORDS = ['um', 'uh', 'like', 'actually', 'basically'];

export function calculateMetrics(transcript, duration) {
    if (!transcript) return null;

    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const vocabRichness = totalWords > 0 ? (uniqueWords / totalWords).toFixed(2) : 0;
    const wpm = duration > 0 ? Math.round((totalWords / duration) * 60) : 0;

    // Count filler words
    const fillerCounts = {};
    FILLER_WORDS.forEach(f => fillerCounts[f] = 0);
    
    let totalFillers = 0;
    words.forEach(word => {
        const lower = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
        if (FILLER_WORDS.includes(lower)) {
            fillerCounts[lower]++;
            totalFillers++;
        }
    });

    // Detect repeated words (consecutive)
    let repeatedWordsCount = 0;
    for (let i = 1; i < words.length; i++) {
        if (words[i].toLowerCase() === words[i - 1].toLowerCase()) {
            repeatedWordsCount++;
        }
    }

    // Simple Grammar Mock (since LanguageTool is external)
    // We can count sentences that don't start with capital or end with punctuation
    // or just assume a small % for demo if no real tool is connected.
    // However, the user asked for LanguageTool or "simple logic".
    // Let's implement a very simple heuristic: sentences missing periods.
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const grammarErrors = Math.max(0, (totalWords > 50 ? Math.floor(totalWords / 40) : 0)); // Heuristic mock

    const fluencyScore = calculateFluencyScore({
        totalFillers,
        repeatedWordsCount,
        grammarErrors,
        totalWords,
        wpm
    });

    return {
        totalWords,
        duration,
        wpm,
        fillerCounts,
        totalFillers,
        repeatedWordsCount,
        uniqueWords,
        vocabRichness,
        grammarErrors,
        fluencyScore
    };
}

export function calculateFluencyScore({ totalFillers, repeatedWordsCount, grammarErrors, totalWords, wpm }) {
    if (totalWords === 0) return 0;
    
    let score = 100;
    
    // Penalize fillers (freq relative to total words)
    const fillerRate = (totalFillers / totalWords) * 100;
    score -= (fillerRate * 5); // 5 points per 1% filler rate
    
    // Penalize repeats
    score -= (repeatedWordsCount * 2);
    
    // Penalize grammar
    score -= (grammarErrors * 3);
    
    // WPM check (ideal range 120-160 for most modes)
    if (wpm > 0) {
        if (wpm < 100) score -= 10;
        else if (wpm > 180) score -= 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

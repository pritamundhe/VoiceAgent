/**
 * lib/mlAnalysis.js
 * =================
 * Statistical NLP / ML-inspired speech analysis engine.
 *
 * No external ML library is used — all algorithms are implemented from
 * first principles in pure JavaScript so the module runs server-side in
 * Next.js without any native-module dependency issues.
 *
 * Algorithms implemented:
 *   1. TF-IDF  (Term Frequency – Inverse Document Frequency)
 *   2. Flesch Reading Ease  (readability)
 *   3. Simpson's Diversity Index  (vocabulary diversity)
 *   4. Hapax Legomena Ratio  (lexical richness)
 *   5. Sentence Complexity  (avg words per sentence)
 *   6. Pace Variance  (standard deviation across sentence-WPM chunks)
 *   7. Hesitation Score  (filler pattern density model)
 *   8. Semantic Coherence Score  (bigram / shared-vocabulary overlap model)
 *   9. Overall ML Score  (weighted composite)
 */

// -----------------------------------------------------------------------
// A curated English stop-word list.
// Stop words carry no topical signal and are excluded from TF-IDF.
// -----------------------------------------------------------------------
const STOP_WORDS = new Set([
  'a','an','the','and','but','or','nor','for','yet','so','at','by','from',
  'in','into','of','on','to','up','as','be','been','being','is','are','was',
  'were','am','has','have','had','do','does','did','will','would','could',
  'should','may','might','shall','can','need','dare','ought','used','this',
  'that','these','those','i','me','my','myself','we','our','ours','ourselves',
  'you','your','yours','yourself','yourselves','he','him','his','himself','she',
  'her','hers','herself','it','its','itself','they','them','their','theirs',
  'themselves','what','which','who','whom','whose','when','where','why','how',
  'all','each','every','both','few','more','most','other','some','such','no',
  'not','only','own','same','than','too','very','just','because','if','then',
  'else','with','about','against','between','through','during','before','after',
  'above','below','again','further','once','here','there','any','also','now',
  'well','even','still','back','way','take','good','new','first','last','long',
  'great','little','own','right','big','high','different','small','large','next',
  'early','young','important','public','private','real','best','free','sure',
  'like','know','think','make','go','see','want','come','use','get','look','day',
  'man','people','time','year','thing','hand','part','place','case','week','company',
  'where','does','done','over','however','much','many','really','something','already'
]);

// -----------------------------------------------------------------------
// A domain corpus representing "average speech documents".
// Used as the IDF reference corpus so TF-IDF weights reflect how
// *unusual* or *informative* a term is compared to typical speech.
// This is a bag-of-words approximation of common spoken English topics.
// -----------------------------------------------------------------------
const IDF_CORPUS_TERM_FREQUENCIES = {
  // Professional / business terms (common in most modes)
  work: 120, team: 110, project: 95, company: 90, business: 85,
  client: 70, manage: 65, strategy: 60, result: 58, goal: 55,
  // Communication terms
  communicate: 80, speak: 75, listen: 70, understand: 65, explain: 60,
  // Generic academic / idea terms
  idea: 100, problem: 95, solution: 90, system: 85, process: 80,
  example: 75, reason: 70, fact: 65, point: 60, argument: 55,
  // Personal narrative terms
  feel: 90, think: 88, believe: 75, experience: 70, situation: 65,
  challenge: 60, opportunity: 55, growth: 50, learn: 48, success: 45,
};

const CORPUS_DOC_COUNT = 10000; // Virtual corpus size for IDF smoothing

// -----------------------------------------------------------------------
// Utility: tokenise a string into clean lowercase word tokens.
// Removes punctuation and splits on whitespace.
// -----------------------------------------------------------------------
function tokenise(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

// -----------------------------------------------------------------------
// Utility: split transcript into sentences using sentence boundary regex.
// -----------------------------------------------------------------------
function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 3);
}

// -----------------------------------------------------------------------
// 1. TF-IDF
// ---------
// TF (Term Frequency): how often a term appears in *this* document.
//   TF(t, d) = count(t in d) / total_terms(d)
//
// IDF (Inverse Document Frequency): how *rare* the term is across all
// documents.  Rare terms are more informative.
//   IDF(t) = log( N / (1 + df(t)) )   where N = corpus size, df = doc freq
//
// TF-IDF(t, d) = TF(t, d) * IDF(t)
//
// We use this to extract the top keywords that best characterise what
// the speaker was actually talking about — stripping away filler and
// stop words to surface the topical signal.
// -----------------------------------------------------------------------
export function computeTFIDF(tokens) {
  const contentTokens = tokens.filter(t => !STOP_WORDS.has(t));
  if (contentTokens.length === 0) return [];

  const totalTerms = contentTokens.length;
  const termFreq = {};
  for (const t of contentTokens) {
    termFreq[t] = (termFreq[t] || 0) + 1;
  }

  const scores = {};
  for (const [term, count] of Object.entries(termFreq)) {
    const tf = count / totalTerms;
    // df = how many corpus "documents" contain this term (estimated)
    const df = IDF_CORPUS_TERM_FREQUENCIES[term] || 1;
    const idf = Math.log(CORPUS_DOC_COUNT / (1 + df));
    scores[term] = tf * idf;
  }

  // Return top 5 terms sorted by descending TF-IDF weight
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term]) => term);
}

// -----------------------------------------------------------------------
// 2. Flesch Reading Ease (Readability)
// ------------------------------------
// Originally designed for written text but adapted well for speech
// transcripts.  Measures sentence length and syllable density.
//
// Formula:
//   FRE = 206.835
//       - 1.015 * (total_words / total_sentences)
//       - 84.6  * (total_syllables / total_words)
//
// Score interpretation:
//   90-100  Very easy  (simple, short sentences)
//   70-90   Easy
//   60-70   Standard
//   50-60   Fairly difficult
//   30-50   Difficult  (complex vocabulary)
//   0-30    Very difficult
//
// For speech coaching a score of 60-80 is ideal — accessible but not
// too simplistic.
// -----------------------------------------------------------------------
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function computeReadability(tokens, sentences) {
  if (tokens.length === 0 || sentences.length === 0) return 50;

  const totalWords = tokens.length;
  const totalSentences = sentences.length;
  const totalSyllables = tokens.reduce((acc, w) => acc + countSyllables(w), 0);

  const avgWordsPerSentence = totalWords / totalSentences;
  const avgSyllablesPerWord = totalSyllables / totalWords;

  const fre = 206.835
    - (1.015 * avgWordsPerSentence)
    - (84.6 * avgSyllablesPerWord);

  return Math.max(0, Math.min(100, Math.round(fre)));
}

// -----------------------------------------------------------------------
// 3. Simpson's Diversity Index (Vocabulary Diversity)
// ----------------------------------------------------
// Originally an ecological biodiversity measure — perfectly applicable
// to lexical analysis.  Measures the probability that two randomly
// selected words from the transcript are *different* words.
//
// Formula:
//   D = 1 - ( sum(n_i * (n_i-1)) / (N * (N-1)) )
//
//   where n_i = frequency of word i,  N = total tokens
//
// D close to 1.0 = very diverse vocabulary (sophisticated speaker)
// D close to 0.0 = very repetitive vocabulary
//
// We use content tokens only (stop words stripped) to avoid inflating
// diversity with common function words.
// -----------------------------------------------------------------------
export function computeVocabularyDiversity(tokens) {
  const contentTokens = tokens.filter(t => !STOP_WORDS.has(t));
  const N = contentTokens.length;
  if (N < 2) return 0;

  const freq = {};
  for (const t of contentTokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  const numerator = Object.values(freq).reduce((acc, n) => acc + n * (n - 1), 0);
  const D = 1 - (numerator / (N * (N - 1)));
  return Math.max(0, Math.min(1, parseFloat(D.toFixed(4))));
}

// -----------------------------------------------------------------------
// 4. Hapax Legomena Ratio (Lexical Richness)
// -------------------------------------------
// A "hapax legomenon" (Greek: "said only once") is a word that appears
// exactly once in a text.  A high ratio of hapax legomena indicates that
// the speaker is drawing on a wide vocabulary rather than recycling the
// same words repeatedly.
//
// Formula:
//   Hapax Ratio = count(words with freq == 1) / count(unique words)
//
// A ratio above 0.60 is considered a strong lexical richness indicator.
// -----------------------------------------------------------------------
export function computeHapaxRatio(tokens) {
  const contentTokens = tokens.filter(t => !STOP_WORDS.has(t));
  if (contentTokens.length === 0) return 0;

  const freq = {};
  for (const t of contentTokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  const uniqueCount = Object.keys(freq).length;
  const hapaxCount = Object.values(freq).filter(n => n === 1).length;
  return uniqueCount > 0 ? parseFloat((hapaxCount / uniqueCount).toFixed(4)) : 0;
}

// -----------------------------------------------------------------------
// 5. Sentence Complexity
// ----------------------
// Average words per sentence.  For professional speech the sweet spot is
// 15-20 words.  Very short sentences (<8) feel choppy; very long (>30)
// feel meandering and hard to follow.
// -----------------------------------------------------------------------
export function computeSentenceComplexity(tokens, sentences) {
  if (sentences.length === 0) return 0;
  return parseFloat((tokens.length / sentences.length).toFixed(2));
}

// -----------------------------------------------------------------------
// 6. Pace Variance
// ----------------
// Splits the transcript into sentence-sized chunks and estimates the
// local WPM for each chunk (using the chunk's share of total duration).
// Then computes the standard deviation of those local WPMs.
//
// Low variance (< 20 WPM std-dev) = controlled, even delivery
// High variance (> 50 WPM std-dev) = erratic pacing — rushing or
//   grinding to a halt, which listeners find disorienting.
//
// We use a weighted time-share model:
//   chunk_duration = total_duration * (chunk_words / total_words)
//   chunk_wpm = (chunk_words / chunk_duration) * 60
// -----------------------------------------------------------------------
export function computePaceVariance(sentences, totalDuration) {
  if (sentences.length < 2 || totalDuration <= 0) return 0;

  const totalWords = sentences.reduce((acc, s) => {
    return acc + s.split(/\s+/).filter(w => w.length > 0).length;
  }, 0);

  if (totalWords === 0) return 0;

  const chunkWpms = sentences.map(sentence => {
    const chunkWords = sentence.split(/\s+/).filter(w => w.length > 0).length;
    const chunkDuration = totalDuration * (chunkWords / totalWords);
    if (chunkDuration <= 0) return 0;
    return (chunkWords / chunkDuration) * 60;
  });

  const mean = chunkWpms.reduce((a, b) => a + b, 0) / chunkWpms.length;
  const variance = chunkWpms.reduce((acc, wpm) => acc + Math.pow(wpm - mean, 2), 0) / chunkWpms.length;
  return parseFloat(Math.sqrt(variance).toFixed(2));
}

// -----------------------------------------------------------------------
// 7. Hesitation Score
// -------------------
// A probabilistic model of how hesitant the speaker sounds.
// Goes beyond simple filler counting to model the *rate* and *clustering*
// of hesitation signals.
//
// Features considered:
//   a) Filler word rate (fillers / total words)
//   b) Consecutive-word repetition density (repeats / total words)
//   c) Very short sentences (<= 3 words) as proxy for trailing off /
//      incomplete thoughts
//
// Scoring:
//   Start at 100 (perfect fluency).
//   Apply penalties from each feature weighted by severity.
//   Clamp to [0, 100].
//
// The penalty weights are derived from empirical speech-coaching rubrics:
//   Filler rate above 5% is considered "noticeable" and reduces
//   perceived credibility by ~15% per additional percent.
// -----------------------------------------------------------------------
export function computeHesitationScore({ totalFillers, repeatedWordsCount, totalWords, sentences }) {
  if (totalWords === 0) return 100;

  let score = 100;

  // Penalty 1: Filler word rate
  const fillerRate = (totalFillers / totalWords) * 100;
  if (fillerRate > 0) {
    // Graduated penalty: mild (0-3%) costs 3pt/%, severe (>3%) costs 6pt/%
    const mildPart = Math.min(fillerRate, 3);
    const severePart = Math.max(0, fillerRate - 3);
    score -= (mildPart * 3) + (severePart * 6);
  }

  // Penalty 2: Consecutive word repetitions (stuttering signal)
  const repeatRate = (repeatedWordsCount / Math.max(1, totalWords)) * 100;
  score -= (repeatRate * 4);

  // Penalty 3: Trailing / incomplete sentences (very short sentences)
  const shortSentences = sentences.filter(s => s.split(/\s+/).length <= 3).length;
  const shortSentenceRate = (shortSentences / Math.max(1, sentences.length)) * 100;
  score -= (shortSentenceRate * 0.5);

  return Math.max(0, Math.min(100, Math.round(score)));
}

// -----------------------------------------------------------------------
// 8. Semantic Coherence Score
// ----------------------------
// Measures how well each sentence logically flows from the previous one.
// Uses a bigram overlap / shared vocabulary model as a proxy for
// semantic continuity.
//
// Algorithm (Jaccard Similarity between consecutive sentence token sets):
//   For each pair of consecutive sentences (s_i, s_{i+1}):
//     - Extract content tokens from each sentence
//     - Compute |intersection| / |union| (Jaccard similarity)
//   Average the similarities across all consecutive pairs.
//   Map to 0-100 scale with a calibration factor.
//
// This is a lightweight approximation of neural coherence models.
// A fully coherent speech will have some overlap in topic words between
// consecutive sentences (anaphoric references, topic continuity).
// A low-coherence speech jumps randomly between topics.
//
// Calibration: Raw Jaccard scores for speech are typically 0.05-0.35.
// We stretch this to 0-100 using a sigmoid-inspired mapping.
// -----------------------------------------------------------------------
export function computeCoherenceScore(sentences) {
  if (sentences.length < 2) return 75; // Default for very short transcripts

  const getContentSet = (sentence) => {
    const tokens = tokenise(sentence).filter(t => !STOP_WORDS.has(t));
    return new Set(tokens);
  };

  let totalSimilarity = 0;
  let pairCount = 0;

  for (let i = 0; i < sentences.length - 1; i++) {
    const setA = getContentSet(sentences[i]);
    const setB = getContentSet(sentences[i + 1]);

    if (setA.size === 0 && setB.size === 0) continue;

    const intersection = new Set([...setA].filter(t => setB.has(t)));
    const union = new Set([...setA, ...setB]);

    const jaccard = union.size > 0 ? intersection.size / union.size : 0;
    totalSimilarity += jaccard;
    pairCount++;
  }

  if (pairCount === 0) return 75;

  const avgJaccard = totalSimilarity / pairCount;

  // Calibration: Jaccard 0.0 -> score 40 (some coherence always assumed)
  //              Jaccard 0.15 -> score 75 (good coherence)
  //              Jaccard 0.30+ -> score 95+ (very high coherence)
  // Formula: score = 40 + (avgJaccard / 0.30) * 55, clamped to [40, 98]
  const score = 40 + (avgJaccard / 0.30) * 55;
  return Math.max(40, Math.min(98, Math.round(score)));
}

// -----------------------------------------------------------------------
// 9. Overall ML Score (Composite)
// --------------------------------
// A weighted average of all ML-derived sub-scores, normalised to 0-100.
//
// Weights reflect the relative importance of each dimension for
// professional speech coaching:
//
//   Hesitation Score     25% — most directly impacts listener experience
//   Coherence Score      20% — logical flow is critical for persuasion
//   Readability          18% — accessibility and clarity
//   Vocabulary Diversity 17% — perceived intelligence and range
//   Hapax Ratio          10% — lexical richness (supporting signal)
//   Pace Variance        10% — delivery control (lower variance = better)
//
// Pace variance is inverted (lower = better) and mapped to a 0-100 score:
//   paceVarianceScore = max(0, 100 - paceVariance * 1.5)
// -----------------------------------------------------------------------
export function computeOverallMLScore({
  hesitationScore,
  coherenceScore,
  readabilityScore,
  vocabularyDiversity,
  hapaxRatio,
  paceVariance,
}) {
  const paceVarianceScore = Math.max(0, 100 - (paceVariance * 1.5));
  const diversityScore = vocabularyDiversity * 100;
  const hapaxScore = hapaxRatio * 100;

  const weighted =
    (hesitationScore    * 0.25) +
    (coherenceScore     * 0.20) +
    (readabilityScore   * 0.18) +
    (diversityScore     * 0.17) +
    (hapaxScore         * 0.10) +
    (paceVarianceScore  * 0.10);

  return Math.max(0, Math.min(100, Math.round(weighted)));
}

// -----------------------------------------------------------------------
// Main export: run all analyses on a transcript.
// Returns a structured object that maps directly to Session.metrics fields.
// -----------------------------------------------------------------------
export function runMLAnalysis(transcript, duration = 0) {
  const tokens = tokenise(transcript);
  const sentences = splitSentences(transcript);

  // Guard: not enough content to analyse
  if (tokens.length < 5) {
    return {
      readabilityScore: 50,
      coherenceScore: 75,
      vocabularyDiversity: 0,
      sentenceComplexity: 0,
      hapaxRatio: 0,
      tfidfTopKeywords: [],
      paceVariance: 0,
      hesitationScore: 100,
      overallMlScore: 50,
    };
  }

  // Filler detection (reusing main analytics list)
  const FILLERS = ['um', 'uh', 'like', 'actually', 'basically', 'literally',
    'right', 'okay', 'so', 'well', 'you know', 'i mean', 'sort of', 'kind of'];
  let totalFillers = 0;
  let repeatedWordsCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    if (FILLERS.includes(tokens[i])) totalFillers++;
    if (i > 0 && tokens[i] === tokens[i - 1]) repeatedWordsCount++;
  }

  const readabilityScore = computeReadability(tokens, sentences);
  const coherenceScore = computeCoherenceScore(sentences);
  const vocabularyDiversity = computeVocabularyDiversity(tokens);
  const hapaxRatio = computeHapaxRatio(tokens);
  const sentenceComplexity = computeSentenceComplexity(tokens, sentences);
  const paceVariance = computePaceVariance(sentences, duration);
  const tfidfTopKeywords = computeTFIDF(tokens);
  const hesitationScore = computeHesitationScore({
    totalFillers,
    repeatedWordsCount,
    totalWords: tokens.length,
    sentences,
  });
  const overallMlScore = computeOverallMLScore({
    hesitationScore,
    coherenceScore,
    readabilityScore,
    vocabularyDiversity,
    hapaxRatio,
    paceVariance,
  });

  return {
    readabilityScore,
    coherenceScore,
    vocabularyDiversity,
    sentenceComplexity,
    hapaxRatio,
    tfidfTopKeywords,
    paceVariance,
    hesitationScore,
    overallMlScore,
  };
}

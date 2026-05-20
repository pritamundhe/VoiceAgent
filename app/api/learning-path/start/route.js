import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import ModuleAttempt from '@/models/ModuleAttempt';
import jwt from 'jsonwebtoken';
import { generateOpenAIContent } from '@/lib/openai';
import { RANK_DIFFICULTY } from '@/lib/learningPathData';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

// ─── Fallback content (if AI fails) ────────────────────────────────────────
const FALLBACKS = {
  repeat: {
    type: 'repeat',
    topic: 'Sentence Repetition Practice',
    sentences: [
      'The morning sun rises over the quiet mountains.',
      'She enjoys cooking fresh meals for her family.',
      'The train arrives at the station every hour.',
      'He studies hard to improve his English skills.',
      'We walked together along the beach at sunset.',
      'Reading books every day expands your vocabulary.',
      'They decided to take a trip to the nearest lake.',
      'He found a small lost dog near the grocery store.',
      'I prefer drinking hot tea on a cold winter morning.',
      'Learning a new language opens up many opportunities.',
      'She forgot her umbrella and got completely soaked.',
      'The new restaurant downtown serves amazing pasta.',
      'It is important to drink plenty of water every day.',
      'The children laughed loudly while playing in the park.',
      'Music has the power to change a person’s mood.',
    ],
  },
  short: {
    type: 'short',
    topic: 'Quick Answer Challenge',
    questions: [
      { q: 'What color is the sky on a clear day?',  a: 'Blue'   },
      { q: 'How many days are in a week?',            a: 'Seven'  },
      { q: 'What is the capital of France?',          a: 'Paris'  },
      { q: 'Which planet do we live on?',             a: 'Earth'  },
      { q: 'How many months are in a year?',          a: 'Twelve' },
      { q: 'What do bees produce?',                   a: 'Honey'  },
      { q: 'What is the opposite of hot?',            a: 'Cold'   },
      { q: 'How many hours are in a day?',            a: 'Twenty-four' },
      { q: 'What do you use to write on a blackboard?', a: 'Chalk'  },
      { q: 'What freezes to form ice?',               a: 'Water'  },
      { q: 'Which animal is known as man’s best friend?', a: 'Dog' },
      { q: 'What is the color of an emerald?',        a: 'Green'  },
      { q: 'What covers the highest mountain peaks?', a: 'Snow'   },
      { q: 'What vehicle travels on railways?',       a: 'Train'  },
      { q: 'What do we breathe to stay alive?',       a: 'Air'    },
    ],
  },
  retell: {
    type: 'retell',
    topic: 'The Water Cycle',
    title: 'The Water Cycle',
    script:
      'Water is essential for all life on Earth. It moves in a ' +
      'continuous cycle through evaporation, condensation, and ' +
      'precipitation. When the sun heats water in oceans and rivers, ' +
      'it turns into water vapor and rises into the atmosphere. There ' +
      'it cools and forms clouds. Eventually, this water falls back to ' +
      'Earth as rain or snow, replenishing rivers and lakes. This cycle ' +
      'ensures that water is constantly renewed and available for living things.',
  },
  respond: {
    type: 'respond',
    topic: 'Ordering at a café',
    scenario:
      'You are at a café and the waiter is ready to take your order. ' +
      'You want a coffee and a sandwich. Speak your order to the waiter.',
  },
};

/**
 * POST /api/learning-path/start
 *
 * Generates a **personalized, dynamic prompt** for a learning-path module.
 * The prompt difficulty, vocabulary, and topic are tailored to:
 *   1. The user's current rank (Newbie → Master)
 *   2. Topics from recent sessions (to avoid repetition)
 *   3. Weak areas surfaced by past AI analysis (to target improvement)
 *   4. Number of previous attempts on THIS module (slight simplification after 3 failures)
 *
 * Body: { moduleId, taskType, part, levelId }
 * Returns: structured content object whose shape depends on taskType
 */
export async function POST(request) {
  try {
    await dbConnect();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId  = decoded.userId;

    const { moduleId, taskType, part, levelId } = await request.json();
    if (!moduleId || !taskType) {
      return Response.json(
        { error: 'moduleId and taskType are required' },
        { status: 400 }
      );
    }

    // ── 1. User context ────────────────────────────────────────────────
    const user = await User.findById(userId).select('rank streak xp');
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const rank       = user.rank || 'Newbie';
    const difficulty = RANK_DIFFICULTY[rank] || RANK_DIFFICULTY['Newbie'];

    // ── 2. Recent session topics — avoid repeating them ─────────────────
    const recentSessions = await Session
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(12)
      .select('aiAnalysis.topic prompt');

    const pastTopics = recentSessions
      .map(s => s.aiAnalysis?.topic || s.prompt)
      .filter(Boolean)
      .slice(0, 6);

    // ── 3. Weak areas from recent AI feedback — target them ─────────────
    const weakAreas = recentSessions
      .flatMap(s => s.aiAnalysis?.suggestions || [])
      .filter(Boolean)
      .slice(0, 3);

    // ── 4. Attempt history for this module ─────────────────────────────
    const prevAttempts  = await ModuleAttempt.countDocuments({ userId, moduleId });
    const attemptNumber = prevAttempts + 1;

    // After 3 failures, nudge AI toward slightly easier content
    const difficultyLabel = prevAttempts >= 3
      ? `slightly easier than ${difficulty.label}`
      : difficulty.label;

    // Helper strings for the AI prompts
    const avoidClause = pastTopics.length
      ? `AVOID repeating these recently used topics: ${pastTopics.join(' | ')}.`
      : '';
    const weakClause = weakAreas.length
      ? `The learner has been struggling with: ${weakAreas.slice(0, 2).join('; ')}.`
      : '';
    const freshClause = prevAttempts > 0
      ? `This is attempt ${attemptNumber} — choose a DIFFERENT topic and angle than before.`
      : '';

    // ══════════════════════════════════════════════════════════════════
    // PROMPT GENERATION — each taskType gets its own bespoke AI prompt
    // ══════════════════════════════════════════════════════════════════
    let generatedContent;

    // ── REPEAT THE SENTENCE ─────────────────────────────────────────
    if (taskType === 'repeat') {
      const aiPrompt = `You are an expert English pronunciation coach.
Generate exactly 15 unique sentences for a ${difficultyLabel}-level English speaker to listen to and repeat aloud.

Sentence requirements:
- Length: ${difficulty.sentenceWords} words each
- Language: ${difficulty.complexity}
- Topics: vary naturally across everyday life, nature, work, food, travel (one per sentence)
- Rhythm: each sentence must have natural spoken stress patterns
- NO abstract, political, or highly technical content
${avoidClause}
${weakClause}
${freshClause}

Output ONLY a raw JSON array of exactly 15 strings. No markdown, no explanation.
Example format: ["Sentence one here.", "Sentence two here.", ...]`;

      const raw     = await generateOpenAIContent(aiPrompt, { model: 'gpt-4o-mini' });
      const cleaned = raw.replace(/```json|```/g, '').trim();
      try {
        const sentences = JSON.parse(cleaned);
        generatedContent = { type: 'repeat', topic: 'Sentence Repetition Practice', sentences, attemptNumber };
      } catch {
        generatedContent = { ...FALLBACKS.repeat, attemptNumber };
      }
    }

    // ── ANSWER SHORT QUESTIONS ──────────────────────────────────────
    else if (taskType === 'short') {
      const aiPrompt = `You are a quiz master creating spoken-English practice questions.
Generate exactly 15 factual questions with a single clear answer (1-2 words maximum).

Requirements:
- Difficulty: ${difficulty.questionLevel}
- Each question must have ONE unambiguous short answer
- Vary topic areas: science, geography, history, nature, general knowledge
${avoidClause}
${freshClause}

Output ONLY a raw JSON array. No markdown, no explanation.
Format: [{"q": "What is the capital of France?", "a": "Paris"}, ...]`;

      const raw     = await generateOpenAIContent(aiPrompt, { model: 'gpt-4o-mini' });
      const cleaned = raw.replace(/```json|```/g, '').trim();
      try {
        const questions = JSON.parse(cleaned);
        generatedContent = { type: 'short', topic: 'Quick Answer Challenge', questions, attemptNumber };
      } catch {
        generatedContent = { ...FALLBACKS.short, attemptNumber };
      }
    }

    // ── RESPOND TO A SITUATION ──────────────────────────────────────
    else if (taskType === 'respond') {
      const levelContext = (levelId || 1) >= 4
        ? 'Require advanced reasoning and nuanced language.'
        : 'Keep it practical, realistic, and conversational.';

      const aiPrompt = `You are creating a spoken-English practice scenario.
Generate ONE realistic situation for a ${difficultyLabel}-level English speaker to respond to verbally.

Scenario type: ${difficulty.scenarioType}
${levelContext}
${avoidClause}
${weakClause}
${freshClause}

The scenario must:
- Be 2-3 sentences setting the scene
- End with a clear call-to-action telling the user exactly what to say
- Feel genuine and relatable, NOT abstract or hypothetical
- Total length: under 55 words

Output ONLY the scenario text. No quotes, no label, nothing else.`;

      const raw = await generateOpenAIContent(aiPrompt, { model: 'gpt-4o-mini' });
      const scenario = raw.trim();
      generatedContent = {
        type:     'respond',
        topic:    scenario.substring(0, 60).replace(/\.$/, '') + '…',
        scenario,
        attemptNumber,
      };
    }

    // ── RETELL LECTURE ──────────────────────────────────────────────
    else if (taskType === 'retell') {
      const targetWords = difficulty.lectureWords;

      const aiPrompt = `You are an English exam content creator specializing in PTE / TOEFL / IELTS speaking tasks.
Write a short lecture for a ${difficultyLabel}-level English learner to read, then retell in their own words.

Requirements:
- Exactly ${targetWords} words
- Vocabulary: ${difficulty.complexity}
- Structure: brief intro → 2 key points → short conclusion
- Natural spoken-academic English (as if a professor is explaining it simply)
${avoidClause}
${freshClause}

Output ONLY valid JSON (no markdown):
{"title": "Short Topic Title Here", "script": "Full lecture text here..."}`;

      const raw     = await generateOpenAIContent(aiPrompt, { model: 'gpt-4o-mini' });
      const cleaned = raw.replace(/```json|```/g, '').trim();
      try {
        const lecture = JSON.parse(cleaned);
        generatedContent = {
          type:  'retell',
          topic: lecture.title,
          title: lecture.title,
          script: lecture.script,
          attemptNumber,
        };
      } catch {
        generatedContent = { ...FALLBACKS.retell, attemptNumber };
      }
    }

    // ── GENERIC FALLBACK (describe, fitb, etc.) ─────────────────────
    else {
      const aiPrompt = `Generate a short, realistic English practice prompt for a ${difficultyLabel}-level learner.
Task type: ${taskType} | Section: ${part}
${avoidClause}
Output ONLY the prompt text, under 40 words. No labels or quotes.`;

      const raw = await generateOpenAIContent(aiPrompt, { model: 'gpt-4o-mini' });
      generatedContent = {
        type:         taskType,
        topic:        raw.trim().substring(0, 60),
        prompt:       raw.trim(),
        attemptNumber,
      };
    }

    console.log(
      `✅ [learning-path/start] Module ${moduleId} | Attempt ${attemptNumber} | ` +
      `Rank: ${rank} | TaskType: ${taskType}`
    );

    return Response.json({
      ...generatedContent,
      moduleId,
      taskType,
      part,
      levelId,
      userRank:   rank,
      difficulty: difficultyLabel,
    });

  } catch (err) {
    console.error('[learning-path/start] Error:', err);
    return Response.json({ error: 'Failed to generate module content' }, { status: 500 });
  }
}

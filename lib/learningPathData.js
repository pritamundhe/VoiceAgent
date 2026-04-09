// ════════════════════════════════════════════════════════
//  PART I — SPEAKING (15 minutes)
// ════════════════════════════════════════════════════════
export const SPEAKING_TASKS = {
  part: 'I',
  label: 'Speaking',
  duration: 15,
  color: '#5B6EF5',
  colorVar: 'var(--primary)',
  bgVar: 'var(--primary-subtle)',
  icon: 'Mic',
  evaluation: [
    { label: 'Content',       icon: 'FileText',      desc: 'Relevance, accuracy and completeness of your answer.' },
    { label: 'Pronunciation', icon: 'MessageCircle', desc: 'Clarity of phonemes, stress, rhythm and intonation.' },
    { label: 'Oral Fluency',  icon: 'Waves',         desc: 'Smoothness, pace and natural flow of speech.' },
  ],
  scoring: {
    type: 'scale',
    max: 5,
    description: 'Each task is evaluated on a scale of 0–5 for content, pronunciation, and fluency.',
    levels: [
      { score: '5', label: 'Native-like',  color: 'var(--accent-green)'  },
      { score: '4', label: 'Advanced',     color: 'var(--primary)'        },
      { score: '3', label: 'Proficient',   color: 'var(--accent-cyan)'   },
      { score: '2', label: 'Developing',   color: 'var(--accent-orange)' },
      { score: '1', label: 'Emerging',     color: 'var(--accent-pink)'   },
      { score: '0', label: 'No Response',  color: 'var(--text-muted)'    },
    ],
  },
  questionTypes: [
    { id: 'retell',   label: 'Retell Lecture',          icon: 'Headphones',    color: 'var(--accent-cyan)',   bg: 'var(--accent-cyan-bg)',   desc: 'Listen and re-tell a lecture in your own words.' },
    { id: 'repeat',   label: 'Repeat the Sentence',     icon: 'Repeat',        color: 'var(--accent-purple)', bg: 'var(--accent-purple-bg)', desc: 'Repeat a sentence exactly as you hear it.' },
    { id: 'respond',  label: 'Respond to a Situation',  icon: 'MessageSquare', color: 'var(--primary)',        bg: 'var(--primary-subtle)',   desc: 'Give a spoken response to a real-life scenario.' },
    { id: 'describe', label: 'Describe Image',          icon: 'Image',         color: 'var(--accent-orange)', bg: 'var(--accent-orange-bg)', desc: 'Describe a graph, chart, or image fluently in 40s.' },
    { id: 'short',    label: 'Answer Short Questions',  icon: 'Zap',           color: 'var(--accent-green)',  bg: 'var(--accent-green-bg)',  desc: 'Answer factual questions quickly and clearly.' },
  ],
};

// ════════════════════════════════════════════════════════
//  PART II — READING (30 minutes)
// ════════════════════════════════════════════════════════
export const READING_TASKS = {
  part: 'II',
  label: 'Reading',
  duration: 30,
  color: '#34D399',
  colorVar: 'var(--accent-green)',
  bgVar: 'var(--accent-green-bg)',
  icon: 'BookOpen',
  evaluation: [
    { label: 'Accuracy',        icon: 'Target', desc: 'Correctness of selected answers and identified information.' },
    { label: 'Comprehension',   icon: 'Puzzle', desc: 'Understanding of the passage meaning, context and tone.' },
  ],
  scoring: {
    type: 'mixed',
    description: 'Tasks are either awarded partial credit or marked correct/incorrect.',
    types: [
      { label: 'Partial Credit',      icon: 'PieChart',    color: 'var(--accent-orange)', desc: 'Awarded proportionally based on correct selections.' },
      { label: 'Correct/Incorrect',   icon: 'CheckCircle', color: 'var(--accent-green)',  desc: 'Full mark for correct answer, zero for incorrect.' },
    ],
  },
  questionTypes: [
    { id: 'mc-multi',  label: 'Multiple Choice (Multiple)',  icon: 'CheckSquare',   color: 'var(--accent-green)',  bg: 'var(--accent-green-bg)',  desc: 'Select all correct options from a list.' },
    { id: 'mc-single', label: 'Multiple Choice (Single)',    icon: 'ListChecks',    color: 'var(--accent-cyan)',   bg: 'var(--accent-cyan-bg)',   desc: 'Select the single best answer.' },
    { id: 'reorder',   label: 'Reorder Paragraphs',          icon: 'ArrowUpDown',   color: 'var(--primary)',        bg: 'var(--primary-subtle)',   desc: 'Arrange jumbled paragraphs in the correct order.' },
    { id: 'fitb-r',    label: 'Fill in the Blanks',          icon: 'FileEdit',      color: 'var(--accent-orange)', bg: 'var(--accent-orange-bg)', desc: 'Drag and drop words to complete the passage.' },
    { id: 'fitb-rw',   label: 'Fill in the Blanks (R&W)',    icon: 'PenTool',       color: 'var(--accent-purple)', bg: 'var(--accent-purple-bg)', desc: 'Read a text and fill blanks from a dropdown list.' },
  ],
};

// ════════════════════════════════════════════════════════
//  PART III — LISTENING (13 minutes)
// ════════════════════════════════════════════════════════
export const LISTENING_TASKS = {
  part: 'III',
  label: 'Listening',
  duration: 13,
  color: '#9B6BFF',
  colorVar: 'var(--accent-purple)',
  bgVar: 'var(--accent-purple-bg)',
  icon: 'Soundcloud', // or just Headphones, but to differentiate maybe AudioLines? Let's use AudioLines
  evaluation: [
    { label: 'Comprehension', icon: 'Puzzle', desc: 'Ability to understand spoken information, context and intent.' },
    { label: 'Accuracy',      icon: 'Target', desc: 'Correctness of written output and selected answers.' },
  ],
  scoring: {
    type: 'mixed',
    description: 'Mix of partial credit and correct/incorrect marks.',
    types: [
      { label: 'Partial Credit',     icon: 'PieChart',    color: 'var(--accent-orange)', desc: 'Points per correct word or selection in multi-answer tasks.' },
      { label: 'Correct/Incorrect',  icon: 'CheckCircle', color: 'var(--accent-purple)', desc: 'Binary scoring for single-answer tasks.' },
    ],
  },
  questionTypes: [
    { id: 'summarise', label: 'Summarise Spoken Text',       icon: 'ClipboardList', color: 'var(--accent-purple)', bg: 'var(--accent-purple-bg)', desc: 'Listen to a lecture and write a summary in 50–70 words.' },
    { id: 'mc-multi',  label: 'Multiple Choice (Multiple)',  icon: 'CheckSquare',   color: 'var(--accent-cyan)',   bg: 'var(--accent-cyan-bg)',   desc: 'Select multiple correct options from a recording.' },
    { id: 'dictation', label: 'Write from Dictation',        icon: 'Keyboard',      color: 'var(--primary)',        bg: 'var(--primary-subtle)',   desc: 'Type the exact sentence you hear from the recording.' },
    { id: 'fitb-l',    label: 'Fill in the Blanks',          icon: 'FileText',      color: 'var(--accent-orange)', bg: 'var(--accent-orange-bg)', desc: 'Fill missing words in a transcript while listening.' },
    { id: 'highlight', label: 'Highlight Correct Summary',   icon: 'MousePointer2', color: 'var(--accent-green)',  bg: 'var(--accent-green-bg)',  desc: 'Choose the paragraph that best summarises what you heard.' },
  ],
};

// ════════════════════════════════════════════════════════
//  LEARNING PATH — Levels 1–5
// ════════════════════════════════════════════════════════
export const LEARNING_PATH = [
  {
    level: 1,
    rankRequired: 'Newbie',
    title: 'Level 1: Foundation',
    subtitle: 'Core Mechanics',
    description: 'Master basic pronunciation, memory retention, and quick thinking.',
    targetMode: 'casual',
    modules: [
      {
        id: '1a', title: 'Repeat the Sentence',
        desc: 'Listen to a sentence and repeat it exactly as you hear it without hesitation.',
        part: 'speaking', taskType: 'repeat',
        scoringFocus: ['Pronunciation', 'Oral Fluency'],
        tip: 'Focus on stress patterns and connected speech to remember the sentence.',
      },
      {
        id: '1b', title: 'Answer Short Questions',
        desc: 'Answer brief, factual questions quickly and clearly with one or two words.',
        part: 'speaking', taskType: 'short',
        scoringFocus: ['Content', 'Oral Fluency'],
        tip: 'Do not overthink — give the most obvious, direct answer immediately.',
      },
      {
        id: '1c', title: 'Reading: Fill in the Blanks',
        desc: 'Practice basic comprehension with word-fill exercises from simple academic texts.',
        part: 'reading', taskType: 'fitb-r',
        scoringFocus: ['Accuracy', 'Comprehension'],
        tip: 'Read the full sentence before choosing — context is key.',
      },
    ]
  },
  {
    level: 2,
    rankRequired: 'Beginner',
    title: 'Level 2: Descriptive Speech',
    subtitle: 'Descriptive & Situational',
    description: 'Speak continuously and formulate appropriate contextual responses.',
    targetMode: 'storytelling',
    modules: [
      {
        id: '2a', title: 'Respond to a Situation',
        desc: 'Listen to a real-life scenario and give a natural spoken response.',
        part: 'speaking', taskType: 'respond',
        scoringFocus: ['Content', 'Oral Fluency'],
        tip: 'Treat it like a real conversation. Be direct and polite.',
      },

      {
        id: '2c', title: 'Listening: Write from Dictation',
        desc: 'Listen to short sentences and transcribe them accurately.',
        part: 'listening', taskType: 'dictation',
        scoringFocus: ['Accuracy', 'Comprehension'],
        tip: 'Focus on function words and word boundaries.',
      },
    ]
  },
  {
    level: 3,
    rankRequired: 'Intermediate',
    title: 'Level 3: Analysis & Summary',
    subtitle: 'PTE / TOEFL Integrated',
    description: 'Analyze images, summarize lectures, and describe information under timed conditions.',
    targetMode: 'interview',
    modules: [
      {
        id: '3a', title: 'Retell Lecture',
        desc: 'Listen to a short academic lecture and summarize the main points in your own words.',
        part: 'speaking', taskType: 'retell',
        scoringFocus: ['Content', 'Pronunciation', 'Oral Fluency'],
        tip: 'Take notes on verbs and key nouns — do not try to write every word.',
      },
      {
        id: '3c', title: 'Reading: Reorder Paragraphs',
        desc: 'Restore jumbled academic paragraphs to a logical sequence.',
        part: 'reading', taskType: 'reorder',
        scoringFocus: ['Comprehension', 'Accuracy'],
        tip: 'Find the topic sentence first — it usually introduces the theme.',
      },
      {
        id: '3d', title: 'Listening: Highlight Correct Summary',
        desc: 'Select the paragraph that best summarizes what you heard.',
        part: 'listening', taskType: 'highlight',
        scoringFocus: ['Comprehension', 'Accuracy'],
        tip: 'Eliminate options with extreme or exaggerated claims.',
      },
    ]
  },
  {
    level: 4,
    rankRequired: 'Advanced',
    title: 'Level 4: Advanced Discussion',
    subtitle: 'IELTS Part 3 & PTE Advanced',
    description: 'Master abstract two-way discussion, multi-answer reading, and spoken text summarisation.',
    targetMode: 'public-speaking',
    modules: [
      {
        id: '4a', title: 'Evaluating & Comparing',
        desc: 'Discuss advantages and disadvantages of modern technological trends.',
        part: 'speaking', taskType: 'respond',
        scoringFocus: ['Content', 'Oral Fluency'],
        tip: 'Use discourse markers: "On one hand... however..."',
      },
      {
        id: '4b', title: 'Speculating the Future',
        desc: 'Answer about how society might change in the next 50 years.',
        part: 'speaking', taskType: 'short',
        scoringFocus: ['Content', 'Pronunciation'],
        tip: 'Use hedging: "It is likely that... / might / could..."',
      },
      {
        id: '4c', title: 'Reading: Multiple Choice (Multiple)',
        desc: 'Identify multiple correct ideas from complex academic paragraph.',
        part: 'reading', taskType: 'mc-multi',
        scoringFocus: ['Comprehension', 'Accuracy'],
        tip: 'Scan for keywords — each correct answer is worth partial credit.',
      },
      {
        id: '4d', title: 'Listening: Summarise Spoken Text',
        desc: 'Write a 50–70 word summary of a 60–90 second academic lecture.',
        part: 'listening', taskType: 'summarise',
        scoringFocus: ['Comprehension', 'Accuracy'],
        tip: 'Structure: main idea → 2 key points → conclusion.',
      },
    ]
  },
  {
    level: 5,
    rankRequired: 'Expert',
    title: 'Level 5: Full Exam Mastery',
    subtitle: 'Complete IELTS / TOEFL / PTE Mock',
    description: 'Combine all skills for full-length mock scenarios. Eliminate filler words, use advanced vocabulary, and perfect your pacing.',
    targetMode: 'interview',
    modules: [
      {
        id: '5a', title: 'Full IELTS Speaking Mock',
        desc: 'Complete Parts 1, 2, and 3 back-to-back with the AI examiner.',
        part: 'speaking', taskType: 'respond',
        scoringFocus: ['Content', 'Pronunciation', 'Oral Fluency'],
        tip: 'Aim for Band 7+. Avoid repetition and filler words.',
      },
      {
        id: '5b', title: 'TOEFL Speaking Challenge',
        desc: 'Simulate back-to-back TOEFL speaking tasks under pressure.',
        part: 'speaking', taskType: 'retell',
        scoringFocus: ['Content', 'Pronunciation', 'Oral Fluency'],
        tip: '15s prep, 45s response — be concise and precise.',
      },
      {
        id: '5c', title: 'PTE Reading: Full Section',
        desc: 'Complete all reading question types timed at 30 minutes.',
        part: 'reading', taskType: 'fitb-rw',
        scoringFocus: ['Accuracy', 'Comprehension'],
        tip: 'Manage your time — spend max 3 min per question.',
      },
      {
        id: '5d', title: 'PTE Listening: Full Section',
        desc: 'Tackle all listening task types in a 13-minute mock session.',
        part: 'listening', taskType: 'dictation',
        scoringFocus: ['Comprehension', 'Accuracy'],
        tip: 'Keep writing — do not pause for long during dictation.',
      },
    ]
  },
];

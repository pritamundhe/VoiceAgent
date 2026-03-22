export const LEARNING_PATH = [
  {
    level: 1,
    rankRequired: 'Newbie',
    title: 'Level 1: Foundation (IELTS Part 1 & PTE)',
    description: 'Start by mastering basic introductions, personal questions, and reading aloud with clear pronunciation.',
    targetMode: 'casual',
    modules: [
      { id: '1a', title: 'IELTS Part 1: About You', desc: 'Answer basic questions about your work, study, and hometown.' },
      { id: '1b', title: 'PTE Read Aloud', desc: 'Practice reading short paragraphs with natural pacing and intonation.' }
    ]
  },
  {
    level: 2,
    rankRequired: 'Beginner',
    title: 'Level 2: Descriptive Speech (IELTS Part 2 / TOEFL)',
    description: 'Learn to speak continuously for 1-2 minutes on a specific topic. Crucial for IELTS Cue Cards and TOEFL Independent tasks.',
    targetMode: 'storytelling',
    modules: [
      { id: '2a', title: 'IELTS Cue Card: Describe an Event', desc: 'Speak for 2 straight minutes about a memorable past event.' },
      { id: '2b', title: 'TOEFL Independent Speaking', desc: 'State your opinion on a familiar topic and provide structured reasons.' }
    ]
  },
  {
    level: 3,
    rankRequired: 'Intermediate',
    title: 'Level 3: Analysis & Summary (PTE / TOEFL)',
    description: 'Develop the ability to quickly analyze information, describe images, and summarize concepts under time pressure.',
    targetMode: 'interview',
    modules: [
      { id: '3a', title: 'PTE Describe Image', desc: 'Practice describing graphs, charts, and maps fluently in 40 seconds.' },
      { id: '3b', title: 'PTE Retell / TOEFL Integrated', desc: 'Listen to a short prompt and summarize the main points clearly.' }
    ]
  },
  {
    level: 4,
    rankRequired: 'Advanced',
    title: 'Level 4: Advanced Discussion (IELTS Part 3)',
    description: 'Master two-way, abstract discussions. Learn to evaluate concepts, compare, and speculate on future trends.',
    targetMode: 'public-speaking',
    modules: [
      { id: '4a', title: 'Evaluating & Comparing', desc: 'Discuss the advantages and disadvantages of modern technological trends.' },
      { id: '4b', title: 'Speculating the Future', desc: 'Construct structured answers about how society might change in the next 50 years.' }
    ]
  },
  {
    level: 5,
    rankRequired: 'Expert',
    title: 'Level 5: Full Exam Mastery',
    description: 'Combine all skills for full-length mock scenarios. Focus on eliminating filler words, using advanced vocabulary, and perfect pacing.',
    targetMode: 'interview',
    modules: [
      { id: '5a', title: 'Full IELTS Speaking Mock', desc: 'Complete Parts 1, 2, and 3 back-to-back with the AI examiner.' },
      { id: '5b', title: 'TOEFL Speaking Challenge', desc: 'Simulate the pressure of back-to-back TOEFL speaking tasks.' }
    ]
  }
];

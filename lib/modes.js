export const MODES = [
    { 
        id: 'interview', icon: '💼', title: 'Job Interview', subtitle: 'Technical & Behavioral', 
        description: 'Practice behavioral and technical questions with real-time feedback.',
        className: 'card-dark',
        prompts: [
            "Tell me about a time you had to deal with a difficult teammate.",
            "What is your greatest professional achievement and why?",
            "How do you handle high-pressure situations and tight deadlines?",
            "Explain a technical concept you've mastered to a non-technical person.",
            "Where do you see yourself in five years?",
            "Describe a situation where you completely disagreed with your manager's decision.",
            "Tell me about a project that failed and what you learned from it.",
            "How do you prioritize your work when everything seems urgent?",
            "What makes you unique compared to other candidates applying for this role?",
            "Tell me about a time you went above and beyond for a customer or project."
        ]
    },
    { 
        id: 'public-speaking', icon: '🎤', title: 'Public', subtitle: 'Speaking', 
        description: 'Master your pacing, clarity, and confidence for the big stage.',
        className: 'card-light',
        prompts: [
            "Give a 2-minute introductory talk about the impact of AI on education.",
            "Practice your 'Thank You' speech for receiving a prestigious award.",
            "Deliver a short persuasive speech on why we should protect the environment.",
            "Explain the importance of public speaking in modern leadership.",
            "Tell an inspiring story about a person who changed your life.",
            "Give a brief keynote address on the importance of mental health in the workplace.",
            "Argue for or against the necessity of space exploration.",
            "Deliver an impassioned speech about the value of arts in schools.",
            "Present a TED-style talk on how failure drives innovation.",
            "Give a motivational speech to a team that just missed their biggest goal of the year."
        ]
    },
    { 
        id: 'pitch', icon: '🚀', title: 'Pitch', subtitle: 'Technical',
        description: 'Learn to explain complex concepts simply & persuasively.',
        className: 'card-dark',
        prompts: [
            "Pitch a new app idea that helps people manage their carbon footprint.",
            "Explain your current project's architecture in 60 seconds.",
            "Describe the 'Problem-Solution' fit for a new electric vehicle startup.",
            "Convince an investor why they should fund your AI-powered speech assistant.",
            "Briefly pitch your most recent open-source contribution.",
            "Pitch a blockchain solution for a non-financial industry like healthcare.",
            "Explain the value proposition of a SaaS tool targeting small local businesses.",
            "Pitch a revolutionary approach to personal data privacy in 1 minute.",
            "Describe how your new ed-tech platform solves the 1-to-many tutoring problem.",
            "Pitch an innovative IoT device for smart home security."
        ]
    },
    { 
        id: 'group-discussion', icon: '👥', title: 'Group Discussion', subtitle: 'Debate & Persuade',
        description: 'Practice structuring your thoughts for professional group discussions (GDs).',
        className: 'card-glass',
        prompts: [
            "Discuss the impact of AI replacing human jobs: Boom or Doom?",
            "Universal Basic Income: A necessity for the future economy or unrealistic?",
            "Return to Office vs. Remote Work: Which is better for long-term productivity?",
            "Social Media: Does it connect us or make us more isolated?",
            "Climate Change: Should the burden fall on governments, corporations, or individuals?",
            "Four-Day Work Week: Is it the future of work or a logistical nightmare?",
            "Data Privacy: Do citizens have a fundamental right to digital anonymity?",
            "The Gig Economy: Empowering for workers or inherently exploitative?",
            "Space Tourism: A waste of resources or the next frontier of human expansion?",
            "Censorship vs Free Speech: Where is the line for digital platforms?"
        ]
    },
    { 
        id: 'sales', icon: '💰', title: 'Sales Pitch', subtitle: 'Persuasion',
        description: 'Refine your energy and persuasion with dynamic pacing analysis.',
        className: 'card-light',
        prompts: [
            "Sell me this pen—focus on the experience, not the features.",
            "Convince a skeptic to switch from a traditional bank to a neo-bank.",
            "Pitch a premium subscription service to a long-time free user.",
            "Close a deal for a high-end software license with a large enterprise.",
            "Explain the ROI of your product to a CFO who is worried about costs.",
            "Persuade a local restaurant owner to adopt your new delivery platform.",
            "Sell a cutting-edge cybersecurity package to a company that's never been hacked.",
            "Convince a hesitant buyer to upgrade to a more expensive, higher-tier package.",
            "Overcome objections from a client who thinks your service is too expensive.",
            "Pitch the benefits of continuous professional training to an HR director."
        ]
    },
    { 
        id: 'storytelling', icon: '📖', title: 'Stories', subtitle: 'Emotional resonance',
        description: 'Enhance emotional resonance and variable pace for better impact.',
        className: 'card-dark',
        prompts: [
            "Tell a story that starts with 'I never thought I'd be here today...'",
            "Narrate a childhood memory that shaped who you are now.",
            "Describe a 'Hero's Journey' from your own life experiences.",
            "Tell a suspenseful story about getting lost in a new city.",
            "Share a story about a failure that eventually led to a major success.",
            "Describe a time when a spontaneous decision changed the course of your life.",
            "Tell a humorous story about a misunderstanding that escalated quickly.",
            "Narrate the most memorable encounter you've had with a stranger.",
            "Describe a historical event from the perspective of an ordinary bystander.",
            "Tell a story about a seemingly insignificant object that means the world to you."
        ]
    },
];

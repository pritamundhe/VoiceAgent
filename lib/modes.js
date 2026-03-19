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
            "Where do you see yourself in five years?"
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
            "Tell an inspiring story about a person who changed your life."
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
            "Briefly pitch your most recent open-source contribution."
        ]
    },
    { 
        id: 'casual', icon: '☕', title: 'Casual', subtitle: 'Chat',
        description: 'Improve your conversational flow and reduce filler words.',
        className: 'card-glass',
        prompts: [
            "Imagine you're meeting someone new at a coffee shop. Start a conversation.",
            "Describe your favorite hobby to a group of friends.",
            "Talk about your last vacation experience and what you loved most.",
            "Explain why you decided to become a software engineer.",
            "Tell a funny story about something that happened to you recently."
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
            "Explain the ROI of your product to a CFO who is worried about costs."
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
            "Share a story about a failure that eventually led to a major success."
        ]
    },
];

export const MODES = [
    { 
        id: 'interview', icon: '💼', title: 'Job Interview', subtitle: 'Technical & Behavioral', 
        description: 'Practice behavioral and technical questions with real-time feedback.',
        className: 'card-dark',
        image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800',
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
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800',
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
        image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800',
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
        image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800',
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
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800',
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
        image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800',
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
    { 
        id: 'negotiation', icon: '🤝', title: 'Negotiation', subtitle: 'Salary & Contracts',
        description: 'Practice asserting your value and finding win-win agreements.',
        className: 'card-glass',
        image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800',
        prompts: [
            "Negotiate a 15% salary increase with your manager during a performance review.",
            "Discuss terms with a freelance client who wants more work for the same budget.",
            "Negotiate an extended deadline for a critical project without losing trust.",
            "Convince a supplier to give you a 10% discount on a bulk order.",
            "Negotiate a flexible work-from-home schedule with HR.",
            "Decline a lowball job offer while leaving the door open for counter-offers.",
            "Discuss splitting equity with a potential startup co-founder.",
            "Negotiate better terms for a commercial lease agreement.",
            "Convince a team member to take on an unpopular task.",
            "Resolve a budget dispute between two departments."
        ]
    },
    { 
        id: 'networking', icon: '🍷', title: 'Networking', subtitle: 'Small Talk',
        description: 'Build confidence in initiating and maintaining professional conversations.',
        className: 'card-light',
        image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800',
        prompts: [
            "Introduce yourself to a key industry leader at a conference mixer.",
            "Start a conversation with a stranger sitting next to you on a business flight.",
            "Follow up on a mutual connection's introduction at a local meetup.",
            "Gracefully exit a conversation that has gone on too long at a networking event.",
            "Ask insightful questions to keep a conversation flowing with a quiet attendee.",
            "Introduce two professionals in your network who you believe should meet.",
            "Deliver a 30-second elevator pitch about your side hustle.",
            "Transition a casual chat about the weather into a business discussion.",
            "Ask for an informational interview from someone you admire.",
            "Reconnect with a former colleague you haven't spoken to in years."
        ]
    },
    { 
        id: 'media-interview', icon: '🎙️', title: 'Media Interview', subtitle: 'PR & Crisis',
        description: 'Navigate tough questions and stay on message under pressure.',
        className: 'card-dark',
        image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800',
        prompts: [
            "Respond to a journalist asking about a recent controversial decision by your company.",
            "Pivot away from a 'gotcha' question back to your core brand message.",
            "Give a concise soundbite explaining your new product launch.",
            "Address a public relations crisis regarding customer data privacy.",
            "Explain a complex scientific breakthrough to a general news audience.",
            "Handle a hostile interviewer trying to put words in your mouth.",
            "Apologize for a public mistake on behalf of your organization.",
            "Answer a question about rumors of a pending merger or acquisition.",
            "Frame bad financial results in a more optimistic, forward-looking light.",
            "Deliver an opening statement for a televised press conference."
        ]
    },
    { 
        id: 'conflict-resolution', icon: '⚖️', title: 'Conflict Resolution', subtitle: 'Workplace',
        description: 'De-escalate tension and communicate clearly during disagreements.',
        className: 'card-glass',
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
        prompts: [
            "Address a team member who is consistently interrupting others during meetings.",
            "Mediate a dispute between two colleagues fighting over project resources.",
            "Deliver difficult feedback to an underperforming employee.",
            "Apologize for a misunderstanding that caused a delay in a joint project.",
            "Respond to harsh, unwarranted criticism from a senior executive.",
            "Have a conversation with a manager who is micromanaging your work.",
            "Address a co-worker who took credit for your idea in a meeting.",
            "Calm down a frustrated customer who received terrible service.",
            "Discuss unequal workload distribution with your peer group.",
            "Confront someone about inappropriate workplace behavior professionally."
        ]
    },
    { 
        id: 'teaching', icon: '🎓', title: 'Teaching', subtitle: 'Explanation',
        description: 'Practice breaking down complex topics for learners of all levels.',
        className: 'card-light',
        image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
        prompts: [
            "Explain the concept of compound interest to a high school student.",
            "Teach a beginner how to ride a bicycle using only verbal instructions.",
            "Break down how the internet works to an elderly relative.",
            "Explain the difference between a virus and a bacteria.",
            "Give a 2-minute crash course on basic photography principles.",
            "Teach someone the rules of a complex board game.",
            "Explain the concept of 'supply and demand' using a simple analogy.",
            "Describe the water cycle to a classroom of 3rd graders.",
            "Teach a new employee how to use your company's internal software.",
            "Explain what a 'black hole' is in simple terms."
        ]
    },
    { 
        id: 'client-update', icon: '📊', title: 'Client Update', subtitle: 'Status Reports',
        description: 'Deliver clear, concise, and professional project updates to stakeholders.',
        className: 'card-dark',
        image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800',
        prompts: [
            "Deliver an end-of-week status update to a key client, highlighting a minor delay.",
            "Summarize the results of a recent marketing campaign to stakeholders.",
            "Explain a technical roadblock that will push back the launch date by two weeks.",
            "Present a mid-project review emphasizing cost savings and early wins.",
            "Bridge the gap between a client's unrealistic expectations and the project scope.",
            "Deliver a post-mortem report on a sprint that didn't go as planned.",
            "Walk a client through a newly implemented software feature.",
            "Provide reassurance during a period of significant project uncertainty.",
            "Explain to a client why their requested change order will increase costs.",
            "Wrap up a successful project and discuss opportunities for future collaboration."
        ]
    }
];

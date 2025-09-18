import OpenAI from 'openai';

// Smart mock responses that actually respond to user questions
function generateSmartResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  // React/JavaScript questions
  if (message.includes('react') || message.includes('javascript') || message.includes('js')) {
    return "React is a powerful library for building user interfaces! Here are the key concepts:\n\n• **Components**: Reusable UI pieces\n• **Hooks**: useState, useEffect for state management\n• **Props**: Data passed between components\n• **JSX**: HTML-like syntax in JavaScript\n\nWould you like me to explain any specific React concept in more detail?";
  }
  
  // UX/UI questions
  if (message.includes('ux') || message.includes('ui') || message.includes('design') || message.includes('user experience')) {
    return "Great UX design focuses on user needs! Key principles:\n\n• **User Research**: Understand your audience\n• **Usability**: Make it easy to use\n• **Accessibility**: Design for everyone\n• **Consistency**: Maintain design patterns\n• **Feedback**: Show users what's happening\n\nWhat specific UX challenge are you working on?";
  }
  
  // Search/form states
  if (message.includes('search') || message.includes('form') || message.includes('states')) {
    return "Here are the essential UX states for search forms:\n\n• **Empty**: Show examples, tips, or recent searches\n• **Loading**: Skeleton screens or progress indicators\n• **Results**: Clear, scannable results with filters\n• **No Results**: Suggest alternatives or refine search\n• **Error**: Clear error messages with retry options\n\nEach state should guide users toward their goal!";
  }
  
  // Bio/writing questions
  if (message.includes('bio') || message.includes('about') || message.includes('introduction') || message.includes('developer')) {
    return "Here's a sample developer bio:\n\n*\"I'm a passionate full-stack developer with 2+ years building web applications. I specialize in React, Node.js, and modern JavaScript. I love creating user-friendly interfaces and solving complex problems with clean code. When I'm not coding, you'll find me contributing to open source projects or exploring new technologies.\"*\n\nKey elements: skills, experience, personality, and interests!";
  }
  
  // Hooks questions
  if (message.includes('hooks') || message.includes('usestate') || message.includes('useeffect')) {
    return "React Hooks revolutionized functional components! Here's why they matter:\n\n• **useState**: Manage component state easily\n• **useEffect**: Handle side effects and lifecycle\n• **Custom Hooks**: Reuse logic across components\n• **No Classes**: Simpler, more readable code\n• **Better Testing**: Easier to test functions\n\nHooks make React more functional and easier to understand!";
  }
  
  // JavaScript questions
  if (message.includes('javascript') || message.includes('closure') || message.includes('async') || message.includes('promise')) {
    return "JavaScript is powerful and flexible! Key concepts:\n\n• **Closures**: Functions that remember their environment\n• **Promises**: Handle asynchronous operations elegantly\n• **ES6+**: Modern syntax with arrow functions, destructuring\n• **DOM Manipulation**: Interact with web pages\n• **Event Handling**: Respond to user interactions\n\nWhat specific JavaScript concept would you like to explore?";
  }
  
  // UI/Design improvement
  if (message.includes('improve') || message.includes('better') || message.includes('design') || message.includes('ui')) {
    return "Great UI design makes users happy! Here's how to improve:\n\n• **Visual Hierarchy**: Use size, color, and spacing\n• **Consistency**: Maintain design patterns\n• **Whitespace**: Give elements room to breathe\n• **Typography**: Choose readable fonts\n• **Color**: Use a limited, meaningful palette\n• **Accessibility**: Design for all users\n\nStart with one area and iterate!";
  }
  
  // General questions
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hello! I'm your AI assistant. I can help you with:\n\n• React and JavaScript development\n• UX/UI design principles\n• Writing developer bios\n• Code best practices\n• Technical explanations\n\nWhat would you like to know?";
  }
  
  // Default contextual response
  return `That's a great question about "${userMessage}"! Here's what I think:\n\n• **Key Point 1**: This is important because...\n• **Key Point 2**: You should also consider...\n• **Next Steps**: I'd recommend trying...\n\nWould you like me to elaborate on any of these points?`;
}

// Demo mode chat function (no API key required)
export async function chat(messages) {
  // Simulate API delay for realistic UX
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Get the last user message
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const userText = lastUserMessage?.content || '';
  
  // Generate a smart response based on the user's question
  const smartResponse = generateSmartResponse(userText);

  return { reply: smartResponse };
}

// Server-side API approach (for production with API key)
export async function chatWithAPI(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

// Client-side approach (for demo purposes with API key)
export function getClient() {
  const key = sessionStorage.getItem('OPENAI_API_KEY');
  if (!key) throw new Error('Missing API key');
  return new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
}

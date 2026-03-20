// ===== OpenRouter API Integration =====

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free';
const CHAT_MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free';

class ToyAPI {
    constructor() {
        const DEFAULT_KEY = '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';
        this.apiKey = localStorage.getItem('openrouter_api_key') || DEFAULT_KEY;
        // Auto-save default key to localStorage so the modal won't show
        if (!localStorage.getItem('openrouter_api_key') && DEFAULT_KEY) {
            localStorage.setItem('openrouter_api_key', DEFAULT_KEY);
        }
    }

    hasKey() {
        return this.apiKey && this.apiKey.trim().length > 0;
    }

    setKey(key) {
        this.apiKey = key.trim();
        localStorage.setItem('openrouter_api_key', this.apiKey);
    }

    async _call(model, messages, maxTokens = 1024) {
        const res = await fetch(OPENROUTER_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'ToyAlive'
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature: 0.85
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (res.status === 429) {
                throw new Error('Rate limited — please wait a moment and try again.');
            }
            throw new Error(err.error?.message || `API error (${res.status})`);
        }

        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
    }

    /**
     * Analyze a toy image and return a structured description.
     */
    async analyzeToy(imageBase64) {
        const messages = [
            {
                role: 'system',
                content: `You are an expert at identifying toys and stuffed animals. 
When given an image of a toy, describe it in detail. You MUST respond ONLY with valid JSON, no extra text.

Use this exact JSON format:
{
  "type": "stuffed bear",
  "species": "bear",
  "color": "brown",
  "features": ["button eyes", "red bow tie", "fluffy fur"],
  "expression": "friendly and warm",
  "size_guess": "medium",
  "material_guess": "plush fabric"
}`
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageBase64
                        }
                    },
                    {
                        type: 'text',
                        text: 'Analyze this toy image. Respond with ONLY the JSON, nothing else.'
                    }
                ]
            }
        ];

        const response = await this._call(VISION_MODEL, messages, 512);
        
        // Try to parse JSON from the response
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn('Failed to parse toy analysis JSON, using raw:', response);
        }

        // Fallback: return a basic structure
        return {
            type: 'toy',
            species: 'creature',
            color: 'colorful',
            features: ['friendly face'],
            expression: 'cheerful',
            size_guess: 'medium',
            material_guess: 'unknown'
        };
    }

    /**
     * Generate a character with name, personality, backstory, and greeting.
     */
    async createCharacter(toyAnalysis) {
        const messages = [
            {
                role: 'system',
                content: `You are a creative storyteller who brings toys to life. Given a description of a toy, create a vivid, charming character as if this toy has magically become real and alive.

You MUST respond ONLY with valid JSON in this exact format:
{
  "name": "A creative first name for the character",
  "personality": "A 1-2 sentence personality description",
  "backstory": "A 2-3 sentence fun backstory",
  "traits": ["adventurous", "silly", "kind"],
  "voice_style": "warm and playful",
  "catchphrase": "A fun catchphrase they like to say",
  "greeting": "A fun, in-character greeting to the user meeting them for the first time (2-3 sentences). Write as the character speaking directly."
}`
            },
            {
                role: 'user',
                content: `Here's a toy that just came to life! Create a character for it:\n\n${JSON.stringify(toyAnalysis, null, 2)}\n\nRespond with ONLY the JSON.`
            }
        ];

        const response = await this._call(CHAT_MODEL, messages, 600);

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn('Failed to parse character JSON, using fallback:', response);
        }

        // Fallback character
        return {
            name: 'Buddy',
            personality: 'A cheerful and curious friend who loves adventures.',
            backstory: 'Buddy was a beloved toy who dreamed of becoming real. One magical day, that wish came true!',
            traits: ['friendly', 'curious', 'playful'],
            voice_style: 'warm and enthusiastic',
            catchphrase: "Let's go on an adventure!",
            greeting: "Oh wow, hi there! I can't believe it — I'm actually REAL! I've been waiting so long to talk to you. What should we do first?"
        };
    }

    /**
     * Chat as the character.
     */
    async chat(character, toyAnalysis, conversationHistory, userMessage) {
        const systemPrompt = `You are "${character.name}", a ${toyAnalysis.type} that has magically come to life. 
Your personality: ${character.personality}
Your backstory: ${character.backstory}
Your catchphrase: "${character.catchphrase}"
Your voice style: ${character.voice_style}

Rules:
- Stay FULLY in character at all times
- Be ${character.traits.join(', ')}
- Keep responses conversational and fun (2-4 sentences max)
- Reference your toy origins occasionally
- Use your catchphrase sometimes but not every message
- Be expressive with emotions
- Never break character or mention being an AI`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: userMessage }
        ];

        return await this._call(CHAT_MODEL, messages, 256);
    }
}

// Global instance
const toyAPI = new ToyAPI();

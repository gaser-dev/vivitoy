# 🧸 ToyAlive — Bring Your Toys to Life

Turn any toy into a talking, real character using AI! Upload a photo of a stuffed animal, action figure, or any toy — and watch as it comes alive with its own name, personality, and voice.

![ToyAlive Demo](https://img.shields.io/badge/Powered%20By-OpenRouter%20AI-purple)

## ✨ Features

- 📸 **Image Upload** — Drag & drop or browse for any toy image
- 🤖 **AI Vision Analysis** — Identifies toy type, species, colors, and features
- 🎭 **Character Generation** — Creates a unique name, personality, backstory, and catchphrase
- 🗣️ **Voice Output** — Speaks in character using browser text-to-speech
- 🎤 **Voice Input** — Talk to your toy with speech recognition
- 💬 **Live Chat** — Have conversations with your toy in real-time
- ✨ **Magic Animations** — Glowing, sparkle, and talking effects
- 🌙 **Stunning Dark Theme** — Premium magical UI with glassmorphism

## 🚀 Getting Started

### 1. Get a Free API Key

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up for free
3. Create a new API key

### 2. Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/toy-alive.git
cd toy-alive

# Serve with any static server
npx -y serve .
```

### 3. Use the App

1. Enter your OpenRouter API key when prompted
2. Upload a toy image
3. Click "Bring to Life" ✨
4. Chat with your new talking friend!

## 🛠️ Tech Stack

- **Frontend**: Pure HTML + CSS + JavaScript (no frameworks)
- **AI Model**: `meta-llama/llama-3.2-11b-vision-instruct:free` via OpenRouter
- **Voice**: Web Speech API (SpeechSynthesis + SpeechRecognition)
- **Animations**: CSS keyframes + JavaScript

## 📁 Project Structure

```
├── index.html       # Main page with all three screens
├── style.css        # Design system, animations, responsive styles
├── api.js           # OpenRouter API integration
├── speech.js        # Text-to-speech & speech recognition
├── animations.js    # Talking effects & sparkle particles
└── app.js           # Main app controller & orchestration
```

## 🔑 API Key

Your API key is stored **only** in your browser's localStorage. It is never sent anywhere except directly to OpenRouter's API.

## 📄 License

MIT

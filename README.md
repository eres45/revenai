# RevenAI 🤖

![RevenAI Homepage](./screenshots/homepage.png)

RevenAI is a cutting-edge, high-performance AI assistant platform designed to bring all your favorite chatbots into one unified, sleek interface. Built with precision and speed, RevenAI leverages the power of modern web technologies to provide a seamless and intelligent user experience.

---

## ✨ Features

- **Unified Intelligence**: Access multiple AI models (Mistral, OpenAI, Groq, etc.) from a single terminal-like interface.
- **Ultra-Fast Real-time Response**: Optimized for low latency and high throughput.
- **Pro-Grade Sidebar**: Manage your chat history, settings, and workspace with a professional-grade navigation system.
- **Dynamic Dark/Light Mode**: Beautifully crafted themes that adapt to your environment (Dark mode recommended for the best experience).
- **Mobile First Design**: Fully responsive architecture that looks stunning on any device.
- **User Authentication**: Secure Google Sign-in integration via Firebase.
- **Usage Analytics**: Track your model usage and performance directly from your dashboard.

---

## 📸 Preview

### Multi-Model Interface
The core of RevenAI is a powerful command-center interface that allows you to switch between different AI providers effortlessly.

![Sidebar Preview](./screenshots/sidebar.png)

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router & Turbopack)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/), & [Magic UI](https://magicui.design/)
- **Backend/Auth**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Bun (recommended for fastest experience)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/eres45/revenai.git
   cd revenai
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Setup environment variables:
   Create a `.env.local` file with your Firebase and AI provider keys.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5010](http://localhost:5010) in your browser.

---

## 📑 Project Structure

```text
src/
├── app/            # Next.js App Router pages and API routes
├── components/     # Reusable UI components (Shadcn + Custom)
├── lib/            # Utility functions and context providers
├── services/       # AI provider integrations and services
└── public/         # Static assets and animations
```

---

Brought to you by [eres45](https://github.com/eres45)

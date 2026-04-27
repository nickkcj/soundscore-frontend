<div align="center">
  <img src="https://raw.githubusercontent.com/nickkcj/soundscore-frontend/main/public/images/logo_soundscore.png" alt="SoundScore Logo" width="200" />

  # SoundScore Web

  **The high-performance, modern frontend for the SoundScore social network.**

  [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

  [Live Site](https://soundscore.com.br) • [API Repository](https://github.com/nickkcj/soundscore-api)
</div>

---

## Overview
SoundScore Web is a high-performance Single Page Application (SPA) built with **Next.js**. It provides a seamless interface for music enthusiasts to document their listening journey, synchronize Spotify data, and engage with a community of reviewers.

## Key Features
- **Real-time Social Feed:** Instant updates on friend activity and album reviews.
- **Spotify Integration:** Secure OAuth flow and real-time visualization of listening history.
- **AI Chat Interface:** A sleek, conversational UI to interact with the Gemini-powered backend assistant.
- **Dynamic Scoring:** Visual data representation of album ratings and community trends.
- **Responsive Design:** Mobile-first approach ensuring a perfect experience across all devices.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript for full-stack type safety.
- **Styling:** Tailwind CSS for utility-first, responsive design.
- **State & Data:** React Hooks & Context API for client-side state.
- **Icons:** Lucide React & FontAwesome.
- **Deployment:** Vercel (Optimized for Next.js environments).

## Architecture
The frontend is architected to leverage the best of **Next.js**:
- **Server Components:** Used for SEO-critical pages and fast initial loads.
- **Client Components:** Implemented for highly interactive sections like the AI Chat, WebSockets, and real-time Spotify syncing.
- **API Integration:** Strictly typed communication with the FastAPI backend.

## Setup & Installation

### Prerequisites
- Node.js 18+
- Backend API running (see [SoundScore API](https://github.com/nickkcj/soundscore-api))

### Local Development
1. **Clone and Install:**
    ```bash
    git clone [https://github.com/nickkcj/soundscore-web.git](https://github.com/nickkcj/soundscore-web.git)
    cd soundscore-web
    npm install
    ```

2. **Environment Variables:**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

3. **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the application.

---
<p align="center">Developed by <a href="https://linkedin.com/in/nicholasjasperdev">Nicholas Jasper</a></p>

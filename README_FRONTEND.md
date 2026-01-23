# InsightExtract Frontend

A modern, responsive React application for extracting insights from PDFs and generating flashcards with spaced repetition learning.

## Features

- 📄 **PDF Upload & Processing** - Upload PDFs and extract structured content
- 📊 **Intelligent Summaries** - Get hierarchical outlines with citations
- 🎴 **Smart Flashcards** - Auto-generated flashcards with quality checks
- 🧠 **Spaced Repetition** - SM-2 algorithm for optimized learning
- 🎨 **Modern UI** - Clean, responsive interface with dark mode
- ♿ **Accessible** - Built with accessibility in mind using Radix UI

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling with dark mode
- **React Query** - Powerful data fetching and caching
- **React Router** - Client-side routing
- **Radix UI** - Accessible component primitives
- **PDF.js** - PDF rendering and preview

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your API endpoint

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Linting

Run ESLint:

```bash
npm run lint
```

### Testing

Run tests:

```bash
npm test
```

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # Reusable React components
│   └── ui/       # Base UI components (Button, Card, etc.)
├── hooks/        # Custom React hooks
├── pages/        # Page components
├── types/        # TypeScript type definitions
├── utils/        # Utility functions
├── App.tsx       # Main app component with routing
├── main.tsx      # Application entry point
└── index.css     # Global styles
```

## Key Components

- **FileDropzone** - Drag & drop PDF upload
- **PdfPreview** - PDF viewer with navigation
- **OutlineTree** - Hierarchical document outline
- **CitationPopover** - Interactive citations with quotes
- **FlashcardEditor** - Edit and manage flashcards
- **SrsControls** - Spaced repetition rating interface
- **JobProgress** - Real-time processing status

## Pages

- **HomePage** - Upload documents and view recent files
- **DocumentPage** - View document outline and main points
- **DeckPage** - Browse and manage flashcards
- **StudySessionPage** - Study with spaced repetition

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: `http://localhost:3000/api`)

## Contributing

Follow the code style guidelines:

- TypeScript strict mode enabled
- Use `interface` over `type` (except for unions)
- No `any` types - use `unknown` instead
- Prefer composition over inheritance
- Write tests for new features

## License

See LICENSE file for details.

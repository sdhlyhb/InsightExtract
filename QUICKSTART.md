# Quick Start Guide - InsightExtract Frontend

## What's Been Created

A complete React + TypeScript + Tailwind CSS frontend application with:

### ✅ Core Setup

- Vite build system configured
- TypeScript with strict mode
- Tailwind CSS with dark mode support
- ESLint with React rules
- PostCSS configuration

### ✅ Project Structure

```
src/
├── api/
│   ├── client.ts          # HTTP client with error handling
│   └── endpoints.ts       # API endpoint definitions
├── components/
│   ├── ui/
│   │   ├── Button.tsx     # Reusable button component
│   │   └── Card.tsx       # Card component system
│   ├── CitationPopover.tsx
│   ├── FileDropzone.tsx
│   ├── FlashcardEditor.tsx
│   ├── JobProgress.tsx
│   ├── Layout.tsx
│   ├── OutlineTree.tsx
│   ├── PdfPreview.tsx
│   └── SrsControls.tsx
├── hooks/
│   └── useApi.ts          # React Query hooks
├── pages/
│   ├── DeckPage.tsx
│   ├── DocumentPage.tsx
│   ├── HomePage.tsx
│   └── StudySessionPage.tsx
├── types/
│   └── index.ts           # TypeScript interfaces
├── utils/
│   ├── cn.ts              # Class name utility
│   └── cn.test.ts         # Sample test
├── App.tsx                # Main app with routing
├── main.tsx               # Entry point
└── index.css              # Global styles
```

### ✅ Features Implemented

- **File Upload**: Drag & drop PDF upload with react-dropzone
- **PDF Preview**: PDF.js integration for viewing documents
- **Document Processing**: Progress tracking with job status
- **Outline View**: Hierarchical tree navigation
- **Citations**: Interactive popovers with quotes
- **Flashcards**: Editable cards with citations
- **Study Session**: Spaced repetition with SM-2 ratings
- **Dark Mode**: Toggle between light and dark themes
- **Responsive**: Mobile-friendly layouts

## Next Steps

### 1. Install Dependencies

```bash
cd /Users/shuang/Library/CloudStorage/OneDrive-UltimateMedicalAcademy/Desktop/InsightExtract
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and set your API endpoint:

```
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

### 4. Build for Production

```bash
npm run build
```

## What You'll See

### Home Page (/)

- File upload dropzone
- Recent documents list
- Feature overview

### Document Page (/documents/:id)

- Processing status with progress bar
- Document outline in tabs
- Main points extraction
- Citations view
- "Generate Flashcards" button

### Deck Page (/decks/:id)

- Flashcard list with filters by tag
- Edit individual cards
- Export options
- Study session launcher

### Study Session (/study/:deckId)

- One card at a time
- Show/hide answer
- 6-level rating (0-5)
- Progress tracking
- Keyboard shortcuts (0-5)

## Key Technologies

- **React 18** - Latest React features
- **TypeScript 5.3** - Type safety
- **Vite 5** - Lightning fast builds
- **Tailwind CSS 3.4** - Utility-first styling
- **React Query (TanStack)** - Data fetching
- **React Router 6** - Client routing
- **Radix UI** - Accessible primitives
- **PDF.js** - PDF rendering
- **Lucide React** - Icon library

## Customization

### Colors

Edit `tailwind.config.js` and `src/index.css` to customize the color scheme.

### API Integration

The app uses mock data currently. To connect to your backend:

1. Update API endpoints in `src/api/endpoints.ts`
2. Remove mock data from page components
3. Use the React Query hooks from `src/hooks/useApi.ts`

Example:

```typescript
// In a page component
import { useDocument } from '@/hooks/useApi';

function DocumentPage() {
  const { id } = useParams();
  const { data: document, isLoading, error } = useDocument(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{document.title}</div>;
}
```

### Adding New Components

1. Create component in `src/components/`
2. Import and use in pages
3. Add to component library as needed

### Testing

Run tests:

```bash
npm test
```

Add new tests following the pattern in `src/utils/cn.test.ts`.

## Common Commands

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm test          # Run tests
```

## Troubleshooting

### Port Already in Use

If port 5173 is busy, Vite will use the next available port.

### TypeScript Errors

Run `npm run build` to see all TypeScript errors. The project uses strict mode.

### ESLint Warnings

Run `npm run lint` to see linting issues. Fix with auto-fix where possible.

### PDF Preview Not Working

Make sure PDF.js worker is loading. Check browser console for errors.

## Next Development Tasks

1. **Connect to Backend API**
   - Replace mock data with real API calls
   - Handle authentication if needed
   - Set up proper error boundaries

2. **Add Real-time Updates**
   - Implement SSE for job progress
   - Use WebSocket for live updates
   - Add optimistic UI updates

3. **Enhance PDF Preview**
   - Add search in PDF
   - Highlight citations
   - Add bookmarks

4. **Improve Study Session**
   - Add statistics dashboard
   - Show learning curves
   - Add study streaks

5. **Add Testing**
   - Component tests with Vitest
   - E2E tests with Playwright
   - Visual regression tests

6. **Optimize Performance**
   - Code splitting
   - Lazy loading
   - Image optimization

## Support

For questions or issues:

1. Check the main README.md
2. Review the CLAUDE.md spec
3. Check component documentation
4. Look at TypeScript types for API contracts

## Architecture Notes

### State Management

- React Query for server state
- React Context (in Layout) for theme
- Local state for UI interactions
- No Redux needed for now

### Routing

- React Router with nested routes
- Layout wrapper for consistent UI
- Protected routes can be added later

### Styling

- Tailwind utility classes
- CSS variables for theming
- Radix UI for accessibility
- Mobile-first responsive design

### Type Safety

- Strict TypeScript enabled
- Shared types in `src/types/`
- No `any` types allowed
- API contracts defined

### Error Handling

- Try-catch in async operations
- Error boundaries can be added
- React Query handles retry logic
- User-friendly error messages

Happy coding! 🚀

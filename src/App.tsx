import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { DocumentPage } from "./pages/DocumentPage";
import { DeckPage } from "./pages/DeckPage";
import { DecksListPage } from "./pages/DecksListPage";
import { FlashcardsCreatePage } from "./pages/FlashcardsCreatePage";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="home" element={<HomePage />} />
            <Route path="documents/:id" element={<DocumentPage />} />
            <Route
              path="flashcards/create"
              element={<FlashcardsCreatePage />}
            />
            <Route path="decks" element={<DecksListPage />} />
            <Route path="decks/:id" element={<DeckPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

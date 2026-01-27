import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Moon, Sun, BookOpen } from "lucide-react";
import { Button } from "./ui/Button";
import { useEffect, useState } from "react";

export function Layout() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const initialTheme = stored || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-xl font-bold hover:opacity-80 transition-opacity">
            InsightExtract
          </a>
          <div className="flex items-center gap-2">
            {!isLandingPage && (
              <Button
                variant="outline"
                onClick={() => navigate("/decks")}
                className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">My Flashcards</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t mt-auto bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="font-semibold mb-3">InsightExtract</h3>
              <p className="text-sm text-muted-foreground">
                Transform documents into structured knowledge and intelligent
                flashcards with AI-powered analysis.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="/home"
                    className="hover:text-foreground transition-colors">
                    Get Started
                  </a>
                </li>
                <li>
                  <a
                    href="/decks"
                    className="hover:text-foreground transition-colors">
                    My Flashcards
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-sm text-muted-foreground">
                Privacy-respecting study companion that helps you learn more
                effectively.
              </p>
            </div>
          </div>
          <div className="pt-6 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} InsightExtract. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

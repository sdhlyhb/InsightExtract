import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Moon,
  Sun,
  BookOpen,
  Zap,
  Sparkles,
  Code2,
  Github,
  Twitter,
  Mail,
} from "lucide-react";
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
      <footer className="relative border-t mt-auto overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10" />

        {/* Animated Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <div className="absolute inset-0 animate-pulse">
                    <Sparkles className="h-6 w-6 text-primary opacity-50" />
                  </div>
                </div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  InsightExtract
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Transform documents into structured knowledge with AI-powered
                analysis. Built with cutting-edge technology for modern
                learners.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span>AI-Powered</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Code2 className="h-3 w-3 text-blue-500" />
                  <span>Open Source</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/home"
                    className="text-sm hover:text-primary transition-colors inline-flex items-center gap-1 group">
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                    Get Started
                  </a>
                </li>
                <li>
                  <a
                    href="/decks"
                    className="text-sm hover:text-primary transition-colors inline-flex items-center gap-1 group">
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                    My Flashcards
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm hover:text-primary transition-colors inline-flex items-center gap-1 group">
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Connect Section */}
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Connect
              </h3>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="h-9 w-9 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center group"
                  aria-label="GitHub">
                  <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </a>

                <a
                  href="#"
                  className="h-9 w-9 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center group"
                  aria-label="Email">
                  <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Join our community of learners
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {new Date().getFullYear()} InsightExtract</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                Built with ❤️ for learners
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <span>•</span>
              <a href="#" className="hover:text-foreground transition-colors">
                Changelog
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

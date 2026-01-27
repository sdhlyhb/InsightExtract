import { useNavigate } from "react-router-dom";
import { Upload, Brain, Zap, Target, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 max-w-6xl">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          {/* Hero Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            InsightExtract
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Transform PDFs and documents into structured knowledge and
            intelligent flashcards
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
            <Button
              size="lg"
              onClick={() => navigate("/home")}
              className="w-full sm:w-auto text-base sm:text-lg py-5 sm:py-6 px-6 sm:px-8">
              <Upload className="h-5 w-5 mr-2" />
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/decks")}
              className="w-full sm:w-auto text-base sm:text-lg py-5 sm:py-6 px-6 sm:px-8">
              <BookOpen className="h-5 w-5 mr-2" />
              View My Flashcards
            </Button>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 px-4">
            <Card className="border-2 hover:shadow-lg transition-shadow pt-4">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  Easy Upload
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload PDFs or DOCX files and extract text instantly
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow pt-4">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  AI Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Generate outlines, key points, and term definitions
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow pt-4">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  Smart Flashcards
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create flashcard decks with spaced repetition
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow pt-4">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  Track Progress
                </h3>
                <p className="text-sm text-muted-foreground">
                  Study efficiently with SRS algorithm and analytics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 sm:mt-16 px-4">
          <Card className="pt-4">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4 text-center">
                How It Works
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">1</div>
                  <h3 className="font-semibold mb-2">Upload</h3>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Upload your PDF or Word document for instant text extraction
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">2</div>
                  <h3 className="font-semibold mb-2">Analyze</h3>
                  <p className="text-sm text-muted-foreground text-pretty">
                    AI generates summaries, key points, and important terms
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">3</div>
                  <h3 className="font-semibold mb-2">Study</h3>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Create flashcards and study with spaced repetition
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

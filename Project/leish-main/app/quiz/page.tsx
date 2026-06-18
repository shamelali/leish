import { BeautyQuiz } from "@/components/beauty-quiz"

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-semibold mb-4">
            Discover Your Perfect Beauty Match
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Take our quick beauty quiz to find makeup artists and styles that match your unique preferences and occasion.
          </p>
        </div>
        <BeautyQuiz />
      </div>
    </div>
  )
}
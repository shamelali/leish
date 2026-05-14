"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/lib/i18n/language-context"

interface QuizQuestion {
  id: string
  question: string
  questionMs: string
  options: {
    id: string
    text: string
    textMs: string
    category: string
  }[]
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "occasion",
    question: "What's the occasion?",
    questionMs: "Apa majlisnya?",
    options: [
      { id: "bridal", text: "Wedding/Bridal", textMs: "Majlis Perkahwinan", category: "Bridal" },
      { id: "event", text: "Event/Social Gathering", textMs: "Acara/Majlis Sosial", category: "Event" },
      { id: "photoshoot", text: "Photoshoot/Editorial", textMs: "Sesi Fotografi", category: "Photoshoot" },
      { id: "hari-raya", text: "Hari Raya", textMs: "Hari Raya", category: "Hari Raya" },
      { id: "cny", text: "Chinese New Year", textMs: "Tahun Baru Cina", category: "Chinese New Year" },
      { id: "everyday", text: "Everyday/Natural", textMs: "Harian/Semula Jadi", category: "Natural" },
    ],
  },
  {
    id: "style",
    question: "What style appeals to you?",
    questionMs: "Gaya manakah yang menarik minat anda?",
    options: [
      { id: "glamorous", text: "Glamorous & Bold", textMs: "Glam & Berani", category: "Event" },
      { id: "natural", text: "Natural & Fresh", textMs: "Semula Jadi & Segar", category: "Natural" },
      { id: "traditional", text: "Traditional & Cultural", textMs: "Tradisional & Budaya", category: "Traditional Malay" },
      { id: "modest", text: "Modest & Elegant", textMs: "Sederhana & Elegan", category: "Hijab" },
      { id: "dramatic", text: "Dramatic & Artistic", textMs: "Dramatik & Artistik", category: "SFX" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget range?",
    questionMs: "Apa julat bajet anda?",
    options: [
      { id: "budget", text: "MYR 100-200", textMs: "MYR 100-200", category: "budget" },
      { id: "mid", text: "MYR 200-400", textMs: "MYR 200-400", category: "mid" },
      { id: "premium", text: "MYR 400+", textMs: "MYR 400+", category: "premium" },
    ],
  },
]

export function BeautyQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [completed, setCompleted] = useState(false)
  const router = useRouter()
  const { lang } = useTranslation()

  const handleAnswer = (questionId: string, answerId: string) => {
    const newAnswers = { ...answers, [questionId]: answerId }
    setAnswers(newAnswers)

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setCompleted(true)
      // Generate recommendation based on answers
      const recommendation = generateRecommendation(newAnswers)
      // Store in localStorage for later use
      localStorage.setItem("beauty-quiz-result", JSON.stringify({
        answers: newAnswers,
        recommendation,
        timestamp: new Date().toISOString(),
      }))
    }
  }

  const generateRecommendation = (answers: Record<string, string>) => {
    const categories = Object.values(answers).map(answerId => {
      const question = quizQuestions.find(q => q.options.some(o => o.id === answerId))
      return question?.options.find(o => o.id === answerId)?.category
    }).filter(Boolean)

    // Simple logic: return the most common category
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat!] = (acc[cat!] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || "Natural"

    return topCategory
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setCompleted(false)
  }

  const viewResults = () => {
    const result = localStorage.getItem("beauty-quiz-result")
    if (result) {
      const { recommendation } = JSON.parse(result)
      router.push(`/artists?category=${encodeURIComponent(recommendation)}`)
    }
  }

  if (completed) {
    const result = localStorage.getItem("beauty-quiz-result")
    const recommendation = result ? JSON.parse(result).recommendation : "Natural"

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {lang === "ms" ? "Keputusan Kuiz Kecantikan Anda!" : "Your Beauty Quiz Results!"}
          </CardTitle>
          <CardDescription>
            {lang === "ms"
              ? `Berdasarkan jawapan anda, kami mengesyorkan kategori: ${recommendation}`
              : `Based on your answers, we recommend the ${recommendation} category`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium mb-4">
              {lang === "ms" ? "Mahu lihat artis yang sesuai?" : "Want to see matching artists?"}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={viewResults} size="lg">
                {lang === "ms" ? "Lihat Artis" : "View Artists"}
              </Button>
              <Button onClick={restartQuiz} variant="outline" size="lg">
                {lang === "ms" ? "Cuba Lagi" : "Retake Quiz"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const question = quizQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {lang === "ms" ? "Soalan" : "Question"} {currentQuestion + 1} {lang === "ms" ? "daripada" : "of"} {quizQuestions.length}
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="mb-4" />
        <CardTitle className="text-xl">
          {lang === "ms" ? question.questionMs : question.question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {question.options.map((option) => (
            <Button
              key={option.id}
              onClick={() => handleAnswer(question.id, option.id)}
              variant="outline"
              className="h-auto p-4 text-left justify-start"
            >
              <span className="text-base">
                {lang === "ms" ? option.textMs : option.text}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
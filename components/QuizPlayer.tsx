'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { QuizFull, QuizQuestion } from '@/lib/quiz'

interface QuizPlayerProps {
  quiz: QuizFull
  brandId: string
}

interface QuizResults {
  score: number
  totalPoints: number
  percentage: number
  passed: boolean
  message: string
  showCorrectAnswers: boolean
  detailedResults?: {
    questionId: string
    questionText: string
    isCorrect: boolean
    pointsEarned: number
    points: number
    explanation: string | null
    correctOptionIds?: string[]
    userAnswer?: string | string[]
  }[]
}

export default function QuizPlayer({ quiz, brandId }: QuizPlayerProps) {
  const [phase, setPhase] = useState<'instructions' | 'email' | 'quiz' | 'results'>('instructions')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [timeRemaining, setTimeRemaining] = useState(quiz.time_limit_minutes * 60)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<QuizResults | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const questions = quiz.quiz_questions || []
  const currentQuestion = questions[currentIndex]

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000)

    try {
      const res = await fetch('/api/quiz-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          brandId,
          name: name || null,
          email: email || null,
          answers,
          timeTakenSeconds: timeTaken,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit quiz')

      const data = await res.json()
      setResults(data)
      setPhase('results')
    } catch {
      setResults({
        score: 0,
        totalPoints: 0,
        percentage: 0,
        passed: false,
        message: 'Failed to submit quiz. Please try again.',
        showCorrectAnswers: false,
      })
      setPhase('results')
    } finally {
      setSubmitting(false)
    }
  }, [submitting, quiz.id, brandId, name, email, answers])

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, handleSubmit])

  const handleStart = () => {
    if (quiz.require_email) {
      setPhase('email')
    } else {
      startTimeRef.current = Date.now()
      setPhase('quiz')
    }
  }

  const handleEmailContinue = () => {
    if (quiz.require_email && !email.trim()) return
    startTimeRef.current = Date.now()
    setPhase('quiz')
  }

  const handleAnswer = (questionId: string, optionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    if (question.question_type === 'multiple_select') {
      const current = (answers[questionId] as string[]) || []
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      setAnswers({ ...answers, [questionId]: updated })
    } else {
      setAnswers({ ...answers, [questionId]: optionId })
    }
  }

  const isOptionSelected = (questionId: string, optionId: string) => {
    const answer = answers[questionId]
    if (Array.isArray(answer)) return answer.includes(optionId)
    return answer === optionId
  }

  const answeredCount = Object.keys(answers).length

  // Instructions phase
  if (phase === 'instructions') {
    return (
      <div className="quiz-player-container">
        <div className="quiz-player-header">
          <h1 className="quiz-player-title">{quiz.title}</h1>
          {quiz.description && (
            <p className="quiz-player-description">{quiz.description}</p>
          )}
        </div>

        <div className="quiz-player-stats">
          <div className="quiz-player-stat">
            <div className="quiz-player-stat-value">{questions.length}</div>
            <div className="quiz-player-stat-label">Questions</div>
          </div>
          <div className="quiz-player-stat">
            <div className="quiz-player-stat-value">{quiz.time_limit_minutes}</div>
            <div className="quiz-player-stat-label">Minutes</div>
          </div>
          <div className="quiz-player-stat">
            <div className="quiz-player-stat-value">{quiz.passing_score}%</div>
            <div className="quiz-player-stat-label">To Pass</div>
          </div>
        </div>

        <button onClick={handleStart} className="quiz-player-start-btn">
          Start Quiz
        </button>
      </div>
    )
  }

  // Email collection phase
  if (phase === 'email') {
    return (
      <div className="quiz-player-container">
        <div className="quiz-player-header">
          <h2 className="quiz-player-title">Before You Begin</h2>
          <p className="quiz-player-description">
            {quiz.require_email
              ? 'Enter your details to receive your results.'
              : 'Optionally enter your details to save your results.'}
          </p>
        </div>

        <div className="quiz-player-email-form">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="quiz-player-input"
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={quiz.require_email}
            className="quiz-player-input"
          />
          <button
            onClick={handleEmailContinue}
            disabled={quiz.require_email && !email.trim()}
            className="quiz-player-start-btn"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Results phase
  if (phase === 'results' && results) {
    return (
      <div className="quiz-player-container">
        <div className="quiz-player-results">
          <div className={`quiz-player-score-circle ${results.passed ? 'quiz-player-score-circle--pass' : 'quiz-player-score-circle--fail'}`}>
            <span style={{ fontSize: '2rem' }}>{results.percentage}%</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{results.passed ? 'PASSED' : 'FAILED'}</span>
          </div>

          <h2 className="quiz-player-title" style={{ marginTop: '1.5rem' }}>
            {results.passed ? 'Congratulations!' : 'Keep Trying!'}
          </h2>
          <p className="quiz-player-description">{results.message}</p>

          <p style={{ margin: '1rem 0', color: 'var(--color-text-light)' }}>
            You scored {results.score} out of {results.totalPoints} points
          </p>

          {results.showCorrectAnswers && results.detailedResults && (
            <div style={{ textAlign: 'left', marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Answer Review</h3>
              {results.detailedResults.map((r, i) => (
                <div
                  key={r.questionId}
                  style={{
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    borderRadius: '12px',
                    background: r.isCorrect ? '#dcfce7' : '#fee2e2',
                    border: `1px solid ${r.isCorrect ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    {i + 1}. {r.questionText}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: r.isCorrect ? '#16a34a' : '#dc2626' }}>
                    {r.isCorrect ? `Correct (+${r.pointsEarned} pts)` : `Incorrect (0/${r.points} pts)`}
                  </p>
                  {r.explanation && (
                    <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      {r.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {quiz.allow_retakes && (
            <button
              onClick={() => {
                setAnswers({})
                setCurrentIndex(0)
                setTimeRemaining(quiz.time_limit_minutes * 60)
                setResults(null)
                setPhase('instructions')
              }}
              className="quiz-player-start-btn"
              style={{ marginTop: '1.5rem' }}
            >
              Retake Quiz
            </button>
          )}
        </div>
      </div>
    )
  }

  // Quiz phase
  if (!currentQuestion) return null

  return (
    <div className="quiz-player-container">
      {/* Timer bar */}
      <div className="quiz-player-timer-bar">
        <span className="quiz-player-progress-text">
          Question {currentIndex + 1} of {questions.length} ({answeredCount} answered)
        </span>
        <span className={`quiz-player-timer ${timeRemaining < 60 ? 'quiz-player-timer--warning' : ''}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>

      {/* Question */}
      <div className="quiz-player-question">
        <h2 className="quiz-player-question-text">
          {currentIndex + 1}. {currentQuestion.question_text}
        </h2>

        {currentQuestion.image_url && (
          <img
            src={currentQuestion.image_url}
            alt=""
            style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '1rem' }}
          />
        )}

        {currentQuestion.question_type === 'multiple_select' && (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '0.75rem' }}>
            Select all that apply
          </p>
        )}

        <div className="quiz-player-options">
          {currentQuestion.quiz_options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnswer(currentQuestion.id, option.id)}
              className={`quiz-player-option ${isOptionSelected(currentQuestion.id, option.id) ? 'quiz-player-option--selected' : ''}`}
            >
              {option.option_text}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="quiz-player-nav">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="quiz-player-nav-btn"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="quiz-player-nav-btn"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="quiz-player-nav-btn quiz-player-nav-btn--submit"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>

      {/* Question dots */}
      <div className="quiz-player-dots">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`quiz-player-dot ${i === currentIndex ? 'quiz-player-dot--current' : ''} ${answers[q.id] !== undefined ? 'quiz-player-dot--answered' : ''}`}
            aria-label={`Go to question ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Quiz data fetching — reads from Doubleclicker's multi-tenant quiz tables.
 */

import { createServiceClient } from '@/lib/supabase/service'
import { getTenantConfig } from '@/lib/tenant'

export interface QuizSummary {
  id: string
  title: string
  description: string | null
  time_limit_minutes: number
  passing_score: number
  question_count: number
}

/**
 * Get the most recent quiz for this tenant.
 * Returns null if no quizzes exist.
 */
export async function getFeaturedQuiz(): Promise<QuizSummary | null> {
  const { username } = getTenantConfig()
  if (!username) return null
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('quizzes')
    .select('id, title, description, time_limit_minutes, passing_score, quiz_questions(count)')
    .eq('brand_id', username)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const questionData = data.quiz_questions as any
  const count = Array.isArray(questionData) ? (questionData[0]?.count ?? 0) : 0

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    time_limit_minutes: data.time_limit_minutes,
    passing_score: data.passing_score,
    question_count: count,
  }
}

export interface QuizFull {
  id: string
  title: string
  description: string | null
  brand_id: string
  time_limit_minutes: number
  passing_score: number
  show_results: boolean
  show_correct_answers: boolean
  require_email: boolean
  allow_retakes: boolean
  result_message_pass: string
  result_message_fail: string
  quiz_questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  question_text: string
  question_type: string
  order_index: number
  points: number
  explanation: string | null
  image_url: string | null
  quiz_options: QuizOption[]
}

export interface QuizOption {
  id: string
  option_text: string
  order_index: number
  is_correct: boolean
}

/**
 * Get a full quiz by ID with questions and options (for the quiz player page).
 */
export async function getQuizById(quizId: string): Promise<QuizFull | null> {
  const { username } = getTenantConfig()
  if (!username) return null
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      id, title, description, brand_id,
      time_limit_minutes, passing_score,
      show_results, show_correct_answers,
      require_email, allow_retakes,
      result_message_pass, result_message_fail,
      quiz_questions (
        id, question_text, question_type, order_index,
        points, explanation, image_url,
        quiz_options (
          id, option_text, order_index, is_correct
        )
      )
    `)
    .eq('id', quizId)
    .eq('brand_id', username)
    .single()

  if (error || !data) return null

  // Sort questions and options by order_index
  const quiz = data as any
  if (quiz.quiz_questions) {
    quiz.quiz_questions.sort((a: any, b: any) => a.order_index - b.order_index)
    for (const q of quiz.quiz_questions) {
      if (q.quiz_options) {
        q.quiz_options.sort((a: any, b: any) => a.order_index - b.order_index)
      }
    }
  }

  return quiz as QuizFull
}

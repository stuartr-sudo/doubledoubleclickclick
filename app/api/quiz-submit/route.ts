import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { quizId, brandId, name, email, answers, timeTakenSeconds } = await request.json()

    if (!quizId || !brandId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch quiz with questions and correct answers
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        id, passing_score, show_results, show_correct_answers,
        result_message_pass, result_message_fail,
        quiz_questions (
          id, question_text, question_type, points, explanation,
          quiz_options ( id, is_correct )
        )
      `)
      .eq('id', quizId)
      .eq('brand_id', brandId)
      .single()

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Score the quiz
    const questions = (quiz as any).quiz_questions || []
    let totalPoints = 0
    let earnedPoints = 0
    const detailedResults = []

    for (const question of questions) {
      const qPoints = question.points || 1
      totalPoints += qPoints
      const userAnswer = answers?.[question.id]
      const correctOptions = (question.quiz_options || []).filter((o: any) => o.is_correct)
      const correctIds = correctOptions.map((o: any) => o.id)

      let isCorrect = false
      if (question.question_type === 'multiple_select') {
        const userArr = Array.isArray(userAnswer) ? userAnswer : []
        isCorrect = correctIds.length === userArr.length &&
          correctIds.every((id: string) => userArr.includes(id))
      } else {
        isCorrect = correctIds.includes(userAnswer)
      }

      if (isCorrect) earnedPoints += qPoints

      detailedResults.push({
        questionId: question.id,
        questionText: question.question_text,
        isCorrect,
        pointsEarned: isCorrect ? qPoints : 0,
        points: qPoints,
        explanation: question.explanation,
        correctOptionIds: correctIds,
        userAnswer,
      })
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passed = percentage >= quiz.passing_score

    // Store response
    await supabase.from('quiz_responses').insert({
      quiz_id: quizId,
      brand_id: brandId,
      name: name || null,
      email: email || null,
      answers: answers || {},
      score: earnedPoints,
      total_questions: questions.length,
      percentage,
      time_taken_seconds: timeTakenSeconds || null,
      passed,
    })

    return NextResponse.json({
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      message: passed ? quiz.result_message_pass : quiz.result_message_fail,
      showCorrectAnswers: quiz.show_correct_answers,
      detailedResults: quiz.show_correct_answers ? detailedResults : undefined,
    })
  } catch (error) {
    console.error('[QUIZ-SUBMIT] Error:', error)
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 })
  }
}

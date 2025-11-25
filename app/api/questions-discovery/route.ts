import { NextResponse } from 'next/server'

interface DataForSEOTaskResponse {
  tasks: Array<{
    id: string
    status_code: number
  }>
}

interface DataForSEOResultResponse {
  tasks: Array<{
    result: Array<{
      items: Array<{
        type: string
        title?: string
        description?: string
        questions?: string[]
        people_also_ask?: Array<{
          title: string
          expanded_element?: Array<{
            description?: string
          }>
        }>
      }>
    }>
  }>
}

export async function POST(request: Request) {
  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    // DataForSEO credentials
    const username = process.env.DATAFORSEO_USERNAME
    const password = process.env.DATAFORSEO_PASSWORD

    if (!username || !password) {
      return NextResponse.json(
        { error: 'DataForSEO credentials not configured' },
        { status: 500 }
      )
    }

    const auth = Buffer.from(`${username}:${password}`).toString('base64')

    // Step 1: Create task
    console.log('Creating DataForSEO task for domain:', domain)
    const taskResponse = await fetch(
      'https://api.dataforseo.com/v3/serp/google/organic/task_post',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            language_name: 'English',
            location_name: 'United States',
            keyword: domain,
            people_also_ask_click_depth: 4,
            priority: 1,
          },
        ]),
      }
    )

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text()
      console.error('DataForSEO task creation failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to create search task' },
        { status: 500 }
      )
    }

    const taskData: DataForSEOTaskResponse = await taskResponse.json()
    const taskId = taskData.tasks?.[0]?.id

    if (!taskId) {
      return NextResponse.json(
        { error: 'No task ID returned' },
        { status: 500 }
      )
    }

    console.log('Task created:', taskId, 'Waiting 35 seconds...')

    // Step 2: Wait 35 seconds for task to complete
    await new Promise((resolve) => setTimeout(resolve, 35000))

    // Step 3: Fetch results
    console.log('Fetching results for task:', taskId)
    const resultResponse = await fetch(
      `https://api.dataforseo.com/v3/serp/google/organic/task_get/advanced/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!resultResponse.ok) {
      const errorText = await resultResponse.text()
      console.error('DataForSEO result fetch failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      )
    }

    const resultData: DataForSEOResultResponse = await resultResponse.json()

    // Extract "People Also Ask" questions
    const questions: string[] = []
    const items = resultData.tasks?.[0]?.result?.[0]?.items || []

    for (const item of items) {
      if (item.type === 'people_also_ask' && item.people_also_ask) {
        for (const paa of item.people_also_ask) {
          if (paa.title && questions.length < 10) {
            questions.push(paa.title)
          }
        }
      }
    }

    console.log('Found questions:', questions.length)

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this domain', questions: [] },
        { status: 200 }
      )
    }

    return NextResponse.json({ questions: questions.slice(0, 10) })
  } catch (error) {
    console.error('Error in questions discovery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


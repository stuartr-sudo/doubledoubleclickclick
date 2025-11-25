import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Function to extract all keywords from DataForSEO response (based on n8n workflow)
function extractAllKeywords(inputData: any) {
  const allKeywords: Array<{
    keyword: string
    type: string
    seed_question: string | null
    main_keyword: string
  }> = []

  try {
    const tasks = inputData.tasks || []
    if (tasks.length === 0) {
      throw new Error('No tasks found in response')
    }

    const task = tasks[0]
    const taskResults = task.result || []
    if (taskResults.length === 0) {
      throw new Error('No results found in task')
    }

    const result = taskResults[0]
    const items = result.items || []
    const mainKeyword = result.keyword || ''

    // Process each item type
    items.forEach((item: any) => {
      // Extract People Also Ask
      if (item.type === 'people_also_ask' && item.items) {
        item.items.forEach((paaItem: any) => {
          allKeywords.push({
            keyword: paaItem.title || '',
            type: 'people_also_ask',
            seed_question: paaItem.seed_question || null,
            main_keyword: mainKeyword,
          })
        })
      }

      // Extract People Also Search
      if (item.type === 'people_also_search' && item.items) {
        item.items.forEach((term: any) => {
          if (term && typeof term === 'string' && !term.includes('View 3+ more')) {
            allKeywords.push({
              keyword: term,
              type: 'people_also_search',
              seed_question: null,
              main_keyword: mainKeyword,
            })
          }
        })
      }

      // Extract Related Searches
      if (item.type === 'related_searches' && item.items) {
        item.items.forEach((term: any) => {
          if (term && typeof term === 'string') {
            allKeywords.push({
              keyword: term,
              type: 'related_searches',
              seed_question: null,
              main_keyword: mainKeyword,
            })
          }
        })
      }
    })
  } catch (error: any) {
    console.error('Error extracting keywords:', error.message)
    return []
  }

  return allKeywords
}

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json()

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
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
    console.log('Creating DataForSEO task for keyword:', keyword)
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
            keyword: keyword,
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

    const taskData: any = await taskResponse.json()
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

    const resultData: any = await resultResponse.json()

    // Extract all keywords using the n8n logic
    const allKeywords = extractAllKeywords(resultData)

    console.log(`Total keywords extracted: ${allKeywords.length}`)
    
    // Log summary by type
    const typeCounts: Record<string, number> = {}
    allKeywords.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
    })
    console.log('Keywords by type:', typeCounts)

    // For now, return just the "People Also Ask" questions for the UI
    const paaQuestions = allKeywords
      .filter(item => item.type === 'people_also_ask')
      .map(item => item.keyword)
      .slice(0, 10)

    if (paaQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this keyword', questions: [] },
        { status: 200 }
      )
    }

    return NextResponse.json({ 
      questions: paaQuestions,
      allKeywords: allKeywords, // Include all extracted data for future use
      summary: typeCounts
    })
  } catch (error) {
    console.error('Error in questions discovery:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

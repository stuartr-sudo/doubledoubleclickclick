// airtableListFields: Discover field names and types for a table
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tableId } = req.body;

    if (!tableId) {
      return res.status(200).json({
        success: false,
        error: 'Missing required parameter: tableId'
      });
    }

    // Resolve table name to table ID if needed
    const resolvedTableId = resolveTableId(tableId);

    // Fetch schema from Airtable Metadata API
    const url = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        airtable_status: response.status,
        error: data.error?.message || 'Failed to fetch table schema',
        details: data.error
      });
    }

    // Find the table by ID or name
    const table = data.tables?.find(t => 
      t.id === resolvedTableId || t.name === resolvedTableId
    );

    if (!table) {
      return res.status(200).json({
        success: false,
        error: `Table not found: ${resolvedTableId}`
      });
    }

    return res.status(200).json({
      success: true,
      fields: table.fields || [],
      tableName: table.name,
      tableId: table.id
    });

  } catch (error) {
    console.error('airtableListFields error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Helper to resolve friendly table names to IDs
function resolveTableId(tableId) {
  const tableMap = {
    'Keyword Map': process.env.KeywordMapTable || 'Keyword Map',
    'FAQs': process.env.FrequentlyAskedQuestionsTable || 'FAQs'
  };
  
  return tableMap[tableId] || tableId;
}


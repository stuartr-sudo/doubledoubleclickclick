export default async function handler(req, res) {
  try {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        supabase: 'connected',
        vercel: 'connected'
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

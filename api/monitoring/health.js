import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'production',
      uptime: process.uptime(),
      services: {}
    };

    // Check Supabase connection
    try {
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);
        
        if (error) {
          throw error;
        }
        
        healthChecks.services.supabase = {
          status: 'healthy',
          responseTime: Date.now() - startTime,
          connected: true
        };
      } else {
        healthChecks.services.supabase = {
          status: 'unhealthy',
          error: 'Missing Supabase configuration',
          connected: false
        };
      }
    } catch (error) {
      healthChecks.services.supabase = {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }

    // Check Vercel environment
    healthChecks.services.vercel = {
      status: 'healthy',
      region: process.env.VERCEL_REGION || 'unknown',
      deployment: process.env.VERCEL_DEPLOYMENT_ID || 'unknown'
    };

    // Check external APIs
    const externalAPIs = [
      { name: 'airtable', url: 'https://api.airtable.com/v0/' },
      { name: 'openai', url: 'https://api.openai.com/v1/models' }
    ];

    for (const api of externalAPIs) {
      try {
        const response = await fetch(api.url, { 
          method: 'HEAD',
          timeout: 5000 
        });
        
        healthChecks.services[api.name] = {
          status: response.ok ? 'healthy' : 'degraded',
          statusCode: response.status,
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        healthChecks.services[api.name] = {
          status: 'unhealthy',
          error: error.message,
          responseTime: Date.now() - startTime
        };
      }
    }

    // Overall health status
    const unhealthyServices = Object.values(healthChecks.services).filter(
      service => service.status === 'unhealthy'
    );
    
    if (unhealthyServices.length > 0) {
      healthChecks.status = 'degraded';
    }

    const statusCode = healthChecks.status === 'healthy' ? 200 : 
                      healthChecks.status === 'degraded' ? 206 : 503;

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Health-Check', 'true');
    
    return res.status(statusCode).json(healthChecks);

  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message,
      uptime: process.uptime()
    });
  }
}

export default function handler(req, res) {
  // Simple public endpoint to test if deployment is working
  res.status(200).json({ 
    message: 'Public endpoint working!',
    timestamp: new Date().toISOString(),
    method: req.method
  });
}

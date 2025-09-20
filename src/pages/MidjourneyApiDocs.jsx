import React from 'react';
import {
  Card,
  CardGroup,
  Warning,
  Info,
  CodeGroup,
  Tabs,
  Tab,
  ParamField,
  Accordion,
  AccordionGroup,
  ResponseField
} from '@/components/docs/ApiDocComponents';

export default function MidjourneyApiDocs() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <article className="prose prose-invert prose-slate max-w-none 
          prose-headings:text-white prose-headings:font-bold prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-slate-100 prose-code:bg-slate-800 prose-code:text-cyan-300 prose-code:rounded-md prose-code:px-1.5 prose-code:py-1 prose-code:font-mono
          prose-pre:bg-slate-800/70 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl
        ">
          <h1 className="text-4xl md:text-5xl mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Midjourney API Quickstart
          </h1>
          <p className="text-xl text-slate-400">
            Get started with the Midjourney API to generate stunning AI images in minutes.
          </p>

          <h2 id="welcome">Welcome to Midjourney API</h2>
          <p>
            The Midjourney API enables you to generate high-quality AI images using the power of Midjourney's advanced AI models. Whether you're building an app, automating workflows, or creating content, our API provides simple and reliable access to AI image generation.
          </p>

          <CardGroup cols={2}>
            <Card title="Text-to-Image" icon="Wand2" href="#">
              Transform text prompts into stunning visual artwork
            </Card>
            <Card title="Image-to-Image" icon="Image" href="#">
              Use existing images as a foundation for new creations
            </Card>
            <Card title="Image-to-Video" icon="Video" href="#">
              Convert static images into dynamic video content
            </Card>
            <Card title="Image Upscaling" icon="ZoomIn" href="#">
              Enhance image resolution and quality
            </Card>
            <Card title="Image Variations" icon="Palette" href="#">
              Create variations with enhanced clarity and style
            </Card>
            <Card title="Task Management" icon="ListChecks" href="#">
              Track and monitor your generation tasks
            </Card>
          </CardGroup>

          <h2 id="authentication">Authentication</h2>
          <p>
            All API requests require authentication using a Bearer token. Get your API key from the <a href="https://kie.ai/api-key" target="_blank" rel="noopener noreferrer">API Key Management Page</a>.
          </p>
          <Warning>
            Keep your API key secure and never share it publicly. If compromised, reset it immediately.
          </Warning>

          <h3>API Base URL</h3>
          <pre><code>https://api.kie.ai</code></pre>
          <h3>Authentication Header</h3>
          <pre><code>Authorization: Bearer YOUR_API_KEY</code></pre>

          <h2 id="quick-start">Quick Start Guide</h2>
          <h3>Step 1: Generate Your First Image</h3>
          <p>Start with a simple text-to-image generation request:</p>
          <CodeGroup>
            {{
              'cURL': `curl -X POST "https://api.kie.ai/api/v1/mj/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "taskType": "mj_txt2img",
    "prompt": "A majestic mountain landscape at sunset with snow-capped peaks",
    "speed": "relaxed",
    "aspectRatio": "16:9",
    "version": "7"
  }'`,
              'JavaScript': `const response = await fetch('https://api.kie.ai/api/v1/mj/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    taskType: 'mj_txt2img',
    prompt: 'A majestic mountain landscape at sunset with snow-capped peaks',
    speed: 'relaxed',
    aspectRatio: '16:9',
    version: '7'
  })
});

const data = await response.json();
console.log('Task ID:', data.data.taskId);`,
              'Python': `import requests

url = "https://api.kie.ai/api/v1/mj/generate"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

payload = {
    "taskType": "mj_txt2img",
    "prompt": "A majestic mountain landscape at sunset with snow-capped peaks",
    "speed": "relaxed",
    "aspectRatio": "16:9",
    "version": "7"
}

response = requests.post(url, json=payload, headers=headers)
result = response.json()

print(f"Task ID: {result['data']['taskId']}")`,
              'PHP': `<?php
$url = 'https://api.kie.ai/api/v1/mj/generate';
$headers = [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
];

$payload = [
    'taskType' => 'mj_txt2img',
    'prompt' => 'A majestic mountain landscape at sunset with snow-capped peaks',
    'speed' => 'relaxed',
    'aspectRatio' => '16:9',
    'version' => '7'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
echo "Task ID: " . $result['data']['taskId'];
?>`
            }}
          </CodeGroup>

          <h3>Step 2: Check Task Status</h3>
          <p>Use the returned task ID to check the generation status:</p>
          <CodeGroup>
            {{
              'cURL': `curl -X GET "https://api.kie.ai/api/v1/mj/record-info?taskId=YOUR_TASK_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
              'JavaScript': `const response = await fetch(\`https://api.kie.ai/api/v1/mj/record-info?taskId=\${taskId}\`, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const result = await response.json();

if (result.data.successFlag === 1) {
  console.log('Generation completed!');
  console.log('Result URLs:', result.data.resultInfoJson.resultUrls);
} else if (result.data.successFlag === 0) {
  console.log('Still generating...');
} else {
  console.log('Generation failed');
}`,
              'Python': `import requests
import time

def check_task_status(task_id, api_key):
    url = f"https://api.kie.ai/api/v1/mj/record-info?taskId={task_id}"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    response = requests.get(url, headers=headers)
    result = response.json()
    
    success_flag = result['data']['successFlag']
    
    if success_flag == 1:
        print("Generation completed!")
        result_urls = result['data']['resultInfoJson']['resultUrls']
        for i, url_info in enumerate(result_urls):
            print(f"Image {i+1}: {url_info['resultUrl']}")
        return result_urls
    elif success_flag == 0:
        print("Still generating...")
        return None
    else:
        print("Generation failed")
        return None

# Poll until completion
task_id = "YOUR_TASK_ID"
while True:
    result_urls = check_task_status(task_id, "YOUR_API_KEY")
    if result_urls:
        break
    time.sleep(30)  # Wait 30 seconds before checking again`
            }}
          </CodeGroup>

          <h3>Response Format</h3>
          <h4>Successful Response:</h4>
          <pre><code>{`{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "mj_task_abcdef123456"
  }
}`}</code></pre>
          <h4>Task Status Response:</h4>
          <pre><code>{`{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "mj_task_abcdef123456",
    "successFlag": 1,
    "resultInfoJson": {
      "resultUrls": [
        {"resultUrl": "https://example.com/image1.jpg"},
        {"resultUrl": "https://example.com/image2.jpg"},
        {"resultUrl": "https://example.com/image3.jpg"},
        {"resultUrl": "https://example.com/image4.jpg"}
      ]
    }
  }
}`}</code></pre>

          <h2 id="generation-types">Generation Types</h2>
          <Tabs>
            <Tab title="Text-to-Image">
              <p>Generate images from text descriptions:</p>
              <pre><code>{`{
  "taskType": "mj_txt2img",
  "prompt": "A futuristic cityscape with flying cars and neon lights",
  "aspectRatio": "16:9",
  "version": "7"
}`}</code></pre>
            </Tab>
            <Tab title="Image-to-Image">
              <p>Transform existing images with text prompts:</p>
              <pre><code>{`{
  "taskType": "mj_img2img",
  "prompt": "Transform this into a cyberpunk style",
  "fileUrl": "https://example.com/source-image.jpg",
  "aspectRatio": "1:1",
  "version": "7"
}`}</code></pre>
            </Tab>
            <Tab title="Image-to-Video">
              <p>Create videos from static images:</p>
              <pre><code>{`{
  "taskType": "mj_video",
  "prompt": "Add gentle movement and atmospheric effects",
  "fileUrl": "https://example.com/source-image.jpg",
  "version": "7"
}`}</code></pre>
            </Tab>
          </Tabs>

          <h2 id="generation-speeds">Generation Speeds</h2>
          <p>Choose the right speed for your needs:</p>
          <CardGroup cols={3}>
            <Card title="Relaxed" icon="Turtle">
              <strong>Free tier option</strong>
              <p className="!mt-1">Slower generation but cost-effective for non-urgent tasks</p>
            </Card>
            <Card title="Fast" icon="Rabbit">
              <strong>Balanced option</strong>
              <p className="!mt-1">Standard generation speed for most use cases</p>
            </Card>
            <Card title="Turbo" icon="Rocket">
              <strong>Premium speed</strong>
              <p className="!mt-1">Fastest generation for time-critical applications</p>
            </Card>
          </CardGroup>

          <h2 id="key-parameters">Key Parameters</h2>
          <ParamField path="prompt" type="string" required>
            <p>Text description of the desired image. Be specific and descriptive for best results.</p>
            <p><strong>Tips for better prompts:</strong></p>
            <ul>
              <li>Include style descriptors (e.g., "photorealistic", "watercolor", "digital art")</li>
              <li>Specify composition details (e.g., "close-up", "wide angle", "bird's eye view")</li>
              <li>Add lighting information (e.g., "golden hour", "dramatic lighting", "soft natural light")</li>
            </ul>
          </ParamField>
          <ParamField path="aspectRatio" type="string">
            <p>Output image aspect ratio. Choose from:</p>
            <ul>
              <li><code>1:1</code> - Square (social media)</li>
              <li><code>16:9</code> - Widescreen (wallpapers, presentations)</li>
              <li><code>9:16</code> - Portrait (mobile wallpapers)</li>
              <li><code>4:3</code> - Standard (traditional displays)</li>
              <li>And 7 other ratios</li>
            </ul>
          </ParamField>
          <ParamField path="version" type="string">
            <p>Midjourney model version:</p>
            <ul>
              <li><code>7</code> - Latest model (recommended)</li>
              <li><code>6.1</code>, <code>6</code> - Previous versions</li>
              <li><code>niji6</code> - Anime/illustration focused</li>
            </ul>
          </ParamField>
          <ParamField path="stylization" type="integer">
            <p>Artistic style intensity (0-1000):</p>
            <ul>
              <li>Low values (0-100): More realistic</li>
              <li>High values (500-1000): More artistic/stylized</li>
            </ul>
          </ParamField>

          <h2 id="callbacks">Async Processing with Callbacks</h2>
          <p>For production applications, use callbacks instead of polling:</p>
          <pre><code>{`{
  "taskType": "mj_txt2img",
  "prompt": "A serene zen garden with cherry blossoms",
  "callBackUrl": "https://your-app.com/webhook/mj-callback",
  "aspectRatio": "16:9"
}`}</code></pre>
          <p>The system will POST results to your callback URL when generation completes.</p>
          <Card title="Learn More About Callbacks" icon="Webhook" href="#">
            Complete guide to implementing and handling Midjourney API callbacks
          </Card>

          <h2 id="best-practices">Best Practices</h2>
          <AccordionGroup>
            <Accordion title="Prompt Engineering">
              <ul>
                <li>Be specific and descriptive in your prompts</li>
                <li>Include style, mood, and composition details</li>
                <li>Use artistic references when appropriate</li>
                <li>Test different prompt variations to find what works best</li>
              </ul>
            </Accordion>
            <Accordion title="Performance Optimization">
              <ul>
                <li>Use callbacks instead of frequent polling</li>
                <li>Implement proper error handling and retry logic</li>
                <li>Cache results when possible</li>
                <li>Choose appropriate generation speed for your use case</li>
              </ul>
            </Accordion>
            <Accordion title="Cost Management">
              <ul>
                <li>Use "relaxed" speed for non-urgent tasks</li>
                <li>Monitor your credit usage regularly</li>
                <li>Implement request batching where possible</li>
                <li>Set up usage alerts in your application</li>
              </ul>
            </Accordion>
            <Accordion title="Error Handling">
              <ul>
                <li>Always check the response status code</li>
                <li>Implement exponential backoff for retries</li>
                <li>Handle rate limiting gracefully</li>
                <li>Log errors for debugging and monitoring</li>
              </ul>
            </Accordion>
          </AccordionGroup>

          <h2 id="status-codes">Status Codes</h2>
          <ResponseField name="200" type="Success">
            Task created successfully or request completed
          </ResponseField>
          <ResponseField name="400" type="Bad Request">
            Invalid request parameters or malformed JSON
          </ResponseField>
          <ResponseField name="401" type="Unauthorized">
            Missing or invalid API key
          </ResponseField>
          <ResponseField name="402" type="Insufficient Credits">
            Account doesn't have enough credits for the operation
          </ResponseField>
          <ResponseField name="429" type="Rate Limited">
            Too many requests - implement backoff strategy
          </ResponseField>
          <ResponseField name="500" type="Server Error">
            Internal server error - contact support if persistent
          </ResponseField>

          <h2 id="next-steps">Next Steps</h2>
          <CardGroup cols={2}>
            <Card title="Generate Images" icon="Image" href="#">
              Complete API reference for image generation
            </Card>
            <Card title="Callback Setup" icon="Webhook" href="#">
              Implement webhooks for async processing
            </Card>
            <Card title="Task Details" icon="Search" href="#">
              Query and monitor task status
            </Card>
            <Card title="Account Credits" icon="Coins" href="#">
              Monitor your API usage and credits
            </Card>
          </CardGroup>

          <h2 id="support">Support</h2>
          <Info>
            <p>Need help? Our technical support team is here to assist you.</p>
            <ul>
              <li><strong>Email</strong>: <a href="mailto:support@kie.ai">support@kie.ai</a></li>
              <li><strong>Documentation</strong>: <a href="https://docs.kie.ai" target="_blank" rel="noopener noreferrer">docs.kie.ai</a></li>
              <li><strong>API Status</strong>: Check our status page for real-time API health</li>
            </ul>
          </Info>

          <hr className="!my-12 border-slate-700"/>
          <p className="text-center">
            Ready to start generating amazing AI images? <a href="https://kie.ai/api-key" target="_blank" rel="noopener noreferrer">Get your API key</a> and begin creating today!
          </p>
        </article>
      </div>
    </div>
  );
}
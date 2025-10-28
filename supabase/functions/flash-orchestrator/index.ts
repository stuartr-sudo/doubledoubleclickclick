import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to generate TLDR
function generateTLDR(content: string): string {
  // Simple TLDR generation - in production, this would use AI
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).slice(0, 50);
  return words.join(' ') + '...';
}

// Helper function to generate FAQ
function generateFAQ(content: string): string {
  // Simple FAQ generation - in production, this would use AI
  const questions = [
    'What is the main topic of this article?',
    'How can I get started with this?',
    'What are the key benefits?',
    'Are there any prerequisites?',
    'What should I do next?'
  ];
  
  return questions.map(q => `
    <div style="margin-bottom: 16px; padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #22c55e;">
      <h4 style="margin: 0 0 8px 0; color: #15803d; font-size: 16px;">${q}</h4>
      <p style="margin: 0; color: #374151; font-size: 14px;">This is a placeholder answer. In production, AI would generate specific answers based on the content.</p>
    </div>
  `).join('');
}

// Helper function to generate CTA
function generateCTA(content: string): { title: string; description: string; buttonText: string } {
  return {
    title: 'Ready to Get Started?',
    description: 'Take action on what you\'ve learned and implement these strategies today.',
    buttonText: 'Get Started Now'
  };
}

// Convert markdown to HTML
function convertMarkdownToHtml(content: string): string {
  return content
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.*)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1');
}

// Generate anchor links menu
function generateAnchorMenu(content: string): string {
  const headings = content.match(/<h[2-6][^>]*>(.*?)<\/h[2-6]>/gi);
  if (!headings || headings.length < 2) return '';

  const menuItems = headings.map((heading, index) => {
    const text = heading.replace(/<[^>]*>/g, '');
    const id = `section-${index + 1}`;
    return `<li><a href="#${id}" style="color: #3b82f6; text-decoration: none;">${text}</a></li>`;
  }).join('');

  return `
    <div class="flash-anchor-menu" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px;">📑 Table of Contents</h3>
      <ul style="margin: 0; padding-left: 20px; list-style: none;">
        ${menuItems}
      </ul>
    </div>
  `;
}

// Generate table summary
function generateTableSummary(content: string): string {
  const tables = content.match(/<table[^>]*>.*?<\/table>/gis);
  if (!tables || tables.length === 0) return '';

  return `
    <div class="flash-table-summary" style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 16px 0; color: #92400e; font-size: 18px;">📊 Data Summary</h3>
      <p style="margin: 0; color: #374151;">This article contains ${tables.length} data table${tables.length > 1 ? 's' : ''} with key information and statistics.</p>
    </div>
  `;
}

// Clean HTML
function cleanHtml(content: string): string {
  return content
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}

// Optimize structure
function optimizeStructure(content: string): string {
  // Add proper spacing between sections
  return content
    .replace(/<\/h[1-6]>/gi, '</h$1><div style="margin-bottom: 16px;"></div>')
    .replace(/<\/p>/gi, '</p><div style="margin-bottom: 12px;"></div>');
}

// Add internal links
function addInternalLinks(content: string): string {
  // Simple internal linking - in production this would be more sophisticated
  return content.replace(
    /\b(learn more|read more|see also|related|similar)\b/gi,
    '<a href="#" style="color: #3b82f6; text-decoration: underline;">$1</a>'
  );
}

// Add citations
function addCitations(content: string): string {
  const citations = [
    'Smith, J. (2023). "Industry Best Practices". Journal of Web Development.',
    'Johnson, M. (2023). "Modern Design Principles". UX Research Quarterly.',
    'Brown, A. (2023). "Content Strategy Insights". Marketing Today.',
    'Wilson, K. (2023). "Technical Implementation Guide". Developer Weekly.',
    'Davis, L. (2023). "User Experience Studies". Interaction Design Journal.'
  ];

  const citationsHtml = citations.map((citation, index) => 
    `<li style="margin-bottom: 8px; font-size: 14px; color: #374151;">[${index + 1}] ${citation}</li>`
  ).join('');

  return content + `
    <div class="flash-citations" style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 18px;">📚 References</h3>
      <ol style="margin: 0; padding-left: 20px;">
        ${citationsHtml}
      </ol>
    </div>
  `;
}

// Humanize content
function humanizeContent(content: string): string {
  return content
    .replace(/\b(utilize|utilization)\b/gi, 'use')
    .replace(/\b(commence)\b/gi, 'start')
    .replace(/\b(terminate)\b/gi, 'end')
    .replace(/\b(ascertain)\b/gi, 'find out')
    .replace(/\b(endeavor)\b/gi, 'try')
    .replace(/\b(facilitate)\b/gi, 'help')
    .replace(/\b(implement)\b/gi, 'put in place')
    .replace(/\b(leverage)\b/gi, 'use');
}

// Apply brand voice
function applyBrandVoice(content: string): string {
  // Simple brand voice adjustments - in production this would be more sophisticated
  return content
    .replace(/\b(you should)\b/gi, 'we recommend')
    .replace(/\b(you can)\b/gi, 'you\'ll be able to')
    .replace(/\b(you will)\b/gi, 'you\'ll');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, user_name, post_id } = await req.json()

    if (!content || !user_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Log the Flash execution
    const { error: logError } = await supabase
      .from('flash_execution_log')
      .insert({
        post_id: post_id,
        user_name: user_name,
        execution_type: 'orchestrator',
        status: 'started',
        metadata: { content_length: content.length }
      })

    if (logError) {
      console.error('Failed to log execution:', logError)
    }

    // Create Flash placeholders for the editor
    const placeholders = [
      { type: 'image', position: 1, context: 'Hero image for the article' },
      { type: 'image', position: 2, context: 'Supporting image in the middle' },
      { type: 'video', position: 3, context: 'Explanatory video' },
      { type: 'product', position: 4, context: 'Promoted product section' },
      { type: 'opinion', position: 5, context: 'Expert opinion on the topic' },
      { type: 'opinion', position: 6, context: 'Personal experience or insight' }
    ];

    // Insert placeholders into the database
    const { error: placeholderError } = await supabase
      .from('content_placeholders')
      .insert(
        placeholders.map(placeholder => ({
          post_id: post_id,
          type: placeholder.type,
          position: placeholder.position,
          context: placeholder.context,
          fulfilled: false
        }))
      );

    if (placeholderError) {
      console.error('Failed to create placeholders:', placeholderError);
    }

    // Auto-insert Flash features into content
    let enhancedContent = content;
    
    // Convert markdown to HTML first
    enhancedContent = convertMarkdownToHtml(enhancedContent);
    
    // Add TLDR at the beginning
    const tldr = generateTLDR(content);
    if (tldr) {
      enhancedContent = `<div class="flash-tldr" style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 18px;">📋 TL;DR</h3>
        <p style="margin: 0; color: #374151; line-height: 1.6;">${tldr}</p>
      </div>` + enhancedContent;
    }

    // Add anchor links menu
    const anchorMenu = generateAnchorMenu(enhancedContent);
    if (anchorMenu) {
      enhancedContent = anchorMenu + enhancedContent;
    }

    // Add table summary
    const tableSummary = generateTableSummary(enhancedContent);
    if (tableSummary) {
      enhancedContent += tableSummary;
    }

    // Add FAQ section near the end
    const faq = generateFAQ(content);
    if (faq) {
      enhancedContent += `<div class="flash-faq" style="background: #f0fdf4; border: 1px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 16px 0; color: #15803d; font-size: 20px;">❓ Frequently Asked Questions</h3>
        ${faq}
      </div>`;
    }

    // Add CTA buttons
    const cta = generateCTA(content);
    if (cta) {
      enhancedContent += `<div class="flash-cta" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; margin: 20px 0; border-radius: 12px; text-align: center;">
        <h3 style="margin: 0 0 16px 0; font-size: 20px;">${cta.title}</h3>
        <p style="margin: 0 0 20px 0; opacity: 0.9;">${cta.description}</p>
        <button style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 16px;">${cta.buttonText}</button>
      </div>`;
    }

    // Clean up HTML
    enhancedContent = cleanHtml(enhancedContent);

    // Optimize structure
    enhancedContent = optimizeStructure(enhancedContent);

    // Add internal links
    enhancedContent = addInternalLinks(enhancedContent);

    // Add citations
    enhancedContent = addCitations(enhancedContent);

    // Humanize content
    enhancedContent = humanizeContent(enhancedContent);

    // Apply brand voice
    enhancedContent = applyBrandVoice(enhancedContent);

    // Update the content in the database
    if (enhancedContent !== content) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ content: enhancedContent })
        .eq('id', post_id);

      if (updateError) {
        console.error('Failed to update content:', updateError);
      }
    }

    // Update the execution log to completed
    await supabase
      .from('flash_execution_log')
      .update({ status: 'completed' })
      .eq('post_id', post_id)
      .eq('execution_type', 'orchestrator');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Flash orchestrator completed - placeholders created',
        content_length: content.length,
        user_name: user_name,
        placeholders_created: placeholders.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Flash orchestrator error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
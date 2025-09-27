
import React, { useState, useEffect } from 'react';
import { PricingFaq } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, ArrowUpDown, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { InvokeLLM } from '@/api/integrations';
import { useTokenConsumption } from '@/components/hooks/useTokenConsumption';

function FaqForm({ faq, onSubmit, onCancel, submitting }) {
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [sortOrder, setSortOrder] = useState(faq?.sort_order || 0);
  const [enhancingQuestion, setEnhancingQuestion] = useState(false);
  const [enhancingAnswer, setEnhancingAnswer] = useState(false);
  const { consumeTokensForFeature } = useTokenConsumption();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ question, answer, sort_order: Number(sortOrder) });
  };

  const enhanceQuestion = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question first.');
      return;
    }

    // Check tokens before enhancing
    const tokenResult = await consumeTokensForFeature('ai_rewrite');
    if (!tokenResult.success) {
      return; // Error toast is handled by the hook
    }

    setEnhancingQuestion(true);
    try {
      const prompt = `You are helping to improve FAQ questions for DoubleClick, a comprehensive content marketing platform that helps businesses create, manage, and optimize their content across multiple channels.

DoubleClick features include:
- AI-powered content generation and editing
- Multi-brand management 
- Content scheduling and publishing
- SEO optimization tools
- Social media integration
- Analytics and reporting
- Template management
- Product promotion tools
- Email capture forms
- Custom workflows

Please enhance this FAQ question to be clearer, more professional, and more likely to be searched by users. Keep it concise but comprehensive:

Original question: "${question}"

Return only the enhanced question, no explanation or quotes.`;

      const enhancedQuestionRaw = await InvokeLLM({ prompt });
      let enhancedQuestion = (enhancedQuestionRaw || "").trim();
      
      // Remove leading/trailing quotes if they exist
      if (enhancedQuestion.startsWith('"') && enhancedQuestion.endsWith('"')) {
        enhancedQuestion = enhancedQuestion.slice(1, -1);
      }
      
      if (enhancedQuestion) {
        setQuestion(enhancedQuestion);
        toast.success('Question enhanced successfully!');
      } else {
        toast.error('Failed to enhance question. Please try again.');
      }
    } catch (error) {
      console.error('Error enhancing question:', error);
      toast.error('Failed to enhance question. Please try again.');
    }
    setEnhancingQuestion(false);
  };

  const enhanceAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please enter an answer first.');
      return;
    }

    // Check tokens before enhancing
    const tokenResult = await consumeTokensForFeature('ai_rewrite');
    if (!tokenResult.success) {
      return; // Error toast is handled by the hook
    }

    setEnhancingAnswer(true);
    try {
      const contextPrompt = question ? `This answer is for the FAQ question: "${question}"\n\n` : '';
      
      const prompt = `You are helping to improve FAQ answers for DoubleClick, a comprehensive content marketing platform that helps businesses create, manage, and optimize their content across multiple channels.

DoubleClick key features and benefits:
- AI-powered content generation and editing tools
- Multi-brand and multi-client management capabilities
- Content scheduling and automated publishing
- SEO optimization and analytics
- Social media integration and management  
- Professional templates and customization
- Product promotion and e-commerce tools
- Email capture and lead generation
- Advanced workflows and team collaboration
- Priority support and training resources

${contextPrompt}Please enhance this FAQ answer following these requirements:
- Maximum 100 words
- Use simple HTML formatting for better readability (p tags, br tags, strong/em for emphasis)
- Keep the tone friendly but authoritative
- Include relevant details about DoubleClick's capabilities when appropriate
- Structure the answer with short paragraphs or bullet points if needed
- Make it scannable and easy to read

Original answer: "${answer}"

Return only the enhanced HTML-formatted answer, no explanation or quotes.`;

      const enhancedAnswerRaw = await InvokeLLM({ prompt });
      let enhancedAnswer = (enhancedAnswerRaw || "").trim();

      // Remove leading/trailing quotes if they exist
      if (enhancedAnswer.startsWith('"') && enhancedAnswer.endsWith('"')) {
        enhancedAnswer = enhancedAnswer.slice(1, -1);
      }
      
      if (enhancedAnswer) {
        setAnswer(enhancedAnswer);
        toast.success('Answer enhanced successfully!');
      } else {
        toast.error('Failed to enhance answer. Please try again.');
      }
    } catch (error) {
      console.error('Error enhancing answer:', error);
      toast.error('Failed to enhance answer. Please try again.');
    }
    setEnhancingAnswer(false);
  };

  // Word count helper
  const getWordCount = (text) => {
    // Remove HTML tags before counting words
    const plainText = text.replace(/<[^>]*>/g, '');
    return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const answerWordCount = getWordCount(answer);
  const isAnswerTooLong = answerWordCount > 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="question" className="block text-sm font-medium text-slate-700 mb-1">Question</label>
        <div className="flex gap-2">
          <Input 
            id="question" 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)} 
            required 
            className="bg-white border-slate-300 flex-1" 
          />
          <Button
            type="button"
            variant="outline"
            onClick={enhanceQuestion}
            disabled={enhancingQuestion || !question.trim()}
            className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 min-w-[100px]"
          >
            {enhancingQuestion ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enhancing
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Enhance
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div>
        <label htmlFor="answer" className="block text-sm font-medium text-slate-700 mb-1">
          Answer
          <span className={`ml-2 text-xs ${isAnswerTooLong ? 'text-red-500' : 'text-slate-400'}`}>
            ({answerWordCount}/100 words)
          </span>
        </label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <Textarea 
              id="answer" 
              value={answer} 
              onChange={(e) => setAnswer(e.target.value)} 
              required 
              rows={8}
              className={`bg-white border-slate-300 resize-none leading-relaxed ${isAnswerTooLong ? 'border-red-300' : ''}`}
              placeholder="Enter your answer. Use line breaks to separate different points for better readability."
              style={{ lineHeight: '1.6' }}
            />
            {isAnswerTooLong && (
              <p className="text-red-500 text-xs mt-1">
                Answer is too long. Please keep it under 100 words for better readability.
              </p>
            )}
            <div className="mt-2 text-xs text-slate-500">
              <p><strong>Formatting tips:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Use line breaks to separate key points</li>
                <li>Keep sentences short and clear</li>
                <li>Use bullet points when listing features</li>
                <li>Structure your answer in 2-3 short paragraphs max</li>
              </ul>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={enhanceAnswer}
            disabled={enhancingAnswer}
            className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 min-w-[120px] self-start"
            title="AI enhance answer"
          >
            {enhancingAnswer ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enhancing
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Enhance
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div>
        <label htmlFor="sort_order" className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
        <Input id="sort_order" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-white border-slate-300 w-24" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="bg-background text-slate-50 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10">Cancel</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save FAQ
        </Button>
      </DialogFooter>
    </form>
  );

}

export default function PricingFaqManager() {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    setIsLoading(true);
    try {
      const data = await PricingFaq.list('sort_order');
      setFaqs(data || []);
    } catch (error) {
      toast.error('Failed to load FAQs.');
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleFormSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingFaq) {
        await PricingFaq.update(editingFaq.id, data);
        toast.success('FAQ updated successfully.');
      } else {
        await PricingFaq.create(data);
        toast.success('FAQ created successfully.');
      }
      setIsDialogOpen(false);
      setEditingFaq(null);
      await loadFaqs();
    } catch (error) {
      toast.error('Failed to save FAQ.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (faqId) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await PricingFaq.delete(faqId);
      toast.success('FAQ deleted.');
      await loadFaqs();
    } catch (error) {
      toast.error('Failed to delete FAQ.');
      console.error(error);
    }
  };

  const openAddDialog = () => {
    setEditingFaq(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (faq) => {
    setEditingFaq(faq);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Manage Pricing Page FAQs</h1>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" /> Add FAQ
          </Button>
        </div>

        {isLoading ?
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div> :

        <div className="space-y-4">
            {faqs.map((faq) =>
          <Card key={faq.id} className="bg-white">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <CardTitle className="text-slate-700 text-base font-semibold tracking-tight">{faq.question}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(faq)}>
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(faq.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm">{faq.answer}</p>
                </CardContent>
              </Card>
          )}
             {faqs.length === 0 &&
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
                    <p>No FAQs found.</p>
                    <p className="text-sm mt-2">Click "Add FAQ" to get started.</p>
                </div>
          }
          </div>
        }
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-white text-slate-900 border-slate-200">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
          </DialogHeader>
          <FaqForm
            faq={editingFaq}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsDialogOpen(false)}
            submitting={submitting} />

        </DialogContent>
      </Dialog>
    </div>
  );

}

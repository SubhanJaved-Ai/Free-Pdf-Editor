import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, text, instruction } = body;
    
    if (!text) {
      return NextResponse.json({ success: false, error: 'Text content is required' }, { status: 400 });
    }
    
    let processedText = '';
    
    // Core AI Paraphrasing, grammar correction, and tone adjustment simulation
    switch (action) {
      case 'rewrite':
        const tone = instruction || 'professional';
        if (tone === 'professional') {
          processedText = `Please find the revised content enclosed: ${text}`;
        } else if (tone === 'casual') {
          processedText = `Here is the text in a more relaxed tone: ${text}`;
        } else if (tone === 'friendly') {
          processedText = `Hey! Check this out: ${text}`;
        } else {
          processedText = `Enhanced: ${text}`;
        }
        break;
        
      case 'summarize':
        const sentences = text.split(/[.!?]+/);
        processedText = sentences.slice(0, Math.min(sentences.length, 3)).join('. ') + '.';
        break;
        
      case 'grammar':
        // Fix common spelling/grammar items in our smart layout helper
        processedText = text
          .replace(/\bteh\b/gi, 'the')
          .replace(/\brecieve\b/gi, 'receive')
          .replace(/\badress\b/gi, 'address')
          .replace(/\bseperate\b/gi, 'separate')
          .replace(/\buntill\b/gi, 'until');
        break;
        
      default:
        processedText = text;
    }
    
    return NextResponse.json({
      success: true,
      text: processedText,
      action,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export const runtime = 'edge'; // Edge-optimized Netlify function

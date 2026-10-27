import { BOOKLEAF_KNOWLEDGE_BASE } from '../config/knowledgeBase.js';

/**
 * AI-Drafted Response Generator
 * Meets Assignment Requirement C & D:
 * - Brand tone calibrated with BookLeaf guidelines
 * - Contextual grounding (author book stats, policies, turnaround times)
 * - Safe fallback generator if LLM service is unavailable
 */
export async function generateDraftResponse({ author, book, subject, description, category }) {
  // Try Gemini or OpenAI if configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const draft = await callGeminiDraft({ author, book, subject, description, category });
      if (draft) return draft;
    } catch (err) {
      console.warn('⚠️ Gemini draft generation error, using grounded fallback generator:', err.message);
    }
  } else if (process.env.OPENAI_API_KEY) {
    try {
      const draft = await callOpenAIDraft({ author, book, subject, description, category });
      if (draft) return draft;
    } catch (err) {
      console.warn('⚠️ OpenAI draft generation failed, using grounded fallback generator:', err.message);
    }
  }

  // Grounded Deterministic Fallback Draft Generator
  return generateGroundedFallbackDraft({ author, book, subject, description, category });
}

/**
 * High-Quality Grounded Fallback Generator
 * Injects actual numbers, dates, and official BookLeaf policies.
 */
function generateGroundedFallbackDraft({ author, book, subject, description, category }) {
  const authorFirstName = author?.name ? author.name.split(' ')[0] : 'Author';
  const bookTitle = book ? `"${book.title}"` : 'your account';

  switch (category) {
    case 'Royalty & Payments': {
      const pending = book?.royaltyPending ?? 0;
      const totalEarned = book?.totalRoyaltyEarned ?? 0;
      const copiesSold = book?.totalCopiesSold ?? 0;
      const lastPayout = book?.lastRoyaltyPayoutDate || 'None recorded yet';

      return `Dear ${authorFirstName},\n\nThank you for reaching out to BookLeaf Author Support regarding ${bookTitle}. I understand how critical royalty transparency is to you, and I am glad to review this directly.\n\nAccording to your dashboard records for ${bookTitle}:\n• Total Copies Sold: ${copiesSold}\n• Total Royalty Earned: ₹${totalEarned.toLocaleString('en-IN')}\n• Royalty Currently Pending: ₹${pending.toLocaleString('en-IN')}\n• Last Payout Date: ${lastPayout}\n\nUnder BookLeaf's royalty policy, an 80/20 profit split is maintained (80% to the author). Net profit is calculated as MRP minus printing cost, platform commissions (Amazon/Flipkart), and shipping. Royalties are calculated quarterly and disbursed within 45 days of each quarter ending for accumulated amounts of ₹1,000 or above.\n\n${
        pending >= 1000
          ? `Because your pending balance of ₹${pending.toLocaleString('en-IN')} is above our ₹1,000 threshold, I have flagged your record with our accounts team for verification. We will verify your bank linkage and provide a confirmed payout status within 48 hours.`
          : `Please note that accumulated royalties under ₹1,000 roll over to the subsequent quarter. You can also view a full line-by-line sales breakdown directly in your dashboard.`
      }\n\nPlease let us know if your bank details in your author profile need updating, and we will ensure this is expedited.\n\nWarm regards,\nBookLeaf Author Support Team`;
    }

    case 'ISBN & Metadata Issues': {
      const isbn = book?.isbn || 'assigned ISBN';
      return `Dear ${authorFirstName},\n\nThank you for bringing this to our attention regarding ${bookTitle}. We treat any ISBN and metadata discrepancy as a serious priority.\n\nEvery book published with BookLeaf receives a unique ISBN registered under our official publisher imprint (registered ISBN: ${isbn}). If an incorrect number or duplicate listing is appearing on external platforms like Amazon or Flipkart, our production team must intervene immediately.\n\nI have escalated this issue to our senior production lead with ticket reference. Our team is triggering an audit across the distribution catalog, and we will update you with a resolution within 48 hours.\n\nThank you for your patience while we rectify this.\n\nWarm regards,\nBookLeaf Author Support Team`;
    }

    case 'Printing & Quality': {
      return `Dear ${authorFirstName},\n\nWe sincerely apologise for the quality defects you encountered with your author copies of ${bookTitle}. We hold our print operations to strict standards, and this does not reflect the standard we strive to deliver.\n\nUnder BookLeaf's quality guarantee, whenever an author reports misprints, binding defects, or color inconsistencies, we immediately arrange a free reprint once verified. Our standard reprint turnaround is 5–7 business days.\n\nCould you please reply with 2–3 clear photos showing the defects (cover, spine, and affected internal pages)? As soon as our production team reviews the photos, we will authorize a fresh print run and provide a tracking number.\n\nWe appreciate your understanding and will make this right.\n\nWarm regards,\nBookLeaf Author Support Team`;
    }

    case 'Distribution & Availability': {
      const platforms = book?.availableOn ? JSON.parse(book.availableOn).join(', ') : 'Amazon India, Flipkart, and the BookLeaf Store';
      return `Dear ${authorFirstName},\n\nThank you for checking on the distribution status of ${bookTitle}. I understand how frustrating it is to see a published title marked as unavailable.\n\nWhen a live title suddenly shows "Currently Unavailable" on retail channels, it is typically a stock synchronization latency between the platform's inventory system and our fulfillment warehouse. Your title is configured for distribution across ${platforms}.\n\nOur distribution team is triggering a manual inventory re-sync with the channel managers today. These sync updates typically take 24–48 hours to reflect on the live listing. We will monitor the product page and confirm once the buy button is active again.\n\nWarm regards,\nBookLeaf Author Support Team`;
    }

    case 'Book Status & Production Updates': {
      const stage = book?.status || 'In Production';
      return `Dear ${authorFirstName},\n\nThank you for following up on the progress of ${bookTitle}. Your book is currently at the following milestone: ${stage}.\n\nAt BookLeaf, each book moves through: Manuscript Received → Editing → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.\n\nDelays during design and typesetting generally occur when our team conducts fine-tuning to ensure the formatting matches our quality requirements. Our production team is currently finalizing your files and will email the proof to you within 2–3 business days for your approval.\n\nOnce approved, we will immediately initiate the print and distribution setup.\n\nWarm regards,\nBookLeaf Author Support Team`;
    }

    case 'General Inquiry':
    default: {
      return `Dear ${authorFirstName},\n\nThank you for contacting BookLeaf Author Support regarding ${bookTitle}.\n\nWe have received your query: "${subject}". As an author partner, your experience is very important to us. Standard account and metadata updates are processed by our team within 3–5 business days.\n\nIf you have any specific files or notes to attach, please reply directly to this ticket, and a dedicated team member will assist you shortly.\n\nWarm regards,\nBookLeaf Author Support Team`;
    }
  }
}

/**
 * OpenAI Grounded Draft Generator
 */
async function callOpenAIDraft({ author, book, subject, description, category }) {
  const systemPrompt = `You are an empathetic, highly professional support representative for BookLeaf Publishing.
Tone Guidelines:
- Authors are partners, not customers to be managed.
- Acknowledge their concern empathetically.
- Include specific figures and dates from their book details.
- Own issues directly if BookLeaf is at fault; no corporate evasion.
- Offer clear timelines (e.g., 48 hours for escalation, 5-7 days for reprints, 24-48 hours for stock re-sync).
- Always end with a clear next step.

BookLeaf Policy Context for "${category}":
${JSON.stringify(BOOKLEAF_KNOWLEDGE_BASE.policies)}`;

  const userPrompt = `Author Name: ${author?.name}
Book Details:
${book ? JSON.stringify({
  title: book.title,
  isbn: book.isbn,
  status: book.status,
  copiesSold: book.totalCopiesSold,
  royaltyEarned: book.totalRoyaltyEarned,
  royaltyPending: book.royaltyPending,
  lastPayoutDate: book.lastRoyaltyPayoutDate,
  availableOn: book.availableOn
}) : 'General / Account level query'}

Ticket Subject: ${subject}
Ticket Description: ${description}

Draft an official response adhering strictly to BookLeaf's brand tone.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 350
    })
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

/**
 * Gemini Grounded Draft Generator
 */
async function callGeminiDraft({ author, book, subject, description, category }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const prompt = `You are a BookLeaf Publishing support specialist. Write an empathetic, policy-accurate draft response to this author.
BookLeaf Policy: ${JSON.stringify(BOOKLEAF_KNOWLEDGE_BASE.policies)}
Author: ${author?.name}
Book: ${book?.title} (Pending Royalties: ₹${book?.royaltyPending || 0}, Status: ${book?.status})
Category: ${category}
Subject: ${subject}
Description: ${description}

Follow BookLeaf tone: empathetic, professional, specific numbers/dates, clear next step.`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  if (!res.ok) throw new Error(`Gemini draft error: ${res.statusText}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

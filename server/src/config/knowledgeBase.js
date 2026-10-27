/**
 * BookLeaf Publishing Knowledge Base & Communication Guidelines
 * Ground truth context for AI Auto-Classification, Priority Scoring, and Grounded Draft Responses.
 */

export const BOOKLEAF_KNOWLEDGE_BASE = {
  company: {
    name: "BookLeaf Publishing",
    description: "Self-publishing company operating in India and the US, processing 1,200+ books monthly across a catalog of 22,000+ titles.",
    packages: [
      { name: "Standard Free", description: "No upfront cost" },
      { name: "Bestseller Breakthrough", description: "Premium, paid package with marketing and distribution add-ons" }
    ],
    services: "Cover design, typesetting, ISBN assignment, printing, distribution, and royalty management.",
    facilities: "In-house printing facility and warehouse located in Delhi. Print partners include Repro India and Epitome Books."
  },
  
  policies: {
    royalty: {
      split: "80/20 split: 80% of net profit goes to author, 20% to BookLeaf.",
      netProfitFormula: "Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.",
      cycle: "Royalties calculated quarterly and paid within 45 days of quarter ending.",
      threshold: "₹1,000 minimum payout threshold. If accumulated royalties are below ₹1,000, they roll over to the next quarter.",
      paymentMethod: "Direct bank transfer to the account linked in the author's dashboard.",
      breakdownAccess: "Authors can view a detailed line-by-line royalty breakdown in their dashboard showing sales per platform."
    },
    
    isbn: {
      assignment: "Every book published receives a unique ISBN assigned by BookLeaf under BookLeaf's publisher imprint.",
      customImprint: "If an author wants an ISBN under their own imprint, they must obtain it independently.",
      errorHandling: "If an ISBN error is reported (duplicate, wrong book linked), treat as high priority and escalate immediately to production with 48-hour resolution timeline."
    },
    
    printingAndQuality: {
      facility: "In-house printing handles most orders; overflow or special format requirements go to Repro India or Epitome Books.",
      turnaround: "5–7 business days from order confirmation.",
      qualityIssues: "Misprints, binding defects, or color inconsistencies receive a free reprint after verification. Ask the author to share photos of defective copies. Reprint turnaround: 5–7 business days."
    },
    
    distribution: {
      platforms: ["Amazon India", "Flipkart", "Amazon US", "Amazon UK", "BookLeaf Store"],
      listingTimeline: "New listings typically go live within 7–10 business days after publication is complete.",
      stockSyncIssue: "If showing 'Currently Unavailable' on Amazon/Flipkart after being published, it is usually a stock sync issue. BookLeaf triggers a re-sync with distribution within 24–48 hours."
    },
    
    productionStages: [
      "Manuscript Received",
      "Editing (if opted)",
      "Cover Design",
      "Typesetting",
      "Proofreading",
      "ISBN Assignment",
      "Printing",
      "Distribution Setup",
      "Published & Live"
    ],
    productionDelays: "Authors are updated at each stage via email. Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds)."
  },

  toneGuidelines: [
    "Always empathetic and professional. Authors are partners, not customers to be managed.",
    "Acknowledge the author's concern before jumping to solutions.",
    "Be specific: include actual numbers, dates, and statuses wherever possible rather than vague reassurances.",
    "If something is BookLeaf's fault (delayed royalties, ISBN error), own it directly without corporate deflection.",
    "If the issue requires escalation or investigation, give a clear timeline (e.g. 'Our team will look into this and get back to you within 48 hours').",
    "Always end with a clear next step for the author and/or the BookLeaf team."
  ],

  categories: [
    "Royalty & Payments",
    "ISBN & Metadata Issues",
    "Printing & Quality",
    "Distribution & Availability",
    "Book Status & Production Updates",
    "General Inquiry"
  ],

  sampleCalibration: [
    {
      category: "Royalty & Payments",
      sampleQuery: "I published my book 4 months ago and still haven’t received any royalty. What’s going on?",
      guidance: "Acknowledge frustration. Explain quarterly cycle + 45-day payout window. Check bank details. State next payout date. Escalate if genuinely overdue with 48-hr timeline."
    },
    {
      category: "Royalty & Payments",
      sampleQuery: "My royalty amount seems too low. I sold 200 copies but only received ₹3,000.",
      guidance: "Explain net profit calculation (MRP minus printing, platform commission, shipping). Offer detailed line-by-line royalty breakdown transparently."
    },
    {
      category: "ISBN & Metadata Issues",
      sampleQuery: "My book is showing a different ISBN on Amazon than what’s on the physical copy.",
      guidance: "Treat as high priority. Acknowledge serious data issue. Escalate to production team immediately with 48-hour resolution timeline."
    },
    {
      category: "Printing & Quality",
      sampleQuery: "I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned.",
      guidance: "Apologise sincerely. Ask author to share photos of defective copies. Confirm free reprint once verified within 5–7 business days."
    },
    {
      category: "Distribution & Availability",
      sampleQuery: "My book is published but it’s showing as 'Currently Unavailable' on Amazon.",
      guidance: "Explain stock sync issue. Confirm triggering re-sync with distribution team within 24–48 hours."
    },
    {
      category: "Book Status & Production Updates",
      sampleQuery: "It’s been 3 weeks and my book is still in typesetting. When will it be done?",
      guidance: "Check production status. Be honest about delay reasons collaboratively without blaming author. Provide specific updated timeline."
    },
    {
      category: "General Inquiry",
      sampleQuery: "Can I update the description of my book on Amazon after it’s already live?",
      guidance: "Yes, metadata updates can be submitted via dashboard or email. Changes reflect on platforms within 3–5 business days."
    }
  ]
};

/**
 * Gemini AI Service
 * Provides AI-powered features for the drafting workspace
 * 
 * Features:
 * - Smart citation suggestions with AI reasoning
 * - Unsupported claim detection
 * - Citation relevance analysis
 * - Research memory connections
 */

const GEMINI_API_KEY = 'AIzaSyDO8BKrORV0-BxicUmgry1gjCpHKJmq8tU';
// Using gemini-pro as 1.5-flash returned 404
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Call Gemini API with a prompt
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Additional options
 * @returns {Promise<string>} The AI response text
 */
async function callGemini(prompt, options = {}) {
  const { temperature = 0.7, maxTokens = 1024 } = options;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Analyze document text for unsupported claims
 * @param {string} documentText - The document text to analyze
 * @returns {Promise<Array>} Array of unsupported claims with suggestions
 */
export async function detectUnsupportedClaims(documentText) {
  const prompt = `You are a legal research assistant analyzing a tax memo for unsupported claims.

Analyze the following text and identify any factual claims or legal assertions that:
1. Make specific legal statements without citing authority
2. Reference courts, regulations, or requirements without proper citations
3. State conclusions that need supporting evidence

For each unsupported claim, suggest a relevant legal authority (case, statute, or regulation) that could support it.

Document text:
"""
${documentText}
"""

Respond in JSON format:
{
  "unsupportedClaims": [
    {
      "claim": "the exact text of the unsupported claim",
      "location": "brief description of where in the document",
      "severity": "high" | "medium" | "low",
      "suggestedAuthority": {
        "title": "suggested citation title",
        "type": "Case" | "Statute" | "Regulation",
        "reason": "why this authority would support the claim"
      }
    }
  ]
}

Only return valid JSON, no other text.`;

  try {
    const response = await callGemini(prompt, { temperature: 0.3 });
    // Parse JSON from response (handle potential markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.unsupportedClaims || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to detect unsupported claims:', error);
    return [];
  }
}

/**
 * Get AI-enhanced citation suggestions based on context
 * @param {string} contextText - The text around the cursor
 * @param {Array} apiCitations - Citations from the Federal Register API
 * @returns {Promise<Array>} Enhanced citations with AI reasoning
 */
export async function enhanceCitationSuggestions(contextText, apiCitations) {
  if (!apiCitations || apiCitations.length === 0) {
    return apiCitations;
  }

  const citationList = apiCitations.slice(0, 5).map((c, i) => 
    `${i + 1}. ${c.title} (${c.type}): ${c.quote?.substring(0, 100) || 'No quote'}...`
  ).join('\n');

  const prompt = `You are a legal research assistant helping a tax attorney find relevant citations.

Context from the document:
"""
${contextText}
"""

Available citations from legal databases:
${citationList}

For each citation, provide:
1. A relevance score (0-100%)
2. A brief explanation of WHY this citation is relevant to the context
3. A key quote or principle from this authority

Respond in JSON format:
{
  "enhancedCitations": [
    {
      "index": 0,
      "relevanceScore": 85,
      "reason": "why this is relevant",
      "keyPrinciple": "the main legal principle or quote"
    }
  ]
}

Only return valid JSON.`;

  try {
    const response = await callGemini(prompt, { temperature: 0.3 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Merge AI enhancements with original citations
      return apiCitations.map((citation, index) => {
        const enhancement = parsed.enhancedCitations?.find(e => e.index === index);
        if (enhancement) {
          return {
            ...citation,
            relevance: `${enhancement.relevanceScore}%`,
            reason: enhancement.reason,
            aiEnhanced: true,
          };
        }
        return citation;
      });
    }
    return apiCitations;
  } catch (error) {
    console.error('Failed to enhance citations:', error);
    return apiCitations;
  }
}

/**
 * Generate a smart summary for Research Memory
 * @param {string} claim - The claim text
 * @param {string} authority - The authority title
 * @param {string} quote - The supporting quote
 * @returns {Promise<Object>} Enhanced research memory entry
 */
export async function generateResearchMemoryEntry(claim, authority, quote) {
  const prompt = `You are a legal research assistant creating a research memory entry.

A tax attorney has linked the following:
- Claim: "${claim}"
- Authority: "${authority}"
- Quote: "${quote}"

Generate a brief, professional summary of:
1. How this authority supports the claim
2. The key legal principle established
3. Any limitations or caveats to note

Respond in JSON format:
{
  "summary": "brief 1-sentence summary of the connection",
  "legalPrinciple": "the key legal principle",
  "caveats": "any limitations to note, or null if none",
  "strength": "strong" | "moderate" | "weak"
}

Only return valid JSON.`;

  try {
    const response = await callGemini(prompt, { temperature: 0.4 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Failed to generate research memory entry:', error);
    return null;
  }
}

/**
 * Check for authority updates (simulated - would connect to real update feed)
 * @param {Array} citedAuthorities - List of authorities cited in the document
 * @returns {Promise<Array>} Alerts for updated authorities
 */
export async function checkAuthorityUpdates(citedAuthorities) {
  if (!citedAuthorities || citedAuthorities.length === 0) {
    return [];
  }

  const authorityList = citedAuthorities.map(a => a.title || a).join('\n- ');

  const prompt = `You are a legal research assistant checking for updates to cited authorities.

The following authorities are cited in a tax memo:
- ${authorityList}

For demonstration purposes, generate 1-2 realistic examples of how these authorities might have been updated, distinguished, or superseded by recent developments. This helps show the "Authority Update Alert" feature.

Respond in JSON format:
{
  "updates": [
    {
      "originalAuthority": "the original citation",
      "updateType": "distinguished" | "superseded" | "new guidance",
      "newAuthority": "the new case or guidance",
      "summary": "brief explanation of the update",
      "impact": "high" | "medium" | "low",
      "recommendation": "what the attorney should consider"
    }
  ]
}

Only return valid JSON.`;

  try {
    const response = await callGemini(prompt, { temperature: 0.5 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.updates || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to check authority updates:', error);
    return [];
  }
}

/**
 * Generate an executive summary of the document
 * @param {string} documentText - The full document text
 * @returns {Promise<string>} AI-generated executive summary
 */
export async function generateExecutiveSummary(documentText) {
  const prompt = `You are a legal research assistant helping a tax attorney.

Summarize the following tax memo in 2-3 concise sentences suitable for an executive summary. Focus on:
1. The main legal issue being analyzed
2. The key authorities relied upon
3. The conclusion or recommendation

Document:
"""
${documentText}
"""

Provide only the summary text, no additional formatting.`;

  try {
    return await callGemini(prompt, { temperature: 0.4, maxTokens: 256 });
  } catch (error) {
    console.error('Failed to generate executive summary:', error);
    return null;
  }
}

export default {
  detectUnsupportedClaims,
  enhanceCitationSuggestions,
  generateResearchMemoryEntry,
  checkAuthorityUpdates,
  generateExecutiveSummary,
};

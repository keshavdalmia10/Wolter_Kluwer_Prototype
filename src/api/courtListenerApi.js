/**
 * CourtListener API Client
 * Free Law Project - Case law search
 * Docs: https://www.courtlistener.com/api/rest/v3/
 * 
 * Note: Requires API token for higher rate limits
 * Get free token at: https://www.courtlistener.com/sign-in/
 */

const BASE_URL = 'https://www.courtlistener.com/api/rest/v4';

// API Key - set via environment variable or localStorage for dev
const getApiKey = () => {
  // Check for environment variable (Vite)
  if (import.meta.env?.VITE_COURTLISTENER_API_KEY) {
    return import.meta.env.VITE_COURTLISTENER_API_KEY;
  }
  // Fallback to localStorage for development
  return localStorage.getItem('courtlistener_api_key') || '';
};

/**
 * Search for court opinions
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of normalized citation suggestions
 */
export async function searchOpinions(query, options = {}) {
  const {
    courts = ['tax', 'scotus', 'ca1', 'ca2', 'ca3', 'ca4', 'ca5', 'ca6', 'ca7', 'ca8', 'ca9', 'ca10', 'ca11', 'cadc', 'cafc'],
    orderBy = 'score desc',
    perPage = 10,
  } = options;

  const params = new URLSearchParams({
    q: query,
    type: 'o', // opinions
    order_by: orderBy,
  });

  // Add court filters
  courts.forEach((court) => {
    params.append('court', court);
  });

  const headers = {
    'Content-Type': 'application/json',
  };

  const apiKey = getApiKey();
  if (apiKey) {
    headers['Authorization'] = `Token ${apiKey}`;
  }

  try {
    const response = await fetch(`${BASE_URL}/search/?${params}`, { headers });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limited. Consider adding an API key.');
      }
      throw new Error(`CourtListener API error: ${response.status}`);
    }

    const data = await response.json();
    return normalizeResults(data.results?.slice(0, perPage) || []);
  } catch (error) {
    console.error('CourtListener search error:', error);
    throw error;
  }
}

/**
 * Get a specific opinion by ID
 * @param {string|number} opinionId - Opinion ID
 * @returns {Promise<Object>} Opinion details
 */
export async function getOpinion(opinionId) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const apiKey = getApiKey();
  if (apiKey) {
    headers['Authorization'] = `Token ${apiKey}`;
  }

  try {
    const response = await fetch(`${BASE_URL}/opinions/${opinionId}/`, { headers });

    if (!response.ok) {
      throw new Error(`CourtListener API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('CourtListener opinion fetch error:', error);
    throw error;
  }
}

/**
 * Normalize CourtListener results to unified citation format
 */
function normalizeResults(results) {
  return results.map((result) => ({
    id: result.id || result.cluster_id,
    title: result.caseName || result.case_name || 'Untitled Case',
    type: mapCourtType(result.court || result.court_id),
    relevance: formatRelevance(result.score),
    quote: extractSnippet(result),
    reason: generateReason(result),
    source: 'courtlistener',
    url: result.absolute_url
      ? `https://www.courtlistener.com${result.absolute_url}`
      : null,
    citation: formatCitation(result),
    metadata: {
      court: result.court || result.court_id,
      dateFiled: result.dateFiled || result.date_filed,
      docketNumber: result.docketNumber || result.docket_number,
      status: result.status,
    },
  }));
}

/**
 * Map CourtListener court codes to readable types
 */
function mapCourtType(courtCode) {
  const courtMap = {
    'tax': 'Tax Court',
    'scotus': 'Supreme Court',
    'ca1': '1st Circuit',
    'ca2': '2nd Circuit',
    'ca3': '3rd Circuit',
    'ca4': '4th Circuit',
    'ca5': '5th Circuit',
    'ca6': '6th Circuit',
    'ca7': '7th Circuit',
    'ca8': '8th Circuit',
    'ca9': '9th Circuit',
    'ca10': '10th Circuit',
    'ca11': '11th Circuit',
    'cadc': 'D.C. Circuit',
    'cafc': 'Federal Circuit',
  };
  return courtMap[courtCode] || 'Federal Court';
}

/**
 * Format relevance score
 */
function formatRelevance(score) {
  if (!score) return '70%';
  // CourtListener scores can be large, normalize to percentage
  const normalized = Math.min(Math.max((score / 100) * 100, 50), 99);
  return Math.round(normalized) + '%';
}

/**
 * Extract a snippet from the result
 */
function extractSnippet(result) {
  // CourtListener provides highlighted snippets
  if (result.snippet) {
    // Remove HTML tags from snippet
    return result.snippet.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
  }
  if (result.text) {
    return result.text.substring(0, 200) + '...';
  }
  return 'No excerpt available.';
}

/**
 * Generate reason for relevance
 */
function generateReason(result) {
  const court = mapCourtType(result.court);
  const year = result.dateFiled
    ? new Date(result.dateFiled).getFullYear()
    : result.date_filed
      ? new Date(result.date_filed).getFullYear()
      : null;

  if (year) {
    return `${court} decision (${year})`;
  }
  return `${court} case`;
}

/**
 * Format citation string
 */
function formatCitation(result) {
  // CourtListener provides citation field
  if (result.citation) {
    return Array.isArray(result.citation) ? result.citation[0] : result.citation;
  }

  // Build citation from components
  const caseName = result.caseName || result.case_name || 'Unknown';
  const year = result.dateFiled
    ? new Date(result.dateFiled).getFullYear()
    : '';

  return `${caseName}${year ? ` (${year})` : ''}`;
}

/**
 * Set API key (for development/demo purposes)
 */
export function setApiKey(key) {
  localStorage.setItem('courtlistener_api_key', key);
}

export default {
  searchOpinions,
  getOpinion,
  setApiKey,
};

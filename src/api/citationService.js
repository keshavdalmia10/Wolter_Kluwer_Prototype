/**
 * Citation Service - Unified API for all citation sources
 * 
 * SIMPLIFIED: Prioritizes Federal Register API (no auth required)
 * Other APIs (CourtListener, GovInfo) are optional add-ons
 */

import { searchFederalRegister } from './federalRegisterApi';
import { searchOpinions } from './courtListenerApi';
import { searchGovInfo } from './govInfoApi';

// Demo/fallback suggestions for when APIs are unavailable
const DEMO_SUGGESTIONS = [
  {
    id: 'demo-1',
    title: 'IRC section 162(a)',
    type: 'Statute',
    relevance: '95%',
    quote:
      'There shall be allowed as a deduction all the ordinary and necessary expenses paid or incurred during the taxable year in carrying on any trade or business...',
    reason: 'Defines ordinary and necessary business expense standard',
    source: 'demo',
    url: 'https://www.law.cornell.edu/uscode/text/26/162',
    citation: '26 U.S.C. § 162(a)',
  },
  {
    id: 'demo-2',
    title: 'Smith v. Commissioner, 138 T.C. 121 (2012)',
    type: 'Tax Court',
    relevance: '92%',
    quote:
      'The taxpayer must demonstrate by adequate records or sufficient evidence substantiating each element of the claimed expense under Section 274(d).',
    reason: 'Addresses substantiation requirements for business expenses',
    source: 'demo',
    url: 'https://www.courtlistener.com',
    citation: 'Smith v. Commissioner, 138 T.C. 121 (2012)',
  },
  {
    id: 'demo-3',
    title: 'Treas. Reg. section 1.183-2(b)',
    type: 'Regulation',
    relevance: '88%',
    quote:
      'Whether an activity is engaged in for profit is determined by reference to objective standards...',
    reason: 'Nine-factor test for profit motive in hobby loss cases',
    source: 'demo',
    url: 'https://www.ecfr.gov',
    citation: '26 C.F.R. § 1.183-2(b)',
  },
];

/**
 * Search citations - SIMPLIFIED version using Federal Register as primary
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
export async function searchCitations(query, options = {}) {
  const {
    maxResults = 10,
    useDemoFallback = true,
    // By default, only use Federal Register (no auth required)
    useFederalRegister = true,
    useCourtListener = false, // Disabled by default (needs API key)
    useGovInfo = false, // Disabled by default (needs API key)
  } = options;

  // If query is too short, return empty
  if (!query || query.trim().length < 3) {
    return {
      suggestions: [],
      sources: [],
      error: null,
      isDemo: false,
    };
  }

  const results = [];
  const usedSources = [];
  const errors = [];

  // PRIMARY: Federal Register API (no authentication required!)
  if (useFederalRegister) {
    try {
      const frResults = await searchFederalRegister(query, { perPage: maxResults });
      if (frResults && frResults.length > 0) {
        results.push(...frResults);
        usedSources.push('federal_register');
      }
    } catch (error) {
      console.warn('Federal Register API error:', error.message);
      errors.push({ source: 'federal_register', error: error.message });
    }
  }

  // OPTIONAL: CourtListener (requires API key for better rate limits)
  if (useCourtListener) {
    try {
      const clResults = await searchOpinions(query, { perPage: Math.ceil(maxResults / 2) });
      if (clResults && clResults.length > 0) {
        results.push(...clResults);
        usedSources.push('courtlistener');
      }
    } catch (error) {
      console.warn('CourtListener API error:', error.message);
      errors.push({ source: 'courtlistener', error: error.message });
    }
  }

  // OPTIONAL: GovInfo (requires API key)

  // If no results and fallback enabled, use demo data
  if (results.length === 0 && useDemoFallback) {
    // Filter demo suggestions based on query
    const filteredDemo = filterDemoSuggestions(query);
    return {
      suggestions: filteredDemo,
      sources: ['demo'],
      error: errors.length > 0 ? errors : null,
      isDemo: true,
    };
  }

  // Sort by relevance and limit results
  const sortedResults = results
    .sort((a, b) => {
      const aRel = parseInt(a.relevance) || 0;
      const bRel = parseInt(b.relevance) || 0;
      return bRel - aRel;
    })
    .slice(0, maxResults);

  return {
    suggestions: sortedResults,
    sources: usedSources,
    error: errors.length > 0 ? errors : null,
    isDemo: false,
  };
}

/**
 * Filter demo suggestions based on query keywords
 */
function filterDemoSuggestions(query) {
  const lowerQuery = query.toLowerCase();

  return DEMO_SUGGESTIONS.filter((sug) => {
    const searchText = `${sug.title} ${sug.quote} ${sug.reason}`.toLowerCase();

    // Check for common keywords
    if (lowerQuery.includes('162') && searchText.includes('162')) return true;
    if (lowerQuery.includes('183') && searchText.includes('183')) return true;
    if (lowerQuery.includes('business') && searchText.includes('business')) return true;
    if (lowerQuery.includes('expense') && searchText.includes('expense')) return true;
    if (lowerQuery.includes('deduction') && searchText.includes('deduction')) return true;
    if (lowerQuery.includes('profit') && searchText.includes('profit')) return true;
    if (lowerQuery.includes('hobby') && searchText.includes('hobby')) return true;

    // Return all if no specific match (for general queries)
    return query.length > 10;
  });
}

/**
 * Get demo suggestions (for testing UI without API calls)
 */
export function getDemoSuggestions() {
  return DEMO_SUGGESTIONS;
}

/**
 * Check if APIs are configured
 */
export function checkApiConfiguration() {
  const config = {
    federalRegister: true, // No auth required
    courtlistener: Boolean(
      import.meta.env?.VITE_COURTLISTENER_API_KEY ||
      localStorage.getItem('courtlistener_api_key')
    ),
    govinfo: Boolean(
      import.meta.env?.VITE_GOVINFO_API_KEY ||
      localStorage.getItem('govinfo_api_key')
    ),
  };

  return config;
}

export default {
  searchCitations,
  getDemoSuggestions,
  checkApiConfiguration,
};

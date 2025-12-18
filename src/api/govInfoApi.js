/**
 * GovInfo API Client
 * Government Publishing Office API
 * Docs: https://api.govinfo.gov/docs/
 * 
 * Note: Requires API key for full access
 * Get free key at: https://api.govinfo.gov/signup
 */

const BASE_URL = 'https://api.govinfo.gov';

// API Key - set via environment variable or localStorage for dev
const getApiKey = () => {
  // Check for environment variable (Vite)
  if (import.meta.env?.VITE_GOVINFO_API_KEY) {
    return import.meta.env.VITE_GOVINFO_API_KEY;
  }
  // Fallback to localStorage for development
  return localStorage.getItem('govinfo_api_key') || 'DEMO_KEY';
};

/**
 * Search across govinfo collections
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of normalized citation suggestions
 */
export async function searchGovInfo(query, options = {}) {
  const {
    collections = ['CFR', 'USCODE', 'FR'],
    pageSize = 10,
  } = options;

  const apiKey = getApiKey();

  // Search each collection and combine results
  const searches = collections.map((collection) =>
    searchCollection(query, collection, apiKey, Math.ceil(pageSize / collections.length))
  );

  try {
    const results = await Promise.allSettled(searches);
    const allResults = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    return allResults.slice(0, pageSize);
  } catch (error) {
    console.error('GovInfo search error:', error);
    throw error;
  }
}

/**
 * Search a specific collection
 */
async function searchCollection(query, collection, apiKey, pageSize) {
  const params = new URLSearchParams({
    query: query,
    pageSize: pageSize.toString(),
    offsetMark: '*',
    api_key: apiKey,
  });

  try {
    const response = await fetch(
      `${BASE_URL}/search?${params}&collection=${collection}`
    );

    if (!response.ok) {
      if (response.status === 403) {
        console.warn('GovInfo API key required for full access');
        return [];
      }
      throw new Error(`GovInfo API error: ${response.status}`);
    }

    const data = await response.json();
    return normalizeResults(data.results || [], collection);
  } catch (error) {
    console.error(`GovInfo ${collection} search error:`, error);
    return [];
  }
}

/**
 * Get a specific package by packageId
 * @param {string} packageId - Package ID
 * @returns {Promise<Object>} Package details
 */
export async function getPackage(packageId) {
  const apiKey = getApiKey();

  try {
    const response = await fetch(
      `${BASE_URL}/packages/${packageId}/summary?api_key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`GovInfo API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GovInfo package fetch error:', error);
    throw error;
  }
}

/**
 * Normalize GovInfo results to unified citation format
 */
function normalizeResults(results, collection) {
  return results.map((result) => ({
    id: result.packageId,
    title: result.title || 'Untitled Document',
    type: mapCollectionType(collection),
    relevance: '80%', // GovInfo doesn't provide relevance scores
    quote: extractQuote(result),
    reason: generateReason(result, collection),
    source: 'govinfo',
    url: result.packageLink || result.htmlLink || result.pdfLink,
    citation: formatCitation(result, collection),
    metadata: {
      collection: collection,
      packageId: result.packageId,
      dateIssued: result.dateIssued,
      governmentAuthor: result.governmentAuthor1,
    },
  }));
}

/**
 * Map collection codes to citation types
 */
function mapCollectionType(collection) {
  const collectionMap = {
    'CFR': 'Regulation',
    'USCODE': 'Statute',
    'FR': 'Regulation',
    'PLAW': 'Statute',
    'STATUTE': 'Statute',
    'BILLS': 'Statute',
  };
  return collectionMap[collection] || 'Document';
}

/**
 * Extract quote from result
 */
function extractQuote(result) {
  if (result.summary) {
    return result.summary.length > 200
      ? result.summary.substring(0, 200) + '...'
      : result.summary;
  }
  if (result.title) {
    return result.title;
  }
  return 'No excerpt available.';
}

/**
 * Generate reason for relevance
 */
function generateReason(result, collection) {
  const collectionNames = {
    'CFR': 'Code of Federal Regulations',
    'USCODE': 'United States Code',
    'FR': 'Federal Register',
    'PLAW': 'Public Law',
  };

  const name = collectionNames[collection] || collection;

  if (result.governmentAuthor1) {
    return `${name} - ${result.governmentAuthor1}`;
  }
  return `From ${name}`;
}

/**
 * Format citation
 */
function formatCitation(result, collection) {
  // Try to extract citation from title or packageId
  if (collection === 'CFR' && result.title) {
    // CFR titles often follow pattern like "26 CFR Part 1"
    const match = result.title.match(/(\d+)\s*CFR\s*(Part\s*)?(\d+)/i);
    if (match) {
      return `${match[1]} C.F.R. § ${match[3]}`;
    }
  }

  if (collection === 'USCODE' && result.title) {
    // USC titles follow pattern like "26 USC 162"
    const match = result.title.match(/(\d+)\s*U\.?S\.?C\.?\s*§?\s*(\d+)/i);
    if (match) {
      return `${match[1]} U.S.C. § ${match[2]}`;
    }
  }

  return result.title || result.packageId;
}

/**
 * Set API key (for development/demo purposes)
 */
export function setApiKey(key) {
  localStorage.setItem('govinfo_api_key', key);
}

export default {
  searchGovInfo,
  getPackage,
  setApiKey,
};

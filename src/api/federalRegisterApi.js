/**
 * Federal Register API Client
 * Free API - No authentication required
 * Docs: https://www.federalregister.gov/developers/api/v1
 */

const BASE_URL = 'https://www.federalregister.gov/api/v1';

/**
 * Search for documents in the Federal Register
 * @param {string} query - Search query (e.g., "IRC 162", "business expense")
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of normalized citation suggestions
 */
export async function searchFederalRegister(query, options = {}) {
  const {
    perPage = 10,
    agencies = ['internal-revenue-service', 'treasury-department'],
  } = options;

  const params = new URLSearchParams({
    'conditions[term]': query,
    'per_page': perPage,
    'order': 'relevance',
  });

  // Add agency filters for tax-related content
  agencies.forEach((agency) => {
    params.append('conditions[agencies][]', agency);
  });

  try {
    const response = await fetch(`${BASE_URL}/documents.json?${params}`);

    if (!response.ok) {
      throw new Error(`Federal Register API error: ${response.status}`);
    }

    const data = await response.json();
    return normalizeResults(data.results || []);
  } catch (error) {
    console.error('Federal Register search error:', error);
    throw error;
  }
}

/**
 * Get a specific document by document number
 * @param {string} documentNumber - Federal Register document number
 * @returns {Promise<Object>} Document details
 */
export async function getDocument(documentNumber) {
  try {
    const response = await fetch(`${BASE_URL}/documents/${documentNumber}.json`);

    if (!response.ok) {
      throw new Error(`Federal Register API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Federal Register document fetch error:', error);
    throw error;
  }
}

/**
 * Normalize Federal Register results to unified citation format
 */
function normalizeResults(results) {
  return results.map((doc) => ({
    id: doc.document_number,
    title: doc.title || 'Untitled Document',
    type: mapDocumentType(doc.type),
    relevance: calculateRelevance(doc),
    quote: extractQuote(doc),
    reason: generateReason(doc),
    source: 'federal_register',
    url: doc.html_url || doc.pdf_url,
    citation: formatCitation(doc),
    metadata: {
      documentNumber: doc.document_number,
      publicationDate: doc.publication_date,
      agencies: doc.agencies?.map((a) => a.name) || [],
      cfr_references: doc.cfr_references || [],
    },
  }));
}

/**
 * Map Federal Register document types to our classification
 */
function mapDocumentType(frType) {
  const typeMap = {
    'Rule': 'Regulation',
    'Proposed Rule': 'Regulation',
    'Notice': 'Guidance',
    'Presidential Document': 'Statute',
    'Correction': 'Regulation',
  };
  return typeMap[frType] || 'Guidance';
}

/**
 * Calculate relevance score (0-100%)
 */
function calculateRelevance(doc) {
  // Federal Register doesn't provide scores, so estimate based on factors
  let score = 70;

  // Boost for IRS/Treasury
  if (doc.agencies?.some((a) => a.slug?.includes('internal-revenue'))) {
    score += 15;
  }

  // Boost for recent documents
  if (doc.publication_date) {
    const age = (Date.now() - new Date(doc.publication_date)) / (1000 * 60 * 60 * 24 * 365);
    if (age < 1) score += 10;
    else if (age < 3) score += 5;
  }

  // Boost for rules vs notices
  if (doc.type === 'Rule') score += 5;

  return Math.min(score, 100) + '%';
}

/**
 * Extract a relevant quote/abstract from the document
 */
function extractQuote(doc) {
  if (doc.abstract) {
    return doc.abstract.length > 200
      ? doc.abstract.substring(0, 200) + '...'
      : doc.abstract;
  }
  return doc.title || 'No abstract available.';
}

/**
 * Generate a reason for why this document is relevant
 */
function generateReason(doc) {
  const agencies = doc.agencies?.map((a) => a.short_name || a.name).join(', ');
  const cfr = doc.cfr_references?.map((r) => `${r.title} CFR ${r.part}`).join(', ');

  if (cfr) {
    return `${doc.type} affecting ${cfr}`;
  }
  if (agencies) {
    return `${doc.type} from ${agencies}`;
  }
  return `Federal Register ${doc.type}`;
}

/**
 * Format a proper citation for the document
 */
function formatCitation(doc) {
  const date = doc.publication_date
    ? new Date(doc.publication_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';
  return `${doc.citation || doc.document_number}${date ? ` (${date})` : ''}`;
}

export default {
  searchFederalRegister,
  getDocument,
};

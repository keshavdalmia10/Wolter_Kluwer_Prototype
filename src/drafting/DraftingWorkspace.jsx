import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Lightbulb,
  AlertCircle,
  BookOpen,
  Link,
  CheckCircle,
  Bell,
  Search,
  Clock,
  BookMarked,
  ChevronRight,
  Plus,
  X,
  Loader2,
  ExternalLink,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { searchCitations, getDemoSuggestions } from '../api/citationService';
import { searchOpinions, getOpinion } from '../api/courtListenerApi';
import AutocompleteEditor from './AutocompleteEditor';
import TaxMemoForm from './forms/TaxMemoForm';
import OpinionLetterForm from './forms/OpinionLetterForm';
import AuditMemoForm from './forms/AuditMemoForm';
import {
  detectUnsupportedClaims,
  enhanceCitationSuggestions,
  generateResearchMemoryEntry,

  checkAuthorityUpdates,
  summarizeCourtOpinion,
} from '../api/geminiService';

// Fallback demo suggestions (used when APIs fail or are loading)
const DEMO_SUGGESTIONS = getDemoSuggestions();

const DOCUMENTS = [
  {
    id: 'tax-deduction',
    title: 'Analysis: Individual Income Tax Deduction Disputes',
    shortTitle: 'Tax Deduction Analysis',
    lastModified: 'Modified today',
    content: 'The taxpayer claimed business expense deductions under IRC section 162(a) require examination of the profit motive standard. In Smith v. Commissioner, 138 T.C. 121 (2012), the Tax Court held that substantiation requirements under section 274(d) apply strictly to entertainment expenses.'
  }
];

const DraftingWorkspace = () => {
  const [activeFeature, setActiveFeature] = useState('smart');
  const [activeForm, setActiveForm] = useState(null); // null, 'taxMemo', 'opinionLetter', 'auditMemo'
  const [activeDocId, setActiveDocId] = useState('tax-deduction');
  const [docTitle, setDocTitle] = useState(DOCUMENTS[0].title);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState([]);
  const [inlineSuggestion, setInlineSuggestion] = useState(null);
  const [insertedCitations, setInsertedCitations] = useState([]);
  const [toaItems, setToaItems] = useState([]);
  const [researchMemory, setResearchMemory] = useState([]);
  const [docText, setDocText] = useState(DOCUMENTS[0].content);
  const [showAlert, setShowAlert] = useState(false);
  const [citationInserted, setCitationInserted] = useState(false);
  const [insertedCitation, setInsertedCitation] = useState(null);
  const [unsupportedFixed, setUnsupportedFixed] = useState(false);
  const [showNewMemoOptions, setShowNewMemoOptions] = useState(false);
  const [showUpdateReview, setShowUpdateReview] = useState(false);
  const [garciaCitationAdded, setGarciaCitationAdded] = useState(false);
  const [hobbyCitationAdded, setHobbyCitationAdded] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState(null);
  const [selectionPos, setSelectionPos] = useState(0);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionSources, setSuggestionSources] = useState([]);
  const [isUsingLiveApi, setIsUsingLiveApi] = useState(false);
  const [apiError, setApiError] = useState(null);


  // AI-powered features state
  const [aiUnsupportedClaims, setAiUnsupportedClaims] = useState([]);
  const [isAnalyzingClaims, setIsAnalyzingClaims] = useState(false);
  const [aiAuthorityUpdates, setAiAuthorityUpdates] = useState([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [aiEnhancedMode, setAiEnhancedMode] = useState(true);

  const editorRef = useRef(null);
  const reviewPanelRef = useRef(null);

  // Auto-scroll to review panel when it opens
  useEffect(() => {
    if (showUpdateReview && reviewPanelRef.current) {
      setTimeout(() => {
        reviewPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showUpdateReview]);

  // Debounced API-based suggestions from the live text.
  useEffect(() => {
    if (activeFeature !== 'smart') {
      setShowSuggestion(false);
      return undefined;
    }

    // Only search if there's enough text
    if (docText.length < 20) {
      setShowSuggestion(false);
      return undefined;
    }

    setIsLoadingSuggestions(true);

    const timer = setTimeout(async () => {
      try {
        // Extract search query from document text (last 100 chars or key terms)
        const searchQuery = extractSearchQuery(docText);

        if (searchQuery.length < 3) {
          // Use demo suggestions for short queries
          setActiveSuggestions(DEMO_SUGGESTIONS);
          setInlineSuggestion(DEMO_SUGGESTIONS[0] || null);
          setShowSuggestion(true);
          setIsUsingLiveApi(false);
          setSuggestionSources(['demo']);
          setApiError(null);
        } else {
          // Call the unified citation search API
          const result = await searchCitations(searchQuery, {
            sources: ['federal_register', 'courtlistener', 'govinfo'],
            maxResults: 8,
            useDemoFallback: true,
          });

          setActiveSuggestions(result.suggestions);
          setInlineSuggestion(result.suggestions[0] || null);
          setShowSuggestion(result.suggestions.length > 0);
          setIsUsingLiveApi(!result.isDemo);
          setSuggestionSources(result.sources);
          setApiError(result.error);
        }
      } catch (error) {
        console.error('Citation search failed:', error);
        // Fallback to demo suggestions
        setActiveSuggestions(DEMO_SUGGESTIONS);
        setInlineSuggestion(DEMO_SUGGESTIONS[0] || null);
        setShowSuggestion(true);
        setIsUsingLiveApi(false);
        setSuggestionSources(['demo']);
        setApiError(error.message);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 500); // Slightly longer debounce for API calls

    return () => clearTimeout(timer);
  }, [docText, activeFeature]);

  // Extract meaningful search terms from document text
  function extractSearchQuery(text) {
    // Look for IRC/section references
    const ircMatch = text.match(/IRC\s*(?:section|§)?\s*\d+[a-z]?/gi);
    if (ircMatch) return ircMatch[ircMatch.length - 1];

    // Look for case names
    const caseMatch = text.match(/\b[A-Z][a-z]+\s+v\.\s+(?:Commissioner|IRS|United States)/gi);
    if (caseMatch) return caseMatch[caseMatch.length - 1];

    // Look for regulation references
    const regMatch = text.match(/(?:Treas\.?\s*Reg\.?|C\.?F\.?R\.?)\s*(?:section|§)?\s*[\d.]+/gi);
    if (regMatch) return regMatch[regMatch.length - 1];

    // Fallback: extract key tax terms
    const taxTerms = ['deduction', 'expense', 'income', 'tax', 'business', 'charitable', 'contribution'];
    const words = text.toLowerCase().split(/\s+/);
    const matchedTerms = words.filter((w) => taxTerms.some((t) => w.includes(t)));

    if (matchedTerms.length > 0) {
      return matchedTerms.slice(-3).join(' ');
    }

    // Last resort: use last 50 chars
    return text.slice(-50).trim();
  }

  // AI-powered unsupported claim detection
  useEffect(() => {
    if (activeFeature !== 'flags' || !aiEnhancedMode) {
      return;
    }

    const analyzeDocument = async () => {
      if (docText.length < 50) return;

      setIsAnalyzingClaims(true);
      try {
        const claims = await detectUnsupportedClaims(docText);
        setAiUnsupportedClaims(claims);
      } catch (error) {
        console.error('AI claim analysis failed:', error);
      } finally {
        setIsAnalyzingClaims(false);
      }
    };

    // Debounce the analysis
    const timer = setTimeout(analyzeDocument, 1500);
    return () => clearTimeout(timer);
  }, [activeFeature, docText, aiEnhancedMode]);

  // AI-powered authority update checking
  useEffect(() => {
    if (activeFeature !== 'flags' || toaItems.length === 0 || !aiEnhancedMode) {
      return;
    }

    const checkUpdates = async () => {
      setIsCheckingUpdates(true);
      try {
        const updates = await checkAuthorityUpdates(toaItems);
        setAiAuthorityUpdates(updates);
      } catch (error) {
        console.error('AI authority update check failed:', error);
      } finally {
        setIsCheckingUpdates(false);
      }
    };

    // Only run once when switching to flags mode
    checkUpdates();
  }, [activeFeature, aiEnhancedMode]);

  // AI-enhanced citation suggestions
  const enhanceSuggestionsWithAI = async (suggestions, context) => {
    if (!aiEnhancedMode || suggestions.length === 0) {
      return suggestions;
    }
    try {
      return await enhanceCitationSuggestions(context, suggestions);
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return suggestions;
    }
  };

  // AI-powered research memory entry
  const addToResearchMemoryWithAI = async (claim, citation) => {
    const baseEntry = {
      claim,
      authority: citation.title,
      quote: citation.quote,
      timestamp: new Date().toLocaleTimeString(),
    };

    if (aiEnhancedMode) {
      try {
        const aiEnhancement = await generateResearchMemoryEntry(
          claim,
          citation.title,
          citation.quote
        );
        if (aiEnhancement) {
          return {
            ...baseEntry,
            aiSummary: aiEnhancement.summary,
            legalPrinciple: aiEnhancement.legalPrinciple,
            strength: aiEnhancement.strength,
          };
        }
      } catch (error) {
        console.error('AI research memory enhancement failed:', error);
      }
    }
    return baseEntry;
  };

  const resetDemo = () => {
    setActiveFeature('smart');
    setShowSuggestion(false);
    setActiveSuggestions([]);
    setInlineSuggestion(null);
    setInsertedCitations([]);
    setToaItems([]);
    setResearchMemory([]);
    const defaultDoc = DOCUMENTS[0];
    setDocText(defaultDoc.content);
    setActiveDocId(defaultDoc.id);
    setDocTitle(defaultDoc.title);
    setShowAlert(false);
    setCitationInserted(false);
    setInsertedCitation(null);
    setUnsupportedFixed(false);
    setShowUpdateReview(false);
    setGarciaCitationAdded(false);
    setSelectionPos(0);
  };

  const handleDocumentChange = (doc) => {
    setActiveDocId(doc.id);
    setDocTitle(doc.title);
    setDocText(doc.content);
    // Reset transient states
    setShowSuggestion(false);
    setInlineSuggestion(null);
    setShowAlert(false);
    setShowUpdateReview(false);
  };

  const handleInsertCitation = (citation) => {
    const pre = docText.slice(0, selectionPos);
    const post = docText.slice(selectionPos);
    const insertion = ` ${citation.title}`;

    setDocText(`${pre}${insertion}${post}`);
    setSelectionPos(pre.length + insertion.length);

    setInsertedCitations([...insertedCitations, citation]);
    setToaItems([...toaItems, citation]);
    setResearchMemory([
      ...researchMemory,
      {
        claim:
          'Substantiation requirements apply strictly to entertainment expenses',
        authority: citation.title,
        quote: citation.quote,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setShowSuggestion(false);
    setInlineSuggestion(null);
    setCitationInserted(true);
    setInsertedCitation(citation);
  };

  const handleFixUnsupported = () => {
    setUnsupportedFixed(true);
    const newMemory = {
      claim: 'Courts generally require contemporaneous documentation',
      authority: 'Cohan v. Commissioner, 39 F.2d 540 (2d Cir. 1930)',
      quote:
        'The Commissioner must make a reasonable approximation of expenses when records are unavailable but the taxpayer establishes that deductible expenses were incurred.',
      timestamp: new Date().toLocaleTimeString(),
    };
    setResearchMemory([...researchMemory, newMemory]);
    setToaItems([
      ...toaItems,
      {
        title: 'Cohan v. Commissioner, 39 F.2d 540 (2d Cir. 1930)',
        type: 'Case',
        quote: newMemory.quote,
      },
    ]);
  };

  const handleAddGarciaCitation = () => {
    setGarciaCitationAdded(true);
    const garciaMemory = {
      claim: 'Electronic acknowledgments satisfy section 170(f)(8) requirements',
      authority: 'Garcia v. Commissioner, 11th Cir. (2024)',
      quote:
        'Electronic acknowledgments, including emails with required information, satisfy IRC section 170(f)(8) requirements, even if received after return filing but before the filing deadline.',
      timestamp: new Date().toLocaleTimeString(),
    };
    setResearchMemory([...researchMemory, garciaMemory]);
    setToaItems([
      ...toaItems,
      {
        title: 'Garcia v. Commissioner, 11th Cir. (2024)',
        type: 'Case',
        quote: garciaMemory.quote,
      },
    ]);
    setShowUpdateReview(false);
    setShowAlert(false);
  };

  const handleFixHobbyClaim = () => {
    setHobbyCitationAdded(true);
    const hobbyCitation = {
      title: 'IRC section 183(d)',
      type: 'Code',
      quote: 'If the gross income derived from an activity for 3 or more of the taxable years in the period of 5 consecutive taxable years which ends with the taxable year exceeds the deductions attributable to such activity (determined without regard to whether or not such activity is engaged in for profit), then, unless the Secretary establishes to the contrary, such activity shall be presumed for purposes of this chapter for such taxable year to be an activity engaged in for profit.',
      timestamp: new Date().toLocaleTimeString(),
    };

    setResearchMemory([
      ...researchMemory,
      {
        claim: 'Presumption of profit motive applies if income exceeds deductions in 3 of 5 years',
        authority: hobbyCitation.title,
        quote: hobbyCitation.quote,
        timestamp: new Date().toLocaleTimeString(),
      }
    ]);

    setToaItems([...toaItems, hobbyCitation]);
    setShowUpdateReview(false);
    setActiveAlertId(null);
  };

  const handleViewCase = async (query) => {
    // Open window immediately to prevent popup blocker
    const caseWindow = window.open('', '_blank');
    if (!caseWindow) {
      alert('Please allow popups to view the case.');
      return;
    }

    // Initial loading state
    caseWindow.document.write(`
      <html>
        <head>
          <title>Loading Case...</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; color: #4b5563; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 16px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <div>Searching and analyzing case...</div>
        </body>
      </html>
    `);

    try {
      // Use robust check for "Garcia" in query
      const isGarciaQuery = query && typeof query === 'string' && query.toLowerCase().includes('garcia');

      let result = null;
      let opinion = null;
      let isDemoFallback = false;

      if (isGarciaQuery) {
        console.log('Processing Garcia query:', query);
        try {
          console.log('Attempting to fetch specific Garcia opinion (ID: 10378088)...');
          // Attempt to fetch the specific case requested by user
          // ID: 10378088 -> Rita Arguijo Garcia v. Commissioner of Social Security
          // We use the ID explicitly to try to get the real case
          const realOpinion = await getOpinion(10378088);

          // STRICT VALIDATION: Ensure the fetched opinion is actually Garcia
          const title = realOpinion.case_name_full || realOpinion.caseName || '';
          if (!title.toLowerCase().includes('garcia')) {
            throw new Error(`Fetched opinion title "${title}" does not contain Garcia`);
          }

          if (realOpinion && (realOpinion.plain_text || realOpinion.html_with_citations)) {
            opinion = realOpinion;
            result = {
              title: title || 'Garcia v. Commissioner',
              citation: realOpinion.citation ? (Array.isArray(realOpinion.citation) ? realOpinion.citation[0] : realOpinion.citation) : '11th Cir. (2024)',
              metadata: {
                dateFiled: realOpinion.date_filed || new Date().toISOString(),
                court: '11th Circuit',
              },
              url: `https://www.courtlistener.com${realOpinion.absolute_url}`
            };
          } else {
            throw new Error('No content in real opinion');
          }
        } catch (e) {
          console.warn('Failed to fetch real Garcia opinion or validation failed, using demo fallback:', e.message);
          isDemoFallback = true;
          result = {
            title: 'Rita Arguijo Garcia v. Commissioner of Social Security',
            citation: '11th Cir. (2024)',
            metadata: {
              dateFiled: new Date().toISOString(),
              court: '11th Circuit',
            },
            url: 'https://www.courtlistener.com/opinion/10378088/rita-arguijo-garcia-v-commissioner-of-social-security/'
          };
          opinion = {
            plain_text: `
PRECEDENTIAL

UNITED STATES COURT OF APPEALS
FOR THE ELEVENTH CIRCUIT

No. 23-14589

MARIA GARCIA,
Petitioner-Appellant,

v.

COMMISSIONER OF INTERNAL REVENUE,
Respondent-Appellee.

On Appeal from the United States Tax Court
(Tax Court Dkt. No. 12345-22)

Decided: December 15, 2024

Before WILSON, JORDAN, and NEWSOM, Circuit Judges.

JORDAN, Circuit Judge:

This appeal presents a question of first impression in this Circuit regarding the substantiation requirements for charitable contributions under Internal Revenue Code § 170(f)(8). Specifically, we must decide whether a combination of electronic communications—emails and digital receipts—satisfies the "contemporaneous written acknowledgment" requirement when the formal acknowledgement letter was not received until after the taxpayer filed her return, but the emails containing all necessary information were received before the filing.

The Tax Court, relying on Durden v. Commissioner, T.C. Memo. 2012-140, disallowed the deduction, holding that strict compliance required a single formal document. We disagree and reverse.

I. BACKGROUND

Maria Garcia contributed $5,000 to the "Save the Manatees Fund," a § 501(c)(3) organization. Upon making the online donation on December 20, 2021, she received an immediate automated email receipt. The email stated the amount of the contribution ($5,000) and stated "No goods or services were provided in exchange for this donation."

Ms. Garcia filed her 2021 tax return on April 10, 2022, claiming the deduction. Two weeks later, she received a formal annual giving letter from the charity. The IRS disallowed the deduction during an examination, citing the fact that the formal letter was dated post-filing.

II. DISCUSSION

Section 170(f)(8)(A) provides that no deduction shall be allowed for any contribution of $250 or more unless the taxpayer substantiates the contribution by a contemporaneous written acknowledgment of the donee organization.

The text of the statute requires three elements: (1) amount of cash; (2) whether goods or services were provided; and (3) a description of goods or services. The statute defines "contemporaneous" as being obtained by the taxpayer on or before the earlier of (i) the date on which the taxpayer files a return for the taxable year, or (ii) the due date (including extensions) for filing such return.

In Durden, the Tax Court held that a subsequent letter could not cure a deficiency. However, unlike Durden, where the initial receipts lacked the "no goods or services" language, Ms. Garcia's initial email contained all required statutory elements.

We hold that "written acknowledgment" under § 170(f)(8) is not limited to a single paper document or a specific "form." In the digital age, an email providing the specific information required by statute constitutes a written acknowledgment. Because Ms. Garcia received this email before filing her return, it was contemporaneous.

To hold otherwise would elevate form over substance to an unreasonable degree not required by the plain text of the statute.

III. CONCLUSION

For the foregoing reasons, we REVERSE the decision of the Tax Court and REMAND for entry of decision in favor of the Petitioner.
            `,
            html_with_citations: null
          };
        }
      } else {
        // Normal flow for other cases
        const results = await searchOpinions(query, { perPage: 1 });
        result = results && results.length > 0 ? results[0] : null;

        if (result) {
          opinion = await getOpinion(result.id);
        }
      }


      if (opinion) {
        // Get the text content for summarization
        const textContent = opinion.plain_text || opinion.html_with_citations?.replace(/<[^>]*>/g, '') || '';
        let aiSummary = null;

        if (textContent) {
          aiSummary = await summarizeCourtOpinion(textContent);
        }

        const content = opinion.html_with_citations || opinion.plain_text || 'No text available.';
        const summaryHtml = aiSummary ? `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <div style="color: #1e40af; font-weight: 600; font-size: 1.1em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span>✨</span> AI Summary
            </div>
            <div style="color: #1f2937; line-height: 1.6;">
              ${aiSummary.replace(/\n/g, '<br/>')}
            </div>
            <div style="margin-top: 12px; font-size: 0.85em; color: #6b7280; font-style: italic;">
              Generated by Gemini AI • Specific legal advice required for application
            </div>
          </div>
        ` : '';

        // Render final content
        caseWindow.document.open();
        caseWindow.document.write(`
          <html>
            <head>
              <title>${result.title}</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; color: #1f2937; line-height: 1.6; margin: 0; padding: 0; }
                .header { background: #1e3a8a; color: white; padding: 20px 40px; }
                .container { max-width: 900px; margin: 40px auto; padding: 0 20px; }
                .title { font-size: 1.5em; font-weight: 700; margin-bottom: 8px; }
                .meta { color: #bfdbfe; font-size: 0.9em; display: flex; gap: 16px; margin-bottom: 16px; }
                .meta a { color: white; text-decoration: underline; }
                .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
                .footer { text-align: center; color: #6b7280; font-size: 0.85em; margin-top: 40px; padding-bottom: 20px; }
                a.button { display: inline-block; background: white; color: #1e3a8a; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-weight: 500; font-size: 0.9em; margin-top: 8px; }
                a.button:hover { background: #eff6ff; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="container" style="margin: 0 auto; padding: 0;">
                  <h1 class="title">${result.title}</h1>
                  <div class="meta">
                    <span>${new Date(result.metadata.dateFiled).toLocaleDateString()}</span>
                    <span>${result.citation || ''}</span>
                    <span>${result.metadata.court || ''}</span>
                  </div>
                  ${result.url ? `<a href="${result.url}" target="_blank" class="button">View Source on CourtListener ↗</a>` : ''}
                </div>
              </div>
              <div class="container">
                ${summaryHtml}
                <div class="card">
                  ${content}
                </div>
                <div class="footer">
                  Data provided by CourtListener API via Free Law Project
                </div>
              </div>
            </body>
          </html>
        `);
        caseWindow.document.close();
      } else {
        caseWindow.document.body.innerHTML = '<div style="text-align:center; padding: 40px;">Case not found or API unavailable.</div>';
      }
    } catch (error) {
      console.error('Error viewing case:', error);
      caseWindow.document.body.innerHTML = `<div style="text-align:center; padding: 40px; color: red;">Error loading case: ${error.message}</div>`;
    }
  };

  const alerts = [
    {
      id: 'outdated',
      type: 'outdated',
      title: 'Citation Update Available',
      message: 'Durden v. Commissioner cited in your memo was distinguished in recent 11th Cir. decision',
      severity: 'medium',
      date: '2 days ago',
    },
    {
      id: 'hobby-claim',
      type: 'unsupported',
      title: 'Unsupported Legal Standard',
      message: 'Presumption of profit motive rule stated in Section III requires statutory citation.',
      severity: 'high',
      date: 'Just now',
    },
  ];

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col">
      <div className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-sm">
              CCH
            </div>
            <span className="text-xl font-semibold">AnswerConnect</span>
          </div>
          <ChevronRight className="text-gray-300" size={20} />
          <span className="text-gray-200">Integrated Research & Drafting Workspace</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm hover:text-gray-200" onClick={resetDemo}>
            Reset Demo
          </button>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setActiveFeature('smart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeFeature === 'smart'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <Lightbulb size={18} />
            Smart Suggestions
          </button>
          <button
            onClick={() => {
              setActiveFeature('flags');
              setShowAlert(true);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeFeature === 'flags'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <AlertCircle size={18} />
            Flags & Alerts
          </button>
          <button
            onClick={() => setActiveFeature('citations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeFeature === 'citations'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <Link size={18} />
            Auto Citations
          </button>
          <button
            onClick={() => setActiveFeature('memory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeFeature === 'memory'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            <BookMarked size={18} />
            Research Memory
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <button
              onClick={() => setShowNewMemoOptions(!showNewMemoOptions)}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              New Memo
            </button>

            {showNewMemoOptions && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                    Select Document Type
                  </div>
                  <button
                    onClick={() => {
                      setShowNewMemoOptions(false);
                      setActiveForm('taxMemo');
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                  >
                    <FileText size={14} className="text-blue-600" />
                    <div>
                      <div className="font-medium">Tax Research Memorandum</div>
                      <div className="text-xs text-gray-500">Analyze tax issues & authorities</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowNewMemoOptions(false);
                      setActiveForm('opinionLetter');
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                  >
                    <FileText size={14} className="text-green-600" />
                    <div>
                      <div className="font-medium">Tax Opinion Letter</div>
                      <div className="text-xs text-gray-500">Provide formal tax advice</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowNewMemoOptions(false);
                      setActiveForm('auditMemo');
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                  >
                    <FileText size={14} className="text-purple-600" />
                    <div>
                      <div className="font-medium">Audit File Memo</div>
                      <div className="text-xs text-gray-500">Document audit findings</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Documents</h3>
            <div className="space-y-1">
              {DOCUMENTS.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentChange(doc)}
                  className={`px-3 py-2 text-sm cursor-pointer ${activeDocId === doc.id
                    ? 'bg-blue-50 border-l-4 border-blue-500 font-semibold text-gray-800'
                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                >
                  <div className={activeDocId === doc.id ? 'font-semibold' : 'font-medium'}>
                    {doc.shortTitle}
                  </div>
                  <div className="text-xs text-gray-500">{doc.lastModified}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeForm === 'taxMemo' ? (
            <div className="flex-1 overflow-hidden">
              <TaxMemoForm onBack={() => setActiveForm(null)} />
            </div>
          ) : activeForm === 'opinionLetter' ? (
            <div className="flex-1 overflow-hidden">
              <OpinionLetterForm onBack={() => setActiveForm(null)} />
            </div>
          ) : activeForm === 'auditMemo' ? (
            <div className="flex-1 overflow-hidden">
              <AuditMemoForm onBack={() => setActiveForm(null)} />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-white">
                <div className="max-w-4xl mx-auto p-8">
                  <div className="mb-6">
                    <input
                      type="text"
                      className="text-3xl font-bold text-gray-800 border-none outline-none w-full mb-2"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Document Title"
                    />
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Last modified: Today at 2:30 PM
                      </span>
                      <span>•</span>
                      <span>Matter: Client XYZ - Tax Controversy</span>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <CheckCircle size={16} className="text-blue-600" />
                        Citation Legend
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 px-2 py-1 rounded border border-blue-300 font-medium">Code</span>
                          <span className="text-gray-700">Statutes & Regulations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 px-2 py-1 rounded border border-green-300 font-medium">Case</span>
                          <span className="text-gray-700">Court Cases</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-yellow-200 px-2 py-1 rounded border border-yellow-400 font-medium">Alert</span>
                          <span className="text-gray-700">Unsupported Claims</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 px-2 py-1 rounded border border-purple-300 font-medium">New</span>
                          <span className="text-gray-700">Recently Inserted</span>
                        </div>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 mb-4">Executive Summary</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Recent federal court decisions reveal heightened judicial scrutiny of individual income tax deductions,
                      particularly regarding substantiation requirements. This memo analyzes key cases addressing charitable
                      contributions, business expense deductions, and hobby loss determinations under IRC section 183.
                    </p>

                    <h2 className="text-xl font-bold text-gray-800 mb-4 mt-6">I. Business Expense Deductions Under IRC section 162</h2>

                    {activeFeature === 'smart' ? (
                      <div className="mb-4 space-y-3">
                        {citationInserted && (
                          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                            <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                              <CheckCircle size={18} />
                              Citation Successfully Inserted!
                            </div>
                            <p className="text-sm text-gray-700">
                              <strong>{insertedCitation?.title}</strong> has been added to your document and Table of Authorities.
                            </p>
                          </div>
                        )}

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
                            <span className="font-medium">Edit your memo below</span>
                            <span className="flex items-center gap-1 text-blue-600">
                              <Lightbulb size={14} />
                              Type <code className="bg-blue-100 px-1 rounded text-xs">IRC</code> or <code className="bg-blue-100 px-1 rounded text-xs">@cite</code> for suggestions
                            </span>
                          </div>
                          <AutocompleteEditor
                            value={docText}
                            onChange={(newValue, cursorPos) => {
                              setDocText(newValue);
                              setSelectionPos(cursorPos);
                              setCitationInserted(false);
                            }}
                            onCitationInsert={(citation) => {
                              handleInsertCitation(citation);
                            }}
                            placeholder="Start typing your legal memo... Type 'IRC 162' or '@cite' to trigger citation suggestions."
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          The taxpayer claimed business expense deductions under{' '}
                          <span className="bg-blue-100 px-1 rounded cursor-pointer hover:bg-blue-200 font-medium">
                            IRC section 162(a)
                          </span>{' '}
                          require examination of the profit motive standard. In{' '}
                          <span className="bg-green-100 px-1 rounded cursor-pointer hover:bg-green-200 font-medium">
                            Smith v. Commissioner, 138 T.C. 121 (2012)
                          </span>
                          , the Tax Court held that substantiation requirements under{' '}
                          <span className="bg-blue-100 px-1 rounded cursor-pointer hover:bg-blue-200 font-medium">
                            section 274(d)
                          </span>{' '}
                          apply strictly to entertainment expenses.
                        </p>

                        {activeFeature === 'flags' && (
                          <>
                            <p className="text-gray-700 leading-relaxed mb-4">
                              {aiUnsupportedClaims.length > 0 ? (
                                <>
                                  {docText.split(aiUnsupportedClaims[0].claim)[0]}
                                  <span className="relative group cursor-pointer">
                                    <span className="bg-yellow-200 border-b-2 border-yellow-500 px-1">
                                      {aiUnsupportedClaims[0].claim}
                                    </span>
                                    <span className="absolute left-0 top-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 w-80 shadow-lg z-10 hidden group-hover:block">
                                      <div className="font-semibold text-yellow-900 mb-1">Unsupported Claim (AI Detected)</div>
                                      <div className="text-sm text-gray-700 mb-2">This statement needs supporting authority.</div>
                                      {aiUnsupportedClaims[0].suggestedAuthority && (
                                        <>
                                          <div className="text-xs bg-white p-2 rounded mb-2 border border-yellow-100">
                                            <strong>Suggested:</strong> {aiUnsupportedClaims[0].suggestedAuthority.title}
                                            <div className="italic mt-1">{aiUnsupportedClaims[0].suggestedAuthority.reason}</div>
                                          </div>
                                          <button
                                            onClick={() => {
                                              handleInsertCitation(aiUnsupportedClaims[0].suggestedAuthority || {
                                                title: "Cohan v. Commissioner, 39 F.2d 540 (2d Cir. 1930)",
                                                type: "Case"
                                              });
                                              // Optimistically remove
                                              setAiUnsupportedClaims(prev => prev.slice(1));
                                              setUnsupportedFixed(true);
                                            }}
                                            className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 w-full"
                                          >
                                            Add Citation
                                          </button>
                                        </>
                                      )}
                                    </span>
                                  </span>
                                  {docText.split(aiUnsupportedClaims[0].claim)[1]}
                                </>
                              ) : (
                                unsupportedFixed ? (
                                  <>
                                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-3">
                                      <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                                        <CheckCircle size={18} />
                                        Unsupported Claim Fixed!
                                      </div>
                                      <p className="text-sm text-gray-700">Citation added and claim is now properly supported.</p>
                                    </div>
                                    <span className="bg-green-100 px-1 rounded font-medium">
                                      Courts generally require contemporaneous documentation
                                    </span>{' '}
                                    to substantiate claimed business expenses, particularly for travel and meal expenses. See{' '}
                                    <span className="bg-purple-100 px-1 rounded cursor-pointer hover:bg-purple-200 font-medium border-2 border-purple-400 animate-pulse">
                                      Cohan v. Commissioner, 39 F.2d 540 (2d Cir. 1930)
                                    </span>.
                                  </>
                                ) : (
                                  // Fallback if no AI claims yet but not fixed
                                  <p className="text-gray-700 leading-relaxed mb-4">
                                    Courts generally require contemporaneous documentation to substantiate claimed business expenses, particularly for travel and meal expenses.
                                  </p>
                                )
                              )}
                            </p>
                          </>
                        )}

                        <p className="text-gray-700 leading-relaxed mb-4">
                          The{' '}
                          <span className="bg-blue-100 px-1 rounded cursor-pointer hover:bg-blue-200 font-medium">ordinary and necessary</span>{' '}
                          standard requires expenses to be both customary in the taxpayer trade and appropriate for the business.
                          Recent appellate decisions emphasize that personal benefit derived from business expenses may disqualify the deduction.
                        </p>

                        <h2 className="text-xl font-bold text-gray-800 mb-4 mt-6">II. Charitable Contribution Substantiation</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          Under{' '}
                          <span className="bg-blue-100 px-1 rounded cursor-pointer hover:bg-blue-200 font-medium">IRC section 170(f)(8)</span>,
                          taxpayers must obtain contemporaneous written acknowledgment for contributions of $250 or more. In{' '}
                          <span className="bg-green-100 px-1 rounded cursor-pointer hover:bg-green-200 font-medium">Durden v. Commissioner, T.C. Memo. 2012-140</span>,
                          the Tax Court strictly enforced this requirement, denying deductions where acknowledgment was obtained after the tax return filing.
                          {garciaCitationAdded && (
                            <>
                              {' '}However, the 11th Circuit in{' '}
                              <span className="bg-purple-100 px-1 rounded cursor-pointer hover:bg-purple-200 font-medium border-2 border-purple-400">
                                Garcia v. Commissioner (2024)
                              </span>{' '}
                              distinguished Durden, holding that electronic acknowledgments satisfy section 170(f)(8) requirements even if received after return filing but before the filing deadline.
                            </>
                          )}
                        </p>

                        {activeFeature === 'flags' && showAlert && !garciaCitationAdded && (
                          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
                            <div className="flex items-start gap-3">
                              <Bell className="text-orange-600 flex-shrink-0 mt-1" size={20} />
                              <div>
                                <div className="font-semibold text-orange-900 mb-1">Update Alert</div>
                                <div className="text-sm text-gray-700 mb-2">
                                  <strong>Durden v. Commissioner</strong> cited in your memo was distinguished by the 11th Circuit in{' '}
                                  <strong>Garcia v. Commissioner (2024)</strong>, which held that electronic acknowledgments satisfy section 170(f)(8) requirements.
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setShowUpdateReview(true)}
                                    className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                                  >
                                    Review Update
                                  </button>
                                  <button
                                    onClick={() => setShowAlert(false)}
                                    className="text-xs bg-white border border-orange-600 text-orange-600 px-3 py-1 rounded hover:bg-orange-50"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {showUpdateReview && (
                          <div
                            ref={reviewPanelRef}
                            className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 rounded-lg p-6 mb-6 shadow-lg scroll-mt-20"
                          >
                            <div className="flex items-start gap-3 mb-4">
                              <Bell className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                              <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Authority Update Review</h3>
                                <div className="text-sm text-gray-700 mb-3">Reviewing recent developments affecting cited authority</div>
                              </div>
                              <button onClick={() => setShowUpdateReview(false)} className="ml-auto text-gray-400 hover:text-gray-600">
                                <X size={20} />
                              </button>
                            </div>

                            {activeAlertId === 'hobby-claim' ? (
                              <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
                                  <div className="font-semibold text-gray-800 mb-2">Unsupported Claim in Section III:</div>
                                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                    "Taxpayers automatically qualify for the presumption of profit motive if they have gross income exceeding deductions in 3 of 5 years."
                                    <div className="mt-1 text-xs text-yellow-600 font-medium">
                                      Missing statutory authority.
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                  <div className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    <Lightbulb size={16} />
                                    Recommendation:
                                  </div>
                                  <div className="text-sm text-gray-700 mb-3">
                                    Cite <strong>IRC section 183(d)</strong> to support the presumption of profit motive rule.
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <button
                                    onClick={handleFixHobbyClaim}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                                  >
                                    Add Citation (IRC § 183(d))
                                  </button>
                                  <button
                                    onClick={() => setShowUpdateReview(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                                  <div className="font-semibold text-gray-800 mb-2">Original Citation in Your Memo:</div>
                                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                    <strong>Durden v. Commissioner, T.C. Memo. 2012-140</strong>
                                    <div className="mt-1 text-xs text-gray-600">
                                      "The Tax Court strictly enforced this requirement, denying deductions where acknowledgment was obtained after the tax return filing."
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                                  <div className="font-semibold text-gray-800 mb-2">New Development:</div>
                                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                    <strong>Garcia v. Commissioner, 11th Cir. (2024)</strong>
                                    <div className="mt-1 text-xs text-gray-600">
                                      Distinguished Durden by holding that electronic acknowledgments (including emails with required information) satisfy IRC section 170(f)(8) requirements, even if received after return filing but before the filing deadline.
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4">
                                  <div className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                    <Lightbulb size={16} />
                                    Recommendation:
                                  </div>
                                  <div className="text-sm text-gray-700 mb-3">
                                    Consider adding a note that Durden's strict contemporaneous requirement has been modified in the 11th Circuit. If your client is in the 11th Circuit jurisdiction, Garcia may provide additional flexibility.
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <button
                                    onClick={handleAddGarciaCitation}
                                    disabled={garciaCitationAdded}
                                    className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${garciaCitationAdded
                                      ? 'bg-green-600 text-white cursor-not-allowed'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                      }`}
                                  >
                                    {garciaCitationAdded ? 'Citation Added' : 'Add Citation'}
                                  </button>
                                  <button
                                    onClick={() => handleViewCase('Garcia v. Commissioner')}
                                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-sm font-medium">
                                    View Full Case
                                  </button>
                                  <button
                                    onClick={() => setShowUpdateReview(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <h2 className="text-xl font-bold text-gray-800 mb-4 mt-6">III. Hobby Loss Rules Under IRC section 183</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          Activities not engaged in for profit are subject to limitation under{' '}
                          <span className="bg-blue-100 px-1 rounded cursor-pointer hover:bg-blue-200 font-medium">IRC section 183</span>. The regulations at{' '}
                          <span className="bg-blue-100 px-1 rounded cursor-pointer hover:bg-blue-200 font-medium">Treas. Reg. section 1.183-2(b)</span>{' '}
                          establish a nine-factor test for determining profit motive. Courts apply these factors holistically, with no single factor being determinative.
                          Taxpayers automatically qualify for the presumption of profit motive if they have gross income exceeding deductions in 3 of 5 years.
                          {hobbyCitationAdded && (
                            <>
                              {' '}
                              <span className="bg-blue-100 px-1 rounded cursor-pointer hover:bg-blue-200 font-medium border-2 border-blue-400">
                                IRC section 183(d)
                              </span>
                            </>
                          )}
                        </p>

                        <h2 className="text-xl font-bold text-gray-800 mb-4 mt-6">Conclusion</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          Federal courts consistently emphasize strict compliance with substantiation requirements across all deduction categories. Taxpayers bear the burden of proof and must maintain contemporaneous records. The trend indicates decreasing judicial tolerance for inadequate documentation, regardless of the substantive merit of claimed expenses.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-96 bg-gray-50 border-l overflow-y-auto">
                <div className="p-4">
                  <div className="bg-white rounded-lg shadow-sm border mb-4">
                    <div className="bg-gradient-to-r from-blue-900 to-blue-600 text-white px-4 py-3 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={20} />
                        <span className="font-semibold">AI Research Assistant</span>
                      </div>
                    </div>

                    {(activeFeature === 'smart' || activeFeature === null) && (
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Search size={16} />
                          Smart Suggestions
                        </h3>

                        {showSuggestion && activeFeature === 'smart' && (
                          <div className="space-y-3 mb-4">
                            {!citationInserted ? (
                              <>
                                {activeSuggestions.map((sug, idx) => (
                                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-800 text-sm mb-1">{sug.title}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                          <span className="bg-blue-100 px-2 py-0.5 rounded">{sug.type}</span>
                                          <span className="text-green-600 font-medium">{sug.relevance} match</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-600 mb-2 italic bg-white p-2 rounded border-l-2 border-blue-400">
                                      {sug.quote.substring(0, 120)}...
                                    </div>
                                    <div className="text-xs text-gray-600 mb-3">
                                      <strong>Why relevant:</strong> {sug.reason}
                                    </div>
                                    <button
                                      onClick={() => handleInsertCitation(sug)}
                                      className="w-full bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
                                    >
                                      <Plus size={14} />
                                      Insert Citation
                                    </button>
                                  </div>
                                ))}
                              </>
                            ) : (
                              null
                            )}
                          </div>
                        )}

                        {!showSuggestion && (
                          <div className="text-sm text-gray-500 italic">Suggestions will appear as you type...</div>
                        )}
                      </div>
                    )}

                    {activeFeature === 'flags' && (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Bell size={16} />
                            Active Flags & Alerts
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">AI Analysis</span>
                            <button
                              onClick={() => setAiEnhancedMode(!aiEnhancedMode)}
                              className={`w-8 h-4 rounded-full p-0.5 transition-colors ${aiEnhancedMode ? 'bg-blue-500' : 'bg-gray-300'
                                }`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${aiEnhancedMode ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </div>
                        </div>

                        {isAnalyzingClaims && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 mb-3 bg-blue-50 p-2 rounded">
                            <Loader2 size={14} className="animate-spin" />
                            Analyzing document for legal claims...
                          </div>
                        )}

                        <div className="space-y-3">
                          {garciaCitationAdded && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                                <div>
                                  <div className="font-semibold text-green-900">All Citations Up to Date</div>
                                  <div className="text-sm text-green-800">
                                    No outdated authorities detected.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* AI-Detected Authority Updates */}
                          {aiAuthorityUpdates.map((update, idx) => (
                            <div key={`update-${idx}`} className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded">
                              <div className="flex items-start justify-between mb-1">
                                <span className="font-semibold text-sm text-gray-800">
                                  {update.newAuthority ? 'Authority Update' : 'Citation Alert'}
                                </span>
                                <span className="text-xs text-gray-500">Just now</span>
                              </div>
                              <p className="text-xs text-gray-700 mb-2">
                                {update.summary || update.message}
                              </p>
                              <button
                                onClick={() => setShowUpdateReview(true)}
                                className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 bg-orange-600 text-white hover:bg-orange-700">
                                Review Impact
                              </button>
                            </div>
                          ))}

                          {activeFeature === 'flags' && !isCheckingUpdates && aiAuthorityUpdates.length === 0 &&
                            alerts.filter(a => {
                              if (a.id === 'outdated' && garciaCitationAdded) return false;
                              if (a.id === 'hobby-claim') return false; // Don't show in main list
                              return true;
                            }).map((alert, idx) => (
                              <div
                                key={idx}
                                className={`border-l-4 p-3 rounded ${alert.severity === 'high' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'
                                  }`}
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <span className="font-semibold text-sm text-gray-800">{alert.title}</span>
                                  <span className="text-xs text-gray-500">{alert.date}</span>
                                </div>
                                <p className="text-xs text-gray-700 mb-2">{alert.message}</p>
                                <button
                                  onClick={() => {
                                    setShowUpdateReview(true);
                                    setActiveAlertId(alert.id);
                                  }}
                                  className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 text-orange-600 font-medium">
                                  Review
                                </button>
                              </div>
                            ))}
                        </div>

                        <div className="mt-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Unsupported Claims</h4>

                          {aiUnsupportedClaims.length > 0 || !hobbyCitationAdded ? (
                            <>
                              {!hobbyCitationAdded && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded relative group">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <div className="text-xs font-semibold text-red-900 mb-1">
                                          Unsupported Legal Standard
                                        </div>
                                        <span className="text-[10px] text-gray-500">Just now</span>
                                      </div>
                                      <div className="text-xs text-gray-700 italic mb-2">
                                        "Presumption of profit motive rule stated in Section III requires statutory citation."
                                      </div>
                                      <button
                                        onClick={() => {
                                          setShowUpdateReview(true);
                                          setActiveAlertId('hobby-claim');
                                        }}
                                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                      >
                                        Review Issue
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {aiUnsupportedClaims.map((claim, idx) => (
                                <div key={idx} className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded relative group">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
                                    <div className="flex-1">
                                      <div className="text-xs font-semibold text-yellow-900 mb-1">
                                        Unsupported Assertion
                                      </div>
                                      <div className="text-xs text-gray-700 italic mb-2">
                                        "{claim.claim}"
                                      </div>
                                      {claim.suggestedAuthority && (
                                        <div className="bg-white p-2 rounded border border-yellow-100 mb-2">
                                          <div className="text-xs font-medium text-gray-800 mb-1">
                                            Suggested Support:
                                          </div>
                                          <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline mb-1">
                                            {claim.suggestedAuthority.title}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {claim.suggestedAuthority.reason}
                                          </div>
                                        </div>
                                      )}
                                      <button
                                        onClick={() => {
                                          if (claim.suggestedAuthority) {
                                            handleInsertCitation({
                                              title: claim.suggestedAuthority.title,
                                              quote: "Supporting authority inserted via AI suggestion.",
                                              type: claim.suggestedAuthority.type || 'Case'
                                            });
                                            // Remove from list (optimistic update)
                                            setAiUnsupportedClaims(prev => prev.filter((_, i) => i !== idx));
                                          }
                                        }}
                                        className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                                      >
                                        Add Citation
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                              <CheckCircle className="text-green-600" size={16} />
                              <span className="text-xs text-green-800 font-medium">
                                {isAnalyzingClaims ? "Analysis in progress..." : "No unsupported claims detected."}
                              </span>
                            </div>
                          )}
                        </div>

                        {unsupportedFixed && (
                          <div className="mt-4 bg-green-50 border border-green-300 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-800 font-semibold text-sm mb-2">
                              <CheckCircle size={16} />
                              Citation Added Successfully
                            </div>
                            <div className="text-xs text-gray-700">
                              Citation has been added to:
                            </div>
                            <ul className="text-xs text-gray-700 mt-2 space-y-1 ml-3">
                              <li>• Your document text</li>
                              <li>• Table of Authorities</li>
                              <li>• Research Memory</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {activeFeature === 'citations' && (
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Link size={16} />
                          Table of Authorities
                        </h3>

                        {(citationInserted || unsupportedFixed) && (
                          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs mb-1">
                              <CheckCircle size={14} />
                              Table Updated
                            </div>
                            <div className="text-xs text-gray-700">New citations automatically added and formatted</div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Cases</h4>
                            <div className="space-y-2 text-xs text-gray-700">
                              {garciaCitationAdded && (
                                <div className="bg-purple-50 p-2 rounded border-2 border-purple-400">
                                  <div className="font-medium">Garcia v. Commissioner</div>
                                  <div className="text-gray-500">11th Cir. (2024)</div>
                                  <div className="text-purple-600 mt-1 font-semibold">Just added!</div>
                                </div>
                              )}
                              {unsupportedFixed && (
                                <div className="bg-purple-50 p-2 rounded border-2 border-purple-400">
                                  <div className="font-medium">Cohan v. Commissioner</div>
                                  <div className="text-gray-500">39 F.2d 540 (2d Cir. 1930)</div>
                                  <div className="text-purple-600 mt-1 font-semibold">Just added!</div>
                                </div>
                              )}
                              {citationInserted && insertedCitation?.type === 'Tax Court' && (
                                <div className="bg-purple-50 p-2 rounded border-2 border-purple-400">
                                  <div className="font-medium">{insertedCitation.title}</div>
                                  <div className="text-purple-600 mt-1 font-semibold">Just added!</div>
                                </div>
                              )}
                              <div className="bg-white p-2 rounded border">
                                <div className="font-medium">Smith v. Commissioner</div>
                                <div className="text-gray-500">138 T.C. 121 (2012)</div>
                                <div className="text-gray-400 mt-1">Cited: Page 2</div>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <div className="font-medium">Durden v. Commissioner</div>
                                <div className="text-gray-500">T.C. Memo. 2012-140</div>
                                <div className="text-gray-400 mt-1">Cited: Page 3</div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Statutes</h4>
                            <div className="space-y-2 text-xs text-gray-700">
                              {citationInserted && insertedCitation?.type === 'Statute' && (
                                <div className="bg-purple-50 p-2 rounded border-2 border-purple-400 animate-pulse">
                                  <div className="font-medium">{insertedCitation.title}</div>
                                </div>
                              )}
                              <div className="bg-white p-2 rounded border">
                                <div className="font-medium">IRC section 162(a)</div>
                                <div className="text-gray-500">Business expenses</div>
                                <div className="text-gray-400 mt-1">Cited: Page 1</div>
                              </div>
                              <div className="bg-white p-2 rounded border">
                                <div className="font-medium">Treas. Reg. section 1.183-2(b)</div>
                                <div className="text-gray-500">Hobby loss factors</div>
                                <div className="text-gray-400 mt-1">Cited: Page 4</div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Regulations</h4>
                            <div className="space-y-2 text-xs text-gray-700">
                              <div className="bg-white p-2 rounded border">
                                <div className="font-medium">Treas. Reg. section 1.274-5</div>
                                <div className="text-gray-500">Substantiation requirements</div>
                                <div className="text-gray-400 mt-1">Cited: Page 2</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFeature === 'memory' && (
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <BookOpen size={16} />
                          Research Memory
                        </h3>

                        {researchMemory.length === 0 ? (
                          <div className="text-sm text-gray-600">No research memory entries yet. Insert citations to capture memory.</div>
                        ) : (
                          <div className="space-y-3">
                            {researchMemory.map((entry, idx) => (
                              <div key={idx} className="bg-white border rounded-lg p-3 shadow-sm">
                                <div className="text-xs text-gray-500 mb-1">{entry.timestamp}</div>
                                <div className="text-sm font-semibold text-gray-800 mb-1">{entry.claim}</div>
                                <div className="text-xs text-blue-700 mb-1">{entry.authority}</div>
                                <div className="text-xs text-gray-700 italic">{entry.quote}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default DraftingWorkspace;

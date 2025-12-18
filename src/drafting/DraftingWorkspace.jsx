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
import AutocompleteEditor from './AutocompleteEditor';
import {
  detectUnsupportedClaims,
  enhanceCitationSuggestions,
  generateResearchMemoryEntry,
  checkAuthorityUpdates,
} from '../api/geminiService';

// Fallback demo suggestions (used when APIs fail or are loading)
const DEMO_SUGGESTIONS = getDemoSuggestions();

const DraftingWorkspace = () => {
  const [activeFeature, setActiveFeature] = useState('smart');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState([]);
  const [inlineSuggestion, setInlineSuggestion] = useState(null);
  const [insertedCitations, setInsertedCitations] = useState([]);
  const [toaItems, setToaItems] = useState([]);
  const [researchMemory, setResearchMemory] = useState([]);
  const [docText, setDocText] = useState(
    'The taxpayer claimed business expense deductions under IRC section 162(a) require examination of the profit motive standard. In Smith v. Commissioner, 138 T.C. 121 (2012), the Tax Court held that substantiation requirements under section 274(d) apply strictly to entertainment expenses.'
  );
  const [showAlert, setShowAlert] = useState(false);
  const [citationInserted, setCitationInserted] = useState(false);
  const [insertedCitation, setInsertedCitation] = useState(null);
  const [unsupportedFixed, setUnsupportedFixed] = useState(false);
  const [showNewMemoOptions, setShowNewMemoOptions] = useState(false);
  const [showUpdateReview, setShowUpdateReview] = useState(false);
  const [garciaCitationAdded, setGarciaCitationAdded] = useState(false);
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
    setDocText(
      'The taxpayer claimed business expense deductions under IRC section 162(a) require examination of the profit motive standard. In Smith v. Commissioner, 138 T.C. 121 (2012), the Tax Court held that substantiation requirements under section 274(d) apply strictly to entertainment expenses.'
    );
    setShowAlert(false);
    setCitationInserted(false);
    setInsertedCitation(null);
    setUnsupportedFixed(false);
    setShowUpdateReview(false);
    setGarciaCitationAdded(false);
    setSelectionPos(0);
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
    setTimeout(() => setShowUpdateReview(false), 2000);
  };

  const alerts = [
    {
      type: 'outdated',
      title: 'Citation Update Available',
      message:
        'Durden v. Commissioner cited in your memo was distinguished in recent 11th Cir. decision',
      severity: 'medium',
      date: '2 days ago',
    },
    {
      type: 'new',
      title: 'New Authority Published',
      message:
        'IRS Rev. Proc. 2024-12 updates substantiation requirements for charitable contributions',
      severity: 'high',
      date: '1 week ago',
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
          <button className="text-sm hover:text-gray-200">Help</button>
          <button className="text-sm hover:text-gray-200">Settings</button>
        </div>
      </div>

      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setActiveFeature('smart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeFeature === 'smart'
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeFeature === 'flags'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertCircle size={18} />
            Flags & Alerts
          </button>
          <button
            onClick={() => setActiveFeature('citations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeFeature === 'citations'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Link size={18} />
            Auto Citations
          </button>
          <button
            onClick={() => setActiveFeature('memory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeFeature === 'memory'
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
                      alert('Creating Tax Research Memorandum...');
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
                      alert('Creating Tax Opinion Letter...');
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
                      alert('Creating Audit File Memo...');
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
              <div className="bg-blue-50 border-l-4 border-blue-500 px-3 py-2 text-sm">
                <div className="font-semibold text-gray-800">Tax Deduction Analysis</div>
                <div className="text-xs text-gray-500">Modified today</div>
              </div>
              <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                <div className="font-medium">Client Memo - IRC 183</div>
                <div className="text-xs text-gray-500">Modified yesterday</div>
              </div>
              <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                <div className="font-medium">Charitable Contribution Research</div>
                <div className="text-xs text-gray-500">Modified 3 days ago</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-4xl mx-auto p-8">
              <div className="mb-6">
                <input
                  type="text"
                  className="text-3xl font-bold text-gray-800 border-none outline-none w-full mb-2"
                  defaultValue="Analysis: Individual Income Tax Deduction Disputes"
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

                    {activeFeature === 'flags' && showAlert && (
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

                    <h2 className="text-xl font-bold text-gray-800 mb-4 mt-6">III. Hobby Loss Rules Under IRC section 183</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Activities not engaged in for profit are subject to limitation under{' '}
                      <span className="bg-blue-100 px-1 rounded cursor-pointer hover:bg-blue-200 font-medium">IRC section 183</span>. The regulations at{' '}
                      <span className="bg-blue-100 px-1 rounded cursor-pointer hover:bg-blue-200 font-medium">Treas. Reg. section 1.183-2(b)</span>{' '}
                      establish a nine-factor test for determining profit motive. Courts apply these factors holistically, with no single factor being determinative.
                    </p>

                    {showUpdateReview && (
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 rounded-lg p-6 mb-6 shadow-lg">
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
                              className={`flex-1 px-4 py-2 rounded text-sm font-medium ${
                                garciaCitationAdded ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
                              }`}
                            >
                              {garciaCitationAdded ? 'Citation Added' : 'Add Garcia Citation'}
                            </button>
                            <button className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-sm font-medium">
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
                      </div>
                    )}

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
                          <div className="bg-green-50 border border-green-500 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                              <CheckCircle size={18} />
                              Citation Inserted Successfully
                            </div>
                            <div className="text-sm text-gray-700 mb-3">
                              <strong>{insertedCitation?.title}</strong> has been:
                            </div>
                            <ul className="text-xs text-gray-700 space-y-1 ml-4">
                              <li>Added to your document with proper formatting</li>
                              <li>Included in the Table of Authorities</li>
                              <li>Saved to Research Memory with supporting quote</li>
                              <li>Linked to the specific claim in your text</li>
                            </ul>
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <div className="text-xs text-gray-600 mb-1">
                                <strong>Quote saved:</strong>
                              </div>
                              <div className="text-xs italic bg-white p-2 rounded">
                                {insertedCitation?.quote.substring(0, 100)}...
                              </div>
                            </div>
                          </div>
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
                          className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                            aiEnhancedMode ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${
                              aiEnhancedMode ? 'translate-x-4' : 'translate-x-0'
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
                          <button className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">
                            Review Impact
                          </button>
                        </div>
                      ))}

                      {/* Hardcoded alerts fallback (if no AI alerts yet) */}
                      {activeFeature === 'flags' && !isCheckingUpdates && aiAuthorityUpdates.length === 0 && alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`border-l-4 p-3 rounded ${
                            alert.severity === 'high' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-semibold text-sm text-gray-800">{alert.title}</span>
                            <span className="text-xs text-gray-500">{alert.date}</span>
                          </div>
                          <p className="text-xs text-gray-700 mb-2">{alert.message}</p>
                          <button className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">Review</button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Unsupported Claims</h4>
                      
                      {aiUnsupportedClaims.length > 0 ? (
                        aiUnsupportedClaims.map((claim, idx) => (
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
                        ))
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
        </div>
      </div>
    </div>
  );
};

export default DraftingWorkspace;

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, ExternalLink, ChevronDown } from 'lucide-react';
import { searchCitations } from '../api/citationService';

/**
 * AutocompleteEditor - A rich text editor with inline citation autocomplete
 * 
 * Triggers autocomplete dropdown when user types:
 * - "IRC " or "IRC section" - searches for statutes
 * - "@cite " - explicit citation trigger
 * - "v. Commissioner" - case law patterns
 */
const AutocompleteEditor = ({
  value,
  onChange,
  onCitationInsert,
  placeholder = 'Start typing your memo...',
  className = '',
}) => {
  const editorRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [triggerWord, setTriggerWord] = useState('');
  const [triggerStart, setTriggerStart] = useState(0);

  // Trigger patterns for autocomplete
  const TRIGGER_PATTERNS = [
    /IRC\s+(?:section\s+)?(\d+[a-z]?)?$/i,           // IRC section 162
    /(?:section|§)\s*(\d+[a-z]?)?$/i,               // section 162 or § 162
    /@cite\s+(.*)$/i,                                // @cite explicit trigger
    /Treas\.?\s*Reg\.?\s*(?:section\s+)?(.*)$/i,    // Treas. Reg.
    /C\.?F\.?R\.?\s*(?:§\s*)?(.*)$/i,               // CFR references
    /v\.\s+Commissioner/i,                           // Case patterns
  ];

  // Check if current cursor position matches a trigger pattern
  const checkForTrigger = useCallback((text, cursorPos) => {
    const textUpToCursor = text.substring(0, cursorPos);
    
    for (const pattern of TRIGGER_PATTERNS) {
      const match = textUpToCursor.match(pattern);
      if (match) {
        // Find where the trigger starts
        const triggerText = match[0];
        const startPos = textUpToCursor.lastIndexOf(triggerText.split(/\s/)[0]);
        return {
          matched: true,
          query: triggerText,
          startPos: startPos >= 0 ? startPos : cursorPos - triggerText.length,
        };
      }
    }
    return { matched: false };
  }, []);

  // Calculate dropdown position based on cursor
  const calculateDropdownPosition = useCallback(() => {
    if (!editorRef.current) return { top: 0, left: 0 };
    
    const textarea = editorRef.current;
    const rect = textarea.getBoundingClientRect();
    
    // Create a temporary span to measure text position
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n');
    const currentLine = lines.length;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
    
    return {
      top: Math.min(currentLine * lineHeight + 8, 200),
      left: 16,
    };
  }, []);

  // Handle text changes and trigger autocomplete
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue, cursorPos);
    
    const trigger = checkForTrigger(newValue, cursorPos);
    
    if (trigger.matched && trigger.query.length >= 3) {
      setTriggerWord(trigger.query);
      setTriggerStart(trigger.startPos);
      setDropdownPos(calculateDropdownPosition());
      setShowDropdown(true);
      setSelectedIndex(0);
      fetchSuggestions(trigger.query);
    } else {
      setShowDropdown(false);
    }
  }, [onChange, checkForTrigger, calculateDropdownPosition]);

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(async (query) => {
    setIsLoading(true);
    try {
      const result = await searchCitations(query, {
        maxResults: 6,
        useDemoFallback: true,
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Insert selected citation
  const insertCitation = useCallback((citation) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const beforeTrigger = value.substring(0, triggerStart);
    const afterCursor = value.substring(textarea.selectionStart);
    
    const citationText = citation.citation || citation.title;
    const newValue = beforeTrigger + citationText + afterCursor;
    
    onChange(newValue, beforeTrigger.length + citationText.length);
    setShowDropdown(false);
    
    // Notify parent about citation insertion
    if (onCitationInsert) {
      onCitationInsert(citation);
    }
    
    // Focus back on editor
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = beforeTrigger.length + citationText.length;
    }, 0);
  }, [value, triggerStart, onChange, onCitationInsert]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!showDropdown || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (showDropdown && suggestions[selectedIndex]) {
          e.preventDefault();
          insertCitation(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
      case 'Tab':
        if (showDropdown && suggestions[selectedIndex]) {
          e.preventDefault();
          insertCitation(suggestions[selectedIndex]);
        }
        break;
      default:
        break;
    }
  }, [showDropdown, suggestions, selectedIndex, insertCitation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        editorRef.current &&
        !editorRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get type badge color
  const getTypeBadgeColor = (type) => {
    const colors = {
      'Statute': 'bg-blue-100 text-blue-800 border-blue-300',
      'Regulation': 'bg-blue-100 text-blue-800 border-blue-300',
      'Case': 'bg-green-100 text-green-800 border-green-300',
      'Tax Court': 'bg-green-100 text-green-800 border-green-300',
      'Guidance': 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={editorRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full min-h-[300px] p-4 border border-gray-300 rounded-lg text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-y font-serif text-base"
        style={{ fontFamily: 'Georgia, serif' }}
      />
      
      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full max-w-lg bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {/* Header */}
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              Citation Suggestions
            </span>
            {isLoading && (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>
          
          {/* Suggestions List */}
          <div className="max-h-64 overflow-y-auto">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id || index}
                  className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => insertCitation(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {suggestion.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {suggestion.reason || suggestion.quote?.substring(0, 60) + '...'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${getTypeBadgeColor(suggestion.type)}`}>
                        {suggestion.type}
                      </span>
                      <span className="text-xs text-green-600 font-medium">
                        {suggestion.relevance}
                      </span>
                    </div>
                  </div>
                  {suggestion.url && (
                    <a
                      href={suggestion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={10} />
                      View source
                    </a>
                  )}
                </div>
              ))
            ) : !isLoading ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No suggestions found. Keep typing...
              </div>
            ) : null}
          </div>
          
          {/* Footer hint */}
          <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-200 text-xs text-gray-500 flex items-center gap-3">
            <span><kbd className="bg-white px-1 rounded border">↑↓</kbd> Navigate</span>
            <span><kbd className="bg-white px-1 rounded border">Tab</kbd> or <kbd className="bg-white px-1 rounded border">Enter</kbd> Insert</span>
            <span><kbd className="bg-white px-1 rounded border">Esc</kbd> Close</span>
          </div>
        </div>
      )}
      
      {/* Trigger hint */}
      <div className="mt-2 text-xs text-gray-400 flex items-center gap-4">
        <span>💡 Type <code className="bg-gray-100 px-1 rounded">IRC 162</code> or <code className="bg-gray-100 px-1 rounded">@cite</code> for suggestions</span>
      </div>
    </div>
  );
};

export default AutocompleteEditor;

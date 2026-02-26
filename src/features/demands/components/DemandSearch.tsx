import React, { useState, useEffect, useRef } from "react";
import { Search, X, MapPin, User, FileText, Activity, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppStore, Demand } from "../../../shared/store/appStore";
import Badge from "../../../shared/components/ui/badge/Badge";

export const DemandSearch: React.FC<{ className?: string }> = ({ className }) => {
  const { demands, statusOptions, urgencyOptions, categoryOptions } = useAppStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Demand[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    const filtered = demands.filter((demand) => {
      // Search in basic fields
      if (
        demand.id.toLowerCase().includes(lowerQuery) ||
        demand.title.toLowerCase().includes(lowerQuery) ||
        demand.description.toLowerCase().includes(lowerQuery) ||
        demand.protocol.toLowerCase().includes(lowerQuery) ||
        demand.requesterName.toLowerCase().includes(lowerQuery) ||
        demand.requesterContact?.toLowerCase().includes(lowerQuery)
      ) {
        return true;
      }

      // Search in status label
      const statusLabel = statusOptions.find(s => s.value === demand.status)?.label || demand.status;
      if (statusLabel?.toLowerCase().includes(lowerQuery)) return true;

      // Search in urgency label
      const urgencyLabel = urgencyOptions.find(u => u.value === demand.urgency)?.label || demand.urgency;
      if (urgencyLabel?.toLowerCase().includes(lowerQuery)) return true;

      // Search in category label
      const categoryLabel = categoryOptions.find(c => c.value === demand.category)?.label || demand.category;
      if (categoryLabel?.toLowerCase().includes(lowerQuery)) return true;

      // Search in tratativas
      if (demand.tratativas?.some(t => t.title.toLowerCase().includes(lowerQuery))) {
        return true;
      }

      return false;
    }).slice(0, 10); // Limit to 10 results for performance

    setResults(filtered);
    setIsOpen(true);
  }, [query, demands, statusOptions, urgencyOptions, categoryOptions]);

  const handleSelect = (id: string) => {
    navigate(`/demands/${id}`);
    setQuery("");
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getStatusBadge = (statusValue: string) => {
    const status = statusOptions.find(s => s.value === statusValue);
    if (!status) return null;
    
    return (
      <Badge 
        variant="light" 
        color={status.badge?.color || "primary"} 
        size="sm"
      >
        {status.badge?.text || status.label}
      </Badge>
    );
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-brand-100 text-brand-900 font-medium rounded px-0.5 dark:bg-brand-900/40 dark:text-brand-300">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="block w-full pl-11 pr-20 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 dark:bg-white/[0.03]"
          placeholder="Buscar demandas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
        />
        {!query && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none select-none">
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        )}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden dark:bg-gray-800 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Resultados encontrados ({results.length})
              </div>
              <ul>
                {results.map((demand) => (
                  <li key={demand.id}>
                    <button
                      onClick={() => handleSelect(demand.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0 dark:hover:bg-gray-700/50 dark:border-gray-700/50"
                    >
                      <div className="mt-1 p-2 bg-brand-50 rounded-lg text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 truncate dark:text-white">
                            {highlightMatch(demand.title, query)}
                          </span>
                          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded dark:bg-gray-700">
                            {highlightMatch(demand.protocol, query)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 line-clamp-1 mb-2 dark:text-gray-400">
                          {highlightMatch(demand.description, query)}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>{highlightMatch(demand.requesterName, query)}</span>
                          </div>
                          
                          {getStatusBadge(demand.status)}

                          {demand.urgency && (
                            <div className="flex items-center gap-1">
                              <AlertCircle size={12} className={
                                demand.urgency === 'alta' ? 'text-red-500' : 
                                demand.urgency === 'media' ? 'text-yellow-500' : 'text-green-500'
                              } />
                              <span>{urgencyOptions.find(u => u.value === demand.urgency)?.label}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 dark:bg-gray-700">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm">Nenhuma demanda encontrada para "<span className="font-medium text-gray-900 dark:text-white">{query}</span>"</p>
            </div>
          )}
          
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 border-t border-gray-100 flex justify-between items-center dark:bg-gray-800/80 dark:border-gray-700">
            <span>Pressione <kbd className="font-mono bg-white border border-gray-200 rounded px-1 dark:bg-gray-700 dark:border-gray-600">Esc</kbd> para fechar</span>
            <span>Mostrando {results.length} resultados</span>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Search, X, User, FileText, Users, ContactRound, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppStore, Demand } from "../../../shared/store/appStore";
import { useContactsStore } from "../../contacts/store/contactsStore";
import { useMemberStore } from "../../members/store/memberStore";
import { Contact, Member } from "../../../shared/services/db";
import Badge from "../../../shared/components/ui/badge/Badge";

export const DemandSearch: React.FC<{ className?: string }> = ({ className }) => {
  const { demands, statusOptions, urgencyOptions, categoryOptions, roleOptions, loadDemands } = useAppStore();
  const { contacts, loadContacts } = useContactsStore();
  const { members, loadMembers } = useMemberStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [demandResults, setDemandResults] = useState<Demand[]>([]);
  const [contactResults, setContactResults] = useState<Contact[]>([]);
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDemands().catch(() => undefined);
    loadContacts().catch(() => undefined);
    loadMembers().catch(() => undefined);
  }, [loadDemands, loadContacts, loadMembers]);

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
        setIsOpen(Boolean(query.trim()));
        return;
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [query]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setDemandResults([]);
      setContactResults([]);
      setMemberResults([]);
      setIsOpen(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    const filteredDemands = demands.filter((demand) => {
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
    }).slice(0, 8); // Limit to keep dropdown compact

    const filteredContacts = contacts
      .filter((contact) => {
        if (contact.name.toLowerCase().includes(lowerQuery)) return true;
        if (contact.email?.toLowerCase().includes(lowerQuery)) return true;
        if (contact.phone?.toLowerCase().includes(lowerQuery)) return true;
        if (contact.neighborhood?.toLowerCase().includes(lowerQuery)) return true;
        if (contact.address?.toLowerCase().includes(lowerQuery)) return true;
        return false;
      })
      .slice(0, 5);

    const filteredMembers = members
      .filter((member) => {
        if (member.name.toLowerCase().includes(lowerQuery)) return true;
        if (member.email?.toLowerCase().includes(lowerQuery)) return true;
        if (member.phone?.toLowerCase().includes(lowerQuery)) return true;
        if (member.address?.toLowerCase().includes(lowerQuery)) return true;
        if (member.roleId) {
          const roleLabel = roleOptions.find((r) => r.value === member.roleId)?.label || member.roleId;
          if (roleLabel.toLowerCase().includes(lowerQuery)) return true;
        }
        return false;
      })
      .slice(0, 5);

    setDemandResults(filteredDemands);
    setContactResults(filteredContacts);
    setMemberResults(filteredMembers);
    setIsOpen(true);
  }, [query, demands, statusOptions, urgencyOptions, categoryOptions, contacts, members, roleOptions]);

  const totalResultsCount = useMemo(() => {
    return demandResults.length + contactResults.length + memberResults.length;
  }, [demandResults.length, contactResults.length, memberResults.length]);

  const handleSelectDemand = (id: string) => {
    navigate(`/demands/${id}`);
    setQuery("");
    setIsOpen(false);
  };

  const handleSelectContacts = () => {
    navigate(`/contacts?q=${encodeURIComponent(query)}`);
    setIsOpen(false);
  };

  const handleSelectMembers = () => {
    navigate(`/members?q=${encodeURIComponent(query)}`);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setDemandResults([]);
    setContactResults([]);
    setMemberResults([]);
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
          placeholder="Buscar no sistema..."
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
          {totalResultsCount > 0 ? (
            <div className="max-h-[420px] overflow-y-auto py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Resultados encontrados ({totalResultsCount})
              </div>

              {demandResults.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Demandas</span>
                    <span className="text-gray-300">{demandResults.length}</span>
                  </div>
                  <ul className="mb-1">
                    {demandResults.map((demand) => (
                      <li key={demand.id}>
                        <button
                          onClick={() => handleSelectDemand(demand.id)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0 dark:hover:bg-gray-700/50 dark:border-gray-700/50"
                        >
                          <div className="mt-1 p-2 bg-brand-50 rounded-lg text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                            <FileText size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="font-medium text-gray-900 truncate dark:text-white">
                                {highlightMatch(demand.title, query)}
                              </span>
                              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded dark:bg-gray-700 shrink-0">
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
                                  <AlertCircle
                                    size={12}
                                    className={
                                      demand.urgency === "alta"
                                        ? "text-red-500"
                                        : demand.urgency === "media"
                                          ? "text-yellow-500"
                                          : "text-green-500"
                                    }
                                  />
                                  <span>{urgencyOptions.find((u) => u.value === demand.urgency)?.label}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {memberResults.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Membros</span>
                    <span className="text-gray-300">{memberResults.length}</span>
                  </div>
                  <ul className="mb-1">
                    {memberResults.map((member) => (
                      <li key={member.id}>
                        <button
                          onClick={handleSelectMembers}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0 dark:hover:bg-gray-700/50 dark:border-gray-700/50"
                        >
                          <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            <Users size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-gray-900 truncate dark:text-white">
                                {highlightMatch(member.name, query)}
                              </span>
                              {member.roleId && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded dark:bg-gray-700 truncate max-w-[140px]">
                                  {highlightMatch(
                                    roleOptions.find((r) => r.value === member.roleId)?.label || member.roleId,
                                    query
                                  )}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                              {member.email && <span>{highlightMatch(member.email, query)}</span>}
                              <span>{highlightMatch(member.phone, query)}</span>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {contactResults.length > 0 && (
                <>
                  <div className="px-4 pt-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Contatos</span>
                    <span className="text-gray-300">{contactResults.length}</span>
                  </div>
                  <ul>
                    {contactResults.map((contact) => (
                      <li key={contact.id}>
                        <button
                          onClick={handleSelectContacts}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0 dark:hover:bg-gray-700/50 dark:border-gray-700/50"
                        >
                          <div className="mt-1 p-2 bg-emerald-50 rounded-lg text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <ContactRound size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-gray-900 truncate dark:text-white">
                                {highlightMatch(contact.name, query)}
                              </span>
                              {contact.neighborhood && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded dark:bg-gray-700 truncate max-w-[140px]">
                                  {highlightMatch(contact.neighborhood, query)}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
                              {contact.email && <span>{highlightMatch(contact.email, query)}</span>}
                              {contact.phone && <span>{highlightMatch(contact.phone, query)}</span>}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 dark:bg-gray-700">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm">Nenhum resultado encontrado para "<span className="font-medium text-gray-900 dark:text-white">{query}</span>"</p>
            </div>
          )}
          
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 border-t border-gray-100 flex justify-between items-center dark:bg-gray-800/80 dark:border-gray-700">
            <span>Pressione <kbd className="font-mono bg-white border border-gray-200 rounded px-1 dark:bg-gray-700 dark:border-gray-600">Esc</kbd> para fechar</span>
            <span>Mostrando {totalResultsCount} resultados</span>
          </div>
        </div>
      )}
    </div>
  );
};

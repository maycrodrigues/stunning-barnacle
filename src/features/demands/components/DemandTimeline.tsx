import React, { useEffect } from 'react';
import Swal from 'sweetalert2';
import { TimelineEvent } from '../../../shared/services/db';
import { useMemberStore } from '../../members/store/memberStore';
import { useAppStore } from '../../../shared/store/appStore';

interface DemandTimelineProps {
  timeline?: TimelineEvent[];
}

export const DemandTimeline: React.FC<DemandTimelineProps> = ({ timeline = [] }) => {
  const { members, loadMembers } = useMemberStore();
  const { statusOptions } = useAppStore();

  useEffect(() => {
    loadMembers();
  }, []);

  const getMemberName = (id: any) => {
    if (!id || typeof id !== 'string') return 'Não atribuído';
    const member = members.find(m => m.id === id);
    return member ? member.name : 'Usuário desconhecido';
  };

  const getStatusLabel = (slug: any) => {
    if (!slug || typeof slug !== 'string') return slug;
    const option = statusOptions.find(o => o.value === slug);
    return option ? option.label : slug;
  };

  const sortedEvents = [...timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedEvents.length === 0) {
    return <div className="text-gray-500 text-sm text-center py-4">Nenhum histórico registrado.</div>;
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'created':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white dark:bg-blue-900 dark:ring-gray-900">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </span>
        );
      case 'updated':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 ring-8 ring-white dark:bg-yellow-900 dark:ring-gray-900">
            <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </span>
        );
      case 'status_change':
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 ring-8 ring-white dark:bg-green-900 dark:ring-gray-900">
            <svg className="h-5 w-5 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        );
      case 'tratativa':
        const action = event.metadata?.action;
        
        if (action === 'removed') {
            return (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 ring-8 ring-white dark:bg-red-900 dark:ring-gray-900">
                    <svg className="h-5 w-5 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </span>
            );
        }
        
        if (action === 'completed') {
             return (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 ring-8 ring-white dark:bg-green-900 dark:ring-gray-900">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </span>
            );
        }
        
        if (action === 'reopened') {
             return (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 ring-8 ring-white dark:bg-yellow-900 dark:ring-gray-900">
                    <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </span>
            );
        }

        // Default (added)
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 ring-8 ring-white dark:bg-indigo-900 dark:ring-gray-900">
            <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
        );
      default:
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 ring-8 ring-white dark:bg-gray-700 dark:ring-gray-900">
             <svg className="h-5 w-5 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </span>
        );
    }
  };

  const shouldScroll = sortedEvents.length > 5;

  return (
    <div className={`flow-root ${shouldScroll ? "max-h-[400px] overflow-y-auto pr-2" : ""}`}>
      <ul role="list" className="-mb-8">
        {sortedEvents.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== sortedEvents.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  {getIcon(event)}
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">{event.title}</span>
                      {event.user && <span className="text-xs ml-2 text-gray-400">por {event.user}</span>}
                    </p>
                     {event.type === 'tratativa' ? (
                        <div className={`mt-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 ${event.metadata?.action === 'removed' ? 'opacity-75 bg-gray-50 dark:bg-gray-800/50 border-l-4 border-red-200 dark:border-red-900' : ''}`}>
                            {event.metadata?.tratativaTitle && (
                                <p className={`font-bold text-gray-900 dark:text-white mb-2 ${event.metadata?.action === 'removed' ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>{event.metadata.tratativaTitle}</p>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
                        </div>
                     ) : (
                        event.metadata && event.metadata.justification && (
                            <div className="mt-2 text-sm italic text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded border-l-4 border-gray-300 dark:border-gray-600">
                              {event.metadata.justification}
                            </div>
                        )
                     )}

                     {event.metadata && event.metadata.attachment && (
                        <div className="mt-3">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Anexo:</p>
                            {event.metadata.attachment.type === 'image' ? (
                            <div className="relative group max-w-xs">
                                <img 
                                src={event.metadata.attachment.url} 
                                alt={event.metadata.attachment.name} 
                                className="rounded-lg border border-gray-200 dark:border-gray-700 max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                    Swal.fire({
                                        imageUrl: event.metadata?.attachment?.url,
                                        imageAlt: event.metadata?.attachment?.name,
                                        showConfirmButton: false,
                                        showCloseButton: true,
                                        width: 'auto',
                                        background: 'transparent',
                                        backdrop: 'rgba(0,0,0,0.8)'
                                    });
                                }}
                                />
                            </div>
                            ) : (
                            <a 
                                href={event.metadata.attachment.url} 
                                download={event.metadata.attachment.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-fit"
                            >
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px]">
                                {event.metadata.attachment.name}
                                </span>
                            </a>
                            )}
                        </div>
                     )}
                     
                     {/* Changes Display */}
                     {event.metadata && (event.title === 'Responsável atualizado' || event.title === 'Status atualizado') && (
                         <div className="mt-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded flex flex-col gap-1 border border-gray-100 dark:border-gray-700">
                            <div className="flex gap-1">
                                <span className="font-medium">De:</span> 
                                <span>
                                    {event.title === 'Responsável atualizado' 
                                        ? getMemberName(event.metadata.from) 
                                        : getStatusLabel(event.metadata.from)}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                <span className="font-medium">Para:</span> 
                                <span className="font-bold text-gray-700 dark:text-gray-300">
                                    {event.title === 'Responsável atualizado' 
                                        ? getMemberName(event.metadata.to) 
                                        : getStatusLabel(event.metadata.to)}
                                </span>
                            </div>
                            
                            {/* Show responsible in status change if present */}
                            {event.title === 'Status atualizado' && event.metadata.responsibleId && (
                                <div className="flex gap-1 mt-1 pt-1 border-t border-gray-200 dark:border-gray-600">
                                    <span className="font-medium">Responsável:</span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {getMemberName(event.metadata.responsibleId)}
                                    </span>
                                </div>
                            )}
                         </div>
                     )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                    <time dateTime={event.date.toString()}>
                        {formatDate(event.date)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

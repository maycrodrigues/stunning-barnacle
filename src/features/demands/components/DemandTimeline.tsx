import React from 'react';
import Swal from 'sweetalert2';
import { TimelineEvent } from '../../../shared/services/db';

interface DemandTimelineProps {
  timeline?: TimelineEvent[];
}

export const DemandTimeline: React.FC<DemandTimelineProps> = ({ timeline = [] }) => {
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

  const getIcon = (type: string) => {
    switch (type) {
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
                  {getIcon(event.type)}
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-white">{event.title}</span>
                      {event.user && <span className="text-xs ml-2 text-gray-400">por {event.user}</span>}
                    </p>
                     {event.description && (
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                            {event.description}
                        </p>
                     )}
                     
                     {event.metadata && event.metadata.justification && (
                        <div className="mt-2 text-sm italic text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded border-l-4 border-gray-300 dark:border-gray-600">
                            Justificativa: "{event.metadata.justification}"
                        </div>
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
                     
                     {/* 
                     {event.metadata && (
                         <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            {event.metadata.from !== undefined && <div>De: {String(event.metadata.from)}</div>}
                            {event.metadata.to !== undefined && <div>Para: {String(event.metadata.to)}</div>}
                         </div>
                     )}
                     */}
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

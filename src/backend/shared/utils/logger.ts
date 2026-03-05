export const logger = {
  info: (message: string, meta?: any) => console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message, ...meta })),
  error: (message: string, meta?: any) => console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), message, ...meta })),
  warn: (message: string, meta?: any) => console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), message, ...meta })),
  // Context-specific loggers
  demand: (message: string, meta?: any) => console.log(JSON.stringify({ level: 'info', context: 'DEMAND', timestamp: new Date().toISOString(), message, ...meta })),
  contact: (message: string, meta?: any) => console.log(JSON.stringify({ level: 'info', context: 'CONTACT', timestamp: new Date().toISOString(), message, ...meta })),
  member: (message: string, meta?: any) => console.log(JSON.stringify({ level: 'info', context: 'MEMBERS', timestamp: new Date().toISOString(), message, ...meta })),
  settings: (message: string, meta?: any) => console.log(JSON.stringify({ level: 'info', context: 'SETTINGS', timestamp: new Date().toISOString(), message, ...meta })),
};

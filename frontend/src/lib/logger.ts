// Caminho: frontend/src/lib/logger.ts

/**
 * Sistema de Logging Frontend - Pub System
 * 
 * Suporta logging tanto no browser quanto no SSR (Next.js)
 * Usa console.log nativo mas com formatação consistente
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  module?: string;
  data?: unknown;
  error?: Error | unknown;
  // Permite propriedades extras para contexto adicional
  [key: string]: unknown;
}

const isServer = typeof window === 'undefined';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Formata a mensagem de log com timestamp e módulo
   */
  private formatMessage(level: LogLevel, module: string, message: string): string {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const emoji = this.getEmoji(level);
    const prefix = isServer ? '[SSR]' : '[CLIENT]';
    
    return `${prefix} ${emoji} [${timestamp}] [${module}] ${message}`;
  }

  /**
   * Retorna emoji apropriado para cada nível de log
   */
  private getEmoji(level: LogLevel): string {
    const emojis = {
      log: '✅',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    };
    return emojis[level];
  }

  /**
   * Log normal - operações bem-sucedidas
   */
  log(message: string, options: LogOptions = {}) {
    const { module = 'App', data } = options;
    const formattedMessage = this.formatMessage('log', module, message);
    
    console.log(formattedMessage);
    if (data) console.log('  └─ Data:', data);
  }

  /**
   * Info - informações úteis
   */
  info(message: string, options: LogOptions = {}) {
    const { module = 'App', data } = options;
    const formattedMessage = this.formatMessage('info', module, message);
    
    console.info(formattedMessage);
    if (data) console.info('  └─ Data:', data);
  }

  /**
   * Warning - situações anormais não críticas
   */
  warn(message: string, options: LogOptions = {}) {
    const { module = 'App', data } = options;
    const formattedMessage = this.formatMessage('warn', module, message);
    
    console.warn(formattedMessage);
    if (data) console.warn('  └─ Data:', data);
  }

  /**
   * Error - erros críticos
   */
  error(message: string, options: LogOptions = {}) {
    const { module = 'App', error, data } = options;
    const formattedMessage = this.formatMessage('error', module, message);
    
    console.error(formattedMessage);
    if (error) {
      if (error instanceof Error) {
        console.error('  ├─ Error:', error.message);
        if (this.isDevelopment && error.stack) {
          console.error('  └─ Stack:', error.stack);
        }
      } else {
        console.error('  ├─ Error:', error);
      }
    }
    if (data) console.error('  └─ Data:', data);
  }

  /**
   * Debug - apenas em desenvolvimento
   */
  debug(message: string, options: LogOptions = {}) {
    if (!this.isDevelopment) return;
    
    const { module = 'App', data } = options;
    const formattedMessage = this.formatMessage('debug', module, message);
    
    console.debug(formattedMessage);
    if (data) console.debug('  └─ Data:', data);
  }

  /**
   * Log de requisição HTTP (API)
   */
  api(type: 'request' | 'response' | 'error', details: {
    method?: string;
    url?: string;
    status?: number;
    duration?: number;
    error?: unknown;
  }) {
    const { method, url, status, duration, error } = details;
    
    if (type === 'request') {
      this.log(`📤 ${method} ${url}`, { module: 'API' });
    } else if (type === 'response') {
      const emoji = status && status >= 400 ? '❌' : '✅';
      this.log(`📥 ${emoji} ${method} ${url} - ${status} (${duration}ms)`, { module: 'API' });
    } else if (type === 'error') {
      this.error(`🔥 ${method} ${url} - Falhou`, { 
        module: 'API', 
        data: error 
      });
    }
  }

  /**
   * Log de WebSocket
   */
  socket(event: string, details?: any) {
    const emoji = event.includes('connect') ? '🔌' : 
                  event.includes('disconnect') ? '🔴' : 
                  event.includes('error') ? '❌' : '📡';
    
    this.log(`${emoji} ${event}`, { module: 'WebSocket', data: details });
  }
}

// Exporta instância singleton
export const logger = new Logger();

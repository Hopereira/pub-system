// Caminho: backend/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        details = (exceptionResponse as any).error || null;
      }

      // Log diferenciado por tipo de erro
      if (status >= 500) {
        this.logger.error(
          `🔥 ERRO INTERNO: ${request.method} ${request.url} | Status: ${status} | ${message}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      } else if (status >= 400) {
        this.logger.warn(
          `⚠️ ERRO CLIENTE: ${request.method} ${request.url} | Status: ${status} | ${message}`,
        );
      }
    } else {
      // Exceções não tratadas
      const errorMessage = exception instanceof Error ? exception.message : String(exception);
      const errorStack = exception instanceof Error ? exception.stack : undefined;
      const errorName = exception instanceof Error ? exception.name : 'Unknown';
      
      this.logger.error(
        `💥 EXCEÇÃO NÃO CAPTURADA: ${request.method} ${request.url} | ${errorName}: ${errorMessage}`,
        errorStack,
      );
      
      // Se for um erro conhecido, usar a mensagem
      if (exception instanceof Error) {
        message = exception.message;
      }
    }

    // Log de validação de DTOs
    if (status === 400 && details) {
      this.logger.warn(
        `🔍 VALIDAÇÃO FALHOU: ${request.method} ${request.url} | Erros: ${JSON.stringify(details)}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(details && { errors: details }),
    });
  }
}

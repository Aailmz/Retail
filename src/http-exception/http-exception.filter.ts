// src/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const isHtml = request.accepts('html');
    
    if (isHtml) {
      let template = 'errors/500';
      
      if (status === HttpStatus.NOT_FOUND) {
        template = 'errors/404';
      } else if (status === HttpStatus.UNAUTHORIZED) {
        template = 'errors/401';
      } else if (status === HttpStatus.FORBIDDEN) {
        template = 'errors/403';
      }
      
      return response.status(status).render(template, {
        message: exception.message,
        statusCode: status
      });
    }

    return response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message
    });
  }
}
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
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | object = 'Đã có lỗi xảy ra trên hệ thống';

    if (isHttpException) {
      const res = exception.getResponse();
      message = typeof res === 'object' ? (res as any).message || res : res;
    } else {
      // Log internal non-HTTP exceptions server-side
      this.logger.error(
        `[${request.method}] ${request.url} - Internal error: ${
          exception instanceof Error ? exception.stack : JSON.stringify(exception)
        }`,
      );
      if (process.env.NODE_ENV === 'production') {
        message = 'Lỗi hệ thống nội bộ. Vui lòng thử lại sau.';
      } else {
        message = exception instanceof Error ? exception.message : 'Internal Server Error';
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}


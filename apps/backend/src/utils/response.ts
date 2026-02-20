import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export class ApiResponseHandler {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, error: string, statusCode: number = 500) {
    const response: ApiResponse = {
      success: false,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    pageSize: number
  ) {
    const response: PaginatedResponse<T> = {
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
    return res.json(response);
  }
}

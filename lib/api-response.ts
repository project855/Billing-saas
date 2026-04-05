export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

export function errorResponse(message: string, details?: unknown) {
  return {
    success: false,
    error: message,
    ...(details ? { details } : {}),
  };
}

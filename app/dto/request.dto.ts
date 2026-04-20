export interface CreateRequestDto {
  user_id: string;
  payload: unknown;
}

export function validateCreateRequestDto(data: unknown): {
  valid: boolean;
  error?: string;
  data?: CreateRequestDto;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body must be an object" };
  }

  const body = data as Record<string, unknown>;

  if (!body.user_id || typeof body.user_id !== "string") {
    return { valid: false, error: "user_id is required and must be a string" };
  }

  if (body.user_id.trim().length === 0) {
    return { valid: false, error: "user_id cannot be empty" };
  }

  return {
    valid: true,
    data: {
      user_id: body.user_id,
      payload: body.payload,
    },
  };
}

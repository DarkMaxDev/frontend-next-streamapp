const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiErrorResponse {
  msg?: string;
}

// 1. Clase personalizada para errores de API
export class ApiFetchError extends Error {
  response: { status: number; data: ApiErrorResponse };
  constructor(status: number, data: ApiErrorResponse) {
    super(data.msg || "Error de API");
    this.name = "ApiFetchError";
    this.response = { status, data };
  }
}


export const apiFetch = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);

    // Si no es OK, lanzamos nuestra clase ApiFetchError
    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({ msg: "Error desconocido" }))) as ApiErrorResponse;
      throw new ApiFetchError(response.status, errorData);
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // 2. Manejo de Timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiFetchError(408, { msg: "Servidor lento" });
    }

    // 3. Re-lanzar si ya es nuestro error
    throw error;
  }
};
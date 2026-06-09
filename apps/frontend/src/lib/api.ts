type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: any;
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let { body } = options;
  if (body) {
    if (body instanceof FormData) {
      // let fetch handle content-type boundary
    } else {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(body);
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    body: body as BodyInit,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  if (response.status === 204 || response.headers.get('content-length') === '0' || !isJson) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: ApiOptions) => request<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: any, options?: ApiOptions) => request<T>(endpoint, { ...options, method: 'PUT', body }),
  delete: <T>(endpoint: string, options?: ApiOptions) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};

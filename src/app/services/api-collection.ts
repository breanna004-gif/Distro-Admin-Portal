export interface PagedApiResponse<T> {
  content: T[];
}

export type ApiCollection<T> = T[] | PagedApiResponse<T>;

export function unwrapApiCollection<T>(response: ApiCollection<T>): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.content)) {
    return response.content;
  }

  throw new Error('The API returned an invalid collection response.');
}


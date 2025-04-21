declare module 'visa-api-client' {
  export class VisaAPIClient {
    constructor(config: {
      username: string;
      password: string;
      baseUrl: string;
    });

    get<T>(path: string, options?: RequestOptions): Promise<T>;
    post<T>(path: string, data: any, options?: RequestOptions): Promise<T>;
  }

  interface RequestOptions {
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
  }
} 
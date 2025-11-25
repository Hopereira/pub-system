// Caminho: frontend/src/types/axios-retry.d.ts
// Declaração de tipos para axios-retry

declare module 'axios-retry' {
  import { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

  interface IAxiosRetryConfig {
    retries?: number;
    retryDelay?: (retryCount: number, error: AxiosError) => number;
    retryCondition?: (error: AxiosError) => boolean;
    shouldResetTimeout?: boolean;
    onRetry?: (
      retryCount: number,
      error: AxiosError,
      requestConfig: AxiosRequestConfig
    ) => void;
  }

  interface IAxiosRetry {
    (axiosInstance: AxiosInstance, axiosRetryConfig?: IAxiosRetryConfig): void;
    isNetworkError(error: AxiosError): boolean;
    isRetryableError(error: AxiosError): boolean;
    isSafeRequestError(error: AxiosError): boolean;
    isIdempotentRequestError(error: AxiosError): boolean;
    isNetworkOrIdempotentRequestError(error: AxiosError): boolean;
    exponentialDelay(retryNumber: number): number;
  }

  const axiosRetry: IAxiosRetry;
  export default axiosRetry;
}

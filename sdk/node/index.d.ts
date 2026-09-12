/** Déclarations TypeScript pour @cleanchain/sdk. */

export interface CleanChainClientOptions {
  apiKey?: string | null;
  baseUrl?: string;
  timeout?: number;
}

export type Analysis = Record<string, unknown>;

export declare class CleanChainError extends Error {
  status?: number;
}

export declare class CleanChainClient {
  constructor(options?: CleanChainClientOptions);
  analyze(
    address: string,
    options?: { network?: string }
  ): Promise<Analysis>;
  analyzeBatch(
    batch: string[],
    options?: { webhook?: string | null; profondeur?: number }
  ): Promise<Analysis>;
  latestReports(options?: { limit?: number; cursor?: string }): Promise<Analysis>;
}

export declare const DEFAULT_BASE_URL: string;
import type { Evidence } from '../types';

export interface EvidenceProvider {
  /**
   * Search for evidence based on a query.
   * Returns a list of structured evidence items.
   */
  search(query: string, limit?: number): Promise<Array<{
    source: string;
    title: string;
    url: string;
    snippet: string;
    publishedAt: string | null;
  }>>;
}

const providers = new Map<string, EvidenceProvider>();

export function registerEvidenceProvider(name: string, provider: EvidenceProvider): void {
  providers.set(name, provider);
}

export function getEvidenceProvider(name?: string): EvidenceProvider {
  const providerName = name || process.env.EVIDENCE_PROVIDER || 'web-search';
  const provider = providers.get(providerName);
  if (!provider) {
    throw new Error(`Evidence provider "${providerName}" not registered.`);
  }
  return provider;
}

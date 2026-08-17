import type { HubConnection } from '@microsoft/signalr';

/**
 * Builds the presence hub connection, loading the SignalR client on demand.
 *
 * `import type` is erased at compile time, so the 100 KB client is no longer
 * in the entry graph — nothing before the first interaction needs a WebSocket,
 * and the home document was preloading it on every visit.
 */
export const buildHub = async (): Promise<HubConnection> => {
  const { HubConnectionBuilder } = await import('@microsoft/signalr');
  return new HubConnectionBuilder().withUrl('/hub/presence').withAutomaticReconnect().build();
};

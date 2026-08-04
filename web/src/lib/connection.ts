import { HubConnectionBuilder, type HubConnection } from '@microsoft/signalr'

/**
 * Builds (but does not start) a SignalR connection to the presence hub.
 *
 * `baseUrl` is prepended to the relative hub path so the same call works
 * same-origin in prod (pass `""`) and against an explicit origin in tests
 * or alternate setups. Automatic reconnect is enabled so transient network
 * blips don't require a manual reload.
 */
export function createConnection(baseUrl: string = ''): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${baseUrl}/hub/presence`)
    .withAutomaticReconnect()
    .build()
}

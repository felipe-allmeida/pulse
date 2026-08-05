import { HubConnectionBuilder, type HubConnection } from '@microsoft/signalr';

export const buildHub = (): HubConnection =>
  new HubConnectionBuilder().withUrl('/hub/presence').withAutomaticReconnect().build();

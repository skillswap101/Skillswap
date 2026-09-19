/**
 * Network Connectivity & Sync Manager
 * Monitors device online/offline network transitions and dispatches system notifications.
 */

type NetworkStatusListener = (isOnline: boolean) => void;

class NetworkNotifier {
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<NetworkStatusListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleStatusChange(true));
      window.addEventListener('offline', () => this.handleStatusChange(false));
    }
  }

  public get isOnline(): boolean {
    return this.isOnlineState;
  }

  public subscribe(listener: NetworkStatusListener) {
    this.listeners.add(listener);
    // Send initial state immediately
    listener(this.isOnlineState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleStatusChange(status: boolean) {
    this.isOnlineState = status;
    this.listeners.forEach((fn) => fn(status));
  }
}

export const networkNotifier = new NetworkNotifier();

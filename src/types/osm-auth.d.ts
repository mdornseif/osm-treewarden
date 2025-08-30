declare module 'osm-auth' {
  interface OsmAuthOptions {
    client_id: string;
    redirect_uri: string;
    scope: string;
    auto?: boolean;
    singlepage?: boolean;
    url?: string;
    apiUrl?: string;
  }

  interface OsmAuthInstance {
    authenticate(callback: (err: Error | null, result: unknown) => void): void;
    authenticated(): boolean;
    logout(): void;
    url(): string;
    fetch(url: string, options?: globalThis.RequestInit): Promise<globalThis.Response>;
  }

  export function osmAuth(options: OsmAuthOptions): OsmAuthInstance;
} 
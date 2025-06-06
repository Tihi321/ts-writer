declare module "gapi-script" {
  export const gapi: {
    load: (api: string, options: { callback: () => void; onerror: (error: any) => void }) => void;
    auth2: {
      init: (config: { client_id: string; scope: string }) => Promise<any>;
      getAuthInstance: () => {
        isSignedIn: {
          get: () => boolean;
          listen: (callback: (isSignedIn: boolean) => void) => void;
        };
        currentUser: {
          get: () => {
            getBasicProfile: () => {
              getId: () => string;
              getName: () => string;
              getEmail: () => string;
              getImageUrl: () => string;
            };
            getAuthResponse: () => {
              access_token: string;
              expires_at: number;
            };
            reloadAuthResponse: () => Promise<void>;
          };
        };
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
      };
    };
    client: {
      load: (api: string, version: string) => Promise<void>;
      request: (options: {
        path: string;
        method: string;
        params?: any;
        headers?: any;
        body?: string;
      }) => Promise<{ result: any; body: string }>;
      drive: {
        files: any;
      };
    };
  };
}

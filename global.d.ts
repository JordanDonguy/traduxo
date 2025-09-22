// global.d.ts
interface GoogleAccountsId {
  initialize: (options: { client_id: string; callback: (response: any) => void }) => void;
  renderButton: (element: HTMLElement | null, options: { theme?: string; size?: string }) => void;
  prompt: () => void;
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}

declare const google: Window["google"];

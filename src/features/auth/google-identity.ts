export interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode: "popup";
  }): void;
  renderButton(element: HTMLElement, options: {
    theme: "outline";
    size: "large";
    text: "continue_with";
    locale: string;
    width: number;
  }): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

let identityPromise: Promise<GoogleIdentity> | undefined;

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (identityPromise) return identityPromise;

  identityPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      const identity = window.google?.accounts.id;
      if (identity) resolve(identity);
      else reject(new Error("Google Identity Services did not initialize"));
    };
    script.onerror = () => reject(new Error("Google Identity Services could not load"));
    document.head.appendChild(script);
  });
  return identityPromise;
}

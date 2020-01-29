declare module "@capacitor/core" {
  interface PluginRegistry {
    GoogleAuth: GoogleAuthPlugin;
  }
}

export interface Account {
  displayName?: string;
  email?: string;
  familyName?: string;
  givenName?: string;
  id: string;
  imageUrl?: string;
}

export interface GoogleAuthPlugin {
  signIn(options: { value: string }): Promise<{value: string}>;
  getCurrentAccount(): Promise<Account>;
}

import { WebPlugin } from "@capacitor/core";
import { GoogleAuthPlugin, Account, WebConfig } from "./definitions";

export class GoogleAuthWeb extends WebPlugin implements GoogleAuthPlugin {

  private webConfig: WebConfig;

  constructor() {
    super({
      name: 'GoogleAuth',
      platforms: ['web']
    });
  }
  initialize(config: WebConfig): Promise<void> {
    this.webConfig = config;
    let scopes = null;
    if (config.scopes) {
      scopes = config.scopes.join(" ");
    }
    const clientConfig = {
      client_id: config.clientId,
      scope: scopes
    };

    return new Promise((resolv, reject) => {
      var head = document.getElementsByTagName("head")[0];
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.defer = true;
      script.async = true;
      script.onload = () => {
        gapi.load("auth2", () => {
          gapi.auth2.init(clientConfig).then(() => resolv(), reject);
        });
      };
      script.onerror = reject;
      script.src = "https://apis.google.com/js/platform.js";
      head.appendChild(script);
    });
  }

  async signIn(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const user: any = {};

        var needsOfflineAccess = false;
        try {
          needsOfflineAccess = this.webConfig.serverClientId != null;
        } catch {

        }

        if (needsOfflineAccess) {
          const offlineAccessResponse = await gapi.auth2.getAuthInstance().grantOfflineAccess();
          user.serverAuthCode = offlineAccessResponse.code;
        } else {
          await gapi.auth2.getAuthInstance().signIn();
        }

        const googleUser = gapi.auth2.getAuthInstance().currentUser.get();

        if (needsOfflineAccess) {
          // HACK: AuthResponse is null if we don't do this when using grantOfflineAccess
          await googleUser.reloadAuthResponse();
        }

        const authResponse = googleUser.getAuthResponse(true);

        const profile = googleUser.getBasicProfile();
        user.email = profile.getEmail();
        user.familyName = profile.getFamilyName();
        user.givenName = profile.getGivenName();
        user.id = profile.getId();
        user.imageUrl = profile.getImageUrl();
        user.name = profile.getName();

        user.authentication = {
          accessToken: authResponse.access_token,
          idToken: authResponse.id_token
        };

        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  }

  async refresh(): Promise<any> {
    const authResponse = await gapi.auth2.getAuthInstance().currentUser.get().reloadAuthResponse();
    return {
      accessToken: authResponse.access_token,
      idToken: authResponse.id_token
    };
  }

  async signOut(): Promise<any> {
    return gapi.auth2.getAuthInstance().signOut();
  }

  async getCurrentAccount(): Promise<Account> {
    const user = gapi.auth2.getAuthInstance().currentUser.get();
    const profile = user.getBasicProfile();

    if (!profile) return null;
    else
      return {
        id: profile.getId(),
        displayName: profile.getName(),
        imageUrl: profile.getImageUrl(),
        email: profile.getEmail(),
        givenName: profile.getGivenName(),
        familyName: profile.getFamilyName(),
        idToken: user.getAuthResponse().id_token
      };
  }
}

const GoogleAuth = new GoogleAuthWeb();

function initializeWeb(config: WebConfig): Promise<void> {
  return GoogleAuth.initialize(config);
}

export { GoogleAuth, initializeWeb };

import { registerWebPlugin } from "@capacitor/core";
registerWebPlugin(GoogleAuth);

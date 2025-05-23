import {
  betterAuth,
  BetterAuthOptions,
  UnionToIntersection,
} from "better-auth";
import { anonymous, jwt, oidcProvider } from "better-auth/plugins";

const plugins = [anonymous, jwt];

type Plugins = typeof plugins;
type PlugInReturnTypes = ReturnType<Plugins[number]>;
type PluginEndpoints = UnionToIntersection<PlugInReturnTypes["endpoints"]>;
type PluginApis = {
  api: PluginEndpoints;
};

export class AuthService {
  authInstance: ReturnType<typeof betterAuth> & PluginApis;
  constructor(o: BetterAuthOptions) {
    this.authInstance = betterAuth({
      ...o,

      emailAndPassword: {
        enabled: true,
      },
      advanced: {
        cookiePrefix: "pva_",
      },
      plugins: plugins.map((plugin) => plugin()),
    });
  }

  getSession(headers: Headers) {
    return this.authInstance.api.getSession({
      headers: headers,
    });
  }
  getJwt(headers: Headers) {
    return this.authInstance.api.getToken({ headers });
  }
}

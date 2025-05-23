# better-auth snippets

Some snippets on better auth to not forget things how to do it

Also, a kinda working example on how to work with it. Maybe it's usefull to you

## How to infer the api type if you know the plugins

BetterAuth has an interesting way of inferring the available endpoints based on the list of plugins.

Say you add the `jwt` plugin;

```typescript
export const auth = betterAuth({
  ...
  plugins: [
    jwt(),
  ],
  ...
});
```

Now `auth.api` will automagically have `getToken` and `getJwks` methods on it.

Now say you need to pass this `auth` instance somewhere to be used. Maybe have it initialized in a class, or something. You can't exactly instantiate the authInstance and infer its type. You can actually get the type by using `ReturnType`

```typescript
import { betterAuth, BetterAuthOptions } from "better-auth";

export class AuthService {
  authInstance: ReturnType<typeof betterAuth>;

  constructor(o: BetterAuthOptions) {
    this.authInstance = betterAuth({
      ...o,
      plugins: [jwt()],
    });
  }
}
```

The issue? This no longer compiles

```typescript
  getJwt(headers: Headers) {
    return this.authInstance.api.getToken({ headers });
  }
```

Now, if you know the list of plugins, you can actually mix the types together. I took some inspiration from better-auth itself, making use of their `UnionToIntersection` defined type.

```typescript
import {
  betterAuth,
  BetterAuthOptions,
  UnionToIntersection,
} from "better-auth";

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
      plugins: plugins.map((plugin) -> plugin()),
    });
  }

  getJwt(headers: Headers) {
    return this.authInstance.api.getToken({ headers });
  }
}
```

Is it overly complicated? Maybe. But it works.

Maybe there's a simpler way of doing it, or maybe it will break if some plugin also has a variable shape depending on config. But it's a start.

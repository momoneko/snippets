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

## Create a user with a custom ID

Say you're migrating from some legacy authentication service to BetterAuth. Sure, you can migrate the users via some sort of ETL. But say you can't do that. Maybe the password hash functions don't match, and you don't want to be left with some old system.

If you can get a hold of the user password, you can actually use signUpEmail to create your user

```typescript
const response = auth.api.signUpEmail(signUpRequest);
```

The problem? BetterAuth will generate its own ID, and it's extremely unlikely that it'll match the one in the previous system.

BetterAuth doesn't actually have a way of creating a user with a specific ID, but we can work around that.

We can make use of setting additonalFields on the database: https://www.better-auth.com/docs/concepts/database#extending-core-schema

We add the `id` field as additional, and this basically means that we can set it from the outside. But now it means that we **have** to set it from the outside too, so it's a bit more work.

```typescript
export class AuthService {
  authInstance: ReturnType<typeof betterAuth> & PluginApis;
  constructor(o: BetterAuthOptions) {
    this.authInstance = betterAuth({
      ...o,
      user: {
        additionalFields: {
          id: {
            type: "string",
            required: true,
            input: true,
            returned: true,
          },
        },
      },
    });
  }

  async signUp(userData: SignUpData) {
    const id = crypto.randomUUID();
    return this.signUpWithId({ ...userData, id });
  }

  async signUpWithId(userData: SignUpData & { id: string }) {
    const result = await this.auth.api.signUpEmail(userData);
    return result;
  }
}
```

import { betterAuth } from "better-auth";
import { jwt, oidcProvider } from "better-auth/plugins";

import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./sqlite.db"),

  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: true,
        input: true,
        returned: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    cookiePrefix: "pva_",
  },
  plugins: [
    jwt(),
    oidcProvider({
      loginPage: `https://example.com/auth`,
      consentPage: `https://example.com/oauth`,
    }),
  ],
});

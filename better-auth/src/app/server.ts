import express from "express";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
// import { auth } from "../lib/auth";
import { AuthService } from "../lib/authClass";
import Database from "better-sqlite3";

const app = express();
const port = 8000;

const authC = new AuthService({
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
});

const auth = authC.authInstance;

app.all("/api/auth/*name", toNodeHandler(authC.authInstance));

app.use(express.json());
// Mount express json middleware after Better Auth handler
// or only apply it to routes that don't interact with Better Auth
app.post("/auth/login", async (req: express.Request, res) => {
  console.log(req.body);
  // throw new Error("no way")
  const rsp = await auth.api.signInEmail({
    body: req.body,
  });
  console.log(rsp.user);
  const response = await auth.api.signInEmail({
    body: req.body,
    asResponse: true,
  });
  res.send(response);

  const cookies = response.headers.getSetCookie();
  function extractSessionToken(cookie: string): string | null {
    const match = cookie.match(/pva_\.session_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
  const sessionToken = cookies.map(extractSessionToken).filter(Boolean)[0];
  console.log("Session Token:", sessionToken);
  const token = await auth.api.getToken({
    headers: {
      cookie: `pva_.session_token=${sessionToken}`,
    },
  });

  res.send(token);
});

app.get("/auth/getsession", async (req: express.Request, res) => {
  console.log(req.body);
  console.log(req.headers);
  const response = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
    // asResponse: true,
  });

  res.send(response);
});

const jsonErrorHandler = (err: any, req: any, res: any, next: any) => {
  res.status(500).send({ error: err });
};

app.use(jsonErrorHandler);

app.listen(port, () => {
  console.log(`Better Auth app listening on port ${port}`);
});

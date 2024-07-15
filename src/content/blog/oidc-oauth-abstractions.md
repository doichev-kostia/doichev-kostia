---
title: "OIDC and OAuth in JS"
summary: "Using runtime independent OpenID connect and OAuth2 abstraction for authentication and authorization in JavaScript."
publishTime: "2024-07-15"
minutesToRead: 7
---

Using OpenID connect and OAuth was always painful for me as every vendor had their own sdk you needed to install,
different interface that you were required to consume and due to the nature of JS, they had very different runtime
support options.
Some were only commonjs, others runtime-specific, some were supporting every option possible, etc.

After discovering [SST Auth](https://docs.sst.dev/auth) I fell in love with their module.
It was so simple, abstractions are clear, they didn't have to install a bunch of sdks to make it work.

So, I decided to write my own implementation of it using [oauth4webapi](https://github.com/panva/oauth4webapi) package
that managed all the communication with the authorization server.

With `OIDC` and `OAuth` primitives you can use any vendor you like.

I can provide 2 examples:

Google:

```ts
import * as oauth from "oauth4webapi";
import { OIDC } from "./oidc.js";
import type { AuthClient } from "./auth.js";

type GoogleOptions = {
  clientID: string;
  clientSecret: string
  // https://developers.google.com/identity/protocols/oauth2/scopes
  scope: string;
  redirectURI?: string;
  accessType?: "offline" | "online"
};
// https://developers.google.com/identity/protocols/oauth2/web-server
const issuer = new URL("https://accounts.google.com");
// https://accounts.google.com/.well-known/openid-configuration
const authzServer = {
  issuer: issuer.toString(),
  authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  token_endpoint: "https://oauth2.googleapis.com/token",
  userinfo_endpoint: "https://openidconnect.googleapis.com/v1/userinfo",
  revocation_endpoint: "https://oauth2.googleapis.com/revoke",
  // ...
} satisfies oauth.AuthorizationServer;

export function Google(options: GoogleOptions): AuthClient {

  const params: Record<string, string> = {};

  if (options.accessType) {
    params.access_type = options.accessType;
  }

  return OIDC({
    authorizationServer: authzServer,
    redirectURI: options.redirectURI,
    clientSecret: options.clientSecret,
    clientID: options.clientID,
    scope: options.scope,
    params,
  });
}
```


GitHub:

```ts
import * as oauth from "oauth4webapi";
import { OAuth } from "./oauth.js";
import type { AuthClient } from "./auth.js";

type GitHubOptions = {
  clientID: string;
  clientSecret: string
  // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps
  scope: string;
  redirectURI?: string;
}

const issuer = new URL("https://github.com");
const authzServer = {
  issuer: issuer.toString(),
  // https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
  authorization_endpoint: "https://github.com/login/oauth/authorize",
  token_endpoint: "https://github.com/login/oauth/access_token",
} satisfies oauth.AuthorizationServer;

export function GitHub(options: GitHubOptions): AuthClient {
  return OAuth({
    authorizationServer: authzServer,
    redirectURI: options.redirectURI,
    clientSecret: options.clientSecret,
    clientID: options.clientID,
    scope: options.scope,
  });
}
```


And the usage is pretty simple:

```ts
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { pipe } from "remeda";
import { base64ToString, stringToBase64 } from "uint8array-extras";
import * as auth from "./auth/index.js"; // all the authentication constructs

const seconds = {
  minute: 60,
  hour: 60 * 60,
};

const address = new URL("http://localhost:3000");
const GOOGLE_CALLBACK = new URL("/auth/google/callback", address);

// for authentication
const authn = {
  google: auth.Google({
    clientID: config.oauth.google.clientID,
    clientSecret: config.oauth.google.secret,
    scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    redirectURI: GOOGLE_CALLBACK.toString(),
  }),
};

const app = new Hono();

app.get("/auth/google/authorize", async c => {
  const { state, url } = await authn.google.authorize();

  const value = pipe(state, JSON.stringify, stringToBase64);
  setCookie(c, "state", value, {
    maxAge: 10 * seconds.minute,
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  return c.redirect(url.toString());
});

app.get("/auth/google/callback", async c => {
  const cookie = getCookie(c, "state");
  if (!cookie) {
    return c.json({ message: "No state" }, { status: 400 });
  }
  const state = pipe(cookie, base64ToString, JSON.parse);
  const result = await authn.google.callback(new URL(c.req.url), state, GOOGLE_CALLBACK.toString());

  // do something with the tokens

  return c.redirect("/");
});
```

You can see the source code at https://github.com/doichev-kostia/oidc-auth

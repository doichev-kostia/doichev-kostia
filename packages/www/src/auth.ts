import { createClient } from "@openauthjs/openauth/client";
import type { APIContext } from "astro";

export { subjects } from "@doichev-kostia/core/actor";

export const callbackPath = "/auth/callback";

export function callbackURL(origin: string) {
	return new URL(callbackPath, origin);
}

export const client = createClient({
	clientID: "astro",
	issuer: "http://localhost:3000",
});

export function setTokens(ctx: APIContext, access: string, refresh: string) {
	ctx.cookies.set("refresh_token", refresh, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 34560000,
	});
	ctx.cookies.set("access_token", access, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 34560000,
	});
}

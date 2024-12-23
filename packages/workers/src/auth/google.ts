import ky from "ky";
import { z } from "zod";

export module GoogleApi {
	export const UserInfo = z.object({
		sub: z.string(),
		name: z.string(),
		given_name: z.string(),
		family_name: z.string().nullish(),
		picture: z.string().nullish(),
		email: z.string(),
		email_verified: z.boolean(),
	});

	export async function getUserInfo(accessToken: string) {
		const response = await ky.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
			headers: {
				Authorization: `Bearer ${accessToken}`
			},
		});

		const data = await response.json();

		return UserInfo.parse(data);
	}

	export const TokenInfo = z.object({
		/**
		 * The application that is the intended user of the access token.
		 */
		aud: z.string(),

		/**
		 * A space-delimited list of  scopes that the user granted access to.
		 */
		scope: z.string(),

		/**
		 * The datetime when the token becomes invalid.
		 */
		exp: z.string(),

		expires_in: z.string(),

		/**
		 * An identifier for the user, unique among all Google accounts and never
		 * reused. A Google account can have multiple emails at different points in
		 * time, but the sub value is never changed. Use sub within your application
		 * as the unique-identifier key for the user.
		 */
		sub: z.string(),

		/**
		 * The client_id of the authorized presenter. This claim is only needed when
		 * the party requesting the ID token is not the same as the audience of the ID
		 * token. This may be the case at Google for hybrid apps where a web
		 * application and Android app have a different client_id but share the same
		 * project.
		 */
		azp: z.string().optional(),

		/**
		 * Indicates whether your application can refresh access tokens
		 * when the user is not present at the browser. Valid parameter values are
		 * 'online', which is the default value, and 'offline'. Set the value to
		 * 'offline' if your application needs to refresh access tokens when the user
		 * is not present at the browser. This value instructs the Google
		 * authorization server to return a refresh token and an access token the
		 * first time that your application exchanges an authorization code for
		 * tokens.
		 */
		access_type: z.string().optional(),

		/**
		 * The user's email address. This value may not be unique to this user and
		 * is not suitable for use as a primary key. Provided only if your scope
		 * included the email scope value.
		 */
		email: z.string().optional(),

		/**
		 * True if the user's e-mail address has been verified; otherwise false.
		 */
		email_verified: z.enum(["true", "false"])
	});

	export async function getTokenInfo(accessToken: string) {
		const response = await ky.get("https://oauth2.googleapis.com/tokeninfo", {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		const data = await response.json();

		return TokenInfo.parse(data);
	}
}

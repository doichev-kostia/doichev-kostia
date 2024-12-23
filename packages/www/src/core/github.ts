import { decodeHex } from "@std/encoding";
import { z } from "zod";

export module GitHub {

	// TODO:
	// - fetch the file https://smee.io/ https://docs.github.com/en/webhooks/webhook-events-and-payloads#push
	// - parse the file
	// - filter out "private" parts
	// - convert to html
	// - store in sqlite DB
	//
	//

	const encoder = new TextEncoder();
	export async function verifyPayload(payload: string, secret: string, signature: string): Promise<boolean> {
		let algorithm = { name: "HMAC", hash: { name: 'SHA-256' } };

		let keyBytes = encoder.encode(secret);
		let extractable = false;
		let key = await crypto.subtle.importKey(
			"raw",
			keyBytes,
			algorithm,
			extractable,
			["sign", "verify"],
		);

		let signatureBytes = decodeHex(signature);
		let payloadBytes = encoder.encode(payload);

		let equal = await crypto.subtle.verify(
			algorithm.name,
			key,
			signatureBytes,
			payloadBytes,
		);

		return equal;
	}

	export const Commit = z.object({
		id: z.string(),
		message: z.string(),
		added: z.string().describe("An array of files added in the commit. A maximum of 3000 changed files will be reported per commit."),
		modified: z.string().describe("An array of files modified by the commit. A maximum of 3000 changed files will be reported per commit."),
		removed: z.string().describe("An array of files removed in the commit. A maximum of 3000 changed files will be reported per commit."),
		timestamp: z.string().describe("The ISO 8601 timestamp of the commit."),
	});

	export const Events = {
		// https://docs.github.com/en/webhooks/webhook-events-and-payloads#push
		// There are not all the available properties
		push: z.object({
			after: z.string().describe("The SHA of the most recent commit on ref after the push."),
			ref: z.string().describe("The full git ref that was pushed. Example: refs/heads/main or refs/tags/v3.14.1."),
			before: z.string().describe("The SHA of the most recent commit on ref before the push."),
			repository: z.string().describe("A git repository in format <owner>/<repo>"), // TODO
			commits: z.array(Commit),
		})
	}
}

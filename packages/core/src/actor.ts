import { createSubjects } from "@openauthjs/openauth";
import { z } from "zod"

export const subjects = createSubjects({
	account: z.object({
		sub: z.string(),
	}),
});


export function isAdmin(googleSub: string) {
	// TODO: assert that the expected ID is present
	return googleSub === "";
}

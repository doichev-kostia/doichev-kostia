import type { SubjectPayload } from "@openauthjs/openauth/session"
import { subjects } from "./auth";

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {
		subject?: SubjectPayload<typeof subjects>
	}
}

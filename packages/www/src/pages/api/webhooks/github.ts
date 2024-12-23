import { ApiError } from "~/lib/error";
import { fmt } from "~/lib/fmt";
import { ApiHandler } from "~/lib/handler";
import { Resource } from "sst";
import { GitHub } from "~/core/github";
import { logger } from "~/lib/logger";

export const POST = ApiHandler(async function githubWebhook({ request }) {
	logger().info(fmt.Sprintf("received event %s from webhook %s", request.headers.get("X-GitHub-Delivery"), request.headers.get("X-GitHub-Hook-ID")));

	if (!request.headers.get("User-Agent")?.startsWith("GitHub-Hookshot/")) {
		return new ApiError("INVALID_ARGUMENT", "Invalid user agent");
	}

	if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
		return new ApiError("INVALID_ARGUMENT", "Invalid Content-Type. Expected JSON");
	}

	const signature = request.headers.get("X-Hub-Signature-256");
	if (!signature) {
		return new ApiError("INVALID_ARGUMENT", "The github event must have a signature");
	}

	// https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
	const [prefix, hex] = signature.split("=")
	if (prefix !== "sha256") {
		return new ApiError("FAILED_PRECONDITION", "Expected to only handle the sha256 signaures")
	}

	if (!hex) return new ApiError("INVALID_ARGUMENT", "Invalid Signature");

	const payload = await request.text();
	let valid = await GitHub.verifyPayload(payload, Resource.KnowledgeBaseWebhookSecret.value, hex)
	if (!valid) return new ApiError("INVALID_ARGUMENT", "Invalid Signature");

	const event = request.headers.get("X-GitHub-Event");
	if (!event) {
		return new ApiError("INVALID_ARGUMENT", "The github event is not defined");
	}

	if (event !== "push") {
		return new ApiError("FAILED_PRECONDITION", fmt.Sprintf("Unexpected event %s", event));
	}

	const validation = GitHub.Events.push.safeParse(JSON.parse(payload))

	if (!validation.success) {
		return ApiError.fromZodError(validation.error);
	}

	if (validation.data.ref !== "refs/heads/master") {
		logger().info(`[GitHub Webhook] Skipping the event for non "master" branch`);
		return new Response(null, { status: 204 });
	}

	// TODO:
	// push the job to a queue
	return new Response("ok");
});

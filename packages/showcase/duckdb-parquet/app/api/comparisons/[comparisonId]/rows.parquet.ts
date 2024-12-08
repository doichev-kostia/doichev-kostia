import type { Route } from "./+types/rows.parquet";
import { ServerComparison } from "~/core/comparison/server";
import { Bucket } from "~/bucket";

export async function loader({ params }: Route.LoaderArgs) {
	const comparison = await ServerComparison.get(params.comparisonId);

	if (!comparison) return new Response("Not Found", { status: 404 });

	const bucketObject = await Bucket().get(comparison.comparisonFileObject);

	if (bucketObject === null) {
		return new Response("Object Not Found", { status: 404 });
	}

	const headers = new Headers();
	try {
		bucketObject.writeHttpMetadata(headers)
	} catch (error) {
		/**
		 * {@link https://github.com/cloudflare/workers-sdk/issues/6047 | in dev mode the r2 can't write metadata into the native Headers object}
		 */
		for (const [header, value] of Object.entries(bucketObject.httpMetadata ?? {})) {
			let v = typeof value === "string" ? value : value instanceof Date ? value.toISOString() : "";
			headers.set(header, v);
		}
	}
	headers.set("etag", bucketObject.httpEtag);

	// TODO: caching?

	return new Response(bucketObject.body, {
		headers,
	});
}

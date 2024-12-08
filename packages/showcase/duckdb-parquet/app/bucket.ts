import { createContext } from "~/lib/context";

export const BucketContext = createContext<CloudflareEnvironment["dump"]>("Bucket")

export function Bucket() {
	return BucketContext.mustUse();
}

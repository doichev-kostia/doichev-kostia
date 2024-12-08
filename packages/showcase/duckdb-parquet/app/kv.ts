import { createContext } from "./lib/context";

export const KvContext = createContext<CloudflareEnvironment["kv"]>("KV");

export function KV() {
	return KvContext.mustUse();
}


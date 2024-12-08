import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("pages/home/page.tsx"),
	route("/comparisons/:comparisonId", "pages/comparisons/[comparisonId]/page.tsx"),
	route("/api/comparisons/:comparisonId/rows.parquet", "api/comparisons/[comparisonId]/rows.parquet.ts"),
] satisfies RouteConfig;

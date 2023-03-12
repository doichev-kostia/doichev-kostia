/** @type {import("tailwindcss").Config} */
module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	theme: {
		extend: {
			colors: {
				primary: `hsl(var(--primary-color)/var(--tw-bg-opacity))`,
				"primary-focused": `hsl(var(--primary-focused)/var(--tw-bg-opacity))`,
			},
			backgroundColor: {
				primary: `hsl(var(--primary-color)/var(--tw-bg-opacity))`,
				"primary-focused": `hsl(var(--primary-focused)/var(--tw-bg-opacity))`,
			},
		},
	},
	plugins: [],
};

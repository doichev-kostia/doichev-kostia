import rss from '@astrojs/rss';
import { getCollection } from "astro:content";
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

const sortByDate = (a, b) => {
	return new Date(b.data.publishTime) - new Date(a.data.publishTime);
};
export async function GET(context) {
	const posts = await getCollection('blog');
	posts.sort(sortByDate);

	return rss({
		title: "Doichev Kostia's Blog",
		description: "Doichev Kostia's blog about web development, programming, and other stuff",
		site: context.site,
		items: posts.map(p => ({
			title: p.data.title,
			pubDate: p.data.publishTime,
			description: p.data.summary,
			link: `/blog/${p.id}`,
			content: sanitizeHtml(parser.render(p.body), {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])
			}),
		})),
		customData: `<language>en-us</language>`,
	});
}

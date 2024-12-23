# Context
I want to have one place to store all my notes. Currently, they are scattered around different places like Obsidian, Apple notes, telegram, etc.

The important features are:
- offline access
- access management

I already store my notes in a private github repo as markdown files. I can just use `Zed` instead of Obsidian for editing on desktop and set-up a cron job that commits and pushes to github.
Then I can set-up a GitHub webhook that will trigger the re-build of the astro pages.

For mobile it's a bit more challenging. The most fun approach would be to create my own swift ios app that will pull from GitHub, I will update the content and then commit, push.

The pipeline is the following:
content in mardown -> convert only public sections to HTML -> sanitize HTML -> re-build the site

Maybe in the future I will expose the private sections based on the auth cookie 

### Access management

The only account that has any edit permissions is me. Everyone else - read-only. 

All the notes' content is private by default, unless I wrap it in
```
<!-- public:start -->
some content
<!-- public:end -->
```
block or something like that.

I can also add a frontmatter with status: "public" or something like that

### Styling

I want to preserve the visual parts of markdown. Do similar styling to the Planetscale or like I see the content in zed

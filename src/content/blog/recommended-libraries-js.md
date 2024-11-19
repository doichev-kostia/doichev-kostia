---
title: "Recommended libraries for JavaScript development"
summary: "The list of libraries and tools in JS ecosystem I find well-designed and nice to use"
publishTime: "2024-07-01"
minutesToRead: 5
---

## Intro

JavaScript ecosystem is big mess. We have many runtimes, bunch of frameworks and loads of tools for testing, linting, formating, building - you name it.
Due to the lack of alignment in community and people coming from all walks of life we have all this chaos.
On one side, we have committees that take forever to decide whether to add
the [pipe](https://github.com/tc39/proposal-pipeline-operator/blob/main/HISTORY.md) operator or not.
On the other hand, we're drowning in runtimes with their own quirks and incompatible APIs.

Oh, and don't get me started on CJS/ESM, TypeScript decorators and module resolutions.

Therefore, I want to have a list of libraries and tools that I like and I think are well-designed.
With time I will re-visit this list and re-evaluate the items.

### Building

- [esbuild](https://github.com/evanw/esbuild) - a bundler written in Go that is incredibly fast and nice to work with.
  The only issue I had with it is that it doesn't support TypeScript decorators, but decorators are the mystery box on
  itself
- [vite](https://github.com/vitejs/vite) - an engine powering almost every front-end framework now, (sorry, Remix,
  SvelteKit, SolidStart and others are still FE frameworks for me). Very simple to configure and has a bunch of plugins

### Project maintenance

- [pnpm](https://github.com/pnpm/pnpm) - very fast, efficient package manager. It's constantly improving and has a great workspaces support
- [turborepo](https://github.com/vercel/turbo) - very small abstraction on top of pnpm workspaces that runs the
  pipelines and handles caching

### TypeScript

- [@total-typescript/ts-reset](https://github.com/total-typescript/ts-reset) - fixes strange TS defaults.
  Matt Pocock - a TypeScript wizard
- [tsx](https://github.com/privatenumber/tsx) - allows to execute typescript files by transpiling them on-the-fly.
  Powered by esbuild

### Auth

- [oauth4webapi](https://github.com/panva/oauth4webapi) - a very simple abstraction that allows to integrate with
  OIDC/OAuth providers. See [example](https://github.com/doichev-kostia/oidc-auth)
- [jose](https://github.com/panva/jose) - the toolbox to work with JSON Web Tokens

### DB

- [drizzle](https://github.com/drizzle-team/drizzle-orm) - the best ORM I've ever worked with
- [kysely](https://github.com/kysely-org/kysely) - a type-powered query builder. A little side story - I've been working
  on an old node.js project with TypeORM. The moment I needed to do something more complicated than a simple select
  query the whole world would collapse. I hated the experience very much until I discovered kysely. From then on,
  writing queries was a bliss. 
  Moreover, I found out about AsyncLocalStorage and could use transaction hooks that I described in my
  other blog post - [Context in Node.js](/context-in-nodejs)

### Utility

- [remeda](https://github.com/remeda/remeda) - very powerful library with data-first and data-last principles, lazy
  evaluation and first-class TypeScript support.
- [ts-pattern](https://github.com/gvergnaud/ts-pattern) - pattern matching as switch/case is horrible in JS
- [pino](https://github.com/pinojs/pino) - great logger
- [nanoid](https://github.com/ai/nanoid) - great URL safe id generator especially in combination with ideas from unkey.dev article - [The UX of UUIDs](https://www.unkey.com/blog/uuid-ux)
- [@std/ulid](https://jsr.io/@std/ulid) - ULID from Deno stdlib that works in any popular JS runtime
- [@std/assert](https://jsr.io/@std/assert) - assertions

### Validation

- [zod](https://github.com/colinhacks/zod) - validation library with great type inference

### Styling

- [tailwind](https://github.com/tailwindlabs/tailwindcss) - the idea of utility classes revolutionized the way I write
  styles. I didn't like CSS with "descriptive" class names, this caused enormous clusterfuck of styles all over the
  place and I was scared to change anything in that class as it could affect something in entirely unrelated part of the
  project. I love tailwind and enjoy my purchase of [TailwindUI](https://tailwindui.com/)
- [cva](https://github.com/joe-bell/cva) - composes styles depending on the js properties of the Component.

### Testing

- [msw](https://github.com/mswjs/msw) - even though I didn't use it that much, I really loved the experience and I like
  the amazing author behind this project.
- [vitest](https://github.com/vitest-dev/vitest) - still slowly moving towards it. Some projects I work on are still on
  mocha or jest, and vitest
  compared to that is absolutely amazing.
- [playwright](https://github.com/microsoft/playwright) - great framework for e2e testing, loved it



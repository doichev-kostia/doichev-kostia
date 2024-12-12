---
title: "Common utils I have in my TypeScript projects"
summary: "Over the years I found some things I like having in almost all of my TypeScript projects and I would like to share them here"
publishTime: "2024-11-19"
minutesToRead: 6
---

## Formatting

`lib/fmt.ts`

```typescript
/* https://jsr.io/@std/fmt */
import { sprintf } from "@std/fmt/printf";

export module fmt {
  export function Sprintf(pattern: string, ...args: unknown[]): string {
    return sprintf(pattern, ...args);
  }

  export function Errorf(pattern: string, ...args: unknown[]): Error {
    return new Error(Sprintf(pattern, args));
  }
}
```

String interpolation is a very powerful feature. However, I sometimes find it too difficult to read.
Imagine formatting a year range like `yyyy - yyyy`. When accessing those year values from some objects it can become a
nightmare like

```typescript
const yearRange = `${vehicle.yearFrom.year} - ${vehicle.yearTo.year}`
```

There are so many characters in this interpolation so I start missing the pattern. Compare it to

```typescript
const yearRange = fmt.Sprintf("%s - %s", vehicle.yearFrom.year, vehicle.yearTo.year);
```

I immediately see the pattern and then the values applied.

## Fn

`lib/fn.ts`

```typescript
import { ZodSchema, z } from "zod";

/**
 * Enforce runtime type check
 */
export function fn<
  Arg1 extends ZodSchema,
  Callback extends (arg1: z.output<Arg1>) => any,
>(arg1: Arg1, cb: Callback) {
  const result = function(input: z.input<typeof arg1>): ReturnType<Callback> {
    const parsed = arg1.parse(input);
    return cb.apply(cb, [parsed as any]);
  };
  result.schema = arg1;
  return result;
}
```

Example

```typescript
export const LoadCommand = fn(z.object({
  logger: z.custom<Logger>(),
  db: z.custom<BunSQLiteDatabase<any>>(),
  kv: z.custom<KV>(),
}), async (input) => {
  const { kv, db, logger } = input;
  /* ... */
});
```

This is something I took from [sst.dev](https://sst.dev/).
Not only do you have the TypeScript linting for the types, but also the actual type validation in runtime.

## ID

`lib/id.ts`

```typescript
/* https://jsr.io/@std/ulid */
import { ulid } from "@std/ulid";
import { fmt } from "./fmt.ts";

const prefixes = {
  vehicle: "vhc",
  engine: "eng",
} as const;

export function createId(prefix: keyof typeof prefixes): string {
  return fmt.Sprintf("%s_%s", prefixes[prefix], ulid());
}
```

Heavily inspired by Stripe and an [article](https://www.unkey.com/blog/uuid-ux) from [Unkey](https://www.unkey.com/).
This allows for creating branded sortable IDs that really improve the navigation and debugging when it comes to data

```typescript
const vehicle = {
  id: createId("vehicle") // vhc_01JCGQD6T5YKEJFS5XHBP5G0A2
};
```

## Context

`lib/context.ts`

```typescript
import { AsyncLocalStorage } from "node:async_hooks";
import { err, ok, Result } from "neverthrow";

class ErrContextUnavailable extends Error {
  constructor() {
    super("Requested local storage context is unavailable");
    this.message = "ErrContextUnavailable";
  }
}

export function createContext<T>() {
  const storage = new AsyncLocalStorage<T>();
  return {
    use(): Result<T, ErrContextUnavailable> {
      const result = storage.getStore();
      if (result) {
        return ok(result);
      } else {
        return err(new ErrContextUnavailable());
      }
    },
    /** @throws {ErrContextUnavailable} */
    mustUse(): T {
      const result = this.use();
      if (result.isErr()) {
        throw result._unsafeUnwrapErr();
      } else {
        return result._unsafeUnwrap();
      }
    },
    with<R>(value: T, fn: () => R) {
      return storage.run<R>(value, fn);
    },
  };
}
```

For more details see my [article](/blog/context-in-nodejs) about Context. Also heavily inspired
by [sst.dev](https://sst.dev/)

## DB Schema with Drizzle

`db/schema.ts`

```typescript
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const ULID_SIZE = 24;
export const PREFIX_SIZE = 10;

export const brandedID = (name: string) => text(name, { length: ULID_SIZE + PREFIX_SIZE });

export const id = {
  get id() {
    return brandedID("id").primaryKey().notNull();
  },
};

export const timestamps = {
  get createTime() {
    return text("create_time").notNull().$defaultFn(() => new Date().toISOString());
  },
  get updateTime() {
    return text("update_time").notNull().$defaultFn(() => new Date().toISOString()).$onUpdateFn(() => new Date().toISOString());
  },
};

export const vehiclesTable = sqliteTable("vehicles", {
  ...id,
  ...timestamps,
  name: text("name").notNull(),
});
```

Usage of the branded ID and timestamp naming convention


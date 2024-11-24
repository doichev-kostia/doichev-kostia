---
title: "Context in Node.js"
summary: "How to use AsyncLocalStorage as a context provider"
publishTime: "2024-04-11"
minutesToRead: 4
---

I was reading the [codebase](https://github.com/sst/console) of [SST](https://sst.dev/) console and then I saw the following
```ts
export function list() {
  return useTransaction((tx) =>
    tx.select().from(user).where(eq(user.workspaceID, useWorkspace())).execute()
  );
}
```

the `useTransaction` function caught my attention. It was always so painful to work with transactions in nested functions as you have to pass the db/transaction instance to every function call.
It felt like prop drilling problem in React. However, in React you could use Context and then get whatever data you need.
But node.js is not react, and I never found any "context" functionality there.


I decided to take a look at the implementation of the `useTransaction`
```ts
export async function useTransaction<T>(callback: (trx: TxOrDb) => Promise<T>) {
  try {
    const { tx } = TransactionContext.use();
    return callback(tx);
  } catch {
    return callback(db);
  }
}
```
Ha, here is the `TransactionContext`, but what is this context?
I started diving deeper and I found that sst uses AsyncLocalStorage from "node:async_hooks". 


After exploring the AsyncLocalStorage API a bit I decided to implement a similar context concept, which is basically the following:
```ts
import { AsyncLocalStorage } from "node:async_hooks";

const ErrorCode = Symbol('ContextError');

export class ContextNotFoundError extends Error {
	readonly code = ErrorCode;

	constructor(public name: string) {
		super(`${name} context was not provided.`);
	}
}

export type Context<T> = ReturnType<typeof create<T>>;

export function create<T>(name: string) {
	const storage = new AsyncLocalStorage<T>();

	const ctx = {
		name,
		with<Result>(value: T, cb: (value: T) => Result) {
			return storage.run(value, () => {
				return cb(value);
			});
		},
		use(): [T, null] | [null, ContextNotFoundError] {
			const result = storage.getStore();
			if (result === undefined) {
				return [null, new ContextNotFoundError(name)]
			} else {
				return [result, null];
			}
		},
	};
	return ctx;
}

export const Context = {
	create,
};
```

and then in my `transaction.ts` file, I have
```ts
import { type Kysely, type Transaction } from "kysely";
import type { Database } from "./types.js";
import { Context } from "../context-1.js";
import { db } from "./db.js";

export type TxOrDb = Transaction<Database> | Kysely<Database>;

const TransactionContext = Context.create<{
	tx: TxOrDb;
}>("TransactionContext");

export async function useTransaction<T>(callback: (trx: TxOrDb) => Promise<T>) {
	const [ctx, error] = TransactionContext.use();

	if (error) {
		return callback(db);
	} else {
		return callback(ctx.tx);
	}
}

export async function createTransaction<T>(callback: (tx: TxOrDb) => Promise<T>) {
	const [ctx, error] = TransactionContext.use();

	if (ctx) {
		return callback(ctx.tx);
	} else {
		return db
			.transaction()
			.execute(async tx => {
				return await TransactionContext.with({tx}, () => {
					return callback(tx);
				});
			});
	}
}
```

and that's it, the pain is gone. Because of those few lines of code, I can now do something like

```ts
import type { Selectable } from "kysely";
import type { User } from "./types.js";
import { createTransaction, useTransaction } from "./transaction.js";

type InsertUserData = {
	firstName: string;
}

async function insert(data: InsertUserData): Promise<[Selectable<User>, null] | [null, Error]> {
	try {
		const result = await createTransaction(async tx => {
			const user = await tx
				.insertInto("user")
				.values({
					firstName: data.firstName
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			return user;
		});

		return [result, null]
	} catch (error) {
		return [null, error];
	}
}


async function retrieve(id: string): Promise<[Selectable<User>, null] | [null, Error]> {
	try {
		const result = await useTransaction(async tx => {
			const user = await tx
				.selectFrom("user")
				.selectAll()
				.where("id", "=", id)
				.executeTakeFirstOrThrow();

			return user;
		});

		return [result, null]
	} catch (error) {
		return [null, error];
	}
}

export const UserRepository = {
	insert,
	retrieve
}
```

And re-use my repository functions everywhere I want. In case there is a transaction I will execute the query in it, otherwise - fallback to the default db connection.

After playing around a bit more I came up with another example.

I can use Context to be able to call some utility functions, like "prompt" when building a CLI application.

Imagine the following:
```ts
import { program } from "commander";
import { password } from "@inquirer/prompts";
import { CliProvider, useCli } from "./context.js";
import { decrypt, encrypt } from "./crypto.js";

program
	.command("encrypt")
	.argument("<value>")
	.action(async (value: string) => {
		const cli = useCli();

		const passphrase = await cli.prompt(password, {
			message: "Enter the passphrase",
			mask: true
		});

		const [encrypted, err] = encrypt(value, passphrase);

		if (err) {
			console.error("Failed to encrypt", err);
		} else {
			console.info(encrypted);
		}
	});

program
	.command("decrypt")
	.argument("<value>")
	.action(async (value) => {
		const cli = useCli();

		const passphrase = await cli.prompt(password, {
			message: "Enter the passphrase",
			mask: true
		});

		const [decrypted, err] = decrypt(value, passphrase);

		if (err) {
			console.error("Failed to decrypt", err);
		} else {
			console.info(decrypted);
		}
	});


CliProvider(() => {
	program.parse();
});
```

```
$ node --import=tsx ./src/cli/main.ts encrypt "foo"
? Enter the passphrase ******
aes-256-gcm,G9SU,fwt1Gm/wOUYcJgJT,02NHjqjuap3jxrvycKfFrg==,bmCUPoN1PNM4JX4bPLBLzg==

$ node --import=tsx ./src/cli/main.ts decrypt "aes-256-gcm,G9SU,fwt1Gm/wOUYcJgJT,02NHjqjuap3jxrvycKfFrg==,bmCUPoN1PNM4JX4bPLBLzg=="
? Enter the passphrase ******
foo
```

This context here is built similarly to the way we do it in Solid or React


context.ts
```ts
import { createContext, use, wrap } from "../context-2.js";
import { type Cli, prompt } from "./cli.js";

export const CliContext = createContext<Cli>("CLI");

export function useCli() {
	return use(CliContext)
}

export function CliProvider(cb: (v: Cli) => any) {
	const cli: Cli = {
		prompt,
	}

	wrap(CliContext, cli, cb);
}
```


In conclusion, I think that the idea of Context is very powerful and can be used in many different ways.
It can be used to provide a database connection, a logger, a CLI, or anything else that you need to access from different parts of your application.
I hope that this article has given you some ideas on how you can leverage the AsyncLocalStorage and the Context in your own applications.

All the code snippets are in https://github.com/doichev-kostia/nodejs-context

---
title: "JavaScript Async Iterators"
summary: "Using Async Iterators to traverse paginated responses"
publishTime: "2024-07-15" 
minutesToRead: 7
---

Any decent API has some kind of pagination, it can be cursor based, page based or any other implementation.
Now, imagine you need to process all the records that some response can return, what's the most annoying part about it?
Pagination. You now have to write some kind of a loop that handles pages, properly increments them,
exits when there are no more records left, etc.

The more similar tasks you perform, the more related pieces you would fine. They start to form a ... pattern.
Hmm, if only there was a design pattern that could abstract all that traversal.

Well, the smart guys already named it - "Iterator Pattern". Ideally it should look like this:
```ts
async function listItems(...args) {
  const response = await fetch();
  // ...
}

const iterable = toIterable(({page}) => listItems({total, perPage, page}), {
		initialPage: 1,
		getNextPage: (lastResponse, page) => {
			const nextPage = page + 1;
			if (nextPage * perPage <= lastResponse.count) {
				return nextPage;
			} else {
				return null;
			}
		}
	});

	for await (const response of iterable) {
    // ...
	}
```

Now, in JavaScript due to the coloring ([article](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/))
we have [Synchronous](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators) and [Asynchronous](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) iterators. 
![JavaScript function coloring](assets/async-colored-functions.png)


So, how would you create an iterable out of a paginated response? Well, let's start coding.
The interface should be like this
```ts
type Options = {
  initialPage: unknown;
  getNextPage: Function;
}

function toIterable(func: Function, options: Options): AsyncIterator {
}
```
No worries, we will add the generic magic in the end, so you can enjoy your Language Server completions.

Thus, let's decide what the `getNextPage` function is. Well, the iterator needs to know when to stop, right? 
The user should pass some kind of a predicate whether we continue or break and, ideally, we should also know how to fetch the next page.
Therefore, the type of the `getNextPage` function would be something like:
```ts
// let's pretend that the page is a number for now
type GetNextPage = (lastResponse: Response, lastPage: number) => number | undefined | null;
```
My hands are already itching to add generics, but let's wait.

Next, let's figure out the `toIterable` function. It should satisfy the `AsyncIterator` interface,
and the simplest way to do that is to use `AsyncGenerator`;

```ts
type GetNextPage = (lastResponse: Response, lastPage: unknown) => unknown | undefined | null;

type Options = {
  initialPage: unknown;
  getNextPage: GetNextPage;
}

type PaginationOptions = {
  page: unknown;
}

type IterableFunction = (pagination: PaginationOptions) => Promise<any>;

async function* toIterable(func: IterableFunction, options: Options) {
  let page = options.initialPage;
  while(true) {
    const response = await func({ page });
    const nextPage = options.getNextPage(response, page);

    yield response;

    if (nextPage == null) {
      break;
    } else {
      page = nextPage;
    }
  }
}
```

I think the code above it pretty clear.

There is one more thing missing, our iterator should adapt to the different pagination types, so let's add some generics.
```ts
export type GetNextPage<Res, Page> = (lastResponse: Res, lastPage: Page) => Page | null | undefined;

export type IterableOptions<Page, Res> = {
	initialPage: Page;
	getNextPage: GetNextPage<Res, Page>
}

export type PaginationOptions<Page> = {
	page: Page;
}
export type IterableFunction<Page> = (pagination: PaginationOptions<Page>) => Promise<any>

export async function* toIterable<Page, Func extends IterableFunction<Page>, Res = Awaited<ReturnType<Func>>>(func: Func, options: IterableOptions<Page, Res>): AsyncGenerator<Res> {
	let page = options.initialPage;
	while (true) {
		const response = await func({page});
		const nextPage = options.getNextPage(response, page);

		yield response;

		if (nextPage == null) {
			break;
		} else {
			page = nextPage;
		}
	}
}
```

Ooof, looks kinda scary, but it's the necessary evil in case you want some nice autocomplete suggestions from your IDE.

You can find the source and tests in
https://github.com/doichev-kostia/js-paginated-response-iterator




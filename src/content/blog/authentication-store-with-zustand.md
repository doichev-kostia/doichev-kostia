---
title: "Authentication store with zustand"
image: '/blog/auth-store-zustand/bear.jpg'
imageSource: 'https://github.com/pmndrs/zustand/blob/2b29d736841dc7b3fd7dec8cbfea50fee7295974/bear.jpg'
publishedAt: "2023-03-12"
---

## Storage

Authentication management was quite an interesting task for me, especially for SPAs.
The app I was working on was taking the access and refresh tokens from response headers and saving them in cookies.
Also, we had a legacy redux store and the app was migrating to react query.

Overall, we had many places with auth data and nothing was normalized. The problem with Cookies storage is that you can't really subscribe to their changes, so parts of the app were not up to date.

The ideal solution for me was to have persistent storage (Cookies) and in-app storage that we could subscribe to from regular typescript and React components.

Zustand seemed a perfect choice, as it has vanilla storage and, additionally, we can reuse it for react components with hooks.

So, let's start with simple storage:

```typescript
// auth-store.ts
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import jwtDecode from 'jwt-decode';

type AuthStore = {
	accessToken: string | undefined;
	refreshToken: string | undefined;
}

const authStore = createStore<AuthStore>()(
	devtools(
		(set, get) => ({
			accessToken: undefined,
			refreshToken: undefined,
		}),
		{
			name: 'auth-store',
			enabled: !import.meta.env.PROD,
		}
	)
);

```

But what about the data stored in the access token? Some important information like userId or role is stored in the token.
We can perfectly use it in the app.

```typescript
// auth-store.ts
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { z } from "zod";

const roles = z.enum(['admin', 'user']);

type Role = z.infer<typeof roles>;

const TokenDataSchema = z.object({
	userId: z.string(),
	roles,
})

type TokenData = z.infer<typeof TokenDataSchema>;

type AuthStore = {
	accessToken: string | undefined;
	accessTokenData: TokenData | undefined;
	refreshToken: string | undefined;
}

const authStore = createStore<AuthStore>()(
	devtools(
		(set, get) => ({
			accessToken: undefined,
			accessTokenData: undefined,
			refreshToken: undefined,
		}),
		{
			name: 'auth-store',
			enabled: !import.meta.env.PROD,
		}
	)
);
```

Why should we set the access token data from the beginning? Simply because it's more efficient,
why decode the access token on every getter, if we can do this once we set the token.

## Actions

```typescript
// auth-store.ts
import {createStore} from 'zustand/vanilla';
import {useStore} from 'zustand';
import {devtools} from 'zustand/middleware';
import {z} from "zod";

const roles = z.enum(['admin', 'user']);

type Role = z.infer<typeof roles>;

const TokenDataSchema = z.object({
	userId: z.string(),
	roles,
})

type TokenData = z.infer<typeof TokenDataSchema>;


type AuthStore = {
	accessToken: string | undefined;
	accessTokenData: TokenData | undefined;
	refreshToken: string | undefined;

	actions: {
		setAccessToken: (accessToken: string | undefined) => void;
		setRefreshToken: (refreshToken: string | undefined) => void;
		// set tokens on the app start
		init: () => void;
		clearTokens: () => void;
	}
}

export const decodeAccessToken = (accessToken: string) => TokenDataSchema.parse(jwtDecode<TokenData>(accessToken));

const authStore = createStore<AuthStore>()(
	devtools(
		(set, get) => ({
			accessToken: undefined,
			accessTokenData: undefined,
			refreshToken: undefined,

			actions: {
				setAcccessToken: (accessToken: string | undefined) => {
					const accessTokenData = (() => {
						try {
							return accessToken ? decodeAccessToken(accessToken) : undefined;
						} catch (error) {
							console.error(error)
							return undefined;
						}
					})();
					set({
						accessToken,
						accessTokenData,
					});
				},
				setRefreshToken: (refreshToken: string | undefined) =>
					set({
						refreshToken,
					}),
				init: () => {
					const {setAccessToken, setRefreshToken} = get().actions;
					setAccessToken(CookieService.get(ACCESS_TOKEN_KEY));
					setRefreshToken(CookieService.get(REFRESH_TOKEN_KEY));
				},
				clearTokens: () =>
					set({
						accessToken: undefined,
						accessTokenData: undefined,
						refreshToken: undefined,
					}),
			}
		}),
		{
			name: 'auth-store',
			enabled: !import.meta.env.PROD,
		}
	)
);

```

You can read TkDodo's blog [post](https://tkdodo.eu/blog/working-with-zustand#separate-actions-from-state) about separating actions from state

Alright, the basic storage is defined. But, how to get the storage values?

## Selectors

The basic idea of selectors is to get a specific slice of the storage. Let's define them, then:

```typescript
// auth-store.ts

const authStore = createStore<AuthStore>()( /* ... */ );

/**
 * Required for zustand stores, as the lib doesn't expose this type
 */
export type ExtractState<S> = S extends {
		getState: () => infer T;
	}
	? T
	: never;

type Params<U> = Parameters<typeof useStore<typeof authStore, U>>;

// Selectors
const accessTokenSelector = (state: ExtractState<typeof authStore>) => state.accessToken;
const accessTokenDataSelector = (state: ExtractState<typeof authStore>) => state.accessTokenData;
const refreshTokenSelector = (state: ExtractState<typeof authStore>) => state.refreshToken;
const actionsSelector = (state: ExtractState<typeof authStore>) => state.actions;

// getters
export const getAccessToken = () => accessTokenSelector(authStore.getState());
export const getAccessTokenData = () => accessTokenDataSelector(authStore.getState());
export const getRefreshToken = () => refreshTokenSelector(authStore.getState());
export const getActions = () => actionsSelector(authStore.getState());

function useAuthStore<U>(selector: Params<U>[1], equalityFn?: Params<U>[2]) {
  return useStore(authStore, selector, equalityFn);
}

// Hooks
export const useAccessToken = () => useAuthStore(accessTokenSelector);
export const useAccessTokenData = () => useAuthStore(accessTokenDataSelector);
export const useRefreshToken = () => useAuthStore(refreshTokenSelector);
export const useActions = () => useAuthStore(actionsSelector);
```

As you can see we get only specific properties from the store to reduce the number of updates.
So, the update will happen only when the part we're subscribed to is changed.

## Usage

```typescript
// api.ts
import {getActions, getAccessToken} from './auth-store'
import {z} from "zod";

const {setAcccessToken, setRefreshToken} = getActions();

const signIn = async () => {
	const response = await fetch('/api/authentication/sign-in', {
		method: "POST",
		body: JSON.stringify({
			email: "test@gmail.com",
			password: "password123"
		})
	});

	const accessToken = response.headers.get('x-acess-token');
	const refreshToken = response.headers.get('x-refresh-token');
	setAccessToken(accessToken);
	setRefreshToken(refreshToken);
}

export const User = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	email: z.string(),
});

export const fetchUser = async (userId: string) => {
	const response = await fetch(`/api/users/${userId}`, {
		method: "GET",
		headers: {
			'x-access-token': getAccessToken(),
		}
	});

	return User.parse(await response.json());
}
```

```typescript
// Component.tsx
import {useAccessToken} from './auth-store'
import { fetchUser } from './api.ts'

const useToken = () => {
	const data = useAccessToken();

	if (data === undefined) {
		throw new UnauthenticatedError()
	}

	return data
}

const Components = () => {
	const {userId} = useToken();

	const user = fetchUser(userId);

	/* ... */
}
```



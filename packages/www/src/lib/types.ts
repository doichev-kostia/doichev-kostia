export type ValueOf<ObjectType, ValueType extends keyof ObjectType = keyof ObjectType> = ObjectType[ValueType];

/* https://www.totaltypescript.com/concepts/the-prettify-helper */
export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

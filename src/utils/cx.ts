import classNames from "classnames";
import { twMerge } from "tailwind-merge";

export function cx(...args: classNames.ArgumentArray) {
	return twMerge(classNames(...args));
}

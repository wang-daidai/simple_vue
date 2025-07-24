export const isObject = (raw: any) => raw !== null && typeof raw === "object";

export const isSameValue = (val1: any, val2: any) => Object.is(val1, val2);

export const hasOwn = (raw: any, key: string) => Object.prototype.hasOwnProperty.call(raw, key);

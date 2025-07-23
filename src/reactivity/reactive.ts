import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { ReactiveFlags } from "./proxyHandler";
export function reactive(target: any) {
  return new Proxy(target, {
    get(target, key: string) {
      if (key === ReactiveFlags.IS_REACTIVE) {
        return true;
      }
      const res = Reflect.get(target, key);
      //收集
      track(target, key);
      if (isObject(res)) {
        return reactive(res);
      }
      return res;
    },
    set(target, key: string, value: any) {
      const res = Reflect.set(target, key, value);
      //触发
      trigger(target, key);
      return res;
    },
  });
}

export function isReactive(raw: any) {
  return !!raw[ReactiveFlags.IS_REACTIVE];
}

export function toRaw(raw: any) {}

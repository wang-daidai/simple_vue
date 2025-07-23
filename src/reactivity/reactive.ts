import { track, trigger } from "./effect";
export function reactive(target: any) {
  return new Proxy(target, {
    get(target, key: string) {
      const res = Reflect.get(target, key);
      //收集
      track(target, key);
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

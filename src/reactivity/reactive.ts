import { ReactiveFlags } from "./proxyHandler";
import { reactiveHandler, readonlyHandler, shallowReadonlyHandler } from "./proxyHandler";

export function reactive(target: any) {
  return new Proxy(target, reactiveHandler);
}

export function readonly(target: any) {
  return new Proxy(target, readonlyHandler);
}

export function shallowReadonly(target: any) {
  return new Proxy(target, shallowReadonlyHandler);
}
//通过_isReactive _isReadonly 这两个key去判断是否为readonly和reactive
//两次取反 保证取得正确的值
export function isReactive(raw: any) {
  return !!raw[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(raw: any) {
  return !!raw[ReactiveFlags.IS_READONLY];
}

export function isProxy(raw: any) {
  return isReactive(raw) || isReadonly(raw);
}

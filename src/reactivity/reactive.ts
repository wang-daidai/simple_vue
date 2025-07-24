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
        //如何让返回的是一个对象 则用reactive或readonly 再次包裹，实现嵌套
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

export function readonly(target: any) {
  return new Proxy(target, {
    get(target, key: string) {
      if (key === ReactiveFlags.IS_READONLY) {
        return true;
      }
      const res = Reflect.get(target, key);
      //收集
      track(target, key);
      if (isObject(res)) {
        return readonly(res);
      }
      return res;
    },
    //readonly 不能set修改值
    set(target: any, key: string) {
      console.warn(`该对象为readonly类型，${key} 不能被修改`);
      return false;
    },
  });
}

export function shallowReadonly(target: any) {
  return new Proxy(target, {
    get(target, key: string) {
      if (key === ReactiveFlags.IS_READONLY) {
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
    //readonly 不能set修改值
    set(target: any, key: string) {
      console.warn(`该对象为readonly类型，${key} 不能被修改`);
      return false;
    },
  });
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

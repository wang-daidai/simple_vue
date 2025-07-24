import { track, trigger } from "./effect";
import { isObject } from "../shared";
import { reactive, readonly } from "./reactive";
export const enum ReactiveFlags {
  IS_REACTIVE = "_isReactive",
  IS_READONLY = "_isReadonly",
}

//提前调用函数，之后就用引用的对象
const reactiveGet = createGetter();
const readonlyGet = createGetter(true, false);
//shallowReadonlyGet  只追踪顶层属性的访问,直接修改顶层属性会被阻止,内部嵌套属性为普通对象
const shallowReadonlyGet = createGetter(true, true);

const reactiveSet = createSetter();
const readonlySet = createReadonlySetter();

function createGetter(isReadonly = false, isshallowReadonly = false) {
  return function (target: any, key: string) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }
    if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key);
    track(target, key);
    if (isObject(res) && !isshallowReadonly) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}

function createSetter() {
  return function (target: any, key: string, value: any) {
    const res = Reflect.set(target, key, value);
    trigger(target, key);
    return res;
  };
}

function createReadonlySetter() {
  return function (target: any, key: string) {
    console.warn(`该对象为readonly类型，${key} 不能被修改`);
    return false;
  };
}

export const reactiveHandler = {
  get: reactiveGet,
  set: reactiveSet,
};
export const readonlyHandler = {
  get: readonlyGet,
  set: readonlySet,
};
export const shallowReadonlyHandler = {
  get: shallowReadonlyGet,
  set: readonlySet,
};

import { isObject, isSameValue } from "../shared";
import { trackEffect, triggerEffect } from "./effect";
import { reactive } from "./reactive";
class RefImpl {
  private _raw_value: any;
  public deps = new Set();
  public _is_Ref = true;
  constructor(value: any) {
    this._raw_value = value;
  }

  get value() {
    trackEffect(this.deps);
    return isObject(this._raw_value) ? reactive(this._raw_value) : this._raw_value;
  }
  set value(newValue) {
    if (isSameValue(this._raw_value, newValue)) return;
    this._raw_value = newValue;
    triggerEffect(this.deps);
    return;
  }
}

export function ref(value: any) {
  return new RefImpl(value);
}

export function isRef(raw: any) {
  return !!raw["_is_Ref"];
}

export function unRef(raw: any) {
  return isRef(raw) ? raw.value : raw;
}

//proxyRefs 自动解包，接报后的值仍是响应式
export function proxyRefs(raw: any) {
  return new Proxy(raw, {
    get(raw, key: string) {
      return unRef(raw[key]);
    },
    set(raw, key: string, newValue: any) {
      if (isRef(raw[key])) {
        raw[key].value = unRef(newValue);
        return true;
      } else {
        Reflect.set(raw, key, newValue);
        return true;
      }
    },
  });
}

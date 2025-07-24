import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _getter: any;
  private _getter_value: any;
  private _isdirty: boolean = false;

  /**
   * computed 语法
   * 初始化时 computed 传入的函数不会执行
   * 当第一次获取computed 返回的value时，computed 内的函数被调用，返回对应的值
   *
   * 当value未发生改变，则多次获取其值 computed 内的函数不会被调用
   *
   * 当修改响应式的值后，computed 内的函数仍不会被调用
   * 待获取value后，computed 内的函数才会被调用，获得最新值
   *
   * 这里用到 scheduler 函数
   * 第一次获取computed返回的值时，_isdirty为false，此时computed内的函数会执行一次，返回对应值
   * 若未修改computed中依赖的响应式值时，由于_isdirty为true，此时直接返回值，computed内函数不会执行，相当于lazy
   *
   * 当修改依赖响应式的值时，scheduler函数被调用，修改_isdirty的值
   * 在此之后当获取value时，computed内函数再次执行，返回最新值
   *
   * **/
  constructor(getter: () => void) {
    this._getter = new ReactiveEffect(getter, () => {
      this._isdirty = false;
    });
  }
  get value() {
    if (!this._isdirty) {
      this._isdirty = true;
      this._getter_value = this._getter.run();
    }
    return this._getter_value;
  }
}

export function computed(fn: () => void) {
  return new ComputedRefImpl(fn);
}

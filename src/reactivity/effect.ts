export class ReactiveEffect {
  private _fn: () => void;
  constructor(fn: () => void) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    return this._fn();
  }
}
let targetsMap = new Map();
export function track(target: any, key: string) {
  let targetMap = targetsMap.get(key);
  if (!targetMap) {
    targetMap = new Map();
    targetsMap.set(target, targetMap);
  }
  let deps = targetMap.get(key);
  if (!deps) {
    deps = new Set();
    targetMap.set(key, deps);
  }
  deps.add(activeEffect);
}

export function trigger(target: any, key: string) {
  let targetMap = targetsMap.get(target);
  let deps = targetMap.get(key);
  for (const effect of deps) {
    effect.run();
  }
}

let activeEffect: any = null;
export function effect(fn: () => void, options: any = {}) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}

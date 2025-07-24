export class ReactiveEffect {
  private _fn: () => void;
  public deps: any[] = [];
  onStop?: () => void;

  constructor(fn: () => void, public scheduler?: any) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    const result = this._fn();
    //将activeEffect置为null,防止多次收集
    activeEffect = null;
    return result;
  }
  stop() {
    if (this.onStop) this.onStop();
    this.deps.forEach((dep: any) => {
      dep.delete(this);
    });
  }
}
let targetsMap = new Map();
export function track(target: any, key: string) {
  if (!activeEffect) return;
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
  trackEffect(deps);
}

export function trackEffect(deps: any) {
  if (!activeEffect) return;
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

export function trigger(target: any, key: string) {
  let targetMap = targetsMap.get(target);
  let deps = targetMap.get(key);
  triggerEffect(deps);
}
export function triggerEffect(deps: any) {
  for (const effect of deps) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
export function stop(runner: any) {
  runner._effect.stop();
}

let activeEffect: any = null;
export function effect(fn: () => void, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  Object.assign(_effect, options);
  _effect.run();
  const runner = _effect.run.bind(_effect) as any;
  runner._effect = _effect;
  return runner;
}

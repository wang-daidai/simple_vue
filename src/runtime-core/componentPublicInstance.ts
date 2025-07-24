import { hasOwn } from "../shared";
const publicPropertiesMap = {
  $el: (i: any) => i.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }: { _: { setupState: any } }, key: string) {
    const { setupState } = instance;
    if (hasOwn(setupState, key)) {
      return setupState[key];
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};

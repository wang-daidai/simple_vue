import { hasOwn } from "../shared";
const publicPropertiesMap = {
  $el: (i: any) => i.vnode.el,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }: { _: { setupState: any; props: any } }, key: string) {
    const { setupState, props } = instance;
    if (hasOwn(setupState, key)) {
      return setupState[key];
    }
    if (hasOwn(props, key)) {
      return props[key];
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};

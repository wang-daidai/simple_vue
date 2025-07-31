import { shallowReadonly } from "@/reactivity/reactive";
import { isObject } from "../shared";
import { emitEvent } from "./emit";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";
import { initProps } from "./componentProps";
//创建组件实例
export function createComponentInstance(vnode: any, parentComponent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    proxy: null,
    render: null,
    props: {},
    emit: () => {},
    slots: {},
    provider: parentComponent ? parentComponent.provider : {},
  };
  //通过bind为emitEvent这一函数传入第一个参数component
  //后续接受用户传入的事件名和其他载荷
  component.emit = emitEvent.bind(null, component);

  return component;
}

//组件初始化
export function setupComponent(instance: any) {
  //初始化props
  initProps(instance);
  //初始化slots
  initSlots(instance);
  //处理有状态的组件
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);

    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    setCurrentInstance(null);

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance: any, setupResult: any) {
  //组件setup函数可能为对象或函数，返回函数即可看成h函数
  if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render;
  }
}

let currentInstance = null;
export function getCurrentInstance() {
  return currentInstance;
}

function setCurrentInstance(instance) {
  currentInstance = instance;
}

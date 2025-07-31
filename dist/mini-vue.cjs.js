'use strict';

//是否为对象
const isObject = (raw) => raw !== null && typeof raw === "object";
//是否有属性值
const hasOwn = (raw, key) => Object.prototype.hasOwnProperty.call(raw, key);
//注册事件用 onClick
const isOn = (key) => /^on[A-Z]/.test(key);
//add-foo -> addFoo
function camelize(str) {
    //c 是 - 后面第一个字符
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
}
//add->Add
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
//add -> onAdd
function toHandlerKey(str) {
    return str ? "on" + capitalize(camelize(str)) : "";
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlage(type),
    };
    if (typeof children === "string") {
        //位运算通过|来赋值
        vnode.shapeFlags |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    //父组件是否有传入插槽内容
    //首先要为一个组件vnode，并且children为h函数返回的一个对象
    if (vnode.shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(vnode.children)) {
            vnode.shapeFlags |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlage(type) {
    if (typeof type == "string") {
        //'div' 'span'
        return 1 /* ShapeFlags.ElEMENT */;
    }
    else if (isObject(type)) {
        //{name:"",render(){},setup(){}}
        return 2 /* ShapeFlags.STATEFUL_COMPONENT */;
    }
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

let targetsMap = new Map();
function trigger(target, key) {
    let targetMap = targetsMap.get(target);
    let deps = targetMap.get(key);
    triggerEffect(deps);
}
function triggerEffect(deps) {
    for (const effect of deps) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

//提前调用函数，之后就用引用的对象
const reactiveGet = createGetter();
const readonlyGet = createGetter(true, false);
//shallowReadonlyGet  只追踪顶层属性的访问,直接修改顶层属性会被阻止,内部嵌套属性为普通对象
const shallowReadonlyGet = createGetter(true, true);
const reactiveSet = createSetter();
const readonlySet = createReadonlySetter();
function createGetter(isReadonly = false, isshallowReadonly = false) {
    return function (target, key) {
        if (key === "_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        if (key === "_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isObject(res) && !isshallowReadonly) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function (target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
function createReadonlySetter() {
    return function (target, key) {
        console.warn(`该对象为readonly类型，${key} 不能被修改`);
        //return false 会抛出错误
        return true;
    };
}
const reactiveHandler = {
    get: reactiveGet,
    set: reactiveSet,
};
const readonlyHandler = {
    get: readonlyGet,
    set: readonlySet,
};
const shallowReadonlyHandler = {
    get: shallowReadonlyGet,
    set: readonlySet,
};

function reactive(target) {
    return new Proxy(target, reactiveHandler);
}
function readonly(target) {
    return new Proxy(target, readonlyHandler);
}
function shallowReadonly(target) {
    return new Proxy(target, shallowReadonlyHandler);
}

//父组件将emit函数传给子组件
//子组件触发这一函数，父组件根据emit中第一个参数事件名称
//去查找是否有这一事件注册，这里涉及到一些命名规范转化
//若有注册方法，则调用该方法，并将一并传入参数
function emitEvent(instance, eventName, ...args) {
    const { props } = instance;
    let handlerName = toHandlerKey(eventName);
    const hander = props[handlerName];
    hander && hander(...args);
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
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

function initSlots(instance) {
    const { children, shapeFlags } = instance.vnode;
    if (shapeFlags & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function initProps(instance) {
    instance.props = instance.vnode.props || {};
}

//创建组件实例
function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        proxy: null,
        render: null,
        props: {},
        emit: () => { },
        slots: {},
    };
    //通过bind为emitEvent这一函数传入第一个参数component
    //后续接受用户传入的事件名和其他载荷
    component.emit = emitEvent.bind(null, component);
    return component;
}
//组件初始化
function setupComponent(instance) {
    //初始化props
    initProps(instance);
    //初始化slots
    initSlots(instance);
    //处理有状态的组件
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    //组件setup函数可能为对象或函数，返回函数即可看成h函数
    if (isObject(setupResult)) {
        instance.setupState = setupResult;
        finishComponentSetup(instance);
    }
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    path(vnode, container);
}
function path(vnode, container) {
    const { shapeFlags, type } = vnode;
    //区分vnode中的type
    switch (type) {
        case Fragment:
            //Fragment -> 只渲染 children
            processFragment(vnode, container);
            break;
        case Text:
            break;
        default:
            if (shapeFlags & 1 /* ShapeFlags.ElEMENT */) {
                //处理element
                processElement(vnode, container);
            }
            else if (shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                //处理组件
                processComponent(vnode, container);
            }
    }
}
function processFragment(vnode, container) {
    mountChildren(vnode.children, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function processElement(vnode, container) {
    //init
    mountElement(vnode, container);
    //TODO update
}
//挂载组件
function mountComponent(initinalVnode, container) {
    const instance = createComponentInstance(initinalVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initinalVnode, container);
}
function setupRenderEffect(instance, initinalVnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    //subTree 为组件对应的vnode
    //组件转换完毕后，再次patch vnode=>element
    path(subTree, container);
    //等element挂载完毕后，再赋值el
    initinalVnode.el = subTree.el;
}
//挂载element
function mountElement(vnode, container) {
    const { type, props, children, shapeFlags } = vnode;
    const el = (vnode.el = document.createElement(type));
    if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode.children, el);
    }
    for (const key in props) {
        const val = props[key];
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
//挂载子组件
function mountChildren(vnodes, el) {
    for (const child of vnodes) {
        path(child, el);
    }
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            //1.转化为vnode，后续所有操作都会基于虚拟节点做处理
            const vnode = createVNode(rootComponent);
            //2.render 实现渲染
            render(vnode, rootContainer);
        },
    };
}

function renderSlots(slots, slotName, props) {
    if (typeof slots[slotName] === "function") {
        return h(Fragment, {}, slots[slotName](props));
    }
}

exports.createApp = createApp;
exports.h = h;
exports.renderSlots = renderSlots;

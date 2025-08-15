//是否为对象
const isObject = (raw) => raw !== null && typeof raw === "object";
//两个值是否相等
const isSameValue = (val1, val2) => Object.is(val1, val2);
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
//返回一个空对象
const EMPTY_OBJ = {};

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

class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
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
        if (this.onStop)
            this.onStop();
        this.deps.forEach((dep) => {
            dep.delete(this);
        });
    }
}
let targetsMap = new Map();
function track(target, key) {
    if (!activeEffect)
        return;
    //这里是target不是key bugfix
    let targetMap = targetsMap.get(target);
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
function trackEffect(deps) {
    if (!activeEffect)
        return;
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
}
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
function stop(runner) {
    runner._effect.stop();
}
let activeEffect = null;
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    Object.assign(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner._effect = _effect;
    return runner;
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
        track(target, key);
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
//通过_isReactive _isReadonly 这两个key去判断是否为readonly和reactive
//两次取反 保证取得正确的值
function isReactive(raw) {
    return !!raw["_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function isReadonly(raw) {
    return !!raw["_isReadonly" /* ReactiveFlags.IS_READONLY */];
}
function isProxy(raw) {
    return isReactive(raw) || isReadonly(raw);
}

class RefImpl {
    constructor(value) {
        this.deps = new Set();
        this._is_Ref = true;
        this._raw_value = value;
    }
    get value() {
        trackEffect(this.deps);
        return isObject(this._raw_value) && !isReactive(this._raw_value) ? reactive(this._raw_value) : this._raw_value;
    }
    set value(newValue) {
        if (isSameValue(this._raw_value, newValue))
            return;
        this._raw_value = newValue;
        triggerEffect(this.deps);
        return;
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(raw) {
    return !!raw["_is_Ref"];
}
function unRef(raw) {
    return isRef(raw) ? raw.value : raw;
}
//proxyRefs 自动解包，解包后的值仍是响应式
function proxyRefs(raw) {
    return new Proxy(raw, {
        get(raw, key) {
            return unRef(raw[key]);
        },
        set(raw, key, newValue) {
            if (isRef(raw[key])) {
                raw[key].value = unRef(newValue);
                return true;
            }
            else {
                Reflect.set(raw, key, newValue);
                return true;
            }
        },
    });
}

//创建组件实例
function createComponentInstance(vnode, parentComponent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        proxy: null,
        render: null,
        props: {},
        emit: () => { },
        slots: {},
        provides: parentComponent ? parentComponent.provides : {},
        parent: parentComponent,
        //isMounted 用于判断是第一次挂载还是更新
        isMounted: false,
        subTree: null,
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
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    //组件setup函数可能为对象或函数，返回函数即可看成h函数
    if (isObject(setupResult)) {
        //使用proxyRefs 自动解包
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlage(type),
        key: props && props.key,
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
//创建text节点
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                //1.转化为vnode，后续所有操作都会基于虚拟节点做处理
                const vnode = createVNode(rootComponent);
                //2.render 实现渲染
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, setElementText: hostSetElementText, remove: hostRemove, createTextNode: hostCreateTextNode, } = options;
    function render(vnode, container) {
        path(null, vnode, container, null);
    }
    function path(preVnode, vnode, container, parentComponent, anchor = null) {
        const { shapeFlags, type } = vnode;
        //区分vnode中的type
        switch (type) {
            case Fragment:
                //Fragment -> 只渲染 children
                processFragment(vnode, container, parentComponent);
                break;
            case Text:
                processText(vnode, container);
                break;
            default:
                if (shapeFlags & 1 /* ShapeFlags.ElEMENT */) {
                    //处理element
                    processElement(preVnode, vnode, container, parentComponent, anchor);
                }
                else if (shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    //处理组件
                    processComponent(vnode, container, parentComponent);
                }
        }
    }
    //处理type 为 Fragment 类型的节点 渲染子节点，将渲染后的dom直接放到container下
    function processFragment(vnode, container, parentComponent) {
        mountChildren(vnode.children, container, parentComponent);
    }
    //处理文本节点，通过createTextNode方法，将文本内容直接显示，内容外面没有标签包裹
    function processText(vnode, container) {
        const { children } = vnode;
        const textNode = (vnode.el = hostCreateTextNode(children));
        container.append(textNode);
    }
    //处理组件
    function processComponent(vnode, container, parentComponent) {
        mountComponent(vnode, container, parentComponent);
    }
    //处理Element 节点
    function processElement(preVnode, vnode, container, parentComponent, anchor = null) {
        if (!preVnode) {
            //init
            mountElement(vnode, container, parentComponent, anchor);
        }
        else {
            //update
            patchElement(preVnode, vnode, container, parentComponent);
        }
    }
    //挂载组件
    function mountComponent(initinalVnode, container, parentComponent) {
        const instance = createComponentInstance(initinalVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initinalVnode, container);
    }
    function setupRenderEffect(instance, initinalVnode, container) {
        //effect可以实现当setup中依赖的值修改后，再次渲染元素
        //配合元素更新逻辑，否则会生成新的dom元素
        effect(() => {
            const { proxy } = instance;
            if (!instance.isMounted) {
                //subTree 为组件对应的vnode
                const subTree = (instance.subTree = instance.render.call(proxy));
                //第一次挂载
                //组件转换完毕后，再次patch vnode=>element
                path(null, subTree, container, instance);
                instance.isMounted = true;
                //等element挂载完毕后，再赋值el
                initinalVnode.el = subTree.el;
            }
            else {
                //更新节点
                const subTree = instance.render.call(proxy, proxy);
                //prevSubTree更新前的节点
                const prevSubTree = instance.subTree;
                path(prevSubTree, subTree, container, instance);
                instance.subTree = subTree;
            }
        });
    }
    //挂载element
    function mountElement(vnode, container, parentComponent, anchor) {
        const { type, props, children, shapeFlags } = vnode;
        const el = (vnode.el = hostCreateElement(type));
        if (shapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent);
        }
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, val);
        }
        hostInsert(el, container, anchor);
    }
    //更新element
    function patchElement(n1, n2, container, parentComponent) {
        const el = (n2.el = n1.el);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        patchProps(oldProps, newProps, el);
        patchChildren(n1, n2, el, parentComponent);
    }
    //更新props
    function patchProps(oldProps, newProps, el) {
        if (oldProps === newProps)
            return;
        //设置新值
        for (const key in newProps) {
            if (newProps[key] !== oldProps[key]) {
                hostPatchProp(el, key, newProps[key]);
            }
        }
        if (oldProps !== EMPTY_OBJ) {
            //原来有 现在没有了要删除
            for (const key in oldProps) {
                if (!hasOwn(newProps, key)) {
                    hostPatchProp(el, key, undefined);
                }
            }
        }
    }
    //更新子元素
    function patchChildren(n1, n2, container, parentComponent) {
        const { shapeFlags: preShapeFlags, children: preChildren } = n1;
        const { children: nextChildren, shapeFlags: nextShapeFlags } = n2;
        //新节点的元素内容是文本
        if (nextShapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            //老的是数组
            if (preShapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                //删除老的内容
                unmountChildren(preChildren);
            }
            //老的是文本
            if (preShapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                if (preChildren === nextChildren) {
                    return;
                }
            }
            hostSetElementText(nextChildren, container);
        }
        //新的是数组
        if (nextShapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            //老的是数组
            if (preShapeFlags & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                patchKeyedChildren(preChildren, nextChildren, container, parentComponent);
            }
            //老的是文本
            if (preShapeFlags & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                //将老的文本置为空
                hostSetElementText("", container);
                //创建新的
                mountChildren(nextChildren, container, parentComponent);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent) {
        console.log(c1, "旧节点");
        console.log(c2, "新节点");
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        //左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                //相同节点进一步对比渲染
                path(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        //右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                path(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        //新的比老的长
        if (i > e1 && i <= e2) {
            //这里要使用inserNode 如何新增的在左侧则要使用anchor锚点插入
            let inserNode = c2[e2 + 1] ? c2[e2 + 1].el : null;
            for (let j = i; j <= e2; j++) {
                path(null, c2[j], container, parentComponent, inserNode);
            }
        }
        //老的比新的长
        if (i > e2 && i <= e1) {
            for (let j = i; j <= e1; j++) {
                //删除多出来的
                hostRemove(c1[j].el);
            }
        }
        //中间对比
        let s1 = i;
        let s2 = i;
        let patched = 0;
        //toBePatched 要新增的节点数
        const toBePatched = e2 - i + 1;
        const keyToMap = new Map();
        //把新节点的key存取来
        for (let j = s2; j <= e2; j++) {
            const nextChild = c2[j];
            keyToMap.set(nextChild.key, j);
        }
        for (let j = s1; j <= e1; j++) {
            const prevChild = c1[j];
            let newIndex;
            //如果已经渲染的节点数量比实际需要的多，则直接删除当前节点
            if (patched >= toBePatched) {
                hostRemove(prevChild.el);
                continue;
            }
            if (prevChild.key != null) {
                //如果旧的元素有key则去映射表里查找
                newIndex = keyToMap.get(prevChild.key);
            }
            else {
                //没有key则遍历查找
                for (let k = s1; k <= e2; k++) {
                    if (isSameVNodeType(prevChild, c2[k])) {
                        newIndex = k;
                        break;
                    }
                }
            }
            //新的中不存在则删除
            if (!newIndex) {
                hostRemove(prevChild.el);
            }
            else {
                patched++;
            }
        }
    }
    function isSameVNodeType(n1, n2) {
        //type key
        //如果虚拟节点的type即div p 相同以及key相同，则视为同一节点
        return n1.type === n2.type && n1.key === n2.key;
    }
    //挂载子组件
    function mountChildren(vnodes, el, parentComponent) {
        for (const child of vnodes) {
            path(null, child, el, parentComponent);
        }
    }
    function unmountChildren(children) {
        for (const child of children) {
            const el = child.el;
            hostRemove(el);
        }
    }
    return {
        createApp: createAppAPI(render),
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, slotName, props) {
    if (typeof slots[slotName] === "function") {
        return h(Fragment, {}, slots[slotName](props));
    }
}

//存
function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides, parent } = currentInstance;
        //下面这个判断是确保 currentInstance.provides 只初始化一次
        //否则当组件中provide 两次后 为currentInstance.provides初始化两次
        //上一次设置的值会被覆盖
        if (provides === parent.provides) {
            //子节点的provides 不能直接引用为父节点的provides
            //不然当子节点中provide了和父节点相同key的值之后
            //父节点provides值修改了
            //之后在inject去获取值时，获取到的就是修改后的新值，而非父节点的原始数据
            //这里的处理逻辑是 使用 Object.create 以父节点provides作为原型，创建一个新对象
            //在此之后，inject中即可通过原型链获取到父节点provides中的数据
            //同时在修改当前节点的provides值时，父节点的数据不会被修改
            currentInstance.provides = Object.create(parent.provides);
        }
        currentInstance.provides[key] = value;
    }
}
//取
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (typeof defaultValue === "function") {
            return defaultValue();
        }
        else if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            return defaultValue;
        }
    }
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, val);
    }
    else {
        //删除属性
        if (val === undefined || val === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, val);
        }
    }
}
//为元素设置文本内容
function setElementText(text, el) {
    el.textContent = text;
}
//删除子节点
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
//insert 插入节点
//anchor为null则insertBefore相当于是append
//anchor为一个node节点时，可看成在parent父节点中，anchor这个锚点前插入el元素
function insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
}
//创建文本节点
function createTextNode(text) {
    return document.createTextNode(text);
}
const renderer = createRenderer({ createElement, patchProp, insert, setElementText, remove, createTextNode });
function createApp(rootComponent) {
    return renderer.createApp(rootComponent);
}

export { ReactiveEffect, createApp, createAppAPI, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, provide, proxyRefs, reactive, readonly, ref, renderSlots, shallowReadonly, stop, track, trackEffect, trigger, triggerEffect, unRef };

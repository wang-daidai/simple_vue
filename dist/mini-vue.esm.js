const isObject = (raw) => raw !== null && typeof raw === "object";
const hasOwn = (raw, key) => Object.prototype.hasOwnProperty.call(raw, key);

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlage(type),
    };
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

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
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

//创建组件实例
function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        proxy: null,
        render: null,
    };
    return component;
}
//组件初始化
function setupComponent(instance) {
    //初始化props
    //  initProps(instance);
    //初始化slots
    //   initSlots(instance);
    //处理有状态的组件
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
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
    const { shapeFlags } = vnode;
    if (shapeFlags & 1 /* ShapeFlags.ElEMENT */) {
        //处理element
        processElement(vnode, container);
    }
    else if (shapeFlags & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        //处理组件
        processComponent(vnode, container);
    }
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
    const { type, props, children } = vnode;
    const el = (vnode.el = document.createElement(type));
    el.textContent = children;
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }
    container.append(el);
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

export { createApp, h };

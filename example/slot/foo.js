import { h, renderSlots } from "../../dist/mini-vue.esm.js";

export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");
    //1.普通使用
    //当父组件有传入插槽内容时，相当于 [foo, '这里把传入的内容渲染出来']
    //需要获取到foo组件的vnode的children,把传入的内容加到children中
    // return h("div", {}, [foo, this.$slots]);

    console.log(this.$slots, "$slots");

    //2.传入数组后，this.$slots为一个数组，需要用h进行包裹处理
    //因为实现具名插槽时把this.$slots 改为了对象，所以默认使用时就渲染不出来了
    // return h("div", {}, [foo, h("div", {}, this.$slots)]);

    //3.具名插槽 实现步骤
    //1.获取要渲染的元素
    //2.获取渲染的位置
    //用renderSlots 封装插槽
    return h("div", {}, [renderSlots(this.$slots, "header"), foo, renderSlots(this.$slots, "footer")]);
  },
};

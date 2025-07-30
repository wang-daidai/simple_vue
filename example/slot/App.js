import { h } from "../../dist/mini-vue.esm.js";
import { Foo } from "./foo.js";
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");
    //1.普通使用,传入p标签
    //实现foo中h渲染的插槽内容渲染在foo组件内
    // const foo = h(Foo, {}, h("p", {}, "插槽内容"));
    //2.普通使用,传入数组
    // const foo = h(Foo, {}, [h("p", {}, "插槽内容1"), h("p", {}, "插槽内容2")]);

    //3.具名插槽
    const foo = h(
      Foo,
      {},
      {
        footer: h("p", {}, "footer"),
        header: h("p", {}, "header"),
      }
    );

    return h("div", {}, [app, foo]);
  },
  setup() {
    return {};
  },
};

import { h, getCurrentInstance } from "../../dist/mini-vue.esm.js";

export const Foo = {
  name: "Foo",
  setup() {
    //getCurrentInstance 这个函数只能在setup内部使用
    const instance = getCurrentInstance();
    console.log("Foo Instance", instance);
    return {};
  },
  render() {
    return h("div", {}, "foo");
  },
};

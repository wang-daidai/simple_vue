import { h } from "../../dist/mini-vue.esm.js";
export const Foo = {
  name: "Foo",
  render() {
    return h("div", {}, "foo:" + this.count);
  },
  setup() {
    return {};
  },
};

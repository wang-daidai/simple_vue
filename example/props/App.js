import { h } from "../../dist/mini-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  name: "App",
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "app",
        class: ["red", "hard"],
      },
      [h("div", {}, "hi," + this.msg), h(Foo, { count: 1 })]
    );
  },
  setup() {
    return {
      msg: "王呆呆",
    };
  },
};

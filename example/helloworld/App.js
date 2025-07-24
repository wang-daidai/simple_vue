import { h } from "../../dist/mini-vue.esm.js";
export const App = {
  name: "App",
  render() {
    return h(
      "div",
      {
        id: "app",
        class: ["red", "hard"],
      },
      "hi,mini-vue"
    );
  },
  setup() {
    return {
      msg: "哇哈哈",
    };
  },
};

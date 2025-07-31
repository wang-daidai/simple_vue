import { h, getCurrentInstance } from "../../dist/mini-vue.esm.js";
import { Foo } from "./foo.js";
window.self = null;
export const App = {
  name: "App",
  //template
  render() {
    window.self = this;
    return h("div", {}, [h("div", {}, [h("p", {}, "cueeentInstance demo"), h(Foo)])]);
  },
  setup() {
    const instance = getCurrentInstance();
    console.log("App Instance", instance);
    return {};
  },
};

import { h, provide, inject } from "../../dist/mini-vue.esm.js";
//最外层
const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Prover"), h(Consumer)]);
  },
};
//中间层
// const ProviderTwo = {
//   name: "ProviderTwo",
//   setup() {
//     provide("foo", "fooValTwo");
//     const foo = inject("foo");
//     const baz = inject("baz", () => "bazDefaultFun");
//     return { foo, baz };
//   },
//   render() {
//     return h("div", {}, [h("p", {}, `ProverTwo-${this.foo}-${this.baz}`), h(Consumer)]);
//   },
// };

//消费层
const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo");
    const bar = inject("bar");
    return {
      foo,
      bar,
    };
  },
  render() {
    return h("div", {}, `Consumer:-${this.foo}-${this.bar}`);
  },
};

export default {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)]);
  },
};

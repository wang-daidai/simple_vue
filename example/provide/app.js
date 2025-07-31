import { h, provide, inject } from "../../dist/mini-vue.esm.js";
//最外层
const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal");
    provide("bar", "barVal");
  },
  render() {
    return h("div", {}, [h("p", {}, "Prover"), h(ProviderTwo)]);
  },
};
//中间层
const ProviderTwo = {
  name: "ProviderTwo",
  setup() {
    provide("foo", "fooValTwo");
    const foo = inject("foo");
    const baz = inject("baz", () => "bazDefaultFun");
    return { foo, baz };
  },
  render() {
    //中间这个组件如果提供了foo,则实际再渲染时this.foo 应该还显示fooVal 父级提供的foo
    //fooValTwo 是共给第三层去使用的
    return h("div", {}, [h("p", {}, `ProverTwo-${this.foo}-${this.baz}`), h(Consumer)]);
  },
};

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

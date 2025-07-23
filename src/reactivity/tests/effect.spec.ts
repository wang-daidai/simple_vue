import { reactive } from "../reactive";
import { effect } from "../effect";
describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });

    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    //update
    user.age++;
    expect(nextAge).toBe(12);
  });

  //   it.skip("return runner", () => {
  //     //1.effect => runner  runner()=>fn()
  //     let foo = 10;
  //     const runner = effect(() => {
  //       foo++;
  //       return "foo";
  //     });

  //     const result = runner();
  //     expect(foo).toBe(12);
  //     expect(result).toBe("foo");
  //   });

  /**
   * 1.通过effect的第二个参数给定的一个scheduler的fn
   * 2.effect 第一次执行的时候 还会执行fn
   * 3.当响应式对象set 时，不会执行fn而是执行scheduler
   * 4.当执行runner时后，会再次执行fn
   */
  //   it.skip("scheduler", () => {
  //     let dummy;
  //     let run;
  //     const scheduler = jest.fn(() => {
  //       run = runner;
  //     });

  //     const obj = reactive({ foo: 1 });
  //     //effect里面可以传入两个参数
  //     const runner = effect(
  //       () => {
  //         dummy = obj.foo;
  //       },
  //       { scheduler }
  //     );
  //     //第一次执行时，后面一个函数不会调用
  //     expect(scheduler).not.toHaveBeenCalled();
  //     expect(dummy).toBe(1);

  //     //修改obj中的值时，调用scheduler
  //     obj.foo++;
  //     expect(scheduler).toHaveBeenCalledTimes(1);
  //     expect(dummy).toBe(1);

  //     //再次执行run时调用的是前一个
  //     run();
  //     expect(dummy).toBe(2);
  //   });

  //   it.skip("stop", () => {
  //     let dummy;
  //     const obj = reactive({ prop: 1 });
  //     const runner = effect(() => {
  //       dummy = obj.prop;
  //     });

  //     obj.prop = 2;
  //     expect(dummy).toBe(2);
  //     stop(runner);
  //     // obj.prop = 3;
  //     obj.prop++;

  //     expect(dummy).toBe(2);

  //     runner();
  //     expect(dummy).toBe(3);
  //   });

  //   it.skip("onStop", () => {
  //     const obj = reactive({
  //       foo: 1,
  //     });
  //     const onStop = jest.fn();
  //     let dummy;
  //     const runner = effect(
  //       () => {
  //         dummy = obj.foo;
  //       },
  //       {
  //         onStop,
  //       }
  //     );
  //     stop(runner);
  //     expect(onStop).toBeCalledTimes(1);
  //   });
});

import { reactive, readonly, isReactive, isReadonly, isProxy } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const observed = reactive(original);
    const readonlyObj = readonly(original);
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);
    expect(isReactive(original)).toBe(false);
    expect(isReactive(readonlyObj)).toBe(false);
    expect(isReactive(observed)).toBe(true);
    expect(isReadonly(readonlyObj)).toBe(true);
    expect(isReadonly(readonlyObj.bar)).toBe(true);
    expect(isReadonly(observed)).toBe(false);
    expect(isReadonly(readonlyObj.bar)).toBe(true);
  });

  it("nested reactive", () => {
    const original = {
      nested: { foo: 1 },
      array: [{ bar: 2 }],
    };

    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);

    expect(isProxy(observed.array)).toBe(true);
  });
});

import { reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const observed = reactive(original);
  });

  it.skip("nested reactive", () => {
    const original = {
      nested: { foo: 1 },
      array: [{ bar: 2 }],
    };

    // const observed = reactive(original);
    // expect(isReactive(observed.nested)).toBe(true);
    // expect(isReactive(observed.array)).toBe(true);
    // expect(isReactive(observed.array[0])).toBe(true);

    // expect(isProxy(observed.nested)).toBe(true);
  });
});

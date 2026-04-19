const assert = require("assert");
const { test } = require("./helpers");

/**
 * Problem: Min Stack
 * Design a stack that supports push, pop, top, and retrieving the minimum element
 * in constant time.
 *
 * Implement the MinStack class:
 * - MinStack()         Initializes the stack object.
 * - push(val)          Pushes val onto the stack.
 * - pop()              Removes the element on top of the stack.
 * - top()              Gets the top element.
 * - getMin()           Retrieves the minimum element in the stack.
 *
 * All operations must run in O(1) time.
 *
 * Examples:
 * const stack = new MinStack();
 * stack.push(-2);
 * stack.push(0);
 * stack.push(-3);
 * stack.getMin(); // returns -3
 * stack.pop();
 * stack.top();    // returns 0
 * stack.getMin(); // returns -2
 *
 * Constraints:
 * - -2^31 <= val <= 2^31 - 1
 * - pop, top, and getMin will always be called on a non-empty stack
 * - At most 3 * 10^4 calls will be made to push, pop, top, and getMin
 */
class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = [];
  }

  push(val) {
    this.stack.push(val);
    this.updateMinStack(val);
  }

  pop() {
    this.stack.pop();
    this.minStack.pop();
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  getMin() {
    return this.minStack[this.minStack.length - 1];
  }

  updateMinStack(val) {
    const currentMin =
      this.minStack.length === 0
        ? val
        : Math.min(val, this.minStack[this.minStack.length - 1]);

    this.minStack.push(currentMin);
  }
}

// ----------------------------
// Tests
// ----------------------------

console.log("Min Stack:");

test("basic sequence", () => {
  const stack = new MinStack();
  stack.push(-2);
  stack.push(0);
  stack.push(-3);
  assert.strictEqual(stack.getMin(), -3);
  stack.pop();
  assert.strictEqual(stack.top(), 0);
  assert.strictEqual(stack.getMin(), -2);
});

test("single element", () => {
  const stack = new MinStack();
  stack.push(42);
  assert.strictEqual(stack.top(), 42);
  assert.strictEqual(stack.getMin(), 42);
});

test("min updates correctly after pop", () => {
  const stack = new MinStack();
  stack.push(5);
  stack.push(3);
  stack.push(7);
  assert.strictEqual(stack.getMin(), 3);
  stack.pop(); // remove 7
  assert.strictEqual(stack.getMin(), 3);
  stack.pop(); // remove 3
  assert.strictEqual(stack.getMin(), 5);
});

test("duplicate minimums", () => {
  const stack = new MinStack();
  stack.push(2);
  stack.push(2);
  stack.push(2);
  assert.strictEqual(stack.getMin(), 2);
  stack.pop();
  assert.strictEqual(stack.getMin(), 2);
});

test("negative values", () => {
  const stack = new MinStack();
  stack.push(0);
  stack.push(-1);
  stack.push(-2);
  assert.strictEqual(stack.getMin(), -2);
  stack.pop();
  assert.strictEqual(stack.getMin(), -1);
});

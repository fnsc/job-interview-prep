const assert = require("assert");
const { test } = require("./helpers");

/**
 * Problem: Valid Parentheses
 * Given a string s containing only the characters '(', ')', '{', '}', '[' and ']',
 * determine if the input string is valid.
 *
 * A string is valid if:
 * - Every opening bracket has a corresponding closing bracket of the same type
 * - Brackets are closed in the correct order
 * - Every closing bracket closes the most recently opened bracket
 *
 * Examples:
 * Input:  s = "()"
 * Output: true
 *
 * Input:  s = "()[]{}"
 * Output: true
 *
 * Input:  s = "(]"
 * Output: false
 *
 * Input:  s = "([)]"
 * Output: false
 *
 * Input:  s = "{[]}"
 * Output: true
 *
 * Constraints:
 * - 1 <= s.length <= 10^4
 * - s consists only of '(', ')', '{', '}', '[', ']'
 */
function isValid(s) {
  if (s.length % 2 !== 0) {
    return false;
  }

  const pairs = {
    ')': '(',
    ']': '[',
    '}': '{'
  };
  const stack = [];

  for (const char of s) {
    if (pairs[char]) {
      if (stack[stack.length - 1] !== pairs[char]) {
        return false;
      }

      stack.pop();
    } else {
      stack.push(char);
    }
  }

  return !stack.length;
}

// ----------------------------
// Tests
// ----------------------------

console.log("Valid Parentheses:");

test("simple valid pair", () => {
  assert.strictEqual(isValid("()"), true);
});

test("multiple valid pairs", () => {
  assert.strictEqual(isValid("()[]{}"), true);
});

test("wrong closing bracket", () => {
  assert.strictEqual(isValid("(]"), false);
});

test("correct brackets wrong order", () => {
  assert.strictEqual(isValid("([)]"), false);
});

test("nested valid brackets", () => {
  assert.strictEqual(isValid("{[]}"), true);
});

test("single opening bracket", () => {
  assert.strictEqual(isValid("("), false);
});

test("single closing bracket", () => {
  assert.strictEqual(isValid(")"), false);
});

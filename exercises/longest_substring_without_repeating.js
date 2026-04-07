const assert = require("assert");
const { test } = require("./helpers");

/**
 * Problem: Longest Substring Without Repeating Characters
 * Given a string s, find the length of the longest substring
 * that contains no repeating characters.
 *
 * A substring is a contiguous sequence of characters within the string.
 *
 * Examples:
 * Input:  s = "abcabcbb"
 * Output: 3
 * // "abc" is the longest substring without repeating characters
 *
 * Input:  s = "bbbbb"
 * Output: 1
 * // "b" is the only valid substring
 *
 * Input:  s = "pwwkew"
 * Output: 3
 * // "wke" is the longest substring without repeating characters
 *
 * Constraints:
 * - 0 <= s.length <= 5 * 10^4
 * - s consists of English letters, digits, symbols, and spaces
 *
 * O(n) solution
 */
function lengthOfLongestSubstring(s) {
  const window = new Set()
  let left = 0;
  let right = 0;
  let maxLength = 0;

  while (right < s.length) {
    if (window.has(s[right])) {
      window.delete(s[left])
      left++
      continue
    }

    window.add(s[right])
    maxLength = Math.max(window.size, maxLength)
    right++
  }

  return maxLength
}

/**
 * O(n2) solution
 */
function naiveApproach(s) {
  let slicedString = s.charAt(0);
  let max = 0;
  for (let i = 1; i < s.length; i++) {
    if (slicedString.includes(s.charAt(i))) {
      slicedString = slicedString.slice(slicedString.indexOf(s.charAt(i)) + 1)
    }
    slicedString += s.charAt(i)

    if (slicedString.length > max) {
      max = slicedString.length
    }
  }

  return max;
}

// ----------------------------
// Tests
// ----------------------------

console.log("Longest Substring Without Repeating Characters:");

test("example 1 - repeating pattern", () => {
  assert.strictEqual(lengthOfLongestSubstring("abcabcbb"), 3);
});

test("example 2 - all same character", () => {
  assert.strictEqual(lengthOfLongestSubstring("bbbbb"), 1);
});

test("example 3 - answer in the middle", () => {
  assert.strictEqual(lengthOfLongestSubstring("pwwkew"), 3);
});

test("empty string", () => {
  assert.strictEqual(lengthOfLongestSubstring(""), 0);
});

test("all unique characters", () => {
  assert.strictEqual(lengthOfLongestSubstring("abcdef"), 6);
});

test("repeating at the end", () => {
  assert.strictEqual(lengthOfLongestSubstring("abcdeab"), 5);
});

test("duplicate not at the start of window", () => {
  assert.strictEqual(lengthOfLongestSubstring("dvdf"), 3);
});

const assert = require("assert");
const { test } = require("../exercises/helpers");

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
 */

function lengthOfLongestSubstring(s) {
  // your solution here
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

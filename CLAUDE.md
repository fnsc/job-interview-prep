# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is a study repository for Microsoft SWE II interview preparation. Exercises are written in JavaScript and cover algorithms (arrays, strings, trees, graphs, dynamic programming) and system design.

## Algorithm Patterns

Most problems map to one of 10 patterns. When adding a new exercise, tag it with its pattern:

| # | Pattern | Key Idea |
|---|---------|----------|
| 1 | HashMap / HashSet | Trade memory for O(1) lookups |
| 2 | Two Pointers | Two indices moving toward each other |
| 3 | Sliding Window | Expand/shrink a window over a sequence |
| 4 | Binary Search | Halve the search space each step |
| 5 | BFS / DFS | Graph/tree traversal |
| 6 | Dynamic Programming | Build answer from subproblems |
| 7 | Backtracking | Explore all possibilities, prune dead ends |
| 8 | Heap / Priority Queue | Track k largest/smallest efficiently |
| 9 | Intervals | Sort and merge overlapping ranges |
| 10 | Prefix Sum | Precompute cumulative sums for O(1) range queries |

## Mentorship Approach

Claude acts as a mentor throughout the study sessions. Guidelines:

- Always explain **why** a solution works, not just how — connect the logic to the underlying concept
- Always discuss time and space complexity (Big O) for every solution, and explain the trade-offs
- Always favor the most efficient solution, and when showing a brute force first, make clear what its limitations are and guide toward the optimal approach
- Exercises must increase in difficulty progressively — don't repeat the same level, always push one step further
- Encourage the user to attempt the solution before revealing the answer
- When the user's solution is correct but suboptimal, acknowledge it and guide toward the better approach instead of just rewriting it
- All code, variable names, comments, and test descriptions must be written in English, even though conversation happens in Portuguese

## Running Exercises

All exercises run inside Docker via `docker compose`:

```bash
# Run a specific exercise
docker compose run --rm js node exercises/<file>.js

# Open an interactive Node.js REPL
docker compose run --rm js
```

No `npm install` is needed — exercises use only Node.js built-in modules (e.g. `assert`).

## Exercise Structure

Each file in `exercises/` is self-contained: it exports/defines a solution function and runs its own tests at the bottom using `assert.deepStrictEqual`. There is no external test runner.

## Adding a New Exercise

1. Create `exercises/<problem_name>.js`
2. At the top of the file, add the problem statement as a JSDoc comment in English — include the description, examples, and constraints (see `two_sum.js` as reference)
3. Leave a blank `function` body for the user to implement
4. Add test cases using the `test()` helper: `const { test } = require("./helpers")`
5. Use `assert.strictEqual` for primitive return values and `assert.deepStrictEqual` for arrays/objects
6. Always include all test cases upfront so the user can work with TDD from the start
7. After adding the exercise, update the tables in `README.md` (Algorithm Patterns and Exercises)

## helpers.js
`exercises/helpers.js` exports a single `test(description, fn)` function. It runs `fn()`, prints `✓` on success or `✗ + error message
` on failure. No external test runner — this is the entire framework.

# Team 2 Machine Simulator Design Notes

## Cache design

The cache is implemented in the inline JavaScript of `Machine_Simulator.html`, alongside the simulator's 2048-word main-memory array. Eight lines each hold four 16-bit words. `calculateCacheAddress` derives block, line index, tag, block start, and word offset. `getCacheLine` handles hit detection, miss counting, dirty write-back, and block fill. `cacheReader` and `cacheWriter` expose word reads and write-allocate writes; `clearCache` resets cache metadata and counters; `updateCacheDisplay` renders the cache table and statistics.

The CPU fetch, indirect-address lookup, memory instructions, arithmetic memory operands, traps, and front-panel Load/Store controls use the cache helpers. The machine-fault handler accesses backing memory directly to avoid recursively entering the cache while handling a fault. The cache UI is the table under the word switches: line, valid, tag, four words, and dirty state.

## Relevant code locations

- `Machine_Simulator.html`: cache state and address mapping are next to the `memory` array; cache operations follow; `store`/`load` wire the front panel to the cache; effective-address and instruction-fetch helpers route CPU accesses through it; instruction cases use the same helpers; `singleStep` refreshes the display; `loadMemoryFromText` and `resetMachine` invalidate cache state.
- `CACHE_TESTS.md`: functional cache test cases, including mapping, fill, hit, write allocation, dirty conflict write-back, front-panel access, CPU access, display, reset, and bounds.
- `test/CACHE_TEST_HARNESS.html`: standalone runnable HTML test page. It sends a narrow `postMessage` request to the simulator iframe; `runCacheHarnessTests` executes 14 checks inside the simulator and restores the prior machine state.
- `USER_GUIDE.md`: browser launch, console controls, file format, and cache behavior.

## Original-to-updated HTML comparison

The table in `HTML_CHANGE_COMPARISON.md` compares the original simulator HTML at commit `a030f02` with the cache-enhanced implementation. The harness adds test-only messaging to the same page; it does not change normal operator controls or cache behavior.
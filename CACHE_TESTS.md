# C6461 Cache Simulator Guide and Tests

The cache is embedded in the standalone `Machine_Simulator.html` page. The browser-facing test cases below target that page. See `USER_GUIDE.md` for the console layout and controls.

## Run and use

Open `Machine_Simulator.html` in a browser. The left side is the operator panel: register fields have an **LD** button that loads the current switch word, **Load/Store** access the word at MAR, **St+/Ld+** access and advance MAR, **SS** executes one instruction, **Run** executes repeatedly, **HLT** stops execution, and **Init** clears the machine and opens the object-file loader. The right-side terminal displays I/O.

The cache table appears below the word switches (for easy convenience and viewing state). It shows all eight line indices, valid state, octal tag, four octal words, and dirty state. Hit and miss totals are shown above the table. Single-step and Run refresh it after each instruction; manual memory access, Init, and object-file loading also refresh it.

## Cache test cases

The tests can be performed with the front-panel controls or the browser developer console. Cache helper test values are ordinary hexadecimal JavaScript numbers; the table itself displays octal.

The standalone automated test page is `test/CACHE_TEST_HARNESS.html`. Open it in a browser and select **Run All Tests**. It runs 14 checks and reports individual results in the page. It includes mapping and bounds, block fill and hit behavior, write allocation, full-block dirty write-back, non-conflicting lines, the cache table, front-panel Load/Store, a single-step CPU LDR, cache clearing, full machine reset, and object-file loading. The harness saves and restores the simulator memory, registers, cache, and console state. Stop Run before starting the harness.

For a repeatable helper-level smoke test, open `Machine_Simulator.html`, open the browser developer console, and run this after the page loads:

```js
clearCache();
memory[8] = 0x1111;
memory[9] = 0x2222;
memory[10] = 0x3333;
memory[11] = 0x4444;
console.assert(cacheReader(8) === 0x1111, 'miss reads requested word');
console.assert(cacheReader(9) === 0x2222, 'same block supplies the next word');
cacheWriter(9, 0xAAAA);
console.assert(memory[9] === 0x2222, 'write remains dirty in cache');
console.assert(cacheReader(40) === 0, 'conflicting block loads');
console.assert(memory[9] === 0xAAAA, 'dirty block is written back on eviction');
updateCacheDisplay();
console.assert(cache[2].tag === 1 && !cache[2].dirty, 'line 2 now holds clean tag 1');
console.assert(cacheHits === 2 && cacheMisses === 2, 'expected hit and miss totals');
```

## Design notes

The cache state and address mapping sit beside the main-memory array in `Machine_Simulator.html`. `calculateCacheAddress` returns block, line index, tag, block start, and word offset. `getCacheLine` checks for a hit, writes back a dirty conflicting block, or fills all four words on a miss. `cacheReader` returns the selected word; `cacheWriter` performs write allocation and marks the line dirty. CPU fetch, indirect lookup, memory instructions, arithmetic memory operands, traps, and front-panel Load/Store use those helpers. The machine-fault handler uses direct RAM access to avoid recursively faulting. `clearCache` resets cache state on Init and after object-file loading; `updateCacheDisplay` renders cache state and hit/miss counters.

The direct-mapped line is `floor(address / 4) % 8`; the tag is `floor(floor(address / 4) / 8)`; the word offset is `address % 4`. Dirty data is written back as a complete four-word block when its line is replaced.

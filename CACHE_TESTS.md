# C6461 Cache Simulator Guide and Tests

## Run and use

Open `Machine_Simulator.html` in a browser. The left side is the operator panel: register fields have an **LD** button that loads the current switch word, **Load/Store** access the word at MAR, **St+/Ld+** access and advance MAR, **SS** executes one instruction, **Run** executes repeatedly, **HLT** stops execution, and **Init** clears the machine and opens the object-file loader. The right-side terminal displays I/O.

The cache table appears below the word switches. It shows all eight line indices, valid state, octal tag, four octal words, and dirty state. Hit and miss totals are shown above the table. Single-step and Run refresh it after each instruction; manual memory access, Init, and object-file loading also refresh it.

## Cache test cases

The tests can be performed with the front-panel controls or the browser developer console. Cache helper test values are ordinary hexadecimal JavaScript numbers; the table itself displays octal.

## Design notes

The cache state and address mapping sit beside the main-memory array in `Machine_Simulator.html`. `calculateCacheAddress` returns block, line index, tag, block start, and word offset. `getCacheLine` checks for a hit, writes back a dirty conflicting block, or fills all four words on a miss. `cacheReader` returns the selected word; `cacheWriter` performs write allocation and marks the line dirty. CPU fetch, indirect lookup, memory instructions, arithmetic memory operands, traps, and front-panel Load/Store use those helpers. The machine-fault handler uses direct RAM access to avoid recursively faulting. `clearCache` resets cache state on Init and after object-file loading; `updateCacheDisplay` renders cache state and hit/miss counters.

| Test | Action | Expected result |
| --- | --- | --- |
| Initialization | Load the simulator or press Init | Eight lines display; all are invalid, clean, and contain zero words. Hit/miss counters are zero. |
| Address mapping | Check addresses 8, 40, and 2047 | Address 8 maps to line 2/tag 0/offset 0. Address 40 maps to line 2/tag 1/offset 0. Address 2047 maps to line 7/tag 63/offset 3. |
| Read miss fills block | Set memory[8..11] to `0x1111`, `0x2222`, `0x3333`, `0x4444`; read address 8 | Line 2 becomes valid with tag 0 and all four words loaded. Dirty is 0. |
| Read hit | Read address 9 after the previous test | The value comes from word slot 1 of line 2. Hit count increments; no other line is replaced. |
| Write allocate | Write `0xAAAA` to address 9 after clearing the cache | Line 2 is filled, slot 1 becomes `0xAAAA`, dirty becomes 1, and main memory[9] remains unchanged. |
| Dirty conflict writeback | With the dirty address-8 block in line 2, read address 40 | The old four words are written to memory[8..11], then line 2 is loaded with tag 1 and the block starting at address 40. New line is clean. |
| Non-conflicting blocks | Read address 8 then address 12 | They occupy lines 2 and 3; both remain valid and the first is not evicted. |
| Front-panel Load/Store | Load MAR with address 8, store an MBR value, then Load it | Cache line 2 becomes dirty on Store; Load returns the cached value even while backing RAM still has the old value. |
| CPU Load/Store | Single-step LDR and STR instructions whose effective addresses are valid | Fetch and data operations populate/update cache lines; STR marks the target line dirty. |
| Display updates | Single-step and use front-panel Load/Store | The cache table updates with valid, tag, four words, and dirty state. |
| Reset | Press Init | Cache lines become invalid and clean, contents clear, and counters reset. |
| Object file load | Load a file after cache lines have been populated | Cache is invalidated after the file is loaded so no stale line hides the new memory contents. |
| Address bounds | Try address -1, 2048, or a non-integer through `calculateCacheAddress` | The cache address helper rejects the input with a range error. |

The direct-mapped line is `floor(address / 4) % 8`; the tag is `floor(floor(address / 4) / 8)`; the word offset is `address % 4`. Dirty data is written back as a complete four-word block when its line is replaced.

# C6461 Cache Simulator Guide and Tests

The cache is embedded in the standalone `Machine_Simulator.html` page. The browser-facing test cases below target that page. See `USER_GUIDE.md` for the console layout and controls.

## Run and use

Open `Machine_Simulator.html` in a browser. The left side is the operator panel: register fields have an **LD** button that loads the current switch word, **Load/Store** access the word at MAR, **St+/Ld+** access and advance MAR, **SS** executes one instruction, **Run** executes repeatedly, **HLT** stops execution, and **Init** clears the machine and opens the object-file loader. The right-side terminal displays I/O.

The cache table appears below the word switches (for easy convenience and viewing state). It shows all eight line indices, valid state, octal tag, four octal words, and dirty state. Hit and miss totals are shown above the table. Single-step and Run refresh it after each instruction; manual memory access, Init, and object-file loading also refresh it.

## Design notes

The cache state and address mapping sit beside the main-memory array in `Machine_Simulator.html`. `calculateCacheAddress` returns block, line index, tag, block start, and word offset. `getCacheLine` checks for a hit, writes back a dirty conflicting block, or fills all four words on a miss. `cacheReader` returns the selected word; `cacheWriter` performs write allocation and marks the line dirty. CPU fetch, indirect lookup, memory instructions, arithmetic memory operands, traps, and front-panel Load/Store use those helpers. The machine-fault handler uses direct RAM access to avoid recursively faulting. `clearCache` resets cache state on Init and after object-file loading; `updateCacheDisplay` renders cache state and hit/miss counters.

The direct-mapped line is `floor(address / 4) % 8`; the tag is `floor(floor(address / 4) / 8)`; the word offset is `address % 4`. Dirty data is written back as a complete four-word block when its line is replaced.

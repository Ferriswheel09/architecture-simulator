# Original and Updated HTML Comparison


| HTML section | Original simulator | Updated simulator | Why it changed |
| --- | --- | --- | --- |
| Cache display, after the word switches | No cache panel or hit/miss counters. | Adds an eight-row table with valid bit, tag, four words, dirty bit, and aggregate hit/miss counts. | Makes each block's state visible while stepping or running the machine, as required by the project. |
| Cache state and addressing, beside main memory | A 2048-word RAM array; no cache metadata or address decomposition. | Adds eight valid/tag/dirty lines, four words per line, and `calculateCacheAddress` for block, line, tag, and offset. | Implements the specified direct-mapped organization with four-word blocks. |
| Front-panel memory Load and Store | Read or write the selected RAM word directly. | `load` calls `cacheReader`; `store` calls `cacheWriter`; both refresh the display. | Ensures operator memory operations use the same cache as CPU memory accesses. |
| Instruction fetch and indirect address lookup | Fetch instructions and indirect pointers directly from RAM. | `fetchInstruction`, `computeEA`, `computeIndexEA`, and `computeLDAEA` use `cacheReader`. | Ensures instruction and pointer reads populate the cache and affect hit/miss totals. |
| Memory instructions and arithmetic operands | LDR, STR, LDX, STX, AMR, and SMR read or write RAM directly. | Their memory reads call `cacheReader`; their writes call `cacheWriter`. | Routes CPU data traffic through the cache; stores allocate on misses and defer RAM updates while dirty. |
| Trap vector and saved return address | Trap reads and writes use RAM directly. | Trap state writes use `cacheWriter`, and table/target reads use `cacheReader`. | Keeps trap memory traffic coherent with the cache. |
| Eviction, reset, and display refresh | No cache eviction, dirty write-back, or cache reset behavior. | `getCacheLine` writes back dirty blocks and fills replacements; `clearCache` resets metadata/counters; `updateCacheDisplay` redraws the table. | Implements write-back/write-allocate semantics and avoids stale cache contents after reset or object load. |
| Test interface | No automated cache harness. | Adds `runCacheHarnessTests` and a parent-only `postMessage` response path; `test/CACHE_TEST_HARNESS.html` presents individual results. | Lets graders run the cache checks by opening an HTML file, including in local-file mode where direct iframe scripting can be restricted. |

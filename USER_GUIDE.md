# C6461 Machine Simulator User Guide

## Launch

Open `Machine_Simulator.html` directly in a modern browser. It is a standalone page and needs no build step or server.

## Console layout

- **Upper left:** GPR 0-3 and IXR 1-3. Enter values in octal, then use the row's **LD** button to load the current word-switch value into that register.
- **Upper right:** PC, MAR, MBR, IR, MFR, and CC. PC, MAR, and MBR have **LD** controls; IR, MFR, and CC show machine state.
- **Control buttons:** **Store** writes MBR to the word addressed by MAR; **St+** stores and increments MAR. **Load** reads the word at MAR into MBR; **Ld+** increments MAR and then reads. **SS** executes one instruction. **Run** starts continuous execution and toggles to **Stop** while running. **HLT** stops execution. **Init** resets the machine and opens the object-file chooser.
- **Word switches:** Sixteen bit switches form a word. The display shows binary and six-digit octal. Use a register's **LD** button to load that switch word into the selected register.
- **Cache table:** Eight lines with valid bit, octal tag, four octal words, and dirty bit. Hit and miss totals appear above it. The table refreshes after instruction steps and front-panel memory operations.
- **Console Terminal:** The right-side terminal is simulated machine I/O, not the browser developer console. Enter a line and select **Send Line** for keyboard input (device 0); device 1 writes printer output here. **Clear** clears the displayed terminal text.

## Loading and running a program

Select **Init**, choose a plain-text `.asm` or `.txt` object file, and wait for the load-complete message. Each nonblank line contains an octal memory address followed by an octal 16-bit word; text after `;` is ignored. Init resets memory and cache before loading. Set PC to the program's starting address with its **LD** button, then use **SS** to inspect individual instructions or **Run** for continuous execution. **HLT** or the Run button's **Stop** action stops execution.

Front-panel values and object-file words are octal. The cache helper functions and backing-memory test values in `CACHE_TESTS.md` use ordinary JavaScript hexadecimal notation.

## Run the HTML test harness

Open `test/CACHE_TEST_HARNESS.html` in a browser and select **Run All Tests**. The page embeds the simulator under test and reports each case as PASS or FAIL. Its 14 checks cover cache mapping, fills, hits, write allocation, dirty write-back, bounds, table display, front-panel access, CPU instruction access, reset, and object-file loading. The runner temporarily changes machine state and restores it afterward. Stop continuous execution before starting the harness.

## Cache behavior

The cache is direct-mapped, with eight lines of four words each. For memory address `a`, the word offset is `a % 4`, line index is `floor(a / 4) % 8`, and tag is `floor(floor(a / 4) / 8)`. Reads fill a full block on a miss. Writes allocate on a miss and mark the line dirty; main memory is updated when a dirty line is evicted. Init and successful object-file loads invalidate cache lines and reset the counters.
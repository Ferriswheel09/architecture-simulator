# C6461 Part I

## Launch and controls

Serve the project folder with VS Code Live Server and open `index.html`.

- **Init** resets the machine and loads the demo at address 128.
- **Single Step** executes one instruction; **Run** executes continuously; **Halt** stops it.
- Load GPR and index-register values with each register's **Load** button. Inputs are decimal by default; `0x`, `0o`, and `0b` prefixes select hexadecimal, octal, or binary. Values wrap to 16 bits.
- Set PC or MAR in the machine-state section and press **Load**.
- To write memory, select MAR, enter the MBR value or set the word switches and load them into MBR, then press **Store Memory**. **Read Memory** loads `memory[MAR]` into MBR.
- The memory table shows the 16 words around MAR. The instruction trace shows recent execution and any error.

## Machine notes

`simulator.mjs` contains the machine, IPL program, and UI. Memory starts at zero and transfers use an address-select phase followed by an MBR read or write. A Step performs one complete fetch/decode/execute. Implemented opcodes are HLT, LDR, STR, LDA, LDX, and STX. Cache, traps, arithmetic, I/O, floating point, and vectors are outside Part I.

The instruction format is opcode[15:10], R[9:8], IX[7:6], I[5], address[4:0]. Opcode numbers in the course tables are octal. LDR/STR/LDA support direct, indexed, indirect, and indexed-indirect addressing. LDX/STX use IX to select X1-X3, so their documented operand format supports direct or indirect effective addresses only. Invalid execution stops and displays an error and MFR code; Part I does not vector machine faults.

## Verification

Run `npm test` with Node.js installed. The automated tests cover initialization, MAR/MBR cycles, 16-bit wrapping, address bounds, instruction addressing, fetch/PC/HLT, and the full IPL demo. In the browser, also check register entry, memory read/write at address 2047, rejection of address 2048, one-step PC/IR changes, Run/Halt, and visible memory updates.
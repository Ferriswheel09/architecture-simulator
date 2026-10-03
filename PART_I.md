# C6461 Part I

## Launch and controls

Serve the project folder with VS Code Live Server and open `index.html`.

- **Init** resets the machine and loads the demo at address 128.
- **Single Step** executes one instruction; **Run** executes continuously; **Halt** stops it.
- Load GPR and index-register values with each register's **Load** button. Inputs are decimal by default; `0x`, `0o`, and `0b` prefixes select hexadecimal, octal, or binary. Values wrap to 16 bits.
- Set PC or MAR in the machine-state section and press **Load**.
- To write memory, select MAR, enter the MBR value or set the word switches and load them into MBR, then press **Store Memory**. **Read Memory** loads `memory[MAR]` into MBR.
- The memory table shows the 16 words around MAR. The instruction trace shows recent execution and any error.
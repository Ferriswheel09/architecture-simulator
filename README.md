# architecture-simulator
A simulation of a machine and the implementation of its respective ISA. 

# Part 1 Details
Project 1 Is to add a simple cache to the simulator.  This will require some code reading and modification of the javascriopt in the html file.
The cache should be a direct mapped cache, with 8 lines of 4 words each.  You are to implement and test yourself.  A display box should be added to the simulator showing cache.  The grader should be able to single step through a program and watch the cache change.  The simulator should display the cache tag, 4 word content, and a dirty bit indicating the cache was written into.  So here a memory block is simply 4 words, with 8 cache blocks.  The cache should be a write back cache and writes should allocate a block.
After the competions of the cache modification complete a test and provide a set of test code with your delievery.  If one single steps through your code, the changes in cache should be evident.
Be sure to develop good test cases.

# Part 2 Details

The deadline has been extended by **1 week and 1 day (8 days)**. The original
calendar deadline was not supplied, so an exact revised date is not assumed.

Program 1 reads and prints 20 signed integers, requests a target, and prints
the closest entered value. Input validation, decimal conversion, printing,
and searching execute as simulated machine instructions, not a host-side search.

1. Open [Machine_Simulator.html](Machine_Simulator.html) in a browser.
2. Select **Load Program 1**, then **Run**.
3. Enter 20 integers in the console, separated by spaces or Enter.
4. At `Target:`, enter the number to search for.

All input values and the target must be in `-32768..32767`. Invalid tokens are
rejected without consuming a valid-number slot. Equal-distance ties keep the
first entered value. **SS** remains available for instruction-by-instruction use.

- [PROGRAM1_DELIVERY.md](PROGRAM1_DELIVERY.md): design, reproducible samples, and screenshots.
- [test/PROGRAM1_TEST_HARNESS.html](test/PROGRAM1_TEST_HARNESS.html): select **Run Tests** for the full suite.
- [programs/Program1.js](programs/Program1.js): reproducible assembly builder.
- [programs/Program1.obj.txt](programs/Program1.obj.txt): octal object file for **Init**; set PC to octal `0400` afterward.
- [GITHUB_SUBMISSION_LOG.md](GITHUB_SUBMISSION_LOG.md): original submission and participation log, preserved unchanged.

Keep the HTML, `programs`, and `test` directories together. No installation,
network access, or development server is required.
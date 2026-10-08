# architecture-simulator
A simulation of a machine and the implementation of its respective ISA. 

# Part 1 Details
Project 1 Is to add a simple cache to the simulator.  This will require some code reading and modification of the javascriopt in the html file.
The cache should be a direct mapped cache, with 8 lines of 4 words each.  You are to implement and test yourself.  A display box should be added to the simulator showing cache.  The grader should be able to single step through a program and watch the cache change.  The simulator should display the cache tag, 4 word content, and a dirty bit indicating the cache was written into.  So here a memory block is simply 4 words, with 8 cache blocks.  The cache should be a write back cache and writes should allocate a block.
After the competions of the cache modification complete a test and provide a set of test code with your delievery.  If one single steps through your code, the changes in cache should be evident.
Be sure to develop good test cases.

Deliverable Content
Your simulator, packaged as a zip file.
Simple documentation describing how to use your simulator, what the console layout is and how to operate it.
Test Cases
Your team’s design notes indicating where in the code changes were made.
GitHub submit logs to show team participation.  (More experienced persons, teach your team how to submit so that their work is credited.)
Be sure to use the file naming conventions provided in the first lecture.
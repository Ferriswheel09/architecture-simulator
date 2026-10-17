"use strict";
const program1Sample = [-32768,-30000,-25000,-18000,-12000,-5000,-1024,-100,-1,0,1,99,1024,4096,8192,15000,22000,28000,31000,32767];
function runProgram1Input(input){
  loadProgram1();
  inputQueue = Array.from(input, character => character.charCodeAt(0));
  let steps = 0;
  while(!halted && steps < 150000){
    const instruction = fetchInstruction();
    if(instruction === null) break;
    executeInstruction(instruction);
    steps++;
    if(waitingForInput) break;
  }
  updateCacheDisplay();
  if(getMFRBits()) throw new Error("Machine fault " + getMFRBits());
  if(steps >= 150000) throw new Error("Instruction limit exceeded");
  return {output:terminalOutput.value, steps, halted, waiting:waitingForInput};
}
function runProgram1Tests(){
  stopRun();
  const results = [];
  function expect(condition, message){ if(!condition) throw new Error(message); }
  function test(name, action){
    try{ results.push({name, passed:true, detail:action() || "Passed"}); }
    catch(error){ results.push({name, passed:false, detail:error.message}); }
  }
  function check(values, target, input){
    const closest = values.reduce((best, value) => Math.abs(value-target) < Math.abs(best-target) ? value : best);
    const result = runProgram1Input(input || values.join(" ") + "\n" + target + "\n");
    expect(result.halted, "Program did not halt");
    expect(result.output.endsWith(`Entered: ${target}\nClosest: ${closest}\n`), result.output);
    const accepted = Array.from(result.output.matchAll(/^Accepted: (-?\d+)$/gm), match => Number(match[1]));
    expect(JSON.stringify(accepted) === JSON.stringify(values), "Printed values differ from accepted input");
    const program = Program1.build();
    const stored = values.map((_, index) => toSigned16(cacheReader(program.arrayBase + index)));
    expect(JSON.stringify(stored) === JSON.stringify(values), "Memory values differ from input");
    return `${result.steps} instructions; target ${target}; closest ${closest}`;
  }
  test("Full signed range, negative target", () => check(program1Sample, -14000));
  test("Exact minimum", () => check(program1Sample, -32768));
  test("Exact maximum", () => check(program1Sample, 32767));
  test("Exact zero", () => check(program1Sample, 0));
  test("Positive nearest", () => check(program1Sample, 30000));
  test("Tie retains first entered value", () => check(program1Sample, 26000));
  test("All negative, distance exceeds signed word", () => check(Array.from({length:20}, (_, index) => -32768 + index*101), 32767));
  test("All positive, opposite endpoint target", () => check(Array.from({length:20}, (_, index) => 30000 + index*100), -32768));
  test("Duplicates and negative zero", () => check(Array(20).fill(0), 0, Array(20).fill("-0").join(" ") + "\n+0\n"));
  test("Signs, leading zeros, tabs and CRLF", () => check(program1Sample, 99,
    program1Sample.map(value => (value < 0 ? "-" : "+") + "000" + Math.abs(value)).join("\t") + "\r\n+0099\r\n"));
  test("Reject malformed and out-of-range tokens", () => {
    const invalid = ["abc","12x","--2","+","-","32768","-32769","999999999999","3.5"];
    const detail = check(program1Sample, -14000, invalid.join(" ") + "\n" + program1Sample.join(" ") + "\n32768 bad -14000\n");
    expect((terminalOutput.value.match(/Invalid integer; retry:/g) || []).length === 11, "Not every invalid token was rejected");
    return detail;
  });
  test("Empty IN waits and preserves register", () => {
    resetMachine(); memory[100] = 0o61 << 10; setPC(100); setGPR(0, 123);
    singleStep();
    expect(getPC() === 100 && getGPR(0) === 123 && waitingForInput, "Empty IN changed state");
    terminalInput.value = "-9"; sendTerminalLine(); singleStep();
    expect(getPC() === 101 && getGPR(0) === 45 && !waitingForInput, "Input did not resume");
  });
  test("Nineteen values wait for twentieth", () => {
    const result = runProgram1Input(program1Sample.slice(0,19).join(" ") + "\n");
    expect(result.waiting && !result.halted && !result.output.includes("Target:"), "Requested target too early");
  });
  test("Twenty values wait for target", () => {
    const result = runProgram1Input(program1Sample.join(" ") + "\n");
    expect(result.waiting && !result.halted && result.output.endsWith("Target:\n"), "Did not wait for target");
  });
  test("Sixty deterministic full-range oracle comparisons", () => {
    let seed = 6461;
    function next(){ seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 16) - 32768; }
    for(let sample = 0; sample < 60; sample++) check(Array.from({length:20}, next), next());
    return "60 machine-code runs agree with independent nearest-value oracle";
  });
  test("Existing cache regression suite", () => {
    const cacheResults = runCacheHarnessTests();
    expect(cacheResults.every(result => result.passed), JSON.stringify(cacheResults.filter(result => !result.passed)));
    return `${cacheResults.length} cache tests passed`;
  });
  return results;
}
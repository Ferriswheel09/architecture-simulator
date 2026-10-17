(function(root){
"use strict";
function buildProgram1(){
  const dataBase = 64;
  const entry = 256;
  const arrayBase = 1800;
  const bufferBase = 1840;
  const variables = {
    zero: 0, one: 1, ten: 10, asciiZero: 48, minus: 45, plus: 43,
    space: 32, newline: 10, tab: 9, cr: 13, limit: 3276,
    count: 0, pointer: arrayBase, target: 0, best: 0, distance: 0,
    candidate: 0, sign: 0, accumulator: 0, digits: 0, character: 0,
    digit: 0, link: 0, work: 0, buffer: bufferBase, bufferStart: bufferBase,
    arrayStart: arrayBase, twenty: 20, minimum: -32768
  };
  const slots = Object.fromEntries(Object.keys(variables).map((name, index) => [name, index]));
  const labels = {};
  const instructions = [];
  const targets = [];
  const opcodes = {HLT:0o00,LDR:0o01,STR:0o02,LDA:0o03,AMR:0o04,SMR:0o05,
    AIR:0o06,SIR:0o07,JZ:0o10,JNE:0o11,JCC:0o12,JMA:0o13,JSR:0o14,
    RFS:0o15,SOB:0o16,JGE:0o17,IN:0o61,OUT:0o62,MLT:0o70,DVD:0o71};
  function mark(name){
    if(name in labels) throw new Error("Duplicate label: " + name);
    labels[name] = entry + instructions.length;
  }
  function emit(opcode, register=0, address=0, index=0, indirect=0){
    instructions.push({opcode, register, address, index, indirect});
  }
  function data(opcode, register, name, indirect=0){
    if(!(name in slots)) throw new Error("Unknown variable: " + name);
    emit(opcode, register, slots[name], 1, indirect);
  }
  function jump(opcode, register, name){
    let slot = targets.indexOf(name);
    if(slot < 0){ slot = targets.length; targets.push(name); }
    if(slot >= 64) throw new Error("Branch table exhausted");
    emit(opcode, register, slot % 32, slot < 32 ? 2 : 3, 1);
  }
  function text(value){
    for(const character of value){
      let code = character.charCodeAt(0);
      emit("LDA", 0, Math.min(code, 31));
      code -= Math.min(code, 31);
      while(code > 0){ emit("AIR", 0, Math.min(code, 31)); code -= Math.min(code, 31); }
      emit("OUT", 0, 1);
    }
  }
  function delimiters(destination){
    for(const name of ["space", "newline", "tab", "cr"]){
      data("LDR", 0, "character"); data("SMR", 0, name); jump("JZ", 0, destination);
    }
    data("LDR", 0, "character");
  }
  emit("LDX", 0, 6, 1);
  emit("LDX", 0, 7, 2);
  emit("LDX", 0, 8, 3);
  text("Enter 20 integers:\n");
  data("LDR", 0, "twenty"); data("STR", 0, "count");
  mark("collect");
  jump("JSR", 0, "readInteger");
  data("LDR", 0, "accumulator"); data("STR", 0, "pointer", 1);
  text("Accepted: ");
  data("LDR", 0, "accumulator"); jump("JSR", 0, "printInteger"); text("\n");
  data("LDR", 0, "pointer"); emit("AIR", 0, 1); data("STR", 0, "pointer");
  data("LDR", 0, "count"); emit("SIR", 0, 1); data("STR", 0, "count");
  jump("JNE", 0, "collect");
  text("Target:\n"); jump("JSR", 0, "readInteger");
  data("LDR", 0, "accumulator"); data("STR", 0, "target");
  text("Entered: "); data("LDR", 0, "target"); jump("JSR", 0, "printInteger"); text("\n");
  data("LDR", 0, "arrayStart"); data("STR", 0, "pointer");
  data("LDR", 0, "pointer", 1); data("STR", 0, "best");
  emit("LDA", 0, 0); emit("SIR", 0, 1); data("STR", 0, "distance");
  data("LDR", 0, "twenty"); data("STR", 0, "count");
  mark("search");
  data("LDR", 0, "pointer", 1); data("STR", 0, "candidate");
  jump("JGE", 0, "candidateNonnegative");
  data("LDR", 0, "target"); jump("JGE", 0, "targetMinusCandidate");
  jump("JMA", 0, "sameSign");
  mark("candidateNonnegative");
  data("LDR", 0, "target"); jump("JGE", 0, "sameSign");
  jump("JMA", 0, "candidateMinusTarget");
  mark("sameSign");
  data("LDR", 0, "candidate"); data("SMR", 0, "target"); jump("JGE", 0, "distanceReady");
  mark("targetMinusCandidate");
  data("LDR", 0, "target"); data("SMR", 0, "candidate"); jump("JMA", 0, "distanceReady");
  mark("candidateMinusTarget");
  data("LDR", 0, "candidate"); data("SMR", 0, "target");
  mark("distanceReady");
  data("STR", 0, "work"); jump("JGE", 0, "distanceLow");
  data("LDR", 0, "distance"); jump("JGE", 0, "nextCandidate");
  jump("JMA", 0, "compareDistance");
  mark("distanceLow");
  data("LDR", 0, "distance"); jump("JGE", 0, "compareDistance");
  jump("JMA", 0, "updateBest");
  mark("compareDistance");
  data("LDR", 0, "work"); data("SMR", 0, "distance"); jump("JGE", 0, "nextCandidate");
  mark("updateBest");
  data("LDR", 0, "work"); data("STR", 0, "distance");
  data("LDR", 0, "candidate"); data("STR", 0, "best");
  mark("nextCandidate");
  data("LDR", 0, "pointer"); emit("AIR", 0, 1); data("STR", 0, "pointer");
  data("LDR", 0, "count"); emit("SIR", 0, 1); data("STR", 0, "count"); jump("JNE", 0, "search");
  text("Closest: "); data("LDR", 0, "best"); jump("JSR", 0, "printInteger"); text("\n"); emit("HLT");

  mark("readInteger");
  data("LDR", 0, "zero"); data("STR", 0, "accumulator"); data("STR", 0, "digits"); data("STR", 0, "sign");
  mark("skipWhitespace");
  emit("IN"); data("STR", 0, "character"); delimiters("skipWhitespace");
  data("SMR", 0, "minus"); jump("JZ", 0, "negativeSign");
  data("LDR", 0, "character"); data("SMR", 0, "plus"); jump("JZ", 0, "readCharacter");
  jump("JMA", 0, "parseDigit");
  mark("negativeSign");
  data("LDR", 0, "one"); data("STR", 0, "sign");
  mark("readCharacter");
  emit("IN"); data("STR", 0, "character"); delimiters("finishInteger");
  mark("parseDigit");
  data("LDR", 0, "character"); data("SMR", 0, "asciiZero"); jump("JGE", 0, "digitNonnegative");
  jump("JMA", 0, "discardToken");
  mark("digitNonnegative");
  data("STR", 0, "digit"); emit("SIR", 0, 10); jump("JGE", 0, "discardToken");
  data("LDR", 0, "accumulator"); data("AMR", 0, "limit"); jump("JGE", 0, "checkLimit");
  jump("JMA", 0, "discardToken");
  mark("checkLimit");
  jump("JNE", 0, "accumulateDigit");
  data("LDR", 0, "digit"); emit("SIR", 0, 7); data("SMR", 0, "sign");
  jump("JZ", 0, "accumulateDigit"); jump("JGE", 0, "discardToken");
  mark("accumulateDigit");
  data("LDR", 0, "accumulator"); data("LDR", 2, "ten"); emit("MLT", 0, 0, 2);
  data("STR", 1, "accumulator"); data("LDR", 0, "accumulator"); data("SMR", 0, "digit"); data("STR", 0, "accumulator");
  data("LDR", 0, "digits"); emit("AIR", 0, 1); data("STR", 0, "digits"); jump("JMA", 0, "readCharacter");
  mark("finishInteger");
  data("LDR", 0, "digits"); jump("JZ", 0, "invalidInteger");
  data("LDR", 0, "sign"); jump("JNE", 0, "integerReady");
  data("LDR", 0, "zero"); data("SMR", 0, "accumulator"); data("STR", 0, "accumulator");
  mark("integerReady"); emit("RFS");
  mark("discardToken");
  emit("IN"); data("STR", 0, "character"); delimiters("invalidInteger"); jump("JMA", 0, "discardToken");
  mark("invalidInteger");
  text("Invalid integer; retry:\n"); jump("JMA", 0, "readInteger");

  mark("printInteger");
  data("STR", 3, "link"); data("STR", 0, "work"); jump("JGE", 0, "printNonnegative");
  data("LDR", 0, "minus"); emit("OUT", 0, 1); jump("JMA", 0, "printMagnitude");
  mark("printNonnegative");
  data("LDR", 0, "zero"); data("SMR", 0, "work"); data("STR", 0, "work");
  mark("printMagnitude");
  data("LDR", 0, "bufferStart"); data("STR", 0, "buffer");
  data("LDR", 0, "zero"); data("STR", 0, "digits");
  mark("divideDigit");
  data("LDR", 0, "work"); data("LDR", 2, "ten"); emit("DVD", 0, 0, 2);
  data("STR", 0, "work"); data("STR", 1, "digit");
  data("LDR", 0, "asciiZero"); data("SMR", 0, "digit"); data("STR", 0, "buffer", 1);
  data("LDR", 0, "buffer"); emit("AIR", 0, 1); data("STR", 0, "buffer");
  data("LDR", 0, "digits"); emit("AIR", 0, 1); data("STR", 0, "digits");
  data("LDR", 0, "work"); jump("JNE", 0, "divideDigit");
  mark("outputDigit");
  data("LDR", 0, "buffer"); emit("SIR", 0, 1); data("STR", 0, "buffer");
  data("LDR", 0, "buffer", 1); emit("OUT", 0, 1);
  data("LDR", 0, "digits"); emit("SIR", 0, 1); data("STR", 0, "digits"); jump("JNE", 0, "outputDigit");
  data("LDR", 3, "link"); emit("RFS");

  opcodes.LDX = 0o41;
  if(entry + instructions.length > arrayBase) throw new Error("Program overlaps input array");
  if(Object.keys(variables).length > 32) throw new Error("Data bank exhausted");
  const image = [[6, dataBase], [7, 128], [8, 160]];
  Object.entries(variables).forEach(([name, value]) => image.push([dataBase + slots[name], value & 0xFFFF]));
  targets.forEach((name, index) => {
    if(!(name in labels)) throw new Error("Undefined label: " + name);
    image.push([128 + index, labels[name]]);
  });
  const listing = instructions.map((instruction, offset) => {
    const {opcode, register, address, index, indirect} = instruction;
    const word = (opcodes[opcode] << 10) | (register << 8) | (index << 6) | (indirect << 5) | address;
    const location = entry + offset;
    image.push([location, word]);
    return {address: location, word, instruction: `${opcode} ${register},${index},${indirect},${address}`};
  });
  const octal = (value, width) => value.toString(8).padStart(width, "0");
  const objectText = image.map(([address, word]) => `${octal(address, 4)} ${octal(word, 6)}`).join("\n") + "\n";
  return {entry, image, listing, labels, objectText, arrayBase, dataBase, slots};
}
const api = {build: buildProgram1};
if(typeof module !== "undefined" && module.exports) module.exports = api;
else root.Program1 = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
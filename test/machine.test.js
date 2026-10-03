import test from 'node:test';
import assert from 'node:assert/strict';
import {
  C6461Machine,
  MEMORY_SIZE,
  OPCODES,
  createDemoMachine,
  encodeIndexInstruction,
  encodeMemoryInstruction,
} from '../simulator.mjs';

function runInstruction(machine, instruction, address = 100) {
  machine.writeAt(address, instruction);
  machine.setPC(address);
  return machine.step();
}

test('initializes 2048 zeroed words and zeroed registers', () => {
  const machine = new C6461Machine();
  assert.equal(machine.memory.length, MEMORY_SIZE);
  assert.ok(machine.memory.every((word) => word === 0));
  assert.ok(machine.registers.every((word) => word === 0));
  assert.ok(machine.indexRegisters.every((word) => word === 0));
  assert.equal(machine.PC, 0);
});

test('memory access uses MAR then MBR phases and masks words to 16 bits', () => {
  const machine = new C6461Machine();
  machine.writeAt(12, -1);
  assert.equal(machine.peekMemory(12), 0xffff);
  machine.selectMemoryAddress(12);
  assert.equal(machine.MAR, 12);
  assert.equal(machine.completeMemoryRead(), 0xffff);
  assert.equal(machine.MBR, 0xffff);
  assert.equal(machine.memoryCycles, 4);
});

test('rejects addresses outside installed memory', () => {
  const machine = new C6461Machine();
  assert.throws(() => machine.selectMemoryAddress(MEMORY_SIZE), RangeError);
  assert.throws(() => machine.setPC(MEMORY_SIZE), RangeError);
});

test('LDR supports direct, indexed, indirect, and indexed-indirect addressing', () => {
  const machine = new C6461Machine();
  machine.writeAt(20, 0x1234);
  machine.writeAt(33, 0x2345);
  machine.writeAt(34, 0x3456);
  machine.writeAt(35, 0x4567);
  machine.writeAt(21, 40);
  machine.writeAt(40, 0x3456);
  machine.writeAt(41, 0x5678);
  machine.writeAt(42, 0x6789);
  machine.setIndexRegister(1, 13);
  machine.setIndexRegister(2, 14);
  machine.setIndexRegister(3, 15);

  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDR, 0, 0, false, 20)).ok, true);
  assert.equal(machine.registers[0], 0x1234);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDR, 1, 1, false, 20)).ok, true);
  assert.equal(machine.registers[1], 0x2345);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDR, 2, 0, true, 21)).ok, true);
  assert.equal(machine.registers[2], 0x3456);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDR, 0, 2, false, 20)).ok, true);
  assert.equal(machine.registers[0], 0x3456);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDR, 1, 3, false, 20)).ok, true);
  assert.equal(machine.registers[1], 0x4567);
  machine.writeAt(35, 42);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDR, 2, 1, true, 22)).ok, true);
  assert.equal(machine.registers[2], 0x6789);
});

test('STR and LDA apply the final effective address for each supported mode', () => {
  const machine = new C6461Machine();
  machine.setIndexRegister(2, 8);
  machine.setIndexRegister(3, 9);
  machine.setRegister(0, 0xabcd);
  machine.writeAt(30, 50);
  machine.writeAt(32, 51);
  machine.writeAt(11, 52);

  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.STR, 0, 0, false, 22)).ok, true);
  assert.equal(machine.peekMemory(22), 0xabcd);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.STR, 0, 2, false, 23)).ok, true);
  assert.equal(machine.peekMemory(31), 0xabcd);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.STR, 0, 0, true, 30)).ok, true);
  assert.equal(machine.peekMemory(50), 0xabcd);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.STR, 0, 2, true, 24)).ok, true);
  assert.equal(machine.peekMemory(51), 0xabcd);

  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDA, 1, 0, false, 22)).ok, true);
  assert.equal(machine.registers[1], 22);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDA, 2, 2, false, 22)).ok, true);
  assert.equal(machine.registers[2], 30);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDA, 3, 0, true, 30)).ok, true);
  assert.equal(machine.registers[3], 50);
  assert.equal(runInstruction(machine, encodeMemoryInstruction(OPCODES.LDA, 0, 3, true, 2)).ok, true);
  assert.equal(machine.registers[0], 52);
});

test('LDX and STX use the X selector field and support direct or indirect EA', () => {
  const machine = new C6461Machine();
  machine.writeAt(10, 0x1001);
  machine.writeAt(11, 60);
  machine.writeAt(13, 0x3003);
  machine.writeAt(60, 0x2002);

  assert.equal(runInstruction(machine, encodeIndexInstruction(OPCODES.LDX, 1, false, 10)).ok, true);
  assert.equal(machine.indexRegisters[1], 0x1001);
  assert.equal(runInstruction(machine, encodeIndexInstruction(OPCODES.LDX, 2, true, 11)).ok, true);
  assert.equal(machine.indexRegisters[2], 0x2002);
  assert.equal(runInstruction(machine, encodeIndexInstruction(OPCODES.STX, 1, false, 12)).ok, true);
  assert.equal(machine.peekMemory(12), 0x1001);
  assert.equal(runInstruction(machine, encodeIndexInstruction(OPCODES.STX, 2, true, 11)).ok, true);
  assert.equal(machine.peekMemory(60), 0x2002);
  assert.equal(runInstruction(machine, encodeIndexInstruction(OPCODES.LDX, 3, false, 13)).ok, true);
  assert.equal(machine.indexRegisters[3], 0x3003);
  assert.equal(runInstruction(machine, encodeIndexInstruction(OPCODES.STX, 3, false, 14)).ok, true);
  assert.equal(machine.peekMemory(14), 0x3003);
});

test('fetch updates IR and PC, and HLT stops the machine', () => {
  const machine = new C6461Machine();
  machine.writeAt(7, encodeMemoryInstruction(OPCODES.LDA, 0, 0, false, 9));
  machine.writeAt(8, 0);
  machine.setPC(7);

  assert.equal(machine.step().ok, true);
  assert.equal(machine.IR, encodeMemoryInstruction(OPCODES.LDA, 0, 0, false, 9));
  assert.equal(machine.PC, 8);
  assert.equal(machine.registers[0], 9);
  assert.equal(machine.step().ok, true);
  assert.equal(machine.status, 'halted');
  assert.equal(machine.PC, 9);
});

test('IPL demo executes all Part I instructions and halts', () => {
  const machine = createDemoMachine();
  assert.equal(machine.PC, 128);
  for (let step = 0; step < 20; step += 1) assert.equal(machine.step().ok, true);
  assert.equal(machine.status, 'halted');
  assert.equal(machine.PC, 148);
});

export const MEMORY_SIZE = 2048;
export const WORD_MASK = 0xffff;
export const ADDRESS_MASK = 0x0fff;

export const OPCODES = Object.freeze({
  HLT: 0o00,
  LDR: 0o01,
  STR: 0o02,
  LDA: 0o03,
  LDX: 0o41,
  STX: 0o42,
});

export function encodeMemoryInstruction(opcode, register, index, indirect, address) {
  return ((opcode & 0x3f) << 10)
    | ((register & 0x03) << 8)
    | ((index & 0x03) << 6)
    | ((indirect ? 1 : 0) << 5)
    | (address & 0x1f);
}

export function encodeIndexInstruction(opcode, indexRegister, indirect, address) {
  return ((opcode & 0x3f) << 10)
    | ((indexRegister & 0x03) << 6)
    | ((indirect ? 1 : 0) << 5)
    | (address & 0x1f);
}

export class C6461Machine {
  constructor() {
    this.memory = new Uint16Array(MEMORY_SIZE);
    this.registers = new Uint16Array(4);
    this.indexRegisters = new Uint16Array(4);
    this.PC = 0;
    this.IR = 0;
    this.MAR = 0;
    this.MBR = 0;
    this.MFR = 0;
    this.CC = 0;
    this.status = 'ready';
    this.memoryPhase = 'idle';
    this.memoryCycles = 0;
    this.lastError = '';
  }

  setPC(value) {
    this.PC = this.validateAddress(value);
  }

  setRegister(register, value) {
    if (!Number.isInteger(register) || register < 0 || register > 3) {
      throw new RangeError('General register must be R0 through R3.');
    }
    this.registers[register] = this.normalizeWord(value);
  }

  setIndexRegister(register, value) {
    if (!Number.isInteger(register) || register < 1 || register > 3) {
      throw new RangeError('Index register must be X1 through X3.');
    }
    this.indexRegisters[register] = this.normalizeWord(value);
  }

  normalizeWord(value) {
    const numericValue = Number(value);
    if (!Number.isInteger(numericValue)) {
      throw new TypeError('Word value must be an integer.');
    }
    return numericValue & WORD_MASK;
  }

  validateAddress(address) {
    if (!Number.isInteger(address) || address < 0 || address >= MEMORY_SIZE) {
      throw new RangeError(`Memory address must be between 0 and ${MEMORY_SIZE - 1}.`);
    }
    return address;
  }

  // A memory access selects MAR first, then transfers data through MBR.
  selectMemoryAddress(address) {
    this.MAR = this.validateAddress(address);
    this.memoryPhase = 'selected';
    this.memoryCycles += 1;
  }

  completeMemoryRead() {
    if (this.memoryPhase !== 'selected') {
      throw new Error('Select a memory address before reading.');
    }
    this.MBR = this.memory[this.MAR];
    this.memoryPhase = 'idle';
    this.memoryCycles += 1;
    return this.MBR;
  }

  completeMemoryWrite() {
    if (this.memoryPhase !== 'selected') {
      throw new Error('Select a memory address before writing.');
    }
    this.memory[this.MAR] = this.MBR & WORD_MASK;
    this.memoryPhase = 'idle';
    this.memoryCycles += 1;
    return this.MBR;
  }

  readAt(address) {
    this.selectMemoryAddress(address);
    return this.completeMemoryRead();
  }

  writeAt(address, value) {
    this.MBR = this.normalizeWord(value);
    this.selectMemoryAddress(address);
    return this.completeMemoryWrite();
  }

  peekMemory(address) {
    return this.memory[this.validateAddress(address)];
  }

  // IX adds its selected X register before an optional pointer lookup.
  calculateEffectiveAddress(index, indirect, address) {
    let effectiveAddress = address;
    if (index !== 0) effectiveAddress += this.indexRegisters[index];
    this.validateAddress(effectiveAddress);
    if (indirect) {
      effectiveAddress = this.readAt(effectiveAddress);
      this.validateAddress(effectiveAddress);
    }
    return effectiveAddress;
  }

  fetch() {
    const instructionAddress = this.validateAddress(this.PC);
    this.IR = this.readAt(instructionAddress);
    this.PC = (this.PC + 1) & ADDRESS_MASK;
    return this.IR;
  }

  // One step is one complete fetch, decode, and execute operation.
  step() {
    if (this.status === 'halted' || this.status === 'fault') {
      return { ok: false, error: this.lastError || 'Machine is stopped.' };
    }

    this.lastError = '';
    try {
      const instruction = this.fetch();
      this.execute(instruction);
      if (this.status !== 'halted') this.status = 'ready';
      return { ok: true, instruction };
    } catch (error) {
      this.lastError = error.message;
      this.status = 'fault';
      this.MFR = error instanceof RangeError ? 0b1000 : 0b0100;
      return { ok: false, error: this.lastError };
    }
  }

  execute(instruction) {
    const opcode = (instruction >>> 10) & 0x3f;
    const register = (instruction >>> 8) & 0x03;
    const index = (instruction >>> 6) & 0x03;
    const indirect = ((instruction >>> 5) & 1) !== 0;
    const address = instruction & 0x1f;

    if (opcode === OPCODES.HLT) {
      this.status = 'halted';
      return;
    }

    if (opcode === OPCODES.LDR || opcode === OPCODES.STR || opcode === OPCODES.LDA) {
      const effectiveAddress = this.calculateEffectiveAddress(index, indirect, address);
      if (opcode === OPCODES.LDR) this.registers[register] = this.readAt(effectiveAddress);
      else if (opcode === OPCODES.STR) this.writeAt(effectiveAddress, this.registers[register]);
      else this.registers[register] = effectiveAddress;
      return;
    }

    if (opcode === OPCODES.LDX || opcode === OPCODES.STX) {
      // IX selects X here, so these instructions have no separate EA index.
      if (index === 0) throw new RangeError('LDX/STX require X1, X2, or X3.');
      const effectiveAddress = this.calculateEffectiveAddress(0, indirect, address);
      if (opcode === OPCODES.LDX) this.indexRegisters[index] = this.readAt(effectiveAddress);
      else this.writeAt(effectiveAddress, this.indexRegisters[index]);
      return;
    }

    throw new Error(`Unsupported Part I opcode ${opcode.toString(8).padStart(2, '0')}.`);
  }

  halt() {
    if (this.status === 'running') this.status = 'ready';
  }
}

export const DEMO_START = 128;

export function loadDemo(machine) {
  const program = [
    encodeIndexInstruction(OPCODES.LDX, 1, false, 23),
    encodeIndexInstruction(OPCODES.LDX, 2, false, 24),
    encodeIndexInstruction(OPCODES.LDX, 3, false, 25),
    encodeMemoryInstruction(OPCODES.LDR, 0, 0, false, 27),
    encodeMemoryInstruction(OPCODES.LDR, 1, 1, false, 0),
    encodeMemoryInstruction(OPCODES.LDR, 2, 0, true, 28),
    encodeMemoryInstruction(OPCODES.LDR, 3, 1, true, 1),
    encodeMemoryInstruction(OPCODES.STR, 0, 0, false, 29),
    encodeMemoryInstruction(OPCODES.STR, 0, 2, false, 0),
    encodeMemoryInstruction(OPCODES.STR, 0, 0, true, 28),
    encodeMemoryInstruction(OPCODES.STR, 0, 2, true, 2),
    encodeMemoryInstruction(OPCODES.LDA, 0, 0, false, 27),
    encodeMemoryInstruction(OPCODES.LDA, 1, 3, false, 1),
    encodeMemoryInstruction(OPCODES.LDA, 2, 0, true, 28),
    encodeMemoryInstruction(OPCODES.LDA, 3, 1, true, 2),
    encodeIndexInstruction(OPCODES.LDX, 1, false, 23),
    encodeIndexInstruction(OPCODES.LDX, 3, true, 28),
    encodeIndexInstruction(OPCODES.STX, 1, false, 30),
    encodeIndexInstruction(OPCODES.STX, 2, true, 28),
    OPCODES.HLT << 10,
  ];

  machine.writeAt(23, 64);
  machine.writeAt(24, 70);
  machine.writeAt(25, 76);
  machine.writeAt(27, 0x1111);
  machine.writeAt(28, 64);
  machine.writeAt(29, 0);
  machine.writeAt(30, 0);
  machine.writeAt(65, 90);
  machine.writeAt(66, 92);
  machine.writeAt(72, 91);
  machine.writeAt(77, 93);
  machine.writeAt(64, 0x2222);
  machine.writeAt(70, 0x3333);
  machine.writeAt(76, 0x4444);
  machine.writeAt(90, 0x5555);
  machine.writeAt(91, 0x6666);
  machine.writeAt(92, 0x7777);
  machine.writeAt(93, 0x8888);
  program.forEach((instruction, offset) => machine.writeAt(DEMO_START + offset, instruction));
  machine.setPC(DEMO_START);
  machine.status = 'ready';
  return program.length;
}

export function createDemoMachine() {
  const machine = new C6461Machine();
  loadDemo(machine);
  return machine;
}

if (typeof document !== 'undefined') {
let machine = new C6461Machine();
let running = false;
let runTimer = null;
let instructionCount = 0;
let switchWord = 0;
const trace = [];
const $ = (selector) => document.querySelector(selector);
const registerList = $('#register-list');

function parseInteger(text) {
  const value = text.trim();
  const sign = value.startsWith('-') ? -1 : 1;
  if (/^-?0x[\da-f]+$/i.test(value)) return sign * Number.parseInt(value.replace(/^-?0x/i, ''), 16);
  if (/^-?0o[0-7]+$/i.test(value)) return sign * Number.parseInt(value.replace(/^-?0o/i, ''), 8);
  if (/^-?0b[01]+$/i.test(value)) return sign * Number.parseInt(value.replace(/^-?0b/i, ''), 2);
  if (!/^-?\d+$/.test(value)) throw new TypeError('Enter an integer, optionally prefixed with 0x, 0o, or 0b.');
  return Number(value);
}

function octal(value, width = 6) {
  return (value >>> 0).toString(8).padStart(width, '0');
}

function signedWord(value) {
  return value & 0x8000 ? value - 0x10000 : value;
}

function showError(message = '') {
  $('#error-message').textContent = message;
}

function setStatus(status) {
  const statusBox = $('.machine-status');
  statusBox.classList.toggle('running', status === 'RUNNING');
  statusBox.classList.toggle('fault', status === 'FAULT');
  $('#status-text').textContent = status.toUpperCase();
}

function buildRegisterInputs() {
  const definitions = [
    ...Array.from({ length: 4 }, (_, register) => ({ label: `R${register}`, kind: 'general', register })),
    ...Array.from({ length: 3 }, (_, offset) => ({ label: `X${offset + 1}`, kind: 'index', register: offset + 1 })),
  ];
  registerList.innerHTML = definitions.map(({ label, kind, register }) => `
    <form class="register-row" data-kind="${kind}" data-register="${register}">
      <label class="register-name" for="input-${label}">${label}</label>
      <span class="register-value" id="value-${label}">000000</span>
      <input id="input-${label}" aria-label="Value for ${label}" inputmode="numeric" value="0">
      <button type="submit">LD</button>
    </form>`).join('');
  registerList.addEventListener('submit', (event) => {
    event.preventDefault();
    const row = event.target.closest('.register-row');
    try {
      const value = parseInteger(row.querySelector('input').value);
      if (row.dataset.kind === 'general') machine.setRegister(Number(row.dataset.register), value);
      else machine.setIndexRegister(Number(row.dataset.register), value);
      showError();
      render();
    } catch (error) {
      showError(error.message);
    }
  });
}

function buildSwitches() {
  $('#bit-switches').innerHTML = Array.from({ length: 16 }, (_, offset) => 15 - offset)
    .map((bit) => `<button class="bit-switch" type="button" data-bit="${bit}" aria-pressed="false">0</button>`)
    .join('');
}

function renderSwitches() {
  $('#switch-binary').textContent = switchWord.toString(2).padStart(16, '0');
  $('#switch-octal').textContent = octal(switchWord);
  document.querySelectorAll('.bit-switch').forEach((button) => {
    const isOn = (switchWord & (1 << Number(button.dataset.bit))) !== 0;
    button.textContent = isOn ? '1' : '0';
    button.classList.toggle('on', isOn);
    button.setAttribute('aria-pressed', String(isOn));
  });
}

function renderRegisters() {
  machine.registers.forEach((value, register) => {
    $(`#value-R${register}`).textContent = octal(value);
    $(`#value-R${register}`).title = `${value} unsigned / ${signedWord(value)} signed`;
    $(`#input-R${register}`).value = String(signedWord(value));
  });
  for (let register = 1; register <= 3; register += 1) {
    const value = machine.indexRegisters[register];
    $(`#value-X${register}`).textContent = octal(value);
    $(`#value-X${register}`).title = `${value} unsigned / ${signedWord(value)} signed`;
    $(`#input-X${register}`).value = String(signedWord(value));
  }
  $('#pc-input').value = String(machine.PC);
  $('#ir-value').textContent = octal(machine.IR);
  $('#mar-value').textContent = octal(machine.MAR, 4);
  $('#mbr-value').textContent = octal(machine.MBR);
  $('#mfr-value').textContent = machine.MFR.toString(2).padStart(4, '0');
  $('#cc-value').textContent = machine.CC.toString(2).padStart(4, '0');
  $('#mar-contents').textContent = octal(machine.peekMemory(machine.MAR));
  $('#memory-address').value = String(machine.MAR);
  $('#memory-value').value = String(signedWord(machine.MBR));
  $('#memory-phase').textContent = machine.memoryPhase === 'selected' ? 'Selected · transfer pending' : 'Ready';
}

function renderMemory() {
  const start = Math.max(0, Math.min(MEMORY_SIZE - 16, Math.floor(machine.MAR / 16) * 16));
  const rows = [];
  for (let address = start; address < Math.min(start + 16, MEMORY_SIZE); address += 1) {
    const value = machine.peekMemory(address);
    rows.push(`<tr class="${address === machine.MAR ? 'current-address' : ''}"><td>${String(address).padStart(4, '0')}</td><td>${octal(value)}</td><td>${signedWord(value)}</td></tr>`);
  }
  $('#memory-rows').innerHTML = rows.join('');
}

function renderTrace() {
  $('#step-count').textContent = `${instructionCount} steps`;
  $('#trace-list').innerHTML = trace.length
    ? trace.map((item) => `<li><span>${octal(item.pc, 4)}</span><span>${octal(item.ir)}</span><span>${item.text}</span></li>`).join('')
    : '<li class="trace-empty">Use Init to load the demonstration.</li>';
}

function render() {
  renderRegisters();
  renderSwitches();
  renderMemory();
  renderTrace();
  const status = running ? 'RUNNING' : machine.status === 'fault' ? 'FAULT' : machine.status.toUpperCase();
  setStatus(status);
  $('#run-button').disabled = running || machine.status === 'fault' || machine.status === 'halted';
  $('#step-button').disabled = running || machine.status === 'fault' || machine.status === 'halted';
  $('#halt-button').disabled = !running;
}

function instructionName(word) {
  const opcodes = new Map([[0o00, 'HLT'], [0o01, 'LDR'], [0o02, 'STR'], [0o03, 'LDA'], [0o41, 'LDX'], [0o42, 'STX']]);
  const opcode = (word >>> 10) & 0x3f;
  const register = (word >>> 8) & 0x03;
  const index = (word >>> 6) & 0x03;
  const indirect = (word >>> 5) & 1;
  const address = word & 0x1f;
  const name = opcodes.get(opcode) || `OP ${opcode.toString(8)}`;
  if (opcode === 0o00) return name;
  if (opcode === 0o41 || opcode === 0o42) return `${name} X${index}, ${address}${indirect ? ', I' : ''}`;
  return `${name} R${register}, X${index}, ${address}${indirect ? ', I' : ''}`;
}

function stepOnce() {
  const address = machine.PC;
  const result = machine.step();
  if (!result.ok) {
    running = false;
    clearInterval(runTimer);
    showError(result.error);
    render();
    return false;
  }
  instructionCount += 1;
  trace.unshift({ pc: address, ir: result.instruction, text: instructionName(result.instruction) });
  if (trace.length > 80) trace.pop();
  if (machine.status === 'halted') {
    running = false;
    clearInterval(runTimer);
  }
  render();
  return machine.status !== 'halted';
}

function stopRun() {
  running = false;
  clearInterval(runTimer);
  machine.halt();
  render();
}

buildRegisterInputs();
buildSwitches();
$('#bit-switches').addEventListener('click', (event) => {
  const bit = event.target.closest('[data-bit]');
  if (!bit) return;
  switchWord ^= 1 << Number(bit.dataset.bit);
  renderSwitches();
});
$('#load-switches').addEventListener('click', () => {
  machine.MBR = switchWord;
  render();
});
$('#ipl-button').addEventListener('click', () => {
  stopRun();
  machine = new C6461Machine();
  switchWord = 0;
  loadDemo(machine);
  instructionCount = 0;
  trace.length = 0;
  showError(`Demo loaded at ${DEMO_START}.`);
  render();
});
$('#step-button').addEventListener('click', () => {
  showError();
  stepOnce();
});
$('#run-button').addEventListener('click', () => {
  if (machine.status === 'halted' || machine.status === 'fault') return;
  running = true;
  showError();
  render();
  runTimer = setInterval(() => {
    if (!stepOnce()) stopRun();
  }, 180);
});
$('#halt-button').addEventListener('click', stopRun);
$('#pc-form').addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    machine.setPC(parseInteger($('#pc-input').value));
    machine.status = 'ready';
    showError();
    render();
  } catch (error) {
    showError(error.message);
  }
});
$('#select-address').addEventListener('click', () => {
  try {
    machine.selectMemoryAddress(parseInteger($('#memory-address').value));
    showError();
    render();
  } catch (error) {
    showError(error.message);
  }
});
$('#read-memory').addEventListener('click', () => {
  try {
    machine.completeMemoryRead();
    showError();
    render();
  } catch (error) {
    showError(error.message);
  }
});
$('#load-mbr').addEventListener('click', () => {
  try {
    machine.MBR = machine.normalizeWord(parseInteger($('#memory-value').value));
    showError();
    render();
  } catch (error) {
    showError(error.message);
  }
});
$('#write-memory').addEventListener('click', () => {
  try {
    machine.completeMemoryWrite();
    showError();
    render();
  } catch (error) {
    showError(error.message);
  }
});

render();
}
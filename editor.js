const type = {REG: "REG", GP_REG: "GP_REG", CST: "CST", REGI: "REGI", CSTI: "CSTI"};
const INSTRUCTIONS = [
	{oper: "PUSH", args: [type.GP_REG],            prefix: "100010"},
	{oper: "POP",  args: [type.GP_REG],            prefix: "100011"},
	{oper: "INC",  args: [type.GP_REG],            prefix: "100001"},
	{oper: "DEC",  args: [type.GP_REG],            prefix: "100100"},
	{oper: "ADD",  args: [type.GP_REG],            prefix: "100101"},
	{oper: "SUB",  args: [type.GP_REG],            prefix: "100110"},
	{oper: "NEG",  args: [],                       prefix: "10101111"},
	{oper: "SRL",  args: [],                       prefix: "10110000"},
	{oper: "SRA",  args: [],                       prefix: "10110001"},
	{oper: "SLA",  args: [],                       prefix: "10110010"},
	{oper: "NOP",  args: [],                       prefix: "00000000"},
	{oper: "RET",  args: [],                       prefix: "10110101"},
	{oper: "CALL", args: [type.CST],               prefix: "10110100"},
	{oper: "DJNZ", args: [type.CST],               prefix: "10110110"},
	{oper: "AND",  args: [type.GP_REG],            prefix: "101000"},
	{oper: "AND",  args: [type.CST],               prefix: "10101100"},
	{oper: "OR",   args: [type.GP_REG],            prefix: "101001"},
	{oper: "OR",   args: [type.CST],               prefix: "10101101"},
	{oper: "XOR",  args: [type.GP_REG],            prefix: "101010"},
	{oper: "XOR",  args: [type.CST],               prefix: "10101110"},
	{oper: "JUMP", args: [type.CST],               prefix: "10110111"},
	{oper: "JUMP", args: [type.COND, type.CST],    prefix: "101110"},
	{oper: "LD",   args: [type.REG, type.REG],     prefix: "11"},
	{oper: "LD",   args: [type.REGI, type.GP_REG], prefix: "010"},
	{oper: "LD",   args: [type.GP_REG, type.REGI], prefix: "011"},
	{oper: "LD",   args: [type.GP_REG, type.CST],  prefix: "100000"},
	{oper: "LD",   args: [type.CSTI, type.GP_REG], prefix: "001000"},
	{oper: "LD",   args: [type.GP_REG, type.CSTI], prefix: "001001"},
];
const GP_REG_ENC = {"A": "00", "B": "01", "C": "10", "D": "11"};
const REG_ENC = {"A": "001", "B": "010", "C": "011", "D": "100", "F": "101", "PC": "110", "SP": "111"};
const GP_REG_DEC = {"00": "A", "01": "B", "10": "C", "11": "D"};
const REG_DEC = {"001": "A", "010": "B", "011": "C", "100": "D", "101": "F", "110": "PC", "111": "SP"};

var registers = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0, "PC": 0, "SP": 127};

var memory = {data: null, inst: null};

function updateRegisters() {
	if (document.getElementById("PC_Cursor")) {
		document.getElementById("PC_Cursor").id = null;
	}
	if (document.getElementById("SP_Cursor")) {
		document.getElementById("SP_Cursor").id = null;
	}
	for (var reg in registers) {
		document.getElementById(reg).innerHTML = toHex(registers[reg].toString(16));
	}
	var cpu = document.getElementById("cpu");
	cpu.children[registers["PC"] % 16 + 1].children[Math.floor(registers["PC"] / 16 + 1)].id = "PC_Cursor";
	cpu.children[registers["SP"] % 16 + 1].children[Math.floor(registers["SP"] / 16 + 1)].id = "SP_Cursor";
}

function step() {
	var cpu = document.getElementById("cpu");
	var inst = parseInt(cpu.children[registers["PC"] % 16 + 1].children[Math.floor(registers["PC"] / 16 + 1)].innerHTML.substring(1), 16).toString(2);
	for (var i = inst.length; i < 8; i++)
		inst = "0" + inst;
	registers["PC"]++;
	var next = parseInt(cpu.children[registers["PC"] % 16 + 1].children[Math.floor(registers["PC"] / 16 + 1)].innerHTML.substring(1), 16);
	console.log(inst);
	if (inst === "00000000") { // NOP

	} if (inst.startsWith("11")) { // LD reg,reg
		registers[REG_DEC[inst.substr(2,3)]] = registers[REG_DEC[inst.substr(5,3)]];
	} else if (inst.startsWith("100000")) { // LD reg,cst
		registers[GP_REG_DEC[inst.substr(6,2)]] = next;
		registers["PC"]++;
	}
	updateRegisters();
}

function stop() {
	
	registers = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0, "PC": 0, "SP": 0x7F};
	updateRegisters();
}

function flash(src) {
	console.log("assembling");
	memory.data = new Array(128);
	memory.data.fill("-");

	var lines = src.split("\n");
	var locCounter = 0;
	lines.forEach(function(line) {
		if (line.includes(";")) {
			line = line.substring(0, line.indexOf(";"));
		}

		line = line.toUpperCase().trim();
		if (!line)
			return;
		var oper;
		var args = [];
		var argVals = [];
		if (line.includes(" ")) {
			oper = line.substring(0,line.indexOf(" "));
			argVals = line.substring(line.indexOf(" ")).trim().split(",");
			for (var i = 0; i < argVals.length; i++) {
				argVals[i] = argVals[i].trim();
				if (!isNaN(parseInt(argVals[i], 10))) {
					args[i] = type.CST;
				} else if (argVals[i] === "A" || argVals[i] === "B" || argVals[i] === "C" || argVals[i] === "D") {
					args[i] = type.GP_REG;
				} else if (argVals[i] === "F" || argVals[i] === "PC" || argVals[i] === "SP") {
					args[i] = type.REG;
				} else if (argVals[i].startsWith("(") && argVals[i].endsWith(")")) {
					argVals[i] = argVals[i].substr(1,argVals[i].length - 2);
					if (argVals[i] === "A" || argVals[i] === "B" || argVals[i] === "C" || argVals[i] === "D" || argVals[i] === "F" || argVals[i] === "PC" || argVals[i] === "SP") {
						args[i] = type.REGI;
					} else if (!isNaN(parseInt(argVals[i], 10))) {
						args[i] = type.CSTI;
					}
				}
			}
		} else {
			oper = line;	
		}

		// Check and execute assembler directives
		if (oper === ".ORG" && argMatch([type.CST], args)) {
			locCounter = parseInt(argVals[0], 10);
			return;
		} else if (oper === ".BYTE" && argMatch([type.CST], args)) {
			memory.data[locCounter++] = parseInt(argVals[0], 10).toString(2);
			return;
		}
		INSTRUCTIONS.forEach(function(inst) {
			if (oper === inst.oper && argMatch(inst.args, args)) {
				console.log(locCounter + ": " + oper + " " + argVals + " | " + args);
				var instCode = inst.prefix;
				var constant = "";
				for (var i = 0; i < args.length; i++) {
					if (inst.args[i] === type.CST || inst.args[i] === type.CSTI) {
						constant = argVals[i];
					} else if (inst.args[i] === type.REG || inst.args[i] == type.REGI) {
						instCode += REG_ENC[argVals[i]];
					} else if (inst.args[i] === type.GP_REG) {
						instCode += GP_REG_ENC[argVals[i]];
					}
				}
				memory.data[locCounter++] = instCode;
				if (constant !== "") {
					memory.data[locCounter++] = parseInt(constant,10).toString(2);
				}
				return;
			}
		});
	});

	var cpu = document.getElementById("cpu");
	for (var i = 0; i < memory.data.length; i++) {
		if (memory.data[i] === "-") {
			cpu.children[i % 16 + 1].children[Math.floor(i / 16 + 1)].innerHTML = "-";
		} else {
			cpu.children[i % 16 + 1].children[Math.floor(i / 16 + 1)].innerHTML = toHex(parseInt(memory.data[i], 2)).toUpperCase();
		}
	}
}

function argMatch(a, b) {
	if (a.length != b.length) return false;
	for (var i = 0; i < a.length; i++) {
		if (a[i] !== b[i] && !(a[i] === type.REG && b[i] === type.GP_REG))
			return false;
	}
	return true;
}

function toHex(a) {
	a = a.toString(16);
	if (a.length === 1)
		a = "0" + a;
	return "$" + a;
}

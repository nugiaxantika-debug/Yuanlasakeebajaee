const body = ".kartusulap  ";
const sulapCommands = ['.sulapmenu', 'sulapmenu', '.kartusulap', 'kartusulap'];
const cmdMatch = sulapCommands.includes(body.replace(/\s+/g, "").toLowerCase());
console.log("Match:", cmdMatch);

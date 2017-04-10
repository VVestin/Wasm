console.log("editor.js");
function flash(src) {
	console.log("assembling");
	var data = new Array(128);
	data.fill(0);

	data[10] = 10;
	data[0] = "W";

	var cpu = document.getElementById("cpu");
	for (var i = 0; i < data.length; i++) {
		cpu.children[i % 16 + 1].children[Math.floor(i / 16 + 1)].innerHTML = data[i];
	}
}

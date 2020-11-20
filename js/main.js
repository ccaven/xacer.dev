///catchImage("/img/calvin-surprised.png", "target-img");

catchCSV("/csv/test.csv");

async function catchImage (pathToImage, imgId) {
    console.log("Catching image: " + pathToImage);
    const response = await fetch(pathToImage);
    console.log(response);
    const blob = await response.blob();
    console.log(blob);
    document.getElementById(imgId).src = URL.createObjectURL(blob);
    console.log("Finished operation");
}

function getTableFromText (textData) {
    let rows = textData.split("\n");
    for (let i = 0; i < rows.length; i ++) {
        rows[i] = rows[i].split(",");
    }
    return rows;
}

async function catchCSV (pathToCSV) {
    const response = await fetch(pathToCSV);
    const data = await response.text();
    const table = getTableFromText(data);
    return table;
}

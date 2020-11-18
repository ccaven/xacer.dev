catchImage("calvin-surprised.png");

async function catchImage (pathToImage, imgId) {
    console.log("Catching image: " + pathToImage);
    const response = await fetch(pathToImage);
    console.log("Response: " + response);
    const blob = await response.blob();
    console.log("Blob: " + blob);
    document.getElementById(imgId).src = URL.createObjectURL(blob);
    console.log("Finished operation");
}

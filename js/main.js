catchImage("/js/calvin-surprised.png", "target-img");

async function catchImage (pathToImage, imgId) {
    console.log("Catching image: " + pathToImage);
    const response = await fetch(pathToImage);
    console.log(response);
    const blob = await response.blob();
    console.log(blob);
    document.getElementById(imgId).src = URL.createObjectURL(blob);
    console.log("Finished operation");
}

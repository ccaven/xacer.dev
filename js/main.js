function loadImage (pathToImage, imgId) {
    fetch(pathToImage).then(response => {
        return response.blob();
    }).then(blob => {
        document.getElementById(imgId).src = URL.createObjectURL(blob);
    });
}

loadImage("../imgs/calvin-suprised.png", "target-img");
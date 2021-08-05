
// Input tag
/** @type {HTMLInputElement} */
const inputTag = document.createElement("INPUT");

inputTag.setAttribute("type", "file");

inputTag.style.padding = "10px";
inputTag.style.border = "1px solid black";
inputTag.style.margin = "10px";

// Go button
/** @type {HTMLButtonElement} */
const goButton = document.createElement("BUTTON");

goButton.textContent = "Run";

goButton.style.padding = "10px";

goButton.onclick = run;

// Image element
/** @type {HTMLImageElement} */
const imgElement = document.createElement("IMG");

// Canvas
/** @type {HTMLCanvasElement} */
const canvas = document.createElement("CANVAS");
const ctx = canvas.getContext("2d");

document.body.append(inputTag);

document.body.append(goButton);

document.body.append(imgElement);

document.body.append(canvas);

/**
 *
 * @param {Uint8Array} originalData
 * @param {Number} factor
 * @returns {Uint8Array}
 */
function gaussianBlur (data, width, height, factor) {

    // Construct Gaussian matrix
    const gaussianSize = factor * 2 + 1;
    const gaussianMatrix = new Float32Array(gaussianSize * gaussianSize);

    const standardDeviation = 1;
    const coefficient = 1 / (2 * Math.PI * standardDeviation * standardDeviation);

    const spread = 1;

    let total = 0;

    for (let x = 0; x < gaussianSize; x ++) {
        for (let y = 0; y < gaussianSize; y ++) {
            let rx = (x - factor) / factor * spread;
            let ry = (y - factor) / factor * spread;
            gaussianMatrix[x + y * gaussianSize] = coefficient * Math.exp(-(rx * rx + ry * ry) / (2 * standardDeviation * standardDeviation));
            total += gaussianMatrix[x + y * gaussianSize];
        }
    }

    // for (let x = 0; x < gaussianSize; x ++) {
    //     for (let y = 0; y < gaussianSize; y ++) {
    //         gaussianMatrix[x + y * gaussianSize] /= total;
    //     }
    // }

    // Write each line of the shader
    for (let x = 0; x < gaussianSize; x ++) {
        for (let y = 0; y < gaussianSize; y ++) {
            let coef = gaussianMatrix[x + y * gaussianSize];

            let diff = `float2(${(x - 9) / 9}, ${(y - 9) / 9}) / resolution`;

            console.log(`value += tex2D(_MainTex, i.uv + ${diff}) * ${coef};`);
        }
    }

    console.log(total);

    // Apply Gaussian matrix
    const newData = new Uint8Array(width * height);
    for (let x = 0; x < width; x ++) {
        for (let y = 0; y < height; y ++) {
            let value = 0;
            for (let gx = 0; gx < gaussianSize; gx ++) {
                for (let gy = 0; gy < gaussianSize; gy ++) {
                    let gaussianCoefficient = gaussianMatrix[gx + gy * gaussianSize];
                    let ix = x + gx - factor;
                    let iy = y + gy - factor;
                    ix = Math.min(Math.max(ix, 0), width - 1);
                    iy = Math.min(Math.max(iy, 0), height - 1);
                    value += data[ix + iy * width] * gaussianCoefficient;
                }
            }

            value = Math.max(Math.min(value, 255), 0);

            newData[x + y * width] = value;
        }
    }
    return newData;
}

/**
 *
 * @param {ImageData} originalData
 * @returns {ImageData}
 */
function getPencilDrawing (originalData) {
    const width = originalData.width;
    const height = originalData.height;

    // Turn image into grayscale
    const grayscaleData = new Uint8Array(width * height);
    for (let x = 0; x < width; x ++) {
        for (let y = 0; y < height; y ++) {
            let l = x + y * width << 2;
            let g = Math.hypot(originalData.data[l], originalData.data[l + 1], originalData.data[l + 2]);
            g /= 441.672956;
            g = Math.max(Math.min(g, 1), 0);
            g *= 16;
            g = Math.floor(g);
            g *= 16;
            grayscaleData[x + y * width] = 255 - g;
        }
    }

    // Blur grayscale image
    const blurredGrayscale = gaussianBlur(grayscaleData, width, height, 9);

    // Put them together
    for (let x = 0; x < width; x ++) {
        for (let y = 0; y < height; y ++) {
            let l = x + y * width << 2;

            let front = blurredGrayscale[x + y * width];
            let back = grayscaleData[x + y * width];

            front = Math.min(Math.max(front, 0), 255);
            back = Math.min(Math.max(back, 0), 255);

            let result = front / back * 255;

            if (back == 0) result = 255;

            if (result > 255) { result = 255; }
            if (result < 0) { result = 0; }

            originalData.data[l] = result;
            originalData.data[l+1] = result;
            originalData.data[l+2] = result;
        }
    }

    return originalData;
}

function run () {
    console.log("Running operation");
    if (inputTag.files.length) {
        let reader = new FileReader();
        reader.onload = e => {
            const dataUrl = e.target.result;
            imgElement.setAttribute("src", dataUrl);

            canvas.width = imgElement.width;
            canvas.height = imgElement.height;

            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

            let originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let updatedData = getPencilDrawing(originalData);

            ctx.putImageData(updatedData, 0, 0);

            console.log(originalData);
        };
        reader.readAsDataURL(inputTag.files[0]);
    }
}
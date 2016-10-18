var minZoom = 13;
var maxZoom = 18;

var minRadius = 1;
var maxRadius = 13;

var centerLatLng = [43.604482, 1.443962];

// Image with canvas part
var imageCanvas = document.createElement('canvas');
var image = new Image();
image.onload = function () {
    imageCanvas.width = image.width;
    imageCanvas.height = image.height;
    imageCanvas.getContext('2d').drawImage(image, 0, 0);
    var body = document.getElementsByTagName("body")[0];
};
image.src = 'data/croix-occitane.jpg';

var displayImgInMap = false;
var useSoundInMap = false;

// MAP Part
var toulouseMap = L.map('toulouseMap').setView(centerLatLng, minZoom);

L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGF1cmVudDM1MjQwIiwiYSI6ImNpdDc5NzFmMTAwMHoyeHBoMDV4dWxsaWgifQ.ddKkXiiw-IGruDUQeQjllg', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: maxZoom,
    id: 'laurent35240',
    accessToken: 'pk.eyJ1IjoibGF1cmVudDM1MjQwIiwiYSI6ImNpdDc5NzFmMTAwMHoyeHBoMDV4dWxsaWgifQ.ddKkXiiw-IGruDUQeQjllg'
}).addTo(toulouseMap);

var firstMapBounds = toulouseMap.getBounds();
var distNorthSouth = firstMapBounds.getNorth() - firstMapBounds.getSouth(); // Equivalent to image height AND width
var distEastWest = firstMapBounds.getEast() - firstMapBounds.getWest();

var jsonData;

canvasLayer = function () {
    this.fetchAndProcessData = function(processFunction, ctx, canvasOverlay, canvasWidth, canvasHeight) {
        fetch('data/light-coordinates.json')
            .then(function (response) {
                return response.json().then(function (json) {
                    jsonData = json;
                    processFunction(json, ctx, canvasOverlay, canvasWidth, canvasHeight);
                })
            });
    };

    this.drawJsonData = function(json, ctx, canvasOverlay, canvasWidth, canvasHeight) {
        var startTime = Date.now();
        var zoom = canvasOverlay._map.getZoom();
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        var ambientLight = .03;
        var intensity = 1;
        var radius = Math.max(minRadius, minRadius + (maxRadius - minRadius) * (zoom - minZoom) / (maxZoom - minZoom));
        var amb = 'rgba(0,0,0,' + (1-ambientLight) + ')';
        var pixelData;
        var useCircle = false;
        var useRandomizer = false;
        var randomizerPercentOff = 10;

        var coord, g, dot, xCoordPixel, yCoordPixel, showLight, coordLatLng, distanceToCenter, randNumber;
        var startLoopTime = Date.now();
        for (var i=0; i<json.length; i++) {
            coord = json[i];
            coordLatLng = L.latLng(coord[1], coord[0]);
            dot = canvasOverlay._map.latLngToContainerPoint(coordLatLng);

            if (dot.x >= 0 && dot.x <= canvasWidth && dot.y >= 0 && dot.y <= canvasHeight) {
                showLight = true;
                if (displayImgInMap) {
                    // I do not know why this formula but it seems that it's working
                    xCoordPixel = (coord[0] - distEastWest/2 + distNorthSouth/2 - firstMapBounds.getWest()) / distNorthSouth/Math.sqrt(2) * imageCanvas.width + imageCanvas.width/8;
                    yCoordPixel = (coord[1] - firstMapBounds.getSouth()) / distNorthSouth * imageCanvas.height;
                    pixelData = imageCanvas.getContext('2d').getImageData(xCoordPixel,yCoordPixel,1,1).data;
                    showLight = (pixelData[3] == 255);
                }
                if (useSoundInMap && showLight) {
                    distanceToCenter = canvasOverlay._map.distance(centerLatLng, coordLatLng);
                    showLight = ((distanceToCenter * 0.03) < soundAverage);
                }
                if (useRandomizer && showLight) {
                    randNumber = Math.random();
                    showLight = ((randNumber * 100) > randomizerPercentOff);
                }
                if (showLight) {
                    if (useCircle) {
                        ctx.beginPath();
                        ctx.arc(dot.x, dot.y, radius, 0, 2 * Math.PI);
                        ctx.fillStyle = 'rgba(0,0,0,0.9)';
                        ctx.fill();
                    } else {
                        g = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, radius);
                        g.addColorStop(1, 'rgba(0,0,0,' + (1-intensity) + ')');
                        g.addColorStop(0, amb);
                        ctx.fillStyle = g;
                        ctx.fillRect(dot.x-radius, dot.y-radius, 2*radius, 2*radius);
                    }

                }
            }
        }
        var endLoopTime = Date.now();

        ctx.fillStyle = amb;
        ctx.globalCompositeOperation = 'xor';
        ctx.fillRect(0,0,canvasWidth, canvasHeight);
        var endTime = Date.now();
        console.log('Radius ' + radius);
        console.log('Start time: ' + startTime);
        console.log('End time: ' + endTime);
        console.log('Loop time: ' + (endLoopTime - startLoopTime));
        console.log('Total time: ' + (endTime - startTime));
    };

    this.onDrawLayer = function(info) {
        var ctx = info.canvas.getContext('2d');

        if (typeof jsonData == 'undefined') {
            this.fetchAndProcessData(this.drawJsonData, ctx, info.layer, info.canvas.width, info.canvas.height);
        } else {
            this.drawJsonData(jsonData, ctx, info.layer, info.canvas.width, info.canvas.height);
        }
    };
};

canvasLayer.prototype = new L.CanvasLayer();

var myCanvasLayer = new canvasLayer();
myCanvasLayer.addTo(toulouseMap);

// Handling clicking on link
$('#crossLink').click(function (e) {
    displayImgInMap = !displayImgInMap;
    myCanvasLayer.drawLayer();
    e.preventDefault();
});

// Handling music
var song = new Audio('data/come.mp3');
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyser = audioCtx.createAnalyser();
source = audioCtx.createMediaElementSource(song);
source.connect(analyser);
source.connect(audioCtx.destination);
analyser.fftSize = 256;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);

$('#songLink').click(function (e) {
    if (song.paused) {
        song.play();
        loopAudio();
        useSoundInMap = true;
    } else {
        song.pause();
        useSoundInMap = false;
    }
    e.preventDefault();
});

var soundAverage = 0;
function loopAudio() {
    requestAnimationFrame(loopAudio);
    // update data in frequencyData
    analyser.getByteFrequencyData(dataArray);
    // render frame based on values in frequencyData
    var sum = 0;
    var v;
    for(var i = 0; i < bufferLength; i++) {
        v = dataArray[i];
        sum += v;
    }
    soundAverage = sum / bufferLength;
}

/*window.setInterval(function () {
    myCanvasLayer.drawLayer();
}, 1000);*/
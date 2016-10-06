var minZoom = 13;
var maxZoom = 18;

var minRadius = 1;
var maxRadius = 13;

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

// MAP Part
var toulouseMap = L.map('toulouseMap').setView([43.604482, 1.443962], minZoom);

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
        var zoom = canvasOverlay._map.getZoom();
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "rgba(255,116,0, 0.2)";
        var ambientLight = .03;
        var intensity = 1;
        var radius = Math.max(minRadius, minRadius + (maxRadius - minRadius) * (zoom - minZoom) / (maxZoom - minZoom));
        var amb = 'rgba(0,0,0,' + (1-ambientLight) + ')';
        var pixelData;

        var coord, g, dot, xCoordPixel, yCoordPixel, showLight;
        for (var i=0; i<json.length; i++) {
            coord = json[i];

            dot = canvasOverlay._map.latLngToContainerPoint(L.latLng(coord[1], coord[0]));

            if (dot.x >= 0 && dot.x <= canvasWidth && dot.y >= 0 && dot.y <= canvasHeight) {
                if (displayImgInMap) {
                    // I do not know why this formula but it seems that it's working
                    xCoordPixel = (coord[0] - distEastWest/2 + distNorthSouth/2 - firstMapBounds.getWest()) / distNorthSouth/Math.sqrt(2) * imageCanvas.width + imageCanvas.width/8;
                    yCoordPixel = (coord[1] - firstMapBounds.getSouth()) / distNorthSouth * imageCanvas.height;
                    pixelData = imageCanvas.getContext('2d').getImageData(xCoordPixel,yCoordPixel,1,1).data;
                    showLight = (pixelData[3] == 255);
                } else {
                    showLight = true;
                }
                if (showLight) {
                    g = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, radius);
                    g.addColorStop(1, 'rgba(0,0,0,' + (1-intensity) + ')');
                    g.addColorStop(0, amb);
                    ctx.fillStyle = g;
                    ctx.fillRect(dot.x-radius, dot.y-radius, 2*radius, 2*radius);
                }
            }
        }

        ctx.fillStyle = amb;
        ctx.globalCompositeOperation = 'xor';
        ctx.fillRect(0,0,canvasWidth, canvasHeight);
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
$('#crossLink').click(function () {
    displayImgInMap = !displayImgInMap;
    myCanvasLayer.drawLayer();
});
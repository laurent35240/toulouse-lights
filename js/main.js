var toulouseMap = L.map('toulouseMap').setView([43.604482, 1.443962], 13);

L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGF1cmVudDM1MjQwIiwiYSI6ImNpdDc5NzFmMTAwMHoyeHBoMDV4dWxsaWgifQ.ddKkXiiw-IGruDUQeQjllg', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'laurent35240',
    accessToken: 'pk.eyJ1IjoibGF1cmVudDM1MjQwIiwiYSI6ImNpdDc5NzFmMTAwMHoyeHBoMDV4dWxsaWgifQ.ddKkXiiw-IGruDUQeQjllg'
}).addTo(toulouseMap);

var jsonData;

function fetchAndProcessData(processFunction, ctx, canvasOverlay, canvasWidth, canvasHeight) {
    fetch('points-lumineux.json')
        .then(function (response) {
            return response.json().then(function (json) {
                jsonData = json;
                processFunction(json, ctx, canvasOverlay, canvasWidth, canvasHeight);
            })
        });
}

function drawJsonData(json, ctx, canvasOverlay, canvasWidth, canvasHeight) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "rgba(255,116,0, 0.2)";
    var ambientLight = .01;
    var intensity = 1;
    var radius = 1;
    var amb = 'rgba(0,0,0,' + (1-ambientLight) + ')';

    var coord, g;
    for (var i=0; i<json.length; i++) {
        coord = json[i].geometry.coordinates;

        dot = canvasOverlay._map.latLngToContainerPoint(L.latLng(coord[1], coord[0]));

        if (dot.x >= 0 && dot.x <= canvasWidth && dot.y >= 0 && dot.y <= canvasHeight) {
            g = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, radius);
            g.addColorStop(1, 'rgba(0,0,0,' + (1-intensity) + ')');
            g.addColorStop(0, amb);
            ctx.fillStyle = g;
            ctx.fillRect(dot.x-radius, dot.y-radius, 2*radius, 2*radius);
        }
    }

    ctx.fillStyle = amb;
    ctx.globalCompositeOperation = 'xor';
    ctx.fillRect(0,0,canvasWidth, canvasHeight);
}

function drawingOnCanvas(canvasOverlay, params) {
    var ctx = params.canvas.getContext('2d');

    if (typeof jsonData == 'undefined') {
        fetchAndProcessData(drawJsonData, ctx, canvasOverlay, params.canvas.width, params.canvas.height);
    } else {
        drawJsonData(jsonData, ctx, canvasOverlay, params.canvas.width, params.canvas.height);
    }
}

L.canvasOverlay()
    .drawing(drawingOnCanvas)
    .addTo(toulouseMap);

/**var can = document.getElementById('toulouseLights');
var ctx = can.getContext('2d');

var ambientLight = .1;
var intensity = 1;
var radius = 1;
var canvasHeight = 600;
var canvasWidth = 1600;
var amb = 'rgba(0,0,0,' + (1-ambientLight) + ')';

fetch('points-lumineux.json')
    .then(function (response) {
        return response.json().then(function (json) {
            var coord, x, y, g;
            var mapBounds = toulouseMap.getBounds();
            for (var i=0; i<json.length; i++) {
                coord = json[i].geometry.coordinates;

                x = (coord[0] - mapBounds.getWest()) / (mapBounds.getEast() - mapBounds.getWest()) * canvasWidth;
                y = (coord[1] - mapBounds.getNorth()) / (mapBounds.getSouth() - mapBounds.getNorth()) * canvasHeight;
                g = ctx.createRadialGradient(x, y, 0, x, y, radius);
                g.addColorStop(1, 'rgba(0,0,0,' + (1-intensity) + ')');
                g.addColorStop(0, amb);
                ctx.fillStyle = g;
                ctx.fillRect(x-radius, y-radius, 2*radius, 2*radius);
            }
        })
    });

ctx.fillStyle = amb;
ctx.globalCompositeOperation = 'xor';
ctx.fillRect(0,0,canvasWidth,canvasHeight);
*/
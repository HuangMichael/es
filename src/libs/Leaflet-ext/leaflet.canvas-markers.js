'use strict';

(function (factory, window) {
    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);

        // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }

    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        window.L.CanvasIconLayer = factory(L);
    }
}(function (L) {
    var CanvasIconLayer = (L.Layer ? L.Layer : L.Class).extend({
        initialize: function (options) {
            this._map    = null;
            this._canvas = null;
            this._frame  = null;
            this._delegate = null;
            L.setOptions(this, options);
        },

        setOptions: function (options) {
            L.setOptions(this, options);
            if (this._canvas) {
                this._updateOptions();
            }
            return this.redraw();
        },

        redraw: function () {
            this._redraw(true)
        },

        addMarker: function (marker) {
            L.Util.stamp(marker);

            if (!this._markers) this._markers = {};

            this._markers[marker._leaflet_id] = marker;

            this._drawMarker(marker);
        },

        addLayer: function (layer) {
            if ((layer.options.pane == 'markerPane') && layer.options.icon) this.addMarker(layer);
            else console.error('Layer isn\'t a marker');
        },

        removeLayer: function (layer) {
            this.removeMarker(layer, true);
        },

        removeMarker: function (marker, redraw) {
            delete this._markers[marker._leaflet_id];
            if (redraw) {
                this._redraw(true);
            }
        },

        needRedraw: function () {
            if (!this._frame) {
                this._frame = L.Util.requestAnimFrame(this.redraw, this);
            }
            return this;
        },

        //-------------------------------------------------------------
        _onLayerDidResize: function (resizeEvent) {
            this._canvas.width = resizeEvent.newSize.x;
            this._canvas.height = resizeEvent.newSize.y;
            this.redraw();
        },
        //-------------------------------------------------------------
        _onLayerDidMove: function () {
            var topLeft = this._map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(this._canvas, topLeft);
            this.redraw();
        },


        getEvents: function () {
            var events = {
                resize: this._onLayerDidResize,
                moveend: this._onLayerDidMove,
                zoom: this._onLayerDidMove
            };
            if (this._map.options.zoomAnimation && L.Browser.any3d) {
                events.zoomanim = this._animateZoom;
            }

            return events;
        },

        onAdd: function (map) {
            this._map = map;


            this._map = map;
            this._canvas = L.DomUtil.create('canvas', 'leaflet-layer leaflet-canvas-icon-layer');


            var size = this._map.getSize();
            this._canvas.width = size.x;
            this._canvas.height = size.y;

            this._context = this._canvas.getContext('2d');

            var animated = this._map.options.zoomAnimation && L.Browser.any3d;
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

            map._panes.overlayPane.appendChild(this._canvas);

            map.on(this.getEvents(), this);

            var del = this._delegate || this;
            del.onLayerDidMount && del.onLayerDidMount(); // -- callback
            this.needRedraw();
        },


        _resize: function (resizeEvent) {
            this._canvas.width = resizeEvent.newSize.x;
            this._canvas.height = resizeEvent.newSize.y;
        },


        onRemove: function (map) {
            var del = this._delegate || this;
            del.onLayerWillUnmount && del.onLayerWillUnmount(); // -- callback


            map.getPanes().overlayPane.removeChild(this._canvas);

            map.off(this.getEvents(),this);

            this._canvas = null;
        },

        addTo: function (map) {
            map.addLayer(this);
            return this;
        },

        _drawMarker: function (marker) {
            var self = this;

            var pointPos = this._map.latLngToContainerPoint(marker.getLatLng());
            var bounds = this._map.getBounds();
            if (bounds.contains(marker.getLatLng()))
                self._drawImage(marker, pointPos);

        },

        _drawImage: function (marker, pointPos) {

//             var doc = document.implementation.createHTMLDocument("");
//             doc.write(marker.options.icon.options.html);
//
// // You must manually set the xmlns if you intend to immediately serialize
// // the HTML document to a string as opposed to appending it to a
// // <foreignObject> in the DOM
//             doc.documentElement.setAttribute("xmlns", doc.documentElement.namespaceURI);
//
// // Get well-formed markup
//             var html = (new XMLSerializer).serializeToString(doc);


            // var DOMURL = window.URL || window.webkitURL || window;
            // var img = new Image();
            // var svg = new Blob([html], {type: 'image/svg+xml;charset=utf-8'});
            // var url = DOMURL.createObjectURL(svg);
            //
            // img.onload = function () {
            //     this._context.drawImage(img,  pointPos.x - marker.options.icon.options.iconAnchor[0], marker.options.icon.options.iconAnchor[1]);
            //     DOMURL.revokeObjectURL(url);
            // }

            // img.src = url;

            if (marker.options.icon.options.name === 'PrLineMark') {

                //x,y是矩形的起点;w,h是矩形的宽高;r是圆角矩形的半径.

                this._context.lineWidth = marker.options.icon.options.lineWidth;
                this._context.strokeStyle = marker.options.icon.options.lineColor;


                var w = marker.options.icon.options.rectWidth;
                var h = marker.options.icon.options.rectHeight;
                var r = marker.options.icon.options.radius;

                var x = pointPos.x - w / 2;
                var y = pointPos.y - h / 2;

                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;
                this._context.beginPath();
                this._context.moveTo(x + r, y);
                this._context.arcTo(x + w, y, x + w, y + h, r);
                this._context.arcTo(x + w, y + h, x, y + h, r);
                this._context.arcTo(x, y + h, x, y, r);
                this._context.arcTo(x, y, x + w, y, r);
                this._context.fillStyle = marker.options.icon.options.fillColor;
                this._context.closePath();
                this._context.fill();
                this._context.stroke();

                this._context.strokeStyle = marker.options.icon.options.color;
                this._context.font = marker.options.icon.options.font;
                this._context.fillStyle = marker.options.icon.options.color;
                this._context.textAlign = "center";
                this._context.textBaseline = 'middle';
                this._context.fillText(marker.options.icon.options.value, pointPos.x - marker.options.icon.options.iconAnchor[0], pointPos.y - marker.options.icon.options.iconAnchor[1]);
            }
            else if (marker.options.icon.options.name === 'StaMarker') {
                //x,y是矩形的起点;w,h是矩形的宽高;r是圆角矩形的半径.


                var w = marker.options.icon.options.rectWidth;
                var h = marker.options.icon.options.rectHeight;
                var r = marker.options.icon.options.radius;

                var x = pointPos.x - w / 2;
                var y = pointPos.y - h / 2;

                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;

                if (marker.options.icon.options.label === '') {

                    this._context.lineWidth = marker.options.icon.options.lineWidth;
                    this._context.strokeStyle = marker.options.icon.options.lineColor;

                    this._context.beginPath();
                    this._context.moveTo(x + r, y);
                    this._context.arcTo(x + w, y, x + w, y + h, r);
                    this._context.arcTo(x + w, y + h, x, y + h, r);
                    this._context.arcTo(x, y + h, x, y, r);
                    this._context.arcTo(x, y, x + w, y, r);
                    this._context.fillStyle = marker.options.icon.options.fillColor;
                    this._context.closePath();
                    this._context.fill();
                    this._context.stroke();

                    this._context.strokeStyle = marker.options.icon.options.color;
                    this._context.font = marker.options.icon.options.font;
                    this._context.fillStyle = marker.options.icon.options.color;
                    this._context.textAlign = "center";
                    this._context.textBaseline = 'middle';
                    this._context.fillText(marker.options.icon.options.value, pointPos.x - marker.options.icon.options.iconAnchor[0], pointPos.y - marker.options.icon.options.iconAnchor[1]);

                    this._context.strokeStyle = marker.options.icon.options.labelColor;
                    this._context.font = marker.options.icon.options.labelSize;
                    this._context.fillStyle = marker.options.icon.options.labelColor;
                    this._context.textAlign = "center";
                    this._context.textBaseline = 'middle';
                    this._context.fillText(marker.options.icon.options.label, pointPos.x - marker.options.icon.options.iconAnchor[0] + 45, pointPos.y - marker.options.icon.options.iconAnchor[1]);

                }
                else {

                    this._context.strokeStyle = marker.options.icon.options.fillColor;
                    this._context.beginPath();
                    this._context.moveTo(x + r, y);
                    this._context.arcTo(x + w, y, x + w, y + h, 0);
                    this._context.arcTo(x + w, y + h, x, y + h, 0);
                    this._context.arcTo(x, y + h, x, y, r);
                    this._context.arcTo(x, y, x + w, y, r);
                    this._context.fillStyle = marker.options.icon.options.fillColor;
                    this._context.closePath();
                    this._context.fill();
                    this._context.stroke();

                    // this._context.strokeStyle = marker.options.icon.options.color;
                    this._context.font = marker.options.icon.options.font;
                    this._context.fillStyle = marker.options.icon.options.color;
                    this._context.textAlign = "center";
                    this._context.textBaseline = 'middle';
                    this._context.fillText(marker.options.icon.options.value, pointPos.x - marker.options.icon.options.iconAnchor[0], pointPos.y - marker.options.icon.options.iconAnchor[1]);

                    this._context.strokeStyle = marker.options.icon.options.labelFillColor;
                    this._context.fillStyle = marker.options.icon.options.labelFillColor;
                    var tLen = 16;
                    var padding = 20;
                    var txtWidth = this._context.measureText(marker.options.icon.options.label).width;
                    this._context.beginPath();
                    this._context.moveTo(x + w, y);
                    this._context.arcTo(x + w + txtWidth + padding, y, x + padding + w + txtWidth, y + h, r);
                    this._context.arcTo(x + w + txtWidth + padding, y + h, x, y + h, r);
                    this._context.arcTo(x + w, y + h, x + w, y, 0);
                    this._context.arcTo(x + w, y, x + w + txtWidth + padding, y, 0);


                    this._context.closePath();
                    this._context.fill();
                    this._context.stroke();

                    this._context.beginPath();

                    this._context.moveTo(x + w / 2 - tLen / 2, y + h);
                    this._context.lineTo(x + w / 2 + tLen / 2, y + h);
                    this._context.lineTo(x + w / 2, y + h + tLen / 2);
                    this._context.fillStyle = marker.options.icon.options.fillColor;
                    this._context.closePath();
                    this._context.fill();


                    // this._context.strokeStyle = marker.options.icon.options.labelColor;
                    this._context.font = marker.options.icon.options.labelSize;
                    this._context.fillStyle = marker.options.icon.options.labelColor;
                    this._context.textAlign = "center";
                    // this._context.textBaseline = 'middle';
                    this._context.fillText(marker.options.icon.options.label, pointPos.x - marker.options.icon.options.iconAnchor[0] + w + txtWidth / 2 - 10, pointPos.y - marker.options.icon.options.iconAnchor[0]);

                }


                // this._context.shadowColor = 'rgba(255, 255, 255, 1)';
                // this._context.shadowOffsetX = 5;
                // this._context.shadowOffsetY = 5;
                // this._context.shadowBlur    = 5;


            }
            else if (marker.options.icon.options.name === 'ExtremeMarker') {
                this._context.strokeStyle = marker.options.icon.options.typeFontColor;
                this._context.font = marker.options.icon.options.typeFont;
                this._context.fillStyle = marker.options.icon.options.typeFontColor;
                this._context.textAlign = "center";
                this._context.textBaseline = 'middle';
                this._context.fillText(marker.options.icon.options.type, pointPos.x - marker.options.icon.options.iconAnchor[0], pointPos.y - marker.options.icon.options.iconAnchor[1]);

                this._context.strokeStyle = marker.options.icon.options.valueFontColor;
                this._context.font = marker.options.icon.options.valueFont;
                this._context.fillStyle = marker.options.icon.options.valueFontColor;
                this._context.textAlign = "center";
                this._context.textBaseline = 'middle';
                this._context.fillText(marker.options.icon.options.value, pointPos.x - marker.options.icon.options.iconAnchor[0], pointPos.y - marker.options.icon.options.iconAnchor[1] + 16);

            }


            // // this._context.drawImage(
            //     marker.canvas_img,
            //     pointPos.x - marker.options.icon.options.iconAnchor[0],
            //     pointPos.y - marker.options.icon.options.iconAnchor[1],
            //     marker.options.icon.options.iconSize[0],
            //     marker.options.icon.options.iconSize[1]
            //   );
        },

        _reset: function () {
            var topLeft = this._map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(this._canvas, topLeft);

            // var size = this._map.getSize();

            // this._canvas.width = size.x;
            // this._canvas.height = size.y;

            this.redraw();
        },

        _redraw: function (clear) {
            if (!this._map) {
                return;
            }

            if (clear) {
                this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
            }

            if (this._markers) {
                Object.keys(this._markers).forEach(function (item) {
                    this._drawMarker(this._markers[item]);
                }, this)
            }

            this._frame = null;

        },


        clearLayers: function () {
            if (this._context)
                this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

            for (var key in this._markers) {
                delete this._markers[key];
            }
        },


        //------------------------------------------------------------------------------
        _animateZoom: function (e) {
            var scale = this._map.getZoomScale(e.zoom);
            // -- different calc of animation zoom  in leaflet 1.0.3 thanks @peterkarabinovic, @jduggan1
            var offset = L.Layer ? this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min :
                this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

            L.DomUtil.setTransform(this._canvas, offset, scale);


        }
    });

    L.canvasIconLayer = function (options) {
        return new CanvasIconLayer(options);
    };
}, window));

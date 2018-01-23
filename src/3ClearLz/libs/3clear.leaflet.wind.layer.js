/*
* 3clear.leaflet.wind.layer.js 1.0.0
*
* Creator:Kang Ming
* Date:2017.12.04
*
* Copyright (c) 2017-2018 3Clear Science and Technology Co.,Ltd.
*
*/

import {$3Clear_WebGL_Wind} from './3Clear_WebGL';
import {utils} from "../../utils/utils";

L.DomUtil.setTransform = L.DomUtil.setTransform || function (el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] =
        (L.Browser.ie3d ?
            'translate(' + pos.x + 'px,' + pos.y + 'px)' :
            'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
        (scale ? ' scale(' + scale + ')' : '');
};

L.$3ClearWindLayer = (L.Layer ? L.Layer : L.Class).extend({
    // -- initialized is called on prototype 
    initialize: function (options) {
        this._map = null;
        this._canvas = null;

        this.model = 0;
        this.playing = true;
        this.animationFrame = null;
        this.channel = 0;
        this.time = 0;
        this._windFrame = null;

        this.wind = null;
        this.image = null;

        L.setOptions(this, options);
    },


    //-------------------------------------------------------------
    _onLayerDidResize: function (resizeEvent) {
        this._canvas.style.width =resizeEvent.newSize.x+'px';
        this._canvas.style.height = resizeEvent.newSize.y+'px';
        this.wind.resize();
    },
    //-------------------------------------------------------------
    _onLayerDidMove: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);

        if (this.wind.windImage) {
            let extent = this._getExtent();
            this.wind.resetWindTexture(extent);
        }
    },
    //-------------------------------------------------------------
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
    //-------------------------------------------------------------
    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');

        var size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

        map._panes.overlayPane.appendChild(this._canvas);

        let imgObj = utils.deepCopy(this.options.windData);
        this.wind = new $3Clear_WebGL_Wind(this._canvas, imgObj);
        this.wind.initParticles(5000);
        this.image = document.createElement('img');


        let _this = this;
        this._windFrame = function frame() {
            if (_this.wind.windImage) {
                _this.wind.draw();
            } else {
                if (_this.wind) {
                    _this.wind.clear();
                }
            }

            if (_this.playing) {
                _this.animationFrame = window.requestAnimationFrame(frame);
            } else {
                window.cancelAnimationFrame(_this.animationFrame);
                _this.animationFrame = null;
                _this.playing = false;
                if (_this.wind) {
                    _this.wind.clear();
                }
            }
        };


        map.on(this.getEvents(), this);

        this.onLayerDidMount && this.onLayerDidMount();

    },

    //-------------------------------------------------------------
    onRemove: function (map) {
        window.cancelAnimationFrame(this.animationFrame);
        this.onLayerWillUnmount && this.onLayerWillUnmount(); // -- callback
        map.getPanes().overlayPane.removeChild(this._canvas);
        map.off(this.getEvents(), this);
        this._canvas = null;
    },

    _getExtent() {
        this._map.invalidateSize();
        let mapbounds = this._map.getBounds();
        let xmin = mapbounds._southWest.lng;
        xmin = xmin * 20037508.3427892 / 180;
        let ymin = mapbounds._southWest.lat;
        ymin = Math.log(Math.tan((90 + ymin) * Math.PI / 360)) / (Math.PI / 180);
        ymin = ymin * 20037508.3427892 / 180;
        let xmax = mapbounds._northEast.lng;
        xmax = xmax * 20037508.3427892 / 180;
        let ymax = mapbounds._northEast.lat;
        ymax = Math.log(Math.tan((90 + ymax) * Math.PI / 360)) / (Math.PI / 180);
        ymax = ymax * 20037508.3427892 / 180;
        return [xmin, ymin, xmax, ymax];
    },



    /**
     * 重置图片路径和范围
     * @param url 图片地址
     */
    setWindInfo(url, model, imgInfo) {

        let imgObj = utils.deepCopy(imgInfo);
        this.image.src = url;
        this.image.crossOrigin = "anonymous";
        this.model = model;

        if (imgObj) {
            this.wind.windParam.width = imgObj.width;
            this.wind.windParam.height = imgObj.height;
            this.wind.windParam.extent = imgObj.extent;

            if (imgObj["uMin"])
                this.wind.windParam.uMin = imgObj["uMin"];
            if (imgObj["uMax"])
                this.wind.windParam.uMax = imgObj["uMax"];
            if (imgObj["vMin"])
                this.wind.windParam.vMin = imgObj["vMin"];
            if (imgObj["vMax"])
                this.wind.windParam.vMax = imgObj["vMax"];

            this.wind.windParam.height = imgObj.height;
            this.wind.windParam.extent = imgObj.extent;

            this.wind.resolutionW = (this.wind.windParam.extent[2] - this.wind.windParam.extent[0]) / this.wind.windParam.width;
            this.wind.resolutionH = (this.wind.windParam.extent[3] - this.wind.windParam.extent[1]) / this.wind.windParam.height;
        }

        let _this = this;
        this.loadedPromise = new Promise((resolve) => {
            this.image.onload = function () {
                _this.wind.setWind(this, _this.model, _this._getExtent());
                if (_this.animationFrame === null) {
                    _this.playing = true;
                    _this._windFrame();
                }
                // _this._reSetSize();
                resolve(true);
            };

            this.image.onerror = function () {

                if (_this.animationFrame !== null) {
                    window.cancelAnimationFrame(_this.animationFrame);
                    _this.playing = false;
                    _this.animationFrame = null;
                }
                // _this.wind.setWind(null, 0, _this._getExtent());
                _this.wind.clear();
                resolve(true);
            };
        });
        return this.loadedPromise;
    },


    resize() {
        this.wind.resize();
    },

    show() {
        if (this.animationFrame === null) {
            this.playing = true;
            if (this._windFrame)
                this._windFrame.call();
        }
    },

    hide() {
        this.animationFrame = null;
        this.playing = false;
        window.cancelAnimationFrame(this.animationFrame);
        if (this.wind) {
            this.wind.clear();
        }
    },

    setMask(img) {
        this.wind.setMask(img);
    },

    removeMask() {
        this.wind.texture_mask = null;
    },

    setColor(color) {
        this.wind.windColors = color;
        this.wind.setColor();
    },

    //------------------------------------------------------------
    addTo: function (map) {
        map.addLayer(this);
        return this;
    },
    // --------------------------------------------------------------------------------
    LatLonToMercator: function (latlon) {
        return {
            x: latlon.lng * 6378137 * Math.PI / 180,
            y: Math.log(Math.tan((90 + latlon.lat) * Math.PI / 360)) * 6378137
        };
    },

    // -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
    //------------------------------------------------------------------------------
    _setTransform: function (el, offset, scale) {
        var pos = offset || new L.Point(0, 0);

        el.style[L.DomUtil.TRANSFORM] =
            (L.Browser.ie3d ?
                'translate(' + pos.x + 'px,' + pos.y + 'px)' :
                'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
            (scale ? ' scale(' + scale + ')' : '');
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

L.$3clearWindLayer = function (options) {
    return new L.$3ClearWindLayer(options);
};
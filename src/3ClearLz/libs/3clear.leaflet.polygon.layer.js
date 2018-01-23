/*
* 3clear.leaflet.wind.layer.js 1.0.0
*
* Creator:Kang Ming
* Date:2017.12.04
*
* Copyright (c) 2017-2018 3Clear Science and Technology Co.,Ltd.
*
*/

import {$3Clear_WebGL_Polygon} from './3Clear_WebGL';
import {utils} from "../../utils/utils";

L.DomUtil.setTransform = L.DomUtil.setTransform || function (el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] =
        (L.Browser.ie3d ?
            'translate(' + pos.x + 'px,' + pos.y + 'px)' :
            'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
        (scale ? ' scale(' + scale + ')' : '');
};

L.$3ClearPolygonLayer = (L.Layer ? L.Layer : L.Class).extend({
    // -- initialized is called on prototype 
    initialize: function (options) {
        this._map = null;
        this._canvas = null;
        this._frame = null;
        this.channel = 0;
        this.time = 0;
        this.webGL_Polygon = null;
        this.image1 = null;
        this.image2 = null;
        L.setOptions(this, options);
    },

    needRedraw: function () {
        if (!this._frame) {
            this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
        }
        return this;
    },

    //-------------------------------------------------------------
    _onLayerDidResize: function (resizeEvent) {
        this._canvas.style.width =resizeEvent.newSize.x+'px';
        this._canvas.style.height = resizeEvent.newSize.y+'px';
        this.webGL_Polygon.resize();
        this.drawLayer();
    },
    //-------------------------------------------------------------
    _onLayerDidMove: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);

        this.drawLayer();
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
        this.tiles = {};

        var size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

        map._panes.overlayPane.appendChild(this._canvas);
        let imgObj = utils.deepCopy(this.options.imgObjInfo);
        this.webGL_Polygon = new $3Clear_WebGL_Polygon(this._canvas, imgObj);
        this.webGL_Polygon.alpha = this.options.alpha;
        this.webGL_Polygon.setColor(this.options.color);

        this.image1 = document.createElement('img');
        this.image2 = document.createElement('img');

        map.on(this.getEvents(), this);

        this.onLayerDidMount && this.onLayerDidMount();
        this.needRedraw();
    },

    //-------------------------------------------------------------
    onRemove: function (map) {
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

    _render() {
        let ext = this._getExtent();
        this.webGL_Polygon.draw(ext, this.time, this.channel);
    },

    /**
     * 重置图片路径和范围
     * @param url1 图片1地址
     * @param url2 图片2地址
     * @param imgInfo 图片范围
     * @param time 时刻
     * @param channel 0|1
     * @param color 渲染色
     */
    setImgInfo(url1, url2, imgInfo, time, channel, color) {

        let imgObj = utils.deepCopy(imgInfo);
        if (color)
            this.webGL_Polygon.setColor(color);
        this.channel = channel;
        this.time = time;
        this.webGL_Polygon.polygonParam.width = imgObj.width;
        this.webGL_Polygon.polygonParam.height = imgObj.height;
        this.webGL_Polygon.polygonParam.extent = imgObj.extent;
        this.webGL_Polygon.polygonParam.isWind = imgObj.isWind;

        this.webGL_Polygon.resolutionW = (this.webGL_Polygon.polygonParam.extent[2] - this.webGL_Polygon.polygonParam.extent[0]) / this.webGL_Polygon.polygonParam.width;
        this.webGL_Polygon.resolutionH = (this.webGL_Polygon.polygonParam.extent[3] - this.webGL_Polygon.polygonParam.extent[1]) / this.webGL_Polygon.polygonParam.height;


        this.loadedPromise1 = new Promise((resolve) => {
            this.image1.onload = function () {
                resolve(true);
            };

            this.image1.onerror = function () {
                _this.webGL_Polygon.clear();
                resolve(false);
            };
        });

        this.loadedPromise2 = new Promise((resolve) => {
            this.image2.onload = function () {
                resolve(true);
            };

            this.image2.onerror = function () {
                _this.webGL_Polygon.clear();
                resolve(false);
            };
        });


        this.image1.src = url1;
        this.image1.crossOrigin = "anonymous";
        this.image2.src = url2;
        this.image2.crossOrigin = "anonymous";

        let _this = this;
        this.loadedPromise = new Promise((resolve) => {
            Promise.all([this.loadedPromise1, this.loadedPromise2]).then((res) => {
                if (res[0] && res[1]) {
                    _this.webGL_Polygon.initImgs(_this.image1, _this.image2);
                    _this._render();
                }
                else {
                    _this.webGL_Polygon.clear();
                }
                resolve(true);
            })
        });
        return this.loadedPromise;
    },

    /**
     * 设置图层透明度
     * @param alpha 图层透明度
     */
    setAlpha(alpha) {
        this.webGL_Polygon.alpha = alpha;
    },

    resize() {
        this.webGL_Polygon.resize();
    },

    hide() {
        this.webGL_Polygon.clear();
    },


    setMask(img) {
        this.webGL_Polygon.setMask(img);
    },

    removeMask() {
        this.webGL_Polygon.texture_mask = null;
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

    //------------------------------------------------------------------------------
    drawLayer: function () {
        this._render();
        this._frame = null;
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

L.$3clearPolygonLayer = function (options) {
    return new L.$3ClearPolygonLayer(options);
};
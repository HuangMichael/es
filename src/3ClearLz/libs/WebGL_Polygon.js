/**
 * Created by <kangming@3clear.com>
 * date: 2017/10/22
 * desc: 基于WebGL绘制分布图类
 */

import {$3Clear_WebGL_Polygon} from './3Clear_WebGL';
import {utils} from "../../utils/utils";

class WebGLPolygon {
    /**
     * 初始化分布图图层
     * @param canvas 绘制的canvas对象
     * @param map 绘制的地图对象
     * @param imgObjInfo 图片信息{width,height,extent}
     * @param alpah 图层透明度
     * @param windColor 分级渲染颜色
     * */
    constructor(canvas, map, imgObjInfo, alpha, windColor) {

        let imgObj = utils.deepCopy(imgObjInfo);
        this.channel = 0;
        this.time = 0;
        this.canvas = canvas;
        this.canvas.width = canvas.clientWidth;
        this.canvas.height = canvas.clientHeight;
        this.map = map;
        this.webGL_Polygon = new $3Clear_WebGL_Polygon(canvas, imgObj);
        this.webGL_Polygon.alpha = alpha;
        this.webGL_Polygon.setColor(windColor);
        this._init();
    }


    _init() {
        let _this = this;
        this.image1 = document.createElement('img');
        this.image2 = document.createElement('img');
        this.map.on('resize', function () {
            _this._reSetSize();
        });


        this.map.on('moveend', function (event) {
            var topLeft = _this.map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(_this.canvas, topLeft);
            _this._render();
        });

        this.map.on('zoomanim', _this._animateZoom, this);

        this.map.invalidateSize();
        this._reSetSize();
    }


    _animateZoom(e) {
        var scale = this.map.getZoomScale(e.zoom);
        var offset = L.Layer ? this.map._latLngBoundsToNewLayerBounds(this.map.getBounds(), e.zoom, e.center).min :
            this.map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this.map._getMapPanePos());

        L.DomUtil.setTransform(this.canvas, offset, scale);

    }

    _reSetSize() {

        let size = this.map.getSize();
        this.canvas.style.width = size.x + 'px';
        this.canvas.style.height = size.y + 'px';
        this._render();
        this.webGL_Polygon.resize();

    }

    _getExtent() {
        let mapbounds = this.map.getBounds();
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
    }

    _render() {
        let ext = this._getExtent();
        this.webGL_Polygon.draw(ext, this.time, this.channel);
    }

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
                    // _this.webGL_Polygon.initImgs(null, null);
                    _this.webGL_Polygon.clear();
                }

                resolve(true);
            })
        });
        return this.loadedPromise;
    }

    /**
     * 设置图层透明度
     * @param alpha 图层透明度
     */
    setAlpha(alpha) {
        this.webGL_Polygon.alpha = alpha;
    }

    resize() {
        this.webGL_Polygon.resize();
    }

    hide() {
        this.webGL_Polygon.clear();
    }


    setMask(img) {
        this.webGL_Polygon.setMask(img);
    }

    removeMask() {
        this.webGL_Polygon.texture_mask = null;
    }

}

export {
    WebGLPolygon
};

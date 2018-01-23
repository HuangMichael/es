/**
 * Created by <kangming@3clear.com>
 * date: 2017/10/22
 * desc: 基于WebGL绘制风场类
 */

import {$3Clear_WebGL_Wind} from './3Clear_WebGL';
import {utils} from "../../utils/utils";

class WebGLWind {
    /**
     * 初始化风场图层
     * @param canvas 绘制的canvas对象
     * @param map 绘制的地图对象
     * @param windData 风场信息
     * */
    constructor(canvas, map, windData) {
        let imgObj = utils.deepCopy(windData);
        this.model = 0;
        this.playing = true;
        this.animationFrame = null;
        this.map = map;
        this.canvas = canvas;
        this._frame = null;
        let size = this.map.getSize();
        this.canvas.style.width = size.x + 'px';
        this.canvas.style.height = size.y + 'px';
        this.wind = new $3Clear_WebGL_Wind(canvas, imgObj);
        this.wind.initParticles(5000);
        this._init();
    }

    _init() {
        let _this = this;
        this.image = document.createElement('img');


        this.map.on('resize', function (event) {
            _this._reSetSize();
        });

        this.map.on('move', function (event) {

            var topLeft = _this.map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(_this.canvas, topLeft);

            if (_this.wind.windImage) {
                let extent = _this._getExtent();
                _this.wind.resetWindTexture(extent);
            }
        });



        this._frame = function frame() {
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
        }

        this.map.invalidateSize();

    }

    _reSetSize() {
        let size = this.map.getSize();
        this.canvas.style.width = size.x + 'px';
        this.canvas.style.height = size.y + 'px';

        this.wind.resize();
        // this.wind.resize();
        // let extent = this._getExtent();
        // this.wind.resetWindTexture(extent);

    }


    _getExtent() {
        this.map.invalidateSize();
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
                    _this._frame();
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
    }


    resize() {
        this.wind.resize();
    }

    show() {
        if (this.animationFrame === null) {
            this.playing = true;
            if (this._frame)
                this._frame.call();
        }
    }

    hide() {
        this.animationFrame = null;
        this.playing = false;
        window.cancelAnimationFrame(this.animationFrame);
        if (this.wind) {
            this.wind.clear();
        }
    }

    setMask(img) {
        this.wind.setMask(img);
    }

    removeMask() {
        this.wind.texture_mask = null;
    }

    setColor(color) {
        this.wind.windColors = color;
        this.wind.setColor();
    }

    clear() {

    }

}

export {
    WebGLWind
};

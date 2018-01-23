/**
 * Created by <kangming@3clear.com>
 * date: 2017/11/29
 * desc: 地图
 */

import {utils} from "../../utils/utils";
//leaflet
import Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'libs/Leaflet-ext/BaseMapSwitch/L.Control.Basemaps.css';

import mapProvider from 'libs/Leaflet-ext/leaflet.MapProviders.js';
import cTileLayer from 'libs/Leaflet-ext/L.3ClearLayer';
import tencentLayer from 'libs/Leaflet-ext/L.TencentLayer';
import baseMap from 'libs/Leaflet-ext/BaseMapSwitch/L.Control.Basemaps';


class $3clearMap {

    /**
     * 地图
     * @param mapDivId 地图div id
     * @param mapOptions 地图参数
     * @param mapDefaultType 默认底图
     */
    constructor(mapDivId, mapOptions,mapDefaultType) {
        this.llMap = null;
        this.mapOptions = utils.deepCopy(mapOptions);
        this.mapOptions.options.renderer = L.canvas();
        this.llMap = L.map(mapDivId, this.mapOptions.options);
        this.defaultMapType = mapDefaultType;

        let _this = this;
        this.llMap.on('baselayerchange', function (base) {
            _this._onBaseLayerChange(base);
        });
        this._init();
    }

    _init() {
        let baseLayers = this.mapOptions['baseLayers'];

        let defaultBase;
        for (let i = 0; i < baseLayers.length; i++) {
            if(this.defaultMapType)
            {
                if (baseLayers[i]['value']===this.defaultMapType) {
                    defaultBase = utils.deepCopy(baseLayers[i]);
                    baseLayers.splice(i, 1);
                    break;
                }
            }
            else{
                if (baseLayers[i]['default']) {
                    defaultBase = utils.deepCopy(baseLayers[i]);
                    baseLayers.splice(i, 1);
                    break;
                }
            }

        }
        if (defaultBase)
            baseLayers.unshift(defaultBase);

        //底图切换按钮
        let basemaps = [];
        baseLayers.forEach(base => {
            let baseLayerObj;
            switch (base.type) {
                case '3Clear':
                    baseLayerObj = L.tileLayer._3Clear(base.baseLayer, base);
                    break;
                case 'Tencent':
                    baseLayerObj = L.tileLayer.tencent(base.baseLayer, base);
                    break;
                case 'Online':
                    baseLayerObj = L.tileLayer.mapProvider(base.value, base);
                    break;
                default:
                    baseLayerObj = L.tileLayer.mapProvider('Geoq.Normal.PurplishBlue', base);
                    break;
            }
            basemaps.push(baseLayerObj);
        });

        this.llMap.addControl(L.control.basemaps({
            basemaps: basemaps,
            tileX: 0,
            tileY: 0,
            tileZ: 1
        }));

        this.currBaseLayer = defaultBase || baseLayers[0];
        this._addTopLayers(this.currBaseLayer);
    }

    _addTopLayers(defaultBase) {
        if (this.boundaryLyr) {
            this.llMap.removeLayer(this.boundaryLyr);
        }
        if (this.labelLyr) {
            this.llMap.removeLayer(this.labelLyr);
        }
        if (this.topPane) {
            L.DomUtil.remove(this.topPane);
        }
        this.topPane = this.llMap.createPane('top', this.llMap.getPanes().mapPane);
        //添加注记和边界层
        let boundaryLayer = this.mapOptions['boundaryLayers'][defaultBase.type][defaultBase.value];
        let labelLayer = this.mapOptions['labelLayers'][defaultBase.type][defaultBase.value];
        this.boundaryLyr = null;
        this.labelLyr = null;
        switch (boundaryLayer.type) {
            case '3Clear':
                //添加 3clear边界和注记图层至地图最上层
                this.boundaryLyr = L.tileLayer._3Clear(boundaryLayer.url);
                break;
            default:
                break;
        }
        switch (labelLayer.type) {
            case '3Clear':
                //注记层
                this.labelLyr = L.tileLayer._3Clear(labelLayer.url);
                break;
            default:
                break;
        }

        if (this.boundaryLyr) {
            this.boundaryLyr.addTo(this.llMap);
            this.topPane.appendChild(this.boundaryLyr.getContainer());
        }
        if (this.labelLyr) {
            this.labelLyr.addTo(this.llMap);
            this.topPane.appendChild(this.labelLyr.getContainer());
        }
    }

    _onBaseLayerChange(base) {
        this.currBaseLayer = base.options;
        this._addTopLayers(base.options);
        if (this.wind) {
            if (base.options.windColor)
                this.wind.setColor(base.options.windColor);
        }
    }

    setWindLayer(wind) {
        this.wind = wind;
        if (this.currBaseLayer && this.currBaseLayer.windColor) {
            this.wind.setColor(this.currBaseLayer.windColor);
        }

    }
}

export {
    $3clearMap
};

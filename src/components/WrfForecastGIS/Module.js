/**
 * Created by kangming
 * date: 2017/9/19
 * desc: 框架测试
 */

import Vue from 'vue';
//leaflet
import Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'libs/Leaflet-ext/L.Map.Sync.js';
import {$3clearMap} from '3clear/libs/Map';

import settingDialog from '3clear/comm/Setting/Setting.vue';
import mapTitle from '3clear/comm/MapTitle/MapTitle.vue';

//webgl polygon
import WebGLPolygon from '3clear/libs/3clear.leaflet.polygon.layer';
import WebGLWind from '3clear/libs/3clear.leaflet.wind.layer';
import {canvasIconLayer} from 'libs/Leaflet-ext/leaflet.canvas-markers.js'
import prLineMarker from 'libs/Leaflet-ext/L.Icon.PrLineMarker.js'
import maxMinMarder from 'libs/Leaflet-ext/L.Icon.ExtremeMarker.js'

//time control
import '3clear/control/TimeControl2/css/complextimecontrol.css';
import {complextimecontrol} from '3clear/control/TimeControl2/js/complextimecontrol.js';

import '3clear/control/TimeControl/css/timecontrol.css';
import {timeControl} from '3clear/control/TimeControl/js/timecontrol.js';

import {dateUtils} from "../../utils/dateUtils";
import {utils} from "../../utils/utils";


import panelSelect from '3clear/comm/PanelSelect/PanelSelect.vue';
import switchBar from '3clear/comm/SwitchBar/SwitchBar.vue';
import horizonSelect from '3clear/comm/HorizonSelect/HorizonSelect.vue';
import groupSelect from '3clear/comm/GroupSelect/GroupSelect.vue';
import legend3clear from '3clear/comm/Legend/Legend.vue';

export default {
    components: {
        'map-title': mapTitle,
        'switch-bar': switchBar,
        'panel-select': panelSelect,
        'horizon-select': horizonSelect,
        'group-select': groupSelect,
        'legend3clear': legend3clear
    },
    data() {
        return {
            //模块基础数据信息
            name: 'WrfForecastGIS',
            toggleStatus: 'open',
            rightPanelWidth: 0,
            toggle: this.$$appConfig.layout.rightPanel.toggle,
            isConfigLoaded: false,
            config: {},

            //设置时间日历可选范围
            pickerOptions: {},

            currCityName: '',
            mapTitle: '',
            mapDate: '',

            p_currCityName: '',
            p_mapTitle: '',

            //日期控件结束时候的范围限制
            end_placeholder: "",

            //产品时间
            preTime: "",

            timeControlCallTime: null,

            //预报时次
            sc_options: [],

            default_sc: "",

            //小时、日均配置文件属性
            dateType: [],

            //默认小时或者日均配置文件属性
            defaultDateType: "",

            zoneInfo: null,

            windInfo: null,

            defaultModel: "",

            models: [],

            polObjOptions: {},

            polDefault: "",

            isOpenDoubleWindown: false,

            wrfForecast_control_css: "wrfForecast_full",

            isOpenWind: false,

            //生成的时间控件中间属性
            timeControlObj: null,

            //记录循环播放计时器中间属性
            timeOutEvent: null,

            //地图容器
            map: null,

            mapRight: null,

            //线图层（用来绘制等压线）
            lineLayer: null,

            //面图层（用来绘制面等要素）
            polygonLayer: null,

            //风图层
            windLayer: null,

            polygonLayer_Pol: null,

            windLayer_Pol: null,

            memuOptions: [],

            memu_Pol_Options: [],

            selectedMenus: [],

            legendOption: [],

            legendOption_Pol: [],

            markerLayer: null,

        }
    },

    created() {
        this.rightPanelWidth = this.toggleStatus === "close" ? 0 : this.$$appConfig.layout.rightPanel.width;
        this.$$resize(this.onResize);
        this.$$getConfig(this.onGetConfig);
    },

    mounted() {

    },

    methods: {
        /**
         * 获取当前模块配置文件
         * @param config json格式的配置信息
         */
        onGetConfig(config) {

            this.config = config;
            this.isConfigLoaded = true;
            this.pol = config.settings.polRObj.default;
            this.pols = config.settings.polRObj.options;
            //todo get data use ajax api


            //通过配置文件初始化中间属性


            //this.default_sc = this.config.default_sc
            this.defaultDateType = this.config.defaultDateType;
            this.dateType = this.config.dateType;
            this.zoneInfo = this.config.zoneInfo;
            this.model = this.config.model;
            this.memuOptions = this.config.memuOptions;
            this.memu_Pol_Options = this.config.memu_Pol_Options;
            this.windInfo = this.config.windInfo;
            this.windInfo.extent = this.$$appConfig.prjInfo.modelInfo[this.zoneInfo.default_zone].extent;
            this.windInfo.width = this.$$appConfig.prjInfo.modelInfo[this.zoneInfo.default_zone].width;
            this.windInfo.height = this.$$appConfig.prjInfo.modelInfo[this.zoneInfo.default_zone].height;
            this.currCityName = this.getSelectedZoneInfo(this.zoneInfo.default_zone).label;
            this.defaultModel = this.config.defaultModel;
            this.models = this.$$appConfig.prjInfo.modelInfo.model;
            this.polObjOptions = this.config.settings.polRObj.options;
            this.polDefault = this.config.settings.polRObj.default;
            this.isOpenDoubleWindown = this.config.isOpenDoubleWindown;
            this.isOpenWind = this.config.isOpenWind;

            //计算起报时间
            let preTimeStr = "";

            let nowTime = new Date();
            let tempTime = nowTime.getFullYear() + "-" + (nowTime.getMonth() + 1) + "-" + nowTime.getDate() + " " + this.config.settings.modelSwitchTime.default + ":00";
            if (new Date(tempTime) > nowTime) {
                preTimeStr = dateUtils.dateToStr("yyyy-MM-dd", dateUtils.dateAdd('h', -24, new Date()));
                this.default_sc = "20";
                this.sc_options = utils.deepCopy(this.config.sc_options);
            } else {
                preTimeStr = dateUtils.dateToStr("yyyy-MM-dd", dateUtils.dateAdd('h', 0, new Date()));
                this.default_sc = "08";
                this.sc_options = utils.deepCopy(this.config.sc_options);
                for (let i = 0; i < this.sc_options.length; i++) {
                    if (this.sc_options[i].value != this.default_sc) {
                        this.sc_options.splice(i, 1);
                    }
                }
            }

            this.preTime = preTimeStr;

            //设置日期
            this.pickerOptions = {
                disabledDate(time) {
                    var now = new Date(preTimeStr);
                    return (time.getTime() >= now);
                }
            }


            switch (this.isOpenDoubleWindown) {
                case true:
                    this.wrfForecast_control_css = "wrfForecast_close";
                    break;
                case false:
                    this.wrfForecast_control_css = "wrfForecast_full";
                    break;
            }
            this.p_currCityName = this.getSelectedZoneInfo(this.zoneInfo.default_zone).label;

            this.p_mapTitle = this.config.pre_title + this.getSelectedPollut(this.polDefault).otherlabel;

            //初始化完属性后，进行初始化页面其他业务
            this.$nextTick(() => {
                this.initMap();
                this.initMapRight();

                let result = this.map.sync(this.mapRight);
                let result2 = this.mapRight.sync(this.map);

                switch (this.defaultDateType) {
                    case "hour":
                        this.initComplexTimeControl();
                        break;
                    case "day":
                        this.initSampleTimeControl();
                        break;
                }
                this.setLegend_Pol();
            });
        },

        /**
         * 视图大小更改事件
         */
        onResize() {
            setTimeout(() => {
                this.map.invalidateSize();
                this.mapRight.invalidateSize();
            }, 500);
        },

        /**
         *初始化地图
         */
        initMapRight() {

            let pMap = new $3clearMap('wrfForecast_Pol_MapDiv', this.$$appConfig.map);
            this.mapRight = pMap.llMap;

            let zi = this.getSelectedZoneInfo(this.zoneInfo.default_zone);
            zi.width = this.$$appConfig.prjInfo.modelInfo[this.zoneInfo.default_zone].width;
            zi.height = this.$$appConfig.prjInfo.modelInfo[this.zoneInfo.default_zone].height;
            zi.extent = this.$$appConfig.prjInfo.modelInfo[this.zoneInfo.default_zone].extent;

            this.polygonLayer_Pol = new L.$3clearPolygonLayer({
                imgObjInfo: zi,
                alpha: this.$$appConfig.map.options.opacity,
                color: []
            }).addTo(this.mapRight);
            this.windLayer_Pol = new L.$3clearWindLayer({windData: this.windInfo}).addTo(this.mapRight);

            pMap.setWindLayer(this.windLayer);
            this.markerLayer = L.canvasIconLayer({}).addTo(this.map);
            this.mapRight.fitBounds(this.$$appConfig.prjInfo.defaultExtent[this.zoneInfo.default_zone]);
        },

        /**
         *初始化地图
         */
        initMap() {

            let wMap = new $3clearMap('wrfForecast_MapDiv', this.$$appConfig.map);
            this.map = wMap.llMap;
            //创建一个图层
            this.lineLayer = L.layerGroup().addTo(this.map);


            let zi = this.getSelectedZoneInfo(this.zoneInfo.default_zone);
            zi.width = this.$$appConfig.prjInfo.modelInfo[this.zoneInfo.default_zone].width;
            zi.height = this.$$appConfig.prjInfo.modelInfo[this.zoneInfo.default_zone].height;
            zi.extent = this.$$appConfig.prjInfo.modelInfo[this.zoneInfo.default_zone].extent;

            this.polygonLayer = new L.$3clearPolygonLayer({
                imgObjInfo: zi,
                alpha: this.$$appConfig.map.options.opacity,
                color: []
            }).addTo(this.map);

            this.windLayer = new L.$3clearWindLayer({windData: this.windInfo}).addTo(this.map);
            wMap.setWindLayer(this.windLayer);
            this.map.fitBounds(this.$$appConfig.prjInfo.defaultExtent[this.zoneInfo.default_zone]);
        },

        /**
         * 地图移动重置webgl canvas
         * @private
         */
        _resetWebGLLayer() {
            let mapContainerDiv = this.$$lib_$("#wrfForecast_MapDiv .leaflet-pane.leaflet-map-pane");
            let transForm = mapContainerDiv[0].style.transform;
            let idx = transForm.indexOf('(');
            let ctx = transForm.substring(idx + 1, transForm.length - 1);
            let numCtx = ctx.split(',');
            let tmpStr = "translate3d(";
            numCtx.forEach(item => {
                tmpStr += (-(parseInt(item))) + 'px,';
            });
            tmpStr = tmpStr.substring(0, tmpStr.length - 1) + ')';
            this.$$lib_$("#wrfForecast_Polygon_MapCanvas")[0].style.transform = tmpStr;
            this.$$lib_$("#wrfForecast_Wind_MapCanvas")[0].style.transform = tmpStr;
        },

        /**
         * 地图移动重置webgl canvas
         * @private
         */
        _resetWebGLLayer_Pol() {
            let mapContainerDiv = this.$$lib_$("#wrfForecast_Pol_MapDiv .leaflet-pane.leaflet-map-pane");
            let transForm = mapContainerDiv[0].style.transform;
            let idx = transForm.indexOf('(');
            let ctx = transForm.substring(idx + 1, transForm.length - 1);
            let numCtx = ctx.split(',');
            let tmpStr = "translate3d(";
            numCtx.forEach(item => {
                tmpStr += (-(parseInt(item))) + 'px,';
            });
            tmpStr = tmpStr.substring(0, tmpStr.length - 1) + ')';
            this.$$lib_$("#wrfForecast_Pol_Polygon_MapCanvas")[0].style.transform = tmpStr;
            //this.$$lib_$("#wrfForecast_Pol_Wind_MapCanvas")[0].style.transform = tmpStr;
        },

        /**
         *获取时间控件参数
         */
        getTimeControlPara() {
            let that = this;

            let paraModel = {};

            let showEndTime = dateUtils.dateAdd('d', that.getSelectedZoneInfo(that.zoneInfo.default_zone).predDays, new Date(that.preTime));
            let showEndTimeStr = dateUtils.dateToStr('yyyy-MM-dd', showEndTime);

            let endTime = dateUtils.dateAdd('d', that.getSelectedZoneInfo(that.zoneInfo.default_zone).predDays, new Date(that.preTime));
            let endTimeStr = dateUtils.dateToStr('yyyy-MM-dd', endTime);

            let startShowTime = dateUtils.dateAdd('d', 1, new Date(that.preTime));
            let startShowTimeStr = dateUtils.dateToStr('yyyy-MM-dd', startShowTime);

            paraModel.parent = "wrfForecast_TimeControl";
            paraModel.startTimeStampRange = startShowTimeStr;
            paraModel.endTimeStampRange = endTimeStr;
            paraModel.startTimeStampShowRange = startShowTimeStr;
            paraModel.endTimeStampShowRange = showEndTimeStr;

            if (!that.timeControlObj) {
                paraModel.time = dateUtils.dateAdd('d', 1, new Date());
                paraModel.onChangeTimeCallback = function (data) {
                    that.timeControlCallTime = data.time;
                    that.mapDate = dateUtils.dateToStr("yyyy-MM-dd HH", new Date(data.time)) + " " + "时";
                    that._getCurrData(true, that.isOpenDoubleWindown, that.isOpenWind);
                }
            } else {
                if (that.timeControlObj.options.time < (new Date(paraModel.startTimeStampShowRange)).getTime() || that.timeControlObj.options.time > (new Date(paraModel.endTimeStampShowRange)).getTime()) {
                    paraModel.time = dateUtils.dateToStr("yyyy-MM-dd", new Date(paraModel.startTimeStampShowRange)) + " 00:00:00";
                } else {
                    paraModel.time = that.timeControlObj.options.time;
                }
                that.timeControlObj.options;
            }
            return paraModel;
        },

        /**
         *初始化简单时间控件
         */
        initSampleTimeControl() {
            let that = this;
            that.timeControlObj = new timeControl({
                parent: "wrfForecast_TimeControl",
                dateType: "day",
                onChangeTimeCallback: function (data) {
                    that.preTime = data.time;
                    that._getCurrData(true, that.isOpenDoubleWindown, that.isOpenWind);
                }
            });
        },

        /**
         *初始化复杂时间控件
         */
        initComplexTimeControl() {
            let that = this;
            that.timeControlObj = new complextimecontrol(that.getTimeControlPara());
        },

        /**
         *查询图片和JSON数据，用于绘图
         */
        _getCurrData(isDrawingWrf, isDrawingPol, isDrawingWind) {
            let that = this;

            let polygonPromise = null;
            let windMapPromise = null;
            let linePromise = null;
            let pollut_polygonPromise = null;
            let pollut_windMapPromise = null;
            let path = "";

            let pDate = dateUtils.dateAdd('d', 0, new Date(that.preTime));
            let qTime = dateUtils.strToDate(that.timeControlCallTime);

            let yyyyMMddHH = dateUtils.dateToStr('yyyyMMdd' + that.default_sc, pDate);
            let infoObj = {
                dateType: that.defaultDateType + 'ly',//小时或日均
                year: pDate.getFullYear(),
                pDate: yyyyMMddHH,
                domain: that.zoneInfo.default_zone,
            };

            let newPromise = [null, null, null, null, null];

            let temp = null;

            //绘制wrf的数据
            if (isDrawingWrf) {
                if (that.selectedMenus.length > 0) {
                    for (var i = 0; i < that.selectedMenus.length; i++) {
                        switch (that.selectedMenus[i].type) {
                            case "point":
                                temp = utils.getCurrFigureInfo(pDate, qTime, 1, 2);
                                //if(((that.selectedMenus[i].token=="add"||that.selectedMenus[i].token=="edit")&&(!that.timeControlObj||!that.timeControlObj.getStatus()))||(that.timeControlObj&&that.timeControlObj.getStatus())){
                                if (true) {

                                    that.windLayer.setMask(that.$refs["masking_" + that.zoneInfo.default_zone]);

                                    infoObj.name = that.selectedMenus[i].name;
                                    infoObj.target = that.selectedMenus[i].value;
                                    infoObj.time = temp.figure1Name;
                                    infoObj.model = that.selectedMenus[i].model;
                                    path = that._getFigurePathInfo(infoObj);

                                    windMapPromise = that.windLayer.setWindInfo(path, temp.model, that.windInfo);
                                    newPromise[0] = windMapPromise;
                                    //all.push(linePromise);
                                }
                                break;
                            case "polyline":
                                temp = utils.getCurrFigureInfo(pDate, qTime, 1, 1);
                                //if(((that.selectedMenus[i].token=="add"||that.selectedMenus[i].token=="edit")&&(!that.timeControlObj||!that.timeControlObj.getStatus()))||(that.timeControlObj&&that.timeControlObj.getStatus())){
                                if (true) {
                                    infoObj.name = that.selectedMenus[i].name;
                                    infoObj.target = that.selectedMenus[i].value;
                                    infoObj.time = temp.figure1Name;
                                    infoObj.model = that.selectedMenus[i].model;
                                    path = that._getJsonPathInfo(infoObj);

                                    linePromise = Vue.axios({
                                        methods: 'get',
                                        headers: {},
                                        url: path,
                                        baseURL: ''
                                    });
                                    newPromise[1] = linePromise;
                                }
                                break;
                            case "polygon":
                                temp = utils.getCurrFigureInfo(pDate, qTime, 1, 2);
                                //if(((that.selectedMenus[i].token=="add"||that.selectedMenus[i].token=="edit")&&(!that.timeControlObj||!that.timeControlObj.getStatus()))||(that.timeControlObj&&that.timeControlObj.getStatus())){
                                if (true) {
                                    that.polygonLayer.setMask(that.$refs["masking_" + that.zoneInfo.default_zone]);

                                    infoObj.name = that.selectedMenus[i].name;
                                    infoObj.target = that.selectedMenus[i].value;
                                    infoObj.time = temp.figure1Name;
                                    infoObj.model = that.selectedMenus[i].model;
                                    if (infoObj.name == "AOD" || infoObj.name == "PBLH" || infoObj.name == "VISIB") {
                                        infoObj.name = infoObj.target;
                                    }
                                    path = that._getFigurePathInfo(infoObj);
                                    //判断是否不同区域渲染分级不一样
                                    let colors = that.selectedMenus[i].isZone ? that.config.levelColor[that.selectedMenus[i].levelColor][that.zoneInfo.default_zone].color : that.config.levelColor[that.selectedMenus[i].levelColor].color;
                                    polygonPromise = that.polygonLayer.setImgInfo(path, path, that.$$appConfig.prjInfo.modelInfo[that.zoneInfo.default_zone], temp.t, temp.model, colors);
                                    newPromise[2] = polygonPromise;

                                    //all.push(polygonPromise);
                                }
                                break;
                        }
                    }
                }
            }

            //绘制污染物数据
            if (isDrawingPol) {
                if (that.polDefault != "") {
                    temp = utils.getCurrFigureInfo(pDate, qTime, 1, 2);
                    if (true) {

                        that.polygonLayer_Pol.setMask(that.$refs["masking_" + that.zoneInfo.default_zone]);

                        infoObj.name = that.polDefault.toUpperCase();//PM10
                        infoObj.time = temp.figure1Name;
                        infoObj.model = that.getSelectedModelLabel(that.defaultModel).label;
                        infoObj.postionHeight = that.config.postion_height;
                        path = that._getFigurePathInfo_Pollut(infoObj);

                        pollut_polygonPromise = that.polygonLayer_Pol.setImgInfo(path, path, that.$$appConfig.prjInfo.modelInfo[that.zoneInfo.default_zone], temp.t, temp.model, that.$$appConfig.polColors[infoObj.name][that.defaultDateType].colors);
                        newPromise[3] = pollut_polygonPromise;
                    }
                }
            }

            //绘制风数据
            if (isDrawingPol) {
                if (that.windLayer_Pol && that.isOpenWind == false) {
                    that.windLayer_Pol.hide();
                }
                if (that.isOpenWind) {
                    temp = utils.getCurrFigureInfo(pDate, qTime, 1, 2);
                    if (true) {

                        that.windLayer_Pol.setMask(that.$refs["masking_" + that.zoneInfo.default_zone]);

                        infoObj.name = that.config.preWind.name;
                        infoObj.target = that.config.preWind.target;
                        infoObj.time = temp.figure1Name;
                        infoObj.model = that.config.preWind.model;
                        path = that._getFigurePathInfo(infoObj);

                        pollut_windMapPromise = that.windLayer_Pol.setWindInfo(path, temp.model, that.windInfo);
                        newPromise[4] = pollut_windMapPromise;
                        //all.push(linePromise);

                    }
                }
            }

            Promise.all(newPromise).then((res) => {
                if (res[1] && res[1].data) {
                    for (let i = 0; i < that.selectedMenus.length; i++) {
                        if (that.selectedMenus[i].type == "polyline") {
                            let maxMarkLabel = 'H',
                                maxMarkColor = '#1c7fff',
                                minMarkLabel = 'L',
                                minMarkColor = '#ff0000',
                                dashArray = null,
                                lineColor = '#1169ff';
                            if (that.selectedMenus[i].label === '温度') {
                                maxMarkLabel = 'W';
                                maxMarkColor = '#ff0000';
                                minMarkLabel = 'C';
                                minMarkColor = '#1c7fff';
                                lineColor = '#f04f00';
                                dashArray = '5';
                            }
                            // drawPoints(data.high.points, data.high.value, '#1c7fff', 'H');
                            // drawPoints(data.low.points, data.low.value, '#ff0000', 'L');L
                            that._drewIsoline(res[1].data, that.lineLayer, that.markerLayer, that.map, maxMarkLabel, maxMarkColor, minMarkLabel, minMarkColor, lineColor, dashArray);
                            break;
                        }
                    }
                }
                that._nexTime();
            }, (err) => {
                that._removeGroupLayers(that.lineLayer,that.map);
                if (that.markerLayer) {
                    that.markerLayer.clearLayers();
                }
                that._nexTime();
            });

        },

        _nexTime() {
            let that = this;

            if (that.timeOutEvent) {
                clearTimeout(that.timeOutEvent);
                that.timeOutEvent = null;
            }

            that.timeOutEvent = setTimeout(() => {
                if (that.timeControlObj.getStatus())
                    that.timeControlObj.nextPlay();
            }, 500);
        },

        _drewIsoline(data, lyr, markerLyr, map, maxMarkLabel, maxMarkColor, minMarkLabel, minMarkColor, lineColor, dashArray) {
            let _this = this;
            _this._removeGroupLayers(lyr, map);

            if (markerLyr) {
                markerLyr.clearLayers();
            }

            if (data.length === 0)
                return;

            drawIsoline(data.isoline);
            drawPoints(data.high.points, data.high.value, maxMarkColor, maxMarkLabel);
            drawPoints(data.low.points, data.low.value, minMarkColor, minMarkLabel);

            function drawIsoline(isoline) {
                let lnglats = [];
                for (let s = 0; s < isoline.length; s++) {
                    let isolineItem = isoline[s],
                        bbox = isolineItem.bbox,
                        points = t(isolineItem.points);

                    points = o(points);
                    let centerIdx = Math.round(points.length / 2) - 1;

                    if (bbox[1] > 180 || bbox[3] < -180) {
                        let _points = e(points, bbox[1] > 180);
                        _points.forEach((pt, idx) => {
                            let tmp = pt[0];
                            pt[0] = pt[1];
                            pt[1] = tmp;
                        });

                        let t = new L.icon.PrLineMarker({
                            value: isolineItem.value
                        });
                        markerLyr.addMarker(L.marker(_points[centerIdx], {icon: t}));
                        lnglats.push(_points);
                    }
                    points.forEach((point, idx) => {
                        let tmp = point[0];
                        point[0] = point[1];
                        point[1] = tmp;

                    });
                    let m = new L.icon.PrLineMarker({
                        value: isolineItem.value
                    });
                    markerLyr.addMarker(L.marker(points[centerIdx], {icon: m}));
                    lnglats.push(points);
                }
                //let isolineLayer = L.polyline(lnglats, {color: '#fff000', weight: 1, renderer: L.canvas()});
                let isolineLayer = L.polyline(lnglats, {
                    color: lineColor,
                    dashArray: dashArray,
                    weight: 2,
                    renderer: L.canvas()
                });
                lyr.addLayer(isolineLayer);
            }


            function drawPoints(data, value, color, type) {

                for (let i = 0; i < value.length; i++) {
                    let e = new L.icon.ExtremeMarker({
                        type: type,
                        typeFontColor: color,
                        valueFontColor: color,
                        value: value[i]
                    });
                    let marker = L.marker([data[i * 2], data[i * 2 + 1]], {icon: e});
                    markerLyr.addMarker(marker);
                }
            }

            function a(n) {
                var e = .5 * Math.PI,
                    t = s(n),
                    o = t[0][3];
                if (i(n[0], n[3]) < 1 && r(n[0], o, n[3]) > e) return [];
                var l = a(t[0], e),
                    u = a(t[1], e);
                return l.push(o), l.concat(u)
            }

            function s(n) {
                var e = [(n[0][0] + 3 * n[1][0] + 3 * n[2][0] + n[3][0]) / 8, (n[0][1] + 3 * n[1][1] + 3 * n[2][1] + n[3][1]) / 8],
                    t = [(n[0][0] + n[1][0]) / 2, (n[0][1] + n[1][1]) / 2],
                    o = [(n[0][0] + 2 * n[1][0] + n[2][0]) / 4, (n[0][1] + 2 * n[1][1] + n[2][1]) / 4];
                return [
                    [n[0], t, o, e],
                    [e, [(n[1][0] + 2 * n[2][0] + n[3][0]) / 4, (n[1][1] + 2 * n[2][1] + n[3][1]) / 4],
                        [(n[2][0] + n[3][0]) / 2, (n[2][1] + n[3][1]) / 2], n[3]
                    ]
                ]
            }

            function r(n, e, t) {
                var o = [n[0] - e[0], n[1] - e[1]],
                    r = [t[0] - e[0], t[1] - e[1]];
                return Math.abs(Math.atan2(o[0] * r[1] - o[1] * r[0], o[0] * r[0] + o[1] * r[1]))
            }

            function i(n, e) {
                var t = n[0] - e[0],
                    o = n[1] - e[1];
                return t * t + o * o
            }


            function t(n) {
                for (var e = [], t = 0; t < n.length - 1; t += 2)
                    e.push([n[t + 1], n[t]]);
                return e;
            }

            function o(n) {
                if (n.length <= 2) return n;
                for (var e = c(n, .25), t = [e[0][0]], o = 0; o < e.length; ++o)
                    t = t.concat(a(e[o])),
                        t.push(e[o][3]);
                return t
            }

            function c(n, e) {
                if (n = u(n), n.length <= 2) return n;
                var t = n[0],
                    o = n[n.length - 1];
                if (h(n[0], n[n.length - 1])) {
                    t = [n[n.length - 2][0], n[n.length - 2][1]];
                    var r = t[0] - n[0][0];
                    r > 180 ? t[0] -= 360 : r < -180 && (t[0] += 360), o = [n[1][0], n[1][1]];
                    var i = o[0] - n[n.length - 1][0];
                    i > 180 ? o[0] -= 360 : i < -180 && (o[0] += 360)
                }
                for (var a = [], s = 0; s + 1 < n.length; ++s) {
                    var c = s >= 1 ? n[s - 1] : t,
                        f = s + 2 < n.length ? n[s + 2] : o,
                        d = l(n[s], n[s + 1]),
                        p = l(c, n[s + 1]),
                        v = l(f, n[s]),
                        m = 0 == p ? n[s] : [n[s][0] + e * d * (n[s + 1][0] - c[0]) / p, n[s][1] + e * d * (n[s + 1][1] - c[1]) / p],
                        g = 0 == v ? n[s + 1] : [n[s + 1][0] + e * d * (n[s][0] - f[0]) / v, n[s + 1][1] + e * d * (n[s][1] - f[1]) / v];
                    a.push([n[s], m, g, n[s + 1]])
                }
                return a
            }

            function u(n) {
                if (0 == n.length)
                    return [];
                for (var e = [n[0]], t = 1; t < n.length; ++t)
                    n[t][0] == e[e.length - 1][0] && n[t][1] == e[e.length - 1][1] || e.push(n[t]);
                return e
            }

            function l(n, e) {
                var t = e[0] - n[0],
                    o = e[1] - n[1];
                return Math.sqrt(t * t + o * o)
            }

            function h(n, e) {
                return n[1] == e[1] && (n[0] == e[0] || n[0] + 360 == e[0] || n[0] - 360 == e[0])
            }

            function e(n, e) {
                for (var t = [], o = e ? -360 : 360, r = 0; r < n.length; r++)
                    t.push([n[r][0] + o, n[r][1]]);
                return t
            }

        },


        _removeGroupLayers(lyr,map){
            if (lyr) {
                lyr.eachLayer(function (layer) {
                    let canvas = map.getRenderer(layer);
                    canvas.remove();
                    layer.remove();
                });
            }
        },

        /**
         * 根据模板获取图片地址
         * @param obj 图片地址信息
         * @returns {*} 图片iis发布地址
         * @private
         */
        _getFigurePathInfo(obj) {
            //static\Met\WeaChart\hourly\P700\2017\2017111020\P700wind_d01_WRF_2017111100_2.png
            let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%=pDate%>/<%=target%>_<%=domain%>_<%=model%>_<%=time%>_2.png");
            switch (obj.name) {
                case "AOD":
                case "PBLH":
                case "VISIB":
                    return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.metSpaFigurePath + figurePath(obj);
                default:
                    return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.weaChartFigurePath + figurePath(obj);
            }

        },

        /**
         * 根据模板获取图片地址
         * @param obj 图片地址信息
         * @returns {*} 图片iis发布地址
         * @private
         */
        _getFigurePathInfo_Pollut(obj) {
            let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%=pDate%>/<%=name%>_<%=domain%>_<%=postionHeight%>_<%=model%>_<%=time%>_2.png");
            return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.polFigurePath + figurePath(obj);
        },

        /**
         * 根据模板获取图片地址
         * @param obj 图片地址信息
         * @returns {*} 图片iis发布地址
         * @private
         */
        _getFigurePathInfo(obj) {
            //static\Met\WeaChart\hourly\P700\2017\2017111020\P700wind_d01_WRF_2017111100_2.png
            let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%=pDate%>/<%=target%>_<%=domain%>_<%=model%>_<%=time%>_2.png");
            switch (obj.name) {
                case "AOD":
                case "PBLH":
                case "VISIB":
                    return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.metSpaFigurePath + figurePath(obj);
                default:
                    return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.weaChartFigurePath + figurePath(obj);
            }
        },

        /**
         * 根据模板获取Json文件地址
         * @param obj 图片地址信息
         * @returns {*} 图片iis发布地址
         * @private
         */
        _getJsonPathInfo(obj) {
            let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%=pDate%>/<%=target%>_<%=domain%>_<%=model%>_<%=time%>.json");
            switch (obj.name) {
                case "AOD":
                case "PBLH":
                case "VISIB":
                    return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.metSpaFigurePath + figurePath(obj);
                default:
                    return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.weaChartFigurePath + figurePath(obj);
            }
        },

        /**
         * 通过区域编码获取区域信息
         * @param zoneCode d1、d2、d3
         * @private
         */
        getSelectedZoneInfo(zoneCode) {
            let that = this;
            let result = null;
            for (var i = 0; i < that.zoneInfo.options.length; i++) {
                if (that.zoneInfo.options[i].value == zoneCode) {
                    result = that.zoneInfo.options[i];
                    break;
                }
            }
            return result;
        },

        getSelectedPollut(value) {
            let that = this;
            let result = null;
            for (var i = 0; i < that.config.memu_Pol_Options[0].listItem[0].length; i++) {
                if (that.config.memu_Pol_Options[0].listItem[0][i].value == value) {
                    result = that.config.memu_Pol_Options[0].listItem[0][i];
                    break;
                }
            }
            return result;
        },

        getSelectedModelLabel(value) {
            let that = this;
            let model = null;
            that.models = that.$$appConfig.prjInfo.modelInfo.model;
            for (let i = 0; i < that.models.length; i++) {
                if (that.models[i].value == value) {
                    model = that.models[i];
                    break;
                }
            }
            return model;
        },

        /**
         *选择小时或者日均后的切换时间回调
         */
        on_DateType_Change(type) {
            let that = this;

            that.defaultDateType = type;

            if (that.timeControlObj != null) {
                that.timeControlObj.destroy();
                that.timeControlObj = null;
            }
            switch (type) {
                case "day":
                    that.initSampleTimeControl();
                    break;
                case "hour":
                    that.initComplexTimeControl();
                    break;
            }
        },

        /**
         *选择起报时间后的回调
         */
        on_PreTime_Change(time) {
            let that = this;

            let nowTime = new Date();
            let tempTime = nowTime.getFullYear() + "-" + (nowTime.getMonth() + 1) + "-" + nowTime.getDate();
            if (new Date(time) < new Date(tempTime)) {
                this.default_sc = "20";
            } else {
                this.default_sc = "08";
            }

            that.preTime = time;

            if (that.timeControlObj) {
                that.timeControlObj.stopPlay();
                that.timeControlObj.setOptions(that.getTimeControlPara());
            }
        },

        /**
         *选择起报时间后的回调
         */
        on_Sc_Change(sc) {
            let that = this;
            that.default_sc = sc;

            if (that.timeControlObj && !that.timeControlObj.getStatus()) {
                that._getCurrData(true, that.isOpenDoubleWindown, that.isOpenWind);
            }

        },

        /**
         *选择区域后的回调
         */
        on_domainChange(data) {
            let that = this;

            that.zoneInfo.default_zone = data;

            that.map.fitBounds(that.$$appConfig.prjInfo.defaultExtent[that.zoneInfo.default_zone]);

            that.currCityName = that.getSelectedZoneInfo(that.zoneInfo.default_zone).label;

            that.windInfo.extent = that.$$appConfig.prjInfo.modelInfo[that.zoneInfo.default_zone].extent;
            that.windInfo.width = that.$$appConfig.prjInfo.modelInfo[that.zoneInfo.default_zone].width;
            that.windInfo.height = that.$$appConfig.prjInfo.modelInfo[that.zoneInfo.default_zone].height;

            that._getCurrData(true, that.isOpenDoubleWindown, that.isOpenWind);

            if (that.timeControlObj) {
                that.timeControlObj.stopPlay();
                that.timeControlObj.setOptions(that.getTimeControlPara());
            }

            this._createLegend();
        },

        /**
         *选择菜单回调函数
         */
        on_Menu_Change(data) {
            let that = this;

            let tipName = "";


            //1.判断有无修改
            for (let i = 0; i < data.length; i++) {
                if (i == 0) {
                    tipName = data[i].pName;
                }

                tipName = tipName + "-" + data[i].label;

                for (let j = 0; j < that.selectedMenus.length; j++) {
                    if (data[i].type == that.selectedMenus[j].type && data[i].value == that.selectedMenus[j].value) {
                        data[i].token = "exist";
                    } else if (data[i].type == that.selectedMenus[j].type && data[i].value != that.selectedMenus[j].value) {
                        data[i].token = "edit";
                    }
                }
            }

            that.mapTitle = tipName;


            //2.判断有无新增
            //if(data.length>that.selectedMenus.length){
            for (let i = 0; i < data.length; i++) {
                let isAdd = true;
                for (let j = 0; j < that.selectedMenus.length; j++) {
                    if (data[i].type == that.selectedMenus[j].type) {
                        isAdd = false;
                    }
                }
                if (isAdd) {
                    data[i].token = "add";
                }
            }
            //}

            //3.判断有无删除
            //if(data.length<that.selectedMenus.length){
            for (let i = 0; i < that.selectedMenus.length; i++) {
                let isRemove = true;
                for (let j = 0; j < data.length; j++) {
                    if (data[j].type == that.selectedMenus[i].type) {
                        isRemove = false;
                    }
                }
                if (isRemove) {
                    that.selectedMenus[i].token = "remove";
                    switch (that.selectedMenus[i].type) {
                        case "point":
                            if (that.windLayer) {
                                that.windLayer.hide();
                            }
                            break;
                        case "polyline":
                            that._removeGroupLayers(that.lineLayer,that.map);
                            if (that.markerLayer) {
                                that.markerLayer.clearLayers();
                            }
                            break;
                        case "polygon":
                            if (that.polygonLayer) {
                                that.polygonLayer.hide();
                            }
                            break;
                    }
                }
            }
            //}

            that.selectedMenus = data;


            this._createLegend();

            if (that.timeControlObj && !that.timeControlObj.getStatus()) {
                that._getCurrData(true, that.isOpenDoubleWindown, that.isOpenWind);
            }

        },
        _createLegend() {
            this.legendOption = [];
            for (let i = 0; i < this.selectedMenus.length; i++) {
                if (this.selectedMenus[i].type == "polygon") {
                    let configTemp = this.selectedMenus[i].isZone ? this.config.levelColor[this.selectedMenus[i].levelColor][this.zoneInfo.default_zone] : this.config.levelColor[this.selectedMenus[i].levelColor];
                    let legendTemp = {};
                    legendTemp.width = 420;
                    legendTemp.height = 15;
                    legendTemp._w = 0;
                    legendTemp.step = configTemp.step;
                    legendTemp.class = configTemp.class;
                    legendTemp.unite = (configTemp.unite == "" ? "" : "(" + configTemp.unite + ")");
                    legendTemp.color = configTemp.color;
                    legendTemp.name = this.selectedMenus[i].label;

                    this.legendOption.push(legendTemp);
                }
            }
        },

        on_modelChange(data) {
            let that = this;
            if (that.timeControlObj && !that.timeControlObj.getStatus()) {
                that._getCurrData(true, that.isOpenDoubleWindown, that.isOpenWind);
            }
        },

        handlePolName(name) {
            return utils.addSubToLabel(name)
        },


        on_Menu_Pol_Change(data) {
            let that = this;
            if (data.length > 0) {
                that.polDefault = data[0].value;
                that.p_mapTitle = that.config.pre_title + data[0].otherlabel;
            } else {
                that.polDefault = "";
                that.p_mapTitle = "";
                if (that.polygonLayer_Pol)
                    that.polygonLayer_Pol.hide();
            }
            that.setLegend_Pol();

            if (that.timeControlObj && !that.timeControlObj.getStatus()) {
                that._getCurrData(true, that.isOpenDoubleWindown, that.isOpenWind);
            }
        },

        setLegend_Pol() {
            let that = this;

            that.legendOption_Pol = [];

            if (that.polDefault != "") {
                let legendTemp = {};

                legendTemp.width = 420;
                legendTemp.height = 15;
                legendTemp.step = that.$$appConfig.polColors[that.polDefault.toUpperCase()][that.defaultDateType].step;
                legendTemp.class = that.$$appConfig.polColors[that.polDefault.toUpperCase()][that.defaultDateType].class;
                legendTemp.unite = that.$$appConfig.polColors[that.polDefault.toUpperCase()][that.defaultDateType].unit;
                legendTemp.color = that.$$appConfig.polColors[that.polDefault.toUpperCase()][that.defaultDateType].colors;
                legendTemp.name = that.getSelectedPollut(that.polDefault).otherlabel;
                if ("AQI" == legendTemp.name) {
                    legendTemp.labels = that.$$appConfig.polColors[that.polDefault.toUpperCase()][that.defaultDateType].labels;
                }
                that.legendOption_Pol.push(legendTemp);
            }

        },

        on_openCloseWindChange(data) {
            let that = this;
            if (that.windLayer_Pol && that.isOpenWind == false) {
                that.windLayer_Pol.hide();
            }

            if (that.timeControlObj && !that.timeControlObj.getStatus()) {
                that._getCurrData(true, that.isOpenDoubleWindown, that.isOpenWind);
            }
        },

        on_fullClick(data) {
            let that = this;
            that.isOpenDoubleWindown = !data;

            switch (that.isOpenDoubleWindown) {
                case true:
                    that.wrfForecast_control_css = "wrfForecast_close";
                    if (that.timeControlObj && !that.timeControlObj.getStatus()) {
                        //that._getCurrData(true,that.isOpenDoubleWindown,that.isOpenWind);
                    }
                    break;
                case false:
                    that.wrfForecast_control_css = "wrfForecast_open";
                    that.isOpenWind = false;
                    if (that.timeControlObj && !that.timeControlObj.getStatus()) {
                        //that._getCurrData(true,that.isOpenDoubleWindown,that.isOpenWind);
                    }
                    break;
            }

            setTimeout(() => {
                that.map.invalidateSize(false);
                that.mapRight.invalidateSize(false);

                that._getCurrData(true, that.isOpenDoubleWindown, that.isOpenWind);

            }, 1000);
        }


    },

    /**
     *激活当前菜单功能
     */
    activated: function () {

        setTimeout(() => {
            this.mapRight.invalidateSize();
        }, 1000);

        if (this.isConfigLoaded) {
            //todo get data use ajax

            //每次激活的时候重新设置时间日历可选范围
            this.pickerOptions = {
                disabledDate(time) {
                    var now = new Date();
                    return (time.getTime() >= now);
                }
            }

        }

        setTimeout(() => {
            this.map.invalidateSize();
            this.mapRight.invalidateSize();
        }, 1000);


        this.onResize();
    },

    /**
     *解除激活当前菜单功能后回调
     */
    deactivated: function () {

    },

    /**
     *解除激活当前菜单功能前回调
     */
    beforeRouteLeave: function (to, from, next) {
        if (this.timeControlObj)
            this.timeControlObj.stopPlay();
        next(true);
    }

}


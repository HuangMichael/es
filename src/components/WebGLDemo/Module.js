/**
 * Created by kangming
 * date: 2017/11/09
 * desc: GIS四视窗
 */
import Vue from 'vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import syncMap from 'libs/Leaflet-ext/L.Map.Sync.js';
//leaflet
import Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import cTileLayer from 'libs/Leaflet-ext/L.3ClearLayer';
import mapProvider from 'libs/Leaflet-ext/leaflet.MapProviders.js'

//webgl polygon
import {WebGLPolygon} from '3clear/libs/WebGL_Polygon';
import {WebGLWind} from '3clear/libs/WebGL_Wind';

//time control
import '3clear/control/TimeControl2/css/complextimecontrol.css';
import {complextimecontrol} from '3clear/control/TimeControl2/js/complextimecontrol.js';

//utils
import {dateUtils} from "../../utils/dateUtils";
import {utils} from "../../utils/utils";

import panelSelect from '3clear/comm/PanelSelect/PanelSelect.vue'


export default {
    components: {
        'setting-dialog': settingDialog,
        'panel-select': panelSelect
    },
    data() {
        return {
            //模块基础数据信息
            name: 'DistributionMap',
            rightPanelWidth: 193,
            isConfigLoaded: false,
            config: {},

            //业务数据
            maps: [],
            domain: 'd1',
            currSelectedTimeStr: '',
            infos: {

                title: '-区域-',
                options: [{
                    label: '全国',
                    value: 'd1'
                }, {
                    label: '华东',
                    value: 'd2'
                }, {
                    label: '江苏',
                    value: 'd3'
                }]
            },

            wind: [],
            webGLPolygon: [],
            isolineGroupLayer: [],
            color:null

        }
    },

    created() {
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

            this.$nextTick(() => {
                this._initMap();
                this._setTimeControl();
            });
            //todo get data use ajax api
        },

        _initMap() {

            this.color = [
                245, 255, 255, 255,
                210, 255, 255, 255,
                190, 255, 255, 255,
                150, 243, 255, 255,
                131, 232, 255, 255,
                74, 221, 255, 255,
                26, 212, 255, 255,
                0, 195, 255, 255,
                0, 202, 255, 255,
                0, 220, 220, 255,
                0, 232, 190, 255,
                0, 230, 175, 255,
                0, 230, 140, 255,
                0, 230, 110, 255,
                0, 230, 80, 255,
                0, 230, 60, 255,
                0, 230, 50, 255,
                0, 230, 0, 255,
                30, 230, 0, 255,
                100, 235, 0, 255,
                180, 240, 0, 255,
                220, 250, 0, 255,
                255, 255, 0, 255,
                255, 250, 0, 255,
                255, 245, 0, 255,
                255, 242, 0, 255,
                255, 240, 0, 255,
                255, 238, 0, 255,
                255, 235, 0, 255,
                255, 230, 0, 255,
                255, 220, 0, 255,
                255, 200, 0, 255,
                255, 190, 0, 255,
                255, 185, 0, 255,
                255, 180, 0, 255,
                255, 175, 0, 255,
                255, 170, 0, 255,
                255, 165, 0, 255,
                255, 145, 0, 255,
                255, 115, 0, 255,
                255, 95, 0, 255,
                255, 70, 0, 255,
                255, 20, 0, 255,
                255, 0, 0, 255,
                245, 0, 0, 255,
                247, 0, 0, 255,
                249, 0, 0, 255,
                250, 0, 0, 255,
                252, 0, 0, 255,
                240, 0, 20, 255,
                240, 0, 50, 255,
                220, 0, 100, 255,
                200, 0, 145, 255,
                180, 0, 150, 255,
                160, 0, 150, 255,
                150, 0, 150, 255,
                140, 0, 160, 255,
                135, 0, 160, 255,
                130, 0, 160, 255,
                125, 0, 160, 255,
                120, 0, 160, 255,
                110, 0, 160, 255
            ];
            let mapDivs = ["disTopLeftMap", "disTopRightMap", "disBottomLeftMap", "disBottomRightMap"];
            mapDivs.forEach((divId, idx) => {
                this.maps[idx] = L.map(divId, {
                    center: [35.14696, 115.00228],
                    zoom: 4,
                    minZoom: 1,
                    maxZoom: 15
                });
                L.tileLayer.mapProvider('Geoq.Normal.PurplishBlue', {attribution: ''}).addTo(this.maps[idx]);
                this.isolineGroupLayer[idx] = L.layerGroup().addTo(this.maps[idx]);

                let disMapCanvas = document.getElementById(divId + 'DisMapCanvas');
                let tilePane = this.$$lib_$("div#" + divId + " .leaflet-pane.leaflet-tile-pane");
                this.$$lib_$("#" + divId + 'DisMapCanvas').insertAfter(tilePane);
                this.$$lib_$("#" + divId + 'DisMapCanvas')[0].style.width = this.maps[idx].getSize().x + 'px';
                this.$$lib_$("#" + divId + 'DisMapCanvas')[0].style.height = this.maps[idx].getSize().y + 'px';
                this.webGLPolygon[idx] = new WebGLPolygon(disMapCanvas, this.maps[idx], this.config.gfsDisMap, 0.5, this.color);

                let windCanvas = document.getElementById(divId + 'WindCanvas');
                this.$$lib_$("#" + divId + 'WindCanvas').insertAfter(this.$$lib_$("#" + divId + 'DisMapCanvas'));
                this.$$lib_$("#" + divId + 'WindCanvas')[0].style.width = this.maps[idx].getSize().x + 'px';
                this.$$lib_$("#" + divId + 'WindCanvas')[0].style.height = this.maps[idx].getSize().y + 'px';
                this.wind[idx] = new WebGLWind(windCanvas, this.maps[idx], this.config.windInfo);


                this.maps[idx].on("zoom", (event) => {
                    this._resetWebGLLayer();
                });

                this.maps[idx].on('move', (event) => {
                    this._resetWebGLLayer()
                });
            });

            //地图关联
            this.maps.forEach((map, idx) => {
                let tmpMaps = this.maps.filter((tmpMap, id) => {
                    return id !== idx;
                });
                tmpMaps.forEach(tMap => {
                    map.sync(tMap);
                })
            });

        },


        /**
         * 地图移动重置webgl canvas
         * @private
         */
        _resetWebGLLayer() {
            let mapDivs = ["disTopLeftMap", "disTopRightMap", "disBottomLeftMap", "disBottomRightMap"];
            mapDivs.forEach((divId) => {
                let tilePane = this.$$lib_$("div#" + divId + " .leaflet-pane.leaflet-map-pane");
                let transForm = tilePane[0].style.transform;
                let idx = transForm.indexOf('(');
                let ctx = transForm.substring(idx + 1, transForm.length - 1);
                let numCtx = ctx.split(',');
                let tmpStr = "translate3d(";
                numCtx.forEach(item => {
                    tmpStr += (-(parseInt(item))) + 'px,';
                });
                tmpStr = tmpStr.substring(0, tmpStr.length - 1) + ')';
                this.$$lib_$("#" + divId + 'DisMapCanvas')[0].style.transform = tmpStr;
                this.$$lib_$("#" + divId + 'WindCanvas')[0].style.transform = tmpStr;
            });
        },

        /**
         * 创建或更新时间控件
         */
        _setTimeControl() {
            let _this = this;
            let showEndTime = dateUtils.dateAdd('d', 9, new Date());
            let showEndTimeStr = dateUtils.dateToStr('yyyy-MM-dd', showEndTime);

            let endTime = dateUtils.dateAdd('d', 9, new Date());
            let endTimeStr = dateUtils.dateToStr('yyyy-MM-dd', endTime);

            let startShowTime = dateUtils.dateAdd('d', 0, new Date());
            let startShowTimeStr = dateUtils.dateToStr('yyyy-MM-dd', startShowTime);

            let nowTime = new Date();

            let options = {
                parent: "disMapMultiViewControl",
                startTimeStampRange: startShowTimeStr,
                endTimeStampRange: endTimeStr,
                startTimeStampShowRange: startShowTimeStr,
                endTimeStampShowRange: showEndTimeStr,
                time: nowTime
            };
            if (this.timeControl) {
                this.timeControl.setOptions(options);
            }
            else {
                options.onChangeTimeCallback = function (data) {
                    _this.currSelectedTimeStr = data.time;
                    _this._getCurrData();
                };
                this.timeControl = new complextimecontrol(options);
            }
        },


        _getCurrData() {
            let pDate = dateUtils.dateAdd('d', -1, new Date());
            let qTime = dateUtils.strToDate(this.currSelectedTimeStr);
            let {t, model, figure1Name, figure2Name} = utils.getCurrFigureInfo(pDate, qTime, 1, 2);
            let yyyyMMddHH = dateUtils.dateToStr('yyyyMMdd20', pDate);
            let infoObj = {
                dateType: 'hourly',//小时或日均
                name: 'PM25',
                target: 'PM25',
                year: pDate.getFullYear(),
                pDate: yyyyMMddHH,
                domain: 'd01',
                model: 'NAQPMS',
                time: figure1Name
            };
            let all = [];
            let path = this._getFigurePathInfo(infoObj);
            let disMapPromise1 = this.webGLPolygon[0].setImgInfo(path, path, this.config.disMap['d1'], t, model,this.color);
            all.push(disMapPromise1);
            infoObj.name = "PM10";
            infoObj.target = "PM10";
            path = this._getFigurePathInfo(infoObj);
            let disMapPromise2 = this.webGLPolygon[1].setImgInfo(path, path, this.config.disMap['d1'], t, model,this.color);
            all.push(disMapPromise2);

            infoObj.name = "PM10";
            infoObj.target = "PM10";
            path = this._getFigurePathInfo(infoObj);
            let windMapPromise = this.wind[2].setWindInfo(path, model,this.config.windInfo);
            all.push(windMapPromise);


            let infos = utils.getCurrFigureInfo(pDate, qTime, 1, 1);
            infoObj.name = "Transparent";
            infoObj.target = "Pr";
            infoObj.time = infos.figure1Name;

            path = this._getJsonPathInfo(infoObj);

            let isonlinePromise = Vue.axios({
                methods: 'get',
                headers: {},
                url: path,
                baseURL: ''
            });
            all.push(isonlinePromise);

            Promise.all([disMapPromise1, disMapPromise2, windMapPromise,isonlinePromise]).then((res) => {
                if (res[3] && res[3].data) {
                    this._drewIsoline(res[3].data, this.isolineGroupLayer[3], this.maps[3]);
                }

                this._nexTime();
            }, (err) => {
                this.isolineGroupLayer[3].clearLayers();
                this._nexTime();
            });
        },

        _nexTime() {
            if (this.timeOutEvent)
                clearTimeout(this.timeOutEvent);
            this.timeOutEvent = setTimeout(() => {
                if (this.timeControl.getStatus())
                    this.timeControl.nextPlay();
            }, 500);
        },


        /**
         * 绘制等值线
         * @param data json data
         * @param lyr 绘制图层对象
         * @param map 绘制地图对象
         * @private
         */
        _drewIsoline(data, lyr, map) {

            if (lyr) {
                lyr.clearLayers();
            }
            if (data.length === 0)
                return;

            drawIsoline(data.isoline);
            drawPoints(data.high.points, data.high.value, '#1c7fff', 'H');
            drawPoints(data.low.points, data.low.value, '#ff0000', 'L');

            function drawIsoline(isoline) {


                let lnglats = [];
                for (let s = 0; s < isoline.length; s++) {
                    let isolineItem = isoline[s],
                        bbox = isolineItem.bbox,
                        points = t(isolineItem.points);

                    points = o(points);

                    let centerIdx = Math.round(points.length / 2) - 1;

                    let myIcon = L.divIcon({
                        html: "<div style='color:#000;background-color: #e6ebf5;\n" +
                        "    border-radius: 4px;\n" +
                        "    width: 36px;\n" +
                        "    text-align: center;\n" +
                        "    font-size: 13px;'>" + isolineItem.value + "</div>",
                        iconAnchor: [13, 10]
                    });

                    if (bbox[1] > 180 || bbox[3] < -180) {
                        let _points = e(points, bbox[1] > 180);
                        let myIcon = L.divIcon({
                            html: "<div style='color:#000;background-color: #e6ebf5;\n" +
                            "    border-radius: 4px;\n" +
                            "    width: 36px;\n" +
                            "    text-align: center;\n" +
                            "    font-size: 13px;'>" + isolineItem.value + "</div>",
                            iconAnchor: [13, 10]
                        });

                        _points.forEach((pt, idx) => {
                            let tmp = pt[0];
                            pt[0] = pt[1];
                            pt[1] = tmp;
                        });
                        let marker = L.marker(_points[centerIdx], {icon: myIcon}).addTo(map);
                        lyr.addLayer(marker);
                        lnglats.push(_points);
                    }

                    points.forEach((point, idx) => {
                        let tmp = point[0];
                        point[0] = point[1];
                        point[1] = tmp;

                    });

                    let marker = L.marker(points[centerIdx], {icon: myIcon}).addTo(map);
                    lyr.addLayer(marker);
                    lnglats.push(points);
                }
                let isolineLayer = L.polyline(lnglats, {color: '#fff000', weight: 1});
                lyr.addLayer(isolineLayer);
            }

            function drawPoints(data, value, color, type) {

                for (let i = 0; i < value.length; i++) {
                    let myIcon = L.divIcon({
                        html: "<div style='width:40px;text-align: center;'><label  style='font-size:18px;color:" + color + "'>" + type + "</label><label style='margin-top: -4px;display: block;font-size: 14px;color:" + color + "'>" + value[i] + "</label></div>",
                        iconAnchor: [13, 10]
                    });
                    let marker = L.marker([data[i * 2], data[i * 2 + 1]], {icon: myIcon}).addTo(map);
                    lyr.addLayer(marker);
                }
            }

            function a(n) {
                var e = .99 * Math.PI,
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


        /**
         * 根据模板获取图片地址
         * @param obj 图片地址信息
         * @returns {*} 图片iis发布地址
         * @private
         */
        _getFigurePathInfo(obj) {
            let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%=pDate%>/<%=target%><%=dateType%>Spa_<%=domain%>_<%=model%>_<%=time%>_2.png");
            return /*this.$$appConfig.prjInfo.imgServer.url+'/'+*/this.config.polFigurePath + figurePath(obj);
        },

        /**
         * 根据模板获取Json文件地址
         * @param obj 图片地址信息
         * @returns {*} 图片iis发布地址
         * @private
         */
        _getJsonPathInfo(obj) {
            let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%=target%>/<%= year%>/<%=pDate%>/<%=target%><%=dateType%>Spa_<%=domain%>_<%=model%>_<%=time%>.json");
            return /*this.$$appConfig.prjInfo.imgServer.url+'/'+*/this.config.polFigurePath + figurePath(obj);
        },


        /**
         * 视图大小更改事件
         */
        onResize() {
            console.log('page resize,handle the event at here');
        },


    },

    activated: function () {
        if (this.isConfigLoaded) {
            //todo get data use ajax
        }
        this.onResize();
    },

    deactivated: function () {

    }


}


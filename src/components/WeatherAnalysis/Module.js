/**
 * Created by yezhanpeng
 * date: 2017/11/6
 * desc: WeatherAnalysis 
 */
import Vue from 'vue';
import echarts from 'echarts';
import Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'libs/Leaflet-ext/L.Map.Sync.js';
import 'libs/Leaflet-ext/LeafletNavBar/Leaflet.NavBar.js';
import 'libs/Leaflet-ext/LeafletNavBar/Leaflet.NavBar.css';

import {canvasIconLayer} from 'libs/Leaflet-ext/leaflet.canvas-markers.js';
import prLineMarker from 'libs/Leaflet-ext/L.Icon.PrLineMarker.js';
import maxMinMarder from 'libs/Leaflet-ext/L.Icon.ExtremeMarker.js';
////3clear
import {utils} from 'utils/utils.js';
import {dateUtils} from 'utils/dateUtils.js';
import mapTitle from '3clear/comm/MapTitle/MapTitle.vue';

import WebGLPolygon from '3clear/libs/3clear.leaflet.polygon.layer';
import AFWind from '3clear/libs/3clear.leaflet.ArrowFwind.layer.js';
import groupSelect from '3clear/comm/GroupSelect/GroupSelect.vue';
import '3clear/control/TimeControl2/css/complextimecontrol.css';
import {complextimecontrol} from '3clear/control/TimeControl2/js/complextimecontrol.js';
import legend3clear from '3clear/comm/Legend/Legend.vue';
////滚动轴
import $ from 'jquery';
import 'libs/Scrollbar/jquery.mCustomScrollbar.css';
import {scrollbar} from 'libs/Scrollbar/jquery.mCustomScrollbar.js';
import {mousewheel} from 'libs/Scrollbar/jquery.mousewheel.min.js';
////geojson
import stationJsonData from 'assets/geojson/jsstations.json';
import weatherJsonData from 'assets/geojson/wea.json';

export default {
	components: {
		'map-title': mapTitle,
        'group-select': groupSelect,
        'legend3clear': legend3clear
	},
	data() {
		return {
			//模块基础数据信息
			name: 'WeatherAnalysis',
			isConfigLoaded: false,
			config: null,
            isActive: false, ////当前窗口是否打开

			weatherMap: null,
			pollutionMap: null,
			defaultProps:{
				children: 'children',
				label: 'label',
				isLeaf: false
			},
            lineGroupLayer: null, ////气象气压存储
            markerLayer: null,
			weaLayer: null,  ////气象存储图层
			weatherWebgl: null,  ////气象分布图
            weatherAFwind: null, /////F风/箭头风
			pollutionLayer: null,  ////污染物存储图层
			pollutionWebgl: null,  ////污染物分布图
            markerClickLayer: null, ////点击点
            markClicklatlng: null, ////点击点的坐标
			weatherGroupLayer: L.layerGroup(),
			pollutionGroupLayer: L.layerGroup(),
			pollutionStatCodes: [],
			weaStatCodes: [],
			staJsonData: stationJsonData,
			weaJsonData: weatherJsonData,
			weaStationData: [],  ////请求回来的气象实测数据
			polluStationData: [], ////请求回来的污染物实测数据

            topContainer_Full: "topContainer",
			startTimeStr: "",
			endTimeStr: "",
			currtTimeStr: "",

            currCityName: this.$$appConfig.prjInfo.provinceName,
            mapWeatherTitle: '',
            mapPolluTitle: '',
            mapDate: "",
            currtStationName: "",

            chartsDivId:"_WeatherAnalyCharts",
			weatherMapCSS: "MapContainer_weatherMap",
			weatherOption:[],
			weatherDefault: "",
			weatherImgDefault: "",
			mrak_echarts: [],  ////点击mark出来的echarts的id

			loadRefresh: false, ////请求数据之后更新与否
			loadPolluRefresh: false, ////请求数据之后更新与否
            isSLPShow: true, ////是否是海平面气压
			allRequest: [],  ////时间轴播放所有的请求执行完
			dateType: "hour",
			zoom: 6,
			pollutionDefault:"",
			pollutionOption:[],

			winOpenStatus: false,
			echartOpenStatus: true,
			timesliderShow: true,
			stationMapLayer: false,  ////气象图层选择
            weaGroupSelected: true,

			DistrMapLayer: false,
			pollu_stationMapLayer: false,  ////污染物图层选择
			pollu_DistrMapLayer: false,
            polluGroupSelected: true,

            Wea_options:[],

            isfirstLoad: false,

            weaLegendeOption: null,  ////气象的图例
            polluLegendeOption: null  ////气象的图例    
		}
	},

	created() {
		this.$$resize(this.onResize);
		this.$$getConfig(this.onGetConfig);
	},

	mounted() {},

	methods: {
		/**
		 * 获取当前模块配置文件
		 * @param config json格式的配置信息
		 */
		onGetConfig(config) {
			this.config = config;
			this.isConfigLoaded = true;

			this.winOpenStatus = config['isweatherMapALLOpen'];
            this.echartOpenStatus = config['echartOpenStatus'];
			this.weatherColor = config['weatherColor'];
			this.stationMapLayer = config['stationMapLayer'];
			this.DistrMapLayer = config['DistrMapLayer'];        ////图层选择的配置
			this.pollu_stationMapLayer = config['pollu_stationMapLayer']; 
			this.pollu_DistrMapLayer = config['pollu_DistrMapLayer']; 

			this.mrak_echarts = config['mrak_echarts'];           ////mark所有的echarts
			this.Wea_options = config['Wea_options'];             /////气象的默认配置项

			this.weatherDefault = config['weatherDefault'];       /////默认配置
			this.weatherImgDefault = config['weatherImgDefault']; /////默认配置

			this.pollutionOption = config['pollution'];
			this.pollutionDefault = config['pollutionDefault'];
            
            ////标题的赋值
            this.mapPolluTitle = this.config['mapPolluTitleHead'] + "-" + this.config['pollutionDefaultLabel'];
            this.mapWeatherTitle = this.config['mapTitleHead'] + "-" + this.config["weatherLegendLabel"];

            this.$nextTick(()=>{
        		this.initTimeControl();
        		this.initMap();
        		this.initWebgl_Wea();  ////初始化webgl
        		this.initWebgl_Pol(); 
        		this.initEcharts();    ////初始化echarts
        		this.addDefaultLayer();
                this.isfirstLoad = true;
                this.firstLoadEcharts();
            });
        	////初始化结束之后菜单的回调函数中调用请求数据的函数
		},
		/**
		 * 时间轴的初始化
		 */
        initTimeControl() {
        	let mapTitleDateFormat = this.config['mapTitleDateFormat'];
        	let nowDate = new Date();
        	let timeSliderSpeed = this.config['timeSliderSpeed'];
        	let minute = nowDate.getMinutes(); ////获取分钟
            if(minute < this.config["monitorUpdateMinute"]){
                ////小于设定的值，则显示前beforHour个小时
                let beforHour = this.config["monitorUpdateBeforeHour"] ||-1;
                nowDate = dateUtils.dateAdd('h', beforHour, new Date());
            }else{
                let afterHour = this.config["monitorUpdateafterHour"] ||-2;
                nowDate = dateUtils.dateAdd('h', afterHour, new Date());
            }
            
        	let endTimeStr = dateUtils.dateToStr("yyyy-MM-dd 23:00:00", nowDate);
        	let startTime = dateUtils.dateAdd('h', this.config["defaultShowHours"], nowDate);
        	let startTimeStr = dateUtils.dateToStr("yyyy-MM-dd 00:00:00", startTime);
        	let nowStr = dateUtils.dateToStr("yyyy-MM-dd HH:00:00", nowDate);

        	/////全局使用的开始时间和结束时间
			this.startTimeStr = startTimeStr;
			this.endTimeStr = endTimeStr;
			this.currtTimeStr = dateUtils.dateToStr("yyyy-MM-ddTHH:00:00", nowDate);
			this.mapDate = dateUtils.dateToStr(mapTitleDateFormat, nowDate);

			let that_ = this;
            this.timeControl = new complextimecontrol({
                parent: "WeatherAnalysis_timeControl",
                startTimeStampRange: startTimeStr,
                endTimeStampRange: endTimeStr,
                startTimeStampShowRange: startTimeStr,
                endTimeStampShowRange: endTimeStr,
                time: nowStr,
                onChangeTimeCallback: function (data) {
                    let dtSTr = data.time;
                    let currtDate = dateUtils.strToDate(dtSTr);
                    that_.mapDate = dateUtils.dateToStr(mapTitleDateFormat, currtDate);
                    that_.currtTimeStr = dtSTr.replace(/\s/g, "T");
					that_.allRequest = [];    ////每次清空请求

                    if(data.tip !== "initTime"){
                    	that_.refreshAllData(); ////请求数据

	                    if (that_.timeOutEvent)
	                    	clearTimeout(that_.timeOutEvent);
	                    Promise.all(that_.allRequest).then(()=>{
	                    	/////所有请求完成
		                	that_.timeOutEvent = setTimeout(() => {
		                    	if (that_.timeControl.getStatus()){
		                    		that_.timeControl.nextPlay();
		                    	}
		                    }, timeSliderSpeed);
	                    });
                    }
                }
            });
        },

		/**
		 * 时间轴变化的时候刷新所有的数据
		 */
        refreshAllData(){
        	this.loadRefresh = false; 
        	this.loadPolluRefresh = false;
        	if(this.stationMapLayer === true && this.weaGroupSelected === true){
				this.loadWeatherData();
        	}
        	if(this.DistrMapLayer === true && this.weaGroupSelected === true){
        		/////气象分布图叠加
				this.setImageGorWebGL();
        	}
    		if((!this.winOpenStatus)&&(!this.echartOpenStatus)){
    			////只有在污染物的界面打开的时候请求数据
    			if(this.pollu_stationMapLayer === true  && this.polluGroupSelected === true){
    				this.loadPollutionData();
    			}
				if(this.pollu_DistrMapLayer === true && this.polluGroupSelected === true){
					/////污染物分布图叠加
					this.setImageGorWebGL_pollu();
				}
    		}
        },
		/**
		 * 地图的初始化
		 */
        initMap(){
        	let option =  utils.deepCopy(this.config['mapOption']);
            let mapGeoServe = this.$$appConfig.map.geoServer;
            this.weatherMap = L.map('WeatherAnalysis_weatherMap', option);
            this.pollutionMap = L.map('WeatherAnalysis_pollutionMap',option);
            L.control.navbar().addTo(this.weatherMap);
            L.control.navbar().addTo(this.pollutionMap);

            let tiled = L.tileLayer.wms(mapGeoServe.url, {
                layers: mapGeoServe.Js_Tile_Polygon,
                format: 'image/png',
                transparent: true,
                attribution: "Weather data  2017 3Clear"
            });
            tiled.addTo(this.weatherMap);
            let topPane = this.weatherMap.createPane('top', this.weatherMap.getPanes().mapPane);
            let tiled1 = L.tileLayer.wms(mapGeoServe.url, {
                layers: mapGeoServe.Js_Tile_Line_Point,
                format: 'image/png',
                transparent: true,
                attribution: "Weather data  2017 3Clear"
            }).addTo(this.weatherMap);
            topPane.appendChild(tiled1.getContainer());

            let tiledright = L.tileLayer.wms(mapGeoServe.url, {
                layers: mapGeoServe.Js_Tile_Polygon,
                format: 'image/png',
                transparent: true,
                attribution: "Weather data  2017 3Clear"
            });
            tiledright.addTo(this.pollutionMap);
            let topPaneright = this.pollutionMap.createPane('top', this.pollutionMap.getPanes().mapPane);
            let tiled1right = L.tileLayer.wms(mapGeoServe.url, {
                layers: mapGeoServe.Js_Tile_Line_Point,
                format: 'image/png',
                transparent: true,
                attribution: "Weather data  2017 3Clear"
            }).addTo(this.pollutionMap);
            topPaneright.appendChild(tiled1right.getContainer());

            this.lineGroupLayer = L.layerGroup().addTo(this.weatherMap);  /////为气象气压准备图层
            this.markerLayer = L.canvasIconLayer({}).addTo(this.weatherMap);

            this.zoom = this.weatherMap.getZoom();
            this.weatherMap.on("zoomend", (event) => {
                if(this.isActive){                
                	this.loadRefresh = true;
                	this.loadPolluRefresh = true;
                	this.zoom = this.weatherMap.getZoom();

                    this.weatherGroupLayer.eachLayer(this.upDateWeaPointIcon);
                    this.pollutionGroupLayer.eachLayer(this.upDatePolluPointIcon);

                    if(this.echartOpenStatus && this.markClicklatlng && this.stationMapLayer && this.weaGroupSelected === true){
                        this.markPoint(); ////更新标记选中
                    }
                }
			});	
        },
		/**
		 * 气象分布图的加载
		 */
        initWebgl_Wea(){
			let weatherStr = this.weatherDefault; 
            let weaType = weatherStr.split('_')[0] === "windspeed" ? "wind" : weatherStr;
			let WeacolorOpt = utils.deepCopy(this.config['weatherColor'][weaType]);
            let zoneName = this.config['zoneName'];
            let disMapConfig = utils.deepCopy(this.$$appConfig.prjInfo.obsFigureInfo[zoneName]);
            let opacity = this.config['webGLOpcity'];
            ////为风单独添加属性
            Object.assign(disMapConfig, this.config['wind_uv_Max_Min']);
            let WeaColor = WeacolorOpt['colorBar'].join(',').split(',');
            
            this.weatherWebgl = new L.$3clearPolygonLayer({
                imgObjInfo: disMapConfig,
                alpha: opacity,
                color: WeaColor
            });
            this.weatherWebgl.addTo(this.weatherMap);

            /////添加风
            this.weatherAFwind = new L.$3clearArrowFWindLayer({
                imageExtent:disMapConfig['extent'],
                windType:this.config['windType'],
                windColor:this.config['windColor'],
                winMin:this.config['WindMinUV'],
                winMax:this.config['WindMaxUV']
            });
            this.weatherAFwind.addTo(this.weatherMap);
            ////添加掩膜
            this.$nextTick(()=>{
                this.weatherAFwind.setMask(this.$refs["jsMask"], this.config['windSourceImgWidth'], this.config['windSourceImgHeight']);
            });
        },
		/**
		 * 污染物分布图的加载
		 */
        initWebgl_Pol(){
			let dateType = this.dateType;
			let pollutionStr = this.pollutionDefault;
			let pollution = pollutionStr.toUpperCase(); ////大写
            let polluColor = utils.deepCopy(this.$$appConfig.polColors[pollution][dateType]['colors']);
            let zoneName = this.config['zoneName'];
            let disMapConfig = utils.deepCopy(this.$$appConfig.prjInfo.obsFigureInfo[zoneName]);
            let opacity = this.config['webGLOpcity'];

            this.pollutionWebgl = new L.$3clearPolygonLayer({
                imgObjInfo: disMapConfig,
                alpha: opacity,
                color: polluColor
            });
            this.pollutionWebgl.addTo(this.pollutionMap);
        },

        /* 
        * 气象
        * webgl设置图片路径
        */
        setImageGorWebGL(){
			let weatherStr = this.weatherDefault; ////气象属性
            let weaType = weatherStr.split('_')[0] === "windspeed" ? "wind" : weatherStr;
            let mapColor = utils.deepCopy(this.config['weatherColor']);
            let WeaColor = mapColor[weaType]['colorBar'].join(',').split(',');

        	let currentStr = this.currtTimeStr;
            let weatherWebglUrlParam = utils.deepCopy(this.config['weatherWebglUrlParam']);
        	let timeResolu = weatherWebglUrlParam['timeResolu'];  ////时间分辨率 1
        	let pictrueresolu = weatherWebglUrlParam['pictrueresolu']; /////一张图片包含的时刻 2
            let dateType = weatherWebglUrlParam['dateType']; ////小时或日均
            let domain = weatherWebglUrlParam['domain'];
            let imgModel = weatherWebglUrlParam['model'];
            let zoneName = this.config['zoneName'];
            let disMapConfig = utils.deepCopy(this.$$appConfig.prjInfo.obsFigureInfo[zoneName]);

            let currtStr = currentStr.replace(/T/g, " ");
            let qTime = dateUtils.strToDate(currtStr);
            let pDatetemp = dateUtils.strFormatToDate("yyyy-MM-dd 20:00:00", currtStr);
            let pDate = dateUtils.dateAdd('d', -1, pDatetemp);
          
            let isjson = false;
            if(weatherStr === "slp_1h"|| weatherStr === "pressure_dt1h" || weatherStr === "pressure_dt24h"){
                ////海平面气压用线表示
                timeResolu = 1;
                pictrueresolu = 1;
                isjson = true;
            }
            let {t, model, figure1Name, figure2Name} = utils.getCurrFigureInfo(pDate, qTime, timeResolu, pictrueresolu);
            let yyyyMMddHH = dateUtils.dateToStr('yyyyMMdd00', qTime);  /////今天的文件夹
            let WeaName_image = this.weatherImgDefault;

            let WindTime = utils.deepCopy(figure1Name);
            let WindCurrtTime = dateUtils.dateToStr('yyyyMMddHH', qTime);  /////今天的文件夹
            let wind_FA_Order = WindTime === WindCurrtTime;

            let infoObj = {
            	picResolu:pictrueresolu,
                dateType: dateType,
                name: WeaName_image,
                target: WeaName_image,
                year: pDate.getFullYear(),
                currtDate: yyyyMMddHH,
                domain: domain,
                model: imgModel,
                time: figure1Name
            };
            let path = this._getFigurePathInfo(infoObj, isjson);
            let requestWea = null;

            if(weatherStr === "slp_1h"|| weatherStr === "pressure_dt1h" || weatherStr === "pressure_dt24h"){
                ////气压用线
                if(this.weatherWebgl){
                    this.weatherWebgl.hide();
                }
                if(this.weatherAFwind.isWindHas()){
                    this.weatherAFwind.windClear();
                }                    
                this.isSLPShow = false; ////不显示图例
                requestWea = this.setPressureLine(path);
            }else
            {
                disMapConfig.isWind = false;
                if(weatherStr.split('_')[0] === "windspeed"){
                    /////风用F或者箭头
                    disMapConfig.isWind = true;
                    requestWea = this.weatherAFwind.setImage(path, wind_FA_Order);
                }else if(this.weatherAFwind.isWindHas()){
                    this.weatherAFwind.windClear();
                }
                /////其他的叠加分布图
                if (this.lineGroupLayer) {
                    this._removeGroupLayers(this.lineGroupLayer, this.weatherMap);
                    this.markerLayer.clearLayers();
                }
                this.isSLPShow = true; ////显示图例
                requestWea = this.weatherWebgl.setImgInfo(path, path, disMapConfig, t, model, WeaColor);
                this.weatherWebgl.setMask(this.$refs["jsMask"]);
            }
            this.allRequest.push(requestWea);
        },

        /* 
        * 污染物
        * webgl设置图片路径
        */
        setImageGorWebGL_pollu(){
			let dateType = this.dateType;
            let polluWebglUrlParam = utils.deepCopy(this.config['polluWebglUrlParam']);
        	let timeResolu = polluWebglUrlParam['timeResolu'];  ////时间分辨率 1
        	let pictrueresolu = polluWebglUrlParam['pictrueresolu']; /////一张图片包含的时刻 2
            let ImgdateType = polluWebglUrlParam['dateType']; ////小时或日均
            let domain = polluWebglUrlParam['domain'];
            let imgModel = polluWebglUrlParam['model'];

			let pollutionStr = this.pollutionDefault;
			let pollution = pollutionStr.toUpperCase(); ////大写
            let polluColor = utils.deepCopy(this.$$appConfig.polColors[pollution][dateType]['colors']);
            let zoneName = this.config['zoneName'];
            let disMapConfig = utils.deepCopy(this.$$appConfig.prjInfo.obsFigureInfo[zoneName]);
            disMapConfig.isWind = false;
        	let currentStr = this.currtTimeStr;

            let currtStr = currentStr.replace(/T/g, " ");
            let qTime = dateUtils.strToDate(currtStr);
            let pDatetemp = dateUtils.strFormatToDate("yyyy-MM-dd 20:00:00", currtStr);
            let pDate = dateUtils.dateAdd('d', -1, pDatetemp);

            let {t, model, figure1Name, figure2Name} = utils.getCurrFigureInfo(pDate, qTime, timeResolu, pictrueresolu);
            let yyyyMMddHH = dateUtils.dateToStr('yyyyMMdd00', qTime);  /////今天的文件夹
            let polluName_image = pollution;

            let infoObj = {
            	picResolu:pictrueresolu,
                dateType: ImgdateType,
                name: polluName_image,
                target: polluName_image,
                year: pDate.getFullYear(),
                currtDate: yyyyMMddHH,
                domain: domain,
                model: imgModel,
                time: figure1Name
            };
            let path = this._getFigurePolluPathInfo(infoObj);
            let requestPollu =this.pollutionWebgl.setImgInfo(path, path, disMapConfig, t, model, polluColor);
            this.pollutionWebgl.setMask(this.$refs["jspolluMask"]);
            this.allRequest.push(requestPollu); 
        },

        setPressureLine(linDatapath){
            //当前数据与上一时刻不一样则再绘制
            let lineMapRequest = Vue.axios({
                methods: 'get',
                headers: {},
                url: linDatapath,
                baseURL: ''
            });
            let lineMapPromise = Promise.all([lineMapRequest]).then((Data) => {
                let data = Data[0]['data']||[];
                this._drewIsoline(data, this.lineGroupLayer,this.markerLayer, this.weatherMap);
            }, (err) => {
                let data = [];
                this._drewIsoline(data, this.lineGroupLayer,this.markerLayer, this.weatherMap);
            });
            return lineMapPromise;
        },

        _removeGroupLayers(lyr, map) {
            if (lyr) {
                lyr.eachLayer(function (layer) {
                    let canvas = map.getRenderer(layer);
                    canvas.remove();
                    layer.remove();
                });
            }
        },
        /*
        * 绘制等压线
        */
        _drewIsoline(data, lyr, markerLyr, map) {
            if (lyr) {
                this._removeGroupLayers(lyr, map);
            }
            if (markerLyr) {
                markerLyr.clearLayers();
            }
            if (data.length === 0)
                return;

            let weatherStr = this.weatherDefault; ////气象属性
            let line_H = "";
            let line_L = ""; 
            let value_H = 0;
            let value_L = 0;   
            let isSea = false;    
            if(weatherStr === "slp_1h"){
                line_H = 'H';
                line_L = 'L'; 
                value_H = data.high.value;
                value_L = data.low.value;
                isSea = true;      
                drawPoints(data.high.points, value_H, '#1c7fff', line_H, isSea);
                drawPoints(data.low.points, value_L, '#ff0000', line_L, isSea);                         
            }else{
                line_H = "";
                line_L = "";
                value_H = data.high.value;
                value_L = data.low.value;
            }
            drawIsoline(data.isoline);

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
                let isolineLayer = L.polyline(lnglats, {color: '#cccccc', weight: 1, renderer: L.canvas()});
                lyr.addLayer(isolineLayer);
            }

            function drawPoints(data, value, color, type, isSeaLine) {
                for (let i = 0; i < value.length; i++) {
                    let markOption = {
                        type: type,
                        typeFontColor: color,
                        valueFontColor: color,
                        value: value[i]
                    };
                    if(!isSeaLine){
                        Object.assign(markOption,{
                            typeFont:'bold 18px Arial',
                            valueFont:'normal 18px Arial',
                        });
                    }
                    let e = new L.icon.ExtremeMarker(markOption);
                    let marker = L.marker([data[i * 2], data[i * 2 + 1]], {icon: e});
                    markerLyr.addMarker(marker);
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
         * 根据模板获取气象图片或者json地址
         * @param obj 图片地址信息
         * @private
         */
        _getFigurePathInfo(obj, isjson) {
            let figurePath = null;
            if(isjson === true){
               figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%= currtDate%>/<%=target%>_<%= domain%>_<%= model%>_<%= time%>.json");
            }else{
        	   figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%= currtDate%>/<%=target%>_<%= domain%>_<%= model%>_<%= time%>_<%= picResolu%>.png");
            }
            return this.$$appConfig.prjInfo.imgServer.url + this.config.polFigurePath_Wea + figurePath(obj);
        },
        /**
         * 根据模板获取污染物图片地址
         * @private
         */
        _getFigurePolluPathInfo(obj) {
        	let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%= currtDate%>/<%=target%>_<%= domain%>_<%= model%>_<%= time%>_<%= picResolu%>.png");
            return this.$$appConfig.prjInfo.imgServer.url + this.config.polFigurePath_pollu + figurePath(obj);
        },
		/**
		 * 气象站点样式
		 */
		weaStaPointStyle(feature, latlng) {
			let weatherStr = this.weatherDefault; ////气象属性
			let name = feature.properties['NAME'];
			let code = feature.properties['CODE'];
			let marker;
			let zoom = this.zoom;
			let weaType = weatherStr.split('_')[0];
			if(weaType === "windspeed"){
				let windspeed, wind_direct, windcolor , windlevel;
				if(this.loadWeaRefresh){
					windspeed = feature.properties.windspeed;
					wind_direct = feature.properties.wind_direct;
					windcolor = feature.properties.windcolor;
					windlevel = feature.properties.level;
				}else{
					let pointWindData = this.getPointWindValue(code);
					let weaWindInfo = this.getWeatherGradeInfo(weatherStr, pointWindData.speed); /////风的颜色
					windlevel = weaWindInfo.level;  /////这里风的级代替风速
					windcolor = weaWindInfo.color;
					windspeed = weaWindInfo.value;
					wind_direct = pointWindData.direct;

					feature.properties.wind_direct = wind_direct;
					feature.properties.windspeed = windspeed;
					feature.properties.windcolor = windcolor;
					feature.properties.level = windlevel;
				}
				let icon = this.createWindIcon(windcolor, windspeed, wind_direct, windlevel);
				marker = L.marker(latlng, {
					icon: icon
				});
			}else{
				let color, value, fontColor;
				if(this.loadWeaRefresh){
					value = feature.properties.value || '';
					color = feature.properties.color;
					fontcolor = feature.properties.fontcolor;
				}else{
					let pointWeaData = this.getPointWeaValue(code);
					let weaStationInfo = this.getWeatherGradeInfo(weatherStr, pointWeaData.value); /////获取气象要素对应的颜色等信息
					value = weaStationInfo.value;
					color = weaStationInfo.color;
					fontColor = weaStationInfo.fontcolor;
					////给图层添加相应的属性以便于后期缩放
					feature.properties.color = color;
					feature.properties.value = value;
					feature.properties.fontcolor = fontColor;
				}
				let icon = this.createStaIcon(color, value, name, fontColor);
				marker = L.marker(latlng, {
					icon: icon
				});
				////添加气象站点点击事件
				marker.on('click', (event)=>{
					this.markerClick(event);
				});		
			}
			if (zoom < this.config['zoomLayerOpacity_0'])
				marker.setOpacity(0);
			else
				marker.setOpacity(1);		
			return marker;
		},

		/**
		 * 污染物站点样式
		 */
		StaPointStyle(feature, latlng) {
			let color, value, aqi;
			let name = feature.properties['NAME'];
			let code = feature.properties['CODE'];
			if(this.loadPolluRefresh){
				value = feature.properties.value || '';
				color = feature.properties.color;
				aqi = feature.properties.iaqi;
			}else{
				let pointData = this.getPointPolluValue(code,'stationcode');
				let cityInfo = utils.getGradeInfo(pointData.iaqi); ////获取iaqi对应的相关信息
				value = pointData.value;
				color = cityInfo.color;
				aqi = cityInfo.aqi;
				////给图层添加相应的属性以便于后期缩放
				feature.properties.color = color;
				feature.properties.value = value;
				feature.properties.iaqi = aqi;
			}
			let fontColor = (aqi != '-' && aqi <= 150 ) ? "#000" : "#fff";
			let icon = this.createStaIcon(color, value, name, fontColor);

			let zoom = this.zoom;
			let marker = L.marker(latlng, {
				icon: icon
			});
			if (zoom < this.config['zoomLayerOpacity_0'])
				marker.setOpacity(0);
			else
				marker.setOpacity(1);
			return marker;
		},
		/**
		 * 站点样式的图标
		 */
		createStaIcon(bgColor, value, name, color) {
			let zoom = this.zoom;
			let zoomLayerShowNum = this.config['zoomLayerShowNum'];
			let zoomLayerShowLabel = this.config['zoomLayerShowLabel'];
			return zoom < zoomLayerShowNum ? L.divIcon({
				html: "<p class='map-point' style='border:solid 1px #000; background-color: " + bgColor + ";color:" + color + "'><\/p>",
				iconAnchor: [7, 7]
			}) : zoom >= zoomLayerShowNum && zoom <= zoomLayerShowLabel ? L.divIcon({
				html: "<span class='map-point-value' style='width:32px;border: solid 1px #000; background-color: " + bgColor + ";color:" + color + "'>" + value + "<\/span>",
				iconAnchor: [13, 10]
			}) : L.divIcon({
				html: "<label class='map-point-marker sta' unselectable='on' style='border: solid 1px #000; background-color: " + bgColor + ";color:" + color + "'>" + value + "<div class='map-point-arrow sta' style='color:" + bgColor + "'>" + "</div></label><label class='map-point-label sta' style='border: solid 1px #000;line-height: 17px;height: 17px;' unselectable='on'>" + name + "</label>",
				iconAnchor: [13, 10]
			});
		},

		/**
		 * 风的icon处理
		 */
		createWindIcon(windcolor, windspeed, wind_direct, windLevel){
			if(windLevel === "-" || wind_direct === "-" || windspeed === "-") {
				wind_direct = 0;
				windLevel = "noneData";
				windspeed = "";
			}
			let rote = wind_direct;  ////这里图片是向下的,所以直接写角度
            let winPngLevel = "noneData";
            if(windLevel !== "noneData" && !isNaN(windspeed)){
                winPngLevel = windspeed.toFixed(0);
                ////winPngLevel = Math.round(windspeed/4);  ////这里是风的颜色等级修改为40级后
            }
			let imageUrl = this.config['windBaseUrl'] + winPngLevel +".png";
            let fontcolor = windLevel > 14 ? "rgb(255,255,255)" : "rgb(0,0,0)";
			let imgStyle = "style='position:absolute;padding:0px;width:48px;height:48px; overflow:hidden;background-repeat:no-repeat;transform:rotate("+ rote +"deg);'";
			let imgfontStyle = "style='position:absolute; color:"+ fontcolor +"; padding:0px;width:48px;height:48px; overflow:hidden;text-align:center;line-height:48px;background-color:rgba(255,255,255,0);'";
			return L.divIcon({
				html: "<div unselectable='on' style='position:relative;top:-24px;left:-24px;'><img src = "+ imageUrl +"  "+ imgStyle +"/><div "+ imgfontStyle +" unselectable='on'>" + windspeed + "</div></div>",
				iconAnchor: [7, 7]
			});
		},
		/**
		 * 污染物值得站点样式渲染
		 */
		upDatePolluPointIcon(layer) {
			let color, value, aqi;
			let name = layer.feature.properties['NAME'];
			let code = layer.feature.properties['CODE'];
			if(this.loadPolluRefresh){
				value = layer.feature.properties.value || '';
				color = layer.feature.properties.color;
				aqi = layer.feature.properties.iaqi;
			}else{
				let pointData = this.getPointPolluValue(code,'stationcode');
				let cityInfo = utils.getGradeInfo(pointData.iaqi); ////获取iaqi对应的相关信息
				value = pointData.value;
				color = cityInfo.color;
				aqi = cityInfo.aqi;
				////给图层添加相应的属性以便于后期缩放
				layer.feature.properties.color = color;
				layer.feature.properties.value = value;
				layer.feature.properties.iaqi = aqi;
			}
			let fontColor = (aqi != '-' && aqi <= 150 ) ? "#000" : "#fff";
			let icon = this.createStaIcon(color, value, name, fontColor);

			let zoom = this.zoom;
			layer.setIcon(icon);
			if (zoom < this.config['zoomLayerOpacity_0'])
				layer.setOpacity(0);
			else
				layer.setOpacity(1);
		},
		/**
		 * 气象数据值得站点样式渲染
		 */
		upDateWeaPointIcon(layer) {
			let name = layer.feature.properties['NAME'];
			let code = layer.feature.properties['CODE'];
			let zoom = this.zoom;
			let weatherStr = this.weatherDefault; ////气象属性
			let weaType = weatherStr.split('_')[0];
			if(weaType === "windspeed"){
				let windspeed, wind_direct, windcolor, windlevel;
				if(this.loadWeaRefresh){
					windspeed = layer.feature.properties.windspeed;
					wind_direct = layer.feature.properties.wind_direct;
					windcolor = layer.feature.properties.windcolor;
					windlevel = layer.feature.properties.level;
				}else{
					let pointWindData = this.getPointWindValue(code);
					let weaWindInfo = this.getWeatherGradeInfo(weatherStr, pointWindData.speed); /////风的颜色
					windlevel = weaWindInfo.level;
					windcolor = weaWindInfo.color;
					windspeed = weaWindInfo.value;
					wind_direct = pointWindData.direct;

					layer.feature.properties.wind_direct = wind_direct;
					layer.feature.properties.windspeed = windspeed;
					layer.feature.properties.windcolor = windcolor;
					layer.feature.properties.level = windlevel;
				}
				let icon = this.createWindIcon(windcolor, windspeed, wind_direct, windlevel);
				layer.setIcon(icon);
			}else{
				let color, value, fontColor;
				if(this.loadWeaRefresh){
					value = layer.feature.properties.value || '';
					color = layer.feature.properties.color;
					fontColor = layer.feature.properties.fontcolor;
				}else{
					let pointData = this.getPointWeaValue(code);
					let weaStationInfo = this.getWeatherGradeInfo(weatherStr, pointData.value);
					value = weaStationInfo.value;
					color = weaStationInfo.color;
					fontColor = weaStationInfo.fontcolor;
					////给图层添加相应的属性以便于后期缩放
					layer.feature.properties.color = color;
					layer.feature.properties.value = value;
					layer.feature.properties.fontcolor = fontColor;
				}
				let icon = this.createStaIcon(color, value, name, fontColor);
				layer.setIcon(icon);
			}
			if (zoom < this.config['zoomLayerOpacity_0'])
				layer.setOpacity(0);
			else
				layer.setOpacity(1);
		},
		/**
		 * 默认图层的加载
		 */
        addDefaultLayer(){
			let tempWeatherLy = L.geoJSON(this.weaJsonData, {
				pointToLayer: this.weaStaPointStyle,
				onEachFeature: this.weaOnEachFeature
			}).addTo(this.weatherMap);
			this.weaLayer = tempWeatherLy;
			this.weatherMap.removeLayer(this.weaLayer);

			let tempPollutLy = L.geoJSON(this.staJsonData, {
				pointToLayer: this.StaPointStyle,
				onEachFeature: this.polluOnEachFeature
			}).addTo(this.pollutionMap);
			this.pollutionLayer = tempPollutLy;
			this.pollutionMap.removeLayer(this.pollutionLayer);
        },

        /*
		* 获取气象数据
        */
        loadWeatherData(){
			this.weaStationData = [];
			let dateType = this.dateType;
        	let startDt = this.currtTimeStr;
        	let endDt = this.currtTimeStr;        	
			let weatherStr = this.weatherDefault;
			let weaCode = this.weaStatCodes.join(",");
			if(weatherStr === "windspeed_10min_1h"){
				weatherStr = "windspeed_10min_1h,winddirect_10min_1h";
			}else if(weatherStr === "windspeed_1h"){
				weatherStr = "windspeed_1h,winddirect_1h";
			}
			let weather_Params = {
				codeType: "stationcode",
				code: weaCode,
				target: weatherStr,
				startTimeStr: startDt,
				endTimeStr: endDt,
				dateType: dateType,
				dataFilter: "",
				isLeftJoin: false
			};
			let weatherRequest = this.$$getStationWeatherValueByMonitorDate({data: weather_Params});
			let weaPromse = Promise.all([weatherRequest]).then((weaData) => {
                if(weaData[0].data && weaData[0].data['StatusCode']!== 200){
                    this.$alert(weaData[0].data['HttpRequestMessage'], '提示', {
                        confirmButtonText: '确定',
                        type: 'warning'
                    });
                    this.weaStationData = [];
                    this.loadRefresh = false;
                    this.weatherGroupLayer.eachLayer(this.upDateWeaPointIcon);                       
                }else{
                    this.weaStationData = weaData[0]['data']['HttpContent'];
                    this.loadRefresh = false;
                    this.weatherGroupLayer.eachLayer(this.upDateWeaPointIcon); ////气象图层的刷新                
                }     
			}, (err) => {
                this.weaStationData = [];
		       	this.loadRefresh = false;
				this.weatherGroupLayer.eachLayer(this.upDateWeaPointIcon); ////气象图层的刷新
            });
			this.allRequest.push(weaPromse); 
        },
        /*
		* 获取污染物监测数据
        */
        loadPollutionData(){
			this.polluStationData = [];
			let dateType = this.dateType;
			let pollution = this.targetHandel(this.pollutionDefault, dateType);
        	let startDt = this.currtTimeStr; ////只查一个时刻的数据
        	let endDt = this.currtTimeStr;
			let iaqiStr = this.pollutionDefault == 'aqi' ? 'aqi' : pollution +","+ pollution + '_iaqi';
			let codes = this.pollutionStatCodes.join(",");
			let params = {
				codeType: "stationcode",
				code: codes,
				target: iaqiStr,
				startTimeStr: startDt,
				endTimeStr: endDt,
				dateType: dateType,
				dataFilter: "",
				isLeftJoin: false
			};
			let requestData = this.$$getStationTargetValueByMonitorDate({data: params});
			let polluPromise = Promise.all([requestData]).then((Data) => {
                if(Data[0].data && Data[0].data['StatusCode'] !== 200){
                    this.$alert(Data[0].data['HttpRequestMessage'], '提示', {
                        confirmButtonText: '确定',
                        type: 'warning'
                    });
                    this.loadPolluRefresh = false;
                    this.pollutionGroupLayer.eachLayer(this.upDatePolluPointIcon); ////污染物站点刷新
                }else{           
    				this.polluStationData = Data[0]['data']['HttpContent'];
    		       	this.loadPolluRefresh = false;
    		       	this.pollutionGroupLayer.eachLayer(this.upDatePolluPointIcon); ////污染物站点刷新
                }
			}, (err) => {
		       	this.loadPolluRefresh = false;
		       	this.pollutionGroupLayer.eachLayer(this.upDatePolluPointIcon); ////污染物站点刷新
            });
			this.allRequest.push(polluPromise); 
        },

		targetHandel(target, dateType){
			//根据污染物返回查询字段//
			if(!target||!dateType){ return}
			let pollution = target;
			if(target !=="aqi"){
				if(dateType === "hour"){
					pollution = target + "_1h";
				}else if(dateType === "day"){
					if(target !== "o3"){
						pollution = target + "_24h";
					}else{
						pollution = target + "_8h_max";
					}
				}
			}
			return pollution;
		},
        /*
		* 根据站点代码获取气象数据
        */
        getPointWeaValue(code){
        	let Data = this.weaStationData;
        	let currentStr = this.currtTimeStr;
			let info = this.getObjFromData(Data, currentStr, code);
			let weather = this.weatherDefault;
			if (info) {
				return {
					value: (!info[weather] || info[weather] == -999) ? '-' : info[weather]
				};
			} else{				
				return {
					value: '-'
				};
			}
        },

        /*
		* 根据站点代码获取气象--风数据
        */
        getPointWindValue(code){
			let weatherStr = this.weatherDefault; ////气象属性
        	let speed = "-", direct = "-";
        	let Data = this.weaStationData;
        	let currentStr = this.currtTimeStr;
			let info = this.getObjFromData(Data, currentStr, code);
			if(info){
				if(weatherStr === "windspeed_10min_1h"){
					speed = info["windspeed_10min_1h"] ? info["windspeed_10min_1h"] : "-";
					direct = info["winddirect_10min_1h"] ? info["winddirect_10min_1h"] : "-";
				}else if(weatherStr === "windspeed_1h"){
					speed = info["windspeed_1h"] ? info["windspeed_1h"] : "-";
					direct = info["winddirect_1h"] ? info["winddirect_1h"] : "-";
				}
			}
        	let windObj = {
        		speed: speed,
        		direct: direct
        	};
			return windObj;
        },

        /*
		* 根据站点代码获取污染物数据
        */
        getPointPolluValue(code, codeType){
        	let data = this.polluStationData;
        	let currentStr = this.currtTimeStr;
			let info = this.getObjFromData(data, currentStr, code);

			let dateType = this.dateType;
			let pollution = this.targetHandel(this.pollutionDefault, dateType);

			let iaqiStr = this.pollutionDefault == 'aqi' ? 'aqi' : pollution + '_iaqi';
			let valueStr = this.pollutionDefault == 'aqi' ? 'aqi' : pollution;

			if (info) {
				return {
					iaqi: (info[iaqiStr] == null || info[iaqiStr] == -999) ? '-' : info[iaqiStr],
					value: (info[valueStr] == null || info[valueStr] == -999) ? '-' : info[valueStr]
				};
			} else{				
				return {
					iaqi: '-',
					value: '-'
				};
			}
        },
        /*
		* 初始化echarts
        */
        initEcharts(){
        	let mrakEcharts = this.mrak_echarts;
        	this.$nextTick(()=>{
        		$("#WeatherAnalysis_markercharts").mCustomScrollbar();  ////滚动轴
        		for(let opt in mrakEcharts){
        			let chartsId = this.chartsDivId + mrakEcharts[opt];
					let echartsObj = echarts.init(document.getElementById(chartsId));
					echartsObj.group = 'mrakEcharts';
                }
                echarts.connect('mrakEcharts');
        	});
        },
        /*
        * 点击展开
        */
        ExpandMapClick(){
            this.winOpenStatus = this.winOpenStatus === false;
            this.ExpandMap();
        },
        /*
		* 两个地图框的展开和关闭
        */
        ExpandMap(){
        	if(this.winOpenStatus === true){
        		let polluted = this.pollutionMap.isSynced(this.weatherMap);
        		if(polluted){
        			this.pollutionMap.unsync(this.weatherMap);
        		}
    			let weather = this.weatherMap.isSynced(this.pollutionMap);
        		if(weather){
        			this.weatherMap.unsync(this.pollutionMap);
        		}
        		this.weatherMapCSS = "MapContainer_weatherMap_open";
                setTimeout(()=>{
                    this.weatherMap.invalidateSize();
                    if(this.DistrMapLayer === true && this.weaGroupSelected === true){
                        /////气象分布图叠加
                        this.setImageGorWebGL();
                    }
                }, 1000);
        	}else{
        		this.weatherMapCSS = "MapContainer_weatherMap_close";
        		this.$nextTick(()=>{
        			this.pollutionMap.invalidateSize();
        		});
        		if((!this.winOpenStatus)&&(!this.echartOpenStatus)){
	    			if(this.pollu_stationMapLayer === true && this.polluGroupSelected === true){
	    				this.loadPollutionData();
	    			}
					if(this.pollu_DistrMapLayer === true && this.polluGroupSelected === true){
						/////污染物分布图叠加
						this.setImageGorWebGL_pollu();
					}
        		}
                setTimeout(()=>{
	        		let polluted = this.pollutionMap.isSynced(this.weatherMap);
	        		if(!polluted){
	        			this.pollutionMap.sync(this.weatherMap);
	        		}
	    			let weather = this.weatherMap.isSynced(this.pollutionMap);
	        		if(!weather){
	        			this.weatherMap.sync(this.pollutionMap);
	        		}
                    this.weatherMap.invalidateSize();
                    if(this.DistrMapLayer === true && this.weaGroupSelected === true){
                        /////气象分布图叠加
                        this.setImageGorWebGL();
                    }                    
                }, 1000);
        	}
        },
        /*
        * 气象指标的改变
        */
        weaTarget_changeClick(weaObj){
            if(!this.isfirstLoad) return;
            this.$nextTick(()=>{
            	if(weaObj[0]){
                    this.weaGroupSelected = true;
                    this.weatherDefault = weaObj[0]["value"];
                    this.weatherImgDefault =  weaObj[0]["image_value"];
                    this.mapWeatherTitle = this.config['mapTitleHead'] + "-" +  weaObj[0]["label"];
                    this.setWeaLenged(weaObj[0]["value"], weaObj[0]["label"]); 

                    if(this.stationMapLayer === true){
                        let hasLayer = this.weatherMap.hasLayer(this.weaLayer)
                        if(!hasLayer){   ////站点图层
                            this.weatherMap.addLayer(this.weaLayer);
                        }
                        this.loadWeatherData();
                        if(this.echartOpenStatus && this.markClicklatlng){
                            this.markPoint(); ////标记选中
                        }
                    }
                    if(this.DistrMapLayer === true){
                        this.setImageGorWebGL();
                    }
            	}else{
                    if (this.lineGroupLayer) {
                        this._removeGroupLayers(this.lineGroupLayer, this.weatherMap);
                        this.markerLayer.clearLayers();
                    }
                    if(this.weatherWebgl){
                        this.weatherWebgl.hide();
                    }
                    if(this.weatherAFwind.isWindHas()){
                        this.weatherAFwind.windClear();
                    }
                    if(this.weatherMap.hasLayer(this.weaLayer)){
                        this.weatherMap.removeLayer(this.weaLayer);
                    }
                    if(this.weatherMap.hasLayer(this.markerClickLayer)){
                        this.weatherMap.removeLayer(this.markerClickLayer); ////有标记则去除标记
                    }
                    this.weaGroupSelected = false;
                }
            });
        },
        /*
        * 气象图例
        */
        setWeaLenged(weatherStr, weatherName){
            if(!weatherStr) weatherStr = "";
            if(!weatherName) weatherName = "";
            let Name = weatherName;
            let weaType = weatherStr.split('_')[0] === "windspeed" ? "wind" : weatherStr;
			let WeacolorOpt = utils.deepCopy(this.config['weatherColor'][weaType]);
	    	let WeaColor = WeacolorOpt['colorBar'].join(',').split(',');
            let legendTemp = utils.deepCopy(this.config['mapLegendOption']);
            legendTemp['step'] =  WeacolorOpt['resolution'];
            legendTemp['class'] = WeacolorOpt['class'];
            legendTemp['unite'] = WeacolorOpt['unit'];
            legendTemp['color'] = WeaColor;
            legendTemp['name'] = Name;
	        this.weaLegendeOption = legendTemp;
        },
        /*
        * 污染物图例
        */
        setpolluLenged(pollutionStr){
            if(!pollutionStr) pollutionStr = "";
        	let dateType = this.dateType;
			let pollution = pollutionStr.toUpperCase(); ////大写
            let polluColor = utils.deepCopy(this.$$appConfig.polColors[pollution][dateType]);

            let legendTemp = utils.deepCopy(this.config['mapLegendOption']);
            legendTemp['step'] = polluColor['step'];
            legendTemp['labels'] = polluColor['labels'];
            legendTemp['class'] =  polluColor['class'];
            legendTemp['unite'] = polluColor['unit'];
            legendTemp['color'] = polluColor['colors'];
            legendTemp['name'] = pollution;
	        this.polluLegendeOption = legendTemp;
        },
        /*
        * 污染物指标的改变
        */
        pollutTarget_changeClick(polluObj){
            if(!this.isfirstLoad) return;
            this.$nextTick(()=>{                
            	if(polluObj[0]){
                    this.polluGroupSelected = true;
    	        	this.mapPolluTitle = this.config['mapPolluTitleHead'] + "-" + polluObj[0]["label"];
            		this.pollutionDefault = polluObj[0]["value"];
            		this.setpolluLenged(polluObj[0]["value"]);
                    if(this.pollu_stationMapLayer === true){
                        let hasLayer = this.pollutionMap.hasLayer(this.pollutionLayer)
                        if(!hasLayer){ ////站点图层
                            this.pollutionMap.addLayer(this.pollutionLayer);
                        }
                        this.loadPollutionData();
                    }
                    if(this.pollu_DistrMapLayer === true){  /////污染物分布图叠加
                        this.setImageGorWebGL_pollu();
                    }
            	}else{
                    if(this.pollutionMap.hasLayer(this.pollutionLayer)){
                        this.pollutionMap.removeLayer(this.pollutionLayer);
                    }
                    if(this.pollutionWebgl){
                        this.pollutionWebgl.hide();
                    }
                    this.polluGroupSelected = false;
                }
            });
        },
        /*
		* 添加气象站点点击事件处理函数
        */
        markerClick(event){
            let obj = event.target.feature.properties; ////拿到点击的元素的属性
            this.markClicklatlng = event.latlng;
            this.markPoint(); ////标记选中

	        if(this.timesliderShow){
	        	this.timesliderShow = false;
                this.topContainer_Full = "topContainer_Full";
	        }
        	if(!this.echartOpenStatus){
                this.echartOpenStatus = true;
        		this.ExpandEcharts();
        	}
        	this.requestWeaData(obj);
        },

        /*
        * 第一次echarts的图例的下载
        */
        firstLoadEcharts(){
            let firstMarklatlng = utils.deepCopy(this.config['firstMarklatlng']);
            this.markClicklatlng = firstMarklatlng['latlng'];
            if(this.timesliderShow){
                this.timesliderShow = false;
                this.topContainer_Full = "topContainer_Full";
            }
            if(!this.echartOpenStatus){
                this.ExpandEcharts();
            }
            this.requestWeaData(firstMarklatlng);

            this.$nextTick(()=>{  
                //////为了解决初始化时webgl绘制不满
                if(this.weatherMap){
                    this.weatherMap.invalidateSize();
                }
                ////设置图例
                this.setWeaLenged(this.weatherDefault, this.config['weatherLegendLabel']); 
                if(this.stationMapLayer && this.weaGroupSelected === true){
                    this.stationMapLayerchange(this.stationMapLayer);
                }
                if(this.pollu_stationMapLayer && this.polluGroupSelected === true){
                    this.pollu_stationMapLayerchange(this.pollu_stationMapLayer);
                }
                if(this.DistrMapLayer && this.weaGroupSelected === true){
                    this.DistrMapLayerchange(this.DistrMapLayer);
                }
                if(this.pollu_DistrMapLayer){
                    this.setpolluLenged(this.pollutionDefault);                    
                    this.pollu_DistrMapLayerchange(this.pollu_DistrMapLayer);
                }     
                this.markPoint(); ////标记选中
            });
        },
        /*
        *点击气象的点后选中标记
        */
        markPoint(){
            let zoom = this.zoom;
            let zoomLayerShowNum = this.config['zoomLayerShowNum'];
            let zoomLayerShowLabel = this.config['zoomLayerShowLabel'];            
            let latlng = this.markClicklatlng || {};
            if(this.markerClickLayer){
                this.weatherMap.removeLayer(this.markerClickLayer);
            }
            let weatherStr = this.weatherDefault; 
            let weaType = weatherStr.split('_')[0] === "windspeed" ? "wind" : weatherStr;

            if(weaType === "wind"){
                let Style = "style='position:relative;top:-26px;left:-26px;padding:0px;marging:0px;width:48px;height:48px; overflow:hidden;background-color:rgba(255,255,255,0);border:2px solid green;border-left-color: red;border-right-color: black;border-top-color: yellow;border-radius:50%;'";
                let icon = L.divIcon({
                    html: "<div "+ Style +"></div>",
                    iconAnchor: [7, 7]
                });
                this.markerClickLayer = L.marker(latlng, {
                    icon: icon
                }).addTo(this.weatherMap);
            }else{
                let Style = "";
                if(zoom < zoomLayerShowNum){
                    Style = "style='position:relative;border-radius: 50%;padding:0px;marging:0px;top:-4px;left:-4px;width:20px;height:20px; overflow:hidden;background-color:rgba(255,255,255,0);border:2px solid green;border-left-color: red;border-right-color: black;border-top-color: yellow;'";
                }else if(zoom >= zoomLayerShowNum && zoom <= zoomLayerShowLabel){
                    Style = "style='position:relative;padding:0px;marging:0px;top:-8px;left:-11px;width:36px;height:20px; overflow:hidden;background-color:rgba(255,255,255,0);border:2px solid green;border-left-color: red;border-right-color: black;border-top-color: yellow;'";
                }else{
                    Style = "style='position:relative;border-radius: 50%;padding:0px;marging:0px;top:-30px;left:-13px;width:70px;height:70px; overflow:hidden;background-color:rgba(255,255,255,0);border:2px solid green;border-left-color: red;border-right-color: black;border-top-color: yellow;'";
                }
                let icon = L.divIcon({
                    html: "<div "+ Style +"></div>",
                    iconAnchor: [7, 7]
                });
                this.markerClickLayer = L.marker(latlng, {
                    icon: icon
                }).addTo(this.weatherMap);
            }
            if (zoom < this.config['zoomLayerOpacity_0'])
                this.markerClickLayer.setOpacity(0);
            else
                this.markerClickLayer.setOpacity(1);
        },

        requestWeaData(clickObj){
			let name = clickObj['NAME'];
			let code = clickObj['CODE'];
			this.currtStationName = name + this.config['echartTitle'];
        	////这里请求多个指标单个站点的数据
			let dateType = this.dateType;
			let startDt = this.startTimeStr;
			let endDt = this.endTimeStr;
			let weatherStr = utils.deepCopy(this.config['weatherReqStr']);
			let weather_Params = {
				codeType: "stationcode",
				code: code,
				target: weatherStr,
				startTimeStr: startDt,
				endTimeStr: endDt,
				dateType: dateType,
				dataFilter: "",
				isLeftJoin: false
			};
			let weatherRequest = this.$$getStationWeatherValueByMonitorDate({
				data: weather_Params,
				fn: (weaData) => {
					this.addWeaChartsOption(weaData, clickObj); ////气象的echarts
				},
				errFn: () => {
					this.addWeaChartsOption([], clickObj);
				}
			});
        },
        /*
		* 添加气象echarts
        */
        addWeaChartsOption(weaData, clickObj){
        	if(!weaData) weaData = [];
			let name = clickObj['NAME'];
			let code = clickObj['CODE'];

        	let nowDate = new Date();
        	let minute = nowDate.getMinutes(); ////获取分钟
        	if(minute < this.config["monitorUpdateMinute"]){
        		////小于设定的值，则显示前beforHour个小时
                let beforHour = this.config["monitorUpdateBeforeHour"] ||-1;
        		nowDate = dateUtils.dateAdd('h', beforHour, new Date());
        	}else{
                let afterHour = this.config["monitorUpdateafterHour"] ||-2;
                nowDate = dateUtils.dateAdd('h', afterHour, new Date());
            }
        	let endTime = nowDate;
        	let startTime = dateUtils.dateAdd('h', this.config["defaultShowHours"], nowDate);

			let mrakEcharts = this.mrak_echarts;
			let dateType = this.dateType;
			let weatherStr = utils.deepCopy(this.config['weatherReqStr']);

			let targetArry = weatherStr.split(","); ////所有的气象要素全部转化成数组
			let SeriseObj = {};                     /////所有系列的存放
			for(let ary = 0; ary < targetArry.length; ary++){
				let aname = targetArry[ary];
				SeriseObj[aname] = []; 
			}
			let dateArry = this.getEchartsDates(startTime, endTime);
			let dateLabels = []; ////日期数组
			let data = [];
			for(let index in dateArry){
				let obj = dateArry[index];
				dateLabels.push(obj.label);
				let dataObj = this.getObjFromData(weaData,obj.value,code);
				data.push("-");
				for(let ary = 0; ary < targetArry.length; ary++){
					let aname = targetArry[ary];
					let dataValue = dataObj[aname]; ////每个数据相中的数据
		            if (!dataValue|| dataValue === -999) {
		                dataValue = '-'; /////没有数据异常处理(这里要注意变温和变压有负数)
		            }
					SeriseObj[aname].push(dataValue); 
				}
			}
        	this.$nextTick(()=>{
        		for(let opt in mrakEcharts){
        			let chartIdName = mrakEcharts[opt];
        			let chartsId = this.chartsDivId + chartIdName;
					let myecharts = echarts.getInstanceByDom(document.getElementById(chartsId));

        			let chartOptionName = chartIdName + "_Option";
        			let option = utils.deepCopy(this.config[chartOptionName]);
					let dateLabelData = dateLabels;
					////多个x轴赋值
                    for(let xis in option.xAxis){
                        option.xAxis[xis].data = dateLabels;
                    }

					for(let ser in option.series){
						if(chartIdName === "Windy"){
							//////风场的特殊处理/////"Windy", "Temperatrue", "Pressure", "RainAndHum";
							let ser_valueName = option.series[ser]['name_value'];
							let ser_winddirect = option.series[ser]['wind_direct'];
							let windcolor = option.series[ser]['wind_color'];
							let Serdata = [];
							for(let sn in SeriseObj[ser_valueName]){
								let seWindValue = SeriseObj[ser_valueName][sn];
								let seWindDirect = SeriseObj[ser_winddirect][sn];
								let windObj = {
									value: seWindValue,  ////风速
									symbolRotate: -seWindDirect + 180, ////风向
									itemStyle:{
										normal:{
											color: windcolor  ////风的颜色
										}
									}
								};
								Serdata.push(windObj);
							}
							option.series[ser]['data'] = Serdata;
						}else{							
							let ser_valueName = option.series[ser]['name_value'];
							option.series[ser]['data'] = SeriseObj[ser_valueName];
						}
					}
					myecharts.setOption(option);
        		}
        	});
        	this.allChartsResize();
        },

        /*
        * 从请求的数据获取当前的时间的一项
        * data数据 time当前时间(不是字符串) code城市编码
        */
        getObjFromData(data, time, code){
            /////数据的时间格式'yyyy-MM-ddTHH:00:00'
            let dataObj = {};
            if(!data){
                data = [];
            }
            let currentTimeStr = time;
            for(let index in data){
                if(data[index]['datadate'] === currentTimeStr && data[index]['code'] === code.toString()){
                    dataObj = data[index];
                    break;
                }
            }
            return dataObj;
        },

        /*
		* 得到echarts的日期
        */
		getEchartsDates(startTime, endTime){
			let start = startTime; ////开始时间
			let end = endTime; ////结束时间
			let dates = [];
			let chartAxisFormat = this.config['chartAxisFormat'];
			let dateNum = 0;
			let dtInterval = "";
			let dateFormat = "";
			if(this.dateType === "hour"){
				dtInterval = "h";
				dateFormat = chartAxisFormat.hour;
			}else if(this.dateType === "day"){
				dtInterval = "d";
				dateFormat = chartAxisFormat.day;
			}
			dateNum = dateUtils.dateDiff(dtInterval, start, end) + 1;  /////开始时间和结束时间的差
			let hours00Color = this.config['hours00Color'];
			let hoursOtherColor = this.config['hoursOtherColor'];
			for(let dt = 0; dt < dateNum; dt++){
				let startT = start;
				let currentdate = dateUtils.dateAdd(dtInterval, dt, startT);
				let LabeldateStr = dateUtils.dateToStr(dateFormat, currentdate);
				let hours = currentdate.getHours();
				let color = hoursOtherColor;
				if(hours === 0){
					color = hours00Color;
                    LabeldateStr = dateUtils.dateToStr(chartAxisFormat.hour00, currentdate);
				}
        		let axObj = {
                    value: LabeldateStr,
                    textStyle:{
                        color: color
                    }
            	};
				let currentdateStr = dateUtils.dateToStr('yyyy-MM-ddTHH:00:00', currentdate);
				let dateObj = {
					label: axObj,
					value: currentdateStr
				};
				dates.push(dateObj);
			}
			return dates;
		},
        /*
		* 气象要素的颜色分级
		* weaType 气象的具体类型 tem_1h, tem_dt1h, rain_1h ***
		* value 数值
        */		
		getWeatherGradeInfo: function (weaTarget, value) {
			let obj = {
				fontcolor: "#fff",
				color: "#B5B5B5",
				value: "-",
				level: "-"
			}
            let weaType = weaTarget.split('_')[0] === "windspeed" ? "wind" : weaTarget;
			if (value !== "-" && value !== "" && !isNaN(value)){			
				let colorObj = this.weatherColor[weaType];
				if(colorObj){
					let resolution = colorObj['resolution']; /////颜色分辨率
					let colorBar = colorObj['colorBar']; /////颜色数组
					let fixed = colorObj['value_fixed']; ////保留小数点后位数
					let minValue = colorObj['min']; ////最小值
					let maxValue = colorObj['max']; ////最小值
					let targetValue = Number(value.toFixed(fixed));
					let arryIndex = 0;
					////颜色的位置
					if(targetValue <= minValue){
						arryIndex = 0;
					}else if(targetValue >= maxValue){
						arryIndex = colorBar.length - 1;
					}else{
						arryIndex = parseInt([targetValue - minValue]/resolution); 
					}
                    let curcolorObj = colorBar[arryIndex]; 
                    ////相对湿度特殊处理
                    if(weaTarget === 'rh_1h' && targetValue < this.config['relativeMinHum']){
                        curcolorObj = this.config['RH_small50Color'];
                    }
                    if((weaTarget === 'rain_1h'||weaTarget === 'rain_3h'||weaTarget === 'rain_6h'||weaTarget === 'rain_12h'||weaTarget === 'rain_24h') && targetValue <= 0){
                        curcolorObj = this.config['RAIN_small0Color'];
                    }
                    obj.level = arryIndex;
					let rgba = "rgba(" + curcolorObj[0] + "," + curcolorObj[1] + "," + curcolorObj[2] + "," + curcolorObj[3]/255 + ")";
					obj.color = rgba; ////颜色赋值
					obj.value = targetValue;
                    let fTcolor = this.fontColorJudg(curcolorObj[0], curcolorObj[1], curcolorObj[2]);
                    obj.fontcolor = fTcolor;
				}
			}
			return obj;
	    },
        /*
		* 气象charts的展开和关闭
        */
        ExpandEcharts(){
        	if(this.echartOpenStatus === true){
        		let polluted = this.pollutionMap.isSynced(this.weatherMap);
        		if(polluted){
        			this.pollutionMap.unsync(this.weatherMap);
        		}
    			let weather = this.weatherMap.isSynced(this.pollutionMap);
        		if(weather){
        			this.weatherMap.unsync(this.pollutionMap);
        		}
        		if(this.winOpenStatus){
        			/*全屏的时候echarts窗口的展开*/
        			this.weatherMapCSS = "MapContainer_weatherEcharts_openFull";
        			this.winOpenStatus = false;
        		}else{
        			/*半屏的时候echarts窗口的展开*/
        			this.weatherMapCSS = "MapContainer_weatherEcharts_open";
        		}
                setTimeout(()=>{
                    this.weatherMap.invalidateSize();
                    if(this.DistrMapLayer === true  && this.weaGroupSelected === true){
                        /////气象分布图叠加
                        this.setImageGorWebGL();
                    }
                }, 1000);
        	}else{
        		this.weatherMapCSS = "MapContainer_weatherEcharts_close";
        		this.winOpenStatus = true; ////全窗口打开后设置为true
                setTimeout(()=>{
	        		let polluted = this.pollutionMap.isSynced(this.weatherMap);
	        		if(!polluted){
	        			this.pollutionMap.sync(this.weatherMap);
	        		}
	    			let weather = this.weatherMap.isSynced(this.pollutionMap);
	        		if(!weather){
	        			this.weatherMap.sync(this.pollutionMap);
	        		}
                    this.weatherMap.invalidateSize();
                    if(this.DistrMapLayer === true && this.weaGroupSelected === true){
                        /////气象分布图叠加
                        this.setImageGorWebGL();
                    }
                }, 1000);
        	}
        },
        /*
		* 关闭气象charts
        */
        CloseEcharts(){
        	if(!this.timesliderShow){
        		this.timesliderShow = true;
                this.topContainer_Full = "topContainer";
        	}
        	if(this.echartOpenStatus){
                this.echartOpenStatus = false;
        		this.ExpandEcharts();
        	}
            if(this.markerClickLayer){
                ////有标记则去除标记
                this.weatherMap.removeLayer(this.markerClickLayer);
            }
        },
        /*气象站点的图层集合*/
		weaOnEachFeature(feature, layer) {
			let code = feature.properties["CODE"];
			this.weaStatCodes.push(code);
			this.weatherGroupLayer.addLayer(layer);
		},
		/*污染物站点的图层集合*/
		polluOnEachFeature(feature, layer) {
			let code = feature.properties["CODE"];
			this.pollutionStatCodes.push(code);
			this.pollutionGroupLayer.addLayer(layer);
		},
		/**
		 * 气象站点图层打开或者关闭
		 */
		stationMapLayerchange(ischeck){
        	if(!ischeck){
                if(this.weatherMap.hasLayer(this.weaLayer)){
	        	    this.weatherMap.removeLayer(this.weaLayer);
                }
                if(this.weatherMap.hasLayer(this.markerClickLayer)){
                    ////有标记则去除标记
                    this.weatherMap.removeLayer(this.markerClickLayer);
                }
	        }else{
                if(this.weaGroupSelected === true){   ////只有在选中气象条件下才能请求
                    if(!this.weatherMap.hasLayer(this.weaLayer)){
    	        	  this.weatherMap.addLayer(this.weaLayer);
                    }
                    this.loadWeatherData();
                    if(this.echartOpenStatus === true && this.markerClickLayer){
                        this.weatherMap.addLayer(this.markerClickLayer);
                    }
                }
	        }
		},
		/**
		 * 气象分布图选择的变化
		 */
		DistrMapLayerchange(ischeck){
    		if(!ischeck){
    			if(this.weatherWebgl){
					this.weatherWebgl.hide();
    			}
                if (this.lineGroupLayer) {
                    this._removeGroupLayers(this.lineGroupLayer, this.weatherMap);
                    this.markerLayer.clearLayers();
                }
                if(this.weatherAFwind.isWindHas()){
                    this.weatherAFwind.windClear();
                }
    		}else{
                if(this.weaGroupSelected === true){   
                    ////只有在选中气象条件下才能请求
                    if(this.DistrMapLayer === true && this.weaGroupSelected === true){
                        /////气象分布图叠加
                        this.setImageGorWebGL();
                    }
                }
    		}
		},

		/**
		 * 污染物站点图层选择的变化
		 */
		pollu_stationMapLayerchange(ischeck){ 
        	if(!ischeck){
				this.pollutionMap.removeLayer(this.pollutionLayer);
	        }else{
                if(this.polluGroupSelected === true){   
    				this.pollutionMap.addLayer(this.pollutionLayer);
                    this.loadPollutionData();
                }
	        }
		},
		/**
		 *  污染物分布图选择的变化
		 */
		pollu_DistrMapLayerchange(ischeck){
    		if(!ischeck){
    			if(this.pollutionWebgl){
					this.pollutionWebgl.hide();
    			}
    		}else{
                if(this.polluGroupSelected === true){                
                    this.setImageGorWebGL_pollu();
                }
    		}
		},
		/**
		 * 图表的重绘
		 */
		allChartsResize(){
        	let mrakEcharts = this.mrak_echarts;
			this.$nextTick(()=>{
				for(let opt in mrakEcharts){
        			let chartIdName = mrakEcharts[opt];
        			let chartsId = this.chartsDivId + chartIdName;
					echarts.getInstanceByDom(document.getElementById(chartsId)).resize();
				}
			});
		},

        /**
         * 根据背景颜色判断字体颜色的函数
         */
        fontColorJudg(red, green, blue){
            let color = "rgb(0,0,0)"; 
            if(red > 190 || green > 190 || blue > 190){
                color = "rgb(0,0,0)";
            }else{
                color = "rgb(255,255,255)";
            }
            return color;
        },
		/**
		 * 视图大小更改事件
		 */
		onResize() {
            if(!this.isActive) return;  ////窗口没打开的时候不处理
			if(this.echartOpenStatus){
				this.allChartsResize();
			}
            setTimeout(()=>{
                /////动画结束之后执行刷新
                if(this.weatherMap){
                    this.weatherMap.invalidateSize();
                }
                if(this.pollutionMap){
                    this.pollutionMap.invalidateSize();
                }
            }, 1000);
		}
	},

	activated: function () {
        this.isActive = true;
		if (this.isConfigLoaded) {
        	this.loadRefresh = false; 
        	this.loadPolluRefresh = false;
    		if((!this.winOpenStatus)&&(!this.echartOpenStatus)){
    			////只有在污染物的界面打开的时候请求数据
    			if(this.pollu_stationMapLayer === true && this.polluGroupSelected === true){
    				this.loadPollutionData();
    			}
				if(this.pollu_DistrMapLayer === true && this.polluGroupSelected === true){
					/////污染物分布图叠加
					this.setImageGorWebGL_pollu();
				}
    		}
        	if(this.stationMapLayer === true  && this.weaGroupSelected === true){
				this.loadWeatherData();
        	}
        	if(this.DistrMapLayer === true && this.weaGroupSelected === true){
        		/////气象分布图叠加
				this.setImageGorWebGL();
        	}
		    this.onResize();
        }
	},
	deactivated: function () {
        this.isActive = false;
	}
}


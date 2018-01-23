/**
 * Created by kangming
 * date: 2017/11/06
 * desc: 实况展示
 */

import Vue from 'vue';

import {canvasIconLayer} from 'libs/Leaflet-ext/leaflet.canvas-markers.js';
import prLineMarker from 'libs/Leaflet-ext/L.Icon.PrLineMarker.js';
import maxMinMarder from 'libs/Leaflet-ext/L.Icon.ExtremeMarker.js';
import staMarker from 'libs/Leaflet-ext/L.Icon.StaMarker.js';


//webgl polygon
import WebGLPolygon from '3clear/libs/3clear.leaflet.polygon.layer';
import WebGLWind from '3clear/libs/3clear.leaflet.wind.layer';
import {$3clearMap} from '3clear/libs/Map';

//time control
import '3clear/control/TimeControl2/css/complextimecontrol.css';
import {complextimecontrol} from '3clear/control/TimeControl2/js/complextimecontrol.js';

//comm
import settingDialog from '3clear/comm/Setting/Setting.vue';
import rightPanel from 'layout/right-panel/RightPanel.vue';
import mapTitle from '3clear/comm/MapTitle/MapTitle.vue';
import switchBar from '3clear/comm/SwitchBar/SwitchBar.vue';
import locateBtn from '3clear/comm/LocateControl/LocateControl.vue';
import legend3clear from '3clear/comm/Legend/Legend.vue';


//model
import polInfo from './PolInfo.vue'
import {dateUtils} from "../../utils/dateUtils";
import {utils} from "../../utils/utils";

//json data
import stationJsonData from 'assets/geojson/chinasta.json';
import cityJsonData from 'assets/geojson/citypoint.json';

export default {
	components: {
		'right-panel': rightPanel,
		'setting-dialog': settingDialog,
		'map-title': mapTitle,
		'pol-info': polInfo,
		'switch-bar': switchBar,
		'locate-btn': locateBtn,
		'legend3clear': legend3clear
	},
	data() {
		return {
			//模块基础数据信息
			panelWidth: 383,
			name: 'MonitorMap',
			toggleStatus: 'open',
			rightPanelWidth: this.$$appConfig.layout.rightPanel.width,
			toggle: this.$$appConfig.layout.rightPanel.toggle,
			isConfigLoaded: false,
			config: {},


			refreshEvent: null,
			timeControl: null,
			timeOutEvent: null,
			currSelectedTimeStr: '',
			wind: {},
			webGLPolygon: {},
			isolineGroupLayer: null,

			currDateType: 'hour',

			currCityInfoObj: {},//当前城市当前时刻的实测信息

			currMonitorDate: '',
			currCityName: '南京市',
			currCityCode: this.$$appConfig.prjInfo.cityCode,
			mapTitle: '空气质量及气象分布图',
			mapDate: '',
			orderType: "0",

			polObj: {label: '监测点'},
			windObj: {label: '风场'},
			disMapObj: {label: '背景场'},
			preFigureName: '',//为了判断等压线是否取同一个数据


			fields: [{
				prop: "idx",
				label: "排名",
				align: "center",
				width: 50
			}, {
				prop: "name",
				label: "城市",
				align: "center"


			}, {
				prop: "aqi",
				label: "AQI",
				align: "center",
				width: 70
			}, {
				prop: "primary_pollutant",
				label: "首要污染物",
				align: "center"
			}],

			currCityData: [],//当前所有城市实测信息
			currCityDataInfo: [],

			//geojsont图层
			staJsonData: stationJsonData,
			cityJsonData: cityJsonData,
			cityGroupLayer: L.layerGroup(),
			stationGroupLayer: L.layerGroup(),
			markerLayer: null,
			cityMarkerLayer: null,
			staMarkerLayer: null,

			defaultMapType: 'night',
			map: null,
			zoom: 5,
			cityData: [],
			stationData: [],
			location: {},
			locate: '',
			currBounds: [],
			legendOption: [],
			showLegend: true,
			staLayer: null,
			cityLayer: null
		}
	},

	created() {
		this.rightPanelWidth = this.panelWidth === undefined ? this.$$appConfig.layout.rightPanel.width : this.panelWidth;
		this.$$resize(this.onResize);
		this.$$getConfig(this.onGetConfig);
	},

	mounted() {

	},

	methods: {
		onGetConfig(data) {
			this.config = data;
			this.isConfigLoaded = true;

			this.polObj.status = this.config.settings.polRObj.on;
			this.polObj.value = this.config.settings.polRObj.default;
			this.$set(this.polObj, 'options', this.config.settings.polRObj.options);

			this.windObj.status = this.config.settings.windRObj.on;
			this.windObj.value = this.config.settings.windRObj.default;
			this.$set(this.windObj, 'options', this.config.settings.windRObj.options);

			this.disMapObj.status = this.config.settings.weaRObj.on;
			this.disMapObj.value = this.config.settings.weaRObj.default;
			this.$set(this.disMapObj, 'options', this.config.settings.weaRObj.options);

			this.showLegend = this.disMapObj.status;
			this.location = this.config.location;
			this.locate = this.config.locate;
			this.defaultMapType = this.config.settings.mapType.default;

			this.$nextTick(() => {
				this.initMap();
				this.setTimeControl();
				this.getCityMonitorInfo();
			});
		},

		onResize() {
			if (this.map)
				this.map.invalidateSize();
		},

		/**
		 * 初始化地图
		 */
		initMap() {
			this.staLayer = L.geoJSON(this.staJsonData, {});
			this.cityLayer = L.geoJSON(this.cityJsonData, {});
			let mMap = new $3clearMap('monitorDisMapDiv', this.$$appConfig.map, this.defaultMapType);
			this.map = mMap.llMap;
			this.isolineGroupLayer = L.layerGroup().addTo(this.map);

			let color = [];
			this.webGLPolygon = new L.$3clearPolygonLayer({
				imgObjInfo: this.config.gfsDisMap,
				alpha: this.$$appConfig.map.options.opacity,
				color: color
			});
			this.webGLPolygon.addTo(this.map);

			this.wind = new L.$3clearWindLayer({windData: this.config.windInfo}).addTo(this.map);
			mMap.setWindLayer(this.wind);

			this.markerLayer = L.canvasIconLayer({}).addTo(this.map);
			this.staMarkerLayer = L.canvasIconLayer({}).addTo(this.map);
			this.cityMarkerLayer = L.canvasIconLayer({}).addTo(this.map);

			this.map.on("zoomend", (event) => {
				this.zoom = this.map.getZoom();
				this._drawStation(false);
			});

			this.map.on("moveend", (event) => {
				this._drawStation(false);
			});

			this.map.fitBounds(this.currBounds);
		},


		_drawStation(refresh) {
			this.isRefresh = refresh;
			this.staMarkerLayer.clearLayers();
			this.cityMarkerLayer.clearLayers();

			if (this.polObj.status) {

				if (this.zoom >= 9) {
					this.staLayer.eachLayer((lyr) => {
						this._parseDataInfo(lyr, 'stationcode', this.staMarkerLayer);
					});
				}

				if (this.zoom < 12) {
					this.cityLayer.eachLayer((lyr) => {
						this._parseDataInfo(lyr, 'citycode', this.cityMarkerLayer);
					});
				}
			}
		},

		_parseDataInfo(lyr, codeType, markLayer) {
			let color, value, aqi, name = lyr.feature.properties.NAME;
			let cods = lyr.feature.geometry.coordinates;
			var bounds = this.map.getBounds();
			if (!bounds.contains([cods[1], cods[0]]))
				return true;
			if (this.isRefresh) {
				color = lyr.feature.properties.color;
				value = lyr.feature.properties.value || '';
				aqi = lyr.feature.properties.aqi;
			}
			else {
				let info = this.getInfo(lyr.feature.properties.CODE, codeType);
				let staInfo = utils.getGradeInfo(info.aqi);

				color = staInfo.color;
				value = info.value;
				aqi = staInfo.aqi;

				lyr.feature.properties.color = color;
				lyr.feature.properties.value = value;
				lyr.feature.properties.aqi = aqi;
			}
			let fontColor = (aqi !== '-' && aqi <= 150 ) ? "#000" : "#fff";

			if (codeType === 'stationcode') {
				if (this.zoom < 9) {
					this.staMarkerLayer.clearLayers();
				}
				else {
					let sOpt = {};
					if (this.zoom >= 9 && this.zoom <= 10) {
						sOpt = {
							value: '',
							fillColor: color,
							color: fontColor,
							rectHeight: 10,
							rectWidth: 10,
							radius: 5,
							lineWidth: 1,
						}
					}
					else if (this.zoom > 10 && this.zoom < 12) {
						sOpt = {
							value: value,
							fillColor: color,
							color: fontColor,
						};
					}

					else {
						sOpt = {
							value: value,
							fillColor: color,
							color: fontColor,
							label: name
						};
					}
					let m = new L.icon.StaMarker(sOpt);
					markLayer.addMarker(L.marker([cods[1], cods[0]], {icon: m}));
				}

			}
			else {
				let opt = {};
				if (this.zoom >= 12) {
					markLayer.clearLayers();
				}
				else {
					if (this.zoom < 6) {
						opt = {
							value: '',
							fillColor: color,
							color: fontColor,
							rectHeight: 10,
							rectWidth: 10,
							radius: 5,
							lineWidth: 1

						};
					}
					else if (this.zoom >= 6 && this.zoom < 7) {
						opt = {
							value: value,
							fillColor: color,
							color: fontColor
						};
					}
					else if (this.zoom >= 7 && this.zoom < 12) {
						opt = {
							value: value,
							fillColor: color,
							color: fontColor,
							label: name
						};
					}
					let m = new L.icon.StaMarker(opt);
					markLayer.addMarker(L.marker([cods[1], cods[0]], {icon: m}));
				}
			}
		},

		/**
		 * 创建或更新时间控件
		 */
		setTimeControl() {
			let _this = this;
			let showEndTime = dateUtils.dateAdd('d', this.config.showPredictDay - 1, new Date());
			let showEndTimeStr = dateUtils.dateToStr('yyyy-MM-dd', showEndTime);

			let endTime = dateUtils.dateAdd('d', this.config.predictDayNum - 1, new Date());
			let endTimeStr = dateUtils.dateToStr('yyyy-MM-dd', endTime);

			let startShowTime = dateUtils.dateAdd('d', -this.config.showMonitorDay, new Date());
			let startShowTimeStr = dateUtils.dateToStr('yyyy-MM-dd', startShowTime);

			let nowTime = new Date();
			if (nowTime.getMinutes() < this.$$appConfig.prjInfo.monitorUpdateHour) {
				nowTime = dateUtils.dateAdd('h', -1, new Date());
			}
			let options = {
				parent: "monitorTimeControl",
				startTimeStampRange: this.config.startTimeStampRange,
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
					_this.getCurrDateData(true, true, true);
				};
				this.timeControl = new complextimecontrol(options);
			}
		},

		polChange(value) {
			let disMapChange = (this.disMapObj.status && this.disMapObj.value === 'pol');
			console.log("disMapChange-----" + JSON.stringify(disMapChange));
			this.getCurrDateData(true, false, disMapChange);
		},

		polStatusChange(status) {
			this.polObj.status = status;
			if (!status) {
				this.staMarkerLayer.clearLayers();
				this.cityMarkerLayer.clearLayers();
			}
			else
				this.getCurrDateData(status, false, false);
		},

		windStatusChange(status) {
			this.windObj.status = status;
			if (!status) {
				this.wind.hide();
			}
			else
				this.getCurrDateData(false, status, false);
		},

		weaChange() {
			this.getCurrDateData(false, false, true);
		},

		//背景场改变时触发
		disStatusChange(status) {
			this.disMapObj.status = status;
			this.showLegend = status;
			if (!status) {
				this.webGLPolygon.hide();
				this.preFigureName = '';
				this._removeGroupLayers(this.isolineGroupLayer, this.map);
				if (this.markerLayer)
					this.markerLayer.clearLayers();
			}
			else
				this.getCurrDateData(false, false, status);
		},

		/**
		 * 获取当前时间下站点、气象要素信息
		 * @param hasPol 是否查询站点、城市信息
		 * @param hasWind 是否有动态风场
		 * @param hasDis 是否查询分布图
		 */
		getCurrDateData(hasPol, hasWind, hasDis) {

			//判断当前获取小时数据还是每日数据

			let tmpStr = this.currDateType === 'hour' ? '_1h' : '_24h';
			let pols = [];


			//如果是aqi不获取其他接口数据


			if (this.polObj.value !== 'aqi') {
				pols.push(this.polObj.value + tmpStr, this.polObj.value + tmpStr + '_iaqi');
			}

			//如果是除aqi的其他指标 分别获取_iaqi
			else {
				pols.push(this.polObj.value);
			}

			for (var i = 0; i < pols.length; i++) {
				console.log("pol----------------" + JSON.stringify(pols[i]));
			}
			let target = pols.join(',');
			let staOption = {
				target: target,
				startTimeStr: this.currSelectedTimeStr,
				endTimeStr: this.currSelectedTimeStr,
				code: '*',
				codeType: 'stationcode',
				dateType: this.currDateType,
			};
			let cityOption = {
				target: target,
				startTimeStr: this.currSelectedTimeStr,
				endTimeStr: this.currSelectedTimeStr,
				code: '*',
				codeType: 'citycode',
				dateType: this.currDateType,
			};


			//根据监测点时间获取实时监测数据
			//根据产品时间获取站点预测数据

			let staApiObj = {
				monitor: '$$getStationTargetValueByMonitorDate',
				predict: '$$getStationPredictionInfoByProductTime'
			};


			//根据监测点时间获取实时监测数据
			//根据产品时间获取城市预测数据

			let cityApiObj = {
				monitor: '$$getCityTargetValueByMonitorDate',
				predict: '$$getCityPredictionInfoByProductTime'
			};
			let currDataType = this._parseCurrDataType();


			let qTime = dateUtils.strToDate(this.currSelectedTimeStr);
			let pDate = dateUtils.dateAdd('d', -1, qTime);
			let {t, model, figure1Name, figure2Name} = utils.getCurrFigureInfo(pDate, qTime, 3, 2);

			let figureInfo;
			this.mapDate = "实况  " + this.currSelectedTimeStr.split(':')[0] + '时';
			if (currDataType === 'predict')//预报
			{
				this.mapDate = "预报  " + this.currSelectedTimeStr.split(':')[0] + '时';

				pDate = dateUtils.dateAdd('d', -1, new Date());
				let pDateStr = dateUtils.dateToStr('yyyy-MM-dd 20:00:00', pDate);

				staOption.modelName = this.config.model;
				staOption.zoneName = this.config.domain;
				staOption.predictionTimeStr = pDateStr;

				cityOption.modelName = this.config.model;
				cityOption.zoneName = this.config.domain;
				cityOption.predictionTimeStr = pDateStr;

				let objInfo = utils.getCurrFigureInfo(pDate, qTime, 3, 2);
				t = objInfo.t;
				model = objInfo.model;
				figure1Name = objInfo.figure1Name;
				figure2Name = objInfo.figure2Name;
			}

			let yyyyMMddHH = dateUtils.dateToStr('yyyyMMdd20', pDate);
			let infoObj = {
				deg: '1p00',
				year: pDate.getFullYear(),
				pdate: yyyyMMddHH,
				type: 'gfs',
				target: 'wind',
				time: figure1Name
			};
			let windPath = this._getFigurePathInfo(infoObj);

			let disMapT = t;
			let disMapModel = model;
			let disMapPath1 = "";
			let disMapPath2 = "";
			let targetGradeInfo = {};
			if (this.disMapObj.value === 'pol') {

				let objInfo = utils.getCurrFigureInfo(pDate, qTime, 1, 2);
				let infoObj = {
					dateType: 'hourly',//小时或日均
					name: this.polObj.value.toString().toUpperCase(),
					target: this.polObj.value.toString().toUpperCase(),
					year: pDate.getFullYear(),
					pDate: yyyyMMddHH,
					domain: this.config.disMapDomain,
					model: this.config.model.toUpperCase(),
					time: objInfo.figure1Name,
					level: 'z1'
				};
				disMapT = objInfo.t;
				disMapModel = objInfo.model;
				if (currDataType === 'predict') {
					disMapPath1 = this._getPolFigurePathInfo(infoObj);
					disMapPath2 = disMapPath1;
					figureInfo = utils.deepCopy(this.$$appConfig.prjInfo.modelInfo[this.config.disMapDomain]);
					this.webGLPolygon.setMask(this.$refs.fmasking_d01);
				} else {
					infoObj.date = dateUtils.dateToStr('yyyyMMdd00', qTime);
					infoObj.model = 'Observation';
					disMapPath1 = this._getObsFigurePathInfo(infoObj);
					disMapPath2 = disMapPath1;
					figureInfo = utils.deepCopy(this.$$appConfig.prjInfo.obsFigureInfo[this.config.disMapDomain]);
					this.webGLPolygon.setMask(this.$refs.mmasking_d01);
				}

				let tmpGradeInfo = utils.deepCopy(this.$$appConfig.polColors[infoObj.target]['hour']);
				targetGradeInfo.color = tmpGradeInfo.colors;
				targetGradeInfo.step = tmpGradeInfo.step;
				targetGradeInfo.class = tmpGradeInfo.class;
				targetGradeInfo.labels = tmpGradeInfo.labels;
				targetGradeInfo.unite = tmpGradeInfo.unit;
				targetGradeInfo.name = infoObj.target;
			}
			else {

				let isWind = this.disMapObj.value === 'wind';
				figureInfo = utils.deepCopy(this.config.gfsDisMap);
				figureInfo.isWind = isWind;

				this.webGLPolygon.removeMask();
				infoObj.target = this.disMapObj.value;
				disMapPath1 = this._getFigurePathInfo(infoObj);
				infoObj.time = figure2Name;
				disMapPath2 = this._getFigurePathInfo(infoObj);
				targetGradeInfo = utils.deepCopy(this.config[infoObj.target]);
			}

			let all = [];
			if (hasPol && this.polObj.status) {
				let stationDef = this[staApiObj[currDataType]]({data: staOption, fn: null});
				let cityDef = this[cityApiObj[currDataType]]({data: cityOption, fn: null});
				all.push(stationDef, cityDef);
			}

			if (hasWind && this.windObj.status) {
				let windPromise = this.wind.setWindInfo(windPath, model);
				all.push(windPromise);
				this.wind.show();
			}

			if (hasDis && this.disMapObj.status) {
				let disMapPromise;
				if (this.disMapObj.value === 'press-line')//等压线
				{
					this.showLegend = false;
					this.webGLPolygon.hide();

					let lineObjInfo = utils.getCurrFigureInfo(pDate, qTime, 3, 1);
					figure1Name = lineObjInfo.figure1Name;
					infoObj.target = 'press';
					infoObj.time = figure1Name;
					let url = this._getJsonPathInfo(infoObj);

					if (this.preFigureName === '' || this.preFigureName !== figure1Name)//如果和上一时刻数据一样则不再重复发送请求
					{
						disMapPromise = Vue.axios({
							methods: 'get',
							headers: {},
							url: url,
							baseURL: ''
						});
						all.push(disMapPromise);
					}
				}
				else {
					this.showLegend = true;
					this.legendOption = [];
					let legendTemp = {};
					legendTemp.width = 380;
					legendTemp.height = 16;
					legendTemp._w = 0;
					legendTemp.labels = targetGradeInfo.labels;
					legendTemp.step = targetGradeInfo.step;
					legendTemp.class = targetGradeInfo.class;
					legendTemp.unite = (targetGradeInfo.unite === "" ? "" : "(" + targetGradeInfo.unite + ")");
					legendTemp.color = targetGradeInfo.color;
					// legendTemp.fontcolor = '#606060';
					legendTemp.name = targetGradeInfo.name;
					this.legendOption.push(legendTemp);

					this.preFigureName = '';
					this._removeGroupLayers(this.isolineGroupLayer, this.map);

					if (this.markerLayer)
						this.markerLayer.clearLayers();
					disMapPromise = this.webGLPolygon.setImgInfo(disMapPath1, disMapPath2, figureInfo, disMapT, disMapModel, targetGradeInfo.color);
					all.push(disMapPromise);
				}
			}

			Promise.all(all).then((res) => {
				if (hasPol && this.polObj.status) {
					if (res[0].data && res[0].data['StatusCode'] !== 200) {
						this.$alert(res[0].data['HttpRequestMessage'], '提示', {
							confirmButtonText: '确定',
							type: 'warning'
						});
						this.stationData = []
					}
					else {
						this.stationData = res[0].data['HttpContent'];
					}

					if (res[1].data && res[1].data['StatusCode'] !== 200) {
						this.$alert(res[1].data['HttpRequestMessage'], '提示', {
							confirmButtonText: '确定',
							type: 'warning'
						});
						this.cityData = []
					}
					else {
						this.cityData = res[1].data['HttpContent'];

					}
					this._drawStation(false);
				}

				if (hasDis && this.disMapObj.status) {//等值面或等值线
					if (this.disMapObj.value === 'press-line' && (this.preFigureName === '' || this.preFigureName !== figure1Name)) {
						//当前数据与上一时刻不一样则再绘制
						this._drewIsoline(res[res.length - 1].data, this.isolineGroupLayer, this.markerLayer, this.map);
						this.preFigureName = figure1Name;
					}
				}
				if (this.timeOutEvent)
					clearTimeout(this.timeOutEvent);
				this.timeOutEvent = setTimeout(() => {
					if (this.timeControl.getStatus())
						this.timeControl.nextPlay();
				}, 500);
			}, (err) => {
				this.stationData = [];
				this.cityData = [];
				this._drewIsoline([], this.isolineGroupLayer, this.markerLayer, this.map);
				this._drawStation(false);
			});
		},

		_drewIsoline(data, lyr, markerLyr, map) {
			let _this = this;
			_this._removeGroupLayers(lyr, map);

			if (markerLyr) {
				markerLyr.clearLayers();
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
				let isolineLayer = L.polyline(lnglats, {color: '#1169ff', weight: 1, renderer: L.canvas()});
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

		_removeGroupLayers(lyr, map) {
			if (lyr) {
				lyr.eachLayer(function (layer) {
					let canvas = map.getRenderer(layer);
					canvas.remove();
					layer.remove();
				});
			}
		},

		_getFigurePathInfo(obj) {
			//
			let figurePath = this.$$lib__.template("<%= deg %>/<%= year %>/<%= pdate%>/<%=type%>_<%=deg%>_<%=target%>_<%= time%>_2.png");
			return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.figurePath + figurePath(obj);
		},

		_getJsonPathInfo(obj) {
			// this.$$appConfig.prjInfo.imgServer.url + '/' +
			let figurePath = this.$$lib__.template("<%= deg %>/<%= year %>/<%= pdate%>/<%=type%>_<%=deg%>_<%=target%>_<%= time%>.json");
			return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.isolinePath + figurePath(obj);
		},

		_getObsFigurePathInfo(obj) {
			// this.$$appConfig.prjInfo.imgServer.url + '/' +
			let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%=date%>/<%=target%>_<%=domain%>_<%=model%>_<%=time%>_2.png");
			return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.obsPolFigurePath + figurePath(obj);
		},

		/**
		 * 根据模板获取图片地址
		 * @param obj 图片地址信息
		 * @returns {*} 图片iis发布地址
		 * @private
		 */
		_getPolFigurePathInfo(obj) {
			// this.$$appConfig.prjInfo.imgServer.url + '/' +
			let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%=pDate%>/<%=target%>_<%=domain%>_<%=level%>_<%=model%>_<%=time%>_2.png");
			return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.polFigurePath + figurePath(obj);
		},


		/**
		 * 获取城市实况信息
		 */
		getCityMonitorInfo() {
			this.currMonitorDate = dateUtils.dateToStr('dd日hh时', dateUtils.strToDate(this.currSelectedTimeStr));

			let tmpStr = this.currDateType === 'hour' ? '_1h' : '_24h';
			let pols = [];
			this.config.settings.polRObj.options.forEach(item => {
				if (item.value !== 'aqi') {
					pols.push(item.value + tmpStr, item.value + tmpStr + '_iaqi');
				}
				else
					pols.push(item.value);
			});

			let target = 'aqi_level,primary_pollutant,' + pols.join(',');
			let cityOption = {
				target: target,
				startTimeStr: this.currSelectedTimeStr,
				endTimeStr: this.currSelectedTimeStr,
				code: this.$$appConfig.prjInfo.provinceCode,
				codeType: 'provincecode',
				dateType: this.currDateType,
			};
			this.$$getCityTargetValueByMonitorDate({
				data: cityOption, fn: (data) => {
					this.currCityDataInfo = data;
					this._setCurrCityInfo();
					this.setAllCityInfo();
				},
				errFun: () => {
					this.currCityInfoObj = [];
					this.currCityDataInfo = [];
					this.setAllCityInfo();
				}
			})
		},

		_setCurrCityInfo() {
			let pols = ['pm10_1h', 'pm25_1h', 'no2_1h', 'so2_1h', 'co_1h', 'o3_1h'];
			let tmpInfo = {
				aqi: '',
				pol: '',
				level: '',
				color: '',
				levelNum: 'level0',
				pols: []
			};
			for (let n = 0; n < pols.length; n++) {
				tmpInfo.pols.push({
					color: this.$$appConfig.prjInfo.gradeColors[0],
					value: 0,
					label: utils.addSubToLabel(pols[n].split('_')[0]),
					name: pols[n].split('_')[0]
				})
			}

			let currCityInfo = this.currCityDataInfo.filter(item => {
				return item.code === this.currCityCode;
			});

			if (currCityInfo.length > 0) {
				tmpInfo.aqi = (currCityInfo[0]['aqi'] === null || currCityInfo[0]['aqi'] === -999) ? '' : currCityInfo[0]['aqi'];
				tmpInfo.level = currCityInfo[0]['aqi_level'] === null ? '' : currCityInfo[0]['aqi_level'];
				if (tmpInfo.aqi === '')
					tmpInfo.pol = '';
				else if (tmpInfo.aqi <= 50)
					tmpInfo.pol = '-';
				else
					tmpInfo.pol = utils.addSubToLabel(currCityInfo[0]['primary_pollutant']);
				tmpInfo.color = this.styleObject(currCityInfo[0]['aqi']).backgroundColor;

				for (let m = 0; m < tmpInfo.pols.length; m++) {
					tmpInfo.pols[m].value = (currCityInfo[0][pols[m]] === null || currCityInfo[0][pols[m]] === -999) ? '' : currCityInfo[0][pols[m]];
					tmpInfo.pols[m].color = this.styleObject(currCityInfo[0][pols[m] + '_iaqi']).backgroundColor;
				}
				tmpInfo.levelNum = this._getLevelNum(tmpInfo.level);
			}
			this.currCityInfoObj = tmpInfo;
		},

		/**
		 * 通过等级获取图片class名称
		 * @param level 污染等级
		 * @returns {*}
		 * @private
		 */
		_getLevelNum(level) {
			if (level === '')
				return 'level0';
			else if (level.indexOf('优') > -1)
				return 'level1';
			else if (level.indexOf('良') > -1)
				return 'level2';
			else if (level.indexOf('轻') > -1)
				return 'level3';
			else if (level.indexOf('中') > -1)
				return 'level4';
			else if (level.indexOf('重') > -1)
				return 'level5';
			else if (level.indexOf('严重') > -1)
				return 'level6';
		},

		/**
		 * 城市列表点击事件
		 * @param row Object 当前行
		 * @param event 事件
		 * @param column Object 当前列
		 */
		onRowClick(row, event, column) {
			this.currCityName = row['name'];
			this.currCityCode = row['code'];
			this._setCurrCityInfo();
		},

		/**
		 * 判断当前时间数据的类型
		 * @returns {*} monitor:实测  predict:预报
		 * @private
		 */
		_parseCurrDataType() {
			let currDate = dateUtils.strToDate(this.currSelectedTimeStr);
			let diff = dateUtils.dateDiff('d', currDate, new Date());
			if (diff > 0)//历史
			{
				return 'monitor';
			} else if (diff === 0)//当天
			{
				diff = dateUtils.dateDiff('h', currDate, new Date());
				if (diff > 0)//当天历史
				{
					return 'monitor';
				}
				else if (diff === 0) {
					let nowTime = new Date();
					if (nowTime.getMinutes() >= this.$$appConfig.prjInfo.monitorUpdateHour) {
						return 'monitor';
					} else {
						return 'predict';
					}

				} else {//当天预报
					return 'predict';
				}

			} else if (diff < 0)//未来
			{
				return 'predict';
			}
		},

		/**
		 * 右边面板状态更改事件
		 * @param status 当前状态 open|close
		 */
		onTogglePanel(status) {
			this.toggleStatus = status;
			this.rightPanelWidth = status === 'close' ? 0 : (this.panelWidth === undefined ? this.$$appConfig.layout.rightPanel.width : this.panelWidth);
		},

		/**
		 * 根据IAQI或AQI渲染单元格样式
		 * @param value IAQI AQI 值
		 * @returns {*}
		 */
		styleObject(value) {
			if ((typeof value) === 'string')
				return {};
			let colors = this.$$appConfig.prjInfo.gradeColors;
			let bgColor = '#FFF';
			let fontColor = '#000';
			if (value === undefined || value === "--" || value === "-" || value === "" || value === null || value === -999) {
				bgColor = colors[0];
			} else if (value <= 50 && value >= 0) {
				bgColor = colors[1];
			} else if (value > 50 && value <= 100) {
				bgColor = colors[2];
			} else if (value > 100 && value <= 150) {
				fontColor = '#FFF';
				bgColor = colors[3];
			} else if (value > 150 && value <= 200) {
				fontColor = '#FFF';
				bgColor = colors[4];
			} else if (value > 200 && value <= 300) {
				fontColor = '#FFF';
				bgColor = colors[5];
			} else {
				fontColor = '#FFF';
				bgColor = colors[6];
			}
			return {
				backgroundColor: bgColor,
				color: fontColor,
				width: '100%'
			};
		},

		setAllCityInfo() {
			if (this.currCityDataInfo.length === 0)
				this.currCityData = [];
			else {
				this.currCityDataInfo.forEach(function (item) {
					if (item.aqi === null || item.aqi === -999)
						item['aqi'] = '-';
					if (item['primary_pollutant'] === null)
						item['primary_pollutant'] = '-';
					else
						item['primary_pollutant'] = item['primary_pollutant'].toUpperCase();

					item['primary_pollutant'] = (item['aqi'] <= 50 || item['aqi'] === null) ? '-' : utils.addSubToLabel(item['primary_pollutant'].toUpperCase());
				});
				let tmpArray = this.currCityDataInfo;

				let nullData = tmpArray.filter(function (item) {
					return item.aqi === '-';
				});

				tmpArray = tmpArray.filter(function (item) {
					return item.aqi !== '-';
				});

				if (this.orderType === "0")
					this.currCityData = tmpArray.sort((a, b) => a.aqi < b.aqi ? -1 : 1);
				else
					this.currCityData = tmpArray.sort((a, b) => a.aqi > b.aqi ? -1 : 1);
				console.log(this.currCityData);
				this.currCityData.forEach(function (item, idx) {
					item['idx'] = idx + 1;
				});

				nullData.forEach(function (item) {
					item['idx'] = '-';
				});

				this.currCityData = this.currCityData.concat(nullData);
			}
		},


		//map handler

		// createStaIcon(bgColor, value, name, color) {
		//     let zoom = this.zoom;
		//     return zoom < 10 ? L.divIcon({
		//         html: "<p class='map-point' style='background-color: " + bgColor + ";color:" + color + "'><\/p>",
		//         iconAnchor: [7, 7]
		//     }) : zoom >= 10 && zoom <= 11 ? L.divIcon({
		//         html: "<span class='map-point-value' style='background-color: " + bgColor + ";color:" + color + "'>" + value + "<\/span>",
		//         iconAnchor: [13, 10]
		//     }) : L.divIcon({
		//         html: "<label class='map-point-marker sta' unselectable='on' style='background-color: " + bgColor + ";color:" + color + "'>" + value + "<div class='map-point-arrow sta' style='color:" + bgColor + "'>" + "</div></label><label class='map-point-label sta' unselectable='on'>" + name + "</label>",
		//         iconAnchor: [13, 10]
		//     })
		// },
		//
		// createCityIcon(bgColor, value, name, color) {
		//     let zoom = this.zoom;
		//     return zoom < 6 ? L.divIcon({
		//         html: "<p class='map-point' style='background-color: " + bgColor + ";color:" + color + "'><\/p>",
		//         iconAnchor: [7, 7]
		//     }) : zoom >= 6 && zoom < 7 ? L.divIcon({
		//         html: "<span class='map-point-value' style='background-color: " + bgColor + ";color:" + color + "'>" + value + "<\/span>",
		//         iconAnchor: [13, 10]
		//     }) : L.divIcon({
		//         html: "<label class='map-point-marker city' unselectable='on' style='background-color: " + bgColor + ";color:" + color + "'>" + value + "<div class='map-point-arrow city' style='color:" + bgColor + "'>" + "</div></label><label class='map-point-label city' unselectable='on'>" + name + "</label>",
		//         iconAnchor: [13, 10]
		//     })
		// },
		//
		// staPointStyle(feature, latlng) {
		//     let info = this.getInfo(feature.properties.CODE, 'stationcode');
		//     let staInfo = utils.getGradeInfo(info.aqi);
		//     let name = feature.properties.NAME;
		//     let color = (staInfo.aqi !== '-' && info.aqi <= 150 ) ? "#000" : "#fff";
		//     let icon = this.createStaIcon(staInfo.color, info.value, name, color);
		//     return L.marker(latlng, {
		//         icon: icon
		//     });
		// },
		//
		// staOnEachFeature(feature, layer) {
		//     this.stationGroupLayer.addLayer(layer);
		// },
		//
		// cityPointStyle(feature, latlng) {
		//     let info = this.getInfo(feature.properties.CODE, 'citycode');
		//     let cityInfo = utils.getGradeInfo(info.aqi);
		//     let name = feature.properties.NAME;
		//     let color = (cityInfo.aqi !== '-' && info.aqi <= 150 ) ? "#000" : "#fff";
		//     let icon = this.createCityIcon(cityInfo.color, info.value, name, color);
		//     return L.marker(latlng, {
		//         icon: icon
		//     });
		// },
		//
		// cityOnEachFeature(feature, layer) {
		//     this.cityGroupLayer.addLayer(layer);
		// },
		//
		// updateMarker(refresh) {
		//     this.isRefresh = refresh;
		//     this.zoom = this.map.getZoom();
		//     this.stationGroupLayer.eachLayer(this.upDateStaPointIcon);
		//     this.cityGroupLayer.eachLayer(this.upDateCityPointIcon);
		// },

		// upDateStaPointIcon(lyr) {
		//
		//     if (!this.polObj.status) {
		//         lyr.setOpacity(0);
		//         return;
		//     }
		//
		//     let color, value, aqi, name = lyr.feature.properties.NAME;
		//     if (this.isRefresh) {
		//         color = lyr.feature.properties.color;
		//         value = lyr.feature.properties.value || '';
		//         aqi = lyr.feature.properties.aqi;
		//     }
		//     else {
		//         let info = this.getInfo(lyr.feature.properties.CODE, 'stationcode');
		//         let staInfo = utils.getGradeInfo(info.aqi);
		//
		//         color = staInfo.color;
		//         value = info.value;
		//         aqi = staInfo.aqi;
		//
		//         lyr.feature.properties.color = color;
		//         lyr.feature.properties.value = value;
		//         lyr.feature.properties.aqi = aqi;
		//     }
		//
		//     let fontColor = (aqi !== '-' && aqi <= 150 ) ? "#000" : "#fff";
		//     let icon = this.createStaIcon(color, value, name, fontColor);
		//     lyr.setIcon(icon);
		//
		//     if (this.zoom < 9)
		//         lyr.setOpacity(0);
		//     else
		//         lyr.setOpacity(1);
		// },
		//
		// upDateCityPointIcon(lyr) {
		//     if (!this.polObj.status) {
		//         lyr.setOpacity(0);
		//         return;
		//     }
		//     else {
		//         lyr.setOpacity(1);
		//     }
		//
		//     let color, value, aqi, name = lyr.feature.properties.NAME;
		//     if (this.isRefresh) {
		//         color = lyr.feature.properties.color;
		//         value = lyr.feature.properties.value || '';
		//         aqi = lyr.feature.properties.aqi;
		//     }
		//     else {
		//         let info = this.getInfo(lyr.feature.properties.CODE, 'citycode');
		//         let cityInfo = utils.getGradeInfo(info.aqi);
		//
		//         color = cityInfo.color;
		//         value = info.value;
		//         aqi = cityInfo.aqi;
		//
		//         lyr.feature.properties.color = color;
		//         lyr.feature.properties.value = value;
		//         lyr.feature.properties.aqi = aqi;
		//     }
		//
		//     let fontColor = (aqi !== '-' && aqi <= 150 ) ? "#000" : "#fff";
		//     let icon = this.createCityIcon(color, value, name, fontColor);
		//     lyr.setIcon(icon);
		//
		// },

		getInfo(code, codeType) {

			let data = codeType === 'citycode' ? this.cityData : this.stationData;
			let info = [];
			for (let i = 0; i < data.length; i++) {
				if (data[i]['code'] === code) {
					info.push(data[i]);
					break;
				}
			}
			let tmpStr = this.currDateType === 'hour' ? '_1h' : '_24h';
			if (this.polObj.value === 'o3' && this.currDateType === 'day') {
				tmpStr = '8h_max';
			}
			let iaqiStr = this.polObj.value === 'aqi' ? 'aqi' : this.polObj.value + tmpStr + '_iaqi';
			let valueStr = this.polObj.value === 'aqi' ? 'aqi' : this.polObj.value + tmpStr;

			if (info.length > 0) {
				return {
					aqi: (info[0][iaqiStr] === null || info[0][iaqiStr] === -999) ? '-' : info[0][iaqiStr],
					value: (info[0][valueStr] === null || info[0][valueStr] === -999) ? '-' : info[0][valueStr]
				};
			} else
				return {
					aqi: '-',
					value: '-'
				};
		},

		onLocation(bound) {

			this.currBounds = bound;
			if (this.map) {
				console.log(this.map.getBounds());
				this.map.fitBounds(this.currBounds);
			}

		}

	},

	activated: function () {
		if (this.isConfigLoaded) {

			if (this.refreshEvent)
				clearInterval(this.refreshEvent);
			this.refreshEvent = setInterval(() => {
				this.setTimeControl();
			}, 1000 * 60 * this.$$appConfig.prjInfo.refreshTime.hour);

			this.getCurrDateData(true, true, true);
			this.getCityMonitorInfo();
		}
		this.onResize();
	},

	deactivated: function () {
		if (this.timeControl)
			this.timeControl.stopPlay();
		if (this.wind && this.wind.hide)
			this.wind.hide();
		if (this.refreshEvent) {
			clearInterval(this.refreshEvent);
			this.refreshEvent = null;
		}
	},

	beforeRouteLeave: function (to, from, next) {
		if (this.timeControl)
			this.timeControl.stopPlay();
		next(true);

	}
}


/**
 * Created by kangming
 * date: 2017/11/09
 * desc: GIS四视窗
 */
import Vue from 'vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import syncMap from 'libs/Leaflet-ext/L.Map.Sync.js';

import {$3clearMap} from '3clear/libs/Map';

//webgl polygon
import WebGLPolygon from '3clear/libs/3clear.leaflet.polygon.layer';

//time control
import '3clear/control/TimeControl2/css/complextimecontrol.css';
import '3clear/control/TimeControl/css/timecontrol.css';
import {timeControl} from '3clear/control/TimeControl/js/timecontrol.js';
import {complextimecontrol} from '3clear/control/TimeControl2/js/complextimecontrol.js';
import legend3clear from '3clear/comm/Legend/Legend.vue';

//utils
import {dateUtils} from "../../utils/dateUtils";
import {utils} from "../../utils/utils";

import panelSelect from '3clear/comm/PanelSelect/PanelSelect.vue'
import horizonSelect from '3clear/comm/HorizonSelect/HorizonSelect.vue'

import vTable from './VTab.vue'
import dateBtns from './DateBtns.vue'


export default {
	components: {
		'setting-dialog': settingDialog,
		'panel-select': panelSelect,
		'horizon-select': horizonSelect,
		'v-table': vTable,
		'date-btns': dateBtns,
		'legend3clear': legend3clear
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
			zoomEvents: [],

			currSelectedTimeStr: '',


			//业务数据信息
			isShow: {
				model: true,
				domain: true,
				target: true,
				time: true
			},
			tabs: [],
			tab: '',
			model: '',//默认模式
			models: {title: '-模式-', options: []},//可选模式

			area: '',//默认区域
			areas: {title: '-区域-', options: []},//可选区域

			target: '',//默认指标
			targets: {title: '-指标-', options: []},//可选指标


			pDate: '',//产品日期
			pDateOptions: {
				disabledDate(time) {
					return time.getTime() > Date.now();
				}
			},
			switchTime: '',//模式时效切换临界时间
			timeOptions: [],
			time: '20:00:00',//时次
			currIntervalNum: 7,
			dateType: 'hour',

			toggleBtnGroups: [[], [], [], []],
			toggleBtns: [],
			dateBtns: [],
			currBtnValue: '',

			webGLPolygon: [],
			color: null,
			fullViewRow: ['50%', '50%'],
			fullViewCell: [['50%', '50%'], ['50%', '50%']],
			isFullView: false,
			currFullViewNum: null,
			legends: []
		}
	},
	created() {
		this.$$resize(this.onResize);
		this.$$getConfig(this.onGetConfig);
	},

	mounted() {
	},

	computed: {},

	methods: {
		/**
		 * 获取当前模块配置文件
		 * @param config json格式的配置信息
		 */
		onGetConfig(config) {
			this.config = config;
			this.isConfigLoaded = true;

			this.switchTime = this._getConfigPro('modelSwitchTime', 'default');

			let tmpTime = this.switchTime.split(':')[0];
			let currTime = new Date().getHours();
			let pDtFormat = 'yyyy-MM-dd';
			if (tmpTime <= currTime)//到了模式切换的临界时间
			{
				this.pDate = dateUtils.dateToStr(pDtFormat, new Date());
				this.time = this.$$appConfig.prjInfo.modelInfo.predictTime[0]['value'];
				this.timeOptions = [this.$$appConfig.prjInfo.modelInfo.predictTime[0]];
			}
			else {
				let nowDate = new Date();
				nowDate.setDate(nowDate.getDate() - 1);
				this.pDate = dateUtils.dateToStr(pDtFormat, nowDate);
				this.time = this.$$appConfig.prjInfo.modelInfo.predictTime[1]['value'];
				this.timeOptions = this.$$appConfig.prjInfo.modelInfo.predictTime;
			}
			this.model = this._getConfigPro(this.time + 'ModelObj', 'default');

			this.tabs = this._getConfigPro('tabsRObj', 'options');
			this.tab = this._getConfigPro('tabsRObj', 'default');

			this.area = this._getConfigPro('areaRObj', 'default');
			this.areas.options = this._getConfigPro('areaRObj', 'options');

			this.target = this._getConfigPro('polRObj', 'default');
			this.targets.options = this.config['targets'][this.model];

			//根据当前选择的产品时间和时效显示模式;
			this._getModelByInterval();
			this._getCurrIntervalNum();
			this._getCurrShowCondition();
			this._createToggleBtns();

			this.$nextTick(() => {
				this._initMap();
				this._setTimeControl();
			});
		},


		/**
		 * 时间类型更改事件
		 */
		dateTypeChange() {

			if (this.tab === 'time') {//多时刻时需要手动调用查询
				this._createToggleBtns();
				this._getCurrData();
			}
			else {//非多时刻时会自动触发时间更改事件重新查询
				this._setTimeControl();
			}
		},

		/**
		 * 时效更改事件
		 * @param interval 当前时效
		 */
		onIntervalChange(interval) {
			this._getModelByInterval();
			this._getCurrData();
		},

		/**
		 * 产品时间更改事件
		 * @param dateStr 当前选择的日期yyyy-MM-dd
		 */
		onDateChange(dateStr) {
			this.pDate = dateStr;
			let date = dateUtils.strToDate(dateStr + ' 00:00:00');
			let diff = dateUtils.dateDiff('d', date, new Date());
			if (diff === 0)//当天
			{
				this.time = this.$$appConfig.prjInfo.modelInfo.predictTime[0]['value'];
				this.timeOptions = [this.$$appConfig.prjInfo.modelInfo.predictTime[0]];
				this._getModelByInterval();
			}
			else if (diff > 0) {//历史
				this.timeOptions = this.$$appConfig.prjInfo.modelInfo.predictTime;
			}
			this._createToggleBtns();
			// if (this.tab !== 'time') {
			this._setTimeControl();
			// }
			// else {
			//     this._getCurrData();
			// }

		},
		//按照模式维度分析
		onModelChange() {
			this._getCurrIntervalNum();
			this._setTimeControl();
		},
		//按照区域维度分析
		onRegionChange() {
			this.maps.forEach(map => {
				map.fitBounds(this.$$appConfig.prjInfo.defaultExtent[this.area]);
			});
			console.log(this.$$appConfig.prjInfo.modelInfo);
			this._getCurrIntervalNum();
			this._setTimeControl();
		},


		onTargetChange() {
			this._getCurrData();
		},

		//切换日期时触发
		onDateBtnChange() {
			console.log(" onDateBtnChange当前切换的------");
			this._getCurrData();
		},
		//判断切换窗口的索引
		onToggleChange(idx) {
			console.log(" onToggleChange当前切换的------" + idx);
			this._getCurrData(idx);
		},

		/**
		 * 获取当前模式在当前区域下的预报时长
		 * @private
		 */
		_getCurrIntervalNum() {
			let currModelInfo = this.$$appConfig.prjInfo.modelInfo.model.filter((item) => {
				return item.value === this.model;
			});
			if (currModelInfo.length > 0) {
				let interval = currModelInfo[0]['interval'];
				let areaNum = Number(this.area.substr(2, 1)) - 1;
				this.currIntervalNum = interval[areaNum];
			}
		},

		/**
		 * 根据时效获取当前需显示模式
		 */
		_getModelByInterval() {
			this.models.options = this._getConfigPro(this.time + 'ModelObj', 'options');

			let currModels = this.models.options.filter((item) => {
				return item.value === this.model;
			});
			if (currModels.length === 0)//当前选中的模式也在当前显示的模式内 则不再重置选中模式 否则重置
			{
				this.model = this._getConfigPro(this.time + 'ModelObj', 'default');
			}

			if (this.tab === 'model') {
				this._createToggleBtns();
			}

		},

		/**
		 * 获取配置文件中的配置信息
		 * @param obj settings中的属性名称
		 * @param pro obj中要获取的属性名称
		 * @returns {*} 属性值
		 * @private
		 */
		_getConfigPro(obj, pro) {
			return this.config.settings[obj][pro];
		},

		/**
		 * 初始化地图
		 * @private
		 */
		_initMap() {

			let mapDivs = ["disTopLeftMap", "disTopRightMap", "disBottomLeftMap", "disBottomRightMap"];
			mapDivs.forEach((divId, idx) => {
				this.maps[idx] = new $3clearMap(divId, this.$$appConfig.map).llMap;
				this.webGLPolygon[idx] = new L.$3clearPolygonLayer({
					imgObjInfo: this.$$appConfig.prjInfo.modelInfo[this.area],
					alpha: this.$$appConfig.map.options.opacity,
					color: []
				}).addTo(this.maps[idx]);

				this.maps[idx].fitBounds(this.$$appConfig.prjInfo.defaultExtent[this.area]);
				this.legends[idx] = {};
			});

			//地图关联
			this.maps.forEach((map, idx) => {
				let tmpMaps = this.maps.filter((tmpMap, id) => {
					return id !== idx;
				});
				tmpMaps.forEach(tMap => {
					map.sync(tMap, {syncCursor: false});
				})
			});

			this.maps[0].fitBounds(this.$$appConfig.prjInfo.defaultExtent[this.area]);
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
			});
		},

		/**
		 * 创建或更新时间控件
		 */
		_setTimeControl() {
			let _this = this;
			let date = dateUtils.strToDate(this.pDate + ' 00:00:00');
			let showEndTime = dateUtils.dateAdd('d', this.currIntervalNum, date);
			let showEndTimeStr = dateUtils.dateToStr('yyyy-MM-dd 00:00:00', showEndTime);

			let startShowTime = dateUtils.dateAdd('d', 1, date);
			let startShowTimeStr = dateUtils.dateToStr('yyyy-MM-dd 00:00:00', startShowTime);

			let nowTime = startShowTime;

			//如果当前时间在变化后的时间范围内则还是显示之前的时间
			if (_this.currSelectedTimeStr !== '') {
				let currQueryTime = dateUtils.strToDate(_this.currSelectedTimeStr);
				let preNum = dateUtils.dateDiff('h', startShowTime, currQueryTime);
				let nextNum = dateUtils.dateDiff('h', currQueryTime, showEndTime);
				if (preNum >= 0 && nextNum >= 0) {
					nowTime = currQueryTime;
				}
				// _this._getCurrData();
			}

			else if (dateUtils.dateDiff('d', date, new Date()) === 1)//昨天的预报
			{
				nowTime = new Date();
			}

			let options = {
				labelToday: '今天',
				labelTomorrow: '明天',
				startTimeStampRange: startShowTimeStr,
				endTimeStampRange: showEndTimeStr,
				startTimeStampShowRange: startShowTimeStr,
				endTimeStampShowRange: showEndTimeStr,
				time: nowTime
			};
			options.dateType = this.dateType;
			let formatStr = this.dateType === 'hour' ? 'yyyy-MM-dd HH:00:00' : 'yyyy-MM-dd 00:00:00';
			options.time = dateUtils.dateToStr(formatStr, nowTime);
			if (this.timeSlider) {
				this.timeSlider.setOptions(options);
			}
			else {
				options.parent = "disMapMultiViewDayControl";
				options.onChangeTimeCallback = function (data) {
					_this.currSelectedTimeStr = data.time;
					_this._getCurrData();
				};
				this.timeSlider = new timeControl(options);
			}
		},

		onTabChange(tab) {

			if (this.timeSlider)
				this.timeSlider.stopPlay();

			this._getCurrShowCondition();
			this._createToggleBtns();
			if (tab.oldValue === 'time') {
				this.$nextTick(() => {
					this._setTimeControl();
				});
			}
			else
				this._getCurrData();
		},

		/**
		 *  创建地图上的toggle内容
		 * @private
		 */
		_createToggleBtns() {

			this.toggleBtnGroups = [[], [], [], []];
			this.toggleBtns = [];
			let currShowBtns = [];
			switch (this.tab) {
				case 'model':
					currShowBtns = this.models.options;
					break;
				case 'target':
					currShowBtns = this.targets.options;
					break;
				case 'time':

					let tmpDts = [];
					let date = dateUtils.strToDate(this.pDate + ' 00:00:00');
					for (let i = 1; i < this.currIntervalNum; i++) {
						let tmpTime = dateUtils.dateAdd('d', i, date);
						let obj = {
							label: dateUtils.dateToStr('MM-dd', tmpTime),
							value: dateUtils.dateToStr('yyyy-MM-dd', tmpTime)
						};
						tmpDts.push(obj);
					}

					if (this.dateType === 'day') {
						currShowBtns = tmpDts;
					}
					else {//小时
						this.dateBtns = tmpDts;
						this.currBtnValue = tmpDts[0].value;
						for (let j = 0; j <= 23; j++) {
							let timeStr = j < 10 ? '0' + j : j.toString();
							currShowBtns.push({
								label: timeStr + '时',
								value: timeStr + ':00:00'
							})
						}
					}

					break;
				case 'domain':
					currShowBtns = this.areas.options;
					break;
			}

			if (this.tab === 'time' && this.dateType === 'hour') {
				this.toggleBtnGroups.forEach((group, idx) => {

					for (let n = idx * 6; n < (idx + 1) * 6; n++) {
						group.push(currShowBtns[n]);
					}
					this.toggleBtns.push(currShowBtns[idx * 6].value);
				});
			}
			else {
				let num = currShowBtns.length >= 4 ? 4 : currShowBtns.length;
				this.toggleBtnGroups.forEach((group, idx) => {
					currShowBtns.forEach(model => {
						group.push(model);
					});
					let i = idx < num ? idx : idx - num;
					this.toggleBtns.push(currShowBtns[i].value);
				});

			}

		},

		_getCurrShowCondition() {
			for (let o in this.isShow)
				this.isShow[o] = true;
			this.isShow[this.tab] = false;
		},

		/**
		 * 查询当前条件下的分布图
		 * @param viewNum 单视图索引或undefined（同时查询多个视图）
		 * @private
		 */
		_getCurrData(viewNum) {
			let allDef = [];
			let infoObjs = [];
			let pDate = dateUtils.strToDate(this.pDate + ' 00:00:00');
			let qTime = dateUtils.strToDate(this.currSelectedTimeStr);
			let yyyyMMddHH = dateUtils.dateToStr('yyyyMMdd' + this.time.split(':')[0], pDate);
			let modelName = this.model.toUpperCase();
			if (modelName === 'CAMX') {
				modelName = 'CAMx';
			}
			else if (modelName === 'WRFCHEM') {
				modelName = 'WRFchem';
			}
			let {t, model, figure1Name, figure2Name} = utils.getCurrFigureInfo(pDate, qTime, 1, 2, this.dateType);

			console.log("this.area-------" + this.area);
			let infoObj = {
				dateType: this.dateType === 'hour' ? 'hourly' : 'daily',
				name: this.target.toUpperCase(),
				target: this.target.toUpperCase(),
				year: pDate.getFullYear(),
				pDate: yyyyMMddHH,
				level: 'z1',
				domain: this.area,
				model: modelName,
				time: '',
				fmodel: model,
				ft: t
			};

			if (this.tab === 'time') {
				this.toggleBtns.forEach((value, idx) => {
					let tmpInfoObj = utils.deepCopy(infoObj);
					let currQtime = '';
					if (this.dateType === 'hour') {
						currQtime = dateUtils.strToDate(this.currBtnValue + ' ' + value);
					}
					else
						currQtime = dateUtils.strToDate(value + ' 00:00:00');
					let tmpObj = utils.getCurrFigureInfo(pDate, currQtime, 1, 2, this.dateType);
					tmpInfoObj.time = tmpObj.figure1Name;
					tmpInfoObj.fmodel = tmpObj.model;
					tmpInfoObj.ft = tmpObj.t;
					infoObjs.push(tmpInfoObj);
				});
			}
			else {
				infoObj.time = figure1Name;
				this.toggleBtns.forEach((btn, idx) => {
					let tmpObj = utils.deepCopy(infoObj);
					let tmp = btn;
					if (this.tab === 'model') {
						tmp = btn.toUpperCase();
						if (tmp === 'CAMX')
							tmp = 'CAMx';
						else if (tmp === 'WRFCHEM')
							tmp = 'WRFchem';
					}
					else if (this.tab === 'target') {
						tmp = btn.toUpperCase();
					}

					tmpObj[this.tab] = tmp;
					infoObjs.push(tmpObj);
				});
			}
			infoObjs.forEach((info, i) => {
				let disMapPromise = null;
				let currArea = info.domain;

				let colorObj = this.$$appConfig.polColors[info.target][this.dateType];

				if (this.tab === 'domain')
					currArea = info.domain;

				let tmpGradeInfo = utils.deepCopy(colorObj);

				this.legends[i] = {};
				let legendTemp = {};
				legendTemp.width = 330;
				legendTemp.height = 15;
				legendTemp._w = 0;
				legendTemp.step = tmpGradeInfo.step;
				legendTemp.labels = tmpGradeInfo.labels;
				legendTemp.class = tmpGradeInfo.class;
				legendTemp.unite = (tmpGradeInfo.unit === "" ? "" : "(" + tmpGradeInfo.unit + ")");
				legendTemp.color = tmpGradeInfo.colors;
				legendTemp.name = info.target;

				this.$set(this.legends, i, legendTemp);

				info.name = info.target;
				if (this.dateType === 'day' && info.target === 'O3')//处理O3日均
				{
					info.name = 'O38H';
					info.target = 'O38H';
				}

				this.webGLPolygon[i].removeMask();
				this.webGLPolygon[i].setMask(this.$refs["masking_" + currArea]);
				let imgObjInfo = this.$$appConfig.prjInfo.modelInfo[currArea];
				let path = this._getPolFigurePathInfo(info);
				if (viewNum === undefined) {//所有视图重新查询
					if (this.isFullView) {
						if (i === Number(this.currFullViewNum)) {//单视图条件变更查询
							disMapPromise = this.webGLPolygon[i].setImgInfo(path, path, imgObjInfo, info.ft, info.fmodel, legendTemp.color);
							allDef.push(disMapPromise);
						}
					}
					else {
						disMapPromise = this.webGLPolygon[i].setImgInfo(path, path, imgObjInfo, info.ft, info.fmodel, legendTemp.color);
						allDef.push(disMapPromise);
					}
				}
				else if (i === Number(viewNum)) {//单视图条件变更查询
					disMapPromise = this.webGLPolygon[i].setImgInfo(path, path, imgObjInfo, info.ft, info.fmodel, legendTemp.color);
					allDef.push(disMapPromise);
				}
			});

			Promise.all(allDef).then((res) => {
				this._nexTime();
			}, (err) => {
				this._nexTime();
			});
		},

		_nexTime() {
			if (this.timeOutEvent)
				clearTimeout(this.timeOutEvent);
			this.timeOutEvent = setTimeout(() => {
				if (this.timeSlider.getStatus())
					this.timeSlider.nextPlay();
			}, 500);
		},

		/**
		 * 根据模板获取图片地址
		 * @param obj 图片地址信息
		 * @returns {*} 图片iis发布地址
		 * @private
		 */
		_getPolFigurePathInfo(obj) {
			let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%= year%>/<%=pDate%>/<%=target%>_<%=domain%>_<%=level%>_<%=model%>_<%=time%>_2.png");
			return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.polFigurePath + figurePath(obj);
		},
		/**
		 * 根据模板获取Json文件地址
		 * @param obj 图片地址信息
		 * @returns {*} 图片iis发布地址
		 * @private
		 */
		_getJsonPathInfo(obj) {
			let figurePath = this.$$lib__.template("<%= dateType %>/<%= name %>/<%=target%>/<%= year%>/<%=pDate%>/<%=target%><%=dateType%>Spa_<%=domain%>_<%=model%>_<%=time%>.json");
			return this.$$appConfig.prjInfo.imgServer.url + '/' + this.config.polFigurePath + figurePath(obj);
		},


		_changeViewExtent(full) {
			if (this.isFullView) {
				this.currFullViewNum = null;
				this.isFullView = false;
				this.fullViewRow = ['50%', '50%'];
				this.fullViewCell.forEach(views => {
					views.forEach((col, idx) => {
						this.$set(views, idx, '50%');
					})
				});
				this._getCurrData();
			} else {
				this.isFullView = true;
				this.currFullViewNum = full[0] * 2 + full[1];
				this.fullViewRow = ['0', '0'];
				this.fullViewRow[full[0]] = '100%';
				this.fullViewCell.forEach(views => {
					views.forEach((col, idx) => {
						this.$set(views, idx, '0');
					})
				});
				this.fullViewCell[full[0]][full[1]] = '100%';
			}

			this._resizeMap();

		},

		_resizeMap() {
			this.$nextTick(() => {
				this.maps.forEach(map => {
					if (map && map.invalidateSize)
						map.invalidateSize();
				});
			});

		},

		/**
		 * 视图大小更改事件
		 */
		onResize() {
			this._resizeMap();
		}
	},

	activated: function () {
		if (this.isConfigLoaded) {
			this._getCurrData();
		}
		this.onResize();
	},

	deactivated: function () {
	},

	beforeRouteLeave: function (to, from, next) {
		if (this.timeSlider)
			this.timeSlider.stopPlay();
		next(true);

	}
}


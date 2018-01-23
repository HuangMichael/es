/**
 * Created by kangming
 * date: 2017/9/19
 * desc: 框架测试
 */

//布局
import rightPanel from 'layout/right-panel/RightPanel.vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import titlePanel from '3clear/comm/TitlePanel/TitlePanel.vue';
import weatherPane from './WeatherPane.vue';
import weatherPaneTitle from './WeatherPaneTitle.vue';

//工具类
import {dateUtils} from 'utils/dateUtils.js';
import {utils} from 'utils/utils.js'
import {calendar} from 'utils/calendar.js'

//jsx
import {tplFunction} from '3clear/jsx/treeStationMarker.js'

import 'libs/Scrollbar/jquery.mCustomScrollbar.css';
import {scrollbar} from 'libs/Scrollbar/jquery.mCustomScrollbar.js'
import {mousewheel} from 'libs/Scrollbar/jquery.mousewheel.min.js'

export default {
	components: {
		'right-panel': rightPanel,
		'setting-dialog': settingDialog,
		'weather-pane': weatherPane,
		'weather-pane-title': weatherPaneTitle,
		'title-panel': titlePanel

	},
	data() {
		return {
			//模块基础数据信息
			name: 'CityPrediction',
			toggleStatus: 'open',
			rightPanelWidth: this.$$appConfig.layout.rightPanel.width,
			toggle: this.$$appConfig.layout.rightPanel.toggle,
			isConfigLoaded: false,
			config: {},


			//业务数据信息
			model: '',//默认模式
			models: [],//可选模式

			area: '',//默认区域
			areas: [],//可选区域
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
			currSelectObj: {},//当前树种选中的节点对象

			tableColumns: [],
			tableData: [],
			tableMaxHt: 500,

			othersModels: [],//表格中当前被收起来的模式
			currTableData: [],

			wrfData: [],
			tmpWrfData: [],

			treeData: [],
			expandKeys: [],


			defaultProps: {
				children: 'children',
				label: 'label'
			}

		}
	},

	created() {
		this.rightPanelWidth = this.toggleStatus === "close" ? 0 : this.$$appConfig.layout.rightPanel.width;
		this.$$resize(this.onResize);
		this.$$getConfig(this.onGetConfig);
	},

	mounted() {
		this.$nextTick(() => {
			this.$$lib_$("#cityPredictDayTable .el-table__body-wrapper.is-scroll-left").mCustomScrollbar();
		});
	},

	methods: {

		/**
		 * 获取配置文件中的配置信息
		 * @param obj settings中的属性名称
		 * @param pro obj中要获取的属性名称
		 * @returns {*} 属性值
		 * @private
		 */
		_getConfigPro(obj, pro) {
			console.log("obj--" + JSON.stringify(obj) + "--pro--" + JSON.stringify(pro));
			return this.config.settings[obj][pro];d
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
				let areaNum = Number(this.area.substr(1, 1)) - 1;
				this.currIntervalNum = interval[areaNum];
				console.log("获取当前模式在当前区域下的预报时长---------------" + this.currIntervalNum);
			}
		},

		/**
		 * 获取当前模块配置文件
		 * @param config json格式的配置信息
		 */
		onGetConfig(config) {
			this.config = config;
			this.isConfigLoaded = true;
			this.area = this._getConfigPro('areaRObj', 'default');
			this.areas = this._getConfigPro('areaRObj', 'options');
			this.treeData = this._getConfigPro('cityStaTreeObj', 'default');
			this.treeDataChecked = this._getConfigPro('cityStaTreeObj', 'checked');
			this.switchTime = this._getConfigPro('modelSwitchTime', 'default');
			this.tableColumns = this.config.tableColumns;

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


			//默认展开选中项节点
			let tmpObj = this._deepCopy(this.treeData);
			this.treeDataChecked.forEach((con, idx) => {
				if (idx === 0)
					tmpObj = tmpObj[con];
				else
					tmpObj = tmpObj.children[con];

				this.expandKeys.push(tmpObj.code);
			});

			this.currSelectObj = tmpObj;
			setTimeout(() => {
				this.$refs.cityTree.setCurrentNode(this.currSelectObj);
			}, 0);

			//根据当前选择的产品时间和时效显示模式;
			this._getModelByInterval();
			this._getCurrIntervalNum();
			this.getCurrPredictDataInfo();
		},

		/**
		 * 产品时间更改事件
		 * @param dateStr 当前选择的日期yyyy-MM-dd
		 */
		onDateChange(dateStr) {
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
			this.getCurrPredictDataInfo();
		},


		/**
		 * 时效更改事件
		 * @param interval 当前时效
		 */
		onIntervalChange(interval) {
			this._getModelByInterval(interval);
			this.getCurrPredictDataInfo();
		},

		/**
		 * 模式更改事件
		 * @param model  当前选中模式
		 * 模式发生变化时触发改事件
		 */
		onModelChange(model) {
			this._getCurrIntervalNum();
			this._resetTableData();
			this.$refs.pTable.doLayout();
			this.$refs.cTable.doLayout();
		},

		/**
		 * 区域更改事件
		 * @param area 当前选中区域
		 */
		onRegionChange(area) {
			this._getCurrIntervalNum();
			this.getCurrPredictDataInfo();
		},

		/**
		 * 根据时效获取当前需显示模式
		 */
		_getModelByInterval() {
			console.log("获取模式----");
			this.models = this._getConfigPro(this.time + 'ModelObj', 'options');
			let currModels = this.models.filter((item) => {
				return item.value === this.model;
			});
			if (currModels.length === 0)//当前选中的模式也在当前显示的模式内 则不再重置选中模式 否则重置
			{
				this.model = this._getConfigPro(this.time + 'ModelObj', 'default');
			}
		},


		/**
		 * 点击目录树节点事件
		 * @param data
		 */
		handleNodeClick(data) {
			this.currSelectObj = data;
			this.getCurrPredictDataInfo();
		},


		renderNodeContent(h, {node, data, store}) {
			return tplFunction(h, {node, data, store});
		},


		/**
		 * 查询当前条件下的数据
		 *
		 * 获取预测数据
		 */
		getCurrPredictDataInfo() {

			let dtFormat = 'yyyy-MM-dd 00:00:00';
			let dtExt = this._getCurrPredictDtExtent(dtFormat);
			console.log(" this.config.polTarget--------" + JSON.stringify(this.config.polTarget));
			let polOption = {
				modelName: this.model,
				zoneName: this.area,
				target: this.config.polTarget,
				startTimeStr: dtExt.stDateStr,
				endTimeStr: dtExt.edDateStr,
				predictionTimeStr: this.pDate + ' ' + this.time + ':00:00',
				dateType: 'day'
			};

			let weaOption = {
				modelName: 'wrf',
				zoneName: this.area,
				target: this.config.weaTarget,
				startTimeStr: dtExt.stDateStr,
				endTimeStr: dtExt.edDateStr,
				predictionTimeStr: this.pDate + ' ' + this.time + ':00:00',
				dateType: 'day'
			};

			let polCityAPI = '$$getCityPredictionInfoByProductTime';
			let polStaAPI = '$$getStationPredictionInfoByProductTime';
			let weaCityAPI = '$$getCityWrfPredictionInfoByProductTime';
			let weaStationAPI = '$$getStationWrfPredictionInfoByProductTime';

			let polAPI = '';
			let weaAPI = '';

			if (this.currSelectObj.type === 'city') {
				polOption.code = this.currSelectObj.code;
				weaOption.code = this.currSelectObj.code;
				polOption.codeType = 'citycode';
				weaOption.codeType = 'citycode';

				polAPI = polCityAPI;
				weaAPI = weaCityAPI;
			}
			else {
				polOption.code = this.currSelectObj.code;
				polOption.codeType = 'stationcode';

				weaOption.code = this.currSelectObj.code;
				weaOption.codeType = 'stationcode';

				polAPI = polStaAPI;
				weaAPI = weaStationAPI;
			}


			console.log("polAPI---" + JSON.stringify(polAPI));
			console.log("weaAPI---" + JSON.stringify(weaAPI));
			let currModelName = this.models;
			for (var x in this.models) {
				console.log("model------------" + JSON.stringify(x));
			}
			this.othersModels = this.models.filter((item) => {
				if (item.value === this.model)
					currModelName = item.label;
				return item.value !== this.model;
			});

			let polDef = this[polAPI]({data: polOption, fn: null});
			let weaDef = this[weaAPI]({data: weaOption, fn: null});
			let allDef = [polDef, weaDef];

			this.othersModels.forEach((item) => {
				let tmpOption = this._deepCopy(polOption);
				tmpOption.modelName = item.value;
				let tmpDef = this[polAPI]({data: tmpOption, fn: null});
				allDef.push(tmpDef);
			});
			this.wrfData = [];
			this.$$promiseAll.call(this, allDef, (res) => {
				let pDateObj = dateUtils.strToDate(this.pDate + ' 00:00:00');
				let tableResData = [];
				this.tmpWrfData = [];
				for (let num = 1; num <= this.currIntervalNum; num++) {
					//解析空气质量预报数据
					let currDtData = {};
					let currDt = dateUtils.dateAdd('d', num, pDateObj);
					let currDtStr = dateUtils.dateToStr('yyyy-MM-ddT00:00:00', currDt);
					let currModelData = this._getDataByDate(currDtStr, res[0].data);
					if (currModelData.length > 0) {
						this._handelDataFormant(currModelData[0]);
						currDtData = Object.assign(currDtData, currModelData[0]);
					}
					currDtData.datadate = dateUtils.dateToStr('yyyy/MM/dd', currDt);
					currDtData.model = currModelName;
					currDtData.otherTableData = [];
					this.othersModels.forEach((item, idx) => {
						let currOtherData = {};
						let currOthModelData = this._getDataByDate(currDtStr, res[idx + 2].data);
						if (currOthModelData.length > 0) {
							this._handelDataFormant(currOthModelData[0]);
							currOtherData = Object.assign(currOtherData, currOthModelData[0]);
						}
						currOtherData.datadate = '';//dateUtils.dateToStr('yyyy-MM-dd', currDt);
						currOtherData.model = item.label;
						currDtData.otherTableData.push(currOtherData);
					});
					tableResData.push(currDtData);

					//解析气象数据
					let infoObj = {};
					let currWrfData = this._getDataByDate(currDtStr, res[1].data);
					if (currWrfData.length > 0) {
						infoObj = Object.assign({}, currWrfData[0]);
					} else {
						let fields = this.config.weaTarget.split(',');
						fields.forEach(item => {
							infoObj[item] = '';
						});
					}
					let curDtStr = dateUtils.dateToStr('MM/dd 周w', currDt);
//                  let jqTime = dateUtils.dateToStr('yyyy-MM-dd', currDt);
					let jqObj = calendar.solar2lunar(currDt.getFullYear(), currDt.getMonth() + 1, currDt.getDate());//获取节气
					if (jqObj.Term !== null) {

						curDtStr += '(' + jqObj.Term + ')';
					}
					this.wrfData.push({info: infoObj, dateStr: curDtStr});
				}
				this.currTableData = tableResData;
				this.tableData = tableResData;

			}, (err) => {
				this.currTableData = [];
				this.tableData = [];
			});
		},

		/**
		 * 处理异常数据、首要污染物
		 * @param data 数据
		 * @private
		 */
		_handelDataFormant(data) {
			for (let o in data) {
				if (data[o] < 0 || data[o] === null) {
					data[o] = '';
				}
				if ((typeof data[o]) === 'number') {
					let len = o === 'co_24h' ? 1 : 0;
					data[o] = Number(data[o].toFixed(len));
				}
				if (o === 'primary_pollutant') {
					if (data['aqi'] === '' || data['aqi'] < 0 || data['aqi'] === null) {
						data[o] = '';
					}
					else if (data['aqi'] > 50) {
						data[o] = utils.addSubToLabel(data[o]);
					}
					else {
						data[o] = '-';
					}
				}
			}
		},

		/**
		 * 模式切换时调整模式数据显示顺序
		 * @private
		 */
		_resetTableData() {


			console.log("_resetTableData-------------模式切换时调整模式数据显示顺序");
			let currModel = this.model;
			let idx = this.othersModels.findIndex((item, index, arr) => {
				return item.value === currModel;
			});
			//获取上一次选中的模式
			let preModel = this.models.concat(this.othersModels).filter(v => !this.models.includes(v) || !this.othersModels.includes(v));
			this.othersModels[idx] = preModel[0];
			if (idx > -1) {
				let newDataObj = [];
				this.currTableData.forEach((item) => {
					//当前模式数据与上一模式数据交换位置
					let currModelData = item.otherTableData[idx];
					let dataObj = Object.assign({otherTableData: []}, currModelData);
					dataObj.datadate = item.datadate;
					let tmpObj = Object.assign({}, item);
					delete tmpObj.otherTableData;
					tmpObj.datadate = '';
					item.otherTableData[idx] = tmpObj;
					dataObj.otherTableData = item.otherTableData;
					newDataObj.push(dataObj);
				});
				this.currTableData = newDataObj;
				this.tableData = newDataObj;
			}
		},


		/**
		 * 根据时间获取数据
		 * @param dtStr 时间字符串
		 * @param data 数据集
		 * @returns {Array.<T>|*} 查询到的数据集
		 * @private
		 */
		_getDataByDate(dtStr, data) {
			return data.filter((item) => {
				return item.datadate === dtStr;
			});
		},

		/**
		 * 获取当前预报的起始和结束时间
		 * @param dtFormat 指定返回的格式
		 * @returns {{stDateStr: (*|string), edDateStr: (*|string)}}
		 * @private
		 */
		_getCurrPredictDtExtent(dtFormat) {
			let pDateObj = dateUtils.strToDate(this.pDate + ' 00:00:00');
			let stDate = dateUtils.dateAdd('d', 1, pDateObj);
			let edDate = dateUtils.dateAdd('d', this.currIntervalNum, pDateObj);
			let stDateStr = dateUtils.dateToStr(dtFormat, stDate);
			let edDateStr = dateUtils.dateToStr(dtFormat, edDate);

			var dateStr = {stDateStr, edDateStr};
			console.log("_getCurrPredictDtExtent-------------" + JSON.stringify(dateStr));
			return dateStr
		},

		/**
		 * 深度copy对象
		 * @param data copy的源对象
		 * @private
		 */
		_deepCopy(data) {
			return JSON.parse(JSON.stringify(data));
		},


		/**
		 * 判断是否为周末或节假日
		 * @param str 当前时间字符串
		 * @returns {boolean}
		 */
		isHoliday: function (str) {
			//todo 目前仅判断了是否为周六或周天 后续需要判断是否为节假日
			return (str.indexOf('六') > -1 || str.indexOf('日') > -1)
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

		/**
		 * 视图大小更改事件
		 */
		onResize() {
			let win_size_ht = this.$$lib_$(window).height();
			this.tableMaxHt = win_size_ht - 457 - 25;

		},

		/**
		 * 右边面板状态更改事件
		 * @param status 当前状态 open|close
		 */
		onTogglePanel(status) {
			this.toggleStatus = status;
			this.rightPanelWidth = status === 'close' ? 0 : this.$$appConfig.layout.rightPanel.width;
		}
	},

	computed: {
		titleContent: function () {
			let dtFormat = 'MM月dd日';
			let dtExt = this._getCurrPredictDtExtent(dtFormat);
			let currName = this.currSelectObj.label;
			return currName + dtExt.stDateStr + '至' + dtExt.edDateStr;
		},
		tableTitle: function () {
			console.log(this.titleContent + '空气质量预报结果');
			return this.titleContent + '空气质量预报结果';
		},
		weatherTitle: function () {
			console.log(this.titleContent + '气象预报结果');
			return this.titleContent + '气象预报结果';
		}
	},

	activated: function () {
		if (this.isConfigLoaded) {
			this.getCurrPredictDataInfo();
		}
		this.onResize();
	},

	deactivated: function () {
	}

}


/**
 * Created by kangming
 * date: 2017/9/19
 * desc: 框架测试
 */

//布局
import rightPanel from 'layout/right-panel/RightPanel.vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import titlePanel from '3clear/comm/TitlePanel/TitlePanel.vue';

//工具类
import {dateUtils} from 'utils/dateUtils.js';
import {utils} from 'utils/utils.js'
import {calendar} from 'utils/calendar.js'

import echarts  from 'echarts'

//jsx
import {tplFunction} from '3clear/jsx/treeStationMarker.js'
import 'libs/Scrollbar/jquery.mCustomScrollbar.css';
import {scrollbar} from 'libs/Scrollbar/jquery.mCustomScrollbar.js'
import {mousewheel} from 'libs/Scrollbar/jquery.mousewheel.min.js'

export default {
	components: {
		'right-panel': rightPanel,
		'setting-dialog': settingDialog,
		'title-panel': titlePanel

	},
	data() {
		return {
			//模块基础数据信息
			name: 'DateRangeContrast',
			toggleStatus: 'open',
			rightPanelWidth: this.$$appConfig.layout.rightPanel.width,
			toggle: this.$$appConfig.layout.rightPanel.toggle,
			isConfigLoaded: false,
			config: {},
			//业务数据信息
			model: '',//默认模式
			models: [],//可选模式
			polType: "",
			polTypes: [],
			currSelectObj: {},//当前树种选中的节点对象
           //ajax 请求的原始数据
			originData: [],
			tableColumns: [],
			tableData: [],
			chartData: [],
			tableMaxHt: 500,
			treeData: [],
			expandKeys: [],
			defaultProps: {
				children: 'children',
				label: 'label'
			},
			timeRange: "",
			pickerOptions: {
				shortcuts: [{
					text: '最近一周',
					onClick(picker) {
						const end = new Date();
						const start = new Date();
						start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
						picker.$emit('pick', [start, end]);
					}
				}, {
					text: '最近一个月',
					onClick(picker) {
						const end = new Date();
						const start = new Date();
						start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
						picker.$emit('pick', [start, end]);
					}
				}, {
					text: '最近三个月',
					onClick(picker) {
						const end = new Date();
						const start = new Date();
						start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
						picker.$emit('pick', [start, end]);
					}
				}]
			}

		}
	},

	/**
	 *创建之后执行
	 */
	created() {
		this.rightPanelWidth = this.toggleStatus === "close" ? 0 : this.$$appConfig.layout.rightPanel.width;
		console.log("created");
		this.$$resize(this.onResize);
		this.$$getConfig(this.onGetConfig);
	},

	/**
	 *挂载之后执行
	 */
	mounted() {
		this.$nextTick(() => {
			this.$$lib_$("#DataRangeContrastTable .el-table__body-wrapper.is-scroll-left").mCustomScrollbar();
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
			return this.config.settings[obj][pro];
		},
		/**
		 * 获取当前模块配置文件
		 * @param config json格式的配置信息
		 */
		onGetConfig(config) {
			this.config = config;
			this.isConfigLoaded = true;
			this.treeData = this._getConfigPro('cityStaTreeObj', 'default');
			this.treeDataChecked = this._getConfigPro('cityStaTreeObj', 'checked');
			this.switchTime = this._getConfigPro('modelSwitchTime', 'default');
			this.tableColumns = this.config.tableColumns;

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
			this.getPolType();
		},

		/**
		 * 污染物更改事件
		 */
		onPolTypeChange() {
			//污染物切换时 同时切换数据列表数据和统计图表数据
			this.initChart();
			this.initTable();
		},


		/**
		 * 按照日期对数据进行分组
		 * @returns {Array}
		 * @param ajaxData
		 */
		mapDailyDataByDay(ajaxData){
			let dateArray = [];
			//首先对数据中的日期进行汇总
			let days = this.getXaxisData();
			days.forEach(function (day) {
				let filterArray = ajaxData.filter(function (item) {
					let dateStr = item["datadate"].toString().substring(0, 10);
					return (dateStr == day);
				});
				let dateObj = {"datadate": day, "dataList": filterArray}
				dateArray.push(dateObj);
			});
			return dateArray;
		},


		/**
		 * 选择时间后触发时间查询数据
		 */
		onChangeDateRange(){
			//更新数据
			this.initChart();
			this.initTable();

		},


		/**
		 * 获取选择的时间字符串
		 * @returns {Array}
		 */
		getDateStrArray(){
			let dateStrArray = [];
			let beginDate, endDate;
			if (this.timeRange && this.timeRange[0] && this.timeRange[1]) {
				beginDate = this.timeRange[0];
				endDate = this.timeRange[1]
				dateUtils.dateToStr("yyyy-MM-dd", this.timeRange[1]);

			} else {
				endDate = dateUtils.dateAdd("d", 1, new Date());
				beginDate = dateUtils.dateAdd("d", -7, endDate);

			}
			let beginDateStr = dateUtils.dateToStr("yyyy-MM-dd", beginDate);
			let endDateStr = dateUtils.dateToStr("yyyy-MM-dd", endDate);
			dateStrArray[0] = beginDateStr + " 00:00:00";
			dateStrArray[1] = endDateStr + " 00:00:00";
			return dateStrArray;
		},


		/**
		 *获取x轴的数据 根据所选或者默认的时间段生成x轴
		 * @returns {Array}
		 */
		getXaxisData(){
			let xData = [];
			let dateStrArray = this.getDateStrArray();
			let startDate = dateUtils.strToDate(dateStrArray[0]);
			let endDate = dateUtils.strToDate(dateStrArray[1]);
			var diff = dateUtils.dateDiff("d", startDate, endDate);
			for (var x = 0; x < diff; x++) {
				let day = dateUtils.dateToStr("yyyy-MM-dd", dateUtils.dateAdd("d", x, startDate));
				if (!xData[day]) {
					xData[x] = day;
				}
			}
			return xData;
		},


		/**
		 * 封装成表格需要的数据
		 * @param ajaxData 原始请求的数据
		 * @return {Array} 按照格式封装成数组
		 */
		assembleTableData(ajaxData)
		{
			let pols = ["aqi", "pm10", "pm25", "so2", "no2", "co", "o3"];
			let dailyData = this.mapDailyDataByDay(ajaxData);
			let polDataArray = []
			dailyData.forEach(function (d) {
				let tableDataObj = {};
				var day = d["datadate"];
				let keys = d["dataList"];
				pols.forEach(function (p) {
					let polArray = [];
					tableDataObj["monitorDate"] = day.substr(0, 10);
					keys.forEach(function (i) {
						let colName = (p === 'aqi') ? p : p + "_1h";
						polArray.push((i[colName] == -999) ? 0 : i[colName]);

					});
					//计算最大值 最小值 平均值
					//求出日最大值  最小值   平均值
					if (polArray.length > 0) {
						var max = polArray[0];
						var min = polArray[0];
						var avg, sum = 0;
						var len = polArray.length;
						for (var i = 0; i < len; i++) {
							let value = polArray[i];
							//判断是否为数字 非数字参与运算时赋值0  显示时处理为“-”
							min = (value > min) ? min : value;
							max = (value < max) ? max : value;
							sum += value;
						}
						min = (min) ? min : "-";
						max = (max) ? max : "-"
						avg = (sum) ? (sum / len).toFixed(2) : "-";
						tableDataObj[p + "_min"] = min;
						tableDataObj[p + "_max"] = max;
						tableDataObj[p + "_avg"] = avg;
					}
				})
				polDataArray.push(tableDataObj);

			});
			return polDataArray;
		},


		/**
		 * 封装成图表需要的数据
		 * @param ajaxData 原始数组
		 * @return {Array} 返回封装数组
		 */
		assembleChartValue(ajaxData){
			let dailyData = this.mapDailyDataByDay(ajaxData);
			let polType = this.polType;
			//获取dataList 中对应的日期  对应的污染物的监测数据
			let enData = [];
			dailyData.forEach(function (item) {
					let day = item["datadate"];
					let dailyList = item["dataList"];
					//遍历每小时的监测数据
					let valueArray = [];
					dailyList.forEach(function (hourData) {
						let v = (polType == "aqi") ? hourData[polType] : hourData[polType + "_1h"];
						v = (v == -999) ? 0 : v;
						valueArray.push(v);
					});
					//求出日最大值  最小值   平均值
					if (valueArray.length > 0) {
						var max = valueArray[0];
						var min = valueArray[0];
						var avg, sum = 0;
						var len = valueArray.length;
						for (var i = 0; i < len; i++) {
							let value = valueArray[i];
							//判断是否为数字 非数字参与运算时赋值0  显示时处理为“-”
							min = (value > min) ? min : value;
							max = (value < max) ? max : value;
							sum += value;
						}
						min = (min) ? min : "-";
						max = (max) ? max : "-"
						avg = (sum) ? (sum / len ).toFixed(2) : "-";
						enData.push({
							"monitorDate": day,
							"monitorValue": min,
							"polType": polType,
							"dataType": "min",
							"dataTypeLabel": "最小值"
						}, {
							"monitorDate": day,
							"monitorValue": avg,
							"polType": polType,
							"dataType": "avg",
							"dataTypeLabel": "平均值"
						}, {
							"monitorDate": day,
							"monitorValue": max,
							"polType": polType,
							"dataType": "max",
							"dataTypeLabel": "最大值"
						});
					}
				}
			);
			return enData;
		},


		/**
		 *  原始数据根据获取的数据类型结果集过滤
		 * @param dataArray
		 * @param dataType
		 * @param attr
		 * @param polType
		 * @return {Array}
		 */
		getDataByDataTypeAndPolType(dataArray, attr, polType, dataType)
		{
			dataType = dataType.split(",")[0];
			var newArray = [];
			for (var x in dataArray) {
				if (dataArray[x][attr] == dataType && dataArray[x]["polType"] == polType) {
					newArray.push(dataArray[x]);
				}
			}
			return newArray;
		}
		,


		/**
		 *根据图例生成多个series
		 * @returns {Array}
		 * @param legend
		 * @param data
		 * @param chartType
		 * @param polType
		 */
		createSeriesByLegend(legend, data, polType, chartType){
			var series = [];
			for (var x = 0; x < legend.length; x++) {
				var newArray = [];
				if (legend[x]) {
					let dataArray = this.getDataByDataTypeAndPolType(data, "dataTypeLabel", polType, legend[x]);
					for (var i in dataArray) {
						newArray[i] = dataArray[i]["monitorValue"];
					}
					series[x] = ({
						symbol: 'none',  //这句就是去掉点的
						smooth: true,  //这句就是让曲线变平滑的
						name: legend[x],
						type: chartType,
						data: newArray
					});
				}
			}
			return series;
		},


		/**
		 *绘制统计图表
		 */
		drawChart(){
			let legends = ["最小值", "平均值", "最大值"];
			var series = this.createSeriesByLegend(legends, this.chartData, this.polType, "line");
			let xData = this.getXaxisData();
			this.charts = echarts.init(document.getElementById("chart"));
			let options = {
				tooltip: {
					trigger: 'axis'
				},
				legend: {
					data: legends,
					textStyle: {    //图例文字的样式
						color: '#5DE3E1',
						fontSize: 12
					}
				},
				color: ["#EBAC65", "#0e3FB5", "#5DE3E4"],
				calculable: true,
				xAxis: [
					{
						type: 'category',
						boundaryGap: false,
						data: xData,
						axisLine: {
							color: "white"
						},
						axisLabel: {
							color: "white"
						},
						splitLine: {
							show: false
						}
						//去除网格线
					}
				],
				yAxis: [
					{
						type: 'value',
						axisLabel: {
							formatter: '{value} ug/m³',
							color: "white"
						},
						axisLine: {
							color: "white"
						},
						splitLine: {
							show: false
						}
					}
				],
				series: series
			};
			this.charts.setOption(options);

		},


		/**
		 * 封装生成时段统计的图表所需数据格式
		 * @param dateStrArray
		 * @return {*|Array}
		 */
		getDateRangeChartData(dateStrArray) {
			let targets = "aqi,pm10_1h,pm25_1h,so2_1h,no2_1h,co_1h,o3_1h";
			let polOption = {
				codeType: "stationcode",
				code: "",
				target: targets,
				startTimeStr: dateStrArray[0],
				endTimeStr: dateStrArray[1],
				dateType: 'hour'
			};
			let polCityAPI = '$$getCityTargetValueByMonitorDate';
			let polStaAPI = '$$getStationTargetValueByMonitorDate';
			let polAPI = '';
			if (this.currSelectObj.type === 'city') {
				polOption.codeType = 'citycode';
				polAPI = polCityAPI;
			}
			else if (this.currSelectObj.type === 'station') {
				polOption.codeType = 'stationcode';
				polAPI = polStaAPI;

			}
			polOption.code = this.currSelectObj.code;
			let polDef = this[polAPI]({data: polOption, fn: null});
			let allDef = [polDef];
			this.$$promiseAll.call(this, allDef, responseArray => {
				this.initTable(responseArray[0]["data"]);
				this.initChart1(responseArray[0]["data"]);
			});
		},


		/**
		 * 选择当前显示的污染物
		 */
		getPolType() {
			this.polTypes = [{
				"label": "AQI",
				"value": "aqi"
			},
				{
					"label": "PM10",
					"value": "pm10"
				},
				{
					"label": "PM25",
					"value": "pm25"
				},
				{
					"label": "SO2",
					"value": "so2"
				},
				{
					"label": "NO2",
					"value": "no2"
				},
				{
					"label": "CO",
					"value": "co"
				},
				{
					"label": "O3",
					"value": "o3"
				}];
			let polTypes = this.polTypes;
			this.polType = polTypes[0]["value"];
			this.initChart();
			this.initTable();
		},


		/**
		 * 初始化统计图
		 */
		initChart(){
			let dateStrArray = this.getDateStrArray();
			this.ajaxData = this.getDateRangeChartData(dateStrArray);
			this.chartData = this.assembleChartValue(this.ajaxData);
			this.drawChart();
		},

		/**
		 * 初始化统计图
		 */
		initChart1(ajaxData){
			this.chartData = this.assembleChartValue(ajaxData);
			this.drawChart();

		},
		/**
		 *初始化表格
		 */
		initTable(ajaxData){
			this.tableData = this.assembleTableData(ajaxData);
		},


		/**
		 * 深度copy对象
		 * @param data copy的源对象
		 * @private
		 */
		_deepCopy(data)
		{
			return JSON.parse(JSON.stringify(data));
		}
		,


		/**
		 * 点击目录树节点事件
		 * @param data
		 */
		handleNodeClick(data) {
			this.currSelectObj = this._deepCopy(data);
			this.initChart();
			this.initTable();
		},


		renderNodeContent(h, {node, data, store}) {
			return tplFunction(h, {node, data, store});
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
			return {stDateStr, edDateStr}
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
	}
	,
	computed: {
		titleContent: function () {
			let dateStr = this.getDateStrArray();
			let currName = this.currSelectObj.label;
			let beginStr = dateStr[0].substr(0, 10);
			let endStr = dateStr[1].substr(0, 10);
			return currName + beginStr + '至' + endStr;
		}
		,
		tableTitle: function () {
			return this.titleContent + '时间段对比数据表';
		}
		,
		chartTitle: function () {
			return this.titleContent + '时间段对比统计图';
		}
	}
	,


	activated: function () {
		if (this.isConfigLoaded) {
			this.initChart();
			this.initTable();
		}
		this.onResize();
	},

	deactivated: function () {
	}

}


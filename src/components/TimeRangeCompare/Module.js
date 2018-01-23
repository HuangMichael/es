/**
 * huangbin
 * 2018-1-22
 * 时段对比
 */

//布局
import rightPanel from 'layout/right-panel/RightPanel.vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import titlePanel from '3clear/comm/TitlePanel/TitlePanel.vue';

//工具类
import {dateUtils} from 'utils/dateUtils.js';
import {utils} from 'utils/utils.js'
import {calendar} from 'utils/calendar.js'

//jsx
import {tplFunction} from '3clear/jsx/treeStationMarker.js'

import 'libs/Scrollbar/jquery.mCustomScrollbar.css';
import {scrollbar} from 'libs/Scrollbar/jquery.mCustomScrollbar.js'
import {mousewheel} from 'libs/Scrollbar/jquery.mousewheel.min.js'


import echarts from 'echarts';

export default {
	components: {
		'right-panel': rightPanel,
		'setting-dialog': settingDialog,
		'title-panel': titlePanel

	},
	data() {
		return {
			//模块基础数据信息
			name: 'TimeRangeCompare',
			toggleStatus: 'open',
			rightPanelWidth: this.$$appConfig.layout.rightPanel.width,
			toggle: this.$$appConfig.layout.rightPanel.toggle,
			isConfigLoaded: false,
			config: {},


			//业务数据信息
			model: '',//默认模式
			models: [],//可选模式
			pollution: "", ////污染物的选择
			pollutionTitle: "",
			pollutants: "",
			polTargets: "",
			polRObj: {},

			area: '',//默认区域
			areas: [],//可选区域
			pDate: '',//产品日期
			pDateOptions: {
				disabledDate(time) {
					return time.getTime() > Date.now();
				}
			},
			selectedPol: "aqi",
			switchTime: '',//模式时效切换临界时间
			timeOptions: [],
			time: '20:00:00',//时次
			currIntervalNum: 7,
			currSelectObj: {},//当前树种选中的节点对象
			responseData: [],
			tableColumns: [],
			tableData: [],
			tableMaxHt: 500,
			currTableData: [],
			wrfData: [],
			tmpWrfData: [],
			treeData: [],
			expandKeys: [],
			chartData: [],
			defaultProps: {
				children: 'children',
				label: 'label'
			},


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
			},
			timeRange: '',
			charts: '',
		};


	},

	created() {
		this.rightPanelWidth = this.toggleStatus === "close" ? 0 : this.$$appConfig.layout.rightPanel.width;
		this.$$resize(this.onResize);
		this.$$getConfig(this.onGetConfig);
	},


	mounted() {
		this.$nextTick(() => {
			this.$$lib_$("#timeRangeCompareTable .el-table__body-wrapper.is-scroll-left").mCustomScrollbar();
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
		 * 选择时间后触发时间查询数据
		 */
		onChangeTimeRange(){
			/*根据开始时间和结束时间以及时间类型处理日期用于[echarts,数据获取]*/
			let dateDuring = [];
			let start = this.timeRange[0]; ////开始时间
			let end = this.timeRange[1]; ////结束时间
			start.setHours(0);
			start.setMinutes(0);
			start.setSeconds(0);
			if (this.dateType === "hour") {
				let todayStr = dateUtils.dateToStr('yyyy-MM-dd HH:mm:ss', new Date());
				let startStr = dateUtils.dateToStr('yyyy-MM-dd HH:mm:ss', end);
				if (startStr === todayStr) {
					////如果是今天则显示00点-当前时间
					end = new Date();
					end.setMinutes(0);
					end.setSeconds(0);
				} else {
					/////不是今天，则显示00点-23点
					end.setHours(23);
					end.setMinutes(0);
					end.setSeconds(0);
				}

			} else if (this.dateType === "day") {
				end.setHours(0);
				end.setMinutes(0);
				end.setSeconds(0);
			}
			dateDuring[0] = dateUtils.dateToStr("yyyy-MM-dd", start) + " 00:00:00";
			dateDuring[1] = dateUtils.dateToStr("yyyy-MM-dd", end) + " 00:00:00";
			this.timeRange = dateDuring;
			this.getXaxisData();
			let selectedPol = this.selectedPol;
			this.getTimeRangeCompareData();
			this.initTimeRangeCompareChart(selectedPol);
			this.getAllDailyValue();
			return dateDuring;

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
			// this.switchTime = this._getConfigPro('modelSwitchTime', 'default');
			this.tableColumns = this.config.tableColumns;
			//获取空气质量指标
			this.pollutants = this.config.pollutants;
			//初始化请求数据


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

			this.getAllDailyValue();

		},


		/**
		 * 无效值处理
		 * 如果为-999 0 或者 "" 显示"-"
		 */
		dealingUneffectiveValue(value){
			return (value == -999) || (value == '') ? "-" : value;
		},
		/**
		 * 点击目录树节点事件
		 * @param data
		 */
		handleNodeClick(data) {
			this.currSelectObj = data;
			let selectedPol = this.selectedPol;
			this.getTimeRangeCompareData();
			this.initTimeRangeCompareChart(selectedPol);
			this.getAllDailyValue();
		},


		/**
		 *
		 * @param h
		 * @param node
		 * @param data
		 * @param store
		 * @returns {*}
		 */
		renderNodeContent(h, {node, data, store}) {
			return tplFunction(h, {node, data, store});
		},

		/**
		 * 初始化时间段
		 */
		initTimeRange(){
			if (!this.timeRange[0] || !this.timeRange[1]) {
				let endDate = new Date();
				let startDate = dateUtils.dateAdd("d", -7, new Date());
				let startDateStr = dateUtils.dateToStr("yyyy-MM-dd", startDate) + " 00:00:00";
				let endDateStr = dateUtils.dateToStr("yyyy-MM-dd", endDate) + " 00:00:00";
				this.timeRange = [startDateStr, endDateStr]
			}
		},
		/**
		 * 切换污染物时触发
		 */
		onChangePollutant(){
			let selectedPol = this.selectedPol;
			this.initTimeRange();
			this.getTimeRangeCompareData();
			this.initTimeRangeCompareChart(selectedPol);
			this.getAllDailyValue();
		},

		/**
		 * 查询选中节点城市 站点时间段内的空气质量预报数据的数据
		 *
		 */
		getTimeRangeCompareData() {
			let endDate = new Date();
			let beginDate = dateUtils.dateAdd("d", -7, new Date());
			let beginDateStr = (this.timeRange[0]) ? this.timeRange[0] : dateUtils.dateToStr("yyyy-MM-dd", beginDate) + " 00:00:00";
			let endDateStr = (this.timeRange[1]) ? this.timeRange[1] : dateUtils.dateToStr("yyyy-MM-dd", endDate) + " 00:00:00";
			let polOption = {
				codeType: "stationcode",
				code: "",
				target: this.config["targets"],
				startTimeStr: beginDateStr,
				endTimeStr: endDateStr,
				dateType: 'hour'
			};
			let polCityAPI = '$$getCityTargetValueByMonitorDate';
			let polStaAPI = '$$getStationTargetValueByMonitorDate';
			let polAPI = '';
			if (this.currSelectObj.type === 'city') {
				polOption.codeType = 'citycode';
				polAPI = polCityAPI;
			}
			else {
				polOption.codeType = 'stationcode';
				polAPI = polStaAPI;

			}
			polOption.code = this.currSelectObj.code;
			let polDef = this[polAPI]({data: polOption, fn: null});
			let allDef = [polDef];

			this.$$promiseAll.call(this, allDef, (res) => {
				this.currTableData = res[0]["data"];
			}, (err) => {
				this.currTableData = [];
			});

			return this.currTableData;
		},


		/**
		 *根据图例生成多个series
		 * @returns {null}
		 * @param legend
		 * @param data
		 * @param chartType
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
		 *获取x轴的数据
		 * @returns {Array}
		 * @param data
		 * @param attr
		 * @param legend
		 */
		getXaxisData(){
			var xData = [];
			var startDateStr = this.timeRange[0];
			var endDateStr = this.timeRange[1];
			let startDate = dateUtils.strToDate(startDateStr);
			let endDate = dateUtils.strToDate(endDateStr);
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
		 * 初始化统计图表
		 */
		initTimeRangeCompareChart(selectedPol){
			if (!selectedPol) {
				selectedPol = "pm25";
			}
			this.getDailyChartValue();
			// this.getAllDailyValue();
			let legends = this.getCategoriesFromChartData();
			var series = this.createSeriesByLegend(legends, this.responseData, selectedPol, "line");
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
		 * 按照日期对数据进行分组
		 * @returns {Array}
		 */
		mapDailyDataByDay(){
			let ajaxData = this.origind;
			let dateArray = [];
			//首先对数据中的日期进行汇总
			let days = this.getXaxisData();
			days.forEach(function (day) {
				let filterArray = ajaxData.filter(function (item) {
					return (item["datadate"].toString().substring(0, 10) == day);
				});
				dateArray.push({"datadate": day, "dataList": filterArray});
			});
			return dateArray;
		},
		/**
		 * 根据污染源名称 查询每日最大 最小 平均值
		 * @param polType
		 */
		getAllDailyValue(){
			let pols = ["aqi", "pm10", "pm25", "so2", "no2", "co", "o3"];
			let dailyData = this.mapDailyDataByDay();
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

						console.log(colName + "-----------" + i[colName]);
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
			this.tableData = polDataArray;
		},
		/**
		 * 获取每日图表数据
		 */

		getDailyChartValue(){
			let dailyData = this.mapDailyDataByDay();
			let polType = this.selectedPol;
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
			this.responseData = enData;
		},
		/**
		 * 获取当前选择起始和结束时间
		 * @param dtFormat 指定返回的格式
		 * @returns {{stDateStr: (*|string), edDateStr: (*|string)}}
		 * @private
		 */
		getStartDateAndEndDate(dtFormat)
		{
			let stDate = dateUtils.dateAdd('d', -7, new Date());
			let edDate = dateUtils.dateAdd('d', 0, new Date());
			let stDateStr = dateUtils.dateToStr(dtFormat, stDate);
			let edDateStr = dateUtils.dateToStr(dtFormat, edDate);

			var dateStr = {stDateStr, edDateStr};
			return dateStr
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


		getCityImage(code){
			////返回不同城市的图片Url
			if (!code) return null;
			let baseUrl = this.config['cityImageUrl'];
			let Url = baseUrl + code + ".png";

			console.log("url------------" + Url);
			return Url;
		},


		/**
		 *根据图表数据获取分类
		 * @return {*}
		 */
		getCategoriesFromChartData()
		{

			return ["最小值", "平均值", "最大值"];
		},

		/**
		 * 根据IAQI或AQI渲染单元格样式
		 * @param value IAQI AQI 值
		 * @returns {*}
		 */
		styleObject(value)
		{
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
		}
		,

		/**
		 * 视图大小更改事件
		 */
		onResize()
		{
			let win_size_ht = this.$$lib_$(window).height();
			this.tableMaxHt = win_size_ht - 457 - 25;

		}
		,

		/**
		 * 右边面板状态更改事件
		 * @param status 当前状态 open|close
		 */
		onTogglePanel(status)
		{
			this.toggleStatus = status;
			this.rightPanelWidth = status === 'close' ? 0 : this.$$appConfig.layout.rightPanel.width;
		}
	}
	,

	computed: {
		titleContent: function () {
			let dtFormat = 'MM月dd日';
			let dtExt = this.getStartDateAndEndDate(dtFormat);
			let currName = this.currSelectObj.label;
			return currName + dtExt.stDateStr + '至' + dtExt.edDateStr;
		}
		,

		chartTitle: function () {
			return this.titleContent + '时间段对比统计图';
		}
		,
		tableTitle: function () {
			return this.titleContent + '时间段对比统计表';
		}
	},
	activated: function () {
		// if (this.isConfigLoaded) {
		// 	let selectedPol = "pm25";
		// 	this.initTimeRange();
		// 	this.getTimeRangeCompareData();
		// 	this.initTimeRangeCompareChart(selectedPol);
		// 	this.getAllDailyValue();
		// }

		let selectedPol = "pm25";
		this.initTimeRange();
		this.getTimeRangeCompareData();
		this.initTimeRangeCompareChart(selectedPol);
		this.getAllDailyValue();


		// console
		this.onResize();
	}
	,

	deactivated: function () {
	}

}


/**
 * Created by huangbin
 * date: 2018-1-24
 * desc: 时段对比
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
			name: 'AirMonitorHour',
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
			pickerOptions: {
				disabledDate(time) {
					return time.getTime() > Date.now();
				},
				shortcuts: [{
					text: '今天',
					onClick(picker) {
						picker.$emit('pick', new Date());
					}
				}, {
					text: '昨天',
					onClick(picker) {
						const date = new Date();
						date.setTime(date.getTime() - 3600 * 1000 * 24);
						picker.$emit('pick', date);
					}
				}, {
					text: '一周前',
					onClick(picker) {
						const date = new Date();
						date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
						picker.$emit('pick', date);
					}
				}]
			},
			timeRange: [dateUtils.dateAdd("d", -1, new Date()), new Date()],
			chooseDate: new Date()
		}
	},

	/**
	 *创建之后执行
	 */
	created() {
		this.rightPanelWidth = this.toggleStatus === "close" ? 0 : this.$$appConfig.layout.rightPanel.width;
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

			//选中当前的污染物;
			this.getPolType();
			this.initChart();
			this.initTable();
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
			for (let obj of ajaxData) {
				console.log("obj---------" + JSON.stringify(obj));
			}
			let dateArray = [];
			//首先对数据中的日期进行汇总
			let days = this.getXaxisData();
			for (let day of days) {
				let filterArray = ajaxData.filter(function (item) {
					let dateStr = dateUtils.dateToStr("yyyy-MM-dd HH:mm:ss", item["datadate"]);
					return (dateStr === day);
				});
				let dateObj = {"datadate": day, "dataList": filterArray};
				dateArray.push(dateObj);
			}
			return dateArray;
		},


		/**
		 * 选择时间后触发时间查询数据
		 */
		onChangeDate(){
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
			if (!this.chooseDate) {
				this.chooseDate = new Date();
			}
			let beginDateStr = dateUtils.dateToStr("yyyy-MM-dd", this.chooseDate);
			dateStrArray[0] = beginDateStr + " 00:00:00";
			dateStrArray[1] = beginDateStr + " 23:59:59";
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
			var diff = dateUtils.dateDiff("h", startDate, endDate);
			for (var x = 0; x < diff; x++) {
				let day = dateUtils.dateToStr("yyyy-MM-dd HH:mm:ss", dateUtils.dateAdd("h", x, startDate));
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
		assembleTableData(ajaxData){
			this.tableData = this.mapDailyDataByDay(ajaxData);
		},


		/**
		 * 封装成图表需要的数据
		 * @param ajaxData 原始数组
		 * @return {Array} 返回封装数组
		 */
		assembleChartValue(ajaxData){
			let yData = [];
			for (let x of ajaxData) {
				let key = (this.polType === 'aqi') ? this.polType : this.polType + "_1h";
				(x[key]) ? yData.push(x[key]) : yData.push("-");
			}
			return yData;
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
					for (let data of dataArray) {
						newArray.push(data["monitorValue"]);
					}
					series[x] = ({
						symbol: 'none',  //这句就是去掉点的
						smooth: true,  //这句就是让曲线变平滑的
						itemStyle: {normal: {areaStyle: {type: 'default'}}},
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
		drawChart(chartData){
			let xData = this.getXaxisData();
			let newXData = [];
			for (let x of xData) {
				newXData.push(x.substring(11, 13));
			}
			this.charts = echarts.init(document.getElementById("chart"));
			let option = {

				color: ["#EBAC65", "#0e3FB5", "#5DE3E4"],
				tooltip: {
					trigger: 'axis'
				},

				legend: {
					data: [this.polType],
					textStyle: {    //图例文字的样式
						color: '#5DE3E1',
						fontSize: 12
					}
				},
				toolbox: {
					show: false,
					feature: {
						mark: {show: true},
						dataView: {show: true, readOnly: false},
						magicType: {show: true, type: ['line']},
						restore: {show: true},
						saveAsImage: {show: true}
					}
				},
				calculable: true,
				xAxis: [
					{
						type: 'category',
						data: newXData,
						axisLine: {
							lineStyle: {
								color: 'white',
								width: 1,//这里是为了突出显示加上的
							}
						},

						axisLabel: {
							color: "white"
						},
						splitLine: {
							show: false
						}
					}
				],
				yAxis: [
					{
						type: 'value',
						axisLine: {
							lineStyle: {
								color: 'white',
								width: 1,//这里是为了突出显示加上的
							}
						},
						axisLabel: {
							formatter: '{value} ug/m³',
							color: "white"
						},
						splitLine: {
							show: false
						}
					}
				],
				series: [
					{
						symbol: 'none',  //这句就是去掉点的
						smooth: true,  //这句就是让曲线变平滑的
						name: this.polType,
						type: 'line',
						data: chartData,
						markPoint: {
							data: [
								{type: 'max', name: '最大值'},
								{type: 'min', name: '最小值'}
							]
						},
						markLine: {
							data: [
								{type: 'average', name: '平均值'}
							]
						}
					}
				]
			};
			this.charts.setOption(option);
		},


		renderNodeContent(h, {node, data, store}) {
			return tplFunction(h, {node, data, store});
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

				// console.log(JSON.stringify(responseArray[0]["data"]));

				// this.tableData = responseArray[0]["data"];
				this.initTable(responseArray[0]["data"]);
				this.reloadChartData(responseArray[0]["data"]);
			});
		},


		/**
		 * 选择当前显示的污染物
		 */
		getPolType() {
			let pols = ["aqi", "pm10", "so2", "no2", "co", "o3"];
			for (let p of pols) {
				let obj = {
					"label": p.toUpperCase(),
					"value": p
				}
				this.polTypes.push(obj);
			}
			this.polType = pols[0];
		},


		/**
		 * 初始化统计图
		 */
		initChart(){
			let dateStrArray = this.getDateStrArray();
			this.ajaxData = this.getDateRangeChartData(dateStrArray);
			this.chartData = this.assembleChartValue(this.ajaxData);
			this.drawChart(this.chartData);
		},

		/**
		 * 初始化统计图
		 */
		reloadChartData(ajaxData){
			this.chartData = this.assembleChartValue(ajaxData);
			this.drawChart(this.chartData);
		},
		/**
		 *初始化表格
		 */
		initTable(ajaxData){
			let dataArray = [];
			ajaxData.forEach(function (item) {
				item["datadate"] = item["datadate"].replace("T", " ");
				dataArray.push(item);
			});
			this.tableData = dataArray;
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
		/**
		 * 深度copy对象
		 * @param data copy的源对象
		 * @private
		 */
		_deepCopy(data) {
			return JSON.parse(JSON.stringify(data));
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
			return currName + beginStr;
		}
		,
		tableTitle: function () {
			return this.titleContent + '空气质量检测数据表';
		}
		,
		chartTitle: function () {
			return this.titleContent + '空气质量检测统计图';
		}
	}
	,


	activated: function () {
		if (this.isConfigLoaded) {

		}
		this.onResize();
	},

	deactivated: function () {
	}

}

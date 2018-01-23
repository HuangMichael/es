/**
 * Created by zzw
 * date: 2017/10/30
 * desc: 功能开发
 */

import rightPanel from 'layout/right-panel/RightPanel.vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import titlePanel from '3clear/comm/TitlePanel/TitlePanel.vue';
import {tplFunction} from '3clear/jsx/treeStationMarker.js';
import {dateUtils} from '@/utils/dateUtils';
import _ from 'lodash';
import $ from 'jquery';
import echarts from 'echarts';
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
			name: 'CityForecast',
			toggleStatus: 'open',
			rightPanelWidth: this.$$appConfig.layout.rightPanel.width,
			toggle: this.$$appConfig.layout.rightPanel.toggle,
			isConfigLoaded: false,
			config: {},
			//业务数据
			contentTitle: '',
			pol: '',
			pols: [],
			area: '',
			areas: [],
			time: '08',
			pDate: '',
			treeData: [],
			model: '',
			models: [],
			dataTypes: [],
			dataType: "",
			selectTreeObj: {},
			breadcrumbArr: [],
			firstchartId: {},
			othChartId: [],
			chartObj: {},
			chartId: [], //chart实例
			chartArr: [], //所选择的chart类型
			targetClassById: [], //与promise请求回来的数据一一对应
			allChartObjArr: [],
			reqData: [], //请求回来的数据
			axisData: [],
			tTimeArr: [],
			defaultExpanded: [],
			timeOptions: this.$$appConfig.prjInfo.modelInfo.predictTime,
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
			this.area = config.settings.areaRObj.default;
			this.areas = config.settings.areaRObj.options;
			this.treeData = config.settings.cityStaTreeObj.default;
			this.dataTypes = config.settings.dataTypeObj.options;
			this.dataType = config.settings.dataTypeObj.default;
			this.pDate = new Date(new Date().getTime());
			this.setTimeSelect();
			this.chartObj = config.chartOption;

			this.model = config.settings[this.time + 'ModelObj'].default;
			this.models = config.settings[this.time + 'ModelObj'].options;
			this.breadcrumbArr = [];
			this.$nextTick(() => {
				let checked = this.config.settings.cityStaTreeObj.checked;
				let x = {},
					defaultExpandArr = [];
				
				for (let c = 0; c < checked.length; c++) {

					if (c === 0) {
						x = this.$refs.tree.children[checked[0]];
					} else {
						x = x.children[checked[c]];
					}
					let obj = {
						label: x.label,
						value: x.code
					};
					this.breadcrumbArr.push(obj);
					defaultExpandArr.push(x.code);
					if (c === checked.length - 1) {

						defaultExpandArr.splice(checked.length - 1, 1)
					}

				}

				this.selectTreeObj = x;
				
				this.defaultExpanded = [x.code];
				setTimeout(() => {
					this.$refs.tree.setCurrentNode(this.selectTreeObj);
				}, 0);
				this.contentTitle = this.selectTreeObj.label;
				this.getNowTarget();
			});
		},

		/**
		 * 视图大小更改事件
		 */
		onResize() {
			console.log('page resize,handle the event at here');
			this.$nextTick(() => {
				for (let i = 0; i < this.chartId.length; i++) {
					this.chartId[i].resize();
				}

				$("#manyChart").mCustomScrollbar();
				
//				$("#manyChart").scrollbar.init()
//				debugger
//				.mCustomScrollbar();
				
				
			})
		},
		setTimeSelect() {
			let nowHour = new Date().getHours();
			let hourLimit = parseInt(this.config.settings.modelSwitchTime.default.split(":")[0]);
			if (nowHour > hourLimit && dateUtils.dateToStr("YYYY-MM-DD", new Date()) === dateUtils.dateToStr("YYYY-MM-DD", this.pDate)) {
				this.time = "08";
				this.pDate = new Date(new Date().getTime());
				let options = _.cloneDeep(this.timeOptions);
				for (let x = 0; x < options.length; x++) {
					if (options[x].value !== this.time) {
						options.splice(x, 1);
					}
				}
				this.timeOptions = options;
			} else {
				this.time = "20";
				this.pDate = new Date(this.pDate.getTime() - 1000 * 3600 * 24);
				this.timeOptions = this.$$appConfig.prjInfo.modelInfo.predictTime;
			}
		},
		changePreDate() {
			this.setTimeSelect();
			this.getNowTarget();
		},
		renderNodeContent(h, {
			node,
			data,
			store
		}) {

			return tplFunction(h, {
				node,
				data,
				store
			});
		},
		handleNodeClick(item, nodes) {

			if (this.selectTreeObj.code && item.code !== this.selectTreeObj.code) {
				this.selectTreeObj = item;
				this.contentTitle = item.label;

				if (_.isArray(nodes.parent['data']) === true) {
					this.breadcrumbArr = [{
						label: item.label,
						value: item.code
					}];
				} else {
					this.breadcrumbArr = [{
						label: nodes.parent.label,
						value: nodes.parent.code
					}, {
						label: item.label,
						value: item.code
					}];
				}
				this.getNowTarget();
			}

		},
		/**
		 * 右边面板状态更改事件
		 * @param status 当前状态 open|close
		 */

		onTogglePanel(status) {
			this.toggleStatus = status;
			this.rightPanelWidth = status === 'close' ? 0 : this.$$appConfig.layout.rightPanel.width;

		},
		timeChange() {
			let isHas;
			for (let i = 0; i < this.config.settings[this.time + 'ModelObj'].options.length; i++) {
				if (this.model === this.config.settings[this.time + 'ModelObj'].options[i].value) {
					isHas = true;
					break;
				} else {
					isHas = false;
				}
			}
			if (isHas === false) {
				this.model = this.config.settings[this.time + 'ModelObj'].default;
			}
			this.models = this.config.settings[this.time + 'ModelObj'].options;
			this.getNowTarget();
		},
		getNowTarget() {

			let chartDiv = document.getElementsByClassName('chartStyle');
			for (let h = 0; h < chartDiv.length; h++) {
				echarts.dispose(chartDiv[h]);
			}
			let target = this.pol;
			let dataType = this.dataType;
			let model = this.model;
			let selOptions = this.config.settings[target + "Obj"].default;
			let chart = {};
			for (let i = 0; i < selOptions.length; i++) {
				for (let x in this.config.states) {
					if ( x === selOptions[i]) {
						chart[x] = this.config.states[x][dataType];
						if (x === "A") {
							if (target === "aqi") {
								_.set(chart[x], "showLabel", [this.formatTartget(target) + "预报", this.formatTartget(target) + "实测"]);
								_.set(chart[x], "target", [this.formatTargetByDataType(target, dataType), this.formatTargetByDataType(target, dataType)]);
								_.set(chart[x], "yAxisLabel[0].name", this.formatTartget(target));
							} else {
								_.set(chart[x], "showLabel", [this.formatTartget(target) + " ( IAQI ) 预报", this.formatTartget(target) + " ( IAQI ) 实测"]);
								_.set(chart[x], "target", [this.formatTargetByDataType(target, dataType), this.formatTargetByDataType(target, dataType)]);
								_.set(chart[x], "yAxisLabel[0].name", this.formatTartget(target) + " ( IAQI ) ");
							}
						}
						break
					}
				}
			}

			let chartArr = [];
			for (let x in chart) {
				let chartObj = _.cloneDeep(this.chartObj);
				let obj = {
					id: "echart_" + x,
					chart: chartObj
				};

				chartArr.push(obj);
			}
			this.firstchartId = chartArr[0];
			if (chartArr[0].chart) {
				_.set(chartArr[0].chart, "dataZoom.show", true);
				_.set(chartArr[0].chart, "grid.bottom", "65px");
				_.set(chartArr[0].chart, "toolbox.feature.saveAsImage.show", true);
			}
			this.othChartId = chartArr.slice(1);
			this.allChartObjArr = chartArr;
			this.$nextTick(() => {
				this.chartId = [];
				if (chartArr[1]) {
					$("#manyChart").mCustomScrollbar("scrollTo","first");
				}
				for (let i = 0; i < chartArr.length; i++) {
					if (chartArr[i]) {
						let chartExample = echarts.init(document.getElementById(chartArr[i].id));
						this.chartId.push(chartExample);
					}


				}
				echarts.connect(this.chartId);
			});
			this.allRequest(chart);
			this.chartArr = chart;
		},

		allRequest(chart) {

			//创建预报，实测，气象，其他对应的指标
			let targetObj = {};
			for (let i in chart) {
				for (let x = 0; x < chart[i].type.length; x++) {
					if (targetObj[chart[i].type[x]]) {
						targetObj[chart[i].type[x]].push(chart[i].target[x]);
					} else {
						targetObj[chart[i].type[x]] = [];
						targetObj[chart[i].type[x]].push(chart[i].target[x]);
					}
					if (chart[i]["isWind"]) {
						targetObj['wea'].push(chart[i]["isWind"]);
					}

				}
			}

			let targetClassById = [];
			let n = 0;
			//创建类型所对应的数据
			for (let xx in targetObj) {
				targetObj[xx] = _.uniq(targetObj[xx]);
				if (targetObj[xx].length > 0) {
					let obj = {
						name: xx,
						id: n,
						value: targetObj[xx]
					};

					targetClassById.push(obj);
					n++;
				}
			}
			let model = this.model;
			let area = this.area;
			let appConfigModel = this.$$appConfig.prjInfo.modelInfo.model;
			let interval;
			//获取地区对应 模式的时效
			appConfigModel.forEach((value, index, array) => {
				if (value.value === model) {
					if (area === "d1") {
						interval = value.interval[0];
					} else if (area === "d2") {
						interval = value.interval[1];
					} else if (area === "d3") {
						interval = value.interval[2];
					}
				}
			});
			let pTime = this.pDate;
			let sTime = new Date(this.pDate.getFullYear(), this.pDate.getMonth(), this.pDate.getDate() + 1);
			let eTime = this.dataType === "hour" ? dateUtils.dateToStr("YYYY-MM-DD 23:00:00", new Date(sTime.getTime() + 1000 * 3600 * 24 * (interval - 1))) : dateUtils.dateToStr("YYYY-MM-DD 00:00:00", new Date(sTime.getTime() + 1000 * 3600 * 24 * (interval)));
			let pTimeStr = dateUtils.dateToStr("YYYY-MM-DD HH:00:00", new Date(this.pDate.getFullYear(), this.pDate.getMonth(), this.pDate.getDate(), Number(this.time)));
			let checkCode = this.selectTreeObj;
			let num, format, dateRange;
			if (this.dataType === "hour") {
				num = dateUtils.dateDiff("h", sTime, new Date(sTime.getTime() + 1000 * 3600 * 24 * (interval)));
				format = "MM月DD日HH时";
				dateRange = 1000 * 3600;
			} else {
				num = dateUtils.dateDiff("d", sTime, new Date(sTime.getTime() + 1000 * 3600 * 24 * (interval)));
				format = "MM月DD日";
				dateRange = 1000 * 3600 * 24;
			}
			let axisData = [];
			let tTimeArr = [];
			for (let w = 0; w < num; w++) {
				let axisStr;

				let tStr = dateUtils.dateToStr("YYYY-MM-DDTHH:00:00", new Date(sTime.getTime() + dateRange * w));
				if (parseInt(dateUtils.dateToStr("HH", new Date(sTime.getTime() + dateRange * w))) === 0 && this.dataType === "hour") {
					axisStr = {
						value: dateUtils.dateToStr("DD日", new Date(sTime.getTime() + dateRange * w)),
						textStyle: {
							color: "#04e7e1"
						}
					};
				} else if (dateUtils.dateToStr("YYYY-MM-DDTHH:00:00", new Date(sTime.getTime() + dateRange * w)) === dateUtils.dateToStr("YYYY-MM-DDTHH:00:00", new Date())) {
					axisStr = {
						value: dateUtils.dateToStr(format, new Date(sTime.getTime() + dateRange * w)),
						textStyle: {
							color: "#04e7e1"
						}
					};
				} else {
					axisStr = {
						value: dateUtils.dateToStr(format, new Date(sTime.getTime() + dateRange * w)),
						textStyle: {
							color: "#fff"
						}
					};
					
				}
				axisData.push(axisStr);
				tTimeArr.push(tStr);
			}
			this.axisData = axisData; //chart的横坐标时间轴
			this.tTimeArr = tTimeArr; //与chart的横坐标对应的T时间字符串
			let preOption = {
				modelName: this.model,
				zoneName: this.area,
				startTimeStr: dateUtils.dateToStr("YYYY-MM-DD 00:00:00", sTime),
				endTimeStr: eTime,
				predictionTimeStr: pTimeStr,
				dateType: this.dataType
			};

			let weaOption = {
				modelName: this.config.weaModel,
				zoneName: this.area,
				startTimeStr: dateUtils.dateToStr("YYYY-MM-DD 00:00:00", sTime),
				endTimeStr: eTime,
				predictionTimeStr: pTimeStr,
				dateType: this.dataType
			};
			let monOption = {
				startTimeStr: dateUtils.dateToStr("YYYY-MM-DD 00:00:00", sTime),
				endTimeStr: eTime,
				dateType: this.dataType,
				modelName: this.model,
				zoneName: this.area,
			};
			let othOption = {
				modelName: this.model + "apd",
				zoneName: this.area,

				startTimeStr: dateUtils.dateToStr("YYYY-MM-DD 00:00:00", sTime),
				endTimeStr: eTime,
				predictionTimeStr: pTimeStr,
				dateType: this.dataType
			};
			for (let x1 = 0; x1 < targetClassById.length; x1++) {
				targetClassById[x1]['option'] = {
					target: []
				};
				if (targetClassById[x1].name === 'mon') {
					targetClassById[x1]['option'] = monOption;
				} else if (targetClassById[x1].name === 'oth') {
					targetClassById[x1]['option'] = othOption;
				} else if (targetClassById[x1].name === 'pre') {
					targetClassById[x1]['option'] = preOption;
				} else if (targetClassById[x1].name === 'wea') {
					targetClassById[x1]['option'] = weaOption;
				}
				targetClassById[x1]['option']['target'] = _.join(targetClassById[x1].value, ",");
				if (checkCode.type === "city") {
					targetClassById[x1]['option']['code'] = checkCode.code;
					targetClassById[x1]['option']['codeType'] = "citycode";
					targetClassById[x1]['type'] = "city";
				} else {
					targetClassById[x1]['option']['codeType'] = "stationcode";
					targetClassById[x1]['option']['code'] = checkCode.code;
					targetClassById[x1]['type'] = "station";
				}
			}

			this.getData(targetClassById);
			this.targetClassById = targetClassById;
		},
		getData(data) {
			let allReq = [];
			for (let x = 0; x < data.length; x++) {
				let req;
				if (data[x]['type'] === 'city') {
					if (data[x]['name'] === "pre") {
						req = this.$$getCityPredictionInfoByProductTime({
							data: data[x]['option']
						});
					} else if (data[x]['name'] === "mon") {
						req = this.$$getCityTargetValueByMonitorDate({
							data: data[x]['option']
						});
					} else if (data[x]['name'] === "wea") {
						req = this.$$getCityWrfPredictionInfoByProductTime({
							data: data[x]['option']
						});
					} else if (data[x]['name'] === "oth") {
						req = this.$$getCityPredictionInfoByProductTime({
							data: data[x]['option']
						});
					}
				} else {
					if (data[x]['name'] === "pre") {
						req = this.$$getStationPredictionInfoByProductTime({
							data: data[x]['option']
						});
					} else if (data[x]['name'] === "mon") {
						req = this.$$getStationTargetValueByMonitorDate({
							data: data[x]['option']
						});
					} else if (data[x]['name'] === "wea") {
						req = this.$$getStationWrfPredictionInfoByProductTime({
							data: data[x]['option']
						});
					} else if (data[x]['name'] === "oth") {
						req = this.$$getStationPredictionInfoByProductTime({
							data: data[x]['option']
						});
					}
				}
				allReq.push(req);
			}
			this.$$promiseAll.call(this, allReq, responseArray => {
				this.reqData = responseArray;
				this.dealRequestData(responseArray);

			});
		},
		dealRequestData(res) {

			let charts = this.allChartObjArr;
			for (let x = 0; x < charts.length; x++) {
				let cname = charts[x].id.split("echart_")[1];
			
				
				for (let u in this.chartArr) {
					if (u === cname) {
						
						charts[x].chart.color=this.chartArr[u].lineColor;
						let series = [];
						if (this.chartArr[u]['selfCompute'] && this.chartArr[u]['selfCompute'] === true) {
							series = this.calcPrecent(this.chartArr[u]);
							charts[x].chart.yAxis[0]['max'] = 100;
						} else if (this.chartArr[u]['isWind']) {
							series = this.calcWind(this.chartArr[u]);
						} else {
							for (let t = 0; t < this.chartArr[u].showLabel.length; t++) {

								let seriesData = this.returnDataByTarget(this.chartArr[u].type[t], this.chartArr[u].target[t]);
								let obj = this.chartArr[u].itemStyle[t];
								obj['name'] = this.chartArr[u].showLabel[t];
								obj['data'] = seriesData;
								obj['yAxisIndex'] = this.chartArr[u].yAxisIndex[t];
								series.push(obj);
							}
						}

						charts[x].chart.legend.data = this.chartArr[u].showLabel;
						charts[x].chart.xAxis[0].data = this.axisData;
						if(charts[x].chart.xAxis[0].axisLabel.formatter===null&&this.dataType === "hour"){
							charts[x].chart.xAxis[0].axisLabel.formatter=(value,index)=>{
								let str;
								let tT=dateUtils.strToDate(this.tTimeArr[index].replace("T"," "));
								if(dateUtils.dateToStr("HH",tT)==="00"){
									str=dateUtils.dateToStr("DD日",tT);
								}else if(dateUtils.dateToStr("yyyyMMHHdd",tT)===dateUtils.dateToStr("yyyyMMHHdd",new Date())){
									str="now";
								}else{
									str=dateUtils.dateToStr("HH时",tT);
								}
								return str;
							}
						}
						charts[x].chart.series = series;
						if (u === "A") {
							charts[x].chart.yAxis[0]['axisLabel']['formatter'] = "{value}";
							charts[x].chart.yAxis[0]['name'] = this.chartArr[u].yAxisLabel[0]['name'];
							for (let y = 0; y < this.chartArr[u].showLabel.length; y++) {

								if (charts[x].chart.series[y]['name'].indexOf("实测") >= 0) {
									charts[x].chart.series[y]['itemStyle']['normal'].color = (params) => {
										return this.setAqiBarColor(params.value);
									};
								}
							}

						} else {
							for (let s = 0; s < this.chartArr[u].yAxisLabel.length; s++) {
								charts[x].chart.yAxis[s]['axisLabel']['formatter'] = this.chartArr[u].yAxisLabel[s]['label'];
								charts[x].chart.yAxis[s]['name'] = this.chartArr[u].yAxisLabel[s]['name'];

							}
						}

					}
				}
			}
			this.othChartId = charts.slice(1);
			this.firstchartId = charts[0];

			this.$nextTick(() => {
				for (let c = 0; c < this.chartId.length; c++) {
					this.chartId[c].setOption(charts[c].chart, true);

				}
			})
		},
		returnDataByTarget(type, target) {

			let id;
			for (let i = 0; i < this.targetClassById.length; i++) {
				if (this.targetClassById[i]['name'] === type) {
					id = this.targetClassById[i]['id'];
					break;
				}
			}
			let res = this.reqData[id].data;
			let arr = [];
			if (_.isArray(res) === true) {
				for (let v = 0; v < this.tTimeArr.length; v++) {
					let tStr = this.tTimeArr[v];
					arr[v] = "-";
					for (let x = 0; x < res.length; x++) {
						if (res[x]['datadate'] !== null && tStr === res[x]['datadate']) {
							arr[v] = res[x][target];
							if(arr[v]==="-999"||arr[v]===-999||arr[v]===null){
								arr[v]="-";
							}
							break;
						}
					}
				}

			} else {
				arr = [];
			}

			return arr;
		},
		calcPrecent(obj) {

			let id;
			for (let i = 0; i < this.targetClassById.length; i++) {
				if (this.targetClassById[i]['name'] === "oth") {
					id = this.targetClassById[i]['id'];
					break;
				}
			}
			let res = this.reqData[id].data;
			let targets = obj.target;
			let sumArr = [];
			let seriesArr = [];
			for (let t = 0; t < this.tTimeArr.length; t++) {
				let str = this.tTimeArr[t];
				sumArr[t] = 0;

				for (let s = 0; s < res.length; s++) {
					if (res[s]['datadate'] === str) {
						for (let v = 0; v < targets.length; v++) {
							let val = Number(res[s][targets[v]]);
							if (val === null || isNaN(val) || val===-999) {
								val = 0;
							}
							sumArr[t] += val;
							if (t === 0) {
								let o = obj.itemStyle[v];
								o.name = obj.showLabel[v];
								o.data = [];
								seriesArr.push(o);
							}
						}

						for (let j = 0; j < targets.length; j++) {
							let val = Number(res[s][targets[j]]);
							if (val === null || isNaN(val)) {
								val = 0;
							}
							seriesArr[j].data[t] = ((val / sumArr[t]) * 100).toFixed(1);
						}

						break;
					}

				}
			}

			return seriesArr;

		},
		calcWind(obj) {

			let id;
			for (let i = 0; i < this.targetClassById.length; i++) {
				if (this.targetClassById[i]['name'] === "wea") {
					id = this.targetClassById[i]['id'];
					break;
				}
			}
			let res = this.reqData[id].data;
			let arr = [];
			let seriesArr = [];
			for (let t = 0; t < this.tTimeArr.length; t++) {
				let str = this.tTimeArr[t];
				for (let x = 0; x < res.length; x++) {
					if (str === res[x]['datadate']) {
					
						for (let o = 0; o < obj.target.length; o++) {
							if (t === 0) {

								let objs = obj.itemStyle[o];
								objs.name = obj.showLabel[o];
								objs.data = [];
								seriesArr.push(objs);
							}
							if (_.last(obj.target[o].split("_")) === "min" || _.last(obj.target[o].split("_")) === "max") {
								seriesArr[o]['data'][t] = res[x][obj.target[o]];
								seriesArr[o]['showSymbol'] = false;
								seriesArr[o]['symbolSize'] = 6;
							} else {
								if(res[x][obj.target[o]]===-999||res[x][obj.target[o]] === null || isNaN(res[x][obj.target[o]])){
									res[x][obj.target[o]]=0;
								}
								let w = {
									value: res[x][obj.target[o]],
									symbolRotate: -res[x][obj.isWind]+180
								};
								seriesArr[o]['data'][t] = w;
							}

						}

						break;
					}
				}
			}
			return seriesArr;
		},
		setAqiBarColor(v) {

			if (v >= 0 && v <= 50) {
				return this.$$appConfig.prjInfo.gradeColors[1];
			} else if (v > 50 && v <= 100) {
				return this.$$appConfig.prjInfo.gradeColors[2];
			} else if (v > 100 && v <= 150) {
				return this.$$appConfig.prjInfo.gradeColors[3];
			} else if (v > 100 && v <= 200) {
				return this.$$appConfig.prjInfo.gradeColors[4];
			} else if (v > 200 && v <= 300) {
				return this.$$appConfig.prjInfo.gradeColors[5];
			} else if (v > 300 && v <= 500) {
				return this.$$appConfig.prjInfo.gradeColors[6];
			} else {
				return this.$$appConfig.prjInfo.gradeColors[0];
			}
		},
		setMonUnit(val) {
			let x = val.split("_")[0];
			if (x === "aqi") {
				return "{value}";
			} else if (x === "co") {
				return "{value} mg/m³";
			} else {
				return "{value} μg/m³";
			}
		},
		formatTargetByDataType(v, t) {

			let target;
			if (t === "day") {
				if (v === "aqi") {
					target = "aqi";
				} else if (v === "o3") {
					target = "o3_8h_max_iaqi";
				} else {
					target = v + "_24h_iaqi";
				}

			} else {
				if (v === "aqi") {
					target = "aqi";

				} else {
					target = v + "_1h_iaqi";
				}
			}
			return target;
		},
		formatTartget(v) {

			let target;
			if (v === "pm2.5" || v === "pm25" || v === "PM25" || v === "PM2.5") {
				target = "PM₂.₅";
			} else if (v === "pm10" || v === "PM10") {
				target = "PM₁₀";
			} else if (v === "so2" || v === "SO2") {
				target = "SO₂";
			} else if (v === "o3" || v === "O3") {
				target = "O₃";
			} else if (v === "no2" || v === "NO2") {
				target = "NO₂";
			} else if (v === "co") {
				target = "CO";
			} else if (v === "aqi") {
				target = "AQI";
			} else {
				target = v;
			}
			return target;
		}
	},

	activated: function () {
		if (this.isConfigLoaded) {
			//todo get data use ajax
			this.getNowTarget();
		}
		this.onResize();
	},

	deactivated: function () {
	}

}

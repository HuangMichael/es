/**
 * Created by yezhanpeng
 * date: 2017/11/01
 * desc: 城市对比分析
 */

import rightPanel from 'layout/right-panel/RightPanel.vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import titlePanel from '3clear/comm/TitlePanel/TitlePanel.vue';
import echarts from 'echarts';
import {dateUtils} from 'utils/dateUtils.js';
import _ from 'lodash';
import $ from 'jquery';
import 'libs/Scrollbar/jquery.mCustomScrollbar.css';
import {scrollbar} from 'libs/Scrollbar/jquery.mCustomScrollbar.js';
import {mousewheel} from 'libs/Scrollbar/jquery.mousewheel.min.js';

export default {
	components: {
		'right-panel': rightPanel,
		'setting-dialog': settingDialog,
		'title-panel': titlePanel
	},
	data() {
		return {
			//////模块基础数据信息
			name: 'CityContrastAnlayse',
			toggleStatus: 'open',
			rightPanelWidth: this.$$appConfig.layout.rightPanel.width,
			toggle: this.$$appConfig.layout.rightPanel.toggle,
			isConfigLoaded: false,
			config: {},

			chartOption: {},
			chartsIdRe:'CityContrastCharts_', /////charts id 前缀
			chartsGroup: "CityContrast", /////图标联动的group

			//////业务数据
			contentTitle: "", ////内容标题

			pollution: "", ////污染物的选择
			pollutionTitle: "",
			polRObj:{},

			chartStable:"", ////图表自适应的选择
			chartStableTitle: "",
			chartStableObj: {},

			cityCObjTitle:"",
			cityChecked: [], ////城市选择
			cityCObj:{},

			modelCeecked:[],////模式
			modelCObj:{},

			dateType:"",
			dateTypeObj:{},////时间类型

			recentType:"",
			timeRecentlyObj:{},

			currentCheck: {}, //////当前选择的城市

	        pickerOptions: {
	          	shortcuts: [{
		            text: '最近一天',
		            onClick(picker) {
		              const end = new Date();
		              const start = new Date();
		              start.setHours(0);
		              start.setMinutes(0);
		              start.setSeconds(0);
		              picker.$emit('pick', [start, end]);
		            }
		        },{
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
		        }],
                format: 'yyyy-MM-dd',
            	disabledDate(time) {
                    ////小于当前时间
                    let nowDate = new Date();
                    return ((time.getTime() > nowDate.getTime()));
                }
	        },
	        timeDuring: []
		}
	},

	created() {
		this.rightPanelWidth = this.toggleStatus === "close" ? 0 : this.$$appConfig.layout.rightPanel.width;
		this.$$resize(this.onResize);
		this.$$getConfig(this.onGetConfig);
	},

	mounted() {},

	watch:{},
	methods: {
		/**
		 * 获取当前模块配置文件
		 * @param config json格式的配置信息
		 */
		onGetConfig(config) {
			this.config = config;
			this.isConfigLoaded = true;

			this.contentTitle = config['contentTitle'];

			this.polRObj = config.settings.polRObj;
			this.pollutionTitle = config.settings.polRObj.label;
			this.pollution = config.settings.polRObj.default;

			this.chartStableObj = config.settings.chartStableObj;
			this.chartStableTitle = config.settings.chartStableObj.label;
			this.chartStable = config.settings.chartStableObj.default;

			this.cityCObj = config.settings.cityCObj;
			this.cityCObjTitle = config.settings.cityCObj.label;
			this.cityChecked = config.settings.cityCObj.default;

			this.modelCObj = config.settings.modelCObj;
			this.modelCeecked = config.settings.modelCObj.default;

			this.dateTypeObj = config.settings.dateTypeObj;
			this.dateType = config.settings.dateTypeObj.default;

			this.timeRecentlyObj = config.settings.timeRecentlyObj;
			this.recentType = config.settings.timeRecentlyObj.default;

			this.initDate(); //////初始化时间
			this.$nextTick(()=>{
				$("#CityContrastAnalyse_charts").mCustomScrollbar();
				this.winResize();
				this.initCharts();
				let models = this.modelCeecked;
				let citys = _.cloneDeep(this.cityChecked);
				this.requestMonitorData(citys);
				this.requestPredictData(citys, models);
			});
		},

		initDate(){
			/////初始时间段
			this.timeDuring = [];
			let recentType = this.recentType;
            let end = new Date();
		    let start = new Date();
			switch(recentType){
				case "recent_day":
		            start.setHours(0);
		            start.setMinutes(0);
		            start.setSeconds(0);
		            this.timeDuring = [start,end];
					break;
				case "recent_week":
		            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
		            this.timeDuring = [start,end];
					break;
				case "recent_month":
		            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
		            this.timeDuring = [start,end];
					break;
				default:
		            start.setHours(0);
		            start.setMinutes(0);
		            start.setSeconds(0);
		            this.timeDuring = [start,end];
		            break;
			}
		},

		dateHander(){
			/*根据开始时间和结束时间以及时间类型处理日期用于[echarts,数据获取]*/
			let dateDuring = [];
			let start = this.timeDuring[0]; ////开始时间
			let end = this.timeDuring[1]; ////结束时间
            start.setHours(0);
            start.setMinutes(0);
            start.setSeconds(0);
			if(this.dateType === "hour"){
				let todayStr = dateUtils.dateToStr('yyyy-MM-dd',new Date());
				let startStr = dateUtils.dateToStr('yyyy-MM-dd', end);
				if(startStr === todayStr){
					////如果是今天则显示00点-当前时间
		            end = new Date();
		            end.setMinutes(0);
		            end.setSeconds(0);
				}else{
					/////不是今天，则显示00点-23点
		            end.setHours(23);
		            end.setMinutes(0);
		            end.setSeconds(0);
				}

			}else if(this.dateType === "day"){
	            end.setHours(0);
	            end.setMinutes(0);
	            end.setSeconds(0);
			}
			dateDuring = [start, end];
			return dateDuring;
		},

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
				let currentdate = dateUtils.dateAdd(dtInterval, dt, _.cloneDeep(start));
				let LabeldateStr = dateUtils.dateToStr(dateFormat, currentdate);
				let hours = currentdate.getHours();
				let color = hoursOtherColor;
				if(hours === 0){
					color = hours00Color;
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

		yxixNameHander(target, yAxis){
			/*y轴根据不同的污染物显示不同的单位*/
			/*很函数合适只有一个污染物,格式：co_1h,so2_24h*/
			////isStable = false////y轴是否固定显示
			if(!target) return yAxis;
			if(!yAxis) return yAxis;
			let isStable = this.chartStable === "stable"; ////固定与否

			let targetValue = target.split('_')[0];
			let units = "";
			let polluConfig = _.cloneDeep(this.config.settings.polRObj.options);
			let targetName = targetValue;
			let minvalue = 0;
			let maxvalue = 0;
			for(let pol in polluConfig){
				let polObj = polluConfig[pol];
				if(targetValue === polObj.value && polObj.label){
					targetName = polObj.label; ////找和系列的名相同的
					units = polObj.unit;
					maxvalue = polObj.MaxValue;
					minvalue = polObj.MinValue;
					break;
				}
			}
			let Yaxis = yAxis;
			Yaxis['name'] = targetName + units;
			if(isStable){
				Yaxis['min'] = minvalue;
				Yaxis['max'] = maxvalue;
	            if (minvalue > 0) {
            		Yaxis["scale"] = true;
          		}
			}else{
				Yaxis['min'] = null;
				Yaxis['max'] = null;
				Yaxis["scale"] = false;
			}
			return Yaxis;
		},

		initCharts(){
			let series = [];
			let legend = [];
			let strAndEnd = this.dateHander();
			let dateArry = this.getEchartsDates(strAndEnd[0], strAndEnd[1]);
			let Axixdates = [];
			let data = [];
			for(let index in dateArry){
				let obj = dateArry[index];
				Axixdates.push(obj.label);
				data.push(this.config['echartNodata']);
			}
			//////实测系
            let chartMoniterSer = _.cloneDeep(this.config['chartMoniterSer']);
            chartMoniterSer['data'] = _.cloneDeep(data);
            series.push(chartMoniterSer);
            legend.push(chartMoniterSer['name']);
            //////多模式预报系
			for(let index in this.modelCeecked){
				let modelName = this.modelCeecked[index];
				let serColor = "";
				for(let mod in this.modelCObj.options){
					let modObj = this.modelCObj.options[mod];
					if(modelName === modObj.value && modObj.label){
						modelName = modObj.label;
						serColor = modObj.color;
					}
				}
				legend.push(modelName);
	            let chartForestSer = _.cloneDeep(this.config['chartForestSer']);
    			if(serColor !== ""){
    				////chartForestSer['lineStyle']['normal']['color'] = serColor;
    				chartForestSer['itemStyle']['normal']['color'] = serColor;
    			}
	            chartForestSer['name'] = modelName;
	            chartForestSer['data'] = _.cloneDeep(data);
	            series.push(chartForestSer);
			}

            let chartOption = _.cloneDeep(this.config['chartOption']);
            chartOption.title.text = "";
            chartOption.legend.data = legend;
            chartOption.xAxis[0].data = Axixdates;
            chartOption.series = _.cloneDeep(series);
            let temp = _.cloneDeep(chartOption["yAxis"][0]);
            let yxixs = this.yxixNameHander(this.pollution, temp); /////根据不同污染物有不同的单位
            chartOption["yAxis"][0] = yxixs;
            this.chartOption = _.cloneDeep(chartOption);

			for(let index in this.cityChecked){
				let chartsId  =  this.chartsIdRe + this.cityChecked[index];
				let chartObj = echarts.init(document.getElementById(chartsId));
				chartObj.group = this.chartsGroup;
				chartObj.setOption(chartOption, true);
			}
			echarts.connect(this.chartsGroup);
		},

		targetHandel(target){
			//根据污染物返回查询字段//
			if(!target){ return}
			let dateType = this.dateType;
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

		requestMonitorData(Citys){
			/*
			请求实测数据|这里有模式和城市是多选的,写成参数方便调用
			Citys 城市（单个或者多个）
			*/
			if(!Citys){ return; }
			let startAndEnd = this.dateHander();
			let startTimeStr = dateUtils.dateToStr('yyyy-MM-ddTHH:00:00', startAndEnd[0]);
			let endTimeStr = dateUtils.dateToStr('yyyy-MM-ddTHH:00:00', startAndEnd[1]);

			let citycodes = Citys.join(',');
			let zone = this.config['zoneName'];
			let dateType = this.dateType;
			let pollution = this.targetHandel(this.pollution);

			let monitor_params = {
				codeType: "citycode",
				code: citycodes,
				target: pollution,
				startTimeStr: startTimeStr,
				endTimeStr: endTimeStr,
				dateType: dateType,
				isLeftJoin: false
			};
			let serName = this.config['chartMoniterSer']['name'];
			let monitor = this.$$getCityTargetValueByMonitorDate({
				data: monitor_params,
				fn: (data) => {
					if(data){
						this.handleData(Citys, serName, startAndEnd, data);
					}
				},
				errFn: () => {
					this.handleData(Citys, serName, startAndEnd, []);
				}
			});
		},

		requestPredictData(Citys, Models){
			/*
			请求预报数据|这里有模式和城市是多选的,写成参数方便调用
			Citys 城市（单个或者多个）
			models 模式（单个或者多个）naqpms_20//naqpms_08
			*/
			if(!Citys || !Models){ return; }

			let startAndEnd = this.dateHander();
			let startTimeStr = dateUtils.dateToStr('yyyy-MM-ddTHH:00:00', startAndEnd[0]);
			let endTimeStr = dateUtils.dateToStr('yyyy-MM-ddTHH:00:00', startAndEnd[1]);

			let citycodes = Citys.join(',');
			let zone = this.config['zoneName'];
			let dateType = this.dateType;
			let pollution = this.targetHandel(this.pollution);
			////注意这里的模式产品时间分为08时和20时
			let predict_params = {
				modelName: "",
				zoneName: zone,
				time: "",
				predictioninterval: 1,
				codeType: "citycodes",
				code: citycodes,
				target: pollution,
				startTimeStr: startTimeStr,
				endTimeStr: endTimeStr,
				dateType: dateType,
				isLeftJoin: false
			};

			let requests = [];
			for(let md in Models){
				let model = Models[md];
				let arryStr =  model.split('_');
				let params = _.cloneDeep(predict_params);
				params["modelName"] = arryStr[0];
				params["time"] = arryStr[1];
				let PredictRequest = this.$$getCityPredictionInfoByInterval({data: params});
				requests.push(PredictRequest);
			}
            this.$$promiseAll.call(this, requests, (Data) => {
            	if(Data){
	            	for(let md in Models){
	            		let modelSer = Models[md];
	            		if(Data[md]['status'] === 200 && Data[md]['data']){
	            			this.handleData(Citys, modelSer, startAndEnd, Data[md]['data']);
	            		}else{
	            			this.handleData(Citys, modelSer, startAndEnd, []);
	            		}
	            	}
            	}
            });
		},

		handleData(Citys, SerName, StartAndEndTime, Data){
			////处理数据
			/*
			Citys：城市名
			SerName：系列名称
			Dates：日期数组
			Data：数据
			*/
			let Dates = this.getEchartsDates(StartAndEndTime[0], StartAndEndTime[1]); /////时间段
			let monitorName = _.cloneDeep(this.config['chartMoniterSer']['name']);
			let MoniterSer = _.cloneDeep(this.config['chartMoniterSer']);
			let ForestSer = _.cloneDeep(this.config['chartForestSer']);
			let pollution = this.targetHandel(this.pollution);
			let seriesObj = SerName === monitorName? MoniterSer : ForestSer;
			for(let ct in Citys){
				let currtCity = Citys[ct];
				let dates = [];
				let serData = [];
				for(let dt in Dates){
					let dtObj = Dates[dt];
					dates.push(dtObj.label);
					let singlData = this.getObjFromData(Data, dtObj.value, currtCity);
					let targetValue = singlData[pollution];
					let realValue = this.getAQIData(targetValue, pollution);
					serData.push(realValue);
				}
				let chartsId = this.chartsIdRe + currtCity;
				let currentCharts = echarts.getInstanceByDom(document.getElementById(chartsId));
				let option = currentCharts.getOption();
				let ishas = false;
				let modelName = SerName;
				let serColor = "";

				option.xAxis[0].data = dates;
				let temp = _.cloneDeep(option["yAxis"][0]);
				let yxixs = this.yxixNameHander(this.pollution, temp); /////根据不同污染物有不同的单位
				option["yAxis"][0] = yxixs;
				for(let mod in this.modelCObj.options){
					let modObj = this.modelCObj.options[mod];
					if(SerName === modObj.value && modObj.label){
						modelName = modObj.label; ////找和系列的名相同的
						serColor =  modObj.color;
						break;
					}
				}
				for(let Ser in option['series']){
					////如果有则重新赋值,没有则添加
					if(modelName === option['series'][Ser]['name']){
						ishas = true;
						option['series'][Ser]['data'] = serData;
						currentCharts.setOption(option, true);
						break;
					}
				}
				if(!ishas){
					/////如果是新增的
		   			seriesObj['name'] = modelName;
	    			seriesObj['data'] = serData;
	    			if(serColor !== ""){
	    				/////seriesObj['lineStyle']['normal']['color'] = serColor;
	    				seriesObj['itemStyle']['normal']['color'] = serColor;
	    			}
					option['series'].push(seriesObj);
	    			option.legend[0]['data'].push(modelName);
					currentCharts.setOption(option, true);
				}
			}
		},

		getCityImage(code){
			////返回不同城市的图片Url
			if(!code) return null;
			let baseUrl = this.config['cityImageUrl'];
			let Url = baseUrl + code + ".png";

			console.log("url------------"+Url);
			return Url;
		},

        getAQIData(item, target) {
            ////item -----数字
            ////target-----污染物 co_1h,O3_8h_max,so2
            let result = null;
            if (!item|| item < 0) {
                result = '-';
            } else {
                let tg = target.split('_')[0];
                if (tg === 'aqi') {
                    result = Math.ceil(item); ////向上取整
                } else if (tg === 'co') {
                    result = item.toFixed(1); ////co四舍五入保留一位
                } else {
                    result = Math.round(item); ////取整
                }
            }
            return result;
        },

        getObjFromData(data, time, code){
            /*
            * 从请求的数据获取当前的时间的一项
            * data数据 time当前时间(不是字符串) code城市编码
            */
            /////数据的时间格式'yyyy-MM-ddTHH:00:00'
            let dataObj = {};
            if(!data){
                data = [];
            }
            let currentTimeStr = time; /////'yyyy-MM-ddTHH:00:00'
            for(let index in data){
                if(data[index]['datadate'] === currentTimeStr && data[index]['code'] === code){
                    dataObj = data[index];
                    break; ////找到该项数据之后跳出循环返回
                }
            }
            return dataObj;
        },

        cityCheck(ischeck, item){
        	//////ischeck 是选中还是取消
        	//////item 是当前选中的对象
        	if(!item){return}
			let currentCheck = item.value;
			let chartsId = this.chartsIdRe + currentCheck;
			if(!ischeck){
				////未选中状态
				let tempDestroy = echarts.getInstanceByDom(document.getElementById(chartsId));
				if(tempDestroy){
					tempDestroy.dispose(); /////图标实例销毁,div自动销毁
				}
			}else{
				////选中状态,创建图图表
				this.$nextTick(()=>{
					////Div动态创建成功后
			    	let chartObj = echarts.init(document.getElementById(chartsId));
			 		chartObj.group = this.chartsGroup;
			 		chartObj.setOption(this.chartOption, true);
					let models = this.modelCeecked;
					this.requestMonitorData([currentCheck]);
					this.requestPredictData([currentCheck], models);
			    	//// document.getElementById(chartsId).scrollIntoView();
				});
			}
        },

        modelchange(ischeck, item){
        	/*model change*/
        	//////ischeck 是选中还是取消
        	//////item 是当前选中的对象
        	if(!item){return}
			let citys = _.cloneDeep(this.cityChecked);
			let currentCheck = item.value;
			if(!ischeck){
				////未选中状态
				/////循环所有的图表去除一个系列
				let SerName = item.label;
				for(let ct in citys){
					let currtCity = citys[ct];
					let chartsId = this.chartsIdRe + currtCity;
					let currentCharts = echarts.getInstanceByDom(document.getElementById(chartsId));
					let option = currentCharts.getOption();
					/////如果是新增的
					let ishas = false;
					let index = 0;
					let newSeris = []; ////remove one that no use
					for(let Ser in option['series']){
						if(SerName !== option['series'][Ser]['name']){
							let tempSer = option['series'][Ser];
							newSeris.push(tempSer);
						}
					}
					let legData = option.legend[0]['data'];
					let newLegData = [];
					for(let Leg in legData){
						if(SerName !== legData[Leg]){
							let tempLeg = _.cloneDeep(legData[Leg]);
							newLegData.push(tempLeg);
						}
					}
					option['series'] = newSeris;
	    			option.legend[0]['data'] = newLegData;
					currentCharts.setOption(option, true);
				}
			}else{
				this.requestPredictData(citys, [currentCheck]);
			}
        },

        stableChange(){
			for(let index in this.cityChecked){
				let chartsId  =  this.chartsIdRe + this.cityChecked[index];
				let currentCharts = echarts.getInstanceByDom(document.getElementById(chartsId));
				let option = currentCharts.getOption();
				let temp = option["yAxis"][0];
				let yxixs = this.yxixNameHander(this.pollution, temp); /////根据不同污染物有不同的单位
				option["yAxis"][0] = yxixs;
				currentCharts.clear();
				currentCharts.setOption(option, true);
				currentCharts.resize();
			}
        },

		changeRefresh(){
			//change事件(需要重新查询的)//
			let models = this.modelCeecked;
			let citys = _.cloneDeep(this.cityChecked);
			this.requestMonitorData(citys);
			this.requestPredictData(citys, models);
		},

		/*
		* 时间变化后查讯数据
		*/
		changeRefresh_Time(){
			////这里为了防止图表数据过多卡死
			////当查询时间大于一周时，时间类型自动切换到日
			////当查询时间小于一周时，时间类型自动切换带时
			let models = this.modelCeecked;
			let howLongDayTohour = this.config['howLongDayTohour']||7;
			let citys = _.cloneDeep(this.cityChecked);
			let start = this.timeDuring[0]; ////开始时间
			let end = this.timeDuring[1]; ////结束时间
			let diffDays = dateUtils.dateDiff('d', start, end);
			if(diffDays > howLongDayTohour){
				if(this.dateType = "hour"){
					this.dateType = "day";
				}
			}else{
				if(this.dateType = "day"){
					this.dateType = "hour";
				}
			}
			this.requestMonitorData(citys);
			this.requestPredictData(citys, models);
		},

		exportExcel(message){
			this.$nextTick(()=>{
				console.log(message);
			});
		},

		allChartsResize(){
			this.$nextTick(()=>{
				for(let index in this.cityChecked){
					let chartsId  =  this.chartsIdRe + this.cityChecked[index];
					echarts.getInstanceByDom(document.getElementById(chartsId)).resize();
				}
			});
		},
        winResize(){
            /*这里动态计算div的宽高去实现完全自适应*/
             this.$nextTick(() => {
                let ContainerHeight = this.$refs.el_content.offsetHeight;
                let ContainerTitleHeight = this.$refs.el_menu.offsetHeight;
                this.$refs.el_row_panelContent.style.height = ContainerHeight - ContainerTitleHeight - 20 +"px";
            });
        },
		/**
		 * 视图大小更改事件
		 */
		onResize() {
			console.log('page resize,handle the event at here');
			this.winResize();
			this.allChartsResize(); ////所有的图表resize
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

	activated: function () {
		if (this.isConfigLoaded) {
			//todo get data use ajax
			this.initDate(); //////初始化时间
			this.$nextTick(()=>{
				this.winResize();
				this.initCharts();
				let models = this.modelCeecked;
				let citys = _.cloneDeep(this.cityChecked);
				this.requestMonitorData(citys);
				this.requestPredictData(citys, models);
				this.allChartsResize(); ////所有的图表resize
			});
		}
		this.onResize();
	},

	deactivated: function () {
	}

}


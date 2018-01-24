/**
 * Created by kangming
 * date: 2017/9/19
 * desc: 框架测试
 */

import rightPanel from 'layout/right-panel/RightPanel.vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import titlePanel from '3clear/comm/TitlePanel/TitlePanel.vue';

import {dateUtils} from 'utils/dateUtils.js';


export default {
	components: {
		'right-panel': rightPanel,
		'setting-dialog': settingDialog,
		'title-panel': titlePanel
	},
	data() {
		return {
			//模块基础数据信息
			name: 'Demo',
			toggleStatus: 'open',
			rightPanelWidth: this.$$appConfig.layout.rightPanel.width,
			toggle: this.$$appConfig.layout.rightPanel.toggle,
			isConfigLoaded: false,
			config: {},

			//业务数据
			contentTitle: '这是个TitlePanel示例',
			pol: '',
			pols: [],

			time: '',
			pDate: '',
			timeOptions: [{
				label: '20时',
				value: '20:00:00'
			}, {
				label: '08时',
				value: '08:00:00'
			}]
		}
	},

	created() {
		this.rightPanelWidth = this.toggleStatus === "close" ? 0 : this.$$appConfig.layout.rightPanel.width;
		this.$$resize(this.onResize);
		this.$$getConfig(this.onGetConfig);


		console.log("created----------------");
	},

	mounted() {
		console.log("mounted----------------");
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
			//todo get data use ajax api
			this.initQueryData();


		},

		/**
		 * 视图大小更改事件
		 */
		onResize() {
			console.log('page resize,handle the event at here');
		},

		/**
		 * 右边面板状态更改事件
		 * @param status 当前状态 open|close
		 */
		onTogglePanel(status) {
			this.toggleStatus = status;
			this.rightPanelWidth = status === 'close' ? 0 : this.$$appConfig.layout.rightPanel.width;
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


		initQueryData(){

			console.log("初始化查询数据并进行封装---------------");

		},

		/**
		 * 封装生成时段统计的图表所需数据格式
		 * @param dateStrArray
		 * @return {*|Array}
		 */
		getDateRangeChartData() {

			let dateStrArray = this.getDateStrArray();
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
				console.log("responseArray---" + JSON.stringify(responseArray[0]["data"]));
			});
		},


	},

	activated: function () {
		if (this.isConfigLoaded) {
			//todo get data use ajax
			console.log("初始化统计图-----------------");
			console.log("初始化数据表-----------------");
			//初始化加载数据
		}
		this.onResize();
		console.log("activated----------------");
	},

	deactivated: function () {

		console.log("deactivated----------------");
	}

}


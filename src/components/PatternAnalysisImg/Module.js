/**
 * Created by kangming
 * date: 2017/9/19
 * desc: 框架测试
 */

import rightPanel from 'layout/right-panel/RightPanel.vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import titlePanel from '3clear/comm/TitlePanel/TitlePanel.vue';
import {dateUtils} from '@/utils/dateUtils';
import _ from 'lodash';
import echarts from 'echarts';
import 'libs/Scrollbar/jquery.mCustomScrollbar.css';
import {mousewheel} from 'libs/Scrollbar/jquery.mousewheel.min.js'
import {scrollbar} from 'libs/Scrollbar/jquery.mCustomScrollbar.js'
import '3clear/control/ImageControl/css/imagecontrol.css';
import { imageControl } from '3clear/control/ImageControl/js/imagecontrol.js';
export default {
	components: {
		'right-panel': rightPanel,
		'setting-dialog': settingDialog,
		'title-panel': titlePanel
	},
	data() {
		return {
			//模块基础数据信息
			name: 'PatternAnalysisImg',
			toggleStatus: 'open',
			rightPanelWidth: this.$$appConfig.layout.rightPanel.width,
			toggle: this.$$appConfig.layout.rightPanel.toggle,
			isConfigLoaded: false,
			config: {},
			//业务数据
			dataType:'',
			dataTypes:[],
			model: '',
			models: [],
			area:'',
			areas:[],
			pol:'',
			pols:[],
			time: '',
			imageObj:null,
			pDate: new Date(new Date()),
			timeOptions: this.$$appConfig.prjInfo.modelInfo.predictTime,
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
			
			this.dataType = config.settings.dataTypeObj.default;
			this.dataTypes = config.settings.dataTypeObj.options;
			this.area = config.settings.areaRObj.default;
			this.areas = config.settings.areaRObj.options;
			
		
			this.pol=this.config.settings[this.dataType+"ProductObj"].default;
			this.pols=this.config.settings[this.dataType+"ProductObj"].options;
			this.setTimeSelect();
			this.model=this.config.settings[this.time+"ModelObj"].default;
			this.models=this.config.settings[this.time+"ModelObj"].options;
			//todo get data use ajax api
			
		},

		/**
		 * 视图大小更改事件
		 */
			
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
				if(this.time===""){
					this.time = "20";
				}
				
				this.pDate = new Date(this.pDate.getTime() - 1000 * 3600 * 24);
				this.timeOptions = this.$$appConfig.prjInfo.modelInfo.predictTime;
			}
			this.setModelData();
		},
		setModelData(){
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
			this.getNowData();
		},
		setPolData(){
			this.pols=this.config.settings[this.dataType+"ProductObj"].options;
			this.getNowData();
		},
		getNowData(){
			
			let pDateStr=dateUtils.dateToStr("yyyyMMDD"+this.time,this.pDate);
			let dataType=this.dataType;
			let model=this.model;
			let codeId;
			for(let i=0;i<this.pols.length;i++){
				if(this.pol===this.pols[i].value){
					codeId=this.pols[i].id;
					break;
				}
			}
			
			let area = this.area;
			let appConfigModel = this.$$appConfig.prjInfo.modelInfo.model;
			let interval;
			//获取地区对应 模式的时效
			appConfigModel.forEach((value, index, array) => {
				if (value.value === model) {
					if (area === "d01") {
						interval = value.interval[0];
					} else if (area === "d02") {
						interval = value.interval[1];
					} else if (area === "d03") {
						interval = value.interval[2];
					}
				}
			});
			let startIndex=4;
			let endIndex=4+interval*24;
			let para = {
            type: "picURL",
            picType:[codeId] ,
            sort: 0,
            picShape: "large",
	          };
	          para[codeId] = {
	            modelType: ["naqp"],
	            domain: [this.area],
	            times: pDateStr,
	            periodStart: startIndex,
	            periodEnd:endIndex
	          };
	        if(this.imageObj!=null){
	        	this.imageObj.queryDataSource(para, (data) => {
				this.imageObj.setDataSource(data);
				});
	        }else{
	        	this.imageObj={};
	        	this.imageObj = new imageControl({
				parent: "imgDiv",
				queryImageSourcePara: para,
				readImagesAddress:this.$$appConfig.prjInfo.ImgHttpServer.url,
				webapiAddress:this.$$appConfig.prjInfo.webApi.url,
				downloadPicServerAddress:this.$$appConfig.prjInfo.ImgHttpServer.url				

			});
	        }
			
			
		},
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
		}
	},

	activated: function () {
		if (this.isConfigLoaded) {
			//todo get data use ajax
		}
		this.onResize();
	},

	deactivated: function () {
	},
	beforeRouteLeave(to,from,next){
		
		if(this.imageObj)
			this.imageObj.stopPlay();
		next(true);
	}

}


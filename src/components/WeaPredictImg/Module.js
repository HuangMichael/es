/**
 * Created by kangming
 * date: 2017/9/19
 * desc: 框架测试
 */

import rightPanel from 'layout/right-panel/RightPanel.vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import titlePanel from '3clear/comm/TitlePanel/TitlePanel.vue';
import { dateUtils } from '@/utils/dateUtils';
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
			name: 'WeaPredictImg',
			toggleStatus: 'open',
			rightPanelWidth: this.$$appConfig.layout.rightPanel.width,
			toggle: this.$$appConfig.layout.rightPanel.toggle,
			isConfigLoaded: false,
			config: {},

			//业务数据
			contentTitle: '这是个TitlePanel示例',
			pol: '',
			pols: [],
			pDate: new Date(new Date().getTime() - 1000 * 3600 * 24),
			eDate: new Date(),
			time: '',

			sources: [],
			source: null,
			basics: [],
			basic: "",
			breadcrumbArr: [],
			selecteArr: [],
			isUpExpandShow: false,
			checkboxGroup6: [],
			selectObj: {},
			imageObj: {},
			timeOptions: [{
				label: '20时',
				value: '20:00:00'
			}, {
				label: '08时',
				value: '08:00:00'
			}],
			tabIndexName: "first"
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
			this.sources =config.settings.sourceOption.data;
			this.source =config.settings.sourceOption.default;
			this.basics = this.config.settings.basicOption.data;
			this.basic = this.config.settings.basicOption.default;
			this.sourceChange();
			let lastObj = _.last(this.selecteArr);
			let pHour=lastObj.default;
			let dateStr=dateUtils.dateToStr("yyyyMMDD"+pHour,this.pDate);
			let para = {
				type: "picURL",
				sort: 0,
				picType: [this.selectObj.id],
				picShape: "large"

			};

			para[this.selectObj.id] = {
				times: dateStr,
				periodStart:0,
				periodEnd:240
			};
			this.imageObj = new imageControl({
				parent: "imgDiv",
				queryImageSourcePara: para,
				readImagesAddress:this.$$appConfig.prjInfo.ImgHttpServer.url,
				webapiAddress:this.$$appConfig.prjInfo.webApi.url,
				downloadPicServerAddress:this.$$appConfig.prjInfo.ImgHttpServer.url
			
			});

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
		handleClick(tab, event) {

			this.setImgObj();
		},
		sourceChange(a, b) { ///点击来源改变

			this.selectObj = {};
			this.selecteArr = [];
			this.breadcrumbArr = [];
			if(this.tabIndexName === "first") {
				let sourceObj;
				sourceObj = this.config.settings.sourceOption.data[this.source];
				for(let i in sourceObj) {
					if(sourceObj['data']) {
						let obj = {
							label: sourceObj.label
						};
						this.breadcrumbArr.push(obj);
						this.selecteArr.push(sourceObj);
						sourceObj = sourceObj.data[sourceObj.default];

					}
				}

			} else {
				let basicObj;
				basicObj = this.config.settings.basicOption.data[this.basic];
				for(let i in basicObj) {
					if(basicObj['data']) {
						let obj = {
							label: basicObj.label
						};
						this.breadcrumbArr.push(obj);
						this.selecteArr.push(basicObj);
						basicObj = basicObj.data[basicObj.default];

					}
				}
			}
			let lastObj = _.last(this.selecteArr);
			this.selectObj = lastObj.data[lastObj.default];
			this.breadcrumbArr.push({
				label: this.selectObj.label
			});
			this.breadcrumbArr.push({
				label: this.selectObj.title
			});
			
			if(this.selectObj.times||this.selectObj.times===0){
			let time=this.selectObj.times;
			if(time===-1){
				
			
			}else{
				let o=this.config.timeStatus["type_"+time];
				o['cName']='时次';
				this.selecteArr.push(o);
				}
			}
			

		},
		setImgObj() {

			this.sourceChange();
			let para = {
				type: "picURL",
				sort: 0,
				picType: [this.selectObj.id],
				picShape: "large"

			};
			let lastObj = _.last(this.selecteArr);
			let pHour=lastObj.default;
			let dateStr=dateUtils.dateToStr("yyyyMMDD"+pHour,this.pDate);
			if(this.selectObj.times===-1){
				dateStr=dateUtils.dateToStr("yyyyMMDD08",this.pDate)
			}
			para[this.selectObj.id] = {
				times: dateStr,
				periodStart:0,
				periodEnd:240
			};
			
			this.imageObj.queryDataSource(para, (data) => {
				this.imageObj.setDataSource(data);
			});

		},
		checklImgCloseExpand() {

			this.isUpExpandShow = false
		},
		selectClick() {
			this.isUpExpandShow = !this.isUpExpandShow;
		}

	},

	activated: function() {
		if(this.isConfigLoaded) {
			//todo get data use ajax
		}
		this.onResize();
	},

	deactivated: function() {
		

	},
	beforeRouteLeave(to,from,next){
		
		if(this.imageObj)
			this.imageObj.stopPlay();
		next(true);
	}

}

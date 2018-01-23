/**
 * Created by kangming
 * date: 2017/9/19
 * desc: 框架测试
 */

import rightPanel from 'layout/right-panel/RightPanel.vue';
import settingDialog from '3clear/comm/Setting/Setting.vue';
import titlePanel from '3clear/comm/TitlePanel/TitlePanel.vue';


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
			//todo get data use ajax api
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
		}
	},

	activated: function () {
		if (this.isConfigLoaded) {
			//todo get data use ajax
		}
		this.onResize();
	},

	deactivated: function () {
	}

}


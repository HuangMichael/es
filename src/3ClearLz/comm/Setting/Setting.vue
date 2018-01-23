<template>
	<div class="setting-wrap">
		<div style="text-align: right;padding: 8px">
			<a @click="show=true" href="javascript:void(0);"><i class="fa fa-cog fa-fw"></i>{{title}}</a>
		</div>

		<el-dialog :title="title" :visible="show" @open="onOpen" :lock-scroll=false>
			<div class="settingForm">

			</div>
			<span slot="footer" class="dialog-footer">
                <el-button @click="show = false">取 消</el-button>
                <el-button @click="getNewConfig" type="primary">确 定</el-button>
		</span>
		</el-dialog>
	</div>
</template>

<script>
	import Vue from 'vue';
	import Leaflet from 'leaflet';
	import 'leaflet/dist/leaflet.css';
	import 'libs/Leaflet-ext/leaflet.MapProviders.js';

	export default {
		components: {},

		props: {
			configJson: {
				type: Object
			}
		},

		data() {
			return {
				show: false,
				title: '习惯配置',
				isFirstOpen: true
			}
		},

		mounted() {
		},

		methods: {
			onOpen() {
				if (this.isFirstOpen) {
					this.$nextTick(() => {
						this.parseSetting();
					});
					this.isFirstOpen = false;
				}
			},

			parseSetting() {
				let obj = this.configJson.settings;
				let tplStr = '<el-form   style="margin:20px;max-height: 500px;\n' +
					'    overflow: auto;padding: 10px;"\n' +
					'label-width="100px"\n' +
					'ref="settingInfo">';
				for (let o in obj) {
					let currCon = obj[o];
					switch (currCon.type) {
						case 'RadioBtns'://单选组
							tplStr += parseCom(currCon, o, 'radio');
							break;
						case 'CheckBoxs'://复选框
							tplStr += parseCom(currCon, o, 'checkbox');
							break;
						case 'InputNumber'://计数
							tplStr += '<el-form-item label="' + currCon.label + ':" >';
							tplStr += '<el-input-number ' + currCon.disabled + '  v-model="settingObj.settings.' + o.toString() + '.default"' + ' :min="' + currCon.min + '" :max="' + currCon.max + '"></el-input-number>';
							tplStr += '</el-form-item>';
							break;
						case 'Switch'://单选
							tplStr += '<el-form-item label="' + currCon.label + ':" >';
							tplStr += '<el-switch ' + currCon.disabled + ' active-color="#13ce66"\n' +
								'    inactive-color="#ff4949"  v-model="settingObj.settings.' + o.toString() + '.default"' + '"></el-switch>';
							tplStr += '</el-form-item>';
							break;
						case 'Slider'://透明度
							tplStr += '<el-form-item label="' + currCon.label + ':" >';
							tplStr += '<el-slider  ' + currCon.disabled + '  :min=0  :max=100  v-model="settingObj.settings.' + o.toString() + '.default"' + '"></el-slider>';
							tplStr += '</el-form-item>';
							break;
						case 'Time'://时间
							tplStr += '<el-form-item label="' + currCon.label + ':" >';
							tplStr += '<el-time-select  ' + currCon.disabled + '  :picker-options="{\n' +
								'    start: \'12:00\',\n' +
								'    step: \'00:30\',\n' +
								'    end: \'18:00\'\n' +
								'  }"  v-model="settingObj.settings.' + o.toString() + '.default"' + '"></el-time-select>';
							tplStr += '</el-form-item>';
							break;
						case 'Map'://地图范围
							tplStr += '<el-form-item label="' + currCon.label + ':"  style="display: inline-block">';
							tplStr += '<el-input  disabled   v-model="settingObj.settings.' + o.toString() + '.default"' + '"></el-input>';
							tplStr += '</el-form-item>';
//
							tplStr += '<el-form-item label=""  style="display: inline-block">';
							tplStr += '<el-button @click="setMapExtent" > 设置</el-button>';
							tplStr += '</el-form-item>';

							tplStr += '<el-form-item label="" >';
							tplStr += '<span>{{currExtent}}</span><div id="mapSetting" style="width: 100%;height: 400px"></div>';
							tplStr += '</el-form-item>';
//							tplStr +=
							break;
						default:
							break;
					}
				}
				tplStr += "</el-form>";
				let _this = this;
				let com = Vue.extend({
					template: tplStr,
					data() {
						return {
							settingObj: _this.configJson,
							currExtent: '',
						}
					},

					methods: {
						initMap() {
							let baseLayers = [];
							if (this.settingObj['settings']['mapType']) {
								let baseMap = L.tileLayer.mapProvider(this.settingObj['settings']['mapType']['default'], {attribution: ''});
								baseLayers.push(baseMap);
							} else {
								let defaultBaseMap = L.tileLayer.mapProvider('Geoq.Normal.PurplishBlue', {attribution: ''});
								baseLayers.push(defaultBaseMap);
							}
							this.map = L.map("mapSetting", {
								minZoom: 4,
								maxZoom: 19,
								zoom: 7,
								center: [
									35,
									104
								],
								layers: baseLayers
							});

							if (this.settingObj['settings']['mapExtent']) {
								let et = this.settingObj['settings']['mapExtent']['default'].split(',');
								this.map.fitBounds([
									[et[0], et[1]],
									[et[2], et[3]]
								]);

								let _this = this;
								this.map.on('resize', function (event) {
									_this.getMapExtent();
								});

								this.map.on('move', function (event) {
									_this.getMapExtent();
								});
							}
						},
						getMapExtent() {
							let mapbounds = this.map.getBounds();
							let ymin = mapbounds._southWest.lng;
							let xmin = mapbounds._southWest.lat;
							let ymax = mapbounds._northEast.lng;
							let xmax = mapbounds._northEast.lat;
							let extent = [xmin, ymin, xmax, ymax];
							this.currExtent = extent.join(',');
							return extent.join(',');
						},

						setMapExtent() {
							this.settingObj['settings']['mapExtent']['default'] = this.getMapExtent();
						}
					},
					mounted() {

						if (this.settingObj['settings']['mapType']) {
							this.$nextTick(() => {
								this.initMap();
							});
						}
					}
				});
				let c = new com().$mount();
				let slotDom = this.$$lib_$('.settingForm', this.$el);
				slotDom[0].appendChild(c.$el);

				function parseCom(obj, pty, type) {
					let tmp = '<el-form-item label="' + obj.label + ':" >';
					tmp += '<el-' + type + '-group v-model="settingObj.settings.' + pty.toString() + '.default" ' + obj.disabled + '>';
					obj['options'].forEach(item => {
						tmp += '<el-' + type + ' label="' + item.value + '"  >' + item.label + '</el-' + type + '>';
					});
					tmp += '</el-' + type + '-group></el-form-item>';
					return tmp;
				}
			},

			getNewConfig() {
				console.log(this.configJson);
			}
		}
	}
</script>

<style scoped>
	.setting-wrap {

	}
</style>


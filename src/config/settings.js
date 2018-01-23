let env = process.env;

let gbs = {

	db_prefix: '3clear_lz_', //本地存储的key

	//状态码字段
	api_status_key_field: 'status',
	//状态码value
	api_status_value_field: 200,

	api_data_field: 'data',


	api_3clear_status_key_field: 'StatusCode',

	api_3clear_status_value_field: 200,

	api_3clear_data_field: 'HttpContent',

	api_3clear_status_message:'HttpRequestMessage',

	api_custom: {
		404: function (res) {
			this.$store.dispatch('remove_userinfo').then(() => {
				this.$alert(res.status + ',' + res.msg + '！', '登录错误', {
					confirmButtonText: '确定',
					callback: action => {
						this.$router.push('/login');
					}
				});
			});
		}
	}
};

let cbs = {
	/**
	 * ajax请求成功，返回的状态码不是200时调用
	 * @param  {object} err 返回的对象，包含错误码和错误信息
	 */
	statusError(err) {
		console.log('err');
		if (err.status !== 404) {
			this.$message({
				showClose: true,
				message: '返回错误：' + err.msg,
				type: 'error'
			});
		} else {
			this.$store.dispatch('remove_userinfo').then(() => {
				this.$alert(err.status + ',' + err.msg + '！', '登录错误', {
					confirmButtonText: '确定',
					callback: action => {
						this.$router.push('/login');
					}
				});
			});
		}
	},

	/**
	 * ajax请求网络出错时调用
	 */
	requestError(err) {
		this.$message({
			showClose: true,
			message: '请求错误：' + (err.response ? err.response.status : '') + ',' + (err.response ? err.response.statusText : ''),
			type: 'error'
		});
	}
};

let appConfig = {
	layout: { //左侧栏宽度在store中修改
		headerHeight: 60,
		footerHeight: 40
	},
	map: {
		baseLayer: {
			baseLayerOptions: {
				srs: "EPSG:3857",
				units: "m",
				format: "image/png",
				resolutions: [
					156543.03392800014,
					78271.51696399994,
					39135.75848200009,
					19567.87924099992,
					9783.93962049996,
					4891.96981024998,
					2445.98490512499,
					1222.992452562495,
					611.4962262813797,
					305.74811314055756,
					152.87405657041106,
					76.43702828507324,
					38.21851414253662,
					19.10925707126831,
					9.554628535634155,
					4.77731426794937,
					2.388657133974685,
					1.1943285668550503,
					0.5971642835598172,
					0.29858214164761665
				],

				origin: [-2.0037508342787E7,
					2.0037508342787E7
				],
				zoom: 5,
				center: [35, 104],
				minZoom: 4,
				maxZoom: 15
			},
			url: "http://{s}.api.cartocdn.com/base-dark/{z}/{x}/{y}.png"
		}
	},

	prjInfo: { //项目信息
		name: "v0130",
		dbType: "postgres",
		provinceName: '甘肃省',
		provinceCode: '620000',
		cityName: "兰州市",
		cityCode: "620100",
		cityPyName: 'lanzhou',
		stationName: "广雅中学",
		stationCode: "440100051",
		refreshTime: {
			hour: 30,
			day: 6 * 60
		},
		monitorUpdateHour:50,//实测更新的小时临界分钟数
		area: [{
			label: "中国",
			value: "1",
			checked: false,
			extent: [
				6992050.6876, -661404.7595,
				18364690.4062, 8183643.7405
			]
		}, {
			label: "中国东南部",
			value: "2",
			checked: false,
			extent: [
				10565557.7366, 1277367.4574,
				14410593.07, 4379964.4954
			]
		}, {
			label: "中国南部",
			value: "3",
			checked: false,
			extent: [
				11436001.5705, 1949147.5912,
				13498420.7576, 3594187.2253

			]
		}, {
			label: "广东省",
			value: "4",
			checked: true,
			extent: [
				12155584.1173, 2262273.9652,
				13080739.1043, 2969450.4048
			]
		}],

		monitorExtent: [
			12206731.749808,
			2298128.768891,
			13059796.050892,
			2939353.017067
		],

		model: [{
			label: "NAQPMS",
			value: "naqpms",
			checked: true,
			interval: [
				7,
				7,
				7,
				4
			],
			hasFigure: true
		}, {
			label: "CMAQ",
			value: "cmaq",
			interval: [
				7,
				7,
				7,
				4
			],
			hasFigure: true
		}, {
			label: "CAMx",
			value: "camx",
			interval: [
				7,
				7,
				4,
				4
			],
			hasFigure: true
		}, {
			label: "WRFCH",
			value: "wrfch",
			interval: [
				7,
				7,
				7,
				4
			]
		}],

		predictionHour: [{
			label: "20时",
			value: "20",
			diff: 1
		}],

		WebSocketServer: {
			url: "ws://192.168.1.130:8901"
		},
		imgServer: {
			url: "http://10.102.50.29/imgServer/"
		},
		ImgHttpServer: {
			url: "proxy/proxy.ashx?http://192.168.1.130:8001"
		},
		OldPicWebSocketServer: {
			url: "ws://10.102.50.24:8979"
		},
		OldPicImgHttpServer: {
			url: "http://10.102.50.24:8978"
		},
		gradeColors: [
			"#B5B5B5",
			"#00e400",
			"#FFFF00",
			"#ff7e00",
			"#FF0000",
			"#99004c",
			"#7e0023"
		],

		chartColors: {
			naqpms: "red",
			camx: "blue",
			cmaq: "green",
			wrfch: "black",
			实测: "#f3a457"
		}

	}
};

export {
	gbs,
	cbs
};

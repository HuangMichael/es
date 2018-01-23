/**
 * Created by kangming on 2017/08/07.
 */
import * as sha from 'libs/SHA256.js';
import {dateUtils} from "../../utils/dateUtils";

export default {
	name: 'login',
	data() {
		return {
			loginBtnLoading:false,
			todayDate:'',
			airQobj:{
				cityName:this.$$appConfig.prjInfo.cityName,
				provinceName:this.$$appConfig.prjInfo.provinceName
			
			},
			apiUrl:this.$$appConfig.prjInfo.webApi.url,
			nowTime:'',
			weatherData:{},
			winSize: {
				width: '',
				height: ''
			},
	
			formOffset: {
				position: 'absolute',
				left: '',
				top: ''
			},

			remumber: this.$store.state.user.remumber,

			register: false,

			login_actions: {
				disabled: false
			},

			data: {
				name: '',
				password: '',
				// token: ''
			},

			userInfoData: {
				userinfo: {
					web_routers: [],
					access: [],
					info: {},
					un: '',
					pw: '',
					token: null
				}

			},

			rule_data: {
				name: [{
					validator: (rule, value, callback) => {
						if (value === '') {
							callback(new Error('请输入用户名'));
						} else {
							if (/^[a-zA-Z0-9_-]{1,16}$/.test(value)) {
								callback();
							} else {
								callback(new Error('用户名至少6位,由大小写字母和数字,-,_组成'));
							}
						}
					},
					trigger: 'blur'
				}],
				password: [{
					validator: (rule, value, callback) => {
						if (value === '') {
							callback(new Error('请输入密码'));
						} else {
							// if (!(/^[a-zA-Z0-9_-]{6,16}$/.test(value))) {
							// 	callback(new Error('密码至少6位,由大小写字母和数字,-,_组成'));
							// } else {
							// 	if (this.register === true) {
							// 		if (this.data.repassword !== '') {
							// 			this.$refs.data.validateField('repassword');
							// 		}
							// 	}
							callback();
							// }

						}
					},
					trigger: 'blur'
				}],
				repassword: [{
					validator: (rule, value, callback) => {
						if (value === '') {
							callback(new Error('请再次输入密码'));
						} else if (value !== this.data.password) {
							callback(new Error('两次输入密码不一致!'));
						} else {
							callback();
						}
					},
					trigger: 'blur'
				}]
			}
		}
	},
	methods: {
		setSize() {
			this.winSize.width = this.$$lib_$(window).width() + "px";
			this.winSize.height = this.$$lib_$(window).height() + "px";

			this.formOffset.left = (parseInt(this.winSize.width) / 2 - 175) + 'px';
			this.formOffset.top = (parseInt(this.winSize.height) / 2 - 178) + 'px';
//			this.setCardMouseMove();
			
		},
		getWeaData(){
			
		let obj={};
		
			
		
			this.$$lib_$.get(this.apiUrl+"/api/CityActually/QueryCityDataOnLineByName",{cityName:"nanjing"}, (data)=>{
				let res=data["nanjing"]["city"];
				if(res!=undefined){
					for(let i=0;i<res.length;i++){
					
					if(res[i].cityname&&res[i].cityname==="南京市"){
						obj=res[i];
						this.weatherData=res[i];
						
						
					}
				}
				}
				
			});
			setInterval(()=>{
			this.todayDate=dateUtils.dateToStr('YYYY/MM/DD',new Date());
			this.nowTime={
				h:dateUtils.dateToStr('HH',new Date()),
				m:dateUtils.dateToStr('mm',new Date()),
				s:dateUtils.dateToStr('ss',new Date())
			}
			},1000);
			
			
		},
		 getImgSrc(state) {
                if (state == '')
                    return '';
                return "static/images/weather/" + state + ".gif";
           },
		setWatchShow(str,index){
			if(str!=undefined){
				let ss=str.substr(index, 1);
				return "num"+ss
			}
			
		},
		onLogin(ref, type) {
			
			if (type && this.register === true) {
				this.$message.error('请输入确认密码');
				return;
			}
			this.$refs[ref].validate((valid) => {
				if (valid) {
					this.login_actions.disabled = true;
					//服务端登录验证优先级：用户名必须，其次先取token，不存在时再取密码
					let shaStr = sha.SHA256(this.data.password);

					this.data.password = shaStr.toUpperCase();
					this.$$login({
						data: this[ref],
						fn: data => {


							this.userInfoData = {
								userinfo: {
									web_routers: [],
									access: [],
									info: data[0] || {},
									un: this[ref].name,
									pw: this.data.password,
									token: null
								}

							};

							// alert(data);
							// 登录成功之后，验证是否记住密码，如果记住密码，本地保存记住信息
							// 如果没有记住，就初始化本地记住信息
							if (this.remumber.remumber_flag === true) {
								this.$store.dispatch('update_remumber', {
									remumber_flag: this.remumber.remumber_flag,
									remumber_login_info: {
										username: this[ref].name
									}
								});
							} else {
								this.$store.dispatch('remove_remumber');
							}


							this.$set(this.userInfoData.userinfo, 'access', data[1]);
							try {
								this.userInfoData.userinfo.web_routers = data[1] ? data[1] : [];
							} catch (e) {
								this.userInfoData.userinfo.web_routers = [];
							}
							// try {
							// 	data.userinfo.api_routers = JSON.parse(data.userinfo.api_routers) ? JSON.parse(data.userinfo.api_routers) : {};
							// } catch (e) {
							// 	data.userinfo.api_routers = {};
							// }

							if (this.userInfoData.userinfo.access === null) {
								this.$alert('未给您授予访问系统功能模块的权限！', '提示', {
									confirmButtonText: '确定',
									type: 'warning'
								});
								this.login_actions.disabled = false;
								this.$router.push('/login');
							} else {
								this.$$getOAuthKeys({
									data: {}, fn: (data) => this._getToken(data), tokenFlag: true, errFun: (err) => {

										this.login_actions.disabled = false;
									}
								});
							}


							// this.$store.dispatch('update_userinfo', {
							// 	userinfo: this.userInfoData.userinfo
							// }).then(() => {
							// 	this.login_actions.disabled = false;
							// 	if (this.userInfoData.userinfo.default_web_routers) {
							// 		this.$router.push(this.userinfo.default_web_routers);
							// 	} else {
							// 		if (this.userInfoData.userinfo.access.indexOf('/home') > -1)
							// 			this.$router.push('/home');
							// 		else
							// 			this.$router.push(this.userInfoData.userinfo.access[0]);
							// 	}
							// });


						},
						errFn: (err) => {
							this.login_actions.disabled = false;
						},
						tokenFlag: true
					});
				}

				// this.$router.push('/home');
			});
		},

		_getToken(data) {


			let jsonData = JSON.parse(data.PublicKey);

			setMaxDigits(129);
			let key = new RSAKeyPair(jsonData.Exponent, "", jsonData.Modulus);
			let pwd = encryptedString(key, this.userInfoData.userinfo.pw);
			let un = encryptedString(key, this.userInfoData.userinfo.un);

			let option = {
				grant_type: 'password',
				username: un + '#' + data.Id,
				password: pwd + '#' + data.Id

			};
			
			let _this = this;
			this.$$lib_$.post(this.apiUrl+"/token", option, function (data) {
				_this.userInfoData.userinfo.token = data;
				_this.$delete(_this.userInfoData.userinfo, 'pw');
				console.log(_this.userInfoData.userinfo);
				_this.$store.dispatch('update_userinfo', {
					userinfo: _this.userInfoData.userinfo
				}).then(() => {

					_this.login_actions.disabled = false;
					if (_this.userInfoData.userinfo.info.default_page !== '' && _this.userInfoData.userinfo.access.indexOf(_this.userInfoData.userinfo.info.default_page) > -1) {
						_this.$router.push(_this.userInfoData.userinfo.info.default_page);
					} else {

						if (_this.userInfoData.userinfo.access.indexOf('/home') === -1) {
							_this.$router.push(_this.userInfoData.userinfo.access[0]);
						}
						else {
							_this.$router.push('/home');
						}
					}
				});
			}).fail(function (response) {
				_this.$alert(JSON.parse(response.responseText)['error_description'], '发生错误', {
					confirmButtonText: '确定',
					type: 'error'
				});
				_this.login_actions.disabled = false;
			});
		},

		onRegister(ref) {
			this.$refs[ref].validate((valid) => {
				if (valid) {
					this.login_actions.disabled = true;
					this.$$api_user_register({
						data: this[ref],
						fn: data => {
							this.login_actions.disabled = false;
							this.$message.success('注册成功，请登录。');
							this.toggleStatus(false);
						},
						errFn: () => {
							this.login_actions.disabled = false;
						},
						tokenFlag: true
					});
				}
			});
		},

		resetForm(ref) {
			this.$refs[ref].resetFields();
		},

		toggleStatus(type) {
			this.register = type;
			if (this.register === true) {
				this.$set(this.data, 'repassword', '');
			} else {
				this.$delete(this.data, 'repassword');
			}
		},
		setCardMouseMove(){
			let cumulativeOffset = function cumulativeOffset(element) {
				
				var top = 0,
				    left = 0;
				do {
					top += element.offsetTop || 0;
					left += element.offsetLeft || 0;
					element = element.offsetParent;
				} while (element);
			
				return {
					top: top,
					left: left
				};
			};
			document.onmousemove = function (event) {
			let card = document.querySelector('.loginform');
			console.log(cumulativeOffset(card));
			var e = event || window.event;
			var x = (e.pageX - cumulativeOffset(card).left - 350 / 2) * -1 / 100;
			var y = (e.pageY - cumulativeOffset(card).top - 350 / 2) * -1 / 100;
			var matrix = [[1, 0, 0, -x * 0.00005], [0, 1, 0, -y * 0.00005], [0, 0, 1, 1], [0, 0, 0, 1]];
					card.style.transform = 'matrix3d(' + matrix.toString() + ')';
				};
			
			
		},
		 demo() {
				var engine = new RainyDay('canvas','demo1', window.innerWidth, window.innerHeight);
				engine.gravity = engine.GRAVITY_NON_LINEAR;
				engine.trail = engine.TRAIL_DROPS;

				engine.rain([
//					engine.preset(0, 2, 500)
					engine.preset(0, 0, 0)
				]);

//				engine.rain([
//					engine.preset(3, 3, 0.88),
//					engine.preset(5, 5, 0.9),
//					engine.preset(6, 2, 1),
//				], 100);
				
 			},
 			onResize(){
	 				this.$nextTick(()=>{
						setTimeout(()=>{
							this.demo();
							
						},0)	
					});
 			}
	},
	created() {
		this.setSize();
		this.$$resize(this.onResize);
		this.onResize();
		this.getWeaData();		
		
		this.$$lib_$(window).resize(() => {
			this.setSize();
			
		});
		
	},
	mounted() {
		// this.toggleStatus(true);
		// console.log(this.remumber);

		//如果上次登录选择的是记住密码并登录成功，则会保存状态，用户名以及token
		if (this.remumber.remumber_flag === true) {
			this.data.name = this.remumber.remumber_login_info.username;
			this.data.password = this.remumber.remumber_login_info.token.substring(0, 16);
			this.$set(this.data, 'token', this.remumber.remumber_login_info.token);
		}
	}
}

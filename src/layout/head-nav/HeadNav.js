import * as sha from 'libs/SHA256.js';

export default {
	name: 'head-nav',
	data() {
		return {

			headerHt: this.$$appConfig.layout.headerHeight,
			footerHt: this.$$appConfig.layout.footerHeight,

			dialog: {
				show_access: false,
				show_set: false,
				show_pass: false,
				title: '修改密码',
				user_info: {
					name: this.$store.state.user.userinfo.info.name,
					oldPassword: '',
					newPassword: '',
					password_confirm: ''
				},

				set_info: {
					login_style: '',
					disabled_update_pass: [],
					select_users: []
				},

				user_info_rules: {
					oldPassword: [{
						required: true,
						message: '旧密码不能为空！',
						trigger: 'blur'
					}],
					newPassword: [{
						required: true,
						message: '新密码不能为空！',
						trigger: 'blur'
					}, {
						trigger: 'blur',
						validator: (rule, value, callback) => {
							if (value === '') {
								callback(new Error('请再次输入密码'));
							} else {
								if ('' !== this.dialog.user_info.newPassword) {
									this.$refs.user_info.validateField('password_confirm');
								}
								callback();
							}
						}
					}],
					password_confirm: [{
						required: true,
						message: '确认密码不能为空！',
						trigger: 'blur'
					}, {
						trigger: 'blur',
						validator: (rule, value, callback) => {
							if (value === '') {
								callback(new Error('请再次输入密码'));
							} else if (value !== this.dialog.user_info.newPassword) {
								callback(new Error('两次输入密码不一致!'));
							} else {
								callback();
							}
						}
					}],
				}
			}
		}
	},
	mounted() {
	},
	methods: {
		/**
		 * 退出登录
		 */
		logout() {
			this.$confirm('你确定退出登录么?', '确认退出', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				this.$store.dispatch('remove_userinfo').then(() => {
					this.$router.push('/login');
				});
			});
		},

		/**
		 * 弹出框-修改密码或者系统设置
		 * @param {string} cmditem 弹框类型
		 */
		setDialogInfo(cmditem) {
			if (!cmditem) {
				console.log('test');
				this.$message('菜单选项缺少command属性');
				return;
			}
			switch (cmditem) {
				case 'info':
					this.$router.push({
						path: '/mng/edit',
						query: {
							id: this.$store.state.user.userinfo.info['Id']
						}
					});
					break;
				case 'pass':
					this.dialog.show_pass = true;
					this.dialog.title = '修改密码';
					this.dialog.user_info = {
						name: this.$store.state.user.userinfo.info.name,
						oldPassword: '',
						newPassword: '',
						password_confirm: ''
					};
					break;
				// case 'set':
				// 	this.onGetSetting();
				// 	this.dialog.show_set = true;
				// 	this.dialog.title = '系统设置';
				// 	break;
				case 'logout':
					this.logout();
					break;
			}
		},

		/**
		 * 修改密码
		 * @param  {object} userinfo 当前修改密码的表单信息
		 */
		updUserPass(userinfo) {
			this.$refs[userinfo].validate((valid) => {
				if (valid) {
					this.$$updatePsw({
						data: {
							id: this.$store.state.user.userinfo.info.id,
							oldPassword: sha.SHA256(this.dialog[userinfo].oldPassword).toUpperCase(),
							newPassword: sha.SHA256(this.dialog[userinfo].newPassword).toUpperCase()
						},
						fn: data => {
							if (data === true) {
								this.dialog.show_pass = false;
								this.$message.success('修改密码成功！');
							}

						}
					});
				}
			});
		}
	}
}

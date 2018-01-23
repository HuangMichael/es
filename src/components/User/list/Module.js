import * as sha from 'libs/SHA256.js';

export default {
	name: 'list',
	data() {
		return {
			role_list: [], //角色列表
			user_list: [], //用户列表数组
			isEdit: false,

			//详情弹框信息
			dialog: {
				show: false,
				user_info: {}
			},

			dialog_add: {
				show: false,
				userinfo: {}
			},


			rule_data: {
				name: [{
					required: true,
					validator: (rule, value, callback) => {
						if (value === '') {
							callback(new Error('请输入用户名称'));
						} else {
							// if (/^[a-zA-Z0-9_-]{1,16}$/.test(value)) {
							callback();
							// } else {
							// 	callback(new Error('用户名至少6位,由大小写字母和数字,-,_组成'));
							// }
						}
					},
					trigger: 'blur'
				}],

				role_id: [{
					required: true,
					validator: (rule, value, callback) => {
						if (value === '') {
							callback(new Error('请选择用户角色'));
						} else {
							// if (/^[a-zA-Z0-9_-]{1,16}$/.test(value)) {
							callback();
							// } else {
							// 	callback(new Error('用户名至少6位,由大小写字母和数字,-,_组成'));
							// }
						}
					},
					trigger: 'blur'
				}],

				email:[{
					type: 'email',
					message: '邮箱格式不正确！',
					trigger: 'blur'
				}]
			}

		}
	},
	methods: {

		/**
		 * 点击添加用户按钮事件
		 */
		onBtnAddUserEvt() {
			this.isEdit = false;
			this.dialog_add.userinfo = {
				role_id: ''
			};
			this.dialog_add.show = true;
		},

		/**
		 * 更新或新增用户
		 */
		onAddUser() {
			if (this.isEdit) {
				this.$refs['userinfo'].validate((valid) => {
					if (valid) {
						this.$confirm('您确定要修改 ' + this.dialog_add.userinfo.name + ' 用户信息么?', '修改用户信息', {
							confirmButtonText: '确定',
							cancelButtonText: '取消',
							type: 'warning'
						}).then(() => {
							let tmpData = {
								id: this.dialog_add.userinfo.id,
								name: this.dialog_add.userinfo.name,
								description: this.dialog_add.userinfo.description,
								areacode: "aa",
								modearea: '1',
								email: this.dialog_add.userinfo.email,
								mobile: this.dialog_add.userinfo.mobile,
								role_id: this.dialog_add.userinfo.role_id
							};
							this.$$updateUser({
								data: tmpData,
								fn: data => {
									if (data) {
										this.dialog_add.show = false;
										this.getList();
									}
								},
								errFun: err => {
								}
							});
						});
					}
				})

			}
			else {

				this.$refs['userinfo'].validate((valid) => {
					if (valid) {
						let shaStr = sha.SHA256('123456');
						let tmpData = {
							name: this.dialog_add.userinfo.name,
							description: this.dialog_add.userinfo.description,
							areacode: "aa",
							modearea: '1',
							email: this.dialog_add.userinfo.email,
							mobile: this.dialog_add.userinfo.mobile,
							role_id: this.dialog_add.userinfo.role_id,
							password: shaStr.toUpperCase(),
							viewothercityinfo: 0,
							attention_citytree: '',
							attention_stationtree: '',
							department: '',
							precinctname: '',
							edit: '0',
							default_page: ''
						};
						this.$$addUser({
							data: tmpData,
							fn: data => {
								if (data) {
									this.dialog_add.show = false;
									this.getList();
								}
							},
							errFun: err => {
							}
						});
					}
				})
			}
		},

		/**
		 * 设置权限
		 */
		onEditUser(user, index, list) {
			this.isEdit = true;
			this.dialog_add.userinfo = user;
			this.dialog_add.show = true;
		},

		/**
		 * 重置密码为123456
		 */
		onResetPw(user) {
			let shaStr = sha.SHA256('123456');

			this.$confirm('您确定重置用户 ' + user.name + ' 的密码为123456吗?', '重置密码', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				this.$$updateUser({
					data: {
						id: user.id,
						password: shaStr.toUpperCase()
					},
					fn: data => {
						if (data)
							this.getList();
					}
				});
			});
		},


		/**
		 * 删除用户事件
		 * @param  {object || boolean} user  当前用户信息对象
		 */
		onDeleteUser(user) {

			console.log(user);
			let id = user.id;
			this.$confirm('您确定删除用户 ' + user.name + ' 么?', '删除用户', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'warning'
			}).then(() => {
				this.$$deleteUser({
					data: {
						id: id
					},
					fn: data => {
						if (data)
							this.getList();
					}
				});
			});

		},


		/**
		 * 查看用户信息事件
		 * @param  {object} user 当前用户信息对象
		 */
		onSelectUser(user) {
			this.dialog.show = true;
			this.dialog.user_info = user;
		},


		/**
		 * 获取用户信息列表方法
		 */
		getList() {

			this.$$getRoles({
				data: {
					fieldName: '*',
					value: '*'
				},
				fn: data => {
					this.role_list = data;

					this.$$getUsers({
						data: {
							fieldName: '*',
							value: '*'
						},
						fn: data => {
							data.forEach((item) => {
								let tmp = this.role_list.filter((r) => {
									return r.id == item.role_id;
								});
								if (tmp.length > 0)
									item.rolename = tmp[0]['name'];
								else
									item.rolename = '';
							});
							this.user_list = data;
						},
						errFun: err => {
						}
					});

				},
				errFun: err => {
				}
			});

		}
	},

	mounted() {
		this.getList();

		// this.initRouters();

		//test dialog

		/* setTimeout(() => {
             this.onSelectUser(this.user_list[0]);
         }, 600);*/
	}
}

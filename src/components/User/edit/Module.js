export default {
	name: 'user',
	data() {
		return {
			user_data: {
				default_page: ''
			},
			user_rules: {
				email: [{
					message: '邮箱不能为空！',
					trigger: 'blur'
				}, {
					type: 'email',
					message: '邮箱格式不正确！',
					trigger: 'blur'
				}],
				name: [{
					required: true,
					message: '用户名不能为空！',
					trigger: 'blur'
				}]
			},

			//tree选中
			checkeds: {
				web_routers: {},
			},

			//tree数据属性
			props: {
				web_routers: {
					children: 'children',
					label: 'name'
				},
				api_routers: {
					children: 'list',
					label: 'name'
				}
			},

			//tree数据
			datas: {
				//web页面路由数据-tree
				web_routers: [],
			},


			routes: [],

			model: {
				area: [{
					label: '全国',
					value: '1'
				}, {
					label: '中东部',
					value: '2'
				}, {
					label: '京津冀',
					value: '3'
				}]
			}
		}
	},
	methods: {
		save_user(userdata) {
			this.$refs[userdata].validate((valid) => {
				if (valid) {
					let tmpCheckeds = [];
					let currSelectedNode = this.$refs.webRouters.getCheckedNodes(true);//获取当前选中的子节点
					currSelectedNode.forEach((item) => {//子节点被选中时同时需要获取父节点
						tmpCheckeds.push(item.access);
						if (item.parent != '' && tmpCheckeds.indexOf(item.parent) === -1) {
							tmpCheckeds.push(item.parent);
						}
					});

					this.$delete(this[userdata], 'password');
					this.$delete(this[userdata], 'userfuns');
					this.$set(this[userdata], 'funs', tmpCheckeds);


					this.$$updateUser({
						data: this[userdata],
						fn: data => {
							if (data) {
								this.$alert('修改用户信息成功,若修改了功能菜单需重新登录!', '提示', {
									confirmButtonText: '确定',
									type: 'success'
								});
							}
						},
						errFun: err => {

						}
					});
				}
			});
		},


		getView() {
			this.$$getUsers({
				data: {
					fieldName: 'id',
					value: this.$store.state.user.userinfo.info.id
				},
				fn: data => {
					this.user_data = data.length > 0 ? data[0] : {};

					if (this.user_data && this.user_data.role_id != undefined) {
						this.$$getRoles({
							data: {
								fieldName: 'id',
								value: this.user_data.role_id
							},
							fn: data => {
								if (data.length > 0) {
									this.datas.web_routers = [];
									this.checkeds.web_routers = {};
									//获取赋予给当前用户的权限信息
									this._parseAccess(this.routes, data[0]['rolefuns'], this.datas.web_routers, this.checkeds.web_routers);


									let currAccess = [];
									for (let i = 0; i < this.user_data['userfuns'].length; i++) {
										let tmp = this.user_data['userfuns'][i];
										let num = parse(tmp, this.user_data['userfuns']);
										if (num === 1)
											currAccess.push(tmp);
									}

									function parse(substr, arr) {
										let num = 0;
										arr.forEach((a) => {
											if (a.toString().indexOf(substr) >= 0)
												num++;
										});
										return num;
									}

									this.$refs.webRouters.setCheckedKeys(currAccess);
								}
							},
							errFun: err => {
							}
						});
					}


				},
				errFun: err => {
				}
			});
		},

		/**
		 * 初始化组装路由
		 * @return {array} 路由数组
		 */
		initRouters() {
			var routes = this.$router.options.routes;
			for (var i = 0; i < routes.length; i++) {
				if (routes[i].hidden !== true && routes[i].children && routes[i].children.length) {
					var tempObj = {},
						module = routes[i],
						menus = module.children;
					tempObj.name = module.name;
					tempObj.path = module.path;
					tempObj.access = module.path;

					tempObj.children = [];
					tempObj.parent = '';
					if (menus.length == 1) {
						this.routes.push(tempObj);
					} else {
						for (var j = 0; j < menus.length; j++) {
							if (menus[j].hidden !== true) {
								if (menus[j].children && menus[j].children.length) {
									var tempChildObj = {},
										menu = menus[j],
										pages = menu.children;
									tempChildObj.name = menu.name;
									tempChildObj.path = '/' + menu.path;
									tempChildObj.access = tempObj.path + '/' + menu.path;
									tempChildObj.parent = tempObj.path;
									tempChildObj.children = [];
									for (var k = 0; k < pages.length; k++) {
										if (pages[k].hidden !== true) {
											var tempPageObj = {},
												page = pages[k];
											tempPageObj.name = page.name;
											tempPageObj.path = '/' + page.path;
											tempPageObj.access = tempObj.path + '/' + menu.path + '/' + page.path;
											tempPageObj.parent = tempObj.path + '/' + menu.path;
											tempChildObj.children.push(tempPageObj);
										}
									}
									tempObj.children.push(tempChildObj);
								} else {
									let tempChildNonChildObj = {},
										menu = menus[j];
									tempChildNonChildObj.name = menu.name;
									tempChildNonChildObj.path = '/' + menu.path;
									tempChildNonChildObj.parent = tempObj.path;
									tempChildNonChildObj.access = tempObj.path + '/' + menu.path;
									tempObj.children.push(tempChildNonChildObj);
								}

							}
						}
						this.routes.push(tempObj);
					}
				}
			}
		},

		/**
		 * 递归根据当前用户功能权限构建功能权限树
		 * @param items 权限列表
		 * @param funs 当前用户权限列表
		 * @param data 用于填充最终数据的数组
		 * @param list 用于填充权限名称对象
		 * @private
		 */
		_parseAccess(items, funs, datas, list) {
			items.forEach((item) => {
				let obj = {};
				if (funs.indexOf(item.access) > -1) {
					obj.access = item.access;
					obj.path = item.path;
					obj.name = item.name;
					obj.parent = item.parent;
					obj.children = [];

					datas.push(obj);
					if (item.children == undefined || item.children.length == 0)
						this.$set(list, item.access, item.name);
					if (item.children && item.children.length > 0) {
						this._parseAccess(item.children, funs, obj.children, list);
					}
				}
			});
		},

		/**
		 * 改变web页面选项时触发
		 * @param data  当前改变的对象
		 * @param selfIsChecked 当前是否选中
		 */
		checkChangeWebRouters(data, selfIsChecked) {
			if (selfIsChecked === true && !this.checkeds.web_routers[data.access] && (!data.children || data.children.length === 0)) {

				this.$set(this.checkeds.web_routers, data.access, data.name);
			}

			if (selfIsChecked === false && this.checkeds.web_routers[data.access]) {
				this.$delete(this.checkeds.web_routers, data.access);
				if (data.access === this.user_data.default_page) {
					this.user_data.default_page = '';
				}
			}
		}
	},
	mounted() {
		this.initRouters();//获取所用功能菜单信息
		this.getView();
	},

	activated() {
		this.getView();
	},

	deactivated() {

	}
}

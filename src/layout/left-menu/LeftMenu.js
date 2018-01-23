export default {
	name: 'left-menu',
	data() {

		return {
			menu_list: [],
			win_size: {
				height: '',
			},
			leftWidth: 0,
			iconSize: '18px',
			headerHt: this.$$appConfig.layout.headerHeight,
			footerHt: this.$$appConfig.layout.footerHeight

		}
	},
	methods: {
		setSize() {
			this.win_size.height = this.$$lib_$(window).height() + "px";
		},
		toggleMenu() {
			this.$store.dispatch(this.$store.state.leftmenu.menu_flag ? 'set_menu_close' : 'set_menu_open');
			this.leftWidth = this.$store.state.leftmenu.width;
			this.iconSize = this.$store.state.leftmenu.menu_flag ? '18px' : '22px';
			this.$root.eventBus.$emit('toggleMenu');
		},
		updateCurMenu(route) {
			var route = route || this.$route;
			if (route.matched.length) {
				var rootPath = route.matched[0].path,
					fullPath = route.path;
				this.$store.dispatch('set_cur_route', {
					rootPath,
					fullPath
				});
				var routes = this.$router.options.routes;
				for (var i = 0; i < routes.length; i++) {
					if (routes[i].path === rootPath && !routes[i].hidden) {
						this.menu_list = routes[i].children;

						break;
					}
				}

				if (this.menu_list.length==1&&!this.menu_list[0].children) {
					this.leftWidth = '0px';
				} else {
					this.leftWidth = this.$store.state.leftmenu.width;
				}
			} else {
				this.$router.push('/404');
			}
		}
	},
	created() {

		this.setSize();
		this.$$lib_$(window).resize(() => {
			this.setSize();
		});
		this.updateCurMenu();
	},
	mounted() {
		// console.log(this.$store.state.user.userinfo.access);
	},
	watch: {
		$route(to, from) {
			this.updateCurMenu(to);
		}
	}
}

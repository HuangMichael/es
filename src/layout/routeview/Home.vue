<template>
	<div class="home">
		<head-nav></head-nav>
		<div class="left-fixed-right-auto">
			<left-menu></left-menu>
			<div class="right-content" :style="{'bottom':footerHt+'px'}">
				<div class="content" :style="{left:$store.state.leftmenu.width,'top':headerHt+'px'}">
					<!--<bread></bread>-->
					<keep-alive>
						<router-view></router-view>
					</keep-alive>
				</div>
			</div>
			<bootom-footer></bootom-footer>
		</div>
	</div>
</template>
<script>
	import HeadNav from '../head-nav-v1/HeadNav.vue';
	import LeftMenu from '../left-menu/LeftMenu.vue';
	import Bread from '../bread/Bread.vue';
	import BootomFooter from '../footer/Module.vue';

	export default {
		name: 'home',
		components: {
			HeadNav, LeftMenu, Bread, BootomFooter
		},
		data() {
			return {
				headerHt:this.$$appConfig.layout.headerHeight,
				footerHt:this.$$appConfig.layout.footerHeight
			}

		}
	}
</script>
<style scoped lang='less'>


	.content {
		position: absolute;
		right: 0;
		bottom: 0;
		overflow: auto;
	}

	.right-content {
		position: absolute;
		/*bottom: 40px;*/
		top: 0;
		left: 0;
		right: 0;
		/*margin-bottom: 60px;*/
	}
</style>

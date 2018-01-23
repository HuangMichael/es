<template>
	<div class="left" :style="{'height':win_size.height,'width':leftWidth,'top':headerHt+'px'}" id='admin-left'>
		<div id='left-menu'>
			<div class="toggle-menu"
				 @click='toggleMenu'
				 :style='{display:leftWidth=="0px"?"none":""}'>
				<i :class='[{"el-icon-arrow-left":$store.state.leftmenu.menu_flag},{"el-icon-arrow-right":!$store.state.leftmenu.menu_flag}]'></i>
			</div>
			<el-row class='tac'
					v-for="(route,index) in $router.options.routes"
					:key='route.path'
					v-if='!route.hidden && $route.matched.length && $route.matched[0].path===route.path'>


				<el-col :span="24">
					<el-menu
						class="el-menu-vertical-demo"
						theme="dark"
						:default-active="$route.path"
						unique-opened
						router>
						<template
							v-for="(item,index) in route.children">

							<!--v-if="!item.hidden && $store.state.user.userinfo.web_routers.indexOf(route.path+'/'+item.path)>-1">-->

							<el-submenu
								:index="item.path"
								v-if="item.children"
								>
								<template
									slot="title">
									<el-tooltip
										class="item"
										effect="dark"
										placement="right"
										:disabled="$store.state.leftmenu.menu_flag"
										:style="{'padding-left':$store.state.leftmenu.menu_flag? '5px' : '2px'}"
										:content="item.name">
										<i :class="'fa fa-'+item.icon" class="icon-menu"
										   :style="{'font-size':iconSize}"></i>
									</el-tooltip>
									<span

										class='menu-name'
										v-if="$store.state.leftmenu.menu_flag">{{item.name}}
										<!-- {{route.path+'/'+item.path}} --></span>
								</template>

								<!-- v-if="!child.hidden && (($store.state.user.userinfo.access_status===1 && $store.state.user.userinfo.web_routers[route.path+'/'+item.path+'/'+child.path]) || $store.state.user.userinfo.access_status!==1)" -->
								<el-menu-item
									v-for='(child,cindex) in item.children'
									:key='child.path'
									:style="{'padding-left':$store.state.leftmenu.menu_flag? '40px' : '12px'}"
									:index='$store.state.router.headerCurRouter+"/"+item.path+"/"+child.path'>
									<!--v-if="!child.hidden &&$store.state.user.userinfo.web_routers.indexOf(route.path+'/'+item.path+'/'+child.path)>-1"-->

									<el-tooltip
										class="item"
										effect="dark"
										placement="right"
										:disabled="$store.state.leftmenu.menu_flag"
										:content="child.name">
										<i :class="'fa fa-'+child.icon" class="sub-icon-menu"
										   :style="{'font-size':iconSize}"></i>
									</el-tooltip>
									<span
										class='sub-menu-name'
										v-if="$store.state.leftmenu.menu_flag">{{child.name}}
										<!-- {{route.path+'/'+item.path+'/'+child.path}} --></span>
								</el-menu-item>
							</el-submenu>

							<el-menu-item v-else
										  :style="{'padding-left':$store.state.leftmenu.menu_flag? '15px' : '12px'}"
										  :index='$store.state.router.headerCurRouter+"/"+item.path'>
								<el-tooltip
									class="item"
									effect="dark"
									placement="right"
									:disabled="$store.state.leftmenu.menu_flag"
									:content="item.name">
									<i :class="'fa fa-'+item.icon" class="icon-menu"
									   :style="{'font-size':iconSize}"></i>
								</el-tooltip>
								<span
									class='menu-name'
									v-if="$store.state.leftmenu.menu_flag">{{item.name}}
									<!-- {{route.path+'/'+item.path+'/'+child.path}} --></span>
							</el-menu-item>
						</template>
					</el-menu>
				</el-col>
			</el-row>

		</div>
	</div>
</template>

<script>
	import LeftMenu from './LeftMenu.js';
	export default LeftMenu;
</script>

<style scoped lang='less'>
	@import url(./assets/style/LeftMenu.less);
	.left{
		display: none;
	}
</style>

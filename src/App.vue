<template>
    <div id="app"
		 v-loading="$store.state.global.ajax_loading"
		 v-loading.fullscreen=false
		 v-loading.fullscreen.lock=false
		 element-loading-text="拼命加载中">
		<keep-alive>
			<router-view></router-view>
		</keep-alive>
        <!--<transition name="bounce">-->

        <!--</transition>-->

		<img src="static/mask/d01.png"  style="display:none" />
		<img src="static/mask/d02.png"  style="display:none"/>
		<img src="static/mask/d03.png"  style="display:none"/>
		<img src="static/mask/js.png"  style="display:none"/>
    </div>
</template>

<script>
	export default {
		name      : 'app',
		components: {},
		data(){
			return {

            }
		},
        methods:{
			init(){

            },
        },
        mounted(){
			this.init();
        },
        watch:{
        	$route(to,from){

            }
        }
	}
</script>

<style lang="less">
    *{
        /*-webkit-box-sizing: border-box;*/
        /*-moz-box-sizing: border-box;*/
        /*box-sizing: border-box;*/
        margin:0px;
        padding:0px;
    }

    .bounce-enter-active {
        animation: bounce-in .5s;
        -webkit-animation:bounce-in .5s;
    }

    .bounce-leave-active {
        animation: bounce-out .2s;
        -webkit-animation: bounce-out .2s;
    }

    @keyframes bounce-in {
        0% {
            transform: scale(0);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }

    @keyframes bounce-out {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(0.95);
        }
        100% {
            transform: scale(0);
        }
    }
</style>

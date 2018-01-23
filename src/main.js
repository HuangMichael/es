import 'babel-polyfill';
import Vue from 'vue';

// element-ui
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
// import 'assets/styles/ele-theme/index.css';
Vue.use(ElementUI, {size: 'small'});


//页面顶部进度条
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';


Vue.config.productionTip = true;
Vue.config.devtools = true;

import VueECharts from 'vue-echarts';

Vue.component('chart', VueECharts);
import 'assets/styles/index.css';
import 'font-awesome/css/font-awesome.css';


import router from 'router/';

import store from 'store/';
import App from './App';
import {dateUtils} from 'utils/dateUtils.js';


new Vue({
    el: '#app',
    data() {
        return {
            eventBus: new Vue()
        };
    },
    router,
    store,
    template: '<App/>',
    components: {App}
});

import 'register/';

router.beforeEach((to, from, next) => {
    NProgress.start();
    if (to.path === '/login') {
        next();
    }

    else if (!store.state.user.userinfo.token && to.path !== '/login') {//判断token是否存在

        next({path: '/login'});
        store.dispatch('remove_userinfo');
        NProgress.done();
    }
    // else if (store.state.user.userinfo.web_routers.indexOf(to.path) === -1)//未授权访问
    // {
    // 	let lastIdx = to.path.lastIndexOf('/');
    // 	let parentPath = to.path.substr(0, lastIdx);
    // 	let arr = parentPath.split('/');
    // 	let parentPathName = arr[arr.length - 1];
    // 	let flg = true;
    // 	for (let i = 0; i < store.state.user.userinfo.web_routers.length; i++) {
    // 		let currRouter = store.state.user.userinfo.web_routers[i];
    // 		let currRouterArr = currRouter.split('/');
    // 		if (currRouterArr.indexOf(parentPathName) > -1 && currRouter != parentPath) {
    // 			next(currRouter);
    // 			NProgress.done();
    // 			flg = false;
    // 			break;
    // 		}
    // 	}
    // 	if (flg) {
    // 		next(from);
    // 		NProgress.done();
    // 	}
    // }
    else  {
        let expiresData = dateUtils.strToDate(store.state.user.userinfo.token['.expires']);
        let diff = dateUtils.dateDiff('n', new Date(), expiresData);
        if (diff >= 2)//有效时间大于两分钟
            next();
        else if (to.path !== '/login') {
            next({path: '/login'});
            NProgress.done();
        }
        else
            next();
    }


});

router.afterEach(transition => {
    NProgress.done();
});

/**
 * Created by kangming on 2017/7/11.
 */
import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

import {Home, Content, Body, NotFound} from 'layout/';

const Login = () => import('components/login/login.vue');
const MonitorDisMap = () => import('components/MonitorMap/Module.vue');
const List = () => import('components/Role/list/Module.vue');
const userList = () => import('components/User/list/Module.vue');
const Edit = () => import('components/User/edit/Module.vue');
const Demo = () => import('components/Demo/Module.vue');
const MyDemo = () => import('components/myDemo/Module.vue');
const TimeRangeCompare = () => import('components/TimeRangeCompare/Module.vue');
const DateRangeContrast = () => import('components/DateRangeContrast/Module.vue');
const DateRangeCompare = () => import('components/DateRangeCompare/Module.vue');

const CityPrediction = () => import('components/CityPrediction/Module.vue');
const CityForecast = () => import('components/CityForecast/Module.vue');
const CityContrastAnlayse = () => import('components/CityContrastAnlayse/Module.vue');
const WeaActualImg = () => import('components/WeaActualImg/Module.vue');
const WeaPredictImg = () => import('components/WeaPredictImg/Module.vue');
const DistributionMap = () => import('components/DistributionMap/Module.vue');
const WeatherAnalysis = () => import('components/WeatherAnalysis/Module.vue');
const WrfForecastGIS = () => import('components/WrfForecastGIS/Module.vue');
const PatternAnalysisImg = () => import('components/PatternAnalysisImg/Module.vue');

export default new Router({
	routes: [
		{
			path: '/',
			name: 'Hello',
			hidden: true,
			redirect(to) {
				return 'login';
			}
		}, {
			path: '/login',
			name: '登录',
			hidden: true,
			component: Login
		}, {
			path: '/home',
			name: '首页',
			component: Body,
			redirect: '/home/',
			icon: 'icon-3clear-home',
			children: [{
				path: '/',
				name: '首页',
				icon: '',
				component: MonitorDisMap
			}]
		},

		{
			path: '/dismap',
			name: '区域形势',
			component: Body,
			redirect: '/dismap/',
			icon: 'icon-3clear-menu-b',
			children: [{
				path: '/',
				name: 'dismap',
				icon: 'bar-chart',
				component: DistributionMap
			}]
		},
		{
			path: '/citypredict',
			name: '城市预报',
			icon: 'icon-3clear-curve-e',
			component: Body,
			redirect: to => {
				return '/citypredict/day'
			},
			children: [{
				path: 'day',
				name: '日报分析',
				icon: 'bar-chart',
				component: CityPrediction
			}, {
				path: 'hour',
				name: '小时分析',
				icon: 'bar-chart',
				component: CityForecast
			}]
		},
		{
			path: '/timerangecompare',
			name: '时段对比',
			icon: 'icon-3clear-curve-e',
			component: Body,
			redirect: to => {
				return '/timerangecompare/hour'
			},
			children: [{
				path: 'hour',
				name: '时段对比',
				icon: 'bar-chart',
				component: DateRangeContrast
			}, {
				path: 'demo',
				name: 'demo',
				icon: 'bar-chart',
				component: MyDemo
			},
				{
					path: 'compare',
					name: '时段对比',
					icon: 'bar-chart',
					component: DateRangeCompare
				}
			]
		},
		{
			path: '/weamonitor',
			name: '气象实况',
			icon: 'icon-3clear-weather-d',
			component: Body,
			redirect: to => {
				return '/weamonitor/station'
			},
			children: [{
				path: 'station',
				name: '点位分析',
				icon: 'bar-chart',
				component: WeatherAnalysis
			}, {
				path: 'reference',
				name: '实况参考',
				icon: 'bar-chart',
				component: WeaActualImg
			}]
		},

		{
			path: '/weapredict',
			name: '气象预报',
			icon: 'icon-3clear-radar-c',
			component: Body,
			redirect: to => {
				return '/weapredict/day'
			},
			children: [{
				path: 'wrf',
				name: 'WRF预报',
				icon: 'bar-chart',
				component: WrfForecastGIS
			}, {
				path: 'fdownload',
				name: '预报参考',
				icon: 'bar-chart',
				component: WeaPredictImg
			}]
		},
		{
			path: '/citycontrast',
			name: '城市对比',
			icon: 'icon-3clear-city',
			component: Body,
			redirect: '/citycontrast/',
			children: [{
				path: '/',
				name: 'citycontrast',
				icon: 'icon-3clear-city',
				component: CityContrastAnlayse
			}]
		},
		{
			path: '/PatternAnalysisImg',
			name: '模式分析',
			icon: 'bar-chart',
			component: Body,
			redirect: '/PatternAnalysisImg/',
			children: [{
				path: '/',
				name: 'PatternAnalysisImg',
				icon: 'bar-chart',
				component: PatternAnalysisImg
			}]
		},
		{path: '*', hidden: true, component: NotFound}
	]
})

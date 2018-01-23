/**
 * Created by <kangming@3clear.com>
 * date: 2017/8/8
 * desc: 基础信息获取接口
 */

const CITY_API_PATH = '/api/CityActually/';
const STATION_API_PATH = '/api/StationActually/';
const OAUTH_API_PATH = '/api/OAuth/';
export default [
	{
		name: '通过城市编码读取对应的站点信息',
		method: 'getStationInfoByCityCode',
		path: STATION_API_PATH + 'QueryStationInfo',
		type: 'get',
	}, {
		name: '查询城市年目标值',
		method: 'getCityYearGoalValue',
		path: CITY_API_PATH + 'QueryCityYearGoalValue',
		type: 'get',
	}, {
		name: '查询站点年目标值',
		method: 'getStationYearGoalValue',
		path: STATION_API_PATH + 'QueryStationYearGoalValue',
		type: 'get',
	},
	{
		name: '获取城市或省份的天气实况信息',
		method: 'getWeatherInfoByPyName',
		path: CITY_API_PATH + 'QueryCityDataOnLineByName',
		type: 'get',
	},
	{
		name: '获取公钥',
		method: 'getOAuthKeys',
		path: OAUTH_API_PATH + 'GetOAuthKeys',
		type: 'get',
	},{
		name: '获取token',
		method: 'getToken',
		path: '/token',
		type: 'get',
	}

]

/**
 * Created by <kangming@3clear.com>
 * date: 2017/11/11
 * desc: 监测接口
 */

const CITY_API_PATH = '/api/CityActually/';
const STATION_API_PATH = '/api/StationActually/';
export default [
    {
        name: '获取城市监测信息',
        method: 'getCityTargetValueByMonitorDate',
        path: CITY_API_PATH + 'CityActuallyQuery',
        type: 'get'
    },
    {
        name: '获取站点监测信息',
        method: 'getStationTargetValueByMonitorDate',
        path: STATION_API_PATH + 'StationActuallyQuery',
        type: 'get'
    },
    {
        name: '获取站点气象监测信息',
        method: 'getStationWeatherValueByMonitorDate',
        path: STATION_API_PATH + 'StationActuallyWeatherCQuery',
        type: 'get'
    }
];

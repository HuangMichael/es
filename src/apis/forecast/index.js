/**
 * Created by <kangming@3clear.com>
 * date: 2017/11/01
 * desc: 预报接口
 */

const CITY_API_PATH = '/api/CityPrediction/';
const STATION_API_PATH = '/api/StationPrediction/';
const CITY_WRF_API_PATH = '/api/CityWrf/';
const STATION_WRF_API_PATH = '/api/StationWrf/';
export default [
    {
        name: '站点预报数据查询（产品时间）',
        method: 'getStationPredictionInfoByProductTime',
        path: STATION_API_PATH + 'StationPredictionByTimeQuery',
        type: 'get'
    },
    {
        name: '站点预报数据查询（预报时效）',
        method: 'getStationPredictionInfoByInterval',
        path: STATION_API_PATH + 'StationPredictionByIntevalQuery',
        type: 'get'
    },
    {
        name: '城市预报数据查询（产品时间）',
        method: 'getCityPredictionInfoByProductTime',
        path: CITY_API_PATH + 'CityPredictionByTimeQuery',
        type: 'get'
    },
    {
        name: '城市预报数据查询（预报时效）',
        method: 'getCityPredictionInfoByInterval',
        path: CITY_API_PATH + 'CityPredictionByIntevalQuery',
        type: 'get'
    },

    {
        name: '城市wrf预报数据查询（产品时间）',
        method: 'getCityWrfPredictionInfoByProductTime',
        path: CITY_WRF_API_PATH + 'CityWrfByTimeQuery',
        type: 'get'
    },
    {
        name: '城市wrf预报数据查询（预报时效）',
        method: 'getCityWrfPredictionInfoByInterval',
        path: CITY_WRF_API_PATH + 'CityWrfByIntevalQuery',
        type: 'get'
    },

    {
        name: '站点wrf预报数据查询（产品时间）',
        method: 'getStationWrfPredictionInfoByProductTime',
        path: STATION_WRF_API_PATH + 'StationWrfByTimeQuery',
        type: 'get'
    },
    {
        name: '站点wrf预报数据查询（预报时效）',
        method: 'getStationWrfPredictionInfoByInterval',
        path: STATION_WRF_API_PATH + 'StationWrfByIntevalQuery',
        type: 'get'
    }
];

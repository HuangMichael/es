import _ from 'lodash'
//utils
import {dateUtils} from "utils/dateUtils";

const GRADE_COLORS = ["#B5B5B5",
    "#00e400",
    "#FFFF00",
    "#ff7e00",
    "#FF0000",
    "#99004c",
    "#7e0023"];
export let utils = {
    getGradeInfo: function (aqi) {
        let level = "-";
        let color = "";
        let grade = 0;

        if (aqi == "-999" || aqi == "-999.0" || aqi == "-999.00" || aqi == undefined || aqi == null || aqi == "--" || aqi == "-" || aqi == "" || aqi == -999) {
            color = GRADE_COLORS[0];
            aqi = '-';
            grade = 0;
        } else if (aqi <= 50 && aqi >= 0) {
            level = "优";
            color = GRADE_COLORS[1];
            grade = 1;
        } else if (aqi > 50 && aqi <= 100) {
            level = "良";
            color = GRADE_COLORS[2];
            grade = 2;
        } else if (aqi > 100 && aqi <= 150) {
            level = "轻度污染";
            color = GRADE_COLORS[3];
            grade = 3;
        } else if (aqi > 150 && aqi <= 200) {
            level = "中度污染";
            color = GRADE_COLORS[4];
            grade = 4;
        } else if (aqi > 200 && aqi <= 300) {
            level = "重度污染";
            color = GRADE_COLORS[5];
            grade = 5;
        } else {
            level = "严重污染";
            color = GRADE_COLORS[6];
            grade = 6;
        }
        return {
            level: level,
            color: color,
            aqi: aqi,
            grade: grade
        };
    },
    deepCopy: function (obj) {
        // return JSON.parse(JSON.stringify(obj))
        if (typeof obj === "object") {
            if (_.isArray(obj)) {
                let newArr = [];
                for (let i = 0; i < obj.length; i++) newArr.push(obj[i]);
                return newArr;
            } else {
                let newObj = {};
                for (let key in obj) {
                    newObj[key] = this.deepCopy(obj[key]);
                }
                return newObj;
            }
        } else {
            return obj;
        }
    },
    //配合数组自带的sort进行按照数组中对象的属性进行自定义排序，支持多个属性排序
    sortByProps: function (item1, item2) {
        var props = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            props[_i - 2] = arguments[_i];
        }

        var cps = []; // 存储排序属性比较结果。
        // 如果未指定排序属性，则按照全属性升序排序。
        var asc = true;
        if (props.length < 1) {
            for (var p in item1) {
                if (item1[p] > item2[p]) {
                    cps.push(1);
                    break; // 大于时跳出循环。
                } else if (item1[p] === item2[p]) {
                    cps.push(0);
                } else {
                    cps.push(-1);
                    break; // 小于时跳出循环。
                }
            }
        } else {
            for (var i = 0; i < props.length; i++) {
                var prop = props[i];
                for (var o in prop) {
                    asc = prop[o] === "asc";
                    if (item1[o] > item2[o]) {
                        cps.push(asc ? 1 : -1);
                        break; // 大于时跳出循环。
                    } else if (item1[o] === item2[o]) {
                        cps.push(0);
                    } else {
                        cps.push(asc ? -1 : 1);
                        break; // 小于时跳出循环。
                    }
                }
            }
        }

        for (var j = 0; j < cps.length; j++) {
            if (cps[j] === 1 || cps[j] === -1) {
                return cps[j];
            }
        }
        return 0;
    },

    addSubToLabel: function (label) {
        var pol = label.toUpperCase();
        var flg = false;
        if (pol.indexOf("NO2") !== -1) {
            flg = true;
            pol = pol.replace(/NO2/g, "NO<sub>2</sub>");
        }
        if (pol.indexOf("SO2") !== -1) {
            flg = true;
            pol = pol.replace(/SO2/g, "SO<sub>2</sub>");
        }
        if (pol.indexOf("O3") !== -1) {
            flg = true;
            pol = pol.replace("O3", "O<sub>3</sub>");
        }
        if (pol.indexOf("PM2.5") !== -1) {
            flg = true;
            pol = pol.replace("PM2.5", "PM<sub>2.5</sub>");
        }
        if (pol.indexOf("PM25") !== -1) {
            flg = true;
            pol = pol.replace("PM25", "PM<sub>2.5</sub>");
        }
        if (pol.indexOf("PM10") !== -1) {
            flg = true;
            pol = pol.replace("PM10", "PM<sub>10</sub>");
        }
        if (flg)
            return pol;
        else
            return label;
    },

    /*墨卡托转经纬度*/
    mercatorToLatLon: function (Point) {

        let templat = Point.y / (6378137 * Math.PI) * 180;
        return {
            lng: Point.x / (6378137 * Math.PI) * 180,
            lat: 180 / Math.PI * (2 * Math.atan(Math.exp(templat * Math.PI / 180)) - Math.PI / 2)
        };
    },

    /*经纬度转墨卡托*/
    latLonToMercator: function (latlon) {

        return [
            latlon[0] * 6378137 * Math.PI / 180,
            Math.log(Math.tan((90 + latlon[1]) * Math.PI / 360)) * 6378137
        ];
    },


    /**
     *  获取当前时刻应该加载图片的信息
     * @param pDate 产品时间
     * @param qDate 查询时间
     * @param timeRes 时间分辨率 几小时一个数据
     * @param figureRes 图片分辨率 一张图片代表个时刻的数据
     * @param dateType
     * @returns {{t: number, model: number, figure1Name: (*|string), figure2Name: (*|string)}}
     * @private
     */
    getCurrFigureInfo: function (pDate, qDate, timeRes, figureRes, dateType) {
        let dType = dateType || 'hour';
        let format = dType === 'hour' ? 'yyyy-MM-dd 20:00:00' : 'yyyy-MM-dd 00:00:00';
        let intervalType = dType === 'hour' ? 'h' : 'd';
        let interNum = dType === 'hour' ? 1 : 24;
        const INTERVAL_NUM = timeRes;//时间分辨率
        const TIME_INTERVAL_NUM = figureRes;//图片分辨率（一张图片包含几个时刻的数据)
        let pDateStr = dateUtils.dateToStr(format, pDate);
        let pDateTime = dateUtils.strToDate(pDateStr);
        let yyyyMMddHH = dateUtils.dateToStr('yyyyMMdd20', pDate);
        let diff = dateUtils.dateDiff(intervalType, pDateTime, qDate);
        diff = dType === 'hour' ? diff : diff - 1;
        let interval = parseInt(diff / INTERVAL_NUM);
        let pNum = parseInt(interval / TIME_INTERVAL_NUM);
        let num = pNum * (TIME_INTERVAL_NUM * INTERVAL_NUM);
        num = dType === 'hour' ? num : num + 1;
        let currFigureDate = dateUtils.dateAdd(intervalType, num, pDateTime);
        let currFigureName = dateUtils.dateToStr('yyyyMMddHH', currFigureDate);
        let figureNum = dateUtils.dateDiff(intervalType, currFigureDate, qDate);

        let figure1Name = currFigureName;
        let figure2Name = currFigureName;
        let t = 0;
        let model = 0;

        if (figureNum / INTERVAL_NUM <= 1) {//仅需一张图片
            model = 0;
            t = figureNum / INTERVAL_NUM;
        } else {//需请求两种图片
            model = 1;
            t = (figureNum - INTERVAL_NUM) / INTERVAL_NUM;
            currFigureDate = dateUtils.dateAdd('h', TIME_INTERVAL_NUM * INTERVAL_NUM, currFigureDate);
            figure2Name = dateUtils.dateToStr('yyyyMMddHH', currFigureDate);
        }
        console.log({
            t, model, figure1Name, figure2Name
        });
        return {
            t, model, figure1Name, figure2Name
        }
    },


};

/**
 *简单模式时间插件
 * @param option
 */
function timeControl(option) {

    //1.能够进行自动赋值给现有参数 options
    this.options = this.options || {};

    //参数继承
    timeControl.prototype.extend = function (o, n, override) {
        for (var key in n) {
            if (n.hasOwnProperty(key) && (!o.hasOwnProperty(key) || override)) {
                o[key] = n[key];
            }
        } return o;
    }

    /**
    * 插件参数
    */
    var options = {

        /**
         *每次创建的时间控件的唯一编码
         */
        id: "",

        /**
         *承载时间控件的父元素的ID或者dom
         * required
         */
        parent: 'body',

        /**
         * 时间控件北京颜色 默认 rgba(2,17,26,0.6)
         */
        backGroundColor: "rgba(2,17,26,0.6)",

        /**
         * 时间控件字体颜色 默认 #fff
         */
        fontColor: "#fff",

        /**
         *起始时间范围 时间范围格式必须是 'xxxx-xx-xx' 或者 Date格式数据
         * option
         */
        startTimeStampRange: new Date(),

        /**
         *终止时间范围 时间范围格式必须是 'xxxx-xx-xx' 或者 Date格式数据
         * option
         */
        endTimeStampRange: new Date(),

        /**
         *可见起始时间 时间范围格式必须是 'xxxx-xx-xx' 或者 Date格式数据
         * option
         */
        startTimeStampShowRange: new Date(),

        /**
         *可见终止范围 时间范围格式必须是 'xxxx-xx-xx' 或者 Date格式数据
         * option
         */
        endTimeStampShowRange: new Date(),

        /**
         *当前在时间轴上选中的时间点 如：2017-08-23 14:00:00 或者 Date格式数据
         * option
         */
        time: 1503479596500,

        /**
         *如果日期是今天则提示今天的Label
         * option
         */
        labelToday: "Today",

        /**
         *如果日期是明天则提示明天的Label
         * option
         */
        labelTomorrow: "Tomorrow",

        /**
         *现在Label
         * option
         */
        labelNowButton: "Now",

        /**
         *时间轴上显示的格式  n-j表示月-日，如果月和日格式以为就是一位不会补齐成两位 还可以按照"Y-m-d H:i:s"这是时间格式
         * option
         */
        dateFormat: "n-j",

        /**
         *时间发生变化后的回调函数
         * option
         */
        onChangeTimeCallback: null,

        /**
         *时间展示形式 默认是hour表示按照小时展示 可以是day表示按照天展示
         * option
         */
        dateType: "hour",

        /**
         *
         */
        timeHourText: null,

        /**
         *
         */
        hoverHourText: null,

        /**
         *
         */
        dragOffset: 0.0,

        /**
         *
         */
        timeSliderBoundingLeft: 0.0,

        /**
         *
         */
        timeSliderBoundingRight: 0.0,

        /**
         *如果不传时间范围，默认可见几天的范围
         */
        days: 7,

        /**
         *当前时间
         */
        nowTime: new Date(),

        /**
         *播放状态
         */
        animation_running: false,

    };

    options.startTimeStampRange = this.getTimeByFormart(options.nowTime, -options.days, 0, 0, 0);
    options.endTimeStampRange = this.getTimeByFormart(options.nowTime, options.days, 23, 0, 0);
    options.startTimeStampShowRange = this.getTimeByFormart(options.nowTime, 0, 0, 0, 0);
    options.endTimeStampShowRange = this.getTimeByFormart(options.nowTime, options.days, 23, 0, 0);
    options.time = this.getTimeByFormart(options.nowTime, null, null, 0, 0);

    this.options = this.extend(options, option, true); //配置参数

    //2.要执行初始化函数 initialize
    typeof this.initialize == "function" ? this.initialize() : function () {
        timeControl.prototype.initialize.apply(this, arguments);
    };

};

/**
 * 插件初始化函数
 */
timeControl.prototype.initialize = function () {
    var that = this;

    if (that.options.id == "")
        that.options.id = that.getGuid();

    that.createTimePanl();

    that.initTime();

    that.createTimeItem();
    that.eventsInit();

    if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
        that.options.onChangeTimeCallback({ tip: "initTime", time: that.timestampConvertTimeStr(that.options.time) });
    }
};

/**
 * 创建时间控件页面布局
 */
timeControl.prototype.createTimePanl = function () {
    var that = this;
    var str =
        '<div class="_3clear_sampletimeControl" style="background:' + that.options.backGroundColor + ';color:' + that.options.fontColor + '">' +
            '<div title="播放/暂停" class="_3clear_sampletimeControl_timeElement first button_play glyph play" id="' + that.options.id + 'button_play">' +
                //'<span class="glyph play"></span>' +
            '</div>' +
            '<div title="现在" class="_3clear_sampletimeControl_timeElement _3clear_sampletimeControl_now_button" id="' + that.options.id + '_3clear_sampletimeControl_now_button">' + that.options.labelNowButton + '</div>' +
            '<div title="后一天" class="_3clear_sampletimeControl_timeElement _3clear_sampletimeControl_day_backward" id="' + that.options.id + '_3clear_sampletimeControl_day_backward"><span class="glyph fast_backward"></span></div>' +
            (that.options.dateType == 'hour' ? '<div title="后一小时" class="_3clear_sampletimeControl_timeElement _3clear_sampletimeControl_hour_backward" id="' + that.options.id + '_3clear_sampletimeControl_hour_backward"><span class="glyph backward"></span></div>' : '') +
            '<div class="_3clear_sampletimeControl_timeSliderOuter" id="' + that.options.id + '_3clear_sampletimeControl_timeSliderOuter">' +
                '<div id="' + that.options.id + '_3clear_sampletimeControl_timeProgress" class="_3clear_sampletimeControl_timeProgress widthTransition" style="width: 228px;"><span id="' + that.options.id + '_3clear_sampletimeControl_timeHour" class="_3clear_sampletimeControl_timeHour"></span></div>' +
                '<div id="' + that.options.id + '_3clear_sampletimeControl_hoverProgress" class="_3clear_sampletimeControl_hoverProgress hide" style="width: 93px;"><span id="' + that.options.id + '_3clear_sampletimeControl_hoverHour" class="_3clear_sampletimeControl_hoverHour"></span></div>' +
                '<div class="_3clear_sampletimeControl_timeSlider" id="' + that.options.id + '_3clear_sampletimeControl_timeSlider">' +
                    //'<div class="timeElement">' + that.options.labelToday + '</div>' +
                    //'<div class="timeElement">' + that.options.labelTomorrow + '</div>' +
                    //'<div class="timeElement">8-22</div>' +
                    //'<div class="timeElement">8-23</div>' +
                    //'<div class="timeElement">8-24</div>' +
                    //'<div class="timeElement">8-25</div>' +
                '</div>' +
            '</div>' +
            (that.options.dateType == 'hour' ? '<div title="前一小时" id="' + that.options.id + '_3clear_sampletimeControl_hour_forward" class="_3clear_sampletimeControl_timeElement _3clear_sampletimeControl_hour_forward"><span class="glyph forward"></span></div>' : '') +
            '<div title="后一天" id="' + that.options.id + '_3clear_sampletimeControl_day_forward" class="_3clear_sampletimeControl_timeElement last _3clear_sampletimeControl_day_forward"><span class="glyph fast_forward"></span></div>' +
        '</div>';

    var box = typeof that.options.parent == "string" ? document.getElementById(that.options.parent) : that.options.parent;
    box.innerHTML = str;

    that.options.timeHourText = document.createTextNode('');
    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeHour').appendChild(that.options.timeHourText);
    that.options.hoverHourText = document.createTextNode('');
    document.getElementById(that.options.id + '_3clear_sampletimeControl_hoverHour').appendChild(that.options.hoverHourText);
};

/**
*初始化时间
*/
timeControl.prototype.initTime = function () {
    var that = this;

    that.options.startTimeStampRange = that.getTimeByFormart(that.timeParaConverttimestamp(that.options.startTimeStampRange), null, 0, 0, 0);
    that.options.endTimeStampRange = that.getTimeByFormart(that.timeParaConverttimestamp(that.options.endTimeStampRange), null, 23, 0, 0);

    that.options.startTimeStampShowRange = that.getTimeByFormart(that.timeParaConverttimestamp(that.options.startTimeStampShowRange), null, 0, 0, 0);
    that.options.endTimeStampShowRange = that.getTimeByFormart(that.timeParaConverttimestamp(that.options.endTimeStampShowRange), null, 23, 0, 0);

    that.options.days = that.timeDiffDays(that.options.startTimeStampShowRange, that.options.endTimeStampShowRange);

    switch (that.options.dateType) {
        case "hour":
            that.options.time = that.timeParaConverttimestamp(that.options.time);
            break;
        case "day":
            that.options.time = that.getTimeByFormart(that.timeParaConverttimestamp(that.options.time), null, 23, 0, 0);
            break;
    }



};

/**
 * 给dom节点注册事件
 */
timeControl.prototype.eventsInit = function () {
    var that = this;

    that.eventMoveBind = that.eventMouseMove.bind(that);
    that.eventTimeBubbleMouseUpBind = that.eventTimeBubbleMouseUp.bind(that);

    //播放按钮注册事件
    document.getElementById(that.options.id + 'button_play').removeEventListener('click', that.eventPlayPauseToggle.bind(that), false);
    document.getElementById(that.options.id + 'button_play').addEventListener('click', that.eventPlayPauseToggle.bind(that), false);

    //判断选中的时间是否在当前范围，如果不在则可用点击现在按钮，如果不在则无法点击
    if(that.options.startTimeStampShowRange>that.getNowTime()||that.options.endTimeStampShowRange<that.getNowTime()){
        document.getElementById(that.options.id + '_3clear_sampletimeControl_now_button').disabled=true; 
    }else{
        //现在按钮注册事件
        document.getElementById(that.options.id + '_3clear_sampletimeControl_now_button').removeEventListener('click', that.eventClickNowTime.bind(that), false);
        document.getElementById(that.options.id + '_3clear_sampletimeControl_now_button').addEventListener('click', that.eventClickNowTime.bind(that), false);
    }

    
    //前一天注册事件
    document.getElementById(that.options.id + '_3clear_sampletimeControl_day_backward').removeEventListener('click', that.eventClickDayBackward.bind(that), false);
    document.getElementById(that.options.id + '_3clear_sampletimeControl_day_backward').addEventListener('click', that.eventClickDayBackward.bind(that), false);

    //前一时注册事件
    if (document.getElementById(that.options.id + '_3clear_sampletimeControl_hour_backward') != null) {
        document.getElementById(that.options.id + '_3clear_sampletimeControl_hour_backward').removeEventListener('click', that.eventClickHourBackward.bind(that), false);
        document.getElementById(that.options.id + '_3clear_sampletimeControl_hour_backward').addEventListener('click', that.eventClickHourBackward.bind(that), false);
    }

    //自定义某一天某一时注册事件
    if (that.options.dateType != "day") {
        document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').removeEventListener('mousemove', that.eventMoveBind, false);
        document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').addEventListener('mousemove', that.eventMoveBind, false);
    }

    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').removeEventListener('mouseout', that.eventMouseOut.bind(that), false);
    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').addEventListener('mouseout', that.eventMouseOut.bind(that), false);

    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').removeEventListener('click', that.eventMouseClick.bind(that), false);
    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').addEventListener('click', that.eventMouseClick.bind(that), false);

    if (that.options.dateType != "day") {
        document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').removeEventListener('touchstart', that.eventMoveBind, false);
        document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').addEventListener('touchstart', that.eventMoveBind, false);
    }

    if (that.options.dateType != "day") {
        document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').removeEventListener('touchmove', that.eventMoveBind, false);
        document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').addEventListener('touchmove', that.eventMoveBind, false);
    }

    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').removeEventListener('touchend', that.eventTimeBubbleMouseUp.bind(that), false);
    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').addEventListener('touchend', that.eventTimeBubbleMouseUp.bind(that), false);

    //鼠标在气泡上按下事件
    //document.getElementById(that.options.id + '_3clear_sampletimeControl_timeHour').removeEventListener('mousedown', that.eventTimeBubbleMouseDown.bind(that), false);
    //document.getElementById(that.options.id + '_3clear_sampletimeControl_timeHour').addEventListener('mousedown', that.eventTimeBubbleMouseDown.bind(that), false);

    //后一天注册事件
    document.getElementById(that.options.id + '_3clear_sampletimeControl_day_forward').removeEventListener('click', that.eventClickDayForward.bind(that), false);
    document.getElementById(that.options.id + '_3clear_sampletimeControl_day_forward').addEventListener('click', that.eventClickDayForward.bind(that), false);

    //后一时注册事件
    if (document.getElementById(that.options.id + '_3clear_sampletimeControl_hour_forward') != null) {
        document.getElementById(that.options.id + '_3clear_sampletimeControl_hour_forward').removeEventListener('click', that.eventClickHourForward.bind(that), false);
        document.getElementById(that.options.id + '_3clear_sampletimeControl_hour_forward').addEventListener('click', that.eventClickHourForward.bind(that), false);
    }

    that.eventResize();
    window.removeEventListener('resize', that.eventResize.bind(that), false);
    window.addEventListener('resize', that.eventResize.bind(that), false);

};

/**
  * 生成随机GUID码
  * @returns {string}
  */
timeControl.prototype.getGuid = function () {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

/**
 * 监听窗口大小变化事件
 */
timeControl.prototype.eventResize = function () {
    var that = this;
    var timeSlider_DOM = document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider');
    var box = timeSlider_DOM.getBoundingClientRect();
    var width_changed = (that.options.timeSliderBoundingRight - that.options.timeSliderBoundingLeft) != (box.right - box.left);

    that.options.timeSliderBoundingLeft = box.left;
    that.options.timeSliderBoundingRight = box.right;
    if (width_changed) {
        // 当位置发生变化时，要重新计算气泡的位置
        var time = that.options.time;
        that.options.time = null;
        that.setTime(time);
    }
};

/**
 * 鼠标在时间轴上移动事件
 * @param e
 */
timeControl.prototype.eventMouseMove = function (e) {
    var that = this;

    //1.首先要隐藏掉选中的时间气泡
    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeHour').classList.add('hide');

    //2.计算时间并且更新气泡的位置
    var x = e.touches && e.touches.length > 0 ? e.touches[0].pageX : e.pageX;

    //3.计算鼠标所在位置
    var width = x - that.options.dragOffset;
    var children = document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').children;
    var length = children.length;
    var child, hour;
    for (var i = 0; i < length; ++i) {
        child = children[i];
        //4.如果鼠标所在的位置正好在其中一个时间div的之间的话，就让进度跳上的气泡显示出来，并且通过数据的计算进度条的宽度来进行气泡的移动
        if (x > that.options.timeSliderBoundingLeft && child.getBoundingClientRect().left + child.offsetWidth > width) {
            var hoverProgress = document.getElementById(that.options.id + '_3clear_sampletimeControl_hoverProgress');
            hoverProgress.classList.remove('hide');
            hoverProgress.style.width = (x - that.options.timeSliderBoundingLeft).toFixed(1) + 'px';
            //5.把范围内的时间div分割成24份，每一小时一份
            hour = Math.floor((width - child.getBoundingClientRect().left) / child.offsetWidth * 24);
            that.options.hoverHourText.textContent = (hour < 10 ? '0' : '') + hour + ':00';
            break;
        }
    }
};

/**
 * 鼠标移出时间抽事件
 * @param e
 */
timeControl.prototype.eventMouseOut = function (e) {
    var that = this;

    //隐藏掉鼠标移动在进度跳上的气泡，显示选中的时间的气泡
    document.getElementById(that.options.id + '_3clear_sampletimeControl_hoverProgress').classList.add('hide');
    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeHour').classList.remove('hide');
};

/**
 * 鼠标点击选择具体时刻时间事件
 * @param e
 */
timeControl.prototype.eventMouseClick = function (e) {
    var that = this;

    if (that.options.animation_running == true)
        that.stopPlay();

    e.preventDefault();

    var hour, datetime;

    var x = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0].pageX : e.pageX;
    var width = x - that.options.dragOffset;
    //1.保证气泡的位置在时间内容div的之间
    width = Math.max(that.options.timeSliderBoundingLeft, Math.min(width, that.options.timeSliderBoundingRight - 1));
    var children = document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').children;
    var length = children.length;
    var child;

    //var startPostionchild, endPostionchild;

    //for (var i = 0; i < length; ++i) {
    //    child = children[i];
    //    if (child.datetime + 3600000 * 24 > that.options.endTimeStampShowRangeTemp) {
    //        endPostionchild = child;
    //        break;
    //    }
    //}

    //for (var i = 0; i < length; ++i) {
    //    child = children[i];
    //    if (child.datetime + 3600000 * 24 > that.options.startTimeStampShowRangeTemp) {
    //        startPostionchild = child;
    //        break;
    //    }
    //}

    for (var i = 0; i < length; ++i) {
        child = children[i];
        //2.判断鼠标的位置落在距离滑块的最近一个div上
        if (child.getBoundingClientRect().left + child.offsetWidth > width) {
            hour = Math.floor((width - child.getBoundingClientRect().left) / child.offsetWidth * 24);
            if (that.options.dateType == "day") {
                hour = 23;
                width = (child.offsetWidth / 24) * hour + child.getBoundingClientRect().left;
            }
            datetime = child.datetime;

            //if ((datetime + hour * 3600000) - that.options.endTimeStampShowRangeTemp > 0) {
            //    hour = new Date(that.options.endTimeStampShowRangeTemp).getHours();
            //    var time = new Date(that.options.endTimeStampShowRangeTemp);
            //    time.setHours(0);
            //    time.setMinutes(0);
            //    time.setSeconds(0);
            //    time.setMilliseconds(0);
            //    datetime = time.getTime();
            //    width = (endPostionchild.offsetWidth / 24) * hour + endPostionchild.getBoundingClientRect().left;
            //}

            //if ((datetime + hour * 3600000) - that.options.startTimeStampShowRangeTemp < 0) {
            //    hour = new Date(that.options.startTimeStampShowRangeTemp).getHours();
            //    var time = new Date(that.options.startTimeStampShowRangeTemp);
            //    time.setHours(0);
            //    time.setMinutes(0);
            //    time.setSeconds(0);
            //    time.setMilliseconds(0);
            //    datetime = time.getTime();
            //    width = (startPostionchild.offsetWidth / 24) * hour + startPostionchild.getBoundingClientRect().left;
            //}

            // 设置进度条的宽度
            document.getElementById(that.options.id + '_3clear_sampletimeControl_timeProgress').style.width = (width - that.options.timeSliderBoundingLeft).toFixed(1) + 'px';

            // 更新气泡上面的内容
            if (that.options.dateType == 'day') {
                that.options.timeHourText.textContent = new Date(child.datetime).toPHPDateFormat('n-j');
            } else {
                that.options.timeHourText.textContent = (hour < 10 ? '0' : '') + hour.toFixed(0) + ':00';
            }

            if (that.options.time != datetime + hour * 3600000) {
                // 设置当前选中时间
                that.options.time = datetime + hour * 3600000;
                if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
                    that.options.onChangeTimeCallback({ tip: "customTime", time: that.timestampConvertTimeStr(that.options.time) });
                }
            }
            break;
        }
    }
};

/**
 * 鼠标在气泡上弹起事件
 * @param e
 */
timeControl.prototype.eventTimeBubbleMouseUp = function (e) {
    var that = this;

    //1.当鼠标在气泡上弹起后就不用再监听移动和弹起事件了
    window.removeEventListener('mouseup', that.eventTimeBubbleMouseUpBind, false);
    window.removeEventListener('mousemove', that.eventMoveBind, false);

    //2.让当前选中时间的气泡显示 让鼠标移动上去的气泡隐藏
    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeProgress').classList.add('notransition');
    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeHour').classList.remove('hide');
    document.getElementById(that.options.id + '_3clear_sampletimeControl_hoverProgress').classList.add('hide');

    //3.模拟鼠标点选事件
    that.eventMouseClick(e);

    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeProgress').classList.remove('notransition');

    that.options.dragOffset = 0.0;
};

/**
 * 鼠标按下气泡事件
 * @param e
 */
timeControl.prototype.eventTimeBubbleMouseDown = function (e) {
    var that = this;

    if (that.options.animation_running == true)
        that.stopPlay();

    //1.监听鼠标弹起事件和移动事件
    window.addEventListener('mouseup', that.eventTimeBubbleMouseUpBind, false);
    window.addEventListener('mousemove', that.eventMoveBind, false);

    //2.计算鼠标在气泡上的便宜位置
    that.options.dragOffset = e.layerX - document.getElementById(that.options.id + '_3clear_sampletimeControl_timeHour').offsetWidth / 2;

    //3.隐藏掉当前时间气泡，显示进度条气泡
    document.getElementById(that.options.id + '_3clear_sampletimeControl_timeHour').classList.add('hide');
    document.getElementById(that.options.id + '_3clear_sampletimeControl_hoverProgress').classList.remove('hide');
};

/**
 * 设置时间轴上选中的具体时间
 * @param timestamp
 */
timeControl.prototype.setTime = function (timestamp) {
    var that = this;

    //1.如果要设置的时间值和当前选中的时间值相等的话则不进行设置
    var children = document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider').children;
    var length = children.length;
    var child;
    //if (that.options.time == timestamp) {
    //    return;
    //}
    that.options.time = timestamp;
    //2.判断最近的一个时间内容div
    for (var i = 0; i < length; ++i) {
        child = children[i];
        if (child.datetime + 24 * 3600000 > timestamp) {
            //3.计算在该div中要设置的时间值占有几小时
            var hour = parseInt((timestamp - child.datetime) / 3600000);
            //4.把计算好的小时值赋值在气泡上
            switch (that.options.dateType) {
                case "hour":
                    that.options.timeHourText.textContent = (hour < 10 ? '0' : '') + hour.toFixed(0) + ':00';
                    break;
                case "day":
                    that.options.timeHourText.textContent = new Date(child.datetime).toPHPDateFormat('n-j');
                    break;
            }

            //5.通过计算设置进度条的位置
            var width = child.getBoundingClientRect().left + hour / 24 * child.offsetWidth - that.options.timeSliderBoundingLeft;
            document.getElementById(that.options.id + '_3clear_sampletimeControl_timeProgress').style.width = width.toFixed(1) + 'px';
            break;
        }
    }
};

/**
 * 后一天事件
 * @param e
 */
timeControl.prototype.eventClickDayBackward = function (e) {
    var that = this;

    if (that.options.animation_running == true)
        that.stopPlay();

    e.preventDefault();

    var timestamp = that.options.time - 3600000 * 24;

    //1.如果要设置的时间值超过了，我们设置的最大时间范围那么则不进行任何操作
    if (timestamp < that.options.startTimeStampRange) {
        return;
    }

    //2.如果设置的值超过了显示范围，那么重新创建时间div的内容，默认向后面减一天
    if (timestamp < that.options.startTimeStampShowRange && timestamp >= that.options.startTimeStampRange) {
        that.options.startTimeStampShowRange = that.options.startTimeStampShowRange - 3600000 * 24;
        that.options.endTimeStampShowRange = that.options.endTimeStampShowRange - 3600000 * 24;
        that.createTimeItem();
    }

    //3.进行设置
    that.setTime(timestamp);

    if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
        that.options.onChangeTimeCallback({ tip: "dayBackwardTime", time: that.timestampConvertTimeStr(that.options.time) });
    }
};

/**
 * 后一小时事件
 * @param e
 */
timeControl.prototype.eventClickHourBackward = function (e) {
    var that = this;

    if (that.options.animation_running == true)
        that.stopPlay();

    e.preventDefault();
    //如果当前时间比一小时大则可以进行向后移动一个小时
    if (that.options.time - that.options.startTimeStampShowRange >= 3600000) {
        that.setTime(that.options.time - 3600000);
        if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
            that.options.onChangeTimeCallback({ tip: "hourBackwardTime", time: that.timestampConvertTimeStr(that.options.time) });
        }
    }
};

/**
 * 前一天事件
 * @param e
 */
timeControl.prototype.eventClickDayForward = function (e) {
    var that = this;

    if (that.options.animation_running == true)
        that.stopPlay();

    e.preventDefault();

    var timestamp = that.options.time + 3600000 * 24;

    //1.如果要设置的时间值超过了，我们设置的最大时间范围那么则不进行任何操作
    if (timestamp > that.options.endTimeStampRange) {
        return;
    }
    //2.如果设置的值超过了显示范围，那么重新创建时间div的内容，默认向前加一天
    if (timestamp > that.options.endTimeStampShowRange && timestamp <= that.options.endTimeStampRange) {
        that.options.startTimeStampShowRange = that.options.startTimeStampShowRange + 3600000 * 24;
        that.options.endTimeStampShowRange = that.options.endTimeStampShowRange + 3600000 * 24;
        that.createTimeItem();
    }

    //3.进行设置
    that.setTime(timestamp);

    if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
        that.options.onChangeTimeCallback({ tip: "dayForwardTime", time: that.timestampConvertTimeStr(that.options.time) });
    }
};

/**
 * 前一小时事件
 * @param e
 */
timeControl.prototype.eventClickHourForward = function (e) {
    var that = this;

    if (that.options.animation_running == true)
        that.stopPlay();

    e.preventDefault();
    //如果当前时间比一小时大则可以进行向后移动一个小时
    if (that.options.endTimeStampShowRange - that.options.time >= 3600000) {
        that.setTime(that.options.time + 3600000);
        if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
            that.options.onChangeTimeCallback({ tip: "hourForwardTime", time: that.timestampConvertTimeStr(that.options.time) });
        }
    }
};

/**
 * 切换到现在事件
 * @param e
 */
timeControl.prototype.eventClickNowTime = function (e) {
    var that = this;
    //1.如果正在播放，关闭播放功能
    if (that.options.animation_running == true)
        that.stopPlay();

    e.preventDefault();

    // //2.去当前时间和最大范围中的一个最小时间
    // that.options.startTimeStampShowRange = that.getTodayTime();
    // that.options.endTimeStampShowRange = Math.min(that.getTodayTime() + 3600000 * (24 * that.options.days - 1), that.options.endTimeStampRange);

    // //3.重新构造时间内容
    // that.createTimeItem();

    //4.设置当前时间为选中时间并且进入回调函数
    switch (that.options.dateType) {
        case "hour":
            that.setTime(that.getNowTime());
            break;
        case "day":
            that.setTime(that.getTimeByFormart(that.getNowTime(), null, 23, 0, 0));
            break;
    }
    if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
        that.options.onChangeTimeCallback({ tip: "nowTime", time: that.timestampConvertTimeStr(that.options.time) });
    }
};

/**
 * 播放和暂停事件
 * @param e
 */
timeControl.prototype.eventPlayPauseToggle = function (e) {
    var that = this;
    e.preventDefault();

    if(document.getElementById(that.options.id + "button_play")){
        that.options.animation_running = !that.options.animation_running;
        document.getElementById(that.options.id + "button_play").className = that.options.animation_running ? '_3clear_sampletimeControl_timeElement first button_play glyph pause' : '_3clear_sampletimeControl_timeElement first button_play glyph play';
        if (that.options.animation_running) {
            that.nextPlay();
        } else {
            //that.stopPlay();
        } 
    }
    
};

/**
   * 开始播放
   */
timeControl.prototype.nextPlay = function () {
    var that = this;
    that.options.animation_running = true;

    switch (that.options.dateType) {
        case "hour":
            if (that.options.endTimeStampShowRange - that.options.time >= 3600000) {
                that.setTime(that.options.time + 3600000);
                //that.options.timeoutVal = setTimeout('timeControl.prototype.startPlay()', that.options.timeFrequency);
                if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
                    that.options.onChangeTimeCallback({ tip: "playTime", time: that.timestampConvertTimeStr(that.options.time) });
                }
            } else {
                that.options.startTimeStampShowRange = that.options.startTimeStampShowRange;
                that.options.endTimeStampShowRange = that.options.endTimeStampShowRange;

                that.setTime(that.options.startTimeStampShowRange);
                //that.options.timeoutVal = setTimeout('timeControl.prototype.startPlay()', that.options.timeFrequency);
                if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
                    that.options.onChangeTimeCallback({ tip: "playTime", time: that.timestampConvertTimeStr(that.options.time) });
                }
            }
            break;
        case "day":
            if (that.options.endTimeStampShowRange - that.options.time >= 3600000 * 24) {
                that.setTime(that.options.time + 3600000 * 24);
                //that.options.timeoutVal = setTimeout('timeControl.prototype.startPlay()', that.options.timeFrequency);
                if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
                    that.options.onChangeTimeCallback({ tip: "playTime", time: that.timestampConvertTimeStr(that.options.time) });
                }
            } else {
                that.setTime(that.getTimeByFormart(that.options.startTimeStampShowRange, null, 23, 0, 0));
                //that.options.timeoutVal = setTimeout('timeControl.prototype.startPlay()', that.options.timeFrequency);
                if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
                    that.options.onChangeTimeCallback({ tip: "playTime", time: that.timestampConvertTimeStr(that.options.time) });
                }
            }
            break;
    }
};

/**
   * 暂停播放
   */
timeControl.prototype.stopPlay = function () {
    var that = this;
    //clearTimeout(that.options.timeoutVal);
    
    if(document.getElementById(that.options.id + "button_play")){
        that.options.animation_running = false;
        document.getElementById(that.options.id + "button_play").className = '_3clear_sampletimeControl_timeElement first button_play glyph play';
    }
};

/**
 * 创建日期内容
 */
timeControl.prototype.createTimeItem = function () {
    var that = this;

    var tr = document.getElementById(that.options.id + '_3clear_sampletimeControl_timeSlider');

    //1.先清除掉所有的日期内容
    while (tr.firstChild) {
        tr.removeChild(tr.firstChild);
    }

    //2.重新通过计算添加新的日期内容
    var fragment = document.createDocumentFragment();
    var i, td, date, label;
    for (i = that.options.startTimeStampShowRange; i <= that.options.endTimeStampShowRange; i += 3600000 * 24) {
        date = new Date(i);
        //注意：传递参数进来的展示范围必须格式是 'xxxx-xx-xx 00:00:00'
        label = that.getTodayTime() == i ? that.options.labelToday : (that.getTomorrowTime() == i ? that.options.labelTomorrow : date.toPHPDateFormat(that.options.dateFormat));

        td = document.createElement('div');
        td.appendChild(document.createTextNode(label));
        if(td){
            td.className = '_3clear_sampletimeControl_timeElement';
            //datetime 这个属性会在后面有大用处
            td.datetime = i;
            fragment.appendChild(td);
        }
        
    }
    tr.appendChild(fragment);
};

//把字串形式的日期格式2017-08-25 00:00:00和Date格式统一转换成timestamp毫秒格式
timeControl.prototype.timeParaConverttimestamp = function (time) {
    if (typeof time == "string") {
        time = new Date(Date.parse(time.replace(/-/g, "/"))).getTime();
    } else if (typeof time == "object") {
        time = time.getTime();
    }
    return time;
};

//获取现在日期 年月日小时 分秒为0
timeControl.prototype.getNowTime = function () {
    var timestamp_now = new Date();
    timestamp_now.setMilliseconds(0);
    timestamp_now.setMinutes(0);
    timestamp_now.setSeconds(0);
    timestamp_now = timestamp_now.getTime();
    return timestamp_now
};

//获取今天日期 从0时分0秒算起
timeControl.prototype.getTodayTime = function () {
    var timestamp_today = new Date();
    timestamp_today.setHours(0);
    timestamp_today.setMinutes(0);
    timestamp_today.setSeconds(0);
    timestamp_today.setMilliseconds(0);
    timestamp_today = timestamp_today.getTime();
    return timestamp_today;
};

//获取明天日期 从0时分0秒算起
timeControl.prototype.getTomorrowTime = function () {
    var that = this;
    var time = that.getTodayTime();
    return time + 3600000 * 24;
};

/**
 *时间处理器
 */
timeControl.prototype.getTimeByFormart = function (now, day, endHour, endMin, endSec) {
    var that = this;

    var startTime = new Date(now);
    if (day != null)
        startTime.setDate(startTime.getDate() + day);

    if (endHour != null)
        startTime.setHours(endHour);

    if (endMin != null)
        startTime.setMinutes(endMin);

    if (endSec != null)
        startTime.setSeconds(endSec);

    startTime.setMilliseconds(0);

    return startTime.getTime();
};

/**
 * 设置进度条是否可见
 * @param show
 */
timeControl.prototype.setLoading = function (show) {
    var that = this;

    var showLoadingMessageNode = document.getElementById(that.options.id + '_3clear_sampletimeControl_timeProgress');
    if (show) {
        showLoadingMessageNode.classList.add('loading');
    } else {
        showLoadingMessageNode.classList.remove('loading');
    }
};

/**
 * 把毫秒转换成对应的时间格式
 * @param time
 * @returns {string}
 */
timeControl.prototype.timestampConvertTimeStr = function (time) {
    var that = this;

    switch(that.options.dateType){
        case "day":
            time = that.getTimeByFormart(time, null, 0, 0, 0);
            break;
        case "hour":
            time = that.getTimeByFormart(time, null, null, 0, 0);
            break;
    }

    
    var newTime = new Date(time);
    var y = newTime.getFullYear();
    var m = newTime.getMonth() + 1;
    var d = newTime.getDate();
    var h = newTime.getHours();
    var mm = newTime.getMinutes();
    var ss = newTime.getSeconds();

    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + (h < 10 ? "0" + h : h) + ":" + (mm < 10 ? "0" + mm : mm) + ":" + (ss < 10 ? "0" + ss : ss);
};

//计算两个时间范围之间相差多少天
timeControl.prototype.timeDiffDays = function (dt1, dt2) {
    var dt1 = new Date(dt1);
    dt1.setHours(0);
    dt1.setMinutes(0);
    dt1.setSeconds(0);
    dt1.setMilliseconds(0);

    var dt2 = new Date(dt2);
    dt2.setHours(24);
    dt2.setMinutes(0);
    dt2.setSeconds(0);
    dt2.setMilliseconds(0);

    var time_ = dt2 - dt1;
    return (time_ / (3600000 * 24));
};

/**
 * 获取当前的播放状态
 *
 */
timeControl.prototype.getStatus = function () {
    var that = this;
    return that.options.animation_running;
};

/**
*重新设置参数
*/
timeControl.prototype.setOptions = function (option) {
    var that = this;
    that.options = that.extend(that.options, option, true); //配置参数
    that.initialize();
    that.setTime(that.options.time);
};

timeControl.prototype.destroy  =function(){
    var that = this;
    var box = typeof that.options.parent == "string" ? document.getElementById(that.options.parent) : that.options.parent;
    box.innerHTML = "";
};


/**
 * 日期时间格式 "Y-m-d H:i:s"
 * @param format
 * @returns {*}
 */
Date.prototype.toPHPDateFormat = function (format) {
    var temp;
    if (format.indexOf('Y') !== -1) {
        format = format.replace('Y', this.getFullYear().toString());
    }
    if (format.indexOf('n') !== -1) {
        format = format.replace('n', (this.getMonth() + 1).toString());
    }
    if (format.indexOf('j') !== -1) {
        format = format.replace('j', this.getDate().toString());
    }
    if (format.indexOf('m') !== -1) {
        temp = this.getMonth() + 1;
        format = format.replace('m', temp < 10 ? '0' + temp : temp.toString());
    }
    if (format.indexOf('d') !== -1) {
        temp = this.getDate();
        format = format.replace('d', temp < 10 ? '0' + temp : temp.toString());
    }
    if (format.indexOf('H') !== -1) {
        temp = this.getHours();
        format = format.replace('H', temp < 10 ? '0' + temp : temp.toString());
    }
    if (format.indexOf('i') !== -1) {
        temp = this.getMinutes();
        format = format.replace('i', temp < 10 ? '0' + temp : temp.toString());
    }
    if (format.indexOf('s') !== -1) {
        temp = this.getSeconds();
        format = format.replace('s', temp < 10 ? '0' + temp : temp.toString());
    }
    if (format.indexOf('l') !== -1) {
        var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        format = format.replace('l', weekdays[this.getDay()]);
    }else if (format.indexOf('F') !== -1) {
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        format = format.replace('F', monthNames[this.getMonth()]);
    } else if (format.indexOf('C') !== -1) {
        var weekdays = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        format = format.replace('C', weekdays[this.getDay()]);
    }

    return format;
};

export {
	timeControl
}

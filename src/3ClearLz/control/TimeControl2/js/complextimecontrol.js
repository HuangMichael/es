/**
 *复杂模式时间插件
 * @param option
 */
function complextimecontrol(option) {

    //1.能够进行自动赋值给现有参数 options
    this.options = this.options || {};

    //参数继承
    complextimecontrol.prototype.extend = function (o, n, override) {
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
        startTimeStampRange: 0,

        /**
         *终止时间范围 时间范围格式必须是 'xxxx-xx-xx' 或者 Date格式数据
         * option
         */
        endTimeStampRange: 0,

        /**
         *初始化起始时间 时间范围格式必须是 'xxxx-xx-xx' 或者 Date格式数据
         * option
         */
        startTimeStampShowRange: 0,

        /**
         *初始化终止范围 时间范围格式必须是 'xxxx-xx-xx' 或者 Date格式数据
         * option
         */
        endTimeStampShowRange: 0,

        /**
         *当前在时间轴上选中的时间点 如：2017-08-23 14:00:00或者 Date格式数据
         * option
         */
        time: 0,

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
        *星期几的格式 默认是 "C"代表中文格式，如：星期一 "l"代表英文格式，如：Sunday
        */
        weekNameFormat: "C",

        /**
         *时间发生变化后的回调函数
         * option
         */
        onChangeTimeCallback: null,

        /**
         *进度条相对现在过去时间的颜色
         * option
         */
        progressHistoryColor:"#005efa",

        /**
         *进度条当前时间的颜色
         * option
         */
        progressCurrentColor:"red",

        /**
         *进度条相对现在将来时间的颜色
         * option
         */
        progressFutureColor:"#00aeff",

        /**
         *如果不传时间范围，默认可见几天的范围
         */
        days: 7,

        /**当前显示时间气泡Dom节点
         *
         */
        timeHourText: null,

        /**
         *移动时显示时间气泡Dom节点
         */
        hoverHourText: null,

        /**
         *托转气泡时鼠标所在气泡的相对位置
         */
        dragOffset: 0.0,

        /**
         *距离气泡的左边距离
         */
        timeSliderBoundingLeft: 0.0,

        /**
         *距离气泡的右边距离
         */
        timeSliderBoundingRight: 0.0,

        /**
         *上一次时间
         */
        lastTimeStep: 0,

        /**
         *播放状态
         */
        animation_running: false,

    };

    this.options = this.extend(options, option, true); //配置参数

    //2.要执行初始化函数 initialize
    typeof this.initialize == "function" ? this.initialize() : function () {
        complextimecontrol.prototype.initialize.apply(this, arguments);
    };
};

/**
 * 插件初始化函数
 */
complextimecontrol.prototype.initialize = function () {
    var that = this;

    if (that.options.id == "")
        that.options.id = that.getGuid();

    that.createTimePanl();

    that.initTime();

    that.createTimeItem();
    that.eventsInit();

};


/**
 * 创建时间控件页面布局
 */
complextimecontrol.prototype.createTimePanl = function () {
    var that = this;
    var str =

    '<div class="unselectable _3clear_complextimeControl" id="' + that.options.id + '_3clear_complextimeControl" style="background:' + that.options.backGroundColor + ';color:' + that.options.fontColor + '">' +
        '<div class="_3clear_complextimeControl_timeElement nav-arrows glyph play" id="' + that.options.id + '_3clear_complextimeControl_button_play" title="播放/停止"></div>' +
        '<div class="_3clear_complextimeControl_timeSliderOuter" id="' + that.options.id + '_3clear_complextimeControl_timeSliderOuter">' +
            
            '<div id="' + that.options.id + '_3clear_complextimeControl_timeProgress" class="_3clear_complextimeControl_timeProgress widthTransition" style="width: 394.9px;">'+
                '<div style="background-color:'+that.options.progressHistoryColor+';" id="' + that.options.id + '_3clear_complextimeControl_timeProgress_item_pre" class="_3clear_complextimeControl_timeProgress_item"></div>'+
                '<div style="background-color:'+that.options.progressCurrentColor+';" id="' + that.options.id + '_3clear_complextimeControl_timeProgress_item_current" class="_3clear_complextimeControl_timeProgress_item"></div>'+
                '<div style="background-color:'+that.options.progressFutureColor+';" id="' + that.options.id + '_3clear_complextimeControl_timeProgress_item_next" class="_3clear_complextimeControl_timeProgress_item"></div>'+
                '<span id="' + that.options.id + '_3clear_complextimeControl_timeHour" class="_3clear_complextimeControl_timeHour"></span>'+

                '<div style="background-color:'+that.options.progressCurrentColor+';" id="' + that.options.id + '_3clear_complextimeControl_timeProgress_item_current_temp" class="_3clear_complextimeControl_timeProgress_item"></div>'+
            '</div>' +
            '<div id="' + that.options.id + '_3clear_complextimeControl_hoverProgress" class="hide _3clear_complextimeControl_hoverProgress" style="width: 1147px;"><span id="' + that.options.id + '_3clear_complextimeControl_hoverHour" class="_3clear_complextimeControl_hoverHour"></span></div>' +
            '<div id="' + that.options.id + '_3clear_complextimeControl_timeSlider" class="_3clear_complextimeControl_timeSlider">' +

                //'<div class="_3clear_complextimeControl_timeElement dayElement">' +
                //'Wednesday (08-30)' +
                //    '<div id="' + that.options.id + 'three_hourly_time_steps" class="_3clear_complextimeControl_three-hourly-time-steps">' +
                //        '<div class="_3clear_complextimeControl_slider-3h-time-step">0</div>' +
                //        '<div class="_3clear_complextimeControl_slider-3h-time-step">3</div>' +
                //        '<div class="_3clear_complextimeControl_slider-3h-time-step">6</div>' +
                //        '<div class="_3clear_complextimeControl_slider-3h-time-step">9</div>' +
                //        '<div class="_3clear_complextimeControl_slider-3h-time-step">12</div>' +
                //        '<div class="_3clear_complextimeControl_slider-3h-time-step">15</div>' +
                //        '<div class="_3clear_complextimeControl_slider-3h-time-step">18</div>' +
                //        '<div class="_3clear_complextimeControl_slider-3h-time-step">21</div>' +
                //    '</div>' +
                //'</div>' +
            '</div>' +
        '</div>' +

        '<div class="_3clear_complextimeControl_timeElement nav-arrows prev" id="' + that.options.id + '_3clear_complextimeControl_3hour_backward" title="后三小时">3h</div>' +
        '<div class="_3clear_complextimeControl_timeElement elementGroup">' +
            '<div class="_3clear_complextimeControl_timeElement nav-arrows stacked prev" id="' + that.options.id + '_3clear_complextimeControl_hour_backward" title="后一小时">1h</div>' +
            '<div class="_3clear_complextimeControl_timeElement nav-arrows stacked prev" id="' + that.options.id + '_3clear_complextimeControl_day_backward" title="后一天">24h</div>' +
        '</div>' +
        '<div class="_3clear_complextimeControl_timeElement elementGroup">' +
            '<div class="_3clear_complextimeControl_timeElement nav-arrows stacked" id="' + that.options.id + '_3clear_complextimeControl_now_button" title="现在">Now</div>' +
            '<div class="_3clear_complextimeControl_timeElement nav-arrows stacked _3clear_complextimeControl_timeElement_switchBtn" id="' + that.options.id + '_3clear_complextimeControl_compare_time_steps" title="上一时间比较">' +
                '<span class="glyph winddir E"></span>' +
                '<span class="glyph winddir W"></span>' +
            '</div>' +
        '</div>' +

        '<div class="_3clear_complextimeControl_timeElement elementGroup">' +
            '<div class="_3clear_complextimeControl_timeElement nav-arrows stacked next" id="' + that.options.id + '_3clear_complextimeControl_hour_forward" title="前一小时">1h</div>' +
            '<div class="_3clear_complextimeControl_timeElement nav-arrows stacked next" id="' + that.options.id + '_3clear_complextimeControl_day_forward" title="前一天">24h</div>' +
        '</div>' +
        '<div class="_3clear_complextimeControl_timeElement nav-arrows next" id="' + that.options.id + '_3clear_complextimeControl_3hour_forward" title="前三小时">3h</div>' +
    '</div>';

    var box = typeof that.options.parent == "string" ? document.getElementById(that.options.parent) : that.options.parent;
    box.innerHTML = str;

    that.options.timeHourText = document.createTextNode('');
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeHour').appendChild(that.options.timeHourText);
    that.options.hoverHourText = document.createTextNode('');
    document.getElementById(that.options.id + '_3clear_complextimeControl_hoverHour').appendChild(that.options.hoverHourText);

};

/**
 * 给dom节点注册事件
 */
complextimecontrol.prototype.eventsInit = function () {
    var that = this;

    that.eventMoveBind = that.eventMouseMove.bind(that);

    //鼠标在控件上的移入事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').addEventListener('mousemove', that.eventMoveBind, false);
    //鼠标在控件上的移出事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').addEventListener('mouseout', that.eventMouseOut.bind(that), false);
    //鼠标在控件上的点击事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').addEventListener('click', that.eventMouseClick.bind(that), false);
    //移动端的触摸事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').addEventListener('touchstart', that.eventMoveBind, false);
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').addEventListener('touchmove', that.eventMoveBind, false);
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').addEventListener('touchend', that.eventTimeBubbleMouseUp.bind(that), false);

    //单击当前时间按钮事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_now_button').addEventListener('click', function () {
        if (that.options.animation_running == true)
            that.stopPlay();

        that.options.startTimeStampShowRange = that.options.startTimeStampShowRangeTemp;
        that.options.endTimeStampShowRange = that.options.endTimeStampShowRangeTemp;
        that.options.time = that.getNowTime();
        //that.setDate(that.getNowTime(), true, "nowTime");
        that.createTimeItem();
        that.setTime(that.options.time,"nowTime");
    }.bind(that), false);
    //单击向前3小时事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_3hour_backward').addEventListener('click', function () {
        if (that.options.animation_running == true)
            that.stopPlay();

        that.setDate(-3, true, "3hourBackwardTime");
    }.bind(that), false);
    //点击向前1小时事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_hour_backward').addEventListener('click', function () {
        if (that.options.animation_running == true)
            that.stopPlay();

        that.setDate(-1, true, "hourBackwardTime");
    }.bind(that), false);
    //单击向前24小时事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_day_backward').addEventListener('click', function () {
        if (that.options.animation_running == true)
            that.stopPlay();

        that.setDate(-24, true, "dayBackwardTime");
    }.bind(that), false);
    //单击播放、停止事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_button_play').addEventListener('click',
        that.eventPlayPauseToggle.bind(that), false);
    //单击向后1小时事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_hour_forward').addEventListener('click', function () {
        if (that.options.animation_running == true)
            that.stopPlay();

        that.setDate(1, true, "hourForwardTime");
    }.bind(that), false);
    //单击向后24小时事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_day_forward').addEventListener('click', function () {
        if (that.options.animation_running == true)
            that.stopPlay();

        that.setDate(24, true, "dayForwardTime");
    }.bind(that), false);
    //单击向后3小时事件
    document.getElementById(that.options.id + '_3clear_complextimeControl_3hour_forward').addEventListener('click', function () {
        if (that.options.animation_running == true)
            that.stopPlay();

        that.setDate(3, true, "3hourForwardTime");
    }.bind(that), false);

    //鼠标在气泡上按下事件
    // document.getElementById(that.options.id + '_3clear_complextimeControl_timeHour').addEventListener('mousedown', that.eventTimeBubbleMouseDown.bind(that), false);

    //与上一时间比较
    document.getElementById(that.options.id + '_3clear_complextimeControl_compare_time_steps').addEventListener('mousedown', function () {
        if (that.options.lastTimeStep === that.options.time) {

        } else {
            that.setDate(that.options.lastTimeStep, true, "CompareTime");
        }
    }.bind(that), false);


    that.eventResize();
    window.addEventListener('resize', that.eventResize.bind(that), false);

};

/**
  * 生成随机GUID码
  * @returns {string}
  */
complextimecontrol.prototype.getGuid = function () {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

/**
 * 监听窗口大小变化事件
 */
complextimecontrol.prototype.eventResize = function () {
    var that = this;
    var timeSlider_DOM = document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider');
    if(timeSlider_DOM!=null){
       var box = timeSlider_DOM.getBoundingClientRect();
        var width_changed = (that.options.timeSliderBoundingRight - that.options.timeSliderBoundingLeft) != (box.right - box.left);

        that.options.timeSliderBoundingLeft = box.left;
        that.options.timeSliderBoundingRight = box.right;
        if (width_changed) {
            // 当位置发生变化时，要重新计算气泡的位置
            var time = that.options.time;
            that.options.time = null;
            that.setTime(time, "initTime");
        } 
    }
};

/**
*设置时间插件数据的的核心代码
*/
complextimecontrol.prototype.setDate = function (ts, updateTimeSlider, tipName) {
    var that = this;

    //1.把对应的小时数据转换成timestamp
    if (ts <= 24) {
        var step = parseInt(ts);
        ts = that.options.time + step * 60 * 60 * 1000;
    }

    //2.如果数据超出界限则不作处理
    if (ts === that.options.time || ts < that.options.startTimeStampRange || ts > that.options.endTimeStampRange) return;

    that.options.lastTimeStep = that.options.time;
    that.options.time = ts;

    //测试使用
    var date = new Date(that.options.time);

    //var daysShift = 0;
    //3.如果数据到了起始位置则移动板子
    if (that.options.time < that.options.startTimeStampShowRange && that.options.time >= that.options.startTimeStampRange) {
        //daysShift = Math.floor((that.options.startTimeStampShowRange + 3600000 * 24) / 3600000 * 24) * 3600000 * 24;
        that.options.startTimeStampShowRange -= 3600000 * 24;
        that.options.endTimeStampShowRange -= 3600000 * 24;
        that.createTimeItem();

        //4.同3
    } else if (that.options.time > that.options.endTimeStampShowRange && that.options.time <= that.options.endTimeStampRange) {
        //daysShift = Math.floor((that.options.time - that.options.endTimeStampShowRange) / 3600000 * 24) * 3600000 * 24;
        that.options.startTimeStampShowRange += 3600000 * 24;
        that.options.endTimeStampShowRange += 3600000 * 24;
        that.createTimeItem();
    }

    //5.更新时间
    if (updateTimeSlider) {
        that.setTime(that.options.time, tipName);
    }

};

/**
 * 鼠标在时间轴上移动事件
 * @param e
 */
complextimecontrol.prototype.eventMouseMove = function (e) {
    var that = this;

    //1.首先要隐藏掉选中的时间气泡
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeHour').classList.add('hide');

    //2.计算时间并且更新气泡的位置
    var x = e.touches && e.touches.length > 0 ? e.touches[0].pageX : e.pageX;

    //3.计算鼠标所在位置
    var width = x - that.options.dragOffset;
    var children = document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').children;
    var length = children.length;
    var child, hour;
    for (var i = 0; i < length; ++i) {
        child = children[i];
        //4.如果鼠标所在的位置正好在其中一个时间div的之间的话，就让进度跳上的气泡显示出来，并且通过数据的计算进度条的宽度来进行气泡的移动
        if (x > that.options.timeSliderBoundingLeft && child.getBoundingClientRect().left + child.offsetWidth > width) {
            hour = Math.floor((width - child.getBoundingClientRect().left) / child.offsetWidth * 24);

            // round to last 3h step if user hovered a 3h step
            var target = e.srcElement || e.originalTarget;
            var hoverProgressWidth = 0;
            if (target.className.indexOf('_3clear_complextimeControl_slider-3h-time-step') != -1) {
                hour = Math.floor(hour / 3) * 3;
                hoverProgressWidth = target.getBoundingClientRect().left - document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').getBoundingClientRect().left;
            } else {
                hoverProgressWidth = x - that.options.timeSliderBoundingLeft;
            }
            // show hover time bubble and adjust width to mouse cursor
            var hoverProgress = document.getElementById(that.options.id + '_3clear_complextimeControl_hoverProgress');
            hoverProgress.classList.remove('hide');
            hoverProgress.style.width = (hoverProgressWidth).toFixed(1) + 'px';
            that.options.hoverHourText.textContent = (hour < 10 ? '0' : '') + hour + ':00';
            break;
        }
    }

};

/**
 * 鼠标移出时间抽事件
 * @param e
 */
complextimecontrol.prototype.eventMouseOut = function (e) {
    var that = this;

    //隐藏掉鼠标移动在进度跳上的气泡，显示选中的时间的气泡
    document.getElementById(that.options.id + '_3clear_complextimeControl_hoverProgress').classList.add('hide');
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeHour').classList.remove('hide');
};

/**
 * 鼠标点击选择具体时刻时间事件
 * @param e
 */
complextimecontrol.prototype.eventMouseClick = function (e) {
    var that = this;

    if (that.options.animation_running == true)
        that.stopPlay();

    e.preventDefault();

    var hour, datetime;

    var x = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0].pageX : e.pageX;
    var width = x - that.options.dragOffset;
    //1.保证气泡的位置在时间内容div的之间
    width = Math.max(that.options.timeSliderBoundingLeft, Math.min(width, that.options.timeSliderBoundingRight - 1));
    var children = document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').children;
    var length = children.length;
    var child;



    for (var i = 0; i < length; ++i) {
        child = children[i];
        //2.判断鼠标的位置落在距离滑块的最近一个div上
        if (child.getBoundingClientRect().left + child.offsetWidth > width) {
            if (datetime = e.target.parentNode.parentNode.datetime == null) {
                hour = Math.floor((width - child.getBoundingClientRect().left) / child.offsetWidth * 24);
                datetime = child.datetime;
            } else {
                hour = parseInt(e.target.innerHTML);
                datetime = e.target.parentNode.parentNode.datetime;
            }

            var time = datetime + hour * 3600000;

            var progressbarWidth = width - that.options.timeSliderBoundingLeft;

            //一个格子长度为三小时
            if (e.target.className.indexOf('_3clear_complextimeControl_slider-3h-time-step') != -1) {
                //time = Math.floor(time / 10800000) * 10800000;
                hour = Math.floor(hour / 3) * 3;
                progressbarWidth = e.target.getBoundingClientRect().left -
                    document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').getBoundingClientRect().left;
            }
            // 设置进度条的宽度
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress').style.width = (progressbarWidth).toFixed(1) + 'px';
            

           
            // 更新气泡上面的内容
            that.options.timeHourText.textContent = (hour < 10 ? '0' : '') + hour.toFixed(0) + ':00';

            // 设置当前选中时间
            if (that.options.time != time) {
                that.options.lastTimeStep = that.options.time;
                that.options.time = time;

                that.progressbarSet(progressbarWidth);

                //that.setTime(that.options.time, "customTime");

                if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
                    //alert(that.timestampConvertTimeStr(that.options.time));
                    that.options.onChangeTimeCallback({ tip: "customTime", time: that.timestampConvertTimeStr(that.options.time) });
                }
            }
            break;

        }
    }


};

complextimecontrol.prototype.progressbarSet = function(progressbarWidth){
    var that =this;

     var current = that.getNowTime();

        var _width_Class = 0;
        var _width_Hour = 0;

    if(current>=that.options.startTimeStampShowRange&&current<that.options.endTimeStampShowRange){
        if(that.options.startTimeStampShowRange<=current&&that.options.endTimeStampShowRange>=current){
            
            var children = document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').children;
            for(var i=0;i<children.length;i++){
                if(children[i].today=="today"){
                    var left = children[i].getBoundingClientRect().left-that.options.timeSliderBoundingLeft;
                    var w = children[i].offsetWidth;
                    var h_per = children[i].offsetWidth/24;

                    var newTime = new Date(current);
                    var h = newTime.getHours();
                    
                    _width_Class=h_per*h+left;
                    _width_Hour = h_per;

                    document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current_temp').style.display="block";
                    document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current_temp').style.left=_width_Class+"px";
                    document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current_temp').style.width=h_per+"px";

                    break;
                }
            }
        }
    }else{
        document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current_temp').style.display="none";
    }

        //1.当前时间在起始时间和time之间
        if(current>=that.options.startTimeStampShowRange&&current<that.options.time){
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_pre').style.left=0+"px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_pre').style.width=_width_Class+"px";
            
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current').style.left=_width_Class+"px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current').style.width=h_per+"px";
            
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_next').style.left=(_width_Class+h_per)+"px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_next').style.width=(progressbarWidth-_width_Class-h_per)+"px";

        }
        
        //2.当前时间比time大
        if(current>=that.options.time){
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_pre').style.left="0px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_pre').style.width=progressbarWidth+"px";

            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current').style.left="0px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current').style.width="0px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_next').style.left="0px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_next').style.width="0px";
        }
        //3.当前时间比起始时间小
        if(current<that.options.startTimeStampShowRange){
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_next').style.left="0px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_next').style.width=progressbarWidth+"px";

            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_pre').style.left="0px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_pre').style.width="0px"
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current').style.left="0px";
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress_item_current').style.width="0px";
        }
};

/**
 * 鼠标在气泡上弹起事件
 * @param e
 */
complextimecontrol.prototype.eventTimeBubbleMouseUp = function (e) {
    var that = this;

    //1.当鼠标在气泡上弹起后就不用再监听移动和弹起事件了
    window.removeEventListener('mouseup', that.eventTimeBubbleMouseUpBind, false);
    window.removeEventListener('mousemove', that.eventMoveBind, false);

    //2.让当前选中时间的气泡显示 让鼠标移动上去的气泡隐藏
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress').classList.add('notransition');
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeHour').classList.remove('hide');
    document.getElementById(that.options.id + '_3clear_complextimeControl_hoverProgress').classList.add('hide');

    //3.模拟鼠标点选事件
    that.eventMouseClick(e);

    document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress').classList.remove('notransition');

    that.options.dragOffset = 0.0;
};

/**
 * 鼠标按下气泡事件
 * @param e
 */
complextimecontrol.prototype.eventTimeBubbleMouseDown = function (e) {
    var that = this;

    if (that.options.animation_running == true)
        that.options.animation_running = false;

    //1.监听鼠标弹起事件和移动事件
    window.addEventListener('mouseup', that.eventTimeBubbleMouseUpBind, false);
    window.addEventListener('mousemove', that.eventMoveBind, false);

    //2.计算鼠标在气泡上的便宜位置
    that.options.dragOffset = e.layerX - document.getElementById(that.options.id + '_3clear_complextimeControl_timeHour').offsetWidth / 2;

    //3.隐藏掉当前时间气泡，显示进度条气泡
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeHour').classList.add('hide');
    document.getElementById(that.options.id + '_3clear_complextimeControl_hoverProgress').classList.remove('hide');


    window.addEventListener('mouseup', that.eventTimeBubbleMouseUpBind, false);
    window.addEventListener('mousemove', that.eventMoveBind, false);

    that.options.dragOffset = e.layerX - document.getElementById(that.options.id + '_3clear_complextimeControl_timeHour').offsetWidth / 2;
    document.getElementById(that.options.id + '_3clear_complextimeControl_timeHour').classList.add('hide');
    document.getElementById(that.options.id + '_3clear_complextimeControl_hoverProgress').classList.remove('hide');
};

/**
*初始化时间
*/
complextimecontrol.prototype.initTime = function () {
    var that = this;

    that.options.startTimeStampRange = that.getTimeByFormart(that.timeParaConverttimestamp(that.options.startTimeStampRange), null, 0, 0, 0);
    that.options.endTimeStampRange = that.getTimeByFormart(that.timeParaConverttimestamp(that.options.endTimeStampRange), null, 23, 0, 0);

    that.options.startTimeStampShowRange = that.getTimeByFormart(that.timeParaConverttimestamp(that.options.startTimeStampShowRange), null, 0, 0, 0);
    that.options.endTimeStampShowRange = that.getTimeByFormart(that.timeParaConverttimestamp(that.options.endTimeStampShowRange), null, 23, 0, 0);

    that.options.startTimeStampShowRangeTemp = that.getTimeByFormart(that.options.startTimeStampShowRange, null, 0, 0, 0);
    that.options.endTimeStampShowRangeTemp = that.getTimeByFormart(that.options.endTimeStampShowRange, null, 23, 0, 0);

    that.options.days = that.timeDiffDays(that.options.startTimeStampShowRange, that.options.endTimeStampShowRange);

    that.options.time = that.timeParaConverttimestamp(that.options.time);
};

/**
 * 设置时间轴上选中的具体时间
 * @param timestamp
 */
complextimecontrol.prototype.setTime = function (timestamp, tipName) {
    var that = this;

    //1.如果要设置的时间值和当前选中的时间值相等的话则不进行设置
    var children = document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider').children;
    var length = children.length;
    var child;
    if (that.options.time == timestamp) {
        //return;
    }
    that.options.time = timestamp;
    //2.判断最近的一个时间内容div
    for (var i = 0; i < length; ++i) {
        child = children[i];
        if (child.datetime + 24 * 3600000 > timestamp) {
            //3.计算在该div中要设置的时间值占有几小时
            var hour = parseInt((timestamp - child.datetime) / 3600000);
            //4.把计算好的小时值赋值在气泡上
            that.options.timeHourText.textContent = (hour < 10 ? '0' : '') + hour.toFixed(0) + ':00';
            //5.通过计算设置进度条的位置
            var width = child.getBoundingClientRect().left + hour / 24 * child.offsetWidth - that.options.timeSliderBoundingLeft;
            document.getElementById(that.options.id + '_3clear_complextimeControl_timeProgress').style.width = width.toFixed(1) + 'px';
            that.progressbarSet(width);
            break;
        }
    }
    //if (that.options.time != timestamp) {
    if (that.options.onChangeTimeCallback != null && typeof that.options.onChangeTimeCallback == "function") {
        that.options.onChangeTimeCallback({ tip: tipName, time: that.timestampConvertTimeStr(that.options.time) });
    }
    // }

};




/**
 * 播放和暂停事件
 * @param e
 */
complextimecontrol.prototype.eventPlayPauseToggle = function (e) {
    var that = this;
    e.preventDefault();


    if(document.getElementById(that.options.id + "_3clear_complextimeControl_button_play")){
        that.options.animation_running = !that.options.animation_running;
        document.getElementById(that.options.id + "_3clear_complextimeControl_button_play").className = that.options.animation_running ? '_3clear_complextimeControl_timeElement nav-arrows glyph pause' : '_3clear_complextimeControl_timeElement nav-arrows glyph play';
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
complextimecontrol.prototype.nextPlay = function () {
    var that = this;
    that.options.animation_running = true;

    if (that.options.endTimeStampShowRange - that.options.time >= 3600000) {
        that.setTime(that.options.time + 3600000, "playTime");
        //that.options.timeoutVal = setTimeout('timeControl.prototype.startPlay()', that.options.timeFrequency);
    } else {
        that.setTime(that.options.startTimeStampShowRange, "playTime");
        //that.options.timeoutVal = setTimeout('timeControl.prototype.startPlay()', that.options.timeFrequency);
    }

};

/**
   * 暂停播放
   */
complextimecontrol.prototype.stopPlay = function () {
    var that = this;
    //clearTimeout(that.options.timeoutVal);
    if(document.getElementById(that.options.id + "_3clear_complextimeControl_button_play")){
        that.options.animation_running = false;
        document.getElementById(that.options.id + "_3clear_complextimeControl_button_play").className = '_3clear_complextimeControl_timeElement nav-arrows glyph play';
    }
};

/**
 * 创建日期内容
 */
complextimecontrol.prototype.createTimeItem = function () {
    var that = this;

    var tr = document.getElementById(that.options.id + '_3clear_complextimeControl_timeSlider');

    var today = that.getTodayTime();
    var tomorrow = that.getTomorrowTime();

    //1.先清除掉所有的日期内容
    while (tr.firstChild) {
        tr.removeChild(tr.firstChild);
    }

    //2.重新通过计算添加新的日期内容
    var fragment = document.createDocumentFragment();
    var i, td, date, label;
    for (i = that.options.startTimeStampShowRange; i <= that.options.endTimeStampShowRange; i += 3600000 * 24) {
        date = new Date(i);

        //label = today == i ? this.labelToday : (tomorrow == i ? this.labelTomorrow : mb.t(date.toPHPDateFormat('l')));
        label = date.toPHPDateFormat(that.options.weekNameFormat);
        label += ' (' + date.toPHPDateFormat(that.options.dateFormat) + ')';

        td = document.createElement('div');
        td.appendChild(document.createTextNode(label));

        var threeHourlyStepsWrapper = document.createElement('div');
        threeHourlyStepsWrapper.setAttribute('id', '_3clear_complextimeControl_three_hourly_time_steps');
        threeHourlyStepsWrapper.className = '_3clear_complextimeControl_three-hourly-time-steps';

        for (var j = 0; j < 24; j += 3) {
            var step = document.createElement('div');
            step.className = '_3clear_complextimeControl_slider-3h-time-step';
            step.innerText = j;
            threeHourlyStepsWrapper.appendChild(step);
        }

        td.appendChild(threeHourlyStepsWrapper);

        td.className = '_3clear_complextimeControl_timeElement dayElement';
        //datetime 这个属性会在后面有大用处
        td.datetime = i;

        if(today == i){
            td.today = "today";
        }

        fragment.appendChild(td);
    }
    tr.appendChild(fragment);
};

//把字串形式的日期格式2017-08-25 00:00:00和Date格式统一转换成timestamp毫秒格式
complextimecontrol.prototype.timeParaConverttimestamp = function (time) {
    if (typeof time == "string") {
        time = time.replace(new RegExp("-", "gm"), "/");
        time = (new Date(time)).getTime(); //得到毫秒数
        //time = new Date(Date.parse(time.replace(new RegExp("-", "gm"), "/"))).getTime();
    } else if (typeof time == "object") {
        time = time.getTime();
    }
    return time;
};

//获取现在日期 年月日小时 分秒为0
complextimecontrol.prototype.getNowTime = function () {
    var timestamp_now = new Date();
    timestamp_now.setMilliseconds(0);
    timestamp_now.setMinutes(0);
    timestamp_now.setSeconds(0);
    timestamp_now = timestamp_now.getTime();
    return timestamp_now
};

//获取今天日期 从0时分0秒算起
complextimecontrol.prototype.getTodayTime = function () {
    var timestamp_today = new Date();
    timestamp_today.setHours(0);
    timestamp_today.setMinutes(0);
    timestamp_today.setSeconds(0);
    timestamp_today.setMilliseconds(0);
    timestamp_today = timestamp_today.getTime();
    return timestamp_today;
};

//获取明天日期 从0时分0秒算起
complextimecontrol.prototype.getTomorrowTime = function () {
    var that = this;
    var time = that.getTodayTime();
    return time + 3600000 * 24;
};

/**
 *时间处理器
 */
complextimecontrol.prototype.getTimeByFormart = function (now, day, endHour, endMin, endSec) {
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
complextimecontrol.prototype.setLoading = function (show) {
    var that = this;

    var showLoadingMessageNode = document.getElementById(that.options.id + 'timeProgress');
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
complextimecontrol.prototype.timestampConvertTimeStr = function (time) {
    var newTime = new Date(time);
    var y = newTime.getFullYear();
    var m = newTime.getMonth() + 1;
    var d = newTime.getDate();
    var h = newTime.getHours();
    var mm = newTime.getMinutes();
    var ss = newTime.getSeconds();

    return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + (h < 10 ? "0" + h : h) + ":00:00";
};

//计算两个时间范围之间相差多少天
complextimecontrol.prototype.timeDiffDays = function (dt1, dt2) {
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
complextimecontrol.prototype.getStatus = function () {
    var that = this;
    return that.options.animation_running;
};

/**
*重新设置参数
*/
complextimecontrol.prototype.setOptions = function (option) {
    var that = this;
    that.options = that.extend(that.options, option, true); //配置参数
    that.initialize();
    that.setTime(that.options.time, "initTime");
};

complextimecontrol.prototype.destroy  =function(){
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
        /*TODO: the else if is a dirty quickfix to avoid replacements in the week day names, like "Marchriday" ('F' of friday is falsly taken as placeholder).
        This solution will work as long as the dateformat does not contain 'l' and 'F' at the same time. */
    } else if (format.indexOf('F') !== -1) {
        var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        format = format.replace('F', monthNames[this.getMonth()]);
    } else if (format.indexOf('C') !== -1) {
        var weekdays = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        format = format.replace('C', weekdays[this.getDay()]);
    }
    return format;
};

export {
    complextimecontrol
}

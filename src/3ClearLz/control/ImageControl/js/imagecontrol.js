/**
 *图片展示插件
 * @param option
 */
import $ from 'jquery';
function imageControl(option) {

    //1.能够进行自动赋值给现有参数 options
    this.options = this.options || {};

    //参数继承
    imageControl.prototype.extend = function (o, n, override) {
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
         * 控件唯一编号Id
         */
        id: "",

        /**
         * 取图地址
         * required
         */
        readImagesAddress: "http://123.232.109.172:58084/PicService?",

        /**
         * webapi读取数据的地址
         * required
         */
        webapiAddress: "http://192.168.1.68/WebAPI_JS",

        /**
         * 下载图片的地址，有可能webapi无法访问readImagesAddress地址，而能够访问downloadPicServerAddress地址
         * required
         */
        downloadPicServerAddress: "http://123.232.109.172:58084/PicService?",

        /**
         * 访问webapi查询图片信息的参数
         * required
         */
        queryImageSourcePara: {},

        /**
         * 容器节点,用于承载控件的父元素的ID或者dom
         * required
         */
        parent: 'body',

        /**
         * 快、中、慢的播放速度 默认 快：0.5秒钟，中：1秒钟，慢：1.5秒钟
         * option
         */
        playFrequency: [500, 1000, 1500],

        /**
         * 默认时间格式是yyyy-mm-dd hh时  还可以是年月日的数据  格式为  "yyyy-mm-dd"  还可以是年月日时分 yyyy-mm-dd hh:mm
         * option
         */
        timeFormate: "yyyy-mm-dd hh时",

        /**
         * 自定义图片缩放比例
         * option
         */
        customScaleZone: [0.25, 0.36, 0.51, 0.71, 1, 1.4, 1.96, 2.74, 3.84, 5.38, 7.53, 8],

        /**
         * 初始化完成后的回调函数
         * option
         */
        initCallBakc: null,

        /**
         * 图片缩放的最小比例
         * option
         */
        imgMinScale: 0.25,

        /**
         * 图片缩放的最大比例
         * option
         */
        imgMaxScale: 8,

        /**
         * 图片缩放步长 默认 0.25
         * option
         */
        imgScalStep: 0.25,

        /**
         * 图片缩放步长 默认 0.25
         * option
         */
        noDataBackGroundUrl:"../static/images/nodata/default.png",

        /**
         * 滚动条滚动一次加载图片的条数  由于滚动条是动态一般加载数据的，如果一次加载168条数据就会卡死，所以设置每次异步加载的条数
         * option
         */
        loadImagesCount: 10,

        /**
         * 是否已经加载了css
         */
        isLoadedStylelsheet: false,

        //播放速度的中间值
        timeFrequency: 500,

        //计时器
        timeoutVal: null,

        //是否正在播放中
        isPlaying: false,

        /**
         *创建的当前图片
         */
        img: null,

        /**
         *画布
         */
        canvas: null,

        /**
         *上下文
         */
        context: null,

        /**
         *图片是否已经加载完成
         */
        imgIsLoaded: false,

        /**
         *图片加载时相对于canvas的左上角位置x
         */
        imgX: 0,

        /**
         *图片加载时相对于canvas的左上角位置y
         */
        imgY: 0,

        /**
         *当前图片的缩放比例
         */
        imgScale: 1,

        //图片数据源
        srcImages: [],

        //目的图片数据源   这个是中间控制产生的变量不用传递
        destSrcImages: [],
    };

    this.options = this.extend(options, option, true); //配置参数

    this.addStyleSheet();

    //2.要执行初始化函数 initialize
    typeof this.initialize == "function" ? this.initialize() : function () {
        imageControl.prototype.initialize.apply(this, arguments);
    };

};

/**
 * 插件初始化函数
 */
imageControl.prototype.initialize = function () {
    var that = this;

    if (that.options.id == "")
        that.options.id = that.getGuid();

    that.queryDataSource(that.options.queryImageSourcePara, function (data) {
        that.options.destSrcImages = [];
        that.options.srcImages = data;
        that.close();
        that.createPanl();
        that.initMap();
        that.eventsInit();
        that.initScrollBar();
        //that.controlSmallViewPositon();
        if (that.options.initCallBakc != null) {
            that.options.initCallBakc();
        }
    });
};

/**
 * 添加样式
 */
imageControl.prototype.addStyleSheet = function (callBack) {
    var that = this;
    if (!that.isLoadedStylelsheet) {
        //var urlsCss = ['../../Content/css/imagecontrol.css', '../../Scripts/Scrollbar/jquery.mCustomScrollbar.css'];
        //var urlsScript = ['../Scrollbar/jquery.mCustomScrollbar.concat.min.js', '../Scrollbar/jquery.mousewheel.min.js'];

        var urlsCss = [];
        var urlsScript = [];
        for (var i = 0; i < urlsCss.length; i++) {
            //$('head').append('<link href="' + urls[i] + '" type="text/css" rel="stylesheet"/>');
            var head = document.head || document.getElementsByTagName('head')[0];
            var style = document.createElement('link');
            style.type = 'text/css';
            style.href = urlsCss[i];
            style.rel = "stylesheet";
            head.appendChild(style);
        }
        for (var i = 0; i < urlsScript.length; i++) {
            //$('head').append('<link href="' + urls[i] + '" type="text/css" rel="stylesheet"/>');
            var head = document.head || document.getElementsByTagName('head')[0];
            var style = document.createElement('script');
            style.type = 'text/javascript';
            style.href = urlsScript[i];
            head.appendChild(style);
        }
        that.isLoadedStylelsheet = true;
        if (callBack != null) {
            callBack();
        }
    }
};


/**
 * 创建控件页面布局
 */
imageControl.prototype.createPanl = function () {
    var that = this;
    var str =
        '<div id="' + that.options.id + '" class="_3clear_imageControl">' +
        //@*左边面板部分*@
        '<div class="_3clear_imageControl_smallview">' +
            '<div class="_3clear_imageControl_smallview_left_top"></div>' +
            '<div class="_3clear_imageControl_smallview_right_top"></div>' +
            //@*中间缩略图部分*@
            '<div title="第一张" class="_3clear_imageControl_smallview_first_page fa fa-caret-up fa-lg"></div>' +
            '<div class="_3clear_imageControl_smallview_middlecontent">' +
                '<ul>' +
                    that.createSmallViewList(that.options.loadImagesCount) +
                '</ul>' +
            '</div>' +
            '<div title="最后一张" class="_3clear_imageControl_smallview_last_page fa fa-caret-down fa-lg"></div>' +
        '</div>' +

       // @*右边面板部分*@
        '<div class="_3clear_imageControl_bigview" id="' + that.options.id + '_3clear_imageControl_bigview">' +
            '<canvas id="' + that.options.id + '_3clear_imageControl_bigview_mapcanvas" width=100 height=100></canvas>' +
        '</div>' +

        //@*操作栏  放大 缩小等等*@
        '<div class="_3clear_imageControl_operate">' +
            //'<div class="_3clear_imageControl_operate_lb _3clear_imageControl_operate_btn_left">播放控制：</div>' +
            '<div title="上一张" class="_3clear_imageControl_operate_btn _3clear_imageControl_operate_btn_left _3clear_imageControl_operate_btn _3clear_imageControl_operate_pre_picitem"></div>' +
            '<div title="播放/停止" class="_3clear_imageControl_operate_btn _3clear_imageControl_operate_btn_left _3clear_imageControl_operate_playorstopbtn _3clear_imageControl_operate_stop"></div>' +
            '<div title="下一张" class="_3clear_imageControl_operate_btn _3clear_imageControl_operate_btn_left _3clear_imageControl_operate_next_picitem"></div>' +

            '<div class="_3clear_imageControl_operate_btn_speed">' +
                '<div title="快" data_type="快" id="' + that.options.id + '_3clear_imageControl_operate_btn_speed_fast" class="_3clear_imageControl_operate_btn_speed_item _3clear_imageControl_operate_btn_speed_item_selected">快</div>' +
                '<div title="中" data_type="中" id="' + that.options.id + '_3clear_imageControl_operate_btn_speed_middle" class="_3clear_imageControl_operate_btn_speed_item _3clear_imageControl_operate_btn_speed_item_no_selected">中</div>' +
                '<div title="慢" data_type="慢" id="' + that.options.id + '_3clear_imageControl_operate_btn_speed_slow" class="_3clear_imageControl_operate_btn_speed_item _3clear_imageControl_operate_btn_speed_item_no_selected">慢</div>' +
            '</div>' +
            '<div class="_3clear_imageControl_operate_view_panel">' +
                '<div title="全屏" class="_3clear_imageControl_operate_view_btn _3clear_imageControl_operate_btn_right _3clear_imageControl_operate_fullsrc_btn fa fa-arrows-alt fa-2x"></div>' +
                '<div title="下载GIF" class="_3clear_imageControl_operate_view_btn _3clear_imageControl_operate_btn_right _3clear_imageControl_operate_downloadGIFPic fa fa-download fa-2x"></div>' +
                '<div title="收藏" class="_3clear_imageControl_operate_view_btn _3clear_imageControl_operate_btn_right fa fa-star-o fa-2x"></div>' +
                '<div title="下载" class="_3clear_imageControl_operate_view_btn _3clear_imageControl_operate_btn_right _3clear_imageControl_operate_downloadPic fa fa-cloud-download fa-2x"></div>' +
                '<div title="缩小" id="' + that.options.id + '_3clear_imageControl_operate_sx_btn" class="_3clear_imageControl_operate_view_btn _3clear_imageControl_operate_btn_right fa fa-search-minus fa-2x"></div>' +
                '<div title="放大" id="' + that.options.id + '_3clear_imageControl_operate_fd_btn" class="_3clear_imageControl_operate_view_btn _3clear_imageControl_operate_btn_right fa fa-search-plus fa-2x"></div>' +
                '<div title="复位" id="' + that.options.id + '_3clear_imageControl_operate_hsdx_btn" class="_3clear_imageControl_operate_view_btn _3clear_imageControl_operate_btn_right fa fa-dot-circle-o fa-2x"></div>' +
            '</div>' +
        '</div>';
    var box = typeof that.options.parent == "string" ? document.getElementById(that.options.parent) : that.options.parent;
    box.innerHTML = str;

    var div = document.createElement("div");
    if(div){
        div.className = "_3clear_imageControl_previewpanel";
        div.id = that.options.id + "_3clear_imageControl_previewpanel";
        document.body.appendChild(div);
    }
    
    var divContent = document.createElement("div");
    if(divContent){
         divContent.className = "_3clear_imageControl_previewpanel_content";
        divContent.id = that.options.id + "_3clear_imageControl_previewpanel_content";
        document.body.appendChild(divContent);
    }
   

    //var custom2 = that.scrollbot("._3clear_imageControl_smallview_middlecontent", 8);

    //custom2.setStyle({
    //    "background": "#5A5A5A",
    //    "z-index": "2",
    //}, {
    //    "background": "rgba(0,0,0,0)",
    //    "right": "1px"
    //});
    //var psuedo = document.createElement("div");
    //psuedo.style.cssText = "height:100%;width:2px;left:4px;background:#808080;position:absolute;z-index:1";
    //custom2.scrollBarHolder.appendChild(psuedo);
};


/**
 * 创建预览页面
 * @param obj
 * @param callBack
 */
imageControl.prototype.createPreview = function (obj, callBack) {
    var that = this;

    var img = new Image();
    img.onload = function () {
        var size = "";
        if (img.width > img.height) {
            size = 'height="100%"';
        } else {
            size = 'width="100%"';
        }
        var str =
     '<div class="_3clear_imageControl_previewpanel_content_head">' +
     '<div title="关闭窗口" class="_3clear_imageControl_previewpanel_content_head_close" id="' + that.options.id + '_3clear_imageControl_previewpanel_content_head_close"></div>' +
     '</div>' +
     '<div class="_3clear_imageControl_previewpanel_map" id="' + that.options.id + '_3clear_imageControl_previewpanel_map">' +
       '<img src="' + obj.srcBigImage + '" alt=""  style="vertical-align:middle;" ' + size + ' />' +
     '</div>';
        that.jquery("#" + that.options.id + "_3clear_imageControl_previewpanel")[0].style.display = "block";
        that.jquery("#" + that.options.id + "_3clear_imageControl_previewpanel_content")[0].style.display = "block";
        that.jquery("#" + that.options.id + "_3clear_imageControl_previewpanel_content")[0].innerHTML = str;
        callBack();

        //退出全屏
        that.jquery("#" + that.options.id + "_3clear_imageControl_previewpanel_content_head_close")[0].addEventListener('click', function () {
            that.jquery("#" + that.options.id + "_3clear_imageControl_previewpanel_content")[0].innerHTML = "";
            that.jquery("#" + that.options.id + "_3clear_imageControl_previewpanel")[0].style.display = "none";
            that.jquery("#" + that.options.id + "_3clear_imageControl_previewpanel_content")[0].style.display = "none";
        }, false);
    }
    img.src = obj.srcBigImage;
};

/**
 * 给dom节点注册事件
 */
imageControl.prototype.eventsInit = function () {
    var that = this;

    //如果没有数据则隐藏左边的面板
    // if(that.options.srcImages.length<=0){
    //     that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview")[0].style.display="none";
    // }else{
    //     that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview")[0].style.display="block";
    // }

    //切换快中慢
    var speedDivs = that.jquery("#" + that.options.id + " ._3clear_imageControl_operate_btn_speed_item");
    if (speedDivs != null && speedDivs.length > 0) {
        for (var i = 0; i < speedDivs.length; i++) {
            speedDivs[i].addEventListener('click', function () {
                for (var j = 0; j < speedDivs.length; j++) {
                    speedDivs[j].className = "_3clear_imageControl_operate_btn_speed_item _3clear_imageControl_operate_btn_speed_item_no_selected";
                }
                if(this){
                    this.className = "_3clear_imageControl_operate_btn_speed_item _3clear_imageControl_operate_btn_speed_item_selected";
                }
                switch (this.innerHTML) {
                    case "快":
                        that.options.timeFrequency = that.options.playFrequency[0];
                        break;
                    case "中":
                        that.options.timeFrequency = that.options.playFrequency[1];
                        break;
                    case "慢":
                        that.options.timeFrequency = that.options.playFrequency[2];
                        break;
                }
            }, false);
        }
    }

    /**
    * 移动地图事件
    * @param event
    */
    that.options.canvas.onmousedown = function (event) {
        var pos = that.windowToCanvas(that.options.canvas, event.clientX, event.clientY);
        that.options.canvas.onmousemove = function (event) {
            that.options.canvas.style.cursor = "move";
            var pos1 = that.windowToCanvas(that.options.canvas, event.clientX, event.clientY);
            var x = pos1.x - pos.x;
            var y = pos1.y - pos.y;
            pos = pos1;
            that.options.imgX += x;
            that.options.imgY += y;
            that.drawImage();
        }

        /**
         * 鼠标松开事件
         */
        that.options.canvas.onmouseup = function () {
            that.options.canvas.onmousemove = null;
            that.options.canvas.onmouseup = null;
            that.options.canvas.onmouseout = null;
            that.options.canvas.onmouseover = null;
            that.options.canvas.style.cursor = "default";
            that.removeClass(that.jquery("body")[0], "_3clear_imageControl_out");
            that.addClass(that.jquery("body")[0], "_3clear_imageControl_over");
        }

        /**
         * 鼠标移出canvas事件
         */
        that.options.canvas.onmouseout = function () {
            //that.options.canvas.style.cursor = "default";
            that.removeClass(that.jquery("body")[0], "_3clear_imageControl_over");
            that.addClass(that.jquery("body")[0], "_3clear_imageControl_out")
        }

        /**
         * 鼠标进入canvas事件
         */
        that.options.canvas.onmouseover = function () {
            // that.options.canvas.style.cursor = "default";
            that.removeClass(that.jquery("body")[0], "_3clear_imageControl_out");
            that.addClass(that.jquery("body")[0], "_3clear_imageControl_over");
        }

        /**
         * 鼠标松开事件
         */
        that.jquery("body")[0].onmouseup = function () {
            that.options.canvas.onmousemove = null;
            that.options.canvas.onmouseup = null;
            that.options.canvas.onmouseout = null;
            that.options.canvas.onmouseover = null;
            that.options.canvas.style.cursor = "default";
            that.removeClass(that.jquery("body")[0], "_3clear_imageControl_out");
            that.addClass(that.jquery("body")[0], "_3clear_imageControl_over");
        }
    }

    /**
     * 滚动鼠标放大缩小地图事件
     * @type {Function}
     */
    that.options.canvas.onmousewheel = that.options.canvas.onwheel = function (event) {
        var pos = that.windowToCanvas(that.options.canvas, event.clientX, event.clientY);
        var wheelDelta = event.wheelDelta ? event.wheelDelta : (event.deltaY * (-40));
        if (wheelDelta > 0) {
            that.zoom_In(pos);
        } else {
            that.zoom_Out(pos);
        }
    }

    //合适大小
    document.getElementById(that.options.id + '_3clear_imageControl_operate_hsdx_btn').addEventListener('click', function () {
        var h = document.getElementById(that.options.id + '_3clear_imageControl_bigview').offsetHeight;

        h = h - 10;

        var hsize = h / that.options.img.height;
        if (!isNaN(parseInt((Math.round(hsize * 100) / 100) * 100))) {
            that.options.imgScale = Math.round(hsize * 100) / 100;
            that.setImgScale(that.options.imgScale);
            that.setCenter();
        }
    }, false);

    //放大
    document.getElementById(that.options.id + '_3clear_imageControl_operate_fd_btn').addEventListener('click', function () {
        that.zoom_In({ x: that.options.canvas.width / 2, y: that.options.canvas.height / 2 });
    });

    //缩小
    document.getElementById(that.options.id + '_3clear_imageControl_operate_sx_btn').addEventListener('click', function () {
        that.zoom_Out({ x: that.options.canvas.width / 2, y: that.options.canvas.height / 2 });
    });

    that.clickSmallView();

    //播放动画
    var playBtn = that.jquery("#" + that.options.id + " ._3clear_imageControl_operate_playorstopbtn");
    if (playBtn != null && playBtn.length > 0) {
        playBtn[0].addEventListener('click', function () {
            if (that.options.srcImages.length > 0) {
                //没有播放
                if (!that.options.isPlaying) {
                    that.startPlay();
                }
                    //正在播放中
                else {
                    that.stopPlay();
                }
            }
        }, false);
    }

    //上一张
    that.jquery("#" + that.options.id + " ._3clear_imageControl_operate_pre_picitem")[0].addEventListener('click', function () {
        var index = -1;
        var elements = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul li ._3clear_imageControl_smallview_pic_item");
        for (var i = 0; i < elements.length; i++) {
            if (that.hasClass(elements[i], "_3clear_imageControl_smallview_pic_item_selected")) {
                index = i;
                break;
            }
        }

        if (index > 0 && index < that.options.destSrcImages.length) {
            that.removeClass(elements[index], "_3clear_imageControl_smallview_pic_item_selected");
            that.addClass(elements[index - 1], "_3clear_imageControl_smallview_pic_item_selected");
            if (that.options.destSrcImages[index - 1] != null) {
                that.editSource(that.options.destSrcImages[index - 1],function(){
                    var height = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_pic_item_selected")[0].clientHeight;
                    if($!=null&&$!=undefined){
                        $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent").mCustomScrollbar("scrollTo", (index - 1) * (height + 35));//：滚动到某个位置（像素单位）
                    }
                });
            }
            
        }
    }, false);

    //下一张
    that.jquery("#" + that.options.id + " ._3clear_imageControl_operate_next_picitem")[0].addEventListener('click', function () {
        var index = -1;
        var elements = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul li ._3clear_imageControl_smallview_pic_item");
        for (var i = 0; i < elements.length; i++) {
            if (that.hasClass(elements[i], "_3clear_imageControl_smallview_pic_item_selected")) {
                index = i;
            }
        }
        if (index < that.options.destSrcImages.length - 1) {
            that.removeClass(elements[index], "_3clear_imageControl_smallview_pic_item_selected");
            that.addClass(elements[index + 1], "_3clear_imageControl_smallview_pic_item_selected");
            if (that.options.destSrcImages[index + 1] != null) {
                that.editSource(that.options.destSrcImages[index + 1],function(){
                    var height = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_pic_item_selected")[0].clientHeight;
                    if($!=null&&$!=undefined){
                        $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent").mCustomScrollbar("scrollTo", (index + 1) * (height + 35));//：滚动到某个位置（像素单位）
                    }
                });
            }
        }
    }, false);

    //第一张
    that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_first_page")[0].addEventListener('click', function () {
        if($!=null&&$!=undefined){
            $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent").mCustomScrollbar("scrollTo", "top");//：滚动到顶部（垂直滚动条）
        }
        var divs = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent li ._3clear_imageControl_smallview_pic_item");
        var li = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent li");
        for (var i = 0; i < li.length; i++) {
            that.removeClass(divs[i], "_3clear_imageControl_smallview_pic_item_selected");
        }
        that.addClass(divs[0], "_3clear_imageControl_smallview_pic_item_selected");
        if (that.options.destSrcImages[0] != null) {
            that.editSource(that.options.destSrcImages[0]);
        }

    }, false);

    //最后一张
    that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_last_page")[0].addEventListener('click', function () {
        if($!=null&&$!=undefined){
            $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent").mCustomScrollbar("scrollTo", "bottom");//：滚动到底部（垂直滚动条）
        }

        var divs = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent li ._3clear_imageControl_smallview_pic_item");
        var li = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent li");
        for (var i = 0; i < li.length; i++) {
            that.removeClass(divs[i], "_3clear_imageControl_smallview_pic_item_selected");
        }
        that.addClass(divs[divs.length - 1], "_3clear_imageControl_smallview_pic_item_selected");
        if (that.options.destSrcImages[divs.length - 1] != null) {
            that.editSource(that.options.destSrcImages[divs.length - 1]);
        }
    }, false);


    //图片下载
    that.jquery("#" + that.options.id + " ._3clear_imageControl_operate_downloadPic")[0].addEventListener('click', function () {
        var index = -1;
        var elements = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul li ._3clear_imageControl_smallview_pic_item");
        for (var i = 0; i < elements.length; i++) {
            if (that.hasClass(elements[i], "_3clear_imageControl_smallview_pic_item_selected")) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            var downloadObj = that.options.destSrcImages[index];
            window.open(that.options.webapiAddress + "/api/DownLoad/DownLoadFileStream?url=" + encodeURIComponent(downloadObj.downloadImage));
        } else {
            alert("没有数据可下载！");
        }
    }, false);

    //GIF图片下载
    that.jquery("#" + that.options.id + " ._3clear_imageControl_operate_downloadGIFPic")[0].addEventListener('click', function () {
        var descs = "";
        if(that.options.destSrcImages!=undefined&&that.options.destSrcImages.length>0){
            for(var i=0;i<that.options.destSrcImages.length;i++){
                descs = descs+that.options.destSrcImages[i].downloadImage+"#";
            }
            window.open(that.options.webapiAddress + "/api/DownLoad/CreatGif?url=" + encodeURIComponent(descs));
        }else {
            alert("没有数据可下载！");
        }
    }, false);

    
    //全屏浏览
    that.jquery("#" + that.options.id + " ._3clear_imageControl_operate_fullsrc_btn")[0].addEventListener('click', function () {
        var index = -1;
        var elements = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul li ._3clear_imageControl_smallview_pic_item");
        for (var i = 0; i < elements.length; i++) {
            if (that.hasClass(elements[i], "_3clear_imageControl_smallview_pic_item_selected")) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            var downloadObj = that.options.destSrcImages[index];
            that.createPreview(downloadObj, function () {

            });
        }
    }, false);

    window.addEventListener('resize', function () {
        that.reCanvasSize()
    }, false);
};

///点击小图，切换右边的大图
imageControl.prototype.clickSmallView = function () {
    var that = this;

    //点击左边的小图触发的事件
    var lis = that.jquery("#" + that.options.id + "_3clear_imageControl ._3clear_imageControl_smallview_middlecontent li");
   
    for (var i = 0; i < lis.length; i++) {
        lis[i].index = i;
       
        lis[i].addEventListener('click', function () {
            var divs = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent li ._3clear_imageControl_smallview_pic_item");
            var li = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent li");
            for (var i = 0; i < li.length; i++) {
                that.removeClass(divs[i], "_3clear_imageControl_smallview_pic_item_selected");
            }
            that.addClass(divs[this.index], "_3clear_imageControl_smallview_pic_item_selected");
            if (that.options.destSrcImages[this.index] != null) {
                that.editSource(that.options.destSrcImages[this.index]);
            }
        }, false);
    };
};

/**
  * 初始化滚动条控件
  */
imageControl.prototype.initScrollBar = function () {
    var that = this;
    if ($("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent") != undefined) {
        $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent").mCustomScrollbar({
            setTop: 0,
            axis: "y",
            scrollbarPosition: "outside",
            theme: "3d",
            mouseWheel: true,
            callbacks: {
                onScrollStart: function () {

                },
                onScroll: function () {
					
                },
                onTotalScroll: function () {
                    //$("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent").stop(true, false);
                    //var str = that.createSmallViewList(that.options.loadImagesCount);
                    //if (str != "")
                    //    $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul").append(str);
                },
                onTotalScrollBack: function () {

                },
                onTotalScrollOffset: 100,
                whileScrolling: function () {
                    if (this.mcs.topPct >= 90) {    // 这表示当滚动条滚动到这个div的90%(当然这个值是可变的)的时候调用下面的代码，
                        $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent").stop(true, false);
                        var str = that.createSmallViewList(that.options.loadImagesCount);
                        if (str != ""){
                            $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul").append(str);
                            that.clickSmallView();
                            }
                       
                    }

                },
                whileScrollingInterval: 30
            }
        });
    }
};

/**
  * 生成随机GUID码
  * @returns {string}
  */
imageControl.prototype.getGuid = function () {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

/**
 * 获取数据源
 * @param para  取图参数
 * @param titleSrc  提示标题
 * @param callBack  查询数据完成后的回调函数
 */
imageControl.prototype.queryDataSource = function (para, callBack) {
    var that = this;
    that.options.queryImageSourcePara = para;
    //that.removeImage();

    //调用包装好的ajax方法
    that.ajax({
        method: "get",
        url: that.options.webapiAddress + "/api/SendPost/GetFigurePath",
        asyn: true,
        dataType: "json",
        data: "config=" + JSON.stringify(para),
        fn: function (res) {
            switch (res.StatusCode) {
                case 500:
                    //alert("服务器端异常或者网络异常，请联系管理员。详细信息:" + res.HttpRequestMessage);
                    callBack([]);
                    break;
                case 200:
                    var resultData = that.filterData(res.HttpContent);
                    callBack(resultData);
                    break;
            }
        }
    });
};

/**
 * 设置新的数据源
 * @param imageSrc
 */
imageControl.prototype.setDataSource = function (imageSrc) {
    var that = this;
    if (that.options.isPlaying) {
        that.stopPlay();
    }
    for (var i = 0; i < imageSrc.length; i++) {
        imageSrc[i].index = i;
    }
    that.options.srcImages = imageSrc;
    that.options.destSrcImages = [];

    //如果没有数据则隐藏左边的面板
    // if(that.options.srcImages.length<=0){
    //     that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview")[0].style.display="none";
    // }else{
    //     that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview")[0].style.display="block";
    // }


    if (imageSrc != "" && imageSrc != undefined) {
        that.initMap();
        var str = that.createSmallViewList(that.options.loadImagesCount);
        that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul")[0].innerHTML = "";
        that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul")[0].innerHTML = str;

        that.clickSmallView();

    } else {
        that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul")[0].innerHTML = "";
        that.initMap();
    }
};

/**
   * 过滤有图的数据
   * @param data
   * @param str
   * @returns {Array}
   */
imageControl.prototype.filterData = function (data) {
    var that = this;
    var filterResult = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i].url != "") {
            var obj = {};
            switch (that.options.timeFormate) {
                case "yyyy-mm-dd hh时":
                    obj.sc = data[i].picTime.substr(0, 4) + "-" + data[i].picTime.substr(4, 2) + "-" + data[i].picTime.substr(6, 2) + " " + data[i].picTime.substr(8, 2) + "时";
                    break;
                case "yyyy-mm-dd":
                    obj.sc = data[i].picTime.substr(0, 4) + "-" + data[i].picTime.substr(4, 2) + "-" + data[i].picTime.substr(6, 2);
                    break;
                case "yyyy-mm-dd hh:mm":
                    obj.sc = data[i].picTime.substr(0, 4) + "-" + data[i].picTime.substr(4, 2) + "-" + data[i].picTime.substr(6, 2) + " " + data[i].picTime.substr(8, 2) + ":00";
                    break;
            }
            obj.srcSamllImage = that.getImage("small", data[i].url, that.options.readImagesAddress);
            obj.srcBigImage = that.getImage("large", data[i].url, that.options.readImagesAddress);
            obj.downloadImage = that.getImage("large", data[i].url, "");
            filterResult.push(obj);
        }
    }
    return filterResult;
};

/**
 * 拼接大图或者小图的地址
 * @param shape
 * @param path
  *@param serverAddress 
 * @returns {string}
 */
imageControl.prototype.getImage = function (shape, path, serverAddress) {
    var that = this;
    var url = serverAddress;
    return url + 'shape=' + shape + '&path=' + path;
};

/**
 * ajax请求封装
 * @param url     请求url
 * @param data    请求数据
 * @param method  get或者post
 * @param success 回调函数
 */
imageControl.prototype.ajax = function (myJson) {
    //新建ajax对象
    var xhr = null;
    window.XMLHttpRequest ? (xhr = new XMLHttpRequest()) : (xhr = new ActiveXObject("Microsoft.XMLHTTP"));
    //定义数据传输方法“get”或“post”，如果没有写，那么默认的是用“get”方法！
    var method = myJson.method || "get";
    //定义数据传输的地址！
    var url = myJson.url;
    //定义数据加载方式（同步或异步），默认的情况下，使用ajax，都是异步加载！
    var asyn = myJson.asyn || true;
    //定义传输的具体数据！
    var data = myJson.data;
    //成功之后执行的方法！
    var fn = myJson.fn;
    ///请求到的数据格式
    var dataType = myJson.dataType;

    //第一种情况：如果是用get方法，并且data是存在的，就执行：
    if (method == "get" && data) {
        xhr.open(method, url + "?" + data + "&" + Math.random(), asyn);
    }
    //第二种情况：如果是用post方法，并且data是存在的，就执行：
    if (method == "post" && data) {
        xhr.open(method, url, asyn);
        xhr.setRequestHeader("content-type", "application/x-www-form-urlencoded");
        xhr.send(data);
    } else {
        xhr.send();
    }
    //数据传输成功之后
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            if (dataType == "text" || dataType == "TEXT") {
                if (fn != null) {
                    //普通文本
                    fn(xhr.responseText);
                }
            } else if (dataType == "xml" || dataType == "XML") {
                if (fn != null) {
                    //接收xml文档    
                    fn(xhr.responseXML);
                }
            } else if (dataType == "json" || dataType == "JSON") {
                if (fn != null) {
                    //将json字符串转换为js对象  
                    fn(eval("(" + xhr.responseText + ")"));
                }
            }
        }
    }
};

/**
   * 初始化地图
   */
imageControl.prototype.initMap = function () {
    var that = this;

    that.options.canvas = document.getElementById(that.options.id + "_3clear_imageControl_bigview_mapcanvas");

    if(document.getElementById(that.options.id + "_3clear_imageControl_bigview")!=null){
        that.options.canvas.height = document.getElementById(that.options.id + "_3clear_imageControl_bigview").offsetHeight;
        that.options.canvas.width = document.getElementById(that.options.id + "_3clear_imageControl_bigview").offsetWidth;

        that.removeCanvasNoDataBackGround();
        that.addCanvasBackGround();
        that.options.context = that.options.canvas.getContext('2d');
        that.options.img = new Image();
        that.options.img.onload = function () {
            that.options.imgIsLoaded = true;
            that.removeCanvasBackGround();
            if(document.getElementById(that.options.id + "_3clear_imageControl_bigview")!=null){
                var h = document.getElementById(that.options.id + "_3clear_imageControl_bigview").offsetHeight;

                //让顶部和底部有一点间距
                h = h - 10;

                var hsize = h / that.options.img.height;
                that.options.imgScale = that.getRecentlyValue(hsize);
                that.options.imgScale = Math.round(hsize * 100) / 100;
                that.setImgScale(that.options.imgScale);
                that.setCenter()
            }
        }

        if (that.options.srcImages.length == 0) {
            that.removeCanvasBackGround();
            //that.setMapTitleAndDataSrc("", "");
            that.addCanvasNoDataBackGround();
        } else {
            //that.setMapTitleAndDataSrc(that.srcImages[0].sc, that.srcImages[0].fromSrc);
            that.options.img.src = that.options.srcImages[0].srcBigImage;
        }
    }
};

/**
  * 添加图层
  * @param srcImage
  */
imageControl.prototype.editSource = function (srcImage, callback) {
    var that = this;
    that.loadImg(srcImage.srcBigImage, callback);
};

/**
 * 移除canvas中的图片
 */
imageControl.prototype.removeImage = function () {
    var that = this;
    if (that.options.context != null) {
        that.options.context.clearRect(0, 0, that.options.canvas.width, that.options.canvas.height);
        that.imgIsLoaded = false;
    }
};

/**
 *加载图片
 * @param url
 * @param callback
 */
imageControl.prototype.loadImg = function (url, callback) {
    var that = this;
//  that.removeImage();
	that.imgIsLoaded = false;
    that.options.img = new Image();
    that.addCanvasBackGround();
    that.options.img.onload = function () {
        that.options.imgIsLoaded = true;
        that.removeCanvasBackGround();
        
        that.drawImage();
        if (callback != undefined && typeof (callback) == 'function') {
            callback();
        }
    }
    that.options.img.src = url;
};

/**
 *给canvas添加背景
 */
imageControl.prototype.addCanvasBackGround = function () {
    var that = this;
    if(that.options.canvas){
        that.options.canvas.className = "_3clear_imageControl_canvasBackGround";
    }
    //that.options.canvas.style.backgroundImage = 'url(../../Content/image2/timg.gif)';
    //that.options.canvas.style.backgroundRepeat = 'no-repeat';
    //that.options.canvas.style.backgroundPosition = 'center';
};

/**
 *去掉canvas的背景
 */
imageControl.prototype.removeCanvasBackGround = function () {
    var that = this;
    if(that.options.canvas){
        that.options.canvas.className = "";
    }
    //that.options.canvas.style.backgroundImage = 'url("")';
}

/**
 *给canvas添加没有数据的背景
 */
imageControl.prototype.addCanvasNoDataBackGround = function () {
    var that = this;
    that.options.canvas.style.backgroundImage = 'url('+that.options.noDataBackGroundUrl+')';
    //that.options.canvas.style.backgroundImage = 'url("../static/images/nodata/default.jpg")';
    that.options.canvas.style.backgroundRepeat = 'no-repeat';
    that.options.canvas.style.backgroundPosition = 'center';
};

/**
 *去掉canvas没有数据的背景
 */
imageControl.prototype.removeCanvasNoDataBackGround = function () {
    var that = this;
    that.options.canvas.style.backgroundImage = 'none';
}

/**
 * 通过传入一个值计算出与缩放比例最接近的值
 * @param value
 * @returns {*}
 */
imageControl.prototype.getRecentlyValue = function (value) {
    var that = this;
    var boundsArray = [];
    var absArray = [];
    if (that.options.customScaleZone.length == 0) {
        for (var i = that.options.imgMinScale; i <= that.options.imgMaxScale; i = i + that.options.imgScalStep) {
            boundsArray.push(i);
            absArray.push(Math.abs(i - value));
        }
    } else {
        for (var i = 0; i < that.options.customScaleZone.length; i++) {
            boundsArray.push(that.options.customScaleZone[i]);
            absArray.push(Math.abs(that.options.customScaleZone[i] - value));
        }
    }

    var minValue = Math.min.apply(null, absArray);
    for (var i = 0; i < absArray.length; i++) {
        if (absArray[i] == minValue) {
            return boundsArray[i];
        }
    }
}

/**
 *
 * @param scale
 */
imageControl.prototype.setImgScale = function (scale) {
    var that = this;
    that.options.imgScale = scale;
    //$("#" + that.options.id + " ._3clearMapControl_Operate_currentLevelTip").html(parseInt(scale * 100) + "%");
};

/**
 * 设置canvas中的图片坐标剧中
 */
imageControl.prototype.setCenter = function () {
    var that = this;
    that.options.imgX = that.options.canvas.width / 2 - that.options.img.width * that.options.imgScale / 2;
    that.options.imgY = that.options.canvas.height / 2 - that.options.img.height * that.options.imgScale / 2;
    that.drawImage();
};

/**
 * 在canvas上绘制图片
 */
imageControl.prototype.drawImage = function () {
    var that = this;
    that.options.context.clearRect(0, 0, that.options.canvas.width, that.options.canvas.height);
    that.options.context.drawImage(that.options.img, 0, 0, that.options.img.width, that.options.img.height, that.options.imgX, that.options.imgY, that.options.img.width * that.options.imgScale, that.options.img.height * that.options.imgScale);
};

/**
 * 放大
 * @param pos 放大的中心点位置
 */
imageControl.prototype.zoom_In = function (pos) {
    var that = this;
    if (that.options.imgScale < that.options.imgMaxScale) {
        if (that.options.customScaleZone.length == 0) {
            that.options.imgScale += that.options.imgScalStep;
            that.setImgScale(that.options.imgScale);
            that.options.imgX = that.options.imgX * that.options.imgScale / (that.options.imgScale - that.options.imgScalStep) - pos.x * (that.options.imgScale / (that.options.imgScale - that.options.imgScalStep) - 1);
            that.options.imgY = that.options.imgY * that.options.imgScale / (that.options.imgScale - that.options.imgScalStep) - pos.y * (that.options.imgScale / (that.options.imgScale - that.options.imgScalStep) - 1);
            that.drawImage();
        } else {
            var index = -1;
            for (var i = 0; i < that.options.customScaleZone.length; i++) {
                if (that.options.imgScale == that.options.customScaleZone[i]) {
                    index = i;
                }
            }
            if (index < that.options.customScaleZone.length - 1 && index > 0) {
                that.options.imgScale = that.options.customScaleZone[index + 1];
                that.setImgScale(that.options.imgScale);
                that.options.imgX = that.options.imgX * that.options.imgScale / that.options.customScaleZone[index] - pos.x * (that.options.imgScale / (that.options.customScaleZone[index]) - 1);
                that.options.imgY = that.options.imgY * that.options.imgScale / that.options.customScaleZone[index] - pos.y * (that.options.imgScale / (that.options.customScaleZone[index]) - 1);
                that.drawImage();
            } else {
                var historyImageScale = that.options.imgScale;
                that.options.imgScale = that.getRecentlyValue(that.options.imgScale);
                if (historyImageScale == that.options.imgScale) {
                    that.options.imgScale = that.options.customScaleZone[index + 1];
                }
                that.setImgScale(that.options.imgScale);
                that.options.imgX = that.options.imgX * that.options.imgScale / historyImageScale - pos.x * (that.options.imgScale / historyImageScale - 1);
                that.options.imgY = that.options.imgY * that.options.imgScale / historyImageScale - pos.y * (that.options.imgScale / historyImageScale - 1);
                that.drawImage();
            }
        }
    }
};

/**
 * 缩小
 * @param pos 缩小的中心点位置
 */
imageControl.prototype.zoom_Out = function (pos) {
    var that = this;
    if (that.options.imgScale > that.options.imgMinScale) {
        if (that.options.customScaleZone.length == 0) {
            that.options.imgScale -= that.options.imgScalStep;
            that.setImgScale(that.options.imgScale);
            that.options.imgX = pos.x - (pos.x - that.options.imgX) * (that.options.imgScale / (that.options.imgScale + that.options.imgScalStep));
            that.options.imgY = pos.y - (pos.y - that.options.imgY) * (that.options.imgScale / (that.options.imgScale + that.options.imgScalStep));
            that.drawImage();
        } else {
            var index = -1;
            for (var i = 0; i < that.options.customScaleZone.length; i++) {
                if (that.options.imgScale == that.options.customScaleZone[i]) {
                    index = i;
                }
            }
            if (index > 0) {
                that.options.imgScale = that.options.customScaleZone[index - 1];
                that.setImgScale(that.options.imgScale);
                that.options.imgX = pos.x - (pos.x - that.options.imgX) * (that.options.imgScale / that.options.customScaleZone[index]);
                that.options.imgY = pos.y - (pos.y - that.options.imgY) * (that.options.imgScale / that.options.customScaleZone[index]);
                that.drawImage();
            } else {
                var historyImageScale = that.options.imgScale;
                that.options.imgScale = that.getRecentlyValue(that.options.imgScale);
                if (historyImageScale == that.options.imgScale) {
                    that.options.imgScale = that.options.customScaleZone[index - 1];
                }
                that.setImgScale(that.options.imgScale);
                that.options.imgX = pos.x - (pos.x - that.options.imgX) * (that.options.imgScale / historyImageScale);
                that.options.imgY = pos.y - (pos.y - that.options.imgY) * (that.options.imgScale / historyImageScale);
                that.drawImage();
            }
        }
    }
};

/**
 * 重置canvas大小
 */
imageControl.prototype.reCanvasSize = function () {
    var that = this;
    that.initMap();
};

/**
   * 开始播放
   */
imageControl.prototype.startPlay = function () {
    var that = this;
    that.options.isPlaying = true;
    var btn = that.jquery("#" + that.options.id + " ._3clear_imageControl_operate_playorstopbtn");
    if (btn != null && btn.length > 0) {
        that.removeClass(btn[0], "_3clear_imageControl_operate_stop");
        that.addClass(btn[0], "_3clear_imageControl_operate_play");
    }

    var index = -1;
    var elements = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent ul li ._3clear_imageControl_smallview_pic_item");
    for (var i = 0; i < elements.length; i++) {
        if (that.hasClass(elements[i], "_3clear_imageControl_smallview_pic_item_selected")) {
            index = i;
            break;
        }
    }

    if (that.options.destSrcImages.length > 0) {
        if (that.options.destSrcImages[0].index <= index && index < (that.options.destSrcImages[that.options.destSrcImages.length - 1].index)) {
            that.removeClass(elements[index], "_3clear_imageControl_smallview_pic_item_selected");
            that.addClass(elements[index + 1], "_3clear_imageControl_smallview_pic_item_selected");
            that.editSource(that.options.destSrcImages[index + 1], function () {
                switch (that.options.isPlaying) {
                    case true:
                        //if (that.jquery("._3clear_imageControl_smallview_middlecontent")[0].clientHeight >= elements[index + 1].offsetTop) {
                        //    that.jquery("._3clear_imageControl_smallview_middlecontent ul")[0].style.top = -elements[index + 1].offsetTop + 'px'
                        //}

                        var height = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_pic_item_selected")[0].clientHeight;
                        if($!=null&&$!=undefined){
                            $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent").mCustomScrollbar("scrollTo", (index + 1) * (height + 35));//：滚动到某个位置（像素单位）
                        }
                        that.options.timeoutVal = setTimeout(that.startPlay.bind(that), that.options.timeFrequency);
                        break;
                    case false:
                        that.stopPlay();
                        break;
                }
            });
        } else {
            that.removeClass(elements[index], "_3clear_imageControl_smallview_pic_item_selected");
            index = that.options.destSrcImages[0].index;
            that.addClass(elements[index], "_3clear_imageControl_smallview_pic_item_selected");
            that.editSource(that.options.destSrcImages[index], function () {
                switch (that.options.isPlaying) {
                    case true:
                        var height = that.jquery("#" + that.options.id + " ._3clear_imageControl_smallview_pic_item_selected")[0].clientHeight;
                        if($!=null&&$!=undefined){
                            $("#" + that.options.id + " ._3clear_imageControl_smallview_middlecontent").mCustomScrollbar("scrollTo", (index + 1) * (height + 35));//：滚动到某个位置（像素单位）
                        }
                        that.options.timeoutVal = setTimeout(that.startPlay.bind(that), that.options.timeFrequency);
                        break;
                    case false:
                        that.stopPlay();
                        break;
                }
            });
        }
    }
};

/**
 * 停止播放
 */
imageControl.prototype.stopPlay = function () {
    var that = this;

    var btn = that.jquery("#" + that.options.id + " ._3clear_imageControl_operate_playorstopbtn");
    if (btn != null && btn.length > 0) {
        that.removeClass(btn[0], "_3clear_imageControl_operate_play");
        that.addClass(btn[0], "_3clear_imageControl_operate_stop");
    }

    clearTimeout(that.options.timeoutVal);
    that.options.isPlaying = false;
};

/**
 * 把屏幕坐标转换成canvas上的坐标
 * @param canvas
 * @param x
 * @param y
 * @returns {{x: number, y: number}}
 */
imageControl.prototype.windowToCanvas = function (canvas, x, y) {
    var that = this;
    var bbox = that.options.canvas.getBoundingClientRect();
    return {
        x: x - bbox.left - (bbox.width - that.options.canvas.width) / 2,
        y: y - bbox.top - (bbox.height - that.options.canvas.height) / 2
    };
};

/**
 * 创建左边的小视图列表
 * @param loadCount 每次加载小试图列表的条数
 * @returns {string}
 */
imageControl.prototype.createSmallViewList = function (loadCount) {
    var that = this;

    if (that.options.isHidingSmallView) {
        loadCount = that.options.srcImages.length;
    }

    var str = '';
    if (that.options.destSrcImages.length < that.options.srcImages.length) {
        var count = that.options.srcImages.length - that.options.destSrcImages.length;
        if (count > loadCount) {
            var destCount = that.options.destSrcImages.length;
            for (var i = destCount; i < destCount + loadCount; i++) {
                str = str +
                  '<li title="' + that.options.srcImages[i].sc + '">' +
                  '<div class="_3clear_imageControl_smallview_pic_item' + (i == 0 ? ' _3clear_imageControl_smallview_pic_item_selected' : "") + '">' +
                      '<div class="_3clear_imageControl_smallview_pic_item_left_top"></div>' +
                      '<div class="_3clear_imageControl_smallview_pic_item_right_top"></div>' +
                      '<div class="_3clear_imageControl_smallview_pic_item_left_bottom"></div>' +
                      '<div class="_3clear_imageControl_smallview_pic_item_right_bottom"></div>' +
                  '<img src="' + (that.options.isHidingSmallView ? "#" : that.options.srcImages[i].srcSamllImage) + '" />' +
                  '</div>' +
                  '<div class="_3clear_imageControl_smallview_time">' + that.options.srcImages[i].sc + '</div>' +
                  '</li>';
                var obj = that.options.srcImages[i];
                obj.index = i;
                that.options.destSrcImages.push(obj);
            }
        } else {
            var destCount = that.options.destSrcImages.length;
            for (var i = destCount; i < destCount + count; i++) {
                str = str +
                  '<li title="' + that.options.srcImages[i].sc + '">' +
                  '<div class="_3clear_imageControl_smallview_pic_item' + (i == 0 ? ' _3clear_imageControl_smallview_pic_item_selected' : "") + '">' +
                      '<div class="_3clear_imageControl_smallview_pic_item_left_top"></div>' +
                      '<div class="_3clear_imageControl_smallview_pic_item_right_top"></div>' +
                      '<div class="_3clear_imageControl_smallview_pic_item_left_bottom"></div>' +
                      '<div class="_3clear_imageControl_smallview_pic_item_right_bottom"></div>' +
                  '<img src="' + (that.options.isHidingSmallView ? "#" : that.options.srcImages[i].srcSamllImage) + '" />' +
                  '</div>' +
                  '<div class="_3clear_imageControl_smallview_time">' + that.options.srcImages[i].sc + '</div>' +
                  '</li>';
                var obj = that.options.srcImages[i];
                obj.index = i;
                that.options.destSrcImages.push(obj);
            }
        }
    }
    return str;
};

/**
 * 关闭函数
 */
imageControl.prototype.close = function () {
    var that = this;
    //关闭注册的事件
};

//类似jquery方式读取dom--------------------------------------------------------------------------------------------------start
imageControl.prototype.jquery = function (args) {
    var that = this;

    //创建一个数组，用来保存获取的节点或节点数组
    that.elements = [];
    //当参数是一个字符串，说明是常规css选择器，不是this,或者function
    if (typeof args == 'string') {
        //css模拟，就是跟CSS后代选择器一样
        if (args.indexOf(' ') != -1) {
            //把节点拆分开并保存在数组里
            var elements = args.split(' ');
            //存放临时节点对象的数组，解决被覆盖问题
            var childElements = [];
            var node = [];   //用来存放父节点用的
            for (var i = 0; i < elements.length; i++) {
                //如果默认没有父节点，就指定document
                if (node.length == 0) node.push(document);
                switch (elements[i].charAt(0)) {
                    //id
                    case '#':
                        //先清空临时节点数组
                        childElements = [];
                        childElements.push(that.getId(elements[i].substring(1)));
                        node = childElements;  //保存到父节点
                        break;
                        //类
                    case '.':
                        childElements = [];
                        //遍历父节点数组，匹配符合className的所有节点
                        for (var j = 0; j < node.length; j++) {
                            var temps = that.getClass(elements[i].substring(1), node[j]);
                            for (var k = 0; k < temps.length; k++) {
                                childElements.push(temps[k]);
                            }
                        }
                        node = childElements;
                        break;
                        //标签
                    default:
                        childElements = [];
                        for (var j = 0; j < node.length; j++) {
                            var temps = that.getTagName(elements[i], node[j]);
                            for (var k = 0; k < temps.length; k++) {
                                childElements.push(temps[k]);
                            }
                        }
                        node = childElements;
                }
            }
            that.elements = childElements;
        } else {
            //find模拟,就是说只是单一的选择器
            switch (args.charAt(0)) {
                case '#':
                    that.elements.push(that.getId(args.substring(1)));
                    break;
                case '.':
                    that.elements = that.getClass(args.substring(1));
                    break;
                default:
                    that.elements = that.getTagName(args);
            }
        }
    } else if (typeof args == 'Object') {
        if (args != undefined) {
            that.elements[0] = args;
        }
    } else if (typeof args == 'function') {
        //这里不讲
        that.ready(args);
    }
    return that.elements;
}

//获取ID节点
imageControl.prototype.getId = function (id) {
    return document.getElementById(id);
}

//获取CLASS节点数组
imageControl.prototype.getClass = function (className, parentNode) {
    var node = null;   //存放父节点
    var temps = [];
    if (parentNode != undefined) { //存在父节点时
        node = parentNode;
    } else { //不存在则默认document
        node = document;
    }
    var all = node.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) {
        //遍历所有节点，判断是否有包含className
        if ((new RegExp('(\\s|^)' + className + '(\\s|$)')).test(all[i].className)) {
            temps.push(all[i]);
        }
    }
    return temps;
}

//获取元素节点数组
imageControl.prototype.getTagName = function (tag, parentNode) {
    var node = null;   //存放父节点
    var temps = [];
    if (parentNode != undefined) {
        node = parentNode;
    } else {
        node = document;
    }
    var tags = node.getElementsByTagName(tag);
    for (var i = 0; i < tags.length; i++) {
        temps.push(tags[i]);
    }
    return temps;
}

//判断有没有class
imageControl.prototype.hasClass = function (element, className) {
    var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
    return element.className.match(reg);
}

//添加class
imageControl.prototype.addClass = function (element, className) {
    if (!this.hasClass(element, className)) {
        element.className += " " + className;
    }
}

//移出class
imageControl.prototype.removeClass = function (element, className) {
    if (this.hasClass(element, className)) {
        var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
        element.className = element.className.replace(reg, ' ');
        if (element.className.trim() == "" && element.className != "") {
            element.className = "";
        }
    }
}
//类似jquery方式读取dom--------------------------------------------------------------------------------------------------end

//滚动条插件
imageControl.prototype.scrollbot = function (e, w) {
    // e - Element
    // w - scrollbar width
    var _this = this;
    this.orgPar = document.querySelector(e);

    // init function, if not ie 8 and below this will run
    this.init = function () {
        if (w == undefined) {
            this.sbw = 5;
        } else {
            this.sbw = w;
        }
        // scrollspeed for scroll trackpad click event
        this.scrollSpeed = 200;
        // parent content
        this.parContent = this.orgPar.innerHTML;
        this.orgPar.innerHTML = "";
        this.newPar = document.createElement("div");
        this.sbContainer = document.createElement("div");
        this.scrollBarHolder = document.createElement("div");
        this.scrollBar = document.createElement("div");
        this.inP = document.createElement("div");
        this.newPar.className = "scrollbot-outer-parent";
        this.scrollBarHolder.className = "scrollbot-scrollbar-holder";
        this.scrollBar.className = "scrollbot-scrollbar";
        this.inP.className = "scrollbot-inner-parent";
        this.newPar.style.position = "relative";
        this.newPar.style.paddingRight = this.sbw + "px";
        this.newPar.style.zIndex = "100";
        this.newPar.style.height = "100%";
        //this.newPar.style.overflow = "hidden";
        this.inPWidth = (this.orgPar.clientWidth - this.sbw) + "px";
        this.inP.style.cssText = "height:100%;overflow-y:auto;overflow-x:hidden;padding-right:" + (this.sbw + 20) + "px;width:100%;box-sizing:content-box;";
        this.inP.innerHTML = this.parContent;
        this.inP.style.height = "100%";
        this.newPar.appendChild(this.inP);
        this.scrollBarHolder.appendChild(this.scrollBar);
        this.newPar.appendChild(this.scrollBarHolder);
        this.orgPar.appendChild(this.newPar);
        this.sbHeight = this.inP.clientHeight * 100 / this.inP.scrollHeight;
        this.mdown = false;
        this.customHeight = false;
        this.scrollElement = this.inP;
        this.onScroll = function (f) {
            _this.onScrollF = f
        };
        this.sB = {
            width: _this.sbw + "px",
            height: _this.sbHeight + "%",
            position: "absolute",
            right: "-1px",
            top: 0,
            backgroundColor: "#444444",
            borderRadius: "15px"
        };

        this.sBH = {
            width: _this.sbw + "px",
            height: "100%",
            position: "absolute",
            right: "-1px",
            top: 0,
            backgroundColor: "#ADADAD",
            borderRadius: "15px"
        };

        for (var p in this.sB) {
            this.scrollBar.style[p] = this.sB[p]
        };
        for (var p in this.sBH) {
            this.scrollBarHolder.style[p] = this.sBH[p];
        }

        this.inP.addEventListener("scroll", function () {
            _this.scrollBar.style.top = _this.inP.scrollTop * 100 / _this.inP.scrollHeight + (_this.sbHeight - parseFloat(_this.sB.height)) * _this.inP.scrollTop / (_this.inP.scrollHeight - _this.inP.clientHeight) + "%";
            if ("onScrollF" in _this) {
                _this.onScrollF();
            }
        })

        this.setScroll = function (p, d) {
            if (d == undefined || d <= 0) d = 500;
            if (p >= _this.inP.scrollHeight - _this.inP.clientHeight) { p = _this.inP.scrollHeight - _this.inP.clientHeight; };

            var difference = p - _this.inP.scrollTop;
            var perTick = difference / d * 10;

            setTimeout(function () {
                _this.inP.scrollTop += perTick;
                if (Math.abs(p - _this.inP.scrollTop) < 5) return;
                _this.setScroll(p, d - 10);
            }, 10);
        }

        this.scrollBarHolder.onmousedown = function (e) {
            if (e.target != this) return;
            var relPos = (e.pageY - _this.scrollBarHolder.getBoundingClientRect().top) * 100 / _this.scrollBarHolder.clientHeight;
            _this.setScroll(_this.inP.scrollHeight * relPos / 100, _this.scrollSpeed);
        }

        this.scrollBar.onmousedown = function (e) {
            _this.mdown = true;
            _this.posCorrection = e.pageY - _this.scrollBar.getBoundingClientRect().top;
            _this.btmCorrection = _this.scrollBar.clientHeight * 100 / _this.newPar.clientHeight;
            return false;
        }

        this.scrollBar.onmouseout = function () {
            _this.mdown = false;
        }

        this.orgPar.onmouseup = function () {
            _this.mdown = false;
        }
        this.orgPar.onmousemove = function (e) {
            if (_this.mdown) {
                if (document.selection) {
                    document.selection.empty();
                } else {
                    window.getSelection().removeAllRanges();
                }
                _this.relY = e.pageY - _this.newPar.getBoundingClientRect().top;
                _this.pC = (_this.relY - _this.posCorrection) * 100 / _this.newPar.clientHeight;
                if (_this.pC >= 0 && (_this.pC + _this.btmCorrection) <= 100) {
                    _this.scrollBar.style.top = _this.pC + "%";
                    _this.inP.scrollTop = (parseFloat(_this.scrollBar.style.top) - (_this.sbHeight - parseFloat(_this.sB.height)) * _this.inP.scrollTop / (_this.inP.scrollHeight - _this.inP.clientHeight)) * _this.inP.scrollHeight / 100;
                } else {
                    if (_this.pC < 0 && parseFloat(_this.scrollBar.style.top) > 0) {
                        _this.scrollBar.style.top = "0%";
                        _this.inP.scrollTop = 0;
                    }
                }
                if ("onScrollF" in _this) {
                    _this.onScrollF();
                }
            } else {
                return false;
            }
        }

        this.refresh = function () {
            _this.sbHeight = _this.inP.clientHeight * 100 / _this.inP.scrollHeight;
            if (_this.sbHeight >= 100) {
                _this.scrollBarHolder.style.display = "none";
            } else {
                _this.scrollBarHolder.style.display = "block"
            }
            _this.sbHeight = this.inP.clientHeight * 100 / this.inP.scrollHeight;
            _this.sB["height"] = _this.customHeight ? _this.sB["height"] : _this.sbHeight + "%";
            if (_this.inP.scrollHeight > _this.inP.clientHeight) {
                _this.scrollBar.style.height = _this.sB.height;
            }
        }
        this.refresh();
        this.setStyle = function (sb, sbh) {
            if (sb != undefined) {
                sb["width"] = _this.sbw;
                if ("height" in sb) {
                    _this.customHeight = true;
                    sb["height"] = (parseFloat(sb["height"]) * 100 / _this.newPar.clientHeight) + "%";
                }
                for (var x in sb) {
                    _this.sB[x] = sb[x];
                    _this.scrollBar.style[x] = sb[x];
                }
            }
            if (sbh != undefined) {
                sbh["width"] = _this.sbw;
                for (var x in sbh) {
                    _this.sBH[x] = sbh[x];
                    _this.scrollBarHolder.style[x] = sbh[x];
                }
            }
            return _this;
        }
    }

    this.destroy = function () {
        _this.orgPar.innerHTML = _this.parContent;
        _this.orgPar.style.overflow = "auto";
        _this.init = null;
    }

    function isIE() {
        var myNav = navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
    }

    if (!isIE() || (isIE() && isIE() < 9)) {
        _this.init();
    }

    return _this;
};


export {
    imageControl
}

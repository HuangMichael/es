/**
 * Created by yezhanpeng<yezp@3clear.com>
 * First Creator: LIU liang, KangMing
 * date: 2017/11/21
 * desc: 基于WebGL绘制箭头风(A)和F风
 */
import { $3Clear_WebGL_Image } from './3Clear_WebGL';  ////利用webgl读取图片的方式读取图片
/*CSS坐标转换*/
L.DomUtil.setTransform = L.DomUtil.setTransform || function (el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] =
        (L.Browser.ie3d ?
            'translate(' + pos.x + 'px,' + pos.y + 'px)' :
            'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
        (scale ? ' scale(' + scale + ')' : '');
};

L.$3ClearArrowFWindLayer = (L.Layer ? L.Layer : L.Class).extend({
    /**
     * 初始化风
     * @param _map 绘制的地图对象;
     * @param imageExtent 风原图的地理范围;
  	 * @param windType 绘制的风的种类('A':箭头风,'F': F风);
     * @param windcolor 风的颜色
     */	
    initialize: function (options) {
    	this._map = null;
    	this._canvas = null;
    	this.image = null;
        /*参数设置*/
    	this.imageExtent = options['imageExtent'] || [];
    	this.windType = options['windType'] || 'F';
    	this.windColor = options['windColor'] ||'rgba(255,0,0,255)';
        this.winMin = options['winMin'] || -17;
        this.winMax = options['winMax'] || 17;
    	this.imageOrder = 0;
        L.setOptions(this, options);
    },
     /*获取地图重新调整大小*/
    _onLayerDidResize: function (resizeEvent) {
        this._canvas.width = resizeEvent.newSize.x;
        this._canvas.height = resizeEvent.newSize.y;
        this.drawLayer();
    },
    /*获取地图移动*/
    _onLayerDidMove: function (Event) {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        this.drawLayer();     
    },
    /*获取监听事件*/
    getEvents: function () {
        var events = {
            resize: this._onLayerDidResize,
            moveend: this._onLayerDidMove,
            zoom: this._onLayerDidMove
        };
        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            events.zoomanim = this._animateZoom;
        }
        return events;
    },

    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');

        var size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
        map._panes.overlayPane.appendChild(this._canvas);

        map.on(this.getEvents(), this);
        this.onLayerDidMount && this.onLayerDidMount();
    },    
    
    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    drawLayer: function () {  
	    ////只有有图片的时候绘制
        if(this.image !== null){
            this.drawWindImage();
        }  
        ////move多次调用卡顿的问题
        // if(this.setWindInterval){
        //     window.clearInterval(this.setWindInterval);  
        // }
        // var context = this._canvas.getContext('2d');
        // var size = this._map.getSize();
        // context.clearRect(0, 0, size.x, size.y); ////先清空
        // this.setWindInterval = window.setInterval(()=>{
        //     if(this.image !== null){
        //         this.drawWindImage();
        //         this.setWindInterval = null;
        //     }
        // }, 10); 
    },
    /*
    *根据图片的路径绘制风
    * imgurl 图片的路径
    * wind_FA_IsFirst 一张图两个小时，此刻是否是第一个
    */
    setImage(imgurl, wind_FA_IsFirst){
    	this.imageOrder = 0;
    	if(wind_FA_IsFirst === false){
    		this.imageOrder = 2; ////取第二个时刻
    	}
	    this.image = document.createElement('img');
	    this.image.crossOrigin = "anonymous";
	    this.image.src = imgurl;
        this.windData = {
            width: 0,
            height: 0,
            data: []
        };
        var _this = this;
        this.loadedPromise = new Promise((resolve) => {
            _this.image.onload = function () {
                resolve(true);
                /////////////////////////--为了解决Canvas读取一张只有一个小时数据的图片时的无效值问题--//////////////////////////////////////
                if(!_this.webgl_img){
                    var windCanvas = document.createElement('canvas');
                    windCanvas.width = this.width;
                    windCanvas.height = this.height;
                    /////图片大小发生变化时使用
                    _this.tempCanvasWidth = this.width;
                    _this.tempCanvasHeight = this.height;                   
                    _this.webgl_img = new $3Clear_WebGL_Image(windCanvas, {width:this.width, height: this.height, extent:[0, 0, this.width, this.height]});
                }
                if(_this.tempCanvasWidth !== this.width || _this.tempCanvasHeight !== this.height){
                    _this.webgl_img.gl.canvas.width = this.width;
                    _this.webgl_img.gl.canvas.height = this.height;
                    _this.webgl_img.gl.viewport(0, 0, this.width, this.height);
                    _this.webgl_img.clear();
                }
                _this.webgl_img.initImg(this);
                _this.webgl_img.drawImgTexture(_this.webgl_img.imageParam.extent);
                _this.windData.data = new Uint8Array(_this.webgl_img.gl.drawingBufferWidth * _this.webgl_img.gl.drawingBufferHeight * 4);
                /////注意readPixels读取数据时是从左下角开始读取的
                _this.webgl_img.gl.readPixels(0, 0, _this.webgl_img.gl.drawingBufferWidth, _this.webgl_img.gl.drawingBufferHeight, _this.webgl_img.gl.RGBA, _this.webgl_img.gl.UNSIGNED_BYTE, _this.windData.data);
                _this.windData.width = this.width;
                _this.windData.height = this.height;
                ///////////////////////////////////////////////////////////////
                _this.drawLayer();
            };
            _this.image.onerror = function () {
                resolve(true);
                _this.windClear(); ////加载错误---->clear()
            };
        });
        return this.loadedPromise;
    },

    /*绘制风
     *前提：已经下载的图片和设置好的canvas
	 *核心函数
     */
	drawWindImage(){
		var imageOrder = this.imageOrder;
        var winMin = this.winMin; ////风速最小值
        var winMax = this.winMax; ////风速最大值
        var winColor = this.windColor;
        var imgExtent = this.imageExtent;
	    var windData = this.windData;

        var xStep, yStep;
        xStep = (imgExtent[2] - imgExtent[0]) / this.image.width;
        yStep = (imgExtent[3] - imgExtent[1]) / this.image.height;

	    var context = this._canvas.getContext('2d');
        var size = this._map.getSize();
        context.clearRect(0, 0, size.x, size.y); ////先清空
        var mapbounds = this._map.getBounds();
        var xmin = mapbounds._southWest.lng;
        xmin = xmin * 20037508.3427892 / 180;
        var ymin = mapbounds._southWest.lat;
        ymin = Math.log(Math.tan((90 + ymin) * Math.PI / 360)) / (Math.PI / 180);
        ymin = ymin * 20037508.3427892 / 180;
        var xmax = mapbounds._northEast.lng;
        xmax = xmax * 20037508.3427892 / 180;
        var ymax = mapbounds._northEast.lat;
        ymax = Math.log(Math.tan((90 + ymax) * Math.PI / 360)) / (Math.PI / 180);
        ymax = ymax * 20037508.3427892 / 180;

        var resolution = (xmax - xmin) / size.x;
        var maxScreen = 40;
        var screenStep = resolution * maxScreen;

        var xstartC = (xmin + Math.PI * 6378137) / screenStep;
        var xstart = Math.floor(xstartC) * screenStep - Math.PI * 6378137;

        var ystartR = (ymin + Math.PI * 6378137) / screenStep;
        var ystart = Math.floor(ystartR) * screenStep - Math.PI * 6378137;

        var f0 = 14;
        var f1 = 6;
        var f2 = 3;
        var f4 = 3;

        var y = ystart;
        while (y < ymax) {
            var x = xstart;
            while (x < xmax) {
                if (x >= imgExtent[0] && x <= imgExtent[2] && y >= imgExtent[1] && y <= imgExtent[3]) {
                    var lon = x / 20037508.3427892 * 180;
                    var lat = y / 20037508.3427892 * 180;
                    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
                    var px = this._map.latLngToContainerPoint([lat, lon]);
                    var screenPointX = px.x;
                    var screenPointY = px.y;

                    var c = (x - imgExtent[0]) / xStep;
                    var c0 = Math.floor(c);
                    var cdiff = c - c0;
                    var r = (y - imgExtent[1]) / yStep;
                    var r0 = Math.floor(r);
                    var rdiff = r - r0;                   
                    var uv00Index=(r0*windData.width+c0)*4;
                    var uv10Index=(r0*windData.width+c0 + 1)*4;
                    var uv01Index=((r0+1)*windData.width+c0)*4;
                    var uv11Index=((r0+1)*windData.width+c0+1)*4;

                    if(this.maskData){
                    	/////设置掩膜
                        var _r = windData.height - (y - imgExtent[1]) / yStep;
                        var _r0 = Math.floor(_r);                  
                        var _uv00Index=(_r0*windData.width+c0)*4;
                    	var alpha = this.maskData.data[_uv00Index + 3];
                    	if(alpha === 0){
                    		x += screenStep;
                            continue;
                    	}
                    }
                                    
                    var u00 = windData.data[uv00Index + imageOrder] / 255;
                    var v00 = windData.data[uv00Index + 1 + imageOrder] / 255;
                    if (u00 == 0 && v00 == 0) {
                        x += screenStep;
                        continue;
                    }
                    u00 = u00 * (winMax - winMin) + winMin;
                    v00 = v00 * (winMax - winMin) + winMin;

                    var u10 = windData.data[uv10Index + imageOrder] / 255;
                    var v10 = windData.data[uv10Index + 1 + imageOrder] / 255;
                    if (u10 == 0 && v10 == 0) {
                        x += screenStep;
                        continue;
                    }
                    u10 = u10 * (winMax - winMin) + winMin;
                    v10 = v10 * (winMax - winMin) + winMin;

                    var u01 = windData.data[uv01Index + imageOrder] / 255;
                    var v01 = windData.data[uv01Index + 1 + imageOrder] / 255;

                    if (u01 == 0 && v01 == 0) {
                        x += screenStep;
                        continue;
                    }
                    u01 = u01 * (winMax - winMin) + winMin;
                    v01 = v01 * (winMax - winMin) + winMin;

                    var u11 = windData.data[uv11Index  + imageOrder] / 255;
                    var v11 = windData.data[uv11Index + 1 + imageOrder] / 255;
                    if (u11 == 0 && v11 == 0) {
                        x += screenStep;
                        continue;
                    }

                    u11 = u11 * (winMax - winMin) + winMin;
                    v11 = v11 * (winMax - winMin) + winMin;

                    var u1 = u00 + (u10 - u00) * cdiff;
                    var u2 = u01 + (u11 - u01) * cdiff;
                    var u = u1 + (u2 - u1) * rdiff;

                    var v1 = v00 + (v10 - v00) * cdiff;
                    var v2 = v01 + (v11 - v01) * cdiff;
                    var v = v1 + (v2 - v1) * rdiff;


                    var speed = Math.sqrt(Math.pow(u, 2) + Math.pow(v, 2));
                    if(speed <= 0){
                    	/////如果风力小于0则不绘制风
                        x += screenStep;
                        continue;
                    }
                    var radians = Math.atan2(v00, u00);
                    if (radians < 0) { radians = 2 * Math.PI + radians;}
                    speed = Math.round(speed); ////对风速四舍五入

					if(this.windType === "F"){
                    	/////F风
	                    context.beginPath();
	                    context.moveTo(screenPointX, screenPointY);
	                    var x0 = f0 * Math.cos(radians) + screenPointX;
	                    var y0 = -f0 * Math.sin(radians) + screenPointY;
	                    context.lineTo(x0, y0);
	                    context.moveTo(screenPointX, screenPointY);
                        if (speed === 0||speed === 1) {
                            ////四舍五入后风速在[0,1]之间是一条线
                        }else if (speed === 2) {
	                        var x1 = f2 * Math.cos(radians + Math.PI / 2) + screenPointX;
	                        var y1 = -f2 * Math.sin(radians + Math.PI / 2) + screenPointY;
	                        context.lineTo(x1, y1);
	                    } else if (speed === 3||speed === 4) {
	                        var x1 = f1 * Math.cos(radians + Math.PI / 2) + screenPointX;
	                        var y1 = -f1 * Math.sin(radians + Math.PI / 2) + screenPointY;
	                        context.lineTo(x1, y1);
	                    } else if (speed === 5||speed === 6) {
	                        var x1 = f1 * Math.cos(radians + Math.PI / 2) + screenPointX;
	                        var y1 = -f1 * Math.sin(radians + Math.PI / 2) + screenPointY;
	                        context.lineTo(x1, y1);

	                        var x2 = f4 * Math.cos(radians) + screenPointX;
	                        var y2 = -f4 * Math.sin(radians) + screenPointY;
	                        context.moveTo(x2, y2);
	                        var x3 = f2 * Math.cos(radians + Math.PI / 2) + x2;
	                        var y3 = -f2 * Math.sin(radians + Math.PI / 2) + y2;
	                        context.lineTo(x3, y3);
	                    } else if (speed === 7||speed === 8) {
	                        var x1 = f1 * Math.cos(radians + Math.PI / 2) + screenPointX;
	                        var y1 = -f1 * Math.sin(radians + Math.PI / 2) + screenPointY;
	                        context.lineTo(x1, y1);

	                        var x2 = f4 * Math.cos(radians) + screenPointX;
	                        var y2 = -f4 * Math.sin(radians) + screenPointY;
	                        context.moveTo(x2, y2);
	                        var x3 = f1 * Math.cos(radians + Math.PI / 2) + x2;
	                        var y3 = -f1 * Math.sin(radians + Math.PI / 2) + y2;
	                        context.lineTo(x3, y3);
	                    } else if (speed === 9||speed === 10) {
	                        var x1 = f1 * Math.cos(radians + Math.PI / 2) + screenPointX;
	                        var y1 = -f1 * Math.sin(radians + Math.PI / 2) + screenPointY;
	                        context.lineTo(x1, y1);

	                        var x2 = f4 * Math.cos(radians) + screenPointX;
	                        var y2 = -f4 * Math.sin(radians) + screenPointY;
	                        context.moveTo(x2, y2);
	                        var x3 = f1 * Math.cos(radians + Math.PI / 2) + x2;
	                        var y3 = -f1 * Math.sin(radians + Math.PI / 2) + y2;
	                        context.lineTo(x3, y3);

	                        var x4 = f4 * 2 * Math.cos(radians) + screenPointX;
	                        var y4 = -f4 * 2 * Math.sin(radians) + screenPointY;
	                        context.moveTo(x4, y4);
	                        var x5 = f2 * Math.cos(radians + Math.PI / 2) + x4;
	                        var y5 = -f2 * Math.sin(radians + Math.PI / 2) + y4;
	                        context.lineTo(x5, y5);
	                    } else if (speed === 11||speed === 12) {
	                        var x1 = f1 * Math.cos(radians + Math.PI / 2) + screenPointX;
	                        var y1 = -f1 * Math.sin(radians + Math.PI / 2) + screenPointY;
	                        context.lineTo(x1, y1);

	                        var x2 = f4 * Math.cos(radians) + screenPointX;
	                        var y2 = -f4 * Math.sin(radians) + screenPointY;
	                        context.moveTo(x2, y2);
	                        var x3 = f1 * Math.cos(radians + Math.PI / 2) + x2;
	                        var y3 = -f1 * Math.sin(radians + Math.PI / 2) + y2;
	                        context.lineTo(x3, y3);

	                        var x4 = f4 * 2 * Math.cos(radians) + screenPointX;
	                        var y4 = -f4 * 2 * Math.sin(radians) + screenPointY;
	                        context.moveTo(x4, y4);
	                        var x5 = f1 * Math.cos(radians + Math.PI / 2) + x4;
	                        var y5 = -f1 * Math.sin(radians + Math.PI / 2) + y4;
	                        context.lineTo(x5, y5);
	                    } else if (speed === 13||speed === 14) {
	                        var x1 = f1 * Math.cos(radians + Math.PI / 2) + screenPointX;
	                        var y1 = -f1 * Math.sin(radians + Math.PI / 2) + screenPointY;
	                        context.lineTo(x1, y1);

	                        var x2 = f4 * Math.cos(radians) + screenPointX;
	                        var y2 = -f4 * Math.sin(radians) + screenPointY;
	                        context.moveTo(x2, y2);
	                        var x3 = f1 * Math.cos(radians + Math.PI / 2) + x2;
	                        var y3 = -f1 * Math.sin(radians + Math.PI / 2) + y2;
	                        context.lineTo(x3, y3);

	                        var x4 = f4 * 2 * Math.cos(radians) + screenPointX;
	                        var y4 = -f4 * 2 * Math.sin(radians) + screenPointY;
	                        context.moveTo(x4, y4);
	                        var x5 = f1 * Math.cos(radians + Math.PI / 2) + x4;
	                        var y5 = -f1 * Math.sin(radians + Math.PI / 2) + y4;
	                        context.lineTo(x5, y5);

	                        var x6 = f4 * 3 * Math.cos(radians) + screenPointX;
	                        var y6 = -f4 * 3 * Math.sin(radians) + screenPointY;
	                        context.moveTo(x6, y6);
	                        var x7 = f2 * Math.cos(radians + Math.PI / 2) + x6;
	                        var y7 = -f2 * Math.sin(radians + Math.PI / 2) + y6;
	                        context.lineTo(x7, y7);
	                    }else if (speed === 15||speed === 16) {
                            var x1 = f1 * Math.cos(radians + Math.PI / 2) + screenPointX;
                            var y1 = -f1 * Math.sin(radians + Math.PI / 2) + screenPointY;
                            context.lineTo(x1, y1);

                            var x2 = f4 * Math.cos(radians) + screenPointX;
                            var y2 = -f4 * Math.sin(radians) + screenPointY;
                            context.moveTo(x2, y2);
                            var x3 = f1 * Math.cos(radians + Math.PI / 2) + x2;
                            var y3 = -f1 * Math.sin(radians + Math.PI / 2) + y2;
                            context.lineTo(x3, y3);

                            var x4 = f4 * 2 * Math.cos(radians) + screenPointX;
                            var y4 = -f4 * 2 * Math.sin(radians) + screenPointY;
                            context.moveTo(x4, y4);
                            var x5 = f1 * Math.cos(radians + Math.PI / 2) + x4;
                            var y5 = -f1 * Math.sin(radians + Math.PI / 2) + y4;
                            context.lineTo(x5, y5);

                            var x6 = f4 * 3 * Math.cos(radians) + screenPointX;
                            var y6 = -f4 * 3 * Math.sin(radians) + screenPointY;
                            context.moveTo(x6, y6);
                            var x7 = f1 * Math.cos(radians + Math.PI / 2) + x6;
                            var y7 = -f1 * Math.sin(radians + Math.PI / 2) + y6;
                            context.lineTo(x7, y7);
                        }else if (speed === 17 ||speed === 18) {
                            var x1 = f1 * Math.cos(radians + Math.PI / 2) + screenPointX;
                            var y1 = -f1 * Math.sin(radians + Math.PI / 2) + screenPointY;
                            context.lineTo(x1, y1);

                            var x2 = f4 * Math.cos(radians) + screenPointX;
                            var y2 = -f4 * Math.sin(radians) + screenPointY;
                            context.moveTo(x2, y2);
                            var x3 = f1 * Math.cos(radians + Math.PI / 2) + x2;
                            var y3 = -f1 * Math.sin(radians + Math.PI / 2) + y2;
                            context.lineTo(x3, y3);

                            var x4 = f4 * 2 * Math.cos(radians) + screenPointX;
                            var y4 = -f4 * 2 * Math.sin(radians) + screenPointY;
                            context.moveTo(x4, y4);
                            var x5 = f1 * Math.cos(radians + Math.PI / 2) + x4;
                            var y5 = -f1 * Math.sin(radians + Math.PI / 2) + y4;
                            context.lineTo(x5, y5);

                            var x6 = f4 * 3 * Math.cos(radians) + screenPointX;
                            var y6 = -f4 * 3 * Math.sin(radians) + screenPointY;
                            context.moveTo(x6, y6);
                            var x7 = f1 * Math.cos(radians + Math.PI / 2) + x6;
                            var y7 = -f1 * Math.sin(radians + Math.PI / 2) + y6;
                            context.lineTo(x7, y7);

                            var x8 = f4 * 4 * Math.cos(radians) + screenPointX;
                            var y8 = -f4 * 4 * Math.sin(radians) + screenPointY;
                            context.moveTo(x8, y8);
                            var x9 = f2 * Math.cos(radians + Math.PI / 2) + x8;
                            var y9 = -f2 * Math.sin(radians + Math.PI / 2) + y8;
                            context.lineTo(x9, y9);
                        } else {
                            ////风速范围大于8级([19,20]m/s)以上的全部用
	                        var x1 = f1 * Math.cos(radians + Math.PI / 2) + screenPointX;
	                        var y1 = -f1 * Math.sin(radians + Math.PI / 2) + screenPointY;
	                        context.lineTo(x1, y1);

	                        var x2 = f1 * Math.cos(radians) + screenPointX;
	                        var y2 = -f1 * Math.sin(radians) + screenPointY;
	                        context.lineTo(x2, y2);
	                    }
	                    context.strokeStyle = winColor;
	                    context.stroke();	
					}else{
						/////箭头风
	                    context.beginPath();
	                    context.moveTo(screenPointX, screenPointY);
	                    var f0;
	                    if (speed === 0||speed === 1) {
	                        f0 = 12;
	                    } else if (speed === 2) {
	                        f0 = 14;
	                    } else if (speed === 3||speed === 4) {
	                        f0 = 16;
	                    } else if (speed === 5||speed === 6) {
	                        f0 = 18;
	                    } else if (speed === 7||speed === 8) {
	                        f0 = 20;
	                    } else if (speed === 9||speed === 10) {
	                        f0 = 22;
	                    } else if (speed === 11||speed === 12) {
	                        f0 = 24;
	                    } else if (speed === 13||speed === 14) {
                            f0 = 26;
                        } else if (speed === 15||speed === 16) {
                            f0 = 28;
                        } else if (speed === 17||speed === 18) {
                            f0 = 30;
                        } else{
                            ////风速范围大于8级([19,20]m/s)以上的全部用
	                        f0 = 32;
	                    }

	                    var x0 = f0 * Math.cos(radians) + screenPointX;
	                    var y0 = -f0 * Math.sin(radians) + screenPointY;
	                    context.lineTo(x0, y0);

	                    var x1 = f1 * Math.cos(radians + Math.PI * 5 / 4) + x0;
	                    var y1 = -f1 * Math.sin(radians + Math.PI * 5 / 4) + y0;
	                    context.lineTo(x1, y1);

	                    context.moveTo(x0, y0);

	                    var x2 = f1 * Math.cos(radians - Math.PI * 5 / 4) + x0;
	                    var y2 = -f1 * Math.sin(radians - Math.PI * 5 / 4) + y0;
	                    context.lineTo(x2, y2);

	                    context.strokeStyle = winColor;
	                    context.stroke();
					}
                }
                x += screenStep;
            }
            y += screenStep;
        }
        return;
    },
    /*
    *已经加载后的img dom 元素
	*在地图变化时调用
    */
    setMask(maskImg, forMaskImgWight = 312, forMaskImgHeight = 290){
    	if(!maskImg) return;
        var mask = maskImg;
    	var maskCanvas = document.createElement('canvas');
    	maskCanvas.width = forMaskImgWight;
        maskCanvas.height = forMaskImgHeight;
    	var maskContext = maskCanvas.getContext('2d');
    	maskContext.drawImage(mask, 0, 0, mask.width, mask.height, 0, 0, forMaskImgWight, forMaskImgHeight);
    	this.maskData = maskContext.getImageData(0, 0, forMaskImgWight, forMaskImgHeight);
    },

    /*
    *重新设置原始图片的表示的地理范围
    */
    setImageExtent(extant){
    	if(!extant) return;
    	this.imageExtent = extant;
        this.drawLayer();
    },

    /*
    *清空所绘制的风
    *在原图加载失败后自动调用
    *外部隐藏时调用
    */
    windClear(){
	    var context = this._canvas.getContext('2d');
        var size = this._map.getSize();
        context.clearRect(0, 0, size.x, size.y); 
        this.image = null; /////null,reSize()放大缩小不绘制
    },
    /*
    * 判断目前是否有绘制的风
    */
    isWindHas(){
    	return !(this.image === null);
    },

    // -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
    _setTransform: function (el, offset, scale) {
        var pos = offset || new L.Point(0, 0);

        el.style[L.DomUtil.TRANSFORM] =
            (L.Browser.ie3d ?
                'translate(' + pos.x + 'px,' + pos.y + 'px)' :
                'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
            (scale ? ' scale(' + scale + ')' : '');
    },

    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom);
        // -- different calc of animation zoom  in leaflet 1.0.3 thanks @peterkarabinovic, @jduggan1 
        var offset = L.Layer ? this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center).min :
            this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

        L.DomUtil.setTransform(this._canvas, offset, scale);

    }  
});

L.$3clearArrowFWindLayer = function (options) {
    return new L.$3ClearArrowFWindLayer(options);
};
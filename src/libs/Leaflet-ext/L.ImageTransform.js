L.ImageTransform = L.ImageOverlay.extend({
    initialize: function (url, anchors, options) { 
        /////(String, LatLngBounds, Object)
        /////////ImageOverlay的扩展,继承ImageOverlay的属性后再修改
        L.ImageOverlay.prototype.initialize.call(this, url, anchors, options);
        this.setAnchors(anchors);
        this.isLoadAndPlay = false; /////为解决快速更换URL和缩放同时进行的冲突
        //////初始化之后基础Class会调用所有的构造函数钩子
    },

    setAnchorsAndUrl: function(anchors,Url){
        /////为了动态的修改图片的范围anchors和图片的Url
        /////根据实际业务写的接口
        this._anchors = anchors;     ///////经纬度的四个坐标点(从左上角顺时针)          
        this._bounds = L.latLngBounds(anchors);  //////latLngBounds对象
        if (this._map) {
            this.setUrl(Url);
        }
    },

    setAnchors: function (anchors) {
        this._anchors = anchors;                 ///////经纬度的四个坐标点(从左上角顺时针)
        this._bounds = L.latLngBounds(anchors);  //////latLngBounds对象
        if (this._map) {
            this._reset();
        }
    },

    _latLngToLayerPoint: function(latlng) {
        ////////map(经纬度latlng的像素点坐标) 减去 map左上角的像素点坐标
        return this._map.project(latlng)._subtract(this._map.getPixelOrigin());
        ////////返回一个经纬度点相对于地图左上角的像素坐标
    },

    setClip: function(clipLatLngs) {
        //////此函数是内部修改裁剪的函数(不适合外部调用)
        var topLeft = this._latLngToLayerPoint(this._bounds.getNorthWest()),
            pixelClipPoints = [];
        this.options.clip = clipLatLngs;

        for (var p = 0; p < clipLatLngs.length; p++) {
             var mercPoint = this._latLngToLayerPoint(clipLatLngs[p]);
             var pixel = L.ImageTransform.Utils.project(this._matrix3dInverse, mercPoint.x - topLeft.x, mercPoint.y - topLeft.y);
             pixelClipPoints.push(L.point(pixel[0], pixel[1]));
        }
        //////转换坐标之后的裁剪范围
        this.setClipPixels(pixelClipPoints);
    },

    setClipPixels: function(pixelClipPoints) {
        this._clipDone = false;
        this._pixelClipPoints = pixelClipPoints;
        this._drawCanvas();
    },

    setUrl: function (url) {
        this._url = url;
        this._imgNode.src = this._url;
        ///////修改////更改URL--函数钩子调用_reset
        this._clipDone = false;
        this._imgLoaded = false;
    },

    getAnchors: function() {
        return this._anchors;
    },

    getClip: function() {
        return this.options.clip;
    },

    getEvents: function () {
        ////////事件处理
        var events = {
            zoomstart:this.startZoom,
            zoom: this.endZoom,
            viewreset: this.viewreset,
        };
        if (this._zoomAnimated) {
            events.zoomanim = this._animateZoom;
        }
        return events;
    },

    startZoom: function(){
        this.isLoadAndPlay = true;
        ///////开始缩放
    },

    endZoom:function(){
        this.isLoadAndPlay = false;
        //////缩放结束
        this._reset();
    },

    viewreset:function(){
        if (this.options.clip && !this._imgLoaded) { return; }
        var div = this._image,
            topLeft = this._latLngToLayerPoint(this._bounds.getNorthWest()),
            size = this._latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft);
        L.DomUtil.setPosition(div, topLeft);
        div.style.width  = size.x + 'px';
        div.style.height = size.y + 'px';
    },

    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom),
            offset = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center).min;
        L.DomUtil.setTransform(this._image, offset, scale);
    },

    _imgLoaded: false,
    _initImage: function () {
        /////这里重写了ImageOverlay的_initImage()函数,用了canvas
        //////判断是否有裁剪,这里是核心的DOM构造
        this._image = L.DomUtil.create('div', 'leaflet-image-layer');
        /////判断是否支持CSS变换
        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            L.DomUtil.addClass(this._image, 'leaflet-zoom-animated');
        } else {
            L.DomUtil.addClass(this._image, 'leaflet-zoom-hide');
        }

        //////这是实现裁剪的基础img,canvas复制this._imgNode
        this._imgNode = L.DomUtil.create('img', 'gmxImageTransform');

        if (this.options.clip) {
            this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-transform');
            this._image.appendChild(this._canvas);
            this._canvas.style[L.DomUtil.TRANSFORM_ORIGIN] = '0 0';
            this._clipDone = false;
        } else {
            this._image.appendChild(this._imgNode);
            this._imgNode.style[L.DomUtil.TRANSFORM_ORIGIN] = '0 0';
            ////Hide imgNode until image has loaded
            this._imgNode.style.display = 'none';
        }

		var node = this._canvas || this._imgNode;
        //////侦听器函数内部停止将给定的事件从子元素传播到父元素
        ///////防止DOM事件的默认动作发生
        //////显示位置
		L.DomEvent
			.on(node, 'contextmenu', L.DomEvent.stopPropagation)
			.on(node, 'contextmenu', L.DomEvent.preventDefault)
			.on(node, 'contextmenu', function (ev) {
				var _showLocation = {
					originalEvent: ev,
					latlng: this._map.mouseEventToLatLng(ev),
					layerPoint: this._map.mouseEventToLayerPoint(ev),
					containerPoint: this._map.mouseEventToContainerPoint(ev)
				};

				this.fire('contextmenu', _showLocation);
		}, this);

        this._updateOpacity();
        //TODO createImage util method to remove duplication
        this._imgLoaded = false;

        //////leaflet L 扩展_imgNode
        L.extend(this._imgNode, {
            galleryimg: 'no',
            onselectstart: L.Util.falseFn,
            onmousemove: L.Util.falseFn,
            onload: L.bind(this._onImageLoad, this),
            onerror: L.bind(this._onImageError, this),
            src: this._url
        });
    },

    _onImageError: function () {
        //////////修改////////////
        ////如果图片加载失败则清空画布或者隐藏图片
        if (this.options.clip) {
            var canvas = this._canvas,
            ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            this._imgNode.style.display = 'none';
        }
        this.fire('error');
    },

    _onImageLoad: function () {
        //////图片下载后判断是否用_canvas裁剪
        //////debugger
        if (this.options.clip) {
            this._canvas.width = this._imgNode.width;
            this._canvas.height = this._imgNode.height;
        } else {
            ///// Show imgNode once image has loaded
            this._imgNode.style.display = 'inherit';
        }
        this._imgLoaded = true;
        //////若果在缩放期间则不重新渲染,由zoomend去处理
        if(!this.isLoadAndPlay){
            this._reset();
        }
        this.fire('load');
    },

    _reset: function () {
        //////////重新设置参数
        //////debugger
        if (this.options.clip && !this._imgLoaded) { return; }
        var div = this._image,
            imgNode = this.options.clip ? this._canvas : this._imgNode,
            topLeft = this._latLngToLayerPoint(this._bounds.getNorthWest()),
            size = this._latLngToLayerPoint(this._bounds.getSouthEast())._subtract(topLeft),
            anchors = this._anchors,
            w = imgNode.width,
            h = imgNode.height,
            pixels = [],
            i, len, p;

        // ///////承载图像的DIV的位置的重新赋值
        L.DomUtil.setPosition(div, topLeft);
        div.style.width  = size.x + 'px';
        div.style.height = size.y + 'px';
        
        ////////以左上角为原点的范围(bounds)的像素点
        for (i = 0, len = anchors.length; i < len; i++) {
            p = this._latLngToLayerPoint(anchors[i]);
            pixels.push(L.point(p.x - topLeft.x, p.y - topLeft.y));
        }
        var matrix3d = this._matrix3d = L.ImageTransform.Utils.general2DProjection(
            0, 0, pixels[0].x, pixels[0].y,
            w, 0, pixels[1].x, pixels[1].y,
            w, h, pixels[2].x, pixels[2].y,
            0, h, pixels[3].x, pixels[3].y
        );
        ////something went wrong (for example, target image size is less then one pixel).
        ////处理小于1个像素的图片的异常
        if (!matrix3d[8]) {
            return;
        }
        /////matrix normalization
        //////矩阵归一化
        for (i = 0; i !== 9; ++i) {
            matrix3d[i] = matrix3d[i] / matrix3d[8];
        }
        this._matrix3dInverse = L.ImageTransform.Utils.adj(matrix3d);
        ////this._image.style.display = '';
        ////////this._canvas或this._imgNode的CSS坐标变换
        imgNode.style[L.DomUtil.TRANSFORM] = this._getMatrix3dCSS(this._matrix3d);
        ////修改/////这样可以解决鼠标卡顿的问题,每次加载的图片裁剪只执行一次
        if (this._clipDone) { return; } 

        if (this.options.clip) {
            this.setClip(this.options.clip);
        }
    },

    _getMatrix3dCSS: function(arr)	{	
    	// get CSS atribute matrix3d
        /*
        [
            C11, C12, 0, C13,
            C21, C22, 0, C3,
             0,   0,  1,  0,
            C31, C32, 0,  c33
        ]
        */
        var css = 'matrix3d(';
        css += arr[0].toFixed(9) + ',' + arr[3].toFixed(9) + ', 0,' + arr[6].toFixed(9);
        css += ',' + arr[1].toFixed(9) + ',' + arr[4].toFixed(9) + ', 0,' + arr[7].toFixed(9);
        css += ',0, 0, 1, 0';
        css += ',' + arr[2].toFixed(9) + ',' + arr[5].toFixed(9) + ', 0, ' + arr[8].toFixed(9) + ')';
        return css;
    },

    _clipDone: false,
    _drawCanvas: function () {
        ///////裁剪画布
        if (!this._clipDone && this._imgNode) {
            var canvas = this._canvas,
                ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = ctx.createPattern(this._imgNode, 'no-repeat');

            ctx.beginPath();
            for (var i = 0, len = this._pixelClipPoints.length; i < len; i++) {
                var pix = this._pixelClipPoints[i];
                ctx[i ? 'lineTo' : 'moveTo'](pix.x, pix.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = null;
            if (this.options.disableSetClip) {
                this._imgNode = null;
            }
            this._clipDone = true;
        }
    }
});

/////扩展L.ImageOverlay.
L.imageTransform = function (url, bounds, options) {
	return new L.ImageTransform(url, bounds, options);
};

L.ImageTransform.addInitHook(function () {
    /////构造函数的挂钩，判断是否有已经包含L.Mixin事件
    ////当一个视图注册了上下文菜单时，执行一个在该对象上长按（2秒）的动作，将出现一个具有相关功能的浮动菜单
    if (L.Mixin.ContextMenu) {
		L.ImageTransform.include(L.Mixin.ContextMenu);
	}
});
////通过样式名称数组并返回元素的有效样式名的第一个名称。如果找不到这样的名称，则返回false。对于浏览器前缀风格变换
L.DomUtil.TRANSFORM_ORIGIN = L.DomUtil.testProp(
        ['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']);
//////Based on http://math.stackexchange.com/questions/296794/finding-the-transform-matrix-from-4-projected-points-with-javascript
/////代码原型/http://jsfiddle.net/dFrHS/1/
//////最先执行的数学计算方法

(function() {
    /////计算m矩阵的伴随(不是转置)矩阵
    /////如果二维矩阵可逆，那么它的逆矩阵和它的伴随矩阵之间只差一个系数
    /////A(-1)=|A|(-1)*A
    ///// Compute the adjugate of m
    function adj(m) {
        return [
            m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
            m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
            m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]
        ];
    }
    ////////// 两个矩阵相乘
    ////////// multiply two matrices
    function multmm(a, b) { 
        var c = Array(9);
        for (var i = 0; i !== 3; ++i) {
            for (var j = 0; j !== 3; ++j) {
                var cij = 0;
                for (var k = 0; k !== 3; ++k) {
                    cij += a[3 * i + k] * b[3 * k + j];
                }
                c[3 * i + j] = cij;
            }
        }
        return c;
    }

    ///// multiply matrix and vector
    ///// 矩阵和向量相乘
    function multmv(m, v) { 
        return [
            m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
            m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
            m[6] * v[0] + m[7] * v[1] + m[8] * v[2]
        ];
    }

    ////////
    function basisToPoints(x1, y1, x2, y2, x3, y3, x4, y4) {
        var m = [
            x1, x2, x3,
            y1, y2, y3,
            1,  1,  1
        ];
        var v = multmv(adj(m), [x4, y4, 1]);
        return multmm(m, [
            v[0], 0, 0,
            0, v[1], 0,
            0, 0, v[2]
        ]);
    }

    L.ImageTransform.Utils = {
        ///////一般的二维投影
        ////////s(根据长度的绝对坐标),d(根据范围左上角的相对坐标)
        general2DProjection: function(
              x1s, y1s, x1d, y1d,
              x2s, y2s, x2d, y2d,
              x3s, y3s, x3d, y3d,
              x4s, y4s, x4d, y4d
        ) {
          var s = basisToPoints(x1s, y1s, x2s, y2s, x3s, y3s, x4s, y4s);
          var d = basisToPoints(x1d, y1d, x2d, y2d, x3d, y3d, x4d, y4d);
          return multmm(d, adj(s));
        },

        project: function(m, x, y) {
            var v = multmv(m, [x, y, 1]);
            return [v[0] / v[2], v[1] / v[2]];
        },
        adj: adj
    };
})();

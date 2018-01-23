
/*
  Generic  Canvas Layer for leaflet 0.7 and 1.0-rc,
  copyright Stanislav Sumbera,  2016 , sumbera.com , license MIT
  originally created and motivated by L.CanvasOverlay  available here: https://gist.github.com/Sumbera/11114288

*/

// -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
//------------------------------------------------------------------------------
L.DomUtil.setTransform = L.DomUtil.setTransform || function (el, offset, scale) {
    var pos = offset || new L.Point(0, 0);


    el.style[L.DomUtil.TRANSFORM] =
        (L.Browser.ie3d ?
            'translate(' + pos.x + 'px,' + pos.y + 'px)' :
            'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
        (scale ? ' scale(' + scale + ')' : '');
};

// -- support for both  0.0.7 and 1.0.0 rc2 leaflet
L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({
    // -- initialized is called on prototype
    initialize: function (options) {
        this._map    = null;
        this._canvas = null;
        this._frame  = null;
        this._delegate = null;
        this.offset = {x:0,y:0};
        this.startPoint = null;
        L.setOptions(this, options);
        this._pixelOrigin = null;
        this.count = 0;
        this.canvas = this._canvas;
    },

    delegate :function(del){
        this._delegate = del;
        return this;
    },

    needRedraw: function () {
        if (!this._frame) {
            this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
        }
        return this;
    },

    //-------------------------------------------------------------
    _onLayerDidResize: function (resizeEvent) {
        this._canvas.width = resizeEvent.newSize.x;
        this._canvas.height = resizeEvent.newSize.y;
    },
    //-------------------------------------------------------------
    _onLayerDidMove: function (e) {
        //this.onRemove(this._map);
        //this.onAdd(this._map);
        //this.remove();
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
       // L.DomUtil.setPosition(this._map._panes._mapPane,new L.Point(0, 0));
        L.DomUtil.setPosition(this._canvas, topLeft);

        //清除原来绘制内容
       var ctx =this._canvas.getContext('2d');
        ctx.clearRect(0,0,this._canvas.width,this._canvas.height);

        //设置原始位置像素位置
        var Point1= {x:0,y:0};
        var latlng = this._map.containerPointToLatLng(Point1);

        //将经纬度转换为地图坐标
        this._pixelOrigin= this._map.project(latlng);


        //L.DomUtil.setPosition( map._panes, new L.Point(0, 0));
        this._topLeft = topLeft;
        /*this.onRemove(this._map);

        this.onAdd(this._map);*/
        var del = this._delegate || this;

        // 重新赋值数据
        this.size   = this._map.getSize();
        this.bounds = this._map.getBounds();
        this.zoom   = this._map.getZoom();

        this.center = this._map.getCenter();
        //this._map._resetView(this.center,this._map.getZoom());
        //this._map.
        this.corner = this._map.containerPointToLatLng(this._map.getSize());

        del.MoveEnd && del.MoveEnd();
        this.drawLayer();
    },
    //增加移动过程事件
    _onLayerDidZoomStart:function(e){
        //console.log(e);
        //清除原来绘制内容
        var ctx =this._canvas.getContext('2d');
        ctx.clearRect(0,0,this._canvas.width,this._canvas.height);
        this.isMove = true;
    },
    //___________________________________________
    _onLayerDidClick:function(e){
        //var xPos =  e.clientX-this._canvas.offsetLeft;
        //var yPos =  e.clientY-this._canvas.offsetTop;
     /*   var context = this._canvas.getContext("2d");
        context.fillColor = 'rgb(0,0,0)';
        context.strokeStyle = '#000000';
        context.globalCompositeOperation="destination-over";
        context.fillText("test", e.layerPoint.x, e.layerPoint.y);*/
    },
    //_鼠标按下事件______________________________________________________
    _onLayerDidMoveStart:function(e) {
        this.startPoint ={};
        this.startPoint.x = e.containerPoint.x;
        this.startPoint.y = e.containerPoint.y;

        var del = this._delegate || this;
        del.MouseMoving && del.MouseMoving();
    },
    /**
     * 鼠标抬起事件
     */
    _onLayerDivMoveEnd:function(e) {
        this.startPoint = null;
        this.offset.x = 0 ;   //设置偏移位置x偏移0
        this.offset.y = 0 ;   //设置偏移位置y偏移0
    },
    //-------------------------------------------------------------
    getEvents: function () {
        var events = {
            resize: this._onLayerDidResize,
            moveend: this._onLayerDidMove,
            zoomstart: this._onLayerDidZoomStart,
            click: this._onLayerDidClick,
            zoom:this._onLayerDidZoomStart,
            zoomend:this._onLayerDidZoomStart
            //mousedown:this._onLayerDidMoveStart,
            //mouseup:this._onLayerDivMoveEnd
        };
        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            events.zoomanim =  this._animateZoom;
        }

        return events;
    },
    //-------------------------------------------------------------
    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');
        this.tiles = {};

        var size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        //L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
        L.DomUtil.addClass(this._canvas, 'leaflet-canvas-layer');


        map._panes.overlayPane.appendChild(this._canvas);

        map.on(this.getEvents(),this);

        var topLeft = this._map.containerPointToLayerPoint([0, 0]);

        L.DomUtil.setPosition(this._canvas, topLeft);                     //设置图层的位置
        var Point1= {x:0,y:0};

        //设置原始位置像素位置
        var latlng = this._map.containerPointToLatLng(Point1);

        //将经纬度转换为地图坐标
        this._pixelOrigin= this._map.project(latlng);

        var del = this._delegate || this;
        del.onLayerDidMount && del.onLayerDidMount(); // -- callback

        this.size   = this._map.getSize();
        this.bounds = this._map.getBounds();
        this.zoom   = this._map.getZoom();

        this.center = this._map.getCenter();
        console.log(this.center);
        this.corner = this._map.containerPointToLatLng(this._map.getSize());
        this._topLeft = {x:0,y:0};
        this.isMove = false;
        //this.needRedraw();
    },

    //-------------------------------------------------------------
    onRemove: function (map) {
        var del = this._delegate || this;
        del.onLayerWillUnmount && del.onLayerWillUnmount(); // -- callback

        this._map._panes.overlayPane.removeChild(this._canvas);

        this._map.off(this.getEvents(),this);

        this._canvas = null;
    },

    //------------------------------------------------------------
    addTo: function (map) {
        map.addLayer(this);
        return this;
    },
    // --------------------------------------------------------------------------------
    LatLonToMercator: function (latlon) {
        return {
            x: latlon.lng * 6378137 * Math.PI / 180,
            y: Math.log(Math.tan((90 + latlon.lat) * Math.PI / 360)) * 6378137
        };
    },
    //_________________________________________________________________________________
    MercatorToLatLon: function (Point) {
        var templat = Point.y / (6378137 * Math.PI) * 180;
        return {
            lng:Point.x / (6378137 * Math.PI) * 180,
            lat:180 / Math.PI * (2 * Math.atan(Math.exp(templat * Math.PI / 180)) - Math.PI / 2)
        };
    },
    //------------------------------------------------------------------------------
    drawLayer: function () {
        // -- todo make the viewInfo properties  flat objects.
        if(this._map == null)
            return;

        var size   = this._map.getSize();
        var bounds = this._map.getBounds();
        var zoom   = this._map.getZoom();

        var center = this.LatLonToMercator(this._map.getCenter());
        var corner = this.LatLonToMercator(this._map.containerPointToLatLng(this._map.getSize()));

        var del = this._delegate || this;
        del.onDrawLayer && del.onDrawLayer( {
                                                layer : this,
                                                canvas: this._canvas,
                                                bounds: bounds,
                                                size: size,
                                                zoom: zoom,
                                                center : center,
                                                corner : corner,
                                                top_left:this._topLeft,
                                                moveing :this.isMove
                                            });

        if(this.isMove)
        {
            this.isMove = false;
        }
        this._frame = null;
    },
    // -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
    //------------------------------------------------------------------------------
    _setTransform: function (el, offset, scale) {
        var pos = offset || new L.Point(0, 0);

        el.style[L.DomUtil.TRANSFORM] =
			(L.Browser.ie3d ?
				'translate(' + pos.x + 'px,' + pos.y + 'px)' :
				'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
			(scale ? ' scale(' + scale + ')' : '');
    },

    //------------------------------------------------------------------------------
    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom);
        // -- different calc of offset in leaflet 1.0.0 and 0.0.7 thanks for 1.0.0-rc2 calc @jduggan1
        var offset = L.Layer ? this._map._latLngToNewLayerPoint(this._map.getBounds().getNorthWest(), e.zoom, e.center) :
                               this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());

        L.DomUtil.setTransform(this._canvas, offset, scale);


    },
    setopacity:function(alpha){
        this._canvas.style.opacity=alpha;
    },
    /**
     * 返回四个角的经纬度及图层内的坐标值
     */
    getBaseInfo:function(){
        return {
            bounds: this.bounds,
            size: this.size,
            zoom: this.zoom,
            center : this.center,
            corner : this.corner,
            topLeft: this._topLeft
        }
    },
    /**
     * 返回图层偏移位置
     */
    getOffset:function()
    {
          return this.offset;
    },
    /**
     * 将canvas坐标转换为经纬度
     * @param point
     */
    canvasPointToLatLng:function(point)
    {
        var projectedPoint = L.point(point).add(this._pixelOrigin);
        return this._map.unproject(projectedPoint);
    },
    /**
     * 将经纬度转换为canvas坐标
     * @param point
     * @constructor
     */
    LatLngTocanvasPoint:function(latlng)
    {
        var projectedPoint = this._map.project(L.latLng(latlng))._round();
        return projectedPoint._subtract(this._pixelOrigin);
    }

});

L.canvasLayer = function () {
    return new L.CanvasLayer();
};

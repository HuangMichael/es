/**
 * Created by <kangming@3clear.com>
 * date: 2017/11/16
 * desc:等压线标注
 */


L.Icon.StaMarker = L.Icon.extend({
    options: {
        iconSize: [0, 0],
        iconAnchor:  [0, 0],
        popupAnchor: [0, 0],
        shadowSize:  [0, 0],

        name: 'StaMarker',
        rectHeight:18,
        rectWidth:34,
        radius:4,
        lineWidth:2,
        lineColor:'#ffffff',
        textAlign:'center',

        color:'#B5B5B5',
        font:'normal 12px 微软雅黑',
        fillColor:'#e6ebf5',
        labelColor:'#000',
        labelSize:'normal 12px 微软雅黑',
        labelFillColor:'#30ffba',
        value:'',
        label:''
    }
});

L.icon.StaMarker = function (options) {
    return new L.Icon.StaMarker(options);
};


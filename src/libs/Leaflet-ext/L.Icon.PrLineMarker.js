/**
 * Created by <kangming@3clear.com>
 * date: 2017/11/16
 * desc:等压线标注
 */


L.Icon.PrLineMarker = L.Icon.extend({
    options: {
        iconSize: [0, 0],
        iconAnchor:  [0, 0],
        popupAnchor: [0, 0],
        shadowSize:  [0, 0],

        name: 'PrLineMark',
        rectHeight:18,
        rectWidth:32,
        radius:3,
        lineWidth:1,
        lineColor:'#6fde02',
        textAlign:'center',

        color:'#fff',
        font:'normal 13px Arial',
        fillColor:'#0274dd',
        value:''
    }
});

L.icon.PrLineMarker = function (options) {
    return new L.Icon.PrLineMarker(options);
};
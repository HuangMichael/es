/**
 * Created by <kangming@3clear.com>
 * date: 2017/11/16
 * desc:等压线标注
 */


L.Icon.ExtremeMarker = L.Icon.extend({
    options: {
        iconSize: [0, 0],
        iconAnchor:  [0, 0],
        popupAnchor: [0, 0],
        shadowSize:  [0, 0],

        name: 'ExtremeMarker',
        typeFontColor:'red',
        valueFontColor:'red',
        typeFont:'bold 18px Arial',
        valueFont:'normal 14px Arial',
        type:'',
        value:''
    }
});

L.icon.ExtremeMarker = function (options) {
    return new L.Icon.ExtremeMarker(options);
};


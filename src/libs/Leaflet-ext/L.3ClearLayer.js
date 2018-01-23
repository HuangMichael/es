/**
 * Created by kangming
 * date: 2017/10/22
 * desc: 加载IIS发布的地图
 */

L.TileLayer._3Clear = L.TileLayer.extend({

    getTileUrl: function (tilePoint) {

        let oo = "00000000";
        let xx = tilePoint.x.toString(16);
        xx = "C" + oo.substring(0, 8 - xx.length) + xx;
        // let yy = (tilePoint.y - Math.pow(2, tilePoint.z - 2)).toString(16);//这里减去偏移值

        let R = Math.abs(tilePoint.y);
        R = R.toString(16);
        R = 'R' + oo.substr(0, 8 - R.length) + R;

        let l = tilePoint.z;
        if (l < 10) {
            l = '0' + l;
        } else {
            l =l ;
        }
        return L.Util.template(this._url, L.extend({
            s: this._getSubdomain(tilePoint),
            z: "L" +l,
            x: xx,
            y: R
        }, this.options));
    }
});

L.tileLayer._3Clear =  function(url, options){
    return new L.TileLayer._3Clear(url, options);
};
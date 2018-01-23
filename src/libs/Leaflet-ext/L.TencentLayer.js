/**
 * Created by kangming
 * date: 2017/10/22
 * desc: 加载IIS发布的腾讯地图
 */

L.TileLayer.tencent = L.TileLayer.extend({

    getTileUrl: function (tilePoint) {
        let urlArgs = {
            z: tilePoint.z,
            x: tilePoint.x,
            y: tilePoint.y
        };
        return L.Util.template(this._url, L.extend(urlArgs, this.options, {s: this._getSubdomain(tilePoint)}));
    }

});

L.tileLayer.tencent = function (url, options) {
    return new L.TileLayer.tencent(url, options);
};
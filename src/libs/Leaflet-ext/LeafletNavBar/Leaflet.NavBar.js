/**
 * @authors {yezhanpeng} (yezp@3clear.com)
 * @date    2017-09-26 19:32:24
 * @desc: "Simple home navigation control"
 */
L.Control.NavBar = L.Control.extend({
    options: {
      position: 'topleft',
      //center:,
      //zoom :,
      //bbox:, //Alternative to center/zoom for home button, takes precedence if included
      homeTitle: '恢复初始视图'
    },

    onAdd: function(map) {
      if (!this.options.center) {
        this.options.center = map.getCenter();
      }
      if (!this.options.zoom) {
        this.options.zoom = map.getZoom();
      }
      var options = this.options;

      var controlName = 'leaflet-control-navbar',
      container = L.DomUtil.create('div', controlName + ' leaflet-bar');

      this._homeButton = this._createButton(options.homeTitle, controlName + '-home', container, this._goHome);

      map.setView(options.center, options.zoom);

      return container;
    },

    _goHome: function() {
      if (this.options.bbox){
        try {
          this._map.fitBounds(this.options.bbox);
        } catch(err){
          this._map.setView(this.options.center, this.options.zoom); //Use default if invalid bbox input.
        }
      }
      this._map.setView(this.options.center, this.options.zoom);
    },

    _createButton: function(title, className, container, fn) {
      // Modified from Leaflet zoom control

      var link = L.DomUtil.create('a', className, container);
      link.href = '#';
      link.title = title;

      L.DomEvent
      .on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
      .on(link, 'click', L.DomEvent.stop)
      .on(link, 'click', fn, this)
      .on(link, 'click', this._refocusOnMap, this);

      return link;
    }
});

L.control.navbar = function(options) {
  return new L.Control.NavBar(options);
};
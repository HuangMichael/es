/*
 * @(#)3Clear_WebGL.js  1.0.1
 *
 * Creator:LIU liang
 * Date:Oct.18th,2017
 *
 * Copyright (c) 2017-2018 3Clear Science and Technology Co.,Ltd.
 * You may not use, copy or modify this file, except in compliance with the License.
 *
 */

/**
 * Base class for WebGL.
 */
class $3Clear_WebGL {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = this.canvas.getContext('webgl', { antialiasing: false }) || this.canvas.getContext('experimental-webgl', { antialiasing: false });
        if (this.gl == null) {
            alert("Your browser does not support the WebGL!");
        }
        this.alpha = 1;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }
    /**
     * Init the webgl program
     * @param {String} vsh_source, the vertex shader
     * @param {String} fsh_source, the fragment shader
     * @returns {WebGL object} wrapper
     */
    initProgram(vsh_source, fsh_source) {
        let v_shader = this.createShaderFromScript(vsh_source, this.gl.VERTEX_SHADER);
        let f_shader = this.createShaderFromScript(fsh_source, this.gl.FRAGMENT_SHADER);

        let program = this.gl.createProgram();
        this.gl.attachShader(program, v_shader);
        this.gl.attachShader(program, f_shader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            alert(this.gl.getProgramInfoLog(program));
        }

        let wrapper = { program: program };
        let i = 0,
            j = 0;
        let numAttributes = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        for (; i < numAttributes; i++) {
            let attribute = this.gl.getActiveAttrib(program, i);
            wrapper[attribute.name] = this.gl.getAttribLocation(program, attribute.name);
        }
        let numUniforms = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (; j < numUniforms; j++) {
            let uniform = this.gl.getActiveUniform(program, j);
            wrapper[uniform.name] = this.gl.getUniformLocation(program, uniform.name);
        }
        return wrapper;
    }
    /**
     * Create vertex shader or fragment shader from the source string
     * @param {String} shaderSource
     * @param {int} shaderType
     * @returns {String} shader
     */
    createShaderFromScript(shaderSource, shaderType) {
        let shader = this.gl.createShader(shaderType);
        this.gl.shaderSource(shader, shaderSource);
        this.gl.compileShader(shader);
        return shader;
    }
    /**
     * Create buffer and init data
     * @param {Float32Array} data
     * @param {int} type
     * @returns {WebGL Buffer} buffer
     */
    createBuffer(data, type) {
        let buffer = this.gl.createBuffer();
        this.gl.bindBuffer(type, buffer);
        this.gl.bufferData(type, data, this.gl.STATIC_DRAW);
        return buffer;
    }
    /**
     * Bind attribute and buffer
     * @param {WebGL Buffer} buffer
     * @param {int} attribute
     * @param {int} numComponents
     */
    bindAttribute(buffer, attribute, numComponents) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.enableVertexAttribArray(attribute);
        this.gl.vertexAttribPointer(attribute, numComponents, this.gl.FLOAT, false, 0, 0);
    }
    /**
     * Create texture and init texture parameters
     * @param {int} min_filter
     * @param {int} mag_filter
     * @returns {String} texture
     */
    createAndSetupTexture(min_filter, mag_filter) {
        let texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, min_filter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, mag_filter);
        //this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        return texture;
    }
    /**
     * Active texture and bind texture
     * @param {webgl texture} texture
     * @param {int} unit
     */
    bindTexture(texture, unit) {
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    }
    /**
     * Resize the canvas and change the viewport.
     * The canvas should be add to document.
     */
    resizeCanvas() {
        let resized = false;
        if (this.gl.canvas.width != this.gl.canvas.clientWidth) {
            this.gl.canvas.width = this.gl.canvas.clientWidth;
            resized = true;
        }
        if (this.gl.canvas.height != this.gl.canvas.clientHeight) {
            this.gl.canvas.height = this.gl.canvas.clientHeight;
            resized = true;
        }
        if (resized) {
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        }
    }
    /**
     * Clear the canvas.
     */
    clearCanvas() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
}

/**
 * The class extends from $3Clear_WebGL which draw plane by WebGL.
 * The canvas of $3Clear_WebGL_Polygon instance should be independent.
 */
class $3Clear_WebGL_Polygon extends $3Clear_WebGL {
    constructor(canvas, parameters) {
        super(canvas);
        this.polygonParam = parameters || {};
        if (!this.polygonParam.width) {
            this.polygonParam.width = 360;
        }
        if (!this.polygonParam.height) {
            this.polygonParam.height = 180;
        }
        if (!this.polygonParam.extent) {
            this.polygonParam.extent = [-180, -90, 180, 90];
        }
        if (!this.polygonParam.min) {
            this.polygonParam.min = 0;
        }
        if (!this.polygonParam.max) {
            this.polygonParam.max = 1000;
        }
        // the wind data formatter is different from others.
        if (this.polygonParam.isWind == undefined) {
            this.polygonParam.isWind = false;
        }
        if (!this.polygonParam.uMin) {
            this.polygonParam.uMin = -30;
        }
        if (!this.polygonParam.uMax) {
            this.polygonParam.uMax = 30;
        }
        if (!this.polygonParam.vMin) {
            this.polygonParam.vMin = -30;
        }
        if (!this.polygonParam.vMax) {
            this.polygonParam.vMax = 30;
        }

        this.resolutionW = (this.polygonParam.extent[2] - this.polygonParam.extent[0]) / this.polygonParam.width;
        this.resolutionH = (this.polygonParam.extent[3] - this.polygonParam.extent[1]) / this.polygonParam.height;
        this.pixelRatio = 1;
        this.minValue = 0;
        this.maxValue = 1;

        this.vsh_source = 'precision mediump float;\n\
        attribute vec2 a_position;\n\
        attribute vec2 a_texCoord;\n\
        varying vec2 v_texCoord;\n\
        void main() {\n\
            gl_Position = vec4((2.0 * a_position-1.0)*vec2(1.0, -1.0), 0, 1);\n\
            v_texCoord=a_texCoord;\n\
        }';
        this.fsh_source = 'precision mediump float;\n\
        uniform sampler2D u_imgTexture1;\n\
        uniform sampler2D u_imgTexture2;\n\
        uniform sampler2D u_colorTexture;\n\
        uniform int u_isWind;\n\
        uniform vec2 u_wind_min;\n\
        uniform vec2 u_wind_max;\n\
        uniform int u_applyMask;\n\
        uniform sampler2D u_maskTexture;\n\
        uniform float u_t;\n\
        uniform int u_model;\n\
        uniform float u_alpha;\n\
        uniform float u_min;\n\
        uniform float u_max;\n\
        varying vec2 v_texCoord;\n\
        float ComputeValue(sampler2D textureData, vec2 texCoord,bool isRG) {\n\
            vec2 splitValue;\n\
            if(isRG){\n\
                splitValue = texture2D(textureData, texCoord).xy;\n\
            }else{\n\
                splitValue = texture2D(textureData, texCoord).zw;\n\
            }\n\
            float value = splitValue.y+splitValue.x/255.0;\n\
            return value;\n\
        }\n\
        vec2 ComputeWind(sampler2D textureData, vec2 texCoord,bool isRG){\n\
          vec2 uv;\n\
          if(isRG){\n\
              uv = texture2D(textureData, texCoord).xy;\n\
          }else{\n\
              uv = texture2D(textureData, texCoord).zw;\n\
          }\n\
          return uv;\n\
        }\n\
        void main() {\n\
            if(u_applyMask==1){\n\
                vec4 maskValue=texture2D(u_maskTexture, v_texCoord);\n\
                if(maskValue.a==0.0){\n\
                    discard;\n\
                }\n\
            }\n\
            float v1,v2,v;\n\
            if(u_isWind==1){\n\
              vec2 uv1,uv2;\n\
              if(u_model==0){\n\
                uv1=ComputeWind(u_imgTexture1, v_texCoord,true);\n\
                uv2=ComputeWind(u_imgTexture1, v_texCoord,false);\n\
              }else if(u_model==1){\n\
                uv1=ComputeWind(u_imgTexture1, v_texCoord,false);\n\
                uv2=ComputeWind(u_imgTexture2, v_texCoord,true);\n\
              }else if(u_model==2){\n\
                uv1=ComputeWind(u_imgTexture2, v_texCoord,true);\n\
                uv2=ComputeWind(u_imgTexture2, v_texCoord,false);\n\
              }else{\n\
                uv1=ComputeWind(u_imgTexture1, v_texCoord,false);\n\
                uv2=ComputeWind(u_imgTexture2, v_texCoord,false);\n\
              }\n\
              float maxLength=length(u_wind_max);\n\
              vec2 velocity1 = mix(u_wind_min, u_wind_max,uv1);\n\
              v1 = length(velocity1) / maxLength;\n\
              vec2 velocity2 = mix(u_wind_min, u_wind_max,uv2);\n\
              v2 = length(velocity2) / maxLength;\n\
              vec2 uv=mix(uv1,uv2,u_t);\n\
              vec2 velocity = mix(u_wind_min, u_wind_max,uv);\n\
              v = length(velocity) / maxLength;\n\
            }else{\n\
              if(u_model==0){\n\
                v1=ComputeValue(u_imgTexture1, v_texCoord,true);\n\
                v2=ComputeValue(u_imgTexture1, v_texCoord,false);\n\
              }else if(u_model==1){\n\
                v1=ComputeValue(u_imgTexture1, v_texCoord,false);\n\
                v2=ComputeValue(u_imgTexture2, v_texCoord,true);\n\
              }else if(u_model==2){\n\
                v1=ComputeValue(u_imgTexture2, v_texCoord,true);\n\
                v2=ComputeValue(u_imgTexture2, v_texCoord,false);\n\
              }else{\n\
                v1=ComputeValue(u_imgTexture1, v_texCoord,false);\n\
                v2=ComputeValue(u_imgTexture2, v_texCoord,false);\n\
              }\n\
              v=v1*(1.0-u_t)+v2*u_t;\n\
            }\n\
            if(u_t<0.5&&v1==0.0){discard;}\n\
            if(u_t>0.5&&v2==0.0){discard;}\n\
            if(v<u_min||v>u_max){discard;}\n\
            vec4 fragColor=texture2D(u_colorTexture, vec2(v, 0.0));\n\
            gl_FragColor = fragColor*fragColor.a*u_alpha;\n\
        }';

        this.program = this.initProgram(this.vsh_source, this.fsh_source);
        this.initAttributes();
    }
    /**
     * Init Attributes
     */
    initAttributes() {
        let texCoordArray = new Float32Array([0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ]);
        let buffer = this.createBuffer(texCoordArray, this.gl.ARRAY_BUFFER);
        this.bindAttribute(buffer, this.program['a_texCoord'], 2);
    }
    /**
     * Set the color texture
     * @param {array} colors,the element in color which represent the RGBA color model.
     */
    setColor(colors) {
        if (!this.texture_colortable) {
            this.texture_colortable = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_colortable);
        }
        let colortable = new Uint8Array(colors);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, colortable.length / 4, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, colortable);
    }
    /**
     * Set the mask texture
     * @param {HTMLImageElement} img.
     */
    setMask(img) {
        if (!this.texture_mask) {
            this.texture_mask = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_mask);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
    }
    /**
     * Set the image texture,one image contains 2 datas in different time.
     * @param {HTMLImageElement} img1
     * @param {HTMLImageElement} img2
     */
    initImgs(img1, img2) {
        if (!this.texture_img1) {
            this.texture_img1 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_img1);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img1);

        if (!this.texture_img2) {
            this.texture_img2 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_img2);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img2);
    }
    /**
     * Draw the image texture
     * @param {array} extent , current map extent
     * @param {float} t [0,1]
     * @param {int} model 0|1|2|3
     */
    draw(extent, t, model) {
        this.t = t;
        this.model = model;
        this.redraw(extent);
    }
    /**
     * Redraw the image texture
     * @param {array} extent , current map extent
     */
    redraw(extent) {
        if (this.texture_img1 && this.texture_img2) {
            this.gl.useProgram(this.program.program);
            let imageExtent = this.calcImgExtent(extent);

            let vertexArray = new Float32Array([imageExtent[0], imageExtent[1],
                imageExtent[2], imageExtent[1],
                imageExtent[0], imageExtent[3],
                imageExtent[0], imageExtent[3],
                imageExtent[2], imageExtent[1],
                imageExtent[2], imageExtent[3]
            ]);

            if (!this.vertexPositionBuffer) {
                this.vertexPositionBuffer = this.gl.createBuffer();
            }
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.STATIC_DRAW);
            this.bindAttribute(this.vertexPositionBuffer, this.program['a_position'], 2);

            //let buffer = this.createBuffer(vertexArray, this.gl.ARRAY_BUFFER);
            //this.bindAttribute(buffer, this.program['a_position'], 2);

            this.bindTexture(this.texture_img1, 0);
            this.gl.uniform1i(this.program['u_imgTexture1'], 0);
            this.bindTexture(this.texture_img2, 1);
            this.gl.uniform1i(this.program['u_imgTexture2'], 1);
            this.bindTexture(this.texture_colortable, 2);
            this.gl.uniform1i(this.program['u_colorTexture'], 2);
            if (this.texture_mask) {
                this.bindTexture(this.texture_mask, 3);
                this.gl.uniform1i(this.program['u_maskTexture'], 3);
                this.gl.uniform1i(this.program['u_applyMask'], 1);
            }

            this.gl.uniform1f(this.program['u_t'], this.t);
            this.gl.uniform1i(this.program['u_model'], this.model);
            this.gl.uniform1f(this.program['u_alpha'], this.alpha);
            this.gl.uniform1f(this.program['u_min'], this.minValue);
            this.gl.uniform1f(this.program['u_max'], this.maxValue);
            this.gl.uniform1i(this.program['u_isWind'], this.polygonParam.isWind);
            this.gl.uniform2f(this.program['u_wind_min'], this.polygonParam.uMin, this.polygonParam.vMin);
            this.gl.uniform2f(this.program['u_wind_max'], this.polygonParam.uMax, this.polygonParam.vMax);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    }

    /**
     * Calculate the image extent by current Map extent
     * @param {array} map extent
     * @return {array} image extent
     */
    calcImgExtent(extent) {
        // the canvas size must be set to the map size before calc.
        let size = [this.gl.canvas.width, this.gl.canvas.height];
        let viewCenter = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        let viewResolution = (extent[2] - extent[0]) / size[0];

        let scale0 = this.pixelRatio * this.resolutionW / viewResolution;
        let scale1 = this.pixelRatio * this.resolutionH / viewResolution;

        let dx2 = (this.polygonParam.extent[0] - viewCenter[0]) / this.resolutionW;
        let dy2 = (viewCenter[1] - this.polygonParam.extent[3]) / this.resolutionH;

        let dx = dx2 * scale0 + size[0] / 2;
        let dy = dy2 * scale1 + size[1] / 2;
        let dw = this.polygonParam.width * scale0;
        let dh = this.polygonParam.height * scale1;
        let x0 = dx / size[0];
        let y0 = dy / size[1];
        let x1 = (dx + dw) / size[0];
        let y1 = (dy + dh) / size[1];
        return [x0, y0, x1, y1];
    }
    /**
     * Resize.
     */
    resize() {
        this.resizeCanvas();
    }
    /**
     * Clear.
     */
    clear() {
        this.texture_img1 = null;
        this.texture_img2 = null;
        this.clearCanvas();
    }
}

/**
 * The class extends from $3Clear_WebGL which draw wind partices by WebGL.
 * The canvas of $3Clear_WebGL_Wind instance should be independent.
 */
class $3Clear_WebGL_Wind extends $3Clear_WebGL {
    constructor(canvas, parameters) {
        super(canvas);
        this.windParam = parameters || {};
        if (!this.windParam.width) {
            this.windParam.width = 360; // set the default width
        }
        if (!this.windParam.height) {
            this.windParam.height = 180; // set the default height
        }
        if (!this.windParam.extent) {
            this.windParam.extent = [-180, -90, 180, 90]; // set the default extent
        }
        if (!this.windParam.uMin) {
            this.windParam.uMin = -30;
        }
        if (!this.windParam.uMax) {
            this.windParam.uMax = 30;
        }
        if (!this.windParam.vMin) {
            this.windParam.vMin = -30;
        }
        if (!this.windParam.vMax) {
            this.windParam.vMax = 30;
        }
        this.resolutionW = (this.windParam.extent[2] - this.windParam.extent[0]) / this.windParam.width;
        this.resolutionH = (this.windParam.extent[3] - this.windParam.extent[1]) / this.windParam.height;
        this.pixelRatio = 1;

        this.drawVert = 'precision mediump float;\n\
    attribute float a_index;\n\
    uniform sampler2D u_particles;\n\
    uniform float u_particles_res;\n\
    uniform sampler2D u_wind;\n\
    uniform int u_model;\n\
    uniform int u_applyMask;\n\
    uniform sampler2D u_maskTexture;\n\
    uniform vec2 u_wind_min;\n\
    uniform vec2 u_wind_max;\n\
    varying vec2 v_uv;\n\
    varying float v_speed;\n\
    void main() {\n\
        vec4 color = texture2D(u_particles,vec2(fract(a_index/u_particles_res),floor(a_index/u_particles_res)/u_particles_res));\n\
        vec2 particle_pos = vec2(color.r / 255.0 + color.b,color.g / 255.0 + color.a);\n\
        if(u_model==0){\n\
            v_uv=texture2D(u_wind, particle_pos).rg;\n\
        }else{\n\
            v_uv=texture2D(u_wind, particle_pos).ba;\n\
        }\n\
        if(u_applyMask==1){\n\
            vec4 maskValue=texture2D(u_maskTexture, particle_pos);\n\
            if(maskValue.a==0.0){\n\
                v_uv=vec2(0.0,0.0);\n\
            }\n\
        }\n\
        vec2 velocity = mix(u_wind_min, u_wind_max,v_uv);\n\
        v_speed = length(velocity) / length(u_wind_max);\n\
        gl_PointSize = 5.0*v_speed;\n\
        gl_Position = vec4((2.0 * particle_pos-1.0)*vec2(1.0, -1.0), 0, 1);\n\
    }';
        this.drawFrag = 'precision mediump float;\n\
    uniform sampler2D u_color_ramp;\n\
    varying vec2 v_uv;\n\
    varying float v_speed;\n\
    void main() {\n\
        if(v_uv.x==0.0&&v_uv.y==0.0){\n\
            discard;\n\
        }\n\
        gl_FragColor = texture2D(u_color_ramp, vec2(v_speed,0.0));\n\
    }';

        this.quadVert = 'precision mediump float;\n\
    attribute vec2 a_pos;\n\
    varying vec2 v_tex_pos;\n\
    void main() {\n\
        v_tex_pos = a_pos;\n\
        gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);\n\
    }';
        this.screenFrag = 'precision mediump float;\n\
    uniform sampler2D u_screen;\n\
    uniform float u_opacity;\n\
    varying vec2 v_tex_pos;\n\
    void main() {\n\
        vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);\n\
        gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);\n\
    }';
        this.updateFrag = 'precision highp float;\n\
    uniform sampler2D u_particles;\n\
    uniform sampler2D u_wind;\n\
    uniform int u_model;\n\
    uniform vec2 u_wind_res;\n\
    uniform vec2 u_wind_min;\n\
    uniform vec2 u_wind_max;\n\
    uniform float u_rand_seed;\n\
    uniform float u_speed_factor;\n\
    uniform float u_drop_rate;\n\
    uniform float u_drop_rate_bump;\n\
    varying vec2 v_tex_pos;\n\
    const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\n\
    float rand(const vec2 co) {\n\
        float t = dot(rand_constants.xy, co);\n\
        return fract(sin(t) * (rand_constants.z + t));\n\
    }\n\
    vec2 lookup_wind(const vec2 uv) {\n\
        vec2 px = 1.0 / u_wind_res;\n\
        vec2 vc = (floor(uv * u_wind_res)) * px;\n\
        vec2 f = fract(uv * u_wind_res);\n\
        vec2 tl,tr,bl,br;\n\
        if(u_model==0){\n\
          tl = texture2D(u_wind, vc).rg;\n\
          tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;\n\
          bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;\n\
          br = texture2D(u_wind, vc + px).rg;\n\
        }else{\n\
          tl = texture2D(u_wind, vc).ba;\n\
          tr = texture2D(u_wind, vc + vec2(px.x, 0)).ba;\n\
          bl = texture2D(u_wind, vc + vec2(0, px.y)).ba;\n\
          br = texture2D(u_wind, vc + px).ba;\n\
        }\n\
        return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);\n\
    }\n\
    void main() {\n\
        vec4 color = texture2D(u_particles, v_tex_pos);\n\
        vec2 pos = vec2(color.r / 255.0 + color.b,color.g / 255.0 + color.a);\n\
        vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(pos));\n\
        float speed_t = length(velocity) / length(u_wind_max);\n\
        if(speed_t<0.0582950070468378){\n\
           //discard;\n\
        }\n\
        vec2 offset = vec2(velocity.x, -velocity.y) * 0.0001 * u_speed_factor;\n\
        pos = fract(1.0 + pos + offset);\n\
        vec2 seed = (pos + v_tex_pos) * u_rand_seed;\n\
        float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;\n\
        float drop = step(1.0 - drop_rate, rand(seed));\n\
        vec2 random_pos = vec2(rand(seed + 1.3),rand(seed + 2.1));\n\
        pos = mix(pos, random_pos, drop);\n\
        gl_FragColor = vec4(fract(pos * 255.0),floor(pos * 255.0) / 255.0);\n\
    }';

        this.windColors = [0, 0, 0, 150,
            0, 0, 0, 255
        ];
        this.fadeOpacity = 0.92; // how fast the particle trails fade on each frame
        this.speedFactor = 0.6; // how fast the particles move
        this.dropRate = 0.044; // how often the particles move to a random place
        this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed

        this.drawProgram = this.initProgram(this.drawVert, this.drawFrag);
        this.screenProgram = this.initProgram(this.quadVert, this.screenFrag);
        this.updateProgram = this.initProgram(this.quadVert, this.updateFrag);

        this.quadBuffer = this.createBuffer(new Float32Array([0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ]), this.gl.ARRAY_BUFFER);
        this.framebuffer = this.gl.createFramebuffer();

        this.setColor();
        this.resize();

    }
    /**
     * Set the color texture
     */
    setColor() {
        let colortable = new Uint8Array(this.windColors);
        this.colorRampTexture = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, colortable.length / 4, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, colortable);
    }
    /**
     * Set the mask texture
     * @param {HTMLImageElement} img.
     */
    setMask(img) {
        this.maskImage = img;
    }
    initParticles(numParticles) {
        // we create a square texture where each pixel will hold a particle position encoded as RGBA
        let i = 0,
            j = 0;
        let particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(numParticles));
        this._numParticles = particleRes * particleRes;

        let particleState = new Uint8Array(this._numParticles * 4);
        for (; i < particleState.length; i++) {
            particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
        }
        // textures to hold the particle state for the current and the next frame
        if (!this.particleStateTexture0) {
            this.particleStateTexture0 = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.particleStateTexture0);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, particleRes, particleRes, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, particleState);

        if (!this.particleStateTexture1) {
            this.particleStateTexture1 = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.particleStateTexture1);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, particleRes, particleRes, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, particleState);

        let particleIndices = new Float32Array(this._numParticles);
        for (; j < this._numParticles; j++) {
            particleIndices[j] = j;
        }
        if (!this.particleIndexBuffer) {
            this.particleIndexBuffer = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleIndexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, particleIndices, this.gl.STATIC_DRAW);

        //this.particleIndexBuffer = this.createBuffer(particleIndices, this.gl.ARRAY_BUFFER);
    }
    setWind(image, model, extent) {
        this.windImage = image;
        this.windModel = model;
        this.resetWindTexture(extent);
    }
    resetWindTexture(currentExent) {
        if (this.windImage) {
            this.clipImage(currentExent);
        }
    }
    /**
     * Clip the wind image and reset the texture
     * @param {array} extent.
     */
    clipImage(extent) {
        let clipCanvas = document.createElement('canvas');
        clipCanvas.width = this.gl.canvas.width;
        clipCanvas.height = this.gl.canvas.height;
        let clipContext = clipCanvas.getContext('2d');

        let maskContext, maskCanvas;
        if (this.maskImage) {
            maskCanvas = document.createElement('canvas');
            maskCanvas.width = this.gl.canvas.width;
            maskCanvas.height = this.gl.canvas.height;
            maskContext = maskCanvas.getContext('2d');
        }

        if (extent) {
            if (extent[0] > extent[2]) {
                //note, only in 3d view
                let imgXdiff = this.windParam.extent[2] - this.windParam.extent[0];
                let imgYdiff = this.windParam.extent[3] - this.windParam.extent[1];
                let ydiff0 = this.windParam.extent[3] - extent[3];
                let starty = (ydiff0 / imgYdiff) * this.windParam.height;
                let ydiff1 = this.windParam.extent[3] - extent[1];
                let endy = (ydiff1 / imgYdiff) * this.windParam.height;

                let x0Extent = [extent[0], 180];
                let x1Extent = [-180, extent[2]];

                let uCanvasWidth = (x0Extent[1] - x0Extent[0] + x1Extent[1] - x1Extent[0]) / (imageExtent[2] - imageExtent[0]) * this.windParam.width;
                let uCanvasHeight = endy - starty;
                let uCanvas = document.createElement('canvas');
                uCanvas.width = uCanvasWidth;
                uCanvas.height = uCanvasHeight;
                let uContext = uCanvas.getContext('2d');

                let xdiff0 = x0Extent[0] - this.windParam.extent[0];
                let startx0 = (xdiff0 / imgXdiff) * this.windParam.width;
                let xdiff1 = x0Extent[1] - this.windParam.extent[0];
                let endx1 = (xdiff1 / imgXdiff) * this.windParam.width;
                let uCanvasWidth1 = (x0Extent[1] - x0Extent[0]) / imgXdiff * this.windParam.width;
                uContext.drawImage(this.windImage, startx0, starty, endx1 - startx0, endy - starty,
                    0, 0, uCanvasWidth1, uCanvasHeight);

                let xdiff2 = x1Extent[0] - this.windParam.extent[0];
                let startx2 = (xdiff2 / imgXdiff) * this.windParam.width;
                let xdiff3 = x1Extent[1] - this.windParam.extent[0];
                let endx3 = (xdiff3 / imgXdiff) * this.windParam.width;
                uContext.drawImage(this.windImage, startx2, starty, endx3 - startx2, endy - starty,
                    uCanvasWidth1, 0, (uCanvasWidth - uCanvasWidth1), uCanvasHeight);

                clipContext.drawImage(uCanvas, 0, 0, uCanvasWidth, uCanvasHeight,
                    0, 0, this.gl.canvas.width, this.gl.canvas.height);
            } else {
                //must do special treatment for global data
                let imgExtent = this.calcImgExtent(extent);
                clipContext.drawImage(this.windImage, 0, 0, this.windParam.width, this.windParam.height,
                    imgExtent[0], imgExtent[1], imgExtent[2], imgExtent[3]);
                if (maskContext) {
                    maskContext.drawImage(this.maskImage, 0, 0, this.maskImage.width, this.maskImage.height,
                        imgExtent[0], imgExtent[1], imgExtent[2], imgExtent[3]);
                }
            }
            //document.body.appendChild(clipCanvas);
        } else {
            clipContext.drawImage(this.windImage, 0, 0, this.windParam.width, this.windParam.height,
                0, 0, this.gl.canvas.width, this.gl.canvas.height);
            if (maskContext) {
                maskContext.drawImage(this.maskImage, 0, 0, this.maskImage.width, this.maskImage.height,
                    0, 0, this.gl.canvas.width, this.gl.canvas.height);
            }
        }

        if (!this.windTexture) {
            this.windTexture = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.windTexture);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, clipCanvas);

        if (maskCanvas) {
            if (!this.texture_mask) {
                this.texture_mask = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
            } else {
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_mask);
            }
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, maskCanvas);
        }

    }
    /**
     * Calculate the image extent by current Map extent
     * @param {array} map extent
     * @return {array} image extent
     */
    calcImgExtent(extent) {
        // the canvas size must be set to the map size before calc.
        let size = [this.gl.canvas.width, this.gl.canvas.height];
        let viewCenter = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        let viewResolution = (extent[2] - extent[0]) / size[0];

        let scale0 = this.pixelRatio * this.resolutionW / viewResolution;
        let scale1 = this.pixelRatio * this.resolutionH / viewResolution;

        let dx2 = (this.windParam.extent[0] - viewCenter[0]) / this.resolutionW;
        let dy2 = (viewCenter[1] - this.windParam.extent[3]) / this.resolutionH;

        let dx = dx2 * scale0 + size[0] / 2;
        let dy = dy2 * scale1 + size[1] / 2;
        let dw = this.windParam.width * scale0;
        let dh = this.windParam.height * scale1;
        return [dx, dy, dw, dh];
    }
    draw() {
        if (this.windImage) {
            this.gl.disable(this.gl.DEPTH_TEST);
            this.gl.disable(this.gl.STENCIL_TEST);

            this.bindTexture(this.windTexture, 0);
            this.bindTexture(this.particleStateTexture0, 1);

            this.drawScreen();
            this.updateParticles();
        }
    }
    drawScreen() {
        // draw the screen into a temporary framebuffer to retain it as the background on the next frame
        this.bindFramebuffer(this.framebuffer, this.screenTexture);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        this.drawTexture(this.backgroundTexture, this.fadeOpacity);

        this.drawParticles();

        this.bindFramebuffer(null);

        // enable blending to support drawing on top of an existing background (e.g. a map)
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.drawTexture(this.screenTexture, 1.0);
        this.gl.disable(this.gl.BLEND);

        // save the current screen as the background for the next frame
        let temp = this.backgroundTexture;
        this.backgroundTexture = this.screenTexture;
        this.screenTexture = temp;
    }
    drawTexture(texture, opacity) {
        let program = this.screenProgram;
        this.gl.useProgram(program.program);

        this.bindAttribute(this.quadBuffer, program['a_pos'], 2);

        this.bindTexture(texture, 2);

        this.gl.uniform1i(program['u_screen'], 2);
        this.gl.uniform1f(program['u_opacity'], opacity);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
    drawParticles() {
        let program = this.drawProgram;
        this.gl.useProgram(program.program);

        this.bindAttribute(this.particleIndexBuffer, program['a_index'], 1);
        this.bindTexture(this.colorRampTexture, 2);
        if (this.texture_mask) {
            this.bindTexture(this.texture_mask, 10);
            this.gl.uniform1i(program['u_maskTexture'], 10);
            this.gl.uniform1i(program['u_applyMask'], 1);
        }

        this.gl.uniform1i(program['u_wind'], 0);
        this.gl.uniform1i(program['u_model'], this.windModel);
        this.gl.uniform1i(program['u_particles'], 1);
        this.gl.uniform1i(program['u_color_ramp'], 2);

        this.gl.uniform1f(program['u_particles_res'], this.particleStateResolution);
        this.gl.uniform2f(program['u_wind_min'], this.windParam.uMin, this.windParam.vMin);
        this.gl.uniform2f(program['u_wind_max'], this.windParam.uMax, this.windParam.vMax);

        this.gl.drawArrays(this.gl.POINTS, 0, this._numParticles);
    }
    updateParticles() {
        this.bindFramebuffer(this.framebuffer, this.particleStateTexture1);
        this.gl.viewport(0, 0, this.particleStateResolution, this.particleStateResolution);

        let program = this.updateProgram;
        this.gl.useProgram(program.program);

        this.bindAttribute(this.quadBuffer, program['a_pos'], 2);

        this.gl.uniform1i(program['u_wind'], 0);
        this.gl.uniform1i(program['u_model'], this.windModel);
        this.gl.uniform1i(program['u_particles'], 1);

        this.gl.uniform1f(program['u_rand_seed'], Math.random());
        //this.gl.uniform2f(program['u_wind_res'], this.windParam.width, this.windParam.height);
        this.gl.uniform2f(program['u_wind_res'], this.gl.canvas.width, this.gl.canvas.height);

        this.gl.uniform2f(program['u_wind_min'], this.windParam.uMin, this.windParam.vMin);
        this.gl.uniform2f(program['u_wind_max'], this.windParam.uMax, this.windParam.vMax);

        this.gl.uniform1f(program['u_speed_factor'], this.speedFactor);
        this.gl.uniform1f(program['u_drop_rate'], this.dropRate);
        this.gl.uniform1f(program['u_drop_rate_bump'], this.dropRateBump);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        this.bindFramebuffer(null);

        // swap the particle state textures so the new one becomes the current one
        let temp = this.particleStateTexture0;
        this.particleStateTexture0 = this.particleStateTexture1;
        this.particleStateTexture1 = temp;
    }
    bindFramebuffer(framebuffer, texture) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        if (texture) {
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
        }
    }
    resize() {
        this.resizeCanvas();
        let emptyPixels = new Uint8Array(this.gl.canvas.width * this.gl.canvas.height * 4);
        // screen textures to hold the drawn screen for the previous and the current frame
        if (!this.backgroundTexture) {
            this.backgroundTexture = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.backgroundTexture);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixels);

        if (!this.screenTexture) {
            this.screenTexture = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.screenTexture);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixels);
    }
    /**
     * Clear.
     */
    clear() {
        this.windImage = null;
        this.clearCanvas();
    }
}

/**
 * The class extends from $3Clear_WebGL which draw contour by WebGL.
 * The canvas of $3Clear_WebGL_Contour instance should be independent.
 */
class $3Clear_WebGL_Contour extends $3Clear_WebGL {
    constructor(canvas, parameters) {
        super(canvas);
        this.contourParam = parameters || {};
        if (!this.contourParam.width) {
            this.contourParam.width = 360;
        }
        if (!this.contourParam.height) {
            this.contourParam.height = 180;
        }
        if (!this.contourParam.extent) {
            this.contourParam.extent = [-180, -90, 180, 90];
        }
        if (!this.contourParam.min) {
            this.contourParam.min = 0;
        }
        if (!this.contourParam.max) {
            this.contourParam.max = 1000;
        }
        this.resolutionW = (this.contourParam.extent[2] - this.contourParam.extent[0]) / this.contourParam.width;
        this.resolutionH = (this.contourParam.extent[3] - this.contourParam.extent[1]) / this.contourParam.height;
        this.pixelRatio = 1;

        this.vsh_source = 'precision mediump float;\n\
        attribute vec2 a_position;\n\
        attribute vec2 a_texCoord;\n\
        varying vec2 v_texCoord;\n\
        void main() {\n\
            gl_Position = vec4((2.0 * a_position-1.0)*vec2(1.0, -1.0), 0, 1);\n\
            v_texCoord=a_texCoord;\n\
        }';
        this.fsh_source = '#extension GL_OES_standard_derivatives : enable\n\
        precision mediump float;\n\
        varying vec2 v_texCoord;\n\
        uniform sampler2D u_imgTexture1;\n\
        uniform sampler2D u_imgTexture2;\n\
        uniform sampler2D u_colorTexture;\n\
        uniform int u_applyMask;\n\
        uniform sampler2D u_maskTexture;\n\
        uniform float u_t;\n\
        uniform int u_model;\n\
        uniform float u_alpha;\n\
        uniform vec2 customDataScaleOffset;\n\
        uniform vec4 textureSize;\n\
        float SmoothLine(float distance, float fraction) {\n\
            float SmoothCenter = 0.5;\n\
            vec2 deltaXY = vec2(dFdx(distance), dFdy(distance));\n\
            float delta = sqrt(dot(deltaXY, deltaXY));\n\
            float smoothWidth = delta * 2.0;\n\
            float centerDistance = abs(SmoothCenter - distance);\n\
            float t = clamp(1.0 - centerDistance / smoothWidth, 0.0, 1.0);\n\
            t = fraction < SmoothCenter ? t : 0.0;\n\
            return t * t * (3.0 - 2.0 * t);\n\
        }\n\
        vec4 ComputeIsoLine(vec4 isobarePressureAlpha) {\n\
            vec4 baseColor = texture2D(u_colorTexture, vec2(isobarePressureAlpha.y, 0.0));\n\
            float alpha = SmoothLine(isobarePressureAlpha.x, isobarePressureAlpha.z);\n\
            vec4 result;\n\
            result.xyz = baseColor.xyz;\n\
            result.w = baseColor.w * isobarePressureAlpha.w * alpha;\n\
            return result;\n\
        }\n\
        float ComputeValue(sampler2D textureData, vec2 texCoord,bool isRG) {\n\
            vec2 texCoordLerp = fract(texCoord.xy * textureSize.xy);\n\
            vec2 texCoord00 = texCoord.xy + (vec2(0.0, 0.0) - texCoordLerp) * textureSize.zw;\n\
            vec2 texCoord10 = texCoord.xy + (vec2(1.0, 0.0) - texCoordLerp) * textureSize.zw;\n\
            vec2 texCoord01 = texCoord.xy + (vec2(0.0, 1.0) - texCoordLerp) * textureSize.zw;\n\
            vec2 texCoord11 = texCoord.xy + (vec2(1.0, 1.0) - texCoordLerp) * textureSize.zw;\n\
            vec2 splitValue00,splitValue10,splitValue01,splitValue11;\n\
            if(isRG){\n\
                splitValue00 = texture2D(textureData, texCoord00).xy;\n\
                splitValue10 = texture2D(textureData, texCoord10).xy;\n\
                splitValue01 = texture2D(textureData, texCoord01).xy;\n\
                splitValue11 = texture2D(textureData, texCoord11).xy;\n\
            }else{\n\
                splitValue00 = texture2D(textureData, texCoord00).zw;\n\
                splitValue10 = texture2D(textureData, texCoord10).zw;\n\
                splitValue01 = texture2D(textureData, texCoord01).zw;\n\
                splitValue11 = texture2D(textureData, texCoord11).zw;\n\
            }\n\
            float value00 = splitValue00.y+splitValue00.x/255.0;\n\
            float value10 = splitValue10.y+splitValue10.x/255.0;\n\
            float value01 = splitValue01.y+splitValue01.x/255.0;\n\
            float value11 = splitValue11.y+splitValue11.x/255.0;\n\
            float value0 = mix(value00, value10, texCoordLerp.x);\n\
            float value1 = mix(value01, value11, texCoordLerp.x);\n\
            float value = mix(value0, value1, texCoordLerp.y);\n\
            return value;\n\
        }\n\
        void main() {\n\
            if(u_applyMask==1){\n\
                vec4 maskValue=texture2D(u_maskTexture, v_texCoord);\n\
                if(maskValue.a==0.0){\n\
                    discard;\n\
                }\n\
            }\n\
            float v1,v2;\n\
            if(u_model==0){\n\
                v1=ComputeValue(u_imgTexture1, v_texCoord,true);\n\
                v2=ComputeValue(u_imgTexture1, v_texCoord,false);\n\
            }else if(u_model==1){\n\
                v1=ComputeValue(u_imgTexture1, v_texCoord,false);\n\
                v2=ComputeValue(u_imgTexture2, v_texCoord,true);\n\
            }else if(u_model==2){\n\
                v1=ComputeValue(u_imgTexture2, v_texCoord,true);\n\
                v2=ComputeValue(u_imgTexture2, v_texCoord,false);\n\
            }else{\n\
                v1=ComputeValue(u_imgTexture1, v_texCoord,false);\n\
                v2=ComputeValue(u_imgTexture2, v_texCoord,false);\n\
            }\n\
            if(u_t<0.5&&v1==0.0){discard;}\n\
            if(u_t>0.5&&v2==0.0){discard;}\n\
            float v=v1*(1.0-u_t)+v2*u_t;\n\
            float vFraction = fract(v * customDataScaleOffset.x + customDataScaleOffset.y);\n\
            vFraction=fract(v * 10.0);\n\
            float vLineDistance = 1.0 - 2.0 * abs(vFraction - 0.5);\n\
            vLineDistance *= vLineDistance * vLineDistance;\n\
            vec4 fragColor = ComputeIsoLine(vec4(vLineDistance, v, vFraction, 1.0));\n\
            if(fragColor.a<0.5){\n\
                fragColor=vec4(0.0,0.0,0.0,0.0);\n\
            }\n\
            gl_FragColor=fragColor*u_alpha;\n\
        }';
        let ext = this.gl.getExtension("OES_standard_derivatives");
        this.program = this.initProgram(this.vsh_source, this.fsh_source);
        this.gl.useProgram(this.program.program);
        this.initAttributes();
    }
    /**
     * Init Attributes
     */
    initAttributes() {
        let texCoordArray = new Float32Array([0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ]);
        let buffer = this.createBuffer(texCoordArray, this.gl.ARRAY_BUFFER);
        this.bindAttribute(buffer, this.program['a_texCoord'], 2);
    }
    /**
     * Set the color texture
     * @param {array} colors,the element in color which represent the RGBA color model.
     */
    setColor(colors) {
        if (!this.texture_colortable) {
            this.texture_colortable = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_colortable);
        }
        let colortable = new Uint8Array(colors);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, colortable.length / 4, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, colortable);
    }
    /**
     * Set the mask texture
     * @param {HTMLImageElement} img.
     */
    setMask(img) {
        if (!this.texture_mask) {
            this.texture_mask = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_mask);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
    }
    /**
     * Set the image texture,one image contains 2 datas in different time.
     * @param {HTMLImageElement} img1
     * @param {HTMLImageElement} img2
     */
    initImgs(img1, img2) {
        if (!this.texture_img1) {
            this.texture_img1 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_img1);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img1);

        if (!this.texture_img2) {
            this.texture_img2 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_img2);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img2);
    }
    /**
     * Draw the image texture
     * @param {array} extent , current map extent
     * @param {float} t [0,1]
     * @param {int} model 0|1|2|3
     */
    draw(extent, t, model) {
        this.t = t;
        this.model = model;
        this.redraw(extent);
    }
    /**
     * Redraw the image texture
     * @param {array} extent , current map extent
     */
    redraw(extent) {
        if (this.texture_img1 && this.texture_img2) {
            this.gl.useProgram(this.program.program);
            let imageExtent = this.calcImgExtent(extent);

            let vertexArray = new Float32Array([imageExtent[0], imageExtent[1],
                imageExtent[2], imageExtent[1],
                imageExtent[0], imageExtent[3],
                imageExtent[0], imageExtent[3],
                imageExtent[2], imageExtent[1],
                imageExtent[2], imageExtent[3]
            ]);
            if (!this.vertexPositionBuffer) {
                this.vertexPositionBuffer = this.gl.createBuffer();
            }
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.STATIC_DRAW);
            this.bindAttribute(this.vertexPositionBuffer, this.program['a_position'], 2);

            //let buffer = this.createBuffer(vertexArray, this.gl.ARRAY_BUFFER);
            //this.bindAttribute(buffer, this.program['a_position'], 2);

            this.bindTexture(this.texture_img1, 0);
            this.gl.uniform1i(this.program['u_imgTexture1'], 0);
            this.bindTexture(this.texture_img2, 1);
            this.gl.uniform1i(this.program['u_imgTexture2'], 1);
            this.bindTexture(this.texture_colortable, 2);
            this.gl.uniform1i(this.program['u_colorTexture'], 2);
            if (this.texture_mask) {
                this.bindTexture(this.texture_mask, 3);
                this.gl.uniform1i(this.program['u_maskTexture'], 3);
                this.gl.uniform1i(this.program['u_applyMask'], 1);
            }

            this.gl.uniform1f(this.program['u_t'], this.t);
            this.gl.uniform1i(this.program['u_model'], this.model);
            this.gl.uniform1f(this.program['u_alpha'], this.alpha);

            let xstep = 1 / this.contourParam.width;
            let ystep = 1 / this.contourParam.height;
            this.gl.uniform4f(this.program['textureSize'], this.contourParam.width, this.contourParam.height, xstep, ystep);
            let scaleOffset = [25, 0.324999988709];
            this.gl.uniform2f(this.program['customDataScaleOffset'], scaleOffset[0], scaleOffset[1]);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    }

    /**
     * Calculate the image extent by current Map extent
     * @param {array} map extent
     * @return {array} image extent
     */
    calcImgExtent(extent) {
        // the canvas size must be set to the map size before calc.
        let size = [this.gl.canvas.width, this.gl.canvas.height];
        let viewCenter = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        let viewResolution = (extent[2] - extent[0]) / size[0];

        let scale0 = this.pixelRatio * this.resolutionW / viewResolution;
        let scale1 = this.pixelRatio * this.resolutionH / viewResolution;

        let dx2 = (this.contourParam.extent[0] - viewCenter[0]) / this.resolutionW;
        let dy2 = (viewCenter[1] - this.contourParam.extent[3]) / this.resolutionH;

        let dx = dx2 * scale0 + size[0] / 2;
        let dy = dy2 * scale1 + size[1] / 2;
        let dw = this.contourParam.width * scale0;
        let dh = this.contourParam.height * scale1;
        let x0 = dx / size[0];
        let y0 = dy / size[1];
        let x1 = (dx + dw) / size[0];
        let y1 = (dy + dh) / size[1];
        return [x0, y0, x1, y1];
    }
    /**
     * Resize.
     */
    resize() {
        this.resizeCanvas();
    }
    /**
     * Clear.
     */
    clear() {
        this.texture_img1 = null;
        this.texture_img2 = null;
        this.clearCanvas();
    }
}


/**
 * The class extends from $3Clear_WebGL which draw image by WebGL.
 * The canvas of $3Clear_WebGL_Image instance should be independent.
 */
class $3Clear_WebGL_Image extends $3Clear_WebGL {
    constructor(canvas, parameters) {
        super(canvas);
        this.imageParam = parameters || {};
        if (!this.imageParam.width) {
            this.imageParam.width = 360;
        }
        if (!this.imageParam.height) {
            this.imageParam.height = 180;
        }
        if (!this.imageParam.extent) {
            this.imageParam.extent = [-180, -90, 180, 90];
        }
        this.resolutionW = (this.imageParam.extent[2] - this.imageParam.extent[0]) / this.imageParam.width;
        this.resolutionH = (this.imageParam.extent[3] - this.imageParam.extent[1]) / this.imageParam.height;
        this.pixelRatio = 1;

        this.vsh_source = 'precision mediump float;\n\
        attribute vec2 a_position;\n\
        attribute vec2 a_texCoord;\n\
        varying vec2 v_texCoord;\n\
        void main() {\n\
            gl_Position = vec4((2.0 * a_position-1.0)*vec2(1.0, -1.0), 0, 1);\n\
            v_texCoord=a_texCoord;\n\
        }';
        this.fsh_source = 'precision mediump float;\n\
        varying vec2 v_texCoord;\n\
        uniform sampler2D u_imgTexture;\n\
        uniform float u_alpha;\n\
        void main() {\n\
            gl_FragColor = texture2D(u_imgTexture, v_texCoord).rgba*u_alpha;\n\
        }';
        this.program = this.initProgram(this.vsh_source, this.fsh_source);
        this.gl.useProgram(this.program.program);
        this.initAttributes();
    }
    /**
     * Init Attributes
     */
    initAttributes() {
        let texCoordArray = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
        let buffer = this.createBuffer(texCoordArray, this.gl.ARRAY_BUFFER);
        this.bindAttribute(buffer, this.program['a_texCoord'], 2);
    }
    /**
     * Set the image texture,one image contains 2 datas in different time.
     * @param {HTMLImageElement} img
     */
    initImg(img) {
        if (!this.texture_img) {
            this.texture_img = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_img);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
    }
    /**
     * Draw the image texture
     * @param {float} t [0,1]
     * @param {int} singleImg 1|0
     */
    drawImgTexture(extent) {
        if (this.texture_img) {
            let imageExtent = this.calcImgExtent(extent);
            this.gl.useProgram(this.program.program);
            let vertexArray = new Float32Array([imageExtent[0], imageExtent[1], imageExtent[2], imageExtent[1], imageExtent[0], imageExtent[3],
                imageExtent[0], imageExtent[3], imageExtent[2], imageExtent[1], imageExtent[2], imageExtent[3]
            ]);
            if (!this.vertexPositionBuffer) {
                this.vertexPositionBuffer = this.gl.createBuffer();
            }
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.STATIC_DRAW);
            this.bindAttribute(this.vertexPositionBuffer, this.program['a_position'], 2);

            //let buffer = this.createBuffer(vertexArray, this.gl.ARRAY_BUFFER);
            //this.bindAttribute(buffer, this.program['a_position'], 2);

            this.bindTexture(this.texture_img, 0);
            this.gl.uniform1i(this.program['u_imgTexture'], 0);
            this.gl.uniform1f(this.program['u_alpha'], this.alpha);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    }
    /**
     * Calculate the image extent by current Map extent
     * @param {array} map extent
     * @return {array} image extent
     */
    calcImgExtent(extent) {
        // the canvas size must be set to the map size before calc.
        let size = [this.gl.canvas.width, this.gl.canvas.height];
        let viewCenter = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        let viewResolution = (extent[2] - extent[0]) / size[0];

        let scale0 = this.pixelRatio * this.resolutionW / viewResolution;
        let scale1 = this.pixelRatio * this.resolutionH / viewResolution;

        let dx2 = (this.imageParam.extent[0] - viewCenter[0]) / this.resolutionW;
        let dy2 = (viewCenter[1] - this.imageParam.extent[3]) / this.resolutionH;

        let dx = dx2 * scale0 + size[0] / 2;
        let dy = dy2 * scale1 + size[1] / 2;
        let dw = this.imageParam.width * scale0;
        let dh = this.imageParam.height * scale1;
        let x0 = dx / size[0];
        let y0 = dy / size[1];
        let x1 = (dx + dw) / size[0];
        let y1 = (dy + dh) / size[1];
        return [x0, y0, x1, y1];
    }
    /**
     * Resize.
     */
    resize() {
        this.resizeCanvas();
    }
    /**
     * Clear.
     */
    clear() {
        this.texture_img = null;
        this.clearCanvas();
    }
}




/**
 * The class extends from $3Clear_WebGL.
 * The canvas of $3Clear_WebGL_Globe instance should be independent.
 */
class $3Clear_WebGL_Globe extends $3Clear_WebGL {
    constructor(canvas, parameters) {
        super(canvas);
        this.vg_source = 'precision mediump float;\n\
        attribute vec3 a_position;\n\
        attribute vec2 a_texCoord;\n\
        uniform mat4 u_matrix;\n\
        varying vec2 v_texCoord;\n\
        varying vec3 v_position;\n\
        void main() {\n\
            gl_Position = u_matrix * vec4(a_position, 1.0);\n\
            v_texCoord = a_texCoord;\n\
            v_position=a_position;\n\
        }';
        this.fg_source = 'precision mediump float;\n\
        uniform sampler2D u_tileTexture;\n\
        uniform sampler2D u_wtileTexture;\n\
        uniform sampler2D u_ltileTexture;\n\
        uniform bool u_useLighting;\n\
        uniform mat4 u_nMatrix;\n\
        uniform vec3 u_ambientColor;\n\
        uniform vec3 u_lightingDirection;\n\
        uniform vec3 u_eyeDirection;\n\
        uniform vec3 u_dLightingColor;\n\
        uniform vec3 u_sLightingColor;\n\
        uniform float u_radius;\n\
        varying vec2 v_texCoord;\n\
        varying vec3 v_position;\n\
        void main() {\n\
            vec4 baseTile=texture2D(u_tileTexture, v_texCoord);\n\
            vec4 waterTile=texture2D(u_wtileTexture, v_texCoord);\n\
            vec4 lightTile=texture2D(u_ltileTexture, v_texCoord);\n\
            vec4 resultColor=baseTile;\n\
            vec3 lightWeighting = vec3(1.0, 1.0, 1.0);\n\
            if (u_useLighting) {\n\
                 vec3 transformedNormal = (u_nMatrix * vec4(v_position/u_radius,1.0)).xyz;\n\
                 float diffuseLightWeighting = max(dot(transformedNormal, u_lightingDirection), 0.0);\n\
                 //calc reflect\n\
                 float shinines=32.0;\n\
                 vec3 eyeDirection = normalize(-u_eyeDirection);\n\
                 vec3 reflectionDirection = reflect(-u_lightingDirection, transformedNormal);\n\
                 float specularLightWeighting = 0.0;\n\
                 if(waterTile.a!=0.0){shinines=0.0;}\n\
                 specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), shinines);\n\
                 lightWeighting = u_ambientColor + u_dLightingColor * diffuseLightWeighting + u_sLightingColor*specularLightWeighting;\n\
                 if(diffuseLightWeighting==0.0&&waterTile.a!=0.0&&lightTile.a!=0.0){resultColor=lightTile;}\n\
            }\n\
            if(waterTile.a==0.0){resultColor=vec4(0.0,0.3,0.5,1.0);}\n\
            if(waterTile.a!=0.0){lightWeighting = vec3(1.0, 1.0, 1.0);}\n\
            gl_FragColor=vec4(resultColor.rgb * lightWeighting, resultColor.a);\n\
    }';

        this.vbackground_source = 'precision mediump float;\n\
        attribute vec3 a_position;\n\
        attribute vec2 a_texCoord;\n\
        uniform mat4 u_matrix;\n\
        varying vec2 v_texCoord;\n\
        varying vec4 v_position;\n\
        void main() {\n\
            v_position= u_matrix * vec4(a_position, 1.0);\n\
            v_texCoord = vec2(a_texCoord.x,a_texCoord.y);\n\
            gl_Position=v_position;\n\
        }';
        this.fbackground_source = 'precision mediump float;\n\
        uniform sampler2D u_backgroundTexture;\n\
        uniform float u_radius;\n\
        varying vec2 v_texCoord;\n\
        varying vec4 v_position;\n\
        void main() {\n\
            if(v_position.z<5.5-u_radius/2.0-(u_radius/2.0-1.0)){discard;}\n\
            gl_FragColor=texture2D(u_backgroundTexture,v_texCoord);\n\
    }';


        this.vplane_source = 'precision mediump float;\n\
        attribute vec3 a_position;\n\
        attribute vec2 a_texCoord;\n\
        uniform mat4 u_matrix;\n\
        varying vec2 v_texCoord;\n\
        varying vec4 v_position;\n\
        void main() {\n\
            v_position = u_matrix * vec4(a_position, 1.0);\n\
            v_texCoord = a_texCoord;\n\
            gl_Position=v_position;\n\
    }';
        this.fplane_source = 'precision mediump float;\n\
        uniform sampler2D u_maskTexture;\n\
        uniform sampler2D u_imgTexture1;\n\
        uniform sampler2D u_imgTexture2;\n\
        uniform sampler2D u_colorTexture;\n\
        uniform int u_isWind;\n\
        uniform vec2 u_wind_min;\n\
        uniform vec2 u_wind_max;\n\
        uniform float u_t;\n\
        uniform int u_model;\n\
        uniform float u_alpha;\n\
        uniform float u_radius;\n\
        uniform float u_min;\n\
        uniform float u_max;\n\
        uniform bool u_applyMask;\n\
        varying vec2 v_texCoord;\n\
        varying vec4 v_position;\n\
        float ComputeValue(sampler2D textureData, vec2 texCoord,bool isRG) {\n\
            vec2 splitValue;\n\
            if(isRG){\n\
                splitValue = texture2D(textureData, texCoord).xy;\n\
            }else{\n\
                splitValue = texture2D(textureData, texCoord).zw;\n\
            }\n\
            float value = splitValue.y+splitValue.x/255.0;\n\
            return value;\n\
        }\n\
        vec2 ComputeWind(sampler2D textureData, vec2 texCoord,bool isRG){\n\
          vec2 uv;\n\
          if(isRG){\n\
              uv = texture2D(textureData, texCoord).xy;\n\
          }else{\n\
              uv = texture2D(textureData, texCoord).zw;\n\
          }\n\
          return uv;\n\
        }\n\
        void main() {\n\
            if(v_position.z>5.5-u_radius/2.0-(u_radius/2.0-1.0)){discard;}\n\
            float v1,v2,v;\n\
            if(u_isWind==1){\n\
              vec2 uv1,uv2;\n\
              if(u_model==0){\n\
                uv1=ComputeWind(u_imgTexture1, v_texCoord,true);\n\
                uv2=ComputeWind(u_imgTexture1, v_texCoord,false);\n\
              }else if(u_model==1){\n\
                uv1=ComputeWind(u_imgTexture1, v_texCoord,false);\n\
                uv2=ComputeWind(u_imgTexture2, v_texCoord,true);\n\
              }else if(u_model==2){\n\
                uv1=ComputeWind(u_imgTexture2, v_texCoord,true);\n\
                uv2=ComputeWind(u_imgTexture2, v_texCoord,false);\n\
              }else{\n\
                uv1=ComputeWind(u_imgTexture1, v_texCoord,false);\n\
                uv2=ComputeWind(u_imgTexture2, v_texCoord,false);\n\
              }\n\
              float maxLength=length(u_wind_max);\n\
              vec2 velocity1 = mix(u_wind_min, u_wind_max,uv1);\n\
              v1 = length(velocity1) / maxLength;\n\
              vec2 velocity2 = mix(u_wind_min, u_wind_max,uv2);\n\
              v2 = length(velocity2) / maxLength;\n\
              vec2 uv=mix(uv1,uv2,u_t);\n\
              vec2 velocity = mix(u_wind_min, u_wind_max,uv);\n\
              v = length(velocity) / maxLength;\n\
            }else{\n\
              if(u_model==0){\n\
                v1=ComputeValue(u_imgTexture1, v_texCoord,true);\n\
                v2=ComputeValue(u_imgTexture1, v_texCoord,false);\n\
              }else if(u_model==1){\n\
                v1=ComputeValue(u_imgTexture1, v_texCoord,false);\n\
                v2=ComputeValue(u_imgTexture2, v_texCoord,true);\n\
              }else if(u_model==2){\n\
                v1=ComputeValue(u_imgTexture2, v_texCoord,true);\n\
                v2=ComputeValue(u_imgTexture2, v_texCoord,false);\n\
              }else{\n\
                v1=ComputeValue(u_imgTexture1, v_texCoord,false);\n\
                v2=ComputeValue(u_imgTexture2, v_texCoord,false);\n\
              }\n\
              v=v1*(1.0-u_t)+v2*u_t;\n\
            }\n\
            if(u_t<0.5&&v1==0.0){discard;}\n\
            if(u_t>0.5&&v2==0.0){discard;}\n\
            if(v<u_min||v>u_max){discard;}\n\
            vec4 overlayer=texture2D(u_colorTexture, vec2(v, 0.0));\n\
            vec4 resultColor=overlayer;\n\
            if(u_applyMask){\n\
               vec4 masklayer=texture2D(u_maskTexture,v_texCoord);\n\
               if(masklayer.a==0.0){discard;}\n\
            }\n\
            gl_FragColor=resultColor*resultColor.a*u_alpha;\n\
    }';

        this.vc_source = 'precision mediump float;\n\
    attribute vec3 a_position;\n\
    uniform mat4 u_matrix;\n\
    uniform float u_radius;\n\
    varying vec4 v_position;\n\
    varying float v_radius;\n\
    void main() {\n\
      v_position = u_matrix*vec4(a_position*u_radius, 1.0);\n\
      v_radius=u_radius;\n\
      gl_Position=v_position;\n\
    }';
        this.fc_source = 'precision mediump float;\n\
    uniform vec3 u_color;\n\
    varying vec4 v_position;\n\
    varying float v_radius;\n\
    void main() {\n\
      if(v_position.z>5.5-v_radius/2.0-(v_radius/2.0-1.0)){discard;}\n\
      gl_FragColor=vec4(u_color,1.0);\n\
    }';


        this.vw_source = 'precision mediump float;\n\
    attribute float a_index;\n\
    uniform sampler2D u_particles;\n\
    uniform float u_particles_res;\n\
    uniform sampler2D u_wind1;\n\
    uniform sampler2D u_wind2;\n\
    uniform int u_model;\n\
    uniform float u_t;\n\
    uniform vec2 u_wind_min;\n\
    uniform vec2 u_wind_max;\n\
    uniform mat4 u_matrix;\n\
    uniform float u_radius;\n\
    uniform bool u_applyMask;\n\
    uniform sampler2D u_maskTexture;\n\
    varying vec2 v_uv;\n\
    varying float v_speed;\n\
    varying vec4 v_position;\n\
    varying float v_radius;\n\
    vec2 ComputeValue(sampler2D textureData, vec2 texCoord,bool isRG) {\n\
        vec2 splitValue;\n\
        if(isRG){\n\
            splitValue = texture2D(textureData, texCoord).xy;\n\
        }else{\n\
            splitValue = texture2D(textureData, texCoord).zw;\n\
        }\n\
        return splitValue;\n\
    }\n\
    void main() {\n\
        vec4 color = texture2D(u_particles,vec2(fract(a_index/u_particles_res),floor(a_index/u_particles_res)/u_particles_res));\n\
        vec2 particle_pos = vec2(color.r / 255.0 + color.b,color.g / 255.0 + color.a);\n\
        vec2 v1,v2;\n\
        if(u_model==0){\n\
            v1=ComputeValue(u_wind1, particle_pos,true);\n\
            v2=ComputeValue(u_wind1, particle_pos,false);\n\
        }else if(u_model==1){\n\
            v1=ComputeValue(u_wind1, particle_pos,false);\n\
            v2=ComputeValue(u_wind2, particle_pos,true);\n\
        }else if(u_model==2){\n\
            v1=ComputeValue(u_wind2, particle_pos,true);\n\
            v2=ComputeValue(u_wind2, particle_pos,false);\n\
        }else{\n\
            v1=ComputeValue(u_wind1, particle_pos,false);\n\
            v2=ComputeValue(u_wind2, particle_pos,false);\n\
        }\n\
        v_uv=mix(v1,v2,u_t);\n\
        if(u_t<0.5&&v1.x==0.0&&v1.y==0.0){v_uv=vec2(0.0,0.0);}\n\
        if(u_t>0.5&&v2.x==0.0&&v2.y==0.0){v_uv=vec2(0.0,0.0);}\n\
        if(u_model==0){\n\
            v_uv=texture2D(u_wind1, particle_pos).rg;\n\
        }else{\n\
            v_uv=texture2D(u_wind1, particle_pos).ba;\n\
        }\n\
        if(u_applyMask){\n\
            vec4 maskValue=texture2D(u_maskTexture, particle_pos);\n\
            if(maskValue.a==0.0){\n\
                v_uv=vec2(0.0,0.0);\n\
            }\n\
        }\n\
        vec2 velocity = mix(u_wind_min, u_wind_max,v_uv);\n\
        v_speed = length(velocity) / length(u_wind_max);\n\
        gl_PointSize = 5.0*v_speed;\n\
        float lon=1.0-particle_pos.x;\n\
        float lat=particle_pos.y;\n\
        float theta =lat*3.141593265;\n\
        float sinTheta = sin(theta);\n\
        float cosTheta = cos(theta);\n\
        float phi = lon * 2.0 * 3.141593265;\n\
        float sinPhi = sin(phi);\n\
        float cosPhi = cos(phi);\n\
        float x = cosPhi * sinTheta;\n\
        float y = cosTheta;\n\
        float z = sinPhi * sinTheta;\n\
        v_position=u_matrix*vec4(x*u_radius,y*u_radius,z*u_radius,1);\n\
        v_radius=u_radius;\n\
        gl_Position = v_position;\n\
    }';
        this.fw_source = 'precision mediump float;\n\
    uniform sampler2D u_color_ramp;\n\
    varying vec2 v_uv;\n\
    varying float v_speed;\n\
    varying vec4 v_position;\n\
    varying float v_radius;\n\
    void main() {\n\
        if(v_uv.x==0.0&&v_uv.y==0.0){discard;}\n\
        if(v_position.z>5.5-v_radius/2.0-(v_radius/2.0-1.0)){discard;}\n\
        gl_FragColor = texture2D(u_color_ramp, vec2(v_speed,0.0));\n\
    }';

        this.quadVert = 'precision mediump float;\n\
    attribute vec2 a_pos;\n\
    varying vec2 v_tex_pos;\n\
    void main() {\n\
        v_tex_pos = a_pos;\n\
        gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);\n\
    }';
        this.screenFrag = 'precision mediump float;\n\
    uniform sampler2D u_screen;\n\
    uniform float u_opacity;\n\
    varying vec2 v_tex_pos;\n\
    void main() {\n\
        vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);\n\
        gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);\n\
    }';
        this.updateFrag = 'precision highp float;\n\
    uniform sampler2D u_particles;\n\
    uniform sampler2D u_wind1;\n\
    uniform sampler2D u_wind2;\n\
    uniform int u_model;\n\
    uniform float u_t;\n\
    uniform vec2 u_wind_res;\n\
    uniform vec2 u_wind_min;\n\
    uniform vec2 u_wind_max;\n\
    uniform float u_rand_seed;\n\
    uniform float u_speed_factor;\n\
    uniform float u_drop_rate;\n\
    uniform float u_drop_rate_bump;\n\
    varying vec2 v_tex_pos;\n\
    const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\n\
    float rand(const vec2 co) {\n\
        float t = dot(rand_constants.xy, co);\n\
        return fract(sin(t) * (rand_constants.z + t));\n\
    }\n\
    vec2 ComputeValue(sampler2D textureData, vec2 texCoord,bool isRG) {\n\
        vec2 splitValue;\n\
        if(isRG){\n\
            splitValue = texture2D(textureData, texCoord).xy;\n\
        }else{\n\
            splitValue = texture2D(textureData, texCoord).zw;\n\
        }\n\
        return splitValue;\n\
    }\n\
    vec2 lookup_wind(const vec2 uv) {\n\
        vec2 px = 1.0 / u_wind_res;\n\
        vec2 vc = (floor(uv * u_wind_res)) * px;\n\
        vec2 f = fract(uv * u_wind_res);\n\
        vec2 tl,tr,bl,br;\n\
        vec2 tl1,tr1,bl1,br1,tl2,tr2,bl2,br2;\n\
        if(u_model==0){\n\
            tl1=ComputeValue(u_wind1, vc,true);\n\
            tr1=ComputeValue(u_wind1, vc + vec2(px.x, 0),true);\n\
            bl1=ComputeValue(u_wind1, vc + vec2(0, px.y),true);\n\
            br1=ComputeValue(u_wind1, vc + px,true);\n\
            tl2=ComputeValue(u_wind1, vc,false);\n\
            tr2=ComputeValue(u_wind1, vc + vec2(px.x, 0),false);\n\
            bl2=ComputeValue(u_wind1, vc + vec2(0, px.y),false);\n\
            br2=ComputeValue(u_wind1, vc + px,false);\n\
        }else if(u_model==1){\n\
            tl1=ComputeValue(u_wind1, vc,false);\n\
            tr1=ComputeValue(u_wind1, vc + vec2(px.x, 0),false);\n\
            bl1=ComputeValue(u_wind1, vc + vec2(0, px.y),false);\n\
            br1=ComputeValue(u_wind1, vc + px,false);\n\
            tl2=ComputeValue(u_wind2, vc,true);\n\
            tr2=ComputeValue(u_wind2, vc + vec2(px.x, 0),true);\n\
            bl2=ComputeValue(u_wind2, vc + vec2(0, px.y),true);\n\
            br2=ComputeValue(u_wind2, vc + px,true);\n\
        }else if(u_model==2){\n\
            tl1=ComputeValue(u_wind2, vc,true);\n\
            tr1=ComputeValue(u_wind2, vc + vec2(px.x, 0),true);\n\
            bl1=ComputeValue(u_wind2, vc + vec2(0, px.y),true);\n\
            br1=ComputeValue(u_wind2, vc + px,true);\n\
            tl2=ComputeValue(u_wind2, vc,false);\n\
            tr2=ComputeValue(u_wind2, vc + vec2(px.x, 0),false);\n\
            bl2=ComputeValue(u_wind2, vc + vec2(0, px.y),false);\n\
            br2=ComputeValue(u_wind2, vc + px,false);\n\
        }else{\n\
            tl1=ComputeValue(u_wind1, vc,false);\n\
            tr1=ComputeValue(u_wind1, vc + vec2(px.x, 0),false);\n\
            bl1=ComputeValue(u_wind1, vc + vec2(0, px.y),false);\n\
            br1=ComputeValue(u_wind1, vc + px,false);\n\
            tl2=ComputeValue(u_wind2, vc,false);\n\
            tr2=ComputeValue(u_wind2, vc + vec2(px.x, 0),false);\n\
            bl2=ComputeValue(u_wind2, vc + vec2(0, px.y),false);\n\
            br2=ComputeValue(u_wind2, vc + px,false);\n\
        }\n\
        tl=mix(tl1,tl2,u_t);\n\
        tr=mix(tr1,tr2,u_t);\n\
        bl=mix(bl1,bl2,u_t);\n\
        br=mix(br1,br2,u_t);\n\
        if(u_model==0){\n\
          tl = texture2D(u_wind1, vc).rg;\n\
          tr = texture2D(u_wind1, vc + vec2(px.x, 0)).rg;\n\
          bl = texture2D(u_wind1, vc + vec2(0, px.y)).rg;\n\
          br = texture2D(u_wind1, vc + px).rg;\n\
        }else{\n\
          tl = texture2D(u_wind1, vc).ba;\n\
          tr = texture2D(u_wind1, vc + vec2(px.x, 0)).ba;\n\
          bl = texture2D(u_wind1, vc + vec2(0, px.y)).ba;\n\
          br = texture2D(u_wind1, vc + px).ba;\n\
        }\n\
        return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);\n\
    }\n\
    void main() {\n\
        vec4 color = texture2D(u_particles, v_tex_pos);\n\
        vec2 pos = vec2(color.r / 255.0 + color.b,color.g / 255.0 + color.a);\n\
        vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(pos));\n\
        float speed_t = length(velocity) / length(u_wind_max);\n\
        if(speed_t<0.0582950070468378){\n\
           discard;\n\
        }\n\
        vec2 offset = vec2(velocity.x, -velocity.y) * 0.0001 * u_speed_factor;\n\
        pos = fract(1.0 + pos + offset);\n\
        vec2 seed = (pos + v_tex_pos) * u_rand_seed;\n\
        float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;\n\
        float drop = step(1.0 - drop_rate, rand(seed));\n\
        vec2 random_pos = vec2(rand(seed + 1.3),rand(seed + 2.1));\n\
        pos = mix(pos, random_pos, drop);\n\
        gl_FragColor = vec4(fract(pos * 255.0),floor(pos * 255.0) / 255.0);\n\
    }';


        this.globeProgram = this.initProgram(this.vg_source, this.fg_source);
        this.backgroundProgram = this.initProgram(this.vbackground_source, this.fbackground_source);

        this.planeProgram = this.initProgram(this.vplane_source, this.fplane_source);
        this.contourProgram = this.initProgram(this.vc_source, this.fc_source);

        this.windColors = [255, 255, 255, 150,
            255, 255, 255, 255
        ];
        this.fadeOpacity = 0.94; // how fast the particle trails fade on each frame
        this.speedFactor = 0.25; // how fast the particles move
        this.dropRate = 0.044; // how often the particles move to a random place
        this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed

        this.drawProgram = this.initProgram(this.vw_source, this.fw_source);
        this.screenProgram = this.initProgram(this.quadVert, this.screenFrag);
        this.updateProgram = this.initProgram(this.quadVert, this.updateFrag);

        this.quadBuffer = this.createBuffer(new Float32Array([0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ]), this.gl.ARRAY_BUFFER);
        this.framebuffer = this.gl.createFramebuffer();

        this.contourLabels = [];
        this.scale = 1;
        this.max_latitude = 85.05112877980659;
        this.currentDate = new Date();
        this.useLighting = true;
        this.pminValue = 0;
        this.pmaxValue = 1;
        this.pIsWind = false;
        this.baseMapType = 0; //0 img   1 vec   2 ter
        this.baseMapUrl = 'static/tiles/img/';

        this.initGlobe();
        this.initTiles();

        this.setWindColor();
        this.resize();
    }
    /**
     * Set the colortexture for plane
     * @param {array} color
     */
    setPlaneColor(colors) {
        if (!this.texture_colortable) {
            this.texture_colortable = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_colortable);
        }
        let colortable = new Uint8Array(colors);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, colortable.length / 4, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, colortable);
    }
    /**
     * Set the colortexture for wind
     */
    setWindColor() {
        let colortable = new Uint8Array(this.windColors);
        this.windColorTexture = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, colortable.length / 4, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, colortable);
    }
    setWindParam(parameters) {
        this.windParam = parameters || {};
        if (!this.windParam.width) {
            this.windParam.width = 360; // set the default width
        }
        if (!this.windParam.height) {
            this.windParam.height = 180; // set the default height
        }
        if (!this.windParam.uMin) {
            this.windParam.uMin = -30;
        }
        if (!this.windParam.uMax) {
            this.windParam.uMax = 30;
        }
        if (!this.windParam.vMin) {
            this.windParam.vMin = -30;
        }
        if (!this.windParam.vMax) {
            this.windParam.vMax = 30;
        }
    }
    initPlaneImgs(img1, img2, t, mode) {
        if (!this.texture_img1) {
            this.texture_img1 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_img1);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img1);

        if (!this.texture_img2) {
            this.texture_img2 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture_img2);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img2);
        this.planeT = t;
        this.planeMode = mode;
    }
    initBackgroundImg(img) {
        this.texture_background = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
    }
    initSunImg(img) {
        this.texture_sun = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
    }
    initBoundaryData(data) {
        this.boundaryData = data;
    }
    /**
     * Set the mask texture
     * @param {HTMLImageElement} img.
     */
    setMask(img) {
        this.texture_mask = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
    }

    initGlobe() {
        let latitudeBands = 60;
        let longitudeBands = 120;

        let vertexPositionData = [];
        let textureCoordData = [];
        let longNumber = 0;
        let latNumber = 0;
        let theta, sinTheta, cosTheta;
        let phi, sinPhi, cosPhi;
        let x, y, z;
        let u, v;
        let radius = 2 * this.scale;

        let indexData = [];
        let first, second;

        for (; latNumber <= latitudeBands; latNumber++) {
            theta = latNumber * Math.PI / latitudeBands;
            sinTheta = Math.sin(theta);
            cosTheta = Math.cos(theta);
            for (longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                phi = longNumber * 2 * Math.PI / longitudeBands;
                sinPhi = Math.sin(phi);
                cosPhi = Math.cos(phi);
                x = cosPhi * sinTheta * radius;
                y = cosTheta * radius;
                z = sinPhi * sinTheta * radius;
                u = 1 - (longNumber / longitudeBands);
                v = (latNumber / latitudeBands);
                textureCoordData.push(u);
                textureCoordData.push(v);

                vertexPositionData.push(x);
                vertexPositionData.push(y);
                vertexPositionData.push(z);
                if (!(latNumber == latitudeBands || longNumber == longitudeBands)) {
                    first = (latNumber * (longitudeBands + 1)) + longNumber;
                    second = first + longitudeBands + 1;
                    indexData.push(first);
                    indexData.push(second);
                    indexData.push(first + 1);

                    indexData.push(second);
                    indexData.push(second + 1);
                    indexData.push(first + 1);
                }
            }
        }

        this.vertexPosData = new Float32Array(vertexPositionData);

        this.vertexTextureCoordBuffer = this.createBuffer(new Float32Array(textureCoordData), this.gl.ARRAY_BUFFER);

        this.vertexIndexBuffer = this.createBuffer(new Uint16Array(indexData), this.gl.ELEMENT_ARRAY_BUFFER);
        this.vertexIndexBuffer.numItems = indexData.length;
    }

    initTiles() {
        let level = 4;
        let tilesCount = Math.pow(2, level);
        this.tilesDict = {};
        this.tilesDict[this.baseMapType] = {};
        this.tilesDict.keys = [];
        let i, j;
        let tile, key;
        for (i = 0; i < tilesCount; i++) {
            for (j = 0; j < tilesCount; j++) {
                tile = this.createTile(level, i, j);
                key = level + ',' + i + ',' + j;
                this.tilesDict[this.baseMapType][key] = tile;
                this.tilesDict.keys.push(key);
            }
        }
        this.initOtherTiles();
    }

    /**
     * Switch the base map
     * @param {string} url
     * @param {int} mapType 0|img 1|vec 2|ter
     */
    switchMap(url, mapType) {
        if (this.tilesDict[mapType] == undefined) {
            let i = 0;
            let btile, tile;
            let keySplit;
            this.tilesDict[mapType] = {};
            let propertys = this.tilesDict.keys;
            let baseTiles = this.tilesDict[this.baseMapType];
            let formatter = '00000000';
            for (; i < propertys.length; i++) {
                btile = baseTiles[propertys[i]];
                keySplit = propertys[i].split(',');

                let curl = url + keySplit[0] + '/' + keySplit[2] + '/' + keySplit[1] + '.png';
                switch (mapType) {
                    case 0:
                        curl = url + keySplit[0] + '/' + keySplit[2] + '/' + keySplit[1] + '.png';
                        break;
                    case 1:
                        let L = parseInt(keySplit[0]);
                        if (L < 10) {
                            L = 'L0' + L;
                        } else {
                            L = 'L' + L;
                        }

                        let R = parseInt(keySplit[2]);
                        R = R.toString(16);
                        R = 'R' + formatter.substr(0, 8 - R.length) + R;

                        let C = parseInt(keySplit[1]);
                        C = C.toString(16);
                        C = 'C' + formatter.substr(0, 8 - C.length) + C;

                        curl = url + L + '/' + R + '/' + C + '.png';
                        break;
                    case 2:
                        curl = url + keySplit[0] + '/' + keySplit[2] + '/' + keySplit[1] + '.png';
                        break;
                }
                let tile = new Image();
                tile.extent = btile.extent;
                tile.crossOrigin = 'anonymous';
                tile.src = curl;
                let that = this;
                tile.onload = function() {
                    this.loaded = true;
                    let texture = that.createAndSetupTexture(that.gl.NEAREST, that.gl.NEAREST);
                    that.gl.texImage2D(that.gl.TEXTURE_2D, 0, that.gl.RGBA, that.gl.RGBA, that.gl.UNSIGNED_BYTE, this);
                    this.texture = texture;
                }
                tile.tileVPositionData = btile.tileVPositionData;
                this.tilesDict[mapType][propertys[i]] = tile;
            }
        }
        this.baseMapType = mapType;
    }

    setScale(value) {
        let previousRadius = 2 * this.scale;
        this.scale = value;
        let radius = 2 * this.scale;
        let i = 0,
            j = 0;
        let tile;
        let propertys = this.tilesDict.keys;
        let baseTiles = this.tilesDict[this.baseMapType];
        for (; i < propertys.length; i++) {
            tile = baseTiles[propertys[i]];
            j = 0;
            for (; j < tile.tileVPositionData.length; j++) {
                tile.tileVPositionData[j] = tile.tileVPositionData[j] / previousRadius * radius;
            }
        }
        i = 0;
        for (; i < this.vertexPosData.length; i++) {
            this.vertexPosData[i] = this.vertexPosData[i] / previousRadius * radius;
        }
    }

    createTile(l, x, y) {
        let latitudeBands = 5;
        let longitudeBands = Math.round(latitudeBands * 180 / this.max_latitude);

        let vertexPositionData = [];
        let textureCoordData = [];
        let indexData = [];
        let first, second;

        let er = 6378137 * Math.PI;
        let tilesCount = Math.pow(2, l);
        let step = er * 2 / (tilesCount);

        let xmin = -er + x * step;
        let xmax = xmin + step;
        let ymax = er - y * step;
        let ymin = ymax - step;

        let _latmin = ymin / er * 180;
        _latmin = 180 / Math.PI * (2 * Math.atan(Math.exp(_latmin * Math.PI / 180)) - Math.PI / 2);
        let _latmax = ymax / er * 180;
        _latmax = 180 / Math.PI * (2 * Math.atan(Math.exp(_latmax * Math.PI / 180)) - Math.PI / 2);
        _latmax = 90 - _latmax;
        _latmin = 90 - _latmin;
        let latmax = (_latmax > _latmin) ? _latmax : _latmin;
        let latmin = (_latmax < _latmin) ? _latmax : _latmin;

        let lonmin = xmin / er * 180;
        let lonmax = xmax / er * 180;
        lonmin = 180 - lonmin;
        lonmax = 180 - lonmax;

        //let url = this.baseMapUrl + '&x=' + x + '&y=' + y + '&l=' + l;
        let url = this.baseMapUrl + l + '/' + y + '/' + x + '.png';

        let tile = new Image();
        tile.extent = [lonmin, latmin, lonmax, latmax];
        tile.crossOrigin = 'anonymous';
        tile.src = url;
        let that = this;
        tile.onload = function() {
            this.loaded = true;
            let texture = that.createAndSetupTexture(that.gl.NEAREST, that.gl.NEAREST);
            that.gl.texImage2D(that.gl.TEXTURE_2D, 0, that.gl.RGBA, that.gl.RGBA, that.gl.UNSIGNED_BYTE, this);
            this.texture = texture;
        }
        let maxlatRadian = (latmax - latmin) / 180 * Math.PI;
        let latRadianOffset = (latmin) / 180 * Math.PI;

        let maxlonRadian = (lonmax - lonmin) / 180 * Math.PI;
        let lonRadianOffset = lonmin / 180 * Math.PI;

        let radius = 2 * this.scale;

        let longNumber = 0;
        let latNumber = 0;
        let theta, sinTheta, cosTheta;
        let phi, sinPhi, cosPhi;
        let xcoord, ycoord, zcoord;
        let u, v;
        for (; latNumber <= latitudeBands; latNumber++) {
            theta = latRadianOffset + latNumber * maxlatRadian / latitudeBands;
            sinTheta = Math.sin(theta);
            cosTheta = Math.cos(theta);
            for (longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                phi = lonRadianOffset + longNumber * maxlonRadian / longitudeBands;
                sinPhi = Math.sin(phi);
                cosPhi = Math.cos(phi);
                xcoord = cosPhi * sinTheta * radius;
                ycoord = cosTheta * radius;
                zcoord = sinPhi * sinTheta * radius;
                if (!this.tileVtextureBuffer) {
                    u = (longNumber / longitudeBands);
                    v = (latNumber / latitudeBands);
                    textureCoordData.push(u);
                    textureCoordData.push(v);
                }
                vertexPositionData.push(xcoord);
                vertexPositionData.push(ycoord);
                vertexPositionData.push(zcoord);
                if (!this.tileVindexBuffer) {
                    if (!(latNumber == latitudeBands || longNumber == longitudeBands)) {
                        first = (latNumber * (longitudeBands + 1)) + longNumber;
                        second = first + longitudeBands + 1;
                        indexData.push(first);
                        indexData.push(second);
                        indexData.push(first + 1);

                        indexData.push(second);
                        indexData.push(second + 1);
                        indexData.push(first + 1);
                    }
                }
            }
        }

        if (!this.tileVtextureBuffer) {
            this.tileVtextureBuffer = this.createBuffer(new Float32Array(textureCoordData), this.gl.ARRAY_BUFFER);
        }
        if (!this.tileVindexBuffer) {
            this.tileVindexBuffer = this.createBuffer(new Uint16Array(indexData), this.gl.ELEMENT_ARRAY_BUFFER);
            this.tileVindexBuffer.numItems = indexData.length;
        }

        let vertexArray = new Float32Array(vertexPositionData);
        tile.tileVPositionData = vertexArray;
        return tile;
    }
    initOtherTiles() {
        let propertys = this.tilesDict.keys;
        let i = 0;
        let key, keySplit, tile;
        let that = this;
        let formatter = '00000000';

        let wtile, wurl;
        this.waterTilesDict = {};

        let ltile, lurl;
        this.lightTilesDict = {};

        for (; i < propertys.length; i++) {
            key = propertys[i];
            keySplit = key.split(',');
            tile = this.tilesDict[this.baseMapType][key];

            let L = parseInt(keySplit[0]);
            if (L < 10) {
                L = 'L0' + L;
            } else {
                L = 'L' + L;
            }

            let R = parseInt(keySplit[2]);
            R = R.toString(16);
            R = 'R' + formatter.substr(0, 8 - R.length) + R;

            let C = parseInt(keySplit[1]);
            C = C.toString(16);
            C = 'C' + formatter.substr(0, 8 - C.length) + C;

            wurl = 'static/tiles/land/' + L + '/' + R + '/' + C + '.png';

            wtile = new Image();
            wtile.crossOrigin = 'anonymous';
            wtile.src = wurl;
            wtile.onload = function() {
                this.loaded = true;
                let texture = that.createAndSetupTexture(that.gl.NEAREST, that.gl.NEAREST);
                that.gl.texImage2D(that.gl.TEXTURE_2D, 0, that.gl.RGBA, that.gl.RGBA, that.gl.UNSIGNED_BYTE, this);
                this.texture = texture;
            }
            wtile.tileVPositionData = tile.tileVPositionData;
            this.waterTilesDict[key] = wtile;

            ltile = new Image();
            lurl = 'static/tiles/light/' + keySplit[0] + '/' + keySplit[2] + '/' + keySplit[1] + '.png';
            //lurl='http://t0.tianditu.com/DataServer?T=cva_w&x=' + keySplit[1] + '&y=' + keySplit[2] + '&l=' + keySplit[0];
            ltile.crossOrigin = 'anonymous';
            ltile.src = lurl;
            ltile.onload = function() {
                this.loaded = true;
                let texture = that.createAndSetupTexture(that.gl.NEAREST, that.gl.NEAREST);
                that.gl.texImage2D(that.gl.TEXTURE_2D, 0, that.gl.RGBA, that.gl.RGBA, that.gl.UNSIGNED_BYTE, this);
                this.texture = texture;
            }
            ltile.tileVPositionData = tile.tileVPositionData;
            this.lightTilesDict[key] = ltile;
        }
    }
    drawGlobe() {
        this.drawBackground();
        this.drawSun();

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.useProgram(this.globeProgram.program);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        this.bindAttribute(this.tileVtextureBuffer, this.globeProgram['a_texCoord'], 2);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.tileVindexBuffer);
        this.gl.uniformMatrix4fv(this.globeProgram['u_matrix'], false, this.matrix.toArray());
        let nMatrix = this.mvMatrix.getInverse();
        nMatrix.transpose();
        this.gl.uniformMatrix4fv(this.globeProgram['u_nMatrix'], false, nMatrix.toArray());

        //And God said,Let there be light:and there was light.
        //And God saw the light,that it was good:and God divided the light from the darkness.
        //And God called the light Day,and the darkness he called Night.And the evening and the morning were the first day.
        this.gl.uniform1i(this.globeProgram['u_useLighting'], this.useLighting);
        this.gl.uniform3f(this.globeProgram['u_ambientColor'], 0.3, 0.3, 0.3);
        let geoPosition = this.calcLonLatByTime();
        let xyz = this.calcVertex(geoPosition.lon, geoPosition.lat);
        let direction = [xyz[0], xyz[1], xyz[2], 1];
        direction = this.rMatrix.multiplyColumn(direction);
        let dirLen = 1 / Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]);
        direction[0] = direction[0] * dirLen;
        direction[1] = direction[1] * dirLen;
        direction[2] = direction[2] * dirLen;
        this.gl.uniform3f(this.globeProgram['u_lightingDirection'], direction[0], direction[1], direction[2]);
        let eyeDirection = [0, 0, -5.5, 1];
        this.gl.uniform3f(this.globeProgram['u_eyeDirection'], eyeDirection[0], eyeDirection[1], eyeDirection[2]);
        this.gl.uniform3f(this.globeProgram['u_sLightingColor'], 1, 1, 1);
        this.gl.uniform3f(this.globeProgram['u_dLightingColor'], 1.8, 1.8, 1.8);
        this.gl.uniform1f(this.globeProgram['u_radius'], this.scale * 2);

        let propertys = this.tilesDict.keys;
        let baseTiles = this.tilesDict[this.baseMapType];
        let i = 0;
        let tile, visible;
        for (; i < propertys.length; i++) {
            tile = baseTiles[propertys[i]];
            if (tile.loaded) {
                visible = this.isTileVisible(tile.extent);
                if (visible) {
                    this.drawTile(tile, propertys[i]);
                }
            }
        }

        /*this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);*/
    }
    drawTile(tile, key) {
        if (!this.tileBuffer) {
            this.tileBuffer = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tileBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, tile.tileVPositionData, this.gl.STATIC_DRAW);
        this.bindAttribute(this.tileBuffer, this.globeProgram['a_position'], 3);

        this.bindTexture(tile.texture, 0);
        this.gl.uniform1i(this.globeProgram['u_tileTexture'], 0);

        let wtile = this.waterTilesDict[key];
        let ltile = this.lightTilesDict[key];
        if (wtile.loaded && ltile.loaded) {
            this.bindTexture(wtile.texture, 1);
            this.gl.uniform1i(this.globeProgram['u_wtileTexture'], 1);

            this.bindTexture(ltile.texture, 2);
            this.gl.uniform1i(this.globeProgram['u_ltileTexture'], 2);
        }

        this.gl.drawElements(this.gl.TRIANGLES, this.tileVindexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    }

    drawBackground() {
        if (this.texture_background) {
            this.gl.useProgram(this.backgroundProgram.program);
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

            let sunPosition = this.calcLonLatByTime();
            let roateMatrix = this.matrix.cloneValue();
            roateMatrix.rotY(sunPosition.lon);

            let radius = 6 * this.scale;
            let i = 0;
            let vertexArray = new Float32Array(this.vertexPosData.length);
            for (; i < this.vertexPosData.length; i++) {
                vertexArray[i] = this.vertexPosData[i] * 3;
            }

            if (!this.vertexPositionBuffer) {
                this.vertexPositionBuffer = this.gl.createBuffer();
            }
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.STATIC_DRAW);
            this.bindAttribute(this.vertexPositionBuffer, this.backgroundProgram['a_position'], 3);

            this.bindAttribute(this.vertexTextureCoordBuffer, this.backgroundProgram['a_texCoord'], 2);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

            this.bindTexture(this.texture_background, 0);
            this.gl.uniform1i(this.backgroundProgram['u_globeTexture'], 0);
            this.gl.uniformMatrix4fv(this.backgroundProgram['u_matrix'], false, roateMatrix.toArray());
            this.gl.uniform1f(this.backgroundProgram['u_radius'], radius);
            this.gl.drawElements(this.gl.TRIANGLES, this.vertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
        }
    }

    drawSun() {
        if (this.texture_sun) {
            this.gl.useProgram(this.backgroundProgram.program);
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
            let sunPosition = this.calcLonLatByTime();
            let lonRadian = (180 - sunPosition.lon) * 2 * Math.PI / 360;
            let latRadian = (90 - sunPosition.lat) * Math.PI / 180;

            let phi0 = lonRadian - Math.PI / 10;
            let sinPhi0 = Math.sin(phi0);
            let cosPhi0 = Math.cos(phi0);
            let theta0 = latRadian - Math.PI / 10;
            let sinTheta0 = Math.sin(theta0);
            let cosTheta0 = Math.cos(theta0);

            let phi1 = lonRadian + Math.PI / 10;
            let sinPhi1 = Math.sin(phi1);
            let cosPhi1 = Math.cos(phi1);
            let theta1 = latRadian + Math.PI / 10;
            let sinTheta1 = Math.sin(theta1);
            let cosTheta1 = Math.cos(theta1);
            let radius = 5.999999 * this.scale;

            let vertexArray = new Float32Array([cosPhi0 * sinTheta0 * radius, cosTheta0 * radius, sinPhi0 * sinTheta0 * radius,
                cosPhi1 * sinTheta0 * radius, cosTheta0 * radius, sinPhi1 * sinTheta0 * radius,
                cosPhi0 * sinTheta1 * radius, cosTheta1 * radius, sinPhi0 * sinTheta1 * radius,

                cosPhi0 * sinTheta1 * radius, cosTheta1 * radius, sinPhi0 * sinTheta1 * radius,
                cosPhi1 * sinTheta0 * radius, cosTheta0 * radius, sinPhi1 * sinTheta0 * radius,
                cosPhi1 * sinTheta1 * radius, cosTheta1 * radius, sinPhi1 * sinTheta1 * radius
            ]);

            if (!this.sunVPositionBuffer) {
                this.sunVPositionBuffer = this.gl.createBuffer();
            }
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sunVPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.STATIC_DRAW);
            this.bindAttribute(this.sunVPositionBuffer, this.backgroundProgram['a_position'], 3);

            if (!this.sunTPositionBuffer) {
                this.sunTPositionBuffer = this.gl.createBuffer();
                let texCoordArray = new Float32Array([0, 0,
                    1, 0,
                    0, 1,

                    0, 1,
                    1, 0,
                    1, 1
                ]);

                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sunTPositionBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoordArray, this.gl.STATIC_DRAW);
            }
            this.bindAttribute(this.sunTPositionBuffer, this.backgroundProgram['a_texCoord'], 2);

            this.bindTexture(this.texture_sun, 0);
            this.gl.uniform1i(this.backgroundProgram['u_globeTexture'], 0);

            this.gl.uniformMatrix4fv(this.backgroundProgram['u_matrix'], false, this.matrix.toArray());
            this.gl.uniform1f(this.backgroundProgram['u_radius'], radius);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    }

    drawBoundary() {
        if (this.boundaryData) {
            if (!this.boundaryPoints) {
                let pointsArray = [];
                let lon, lat, nlon, nlat;
                let p1, p2;
                let i = 0,
                    j;
                let rings = this.boundaryData[0].geometry.rings;
                let ring;
                for (; i < rings.length; i++) {
                    ring = rings[i];
                    for (j = 0; j < ring.length - 1; j++) {
                        lon = ring[j][0];
                        lat = ring[j][1];
                        p1 = this.calcVertex(lon, lat);
                        pointsArray.push(p1[0], p1[1], p1[2]);

                        nlon = ring[j + 1][0];
                        nlat = ring[j + 1][1];
                        p2 = this.calcVertex(nlon, nlat);
                        pointsArray.push(p2[0], p2[1], p2[2]);
                    }
                }
                this.boundaryPoints = new Float32Array(pointsArray);
            }

            let width = this.gl.canvas.width;
            let height = this.gl.canvas.height;
            this.gl.viewport(0, 0, width, height);
            this.gl.disable(this.gl.DEPTH_TEST);
            let program = this.contourProgram;
            this.gl.useProgram(program.program);

            if (!this.boundVertexBuffer) {
                this.boundVertexBuffer = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.boundVertexBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, this.boundaryPoints, this.gl.STATIC_DRAW);
                this.boundVertexBuffer.size = this.boundaryPoints.length / 3;
            }

            this.bindAttribute(this.boundVertexBuffer, program['a_position'], 3);
            this.gl.uniformMatrix4fv(program['u_matrix'], false, this.matrix.toArray());
            this.gl.uniform1f(program['u_radius'], this.scale * 2);
            this.gl.uniform3f(program['u_color'], 0, 0, 0);
            this.gl.drawArrays(this.gl.LINES, 0, this.boundVertexBuffer.size);
        }
    }

    drawPlane() {
        if (this.texture_img1 && this.texture_img2) {
            this.gl.disable(this.gl.DEPTH_TEST);
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.useProgram(this.planeProgram.program);
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

            if (!this.vertexPositionBuffer) {
                this.vertexPositionBuffer = this.gl.createBuffer();
            }
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexPosData, this.gl.STATIC_DRAW);
            this.bindAttribute(this.vertexPositionBuffer, this.planeProgram['a_position'], 3);

            this.bindAttribute(this.vertexTextureCoordBuffer, this.planeProgram['a_texCoord'], 2);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);

            this.gl.uniformMatrix4fv(this.planeProgram['u_matrix'], false, this.matrix.toArray());

            this.gl.uniform1f(this.planeProgram['u_radius'], this.scale * 2);

            this.bindTexture(this.texture_img1, 0);
            this.gl.uniform1i(this.planeProgram['u_imgTexture1'], 0);
            this.bindTexture(this.texture_img2, 1);
            this.gl.uniform1i(this.planeProgram['u_imgTexture2'], 1);
            this.bindTexture(this.texture_colortable, 2);
            this.gl.uniform1i(this.planeProgram['u_colorTexture'], 2);

            this.gl.uniform1f(this.planeProgram['u_t'], this.planeT);
            this.gl.uniform1i(this.planeProgram['u_model'], this.planeMode);
            this.gl.uniform1f(this.planeProgram['u_alpha'], 1);
            this.gl.uniform1f(this.planeProgram['u_min'], this.pminValue);
            this.gl.uniform1f(this.planeProgram['u_max'], this.pmaxValue);

            if (this.pIsWind) {
                this.gl.uniform1i(this.planeProgram['u_isWind'], this.pIsWind);
                this.gl.uniform2f(this.planeProgram['u_wind_min'], this.windParam.uMin, this.windParam.vMin);
                this.gl.uniform2f(this.planeProgram['u_wind_max'], this.windParam.uMax, this.windParam.vMax);
            }
            if (this.texture_mask) {
                this.gl.uniform1i(this.planeProgram['u_applyMask'], 1);
                this.bindTexture(this.texture_mask, 3);
                this.gl.uniform1i(this.planeProgram['u_maskTexture'], 3);
            }

            this.gl.drawElements(this.gl.TRIANGLES, this.vertexIndexBuffer.numItems, this.gl.UNSIGNED_SHORT, 0);
            this.gl.disable(this.gl.BLEND);

            this.drawBoundary();
        }
    }


    initWindImg(image1, image2, t, model) {
        this.windModel = model;
        this.windT = t;
        if (!this.windTexture1) {
            this.windTexture1 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.windTexture1);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image1);

        if (!this.windTexture2) {
            this.windTexture2 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.windTexture2);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image2);
    }

    initParticles(numParticles) {
        //create a square texture where each pixel will hold a particle position encoded as RGBA
        let i = 0,
            j = 0;
        let particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(numParticles));
        this._numParticles = particleRes * particleRes;

        let particleState = new Uint8Array(this._numParticles * 4);
        for (; i < particleState.length; i++) {
            particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
        }
        // textures to hold the particle state for the current and the next frame
        if (!this.particleStateTexture0) {
            this.particleStateTexture0 = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.particleStateTexture0);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, particleRes, particleRes, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, particleState);

        if (!this.particleStateTexture1) {
            this.particleStateTexture1 = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.particleStateTexture1);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, particleRes, particleRes, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, particleState);

        let particleIndices = new Float32Array(this._numParticles);
        for (; j < this._numParticles; j++) {
            particleIndices[j] = j;
        }
        if (!this.particleIndexBuffer) {
            this.particleIndexBuffer = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleIndexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, particleIndices, this.gl.STATIC_DRAW);
        //this.particleIndexBuffer = this.createBuffer(particleIndices, this.gl.ARRAY_BUFFER);
    }
    drawWind() {
        if (this.windTexture1 && this.windTexture2) {
            this.gl.disable(this.gl.DEPTH_TEST);
            this.gl.disable(this.gl.STENCIL_TEST);
            this.bindTexture(this.windTexture1, 0);
            this.bindTexture(this.windTexture2, 1);
            this.bindTexture(this.particleStateTexture0, 2);

            this.drawWindScreen();
            this.updateParticles();
        }
    }
    drawWindScreen() {
        this.bindFramebuffer(this.framebuffer, this.screenTexture);
        let width = this.gl.canvas.width;
        let height = this.gl.canvas.height;
        this.gl.viewport(0, 0, width, height);

        this.drawTexture(this.backgroundTexture, this.fadeOpacity);
        this.drawParticles();
        this.bindFramebuffer(null);

        this.gl.enable(this.gl.BLEND);
        //this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
        this.drawTexture(this.screenTexture, 1.0);
        this.gl.disable(this.gl.BLEND);

        let temp = this.backgroundTexture;
        this.backgroundTexture = this.screenTexture;
        this.screenTexture = temp;
    }
    drawTexture(texture, opacity) {
        let program = this.screenProgram;
        this.gl.useProgram(program.program);
        this.bindAttribute(this.quadBuffer, program['a_pos'], 2);

        this.bindTexture(texture, 3);
        this.gl.uniform1i(program['u_screen'], 3);

        this.gl.uniform1f(program['u_opacity'], opacity);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
    drawParticles() {
        let program = this.drawProgram;
        this.gl.useProgram(program.program);

        this.bindAttribute(this.particleIndexBuffer, program['a_index'], 1);
        this.bindTexture(this.windColorTexture, 3);

        this.gl.uniform1i(program['u_wind1'], 0);
        this.gl.uniform1i(program['u_wind2'], 1);
        this.gl.uniform1i(program['u_model'], this.windModel);
        this.gl.uniform1f(program['u_t'], this.windT);
        this.gl.uniform1i(program['u_particles'], 2);
        this.gl.uniform1i(program['u_color_ramp'], 3);

        this.gl.uniform1f(program['u_particles_res'], this.particleStateResolution);
        this.gl.uniform2f(program['u_wind_min'], this.windParam.uMin, this.windParam.vMin);
        this.gl.uniform2f(program['u_wind_max'], this.windParam.uMax, this.windParam.vMax);

        this.gl.uniformMatrix4fv(program['u_matrix'], false, this.matrix.toArray());
        this.gl.uniform1f(program['u_radius'], 2 * this.scale);
        if (this.texture_mask) {
            this.bindTexture(this.texture_mask, 10);
            this.gl.uniform1i(program['u_maskTexture'], 10);
            this.gl.uniform1i(program['u_applyMask'], 1);
        }

        this.gl.drawArrays(this.gl.POINTS, 0, this._numParticles);
    }
    updateParticles() {
        this.bindFramebuffer(this.framebuffer, this.particleStateTexture1);
        this.gl.viewport(0, 0, this.particleStateResolution, this.particleStateResolution);

        let program = this.updateProgram;
        this.gl.useProgram(program.program);

        this.bindAttribute(this.quadBuffer, program['a_pos'], 2);

        this.gl.uniform1i(program['u_wind1'], 0);
        this.gl.uniform1i(program['u_wind2'], 1);
        this.gl.uniform1i(program['u_model'], this.windModel);
        this.gl.uniform1f(program['u_t'], this.windT);
        this.gl.uniform1i(program['u_particles'], 2);

        this.gl.uniform1f(program['u_rand_seed'], Math.random());
        //this.gl.uniform2f(program['u_wind_res'], this.windParam.width, this.windParam.height);
        this.gl.uniform2f(program['u_wind_res'], this.gl.canvas.width, this.gl.canvas.height);

        this.gl.uniform2f(program['u_wind_min'], this.windParam.uMin, this.windParam.vMin);
        this.gl.uniform2f(program['u_wind_max'], this.windParam.uMax, this.windParam.vMax);

        this.gl.uniform1f(program['u_speed_factor'], this.speedFactor);
        this.gl.uniform1f(program['u_drop_rate'], this.dropRate);
        this.gl.uniform1f(program['u_drop_rate_bump'], this.dropRateBump);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        this.bindFramebuffer(null);

        // swap the particle state textures so the new one becomes the current one
        let temp = this.particleStateTexture0;
        this.particleStateTexture0 = this.particleStateTexture1;
        this.particleStateTexture1 = temp;
    }
    bindFramebuffer(framebuffer, texture) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        if (texture) {
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
        }
    }



    initContourData(data) {
        let pointsArray = [];
        let ii = 0;
        let jj = 0;
        this.labelMaxCount = data.length;
        let points, lon, lat, p1, nlon, nlat, p2;
        let parentNode = this.gl.canvas.parentNode;
        for (; ii < this.labelMaxCount; ii++) {
            points = data[ii].points;
            jj = 0;
            points = t(points);
            points = o(points);
            let centerIndex = Math.floor(points.length / 2);
            let cp = points[centerIndex];
            cp = this.calcVertex(cp[0], cp[1]);
            if (this.contourLabels[ii]) {
                this.contourLabels[ii].innerHTML = data[ii].value;
                this.contourLabels[ii].data = {
                    x: cp[0],
                    y: cp[1],
                    z: cp[2],
                    point: points[centerIndex],
                    value: data[ii].value
                };
                this.contourLabels[ii].style.display = 'none';
            } else {
                let label = document.createElement('div');
                label.style.position = 'absolute';
                label.style['background-color'] = 'white';
                label.style.color = 'black';
                label.style['border-radius'] = '10px';
                label.style['font-size'] = '10px';
                label.style['padding'] = '1px 2px';
                label.style['pointer-events'] = 'none';
                label.style['-moz-user-select'] = 'none';
                label.style['-webkit-user-select'] = 'none';
                label.style['-ms-user-select'] = 'none';
                label.style['user-select'] = 'none';
                label.innerHTML = data[ii].value;
                parentNode.appendChild(label);
                label.data = {
                    x: cp[0],
                    y: cp[1],
                    z: cp[2],
                    point: points[centerIndex],
                    value: data[ii].value
                };
                this.contourLabels.push(label);
            }

            for (; jj < points.length - 1; jj++) {
                lon = points[jj][0];
                lat = points[jj][1];
                p1 = this.calcVertex(lon, lat);
                pointsArray.push(p1[0], p1[1], p1[2]);

                nlon = points[jj + 1][0];
                nlat = points[jj + 1][1];
                p2 = this.calcVertex(nlon, nlat);
                pointsArray.push(p2[0], p2[1], p2[2]);
            }
        }
        let lenDiff = this.contourLabels.length - this.labelMaxCount;
        if (lenDiff > 0) {
            for (ii = 0; ii < lenDiff; ii++) {
                this.contourLabels[this.labelMaxCount + ii].style.display = 'none';
            }
        }

        if (!this.contourVertexBuffer) {
            this.contourVertexBuffer = this.gl.createBuffer();
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.contourVertexBuffer);
        let vertex = new Float32Array(pointsArray);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertex, this.gl.STATIC_DRAW);
        this.contourVertexBuffer.size = vertex.length / 3;

        // the code from windy which creates the contour by points.
        function a(n) {
            var e = .5 * Math.PI,
                t = s(n),
                o = t[0][3];
            if (i(n[0], n[3]) < 1 && r(n[0], o, n[3]) > e) return [];
            var l = a(t[0], e),
                u = a(t[1], e);
            return l.push(o), l.concat(u)
        }

        function s(n) {
            var e = [(n[0][0] + 3 * n[1][0] + 3 * n[2][0] + n[3][0]) / 8, (n[0][1] + 3 * n[1][1] + 3 * n[2][1] + n[3][1]) / 8],
                t = [(n[0][0] + n[1][0]) / 2, (n[0][1] + n[1][1]) / 2],
                o = [(n[0][0] + 2 * n[1][0] + n[2][0]) / 4, (n[0][1] + 2 * n[1][1] + n[2][1]) / 4];
            return [
                [n[0], t, o, e],
                [e, [(n[1][0] + 2 * n[2][0] + n[3][0]) / 4, (n[1][1] + 2 * n[2][1] + n[3][1]) / 4],
                    [(n[2][0] + n[3][0]) / 2, (n[2][1] + n[3][1]) / 2], n[3]
                ]
            ]
        }

        function r(n, e, t) {
            var o = [n[0] - e[0], n[1] - e[1]],
                r = [t[0] - e[0], t[1] - e[1]];
            return Math.abs(Math.atan2(o[0] * r[1] - o[1] * r[0], o[0] * r[0] + o[1] * r[1]))
        }

        function i(n, e) {
            var t = n[0] - e[0],
                o = n[1] - e[1];
            return t * t + o * o
        }


        function t(n) {
            for (var e = [], t = 0; t < n.length - 1; t += 2) {
                /*if(n[t + 1]>360){
                  continue;
                }*/
                e.push([n[t + 1], n[t]]);
            }

            return e;
        }

        function o(n) {
            if (n.length <= 2) return n;
            for (var e = c(n, .25), t = [e[0][0]], o = 0; o < e.length; ++o)
                t = t.concat(a(e[o])),
                    t.push(e[o][3]);
            return t
        }

        function c(n, e) {
            if (n = u(n), n.length <= 2) return n;
            var t = n[0],
                o = n[n.length - 1];
            if (h(n[0], n[n.length - 1])) {
                t = [n[n.length - 2][0], n[n.length - 2][1]];
                var r = t[0] - n[0][0];
                r > 180 ? t[0] -= 360 : r < -180 && (t[0] += 360), o = [n[1][0], n[1][1]];
                var i = o[0] - n[n.length - 1][0];
                i > 180 ? o[0] -= 360 : i < -180 && (o[0] += 360)
            }
            for (var a = [], s = 0; s + 1 < n.length; ++s) {
                var c = s >= 1 ? n[s - 1] : t,
                    f = s + 2 < n.length ? n[s + 2] : o,
                    d = l(n[s], n[s + 1]),
                    p = l(c, n[s + 1]),
                    v = l(f, n[s]),
                    m = 0 == p ? n[s] : [n[s][0] + e * d * (n[s + 1][0] - c[0]) / p, n[s][1] + e * d * (n[s + 1][1] - c[1]) / p],
                    g = 0 == v ? n[s + 1] : [n[s + 1][0] + e * d * (n[s][0] - f[0]) / v, n[s + 1][1] + e * d * (n[s][1] - f[1]) / v];
                a.push([n[s], m, g, n[s + 1]])
            }
            return a
        }

        function u(n) {
            if (0 == n.length)
                return [];
            for (var e = [n[0]], t = 1; t < n.length; ++t)
                n[t][0] == e[e.length - 1][0] && n[t][1] == e[e.length - 1][1] || e.push(n[t]);
            return e
        }

        function l(n, e) {
            var t = e[0] - n[0],
                o = e[1] - n[1];
            return Math.sqrt(t * t + o * o)
        }

        function h(n, e) {
            return n[1] == e[1] && (n[0] == e[0] || n[0] + 360 == e[0] || n[0] - 360 == e[0])
        }

    }
    /**
     * Draw isoline .
     */
    drawContour() {
        if (this.contourVertexBuffer) {
            let width = this.gl.canvas.width;
            let height = this.gl.canvas.height;
            this.gl.viewport(0, 0, width, height);
            this.gl.disable(this.gl.DEPTH_TEST);
            let program = this.contourProgram;
            this.gl.useProgram(program.program);

            this.bindAttribute(this.contourVertexBuffer, program['a_position'], 3);
            this.gl.uniformMatrix4fv(program['u_matrix'], false, this.matrix.toArray());
            this.gl.uniform1f(program['u_radius'], this.scale * 2);
            this.gl.uniform3f(program['u_color'], 1, 1, 1);
            this.gl.drawArrays(this.gl.LINES, 0, this.contourVertexBuffer.size);

            // draw the label
            let i = 0,
                label;
            let x, y, z, w;
            let coord, x_coord, y_coord, z_coord, w_coord;
            let pixelX, pixelY;
            for (; i < this.labelMaxCount; i++) {
                label = this.contourLabels[i];
                label.style.display = 'block';
                x = label.data.x;
                y = label.data.y;
                z = label.data.z;
                w = 1;
                x = x * this.scale * 2;
                y = y * this.scale * 2;
                z = z * this.scale * 2;

                coord = this.matrix.multiplyColumn([x, y, z, w]);

                x_coord = coord[0] / coord[3];
                y_coord = coord[1] / coord[3];
                z_coord = coord[2] / coord[3];

                pixelX = (x_coord * 0.5 + 0.5) * this.gl.canvas.width;
                pixelY = (y_coord * -0.5 + 0.5) * this.gl.canvas.height;
                if (coord[2] > 5.5 - this.scale - (this.scale - 1) || pixelX < 0 || pixelY < 0 || pixelX > this.gl.canvas.width || pixelY > this.gl.canvas.height) {
                    label.style.display = 'none';
                }
                label.style.left = (Math.floor(pixelX) - 12) + 'px';
                label.style.top = (Math.floor(pixelY) - 10) + 'px';
            }
        }
    }

    /**
     * Determine the visiblity of the tile .
     * @param {array} extent
     * @returns {bool}
     */
    isTileVisible(extent) {
        let radius = 2 * this.scale;
        let limit = 5.5 - this.scale - (this.scale - 1.0);
        let lonmin = extent[0];
        let latmin = extent[1];
        let lonmax = extent[2];
        let latmax = extent[3];

        lonmin = 180 - lonmin;
        lonmax = 180 - lonmax;

        latmax = 90 - latmax;
        latmin = 90 - latmin;


        let xyz00 = this.calcVertex(lonmin, latmin);
        let xyz10 = this.calcVertex(lonmax, latmin);
        let xyz01 = this.calcVertex(lonmin, latmax);
        let xyz11 = this.calcVertex(lonmax, latmax);

        let z00 = this.matrix.multiplyColumn([xyz00[0] * radius, xyz00[1] * radius, xyz00[2] * radius, 1])[2];
        let z10 = this.matrix.multiplyColumn([xyz10[0] * radius, xyz10[1] * radius, xyz10[2] * radius, 1])[2];
        let z01 = this.matrix.multiplyColumn([xyz01[0] * radius, xyz01[1] * radius, xyz01[2] * radius, 1])[2];
        let z11 = this.matrix.multiplyColumn([xyz11[0] * radius, xyz11[1] * radius, xyz11[2] * radius, 1])[2];
        let b00 = z00 > limit;
        let b10 = z10 > limit;
        let b01 = z01 > limit;
        let b11 = z11 > limit;
        if (b00 && b10 && b01 && b11) {
            return false;
        }
        return true;
    }


    /**
     * Calcuate the sun direction by the given time,this is just for estimate
     * @returns {Array} direction
     */
    calcLonLatByTime() {
        let latN = 23 + 26 / 60; //the Tropic of Cancer
        let latS = -latN;
        let date = this.currentDate;
        let startYear = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
        let springLimt = new Date(startYear.getTime());
        springLimt.setMonth(3 - 1);
        springLimt.setDate(21);
        let summerLimt = new Date(startYear.getTime());
        summerLimt.setMonth(6 - 1);
        summerLimt.setDate(22);
        let autumnLimt = new Date(startYear.getTime());
        autumnLimt.setMonth(9 - 1);
        autumnLimt.setDate(23);
        let winterLimt = new Date(startYear.getTime());
        winterLimt.setMonth(12 - 1);
        winterLimt.setDate(22);
        let tdiff, ctdiff;
        let lat;
        if (date >= springLimt && date < summerLimt) {
            //spring
            tdiff = summerLimt - springLimt;
            ctdiff = date - springLimt;
            lat = latN * ctdiff / tdiff;
        }
        if (date >= summerLimt && date < autumnLimt) {
            //summer
            tdiff = autumnLimt - summerLimt;
            ctdiff = date - summerLimt;
            lat = latN * (1 - ctdiff / tdiff);
        }
        if (date >= autumnLimt && date < winterLimt) {
            //autumn
            tdiff = winterLimt - autumnLimt;
            ctdiff = date - autumnLimt;
            lat = latS * ctdiff / tdiff;
        }
        if (date >= winterLimt) {
            //winter
            let nextSpring = new Date(springLimt.getFullYear() + 1, springLimt.getMonth(), springLimt.getDate(), springLimt.getHours(), springLimt.getMinutes(), springLimt.getSeconds());
            tdiff = nextSpring - winterLimt;
            ctdiff = date - winterLimt;
            lat = latS * (1 - ctdiff / tdiff);
        }
        if (date < springLimt) {
            //winter
            let previousWinter = new Date(winterLimt.getFullYear() - 1, winterLimt.getMonth(), winterLimt.getDate(), winterLimt.getHours(), winterLimt.getMinutes(), winterLimt.getSeconds());
            tdiff = springLimt - previousWinter;
            ctdiff = date - previousWinter;
            lat = latS * (1 - ctdiff / tdiff);
        }

        let startHour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        let timeZone = date.getTimezoneOffset() / 60;
        let hourDiff = (date - startHour) / 3600000 + timeZone; //UT
        /**
         UT :  00:00  02:00  04:00  06:00  08:00
         Lon:  360°   330°   300°   270°   240°
         */
        let lon = 360 - hourDiff * 360 / 24 - 180;
        return { lon: lon, lat: lat };
    }
    /**
     * lon=[0,2π],the 0 represent -180 degree
     * lat=[0,π],the 0 represent 90 degree
     * lon->α
     * lat->β
     * x=cosα*sinβ
     * y=cosβ
     * z=sinα*sinβ
     */
    calcVertex(lon, lat) {
        /*if(lon>180){
          lon=lon-180;
        }else{
          lon=lon+180;
        }
        lon=(lon)/360;*/
        //note:the lon of contour between 0 and 360,the radian period is 360
        lon = (lon + 180) / 360;
        lat = (90 - lat) / 180;
        lon = 1 - lon; //before draw

        let theta = lat * Math.PI;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        let phi = lon * 2.0 * Math.PI;
        let sinPhi = Math.sin(phi);
        let cosPhi = Math.cos(phi);

        let x = cosPhi * sinTheta;
        let y = cosTheta;
        let z = sinPhi * sinTheta;
        return [x, y, z];
    }

    /**
     * Calcuate the geoCoordinate by x,y,z
     * @param {float} x
     * @param {float} y
     * @param {float} z
     * @returns {Array} geoPoint
     */
    calcGeoPoint(x, y, z) {
        let theta = Math.acos(y); //[0,π]
        let sinTheta = Math.sqrt(1 - y * y);
        let sinPhi = z / sinTheta;
        let cosPhi = x / sinTheta;
        let phi = Math.acos(cosPhi);
        //sinPhi>0&&cosPhi>0 first quadrant
        //sinPhi>0&&cosPhi<0 second quadrant
        //sinPhi<0&&cosPhi>0 fouth quadrant
        //sinPhi<0&&cosPhi<0 third quadrant
        if (sinPhi < 0) {
            phi = 2 * Math.PI - phi;
        }
        let lat = theta / Math.PI;
        let lon = phi / Math.PI / 2;
        lon = 1 - lon;
        lat = 90 - lat * 180;
        lon = lon * 360 - 180;
        return [lon, lat];
    }
    getRayIntersectPoint(vertice, direction) {
        let result = [];
        let r = this.scale * 2;
        let a = direction[0];
        let b = direction[1];
        let c = direction[2];
        let x0 = vertice[0];
        let y0 = vertice[1];
        let z0 = vertice[2];
        let a2 = a * a;
        let b2 = b * b;
        let c2 = c * c;
        let r2 = r * r;
        let ay0 = a * y0;
        let az0 = a * z0;
        let bx0 = b * x0;
        let bz0 = b * z0;
        let cx0 = c * x0;
        let cy0 = c * y0;
        let deltaA = ay0 * bx0 + az0 * cx0 + bz0 * cy0;
        let deltaB = ay0 * ay0 + az0 * az0 + bx0 * bx0 + bz0 * bz0 + cx0 * cx0 + cy0 * cy0;
        let deltaC = a2 + b2 + c2;
        let delta = 8 * deltaA - 4 * deltaB + 4 * r2 * deltaC;
        if (delta < 0) {
            result = [];
        } else {
            let t = a * x0 + b * y0 + c * z0;
            let A = a2 + b2 + c2;
            if (delta == 0) {
                let k = -t / A;
                let x = k * a + x0;
                let y = k * b + y0;
                let z = k * c + z0;
                let p = [x, y, z];
                result.push(p);
            } else if (delta > 0) {
                let sqrtDelta = Math.sqrt(delta);
                let k1 = (-2 * t + sqrtDelta) / (2 * A);
                let x1 = k1 * a + x0;
                let y1 = k1 * b + y0;
                let z1 = k1 * c + z0;
                let p1 = [x1, y1, z1];
                result.push(p1);

                let k2 = (-2 * t - sqrtDelta) / (2 * A);
                let x2 = k2 * a + x0;
                let y2 = k2 * b + y0;
                let z2 = k2 * c + z0;
                let p2 = [x2, y2, z2];
                result.push(p2);
            }
        }
        return result;
    }
    /**
     * resize.
     */
    resize() {
        this.resizeCanvas();
        let width = this.gl.canvas.width;
        let height = this.gl.canvas.height;
        let emptyPixels = new Uint8Array(width * height * 4);
        // screen textures to hold the drawn screen for the previous and the current frame
        if (!this.backgroundTexture) {
            this.backgroundTexture = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.backgroundTexture);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixels);

        if (!this.screenTexture) {
            this.screenTexture = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.screenTexture);
        }
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixels);
    }
    /**
     * Clear.
     */
    clear() {
        this.clearCanvas();
    }
}


/**
 * The class for Matrix4.
 */
class $3Clear_WebGL_Matrix4 {
    constructor() {
        this.m00 = 1;
        this.m01 = 0;
        this.m02 = 0;
        this.m03 = 0;

        this.m10 = 0;
        this.m11 = 1;
        this.m12 = 0;
        this.m13 = 0;

        this.m20 = 0;
        this.m21 = 0;
        this.m22 = 1;
        this.m23 = 0;

        this.m30 = 0;
        this.m31 = 0;
        this.m32 = 0;
        this.m33 = 1;
    }

    /**
     * Clone the matrix values
     * @return {object} matrix
     */
    cloneValue() {
        let instance = new $3Clear_WebGL_Matrix4();
        instance.m00 = this.m00;
        instance.m01 = this.m01;
        instance.m02 = this.m02;
        instance.m03 = this.m03;

        instance.m10 = this.m10;
        instance.m11 = this.m11;
        instance.m12 = this.m12;
        instance.m13 = this.m13;

        instance.m20 = this.m20;
        instance.m21 = this.m21;
        instance.m22 = this.m22;
        instance.m23 = this.m23;

        instance.m30 = this.m30;
        instance.m31 = this.m31;
        instance.m32 = this.m32;
        instance.m33 = this.m33;
        return instance;
        /*return{
          m00:this.m00, m01:this.m01, m02:this.m02, m03:this.m03,
          m10:this.m10, m11:this.m11, m12:this.m12, m13:this.m13,
          m20:this.m20, m21:this.m21, m22:this.m22, m23:this.m23,
          m30:this.m30, m31:this.m31, m32:this.m32, m33:this.m33
        }*/
    }
    /**
     * Convert the matrix to the array of WebGL formatter,order by column.
     * @return {array}
     */
    toArray() {
        return [this.m00, this.m10, this.m20, this.m30,
            this.m01, this.m11, this.m21, this.m31,
            this.m02, this.m12, this.m22, this.m32,
            this.m03, this.m13, this.m23, this.m33
        ];
    }
    /**
     * Rotate an angle around the X axis
     * @param {float} degree
     */
    rotX(degree) {
        let radian = degree * Math.PI / 180;
        let cosRadian = Math.cos(radian);
        let sinRadian = Math.sin(radian);
        let instance = this.cloneValue();

        /*[1 0   0    0
           0 cos -sin 0
           0 sin cos  0
           0 0   0    1]*/

        this.m01 = instance.m01 * cosRadian + instance.m02 * sinRadian;
        this.m11 = instance.m11 * cosRadian + instance.m12 * sinRadian;
        this.m21 = instance.m21 * cosRadian + instance.m22 * sinRadian;
        this.m31 = instance.m31 * cosRadian + instance.m32 * sinRadian;

        this.m02 = instance.m01 * -sinRadian + instance.m02 * cosRadian;
        this.m12 = instance.m11 * -sinRadian + instance.m12 * cosRadian;
        this.m22 = instance.m21 * -sinRadian + instance.m22 * cosRadian;
        this.m32 = instance.m31 * -sinRadian + instance.m32 * cosRadian;
    }
    /**
     * Rotate an angle around the Y axis
     * @param {float} degree
     */
    rotY(degree) {
        let radian = degree * Math.PI / 180;
        let cosRadian = Math.cos(radian);
        let sinRadian = Math.sin(radian);
        let instance = this.cloneValue();

        /*[cos  0 sin 0
           0    1 0   0
           -sin 0 cos 0
           0    0 0   1]*/

        this.m00 = instance.m00 * cosRadian + instance.m02 * -sinRadian;
        this.m10 = instance.m10 * cosRadian + instance.m12 * -sinRadian;
        this.m20 = instance.m20 * cosRadian + instance.m22 * -sinRadian;
        this.m30 = instance.m30 * cosRadian + instance.m32 * -sinRadian;

        this.m02 = instance.m00 * sinRadian + instance.m02 * cosRadian;
        this.m12 = instance.m10 * sinRadian + instance.m12 * cosRadian;
        this.m22 = instance.m20 * sinRadian + instance.m22 * cosRadian;
        this.m32 = instance.m30 * sinRadian + instance.m32 * cosRadian;
    }
    /**
     * Multiply the matrix for translation from the right.
     * @param x The X value of a translation.
     * @param y The Y value of a translation.
     * @param z The Z value of a translation.
     */
    translate(x, y, z) {
        this.m03 += this.m00 * x + this.m01 * y + this.m02 * z;
        this.m13 += this.m10 * x + this.m11 * y + this.m12 * z;
        this.m23 += this.m20 * x + this.m21 * y + this.m22 * z;
        this.m33 += this.m30 * x + this.m31 * y + this.m32 * z;
    }
    /**
     * Transpose the matrix.
     * @return this
     */
    transpose() {
        let instance = this.cloneValue();
        /*t = instance.m10;  instance.m10 = instance.m01;  instance.m01 = t;
        t = instance.m20;  instance.m20 = instance.m02;  instance.m02 = t;
        t = instance.m30;  instance.m30 = instance.m03;  instance.m03 = t;
        t = instance.m12;  instance.m12 = instance.m21;  instance.m21 = t;
        t = instance.m13;  instance.m13 = instance.m31;  instance.m31 = t;
        t = instance.m23;  instance.m23 = instance.m32;  instance.m32 = t;*/
        this.m10 = instance.m01;
        this.m01 = instance.m10;
        this.m20 = instance.m02;
        this.m02 = instance.m20;
        this.m30 = instance.m03;
        this.m03 = instance.m30;
        this.m12 = instance.m21;
        this.m21 = instance.m12;
        this.m13 = instance.m31;
        this.m31 = instance.m13;
        this.m23 = instance.m32;
        this.m32 = instance.m23;
    }
    /**
     * Multiply the matrix from the right.
     * @param other The multiply matrix
     * @return matrix4
     */
    multiply(rightMatrix) {
        let instance = this.cloneValue();
        let result = new $3Clear_WebGL_Matrix4();
        result.m00 = instance.m00 * rightMatrix.m00 + instance.m01 * rightMatrix.m10 + instance.m02 * rightMatrix.m20 + instance.m03 * rightMatrix.m30;
        result.m10 = instance.m10 * rightMatrix.m00 + instance.m11 * rightMatrix.m10 + instance.m12 * rightMatrix.m20 + instance.m13 * rightMatrix.m30;
        result.m20 = instance.m20 * rightMatrix.m00 + instance.m21 * rightMatrix.m10 + instance.m22 * rightMatrix.m20 + instance.m23 * rightMatrix.m30;
        result.m30 = instance.m30 * rightMatrix.m00 + instance.m31 * rightMatrix.m10 + instance.m32 * rightMatrix.m20 + instance.m33 * rightMatrix.m30;

        result.m01 = instance.m00 * rightMatrix.m01 + instance.m01 * rightMatrix.m11 + instance.m02 * rightMatrix.m21 + instance.m03 * rightMatrix.m31;
        result.m11 = instance.m10 * rightMatrix.m01 + instance.m11 * rightMatrix.m11 + instance.m12 * rightMatrix.m21 + instance.m13 * rightMatrix.m31;
        result.m21 = instance.m20 * rightMatrix.m01 + instance.m21 * rightMatrix.m11 + instance.m22 * rightMatrix.m21 + instance.m23 * rightMatrix.m31;
        result.m31 = instance.m30 * rightMatrix.m01 + instance.m31 * rightMatrix.m11 + instance.m32 * rightMatrix.m21 + instance.m33 * rightMatrix.m31;

        result.m02 = instance.m00 * rightMatrix.m02 + instance.m01 * rightMatrix.m12 + instance.m02 * rightMatrix.m22 + instance.m03 * rightMatrix.m32;
        result.m12 = instance.m10 * rightMatrix.m02 + instance.m11 * rightMatrix.m12 + instance.m12 * rightMatrix.m22 + instance.m13 * rightMatrix.m32;
        result.m22 = instance.m20 * rightMatrix.m02 + instance.m21 * rightMatrix.m12 + instance.m22 * rightMatrix.m22 + instance.m23 * rightMatrix.m32;
        result.m32 = instance.m30 * rightMatrix.m02 + instance.m31 * rightMatrix.m12 + instance.m32 * rightMatrix.m22 + instance.m33 * rightMatrix.m32;

        result.m03 = instance.m00 * rightMatrix.m03 + instance.m01 * rightMatrix.m13 + instance.m02 * rightMatrix.m23 + instance.m03 * rightMatrix.m33;
        result.m13 = instance.m10 * rightMatrix.m03 + instance.m11 * rightMatrix.m13 + instance.m12 * rightMatrix.m23 + instance.m13 * rightMatrix.m33;
        result.m23 = instance.m20 * rightMatrix.m03 + instance.m21 * rightMatrix.m13 + instance.m22 * rightMatrix.m23 + instance.m23 * rightMatrix.m33;
        result.m33 = instance.m30 * rightMatrix.m03 + instance.m31 * rightMatrix.m13 + instance.m32 * rightMatrix.m23 + instance.m33 * rightMatrix.m33;
        return result;
    }
    /**
     * Multiply the four-dimensional vector.
     * @param pos  The multiply vector
     * @return The result of multiplication
     */
    multiplyColumn(c) {
        let m00 = this.m00 * c[0] + this.m01 * c[1] + this.m02 * c[2] + this.m03 * c[3];
        let m10 = this.m10 * c[0] + this.m11 * c[1] + this.m12 * c[2] + this.m13 * c[3];
        let m20 = this.m20 * c[0] + this.m21 * c[1] + this.m22 * c[2] + this.m23 * c[3];
        let m30 = this.m30 * c[0] + this.m31 * c[1] + this.m32 * c[2] + this.m33 * c[3];
        return [m00, m10, m20, m30];
    }
    /**
     * Calculate the inverse matrix of this.
     * @return this
     */
    getInverse() {
        let instance = this.cloneValue();
        let result = new $3Clear_WebGL_Matrix4();
        let A = instance.m00 * instance.m11 - instance.m10 * instance.m01;
        let B = instance.m00 * instance.m21 - instance.m20 * instance.m01;
        let C = instance.m00 * instance.m31 - instance.m30 * instance.m01;
        let D = instance.m10 * instance.m21 - instance.m20 * instance.m11;
        let E = instance.m10 * instance.m31 - instance.m30 * instance.m11;
        let F = instance.m20 * instance.m31 - instance.m30 * instance.m21;
        let G = instance.m02 * instance.m13 - instance.m12 * instance.m03;
        let H = instance.m02 * instance.m23 - instance.m22 * instance.m03;
        let I = instance.m02 * instance.m33 - instance.m32 * instance.m03;
        let J = instance.m12 * instance.m23 - instance.m22 * instance.m13;
        let K = instance.m12 * instance.m33 - instance.m32 * instance.m13;
        let L = instance.m22 * instance.m33 - instance.m32 * instance.m23;
        let Q = A * L - B * K + C * J + D * I - E * H + F * G;
        if (!Q) {
            console.log("Can't get inverse matrix");
            return result;
        }
        Q = 1 / Q;
        result.m00 = (instance.m11 * L - instance.m21 * K + instance.m31 * J) * Q;
        result.m10 = (-instance.m10 * L + instance.m20 * K - instance.m30 * J) * Q;
        result.m20 = (instance.m13 * F - instance.m23 * E + instance.m33 * D) * Q;
        result.m30 = (-instance.m12 * F + instance.m22 * E - instance.m32 * D) * Q;

        result.m01 = (-instance.m01 * L + instance.m21 * I - instance.m31 * H) * Q;
        result.m11 = (instance.m00 * L - instance.m20 * I + instance.m30 * H) * Q;
        result.m21 = (-instance.m03 * F + instance.m23 * C - instance.m33 * B) * Q;
        result.m31 = (instance.m02 * F - instance.m22 * C + instance.m32 * B) * Q;

        result.m02 = (instance.m01 * K - instance.m11 * I + instance.m31 * G) * Q;
        result.m12 = (-instance.m00 * K + instance.m10 * I - instance.m30 * G) * Q;
        result.m22 = (instance.m03 * E - instance.m13 * C + instance.m33 * A) * Q;
        result.m32 = (-instance.m02 * E + instance.m12 * C - instance.m32 * A) * Q;

        result.m03 = (-instance.m01 * J + instance.m11 * H - instance.m21 * G) * Q;
        result.m13 = (instance.m00 * J - instance.m10 * H + instance.m20 * G) * Q;
        result.m23 = (-instance.m03 * D + instance.m13 * B - instance.m23 * A) * Q;
        result.m33 = (instance.m02 * D - instance.m12 * B + instance.m22 * A) * Q;
        return result;
    }
    /**
     * create the perspective projection matrix by fovy and aspect.
     * @param fovy The angle between the upper and lower sides of the frustum.
     * @param aspect The aspect ratio of the frustum. (width/height)
     * @param near The distances to the nearer depth clipping plane.
     * @param far The distances to the farther depth clipping plane.
     * @return matrix
     */
    static createPerspectiveMatrix(fov, aspect, near, far) {
        let fovRadian = fov * Math.PI / 360;
        let dis = far - near;
        let e = Math.cos(fovRadian) / Math.sin(fovRadian);
        let matrix4 = new $3Clear_WebGL_Matrix4();
        matrix4.m00 = e / aspect;
        matrix4.m11 = e;
        matrix4.m22 = -(far + near) / dis;
        matrix4.m32 = -1;
        matrix4.m23 = -2 * near * far / dis;
        matrix4.m33 = 0;
        return matrix4;
    }
    /**
     * Set the viewing matrix.
     * @param eyeX, eyeY, eyeZ The position of the eye point.
     * @param centerX, centerY, centerZ The position of the reference point.
     * @param upX, upY, upZ The direction of the up vector.
     * @return matrix
     */
    static setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
        let e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

        fx = centerX - eyeX;
        fy = centerY - eyeY;
        fz = centerZ - eyeZ;

        // Normalize f.
        rlf = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx *= rlf;
        fy *= rlf;
        fz *= rlf;

        // Calculate cross product of f and up.
        sx = fy * upZ - fz * upY;
        sy = fz * upX - fx * upZ;
        sz = fx * upY - fy * upX;

        // Normalize s.
        rls = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
        sx *= rls;
        sy *= rls;
        sz *= rls;

        // Calculate cross product of s and f.
        ux = sy * fz - sz * fy;
        uy = sz * fx - sx * fz;
        uz = sx * fy - sy * fx;

        // Set to this.
        let matrix4 = new $3Clear_WebGL_Matrix4();
        matrix4.m00 = sx;
        matrix4.m10 = ux;
        matrix4.m20 = -fx;
        matrix4.m30 = 0;

        matrix4.m01 = sy;
        matrix4.m11 = uy;
        matrix4.m21 = -fy;
        matrix4.m31 = 0;

        matrix4.m02 = sz;
        matrix4.m12 = uz;
        matrix4.m22 = -fz;
        matrix4.m32 = 0;

        matrix4.m03 = 0;
        matrix4.m13 = 0;
        matrix4.m23 = 0;
        matrix4.m33 = 1;

        // Translate.
        matrix4.translate(-eyeX, -eyeY, -eyeZ);
        return matrix4;
    }
}
export {
    $3Clear_WebGL_Polygon,
    $3Clear_WebGL_Wind,
    $3Clear_WebGL_Image
};
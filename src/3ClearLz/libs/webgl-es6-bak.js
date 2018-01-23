/**
 * Copyright 2017-2018 3Clear Science and Technology Co.,Ltd.
 *
 * Creator:LIU liang
 * Date:Oct.18th,2017
 *
 */

/**
 * Base class for WebGL.
 */
class $3Clear_WebGL {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = this.canvas.getContext('webgl', {antialiasing: false}) || this.canvas.getContext('experimental-webgl', {antialiasing: false});
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

        let wrapper = {program: program};
        let i = 0, j = 0;
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
     * @returns {WebGL Buffer} buffer
     */
    createBuffer(data) {
        let buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
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
     */
    resizeCanvas() {
        let resized = false;
        /*let box=this.gl.canvas.getBoundingClientRect();
        if (this.gl.canvas.width != box.width) {
            this.gl.canvas.width = box.width;
            resized = true;
        }
        if (this.gl.canvas.height != box.height) {
            this.gl.canvas.height = box.height;
            resized = true;
        }*/
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
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
}

/**
 * The class extends from $3Clear_WebGL which draw polygon by WebGL.
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

        this.resolutionW = (this.polygonParam.extent[2] - this.polygonParam.extent[0]) / this.polygonParam.width;
        this.resolutionH = (this.polygonParam.extent[3] - this.polygonParam.extent[1]) / this.polygonParam.height;
        this.pixelRatio = 1;//window.devicePixelRatio || 1;

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
        uniform sampler2D u_imgTexture1;\n\
        uniform sampler2D u_imgTexture2;\n\
        uniform sampler2D u_colorTexture;\n\
        uniform int u_applyMask;\n\
        uniform sampler2D u_maskTexture;\n\
        uniform float u_t;\n\
        uniform int u_model;\n\
        uniform float u_alpha;\n\
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
        void main() {\n\
            if(u_applyMask==1){\n\
                vec4 maskValue=texture2D(u_maskTexture, v_texCoord).rgba;\n\
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
            float v=v1*(1.0-u_t)+v2*u_t;\n\
            if(v==0.0){\n\
                discard;\n\
            }\n\
            vec4 fragcolor=texture2D(u_colorTexture, vec2(v, 0.0));\n\
            gl_FragColor = fragcolor*fragcolor.a*u_alpha;\n\
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
            1, 1]);
        let buffer = this.createBuffer(texCoordArray);
        this.bindAttribute(buffer, this.program['a_texCoord'], 2);
    }

    /**
     * Set the color texture
     * @param {array} colors,the element in color which represent the RGBA color model.
     */
    setColor(colors) {
        this.texture_colortable = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        let colortable = new Uint8Array(colors);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, colortable.length / 4, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, colortable);
    }

    /**
     * Set the mask texture
     * @param {HTMLImageElement} img.
     */
    setMask(img) {
        this.texture_mask = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
    }

    /**
     * Set the image texture,one image contains 2 datas in different time.
     * @param {HTMLImageElement} img1
     * @param {HTMLImageElement} img2
     */
    initImgs(img1, img2) {
        try {
            this.texture_img1 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img1);

            this.texture_img2 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img2);
        } catch (ex) {
            this.texture_img1 = null;
            this.texture_img2 = null;
        }

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
                imageExtent[2], imageExtent[3]]);
            let buffer = this.createBuffer(vertexArray);
            this.bindAttribute(buffer, this.program['a_position'], 2);

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
            this.windParam.width = 360;  // set the default width
        }
        if (!this.windParam.height) {
            this.windParam.height = 180; // set the default height
        }
        if (!this.windParam.extent) {
            this.windParam.extent = [-180, -90, 180, 90];  // set the default extent
        }
        if (!this.windParam.uMin) {
            this.windParam.uMin = -21.32;
        }
        if (!this.windParam.uMax) {
            this.windParam.uMax = 26.8;
        }
        if (!this.windParam.vMin) {
            this.windParam.vMin = -21.57;
        }
        if (!this.windParam.vMax) {
            this.windParam.vMax = 21.42;
        }
        this.resolutionW = (this.windParam.extent[2] - this.windParam.extent[0]) / this.windParam.width;
        this.resolutionH = (this.windParam.extent[3] - this.windParam.extent[1]) / this.windParam.height;
        this.pixelRatio = 1;//window.devicePixelRatio || 1;

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
            vec4 maskValue=texture2D(u_maskTexture, particle_pos).rgba;\n\
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
    varying vec2 v_imgtTexCoord;\n\
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
            0, 0, 0, 255];
        this.fadeOpacity = 0.96; // how fast the particle trails fade on each frame
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
            1, 1]));
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
        let i = 0, j = 0;
        let particleRes = this.particleStateResolution = Math.ceil(Math.sqrt(numParticles));
        this._numParticles = particleRes * particleRes;

        let particleState = new Uint8Array(this._numParticles * 4);
        for (; i < particleState.length; i++) {
            particleState[i] = Math.floor(Math.random() * 256); // randomize the initial particle positions
        }
        // textures to hold the particle state for the current and the next frame
        this.particleStateTexture0 = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, particleRes, particleRes, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, particleState);

        this.particleStateTexture1 = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, particleRes, particleRes, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, particleState);

        let particleIndices = new Float32Array(this._numParticles);
        for (; j < this._numParticles; j++) {
            particleIndices[j] = j;
        }
        this.particleIndexBuffer = this.createBuffer(particleIndices);
    }

    setWind(image, model, extent) {

        this.windImage = image;
        this.windModel = model;
        if (this.windImage) {
            this.resetWindTexture(extent);
        }
    }

    resetWindTexture(currentExent) {
        this.clipImage(currentExent);
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
                //note only in 3d view
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

        this.windTexture = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, clipCanvas);

        if (maskCanvas) {
            this.texture_mask = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
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
        this.backgroundTexture = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.canvas.width, this.gl.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, emptyPixels);

        this.screenTexture = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
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
        this.pixelRatio = 1;//window.devicePixelRatio || 1;

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
                vec4 maskValue=texture2D(u_maskTexture, v_texCoord).rgba;\n\
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
            float v=v1*(1.0-u_t)+v2*u_t;\n\
            if(v==0.0){\n\
                discard;\n\
            }\n\
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
            1, 1]);
        let buffer = this.createBuffer(texCoordArray);
        this.bindAttribute(buffer, this.program['a_texCoord'], 2);
    }

    /**
     * Set the color texture
     * @param {array} colors,the element in color which represent the RGBA color model.
     */
    setColor(colors) {
        this.texture_colortable = this.createAndSetupTexture(this.gl.NEAREST, this.gl.NEAREST);
        let colortable = new Uint8Array(colors);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, colortable.length / 4, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, colortable);
    }

    /**
     * Set the mask texture
     * @param {HTMLImageElement} img.
     */
    setMask(img) {
        this.texture_mask = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
    }

    /**
     * Set the image texture,one image contains 2 datas in different time.
     * @param {HTMLImageElement} img1
     * @param {HTMLImageElement} img2
     */
    initImgs(img1, img2) {
        this.texture_img1 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img1);

        this.texture_img2 = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
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
                imageExtent[2], imageExtent[3]]);
            let buffer = this.createBuffer(vertexArray);
            this.bindAttribute(buffer, this.program['a_position'], 2);

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
            let scaleOffset = [200, -0.16500000655651093];
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
        this.pixelRatio = 1;// window.devicePixelRatio || 1;

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
        let buffer = this.createBuffer(texCoordArray);
        this.bindAttribute(buffer, this.program['a_texCoord'], 2);
    }

    /**
     * Set the image texture,one image contains 2 datas in different time.
     * @param {HTMLImageElement} img
     */
    initImg(img) {
        this.texture_img = this.createAndSetupTexture(this.gl.LINEAR, this.gl.LINEAR);
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
                imageExtent[0], imageExtent[3], imageExtent[2], imageExtent[1], imageExtent[2], imageExtent[3]]);
            let buffer = this.createBuffer(vertexArray);
            this.bindAttribute(buffer, this.program['a_position'], 2);

            this.bindTexture(this.texture_img, 0);
            this.gl.uniform1i(this.program['u_imgTexture'], 0);
            this.gl.uniform1f(this.program['u_alpha'], this.alpha);

            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    }

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

export {
    $3Clear_WebGL_Polygon,
    $3Clear_WebGL_Wind,
    $3Clear_WebGL_Image
};

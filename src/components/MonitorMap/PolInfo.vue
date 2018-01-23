<template>
    <div class="pollutantInfo">
        <div class="polValue" :style="{color:info.color}">{{valueToFixed(info.value)}}</div>
        <div class="polChart">
            <canvas ref="cvs"></canvas>
        </div>
        <div class="polName"><span v-html="info.label"></span></div>
    </div>
</template>

<script>
    export default {
        props: {
            info: {
                type: Object,
                required: true
            }
        },

        data() {
            return {
                polDenExt: {
                    pm25: [0, 500],
                    "pm2.5": [0, 500],
                    pm10: [0, 600],
                    so2: [0, 800],
                    no2: [0, 3840],
                    co: [0, 150],
                    o3: [0, 1200]
                }
            };

        },

        mounted() {
            this.$nextTick(() => {
                this.createDensityGauge();
            })
        },

        watch: {
            info() {
                this.createDensityGauge();
            }
        },

        methods: {
            createDensityGauge() {
                let maxValue = 500;
                let minValue = 0;
                if (this.info && this.info.name) {
                    minValue = this.polDenExt[this.info.name.toLowerCase()][0];
                    maxValue = this.polDenExt[this.info.name.toLowerCase()][1];
                }

                let opts = {
                    borderColor: "green",
                    borderWidth: 2,
                    fillColor: this.info.color,
                    maxValue: maxValue,
                    minValue: minValue,
                    width: 30
                };
                let padding = 10;
                let _this = this;

                createGauge();

                function createGauge() {
                    let canvas = _this.$refs.cvs,
                        ctx = canvas.getContext("2d"),
                        currentTempText = _this.info.value || 0,
                        currentTemp = parseFloat(currentTempText) || 0;

                    canvas.width = opts.width;
                    canvas.height = opts.width * 2;

                    let length = opts.maxValue - opts.minValue;
                    let percentage = calculatePercentage(currentTemp, opts.minValue, length);

                    fillTempGauge(ctx, 0, 0, opts.width, opts.width * 2, percentage);
                    strokeTempGauge(ctx, 0, 0, opts.width, opts.width * 2, opts.borderWidth);
                }

                function calculatePercentage(temp, mintemp, length) {
                    let percentage = (temp - mintemp) / length;
                    percentage = percentage > 1 ? 1 : percentage;
                    percentage = percentage < 0 ? 0 : percentage;
                    return percentage;

                }

                function strokeTempGauge(ctx, x, y, width, height, borderWidth) {

                    y += padding / 2;
                    height -= padding;

                    let wholeCircle = Math.PI * 2;
                    let smallRadius = width / 3 / 2;
                    let xSmall = x + width / 2;
                    let ySmall = y + smallRadius;

                    let bigRadius = height / 6;
                    let xBig = x + width / 2;
                    let yBig = y + height / 6 * 5;

                    let offSet = Math.sqrt((Math.pow(bigRadius, 2) - Math.pow(smallRadius / 2, 2)), 2);

                    ctx.beginPath();
                    ctx.lineWidth = borderWidth;
                    ctx.strokeStyle = opts.borderColor;
                    ctx.arc(xSmall, ySmall, smallRadius, wholeCircle / -2, 0, false);
                    ctx.moveTo(xSmall - smallRadius, ySmall);
                    ctx.lineTo(xSmall - smallRadius, yBig - offSet + borderWidth);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(xSmall + smallRadius, ySmall);
                    ctx.lineTo(xSmall + smallRadius, yBig - offSet + borderWidth);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(xBig, yBig, bigRadius, wholeCircle / -6, wholeCircle * -2 / 6, false);
                    ctx.stroke();
                }

                function fillTempGauge(ctx, x, y, width, height, percent) {

                    let wholeCircle = Math.PI * 2;

                    y += padding / 2;
                    height -= padding;

                    let bigRadius = height / 6 - opts.borderWidth;
                    let xBig = x + width / 2;
                    let yBig = y + height / 6 * 5;

                    let smallRadius = width / 3 / 2 - opts.borderWidth;
                    let xSmall = x + width / 2;
                    let ySmall = y + smallRadius + opts.borderWidth;

                    let offSet = Math.sqrt((Math.pow(bigRadius, 2) - Math.pow(smallRadius / 2, 2)), 2);

                    let twoThirdsLength = height / 6 * 5 - offSet - width / 3 / 2;

                    let gauge = twoThirdsLength * percent;

                    let yBox = yBig - offSet - gauge;
                    let xBox = xBig - width / 6 + opts.borderWidth;

                    ctx.fillStyle = opts.fillColor;

                    if (percent == 1) {
                        ctx.arc(xSmall, ySmall, smallRadius, wholeCircle / -2, 0, false);
                        ctx.closePath();
                        ctx.fill();
                    }

                    ctx.fillRect(xBox, yBox - 1, width / 3 - opts.borderWidth * 2, gauge + padding);

                    ctx.beginPath();
                    ctx.arc(xBig, yBig, bigRadius, wholeCircle / -6, wholeCircle * -2 / 6, false);
                    ctx.closePath();
                    ctx.fill();
                }
            },

            valueToFixed(value) {
                if(value===''||value===null)
                    return '';
                if (this.info.name.toLowerCase() === 'co') {
                    return value.toFixed(1);
                }
                else
                    return value;
            }

        }
    }
</script>

<style scoped lang="css">
    .pollutantInfo > div {
        text-align: center;
        font-size: 14px;
    }

    .pollutantInfo .polValue {
        margin-bottom: 8px;
        color: #49d9fe;

        /*text-shadow: rgba(4, 231, 225, 0.46) 1px 0 0, rgba(4, 231, 225, 0.46) 0 1px 0, rgba(4, 231, 225, 0.46) -1px 0 0, rgba(4, 231, 225, 0.46) 0 -1px 0;*/
        /*-webkit-text-shadow: rgba(4, 231, 225, 0.46) 1px 0 0, rgba(4, 231, 225, 0.46) 0 1px 0, rgba(4, 231, 225, 0.46) -1px 0 0, rgba(4, 231, 225, 0.46) 0 -1px 0;*/
        /*-moz-text-shadow: rgba(4, 231, 225, 0.46) 1px 0 0, rgba(4, 231, 225, 0.46) 0 1px 0, rgba(4, 231, 225, 0.46) -1px 0 0, rgba(4, 231, 225, 0.46) 0 -1px 0;*/

    }

    .pollutantInfo .polName {
        margin-top: 8px;
        font-size: 14px !important;
    }

    .pollutantInfo .polChart {
    }
</style>


<template>
    <div class="weatherPane-wrapper">
        <div :class="[tem,isHt?hTem:maxTmp]">{{toFixedNum(info.tem_2m_24h_max,1)}}℃</div>
        <div :class="[tem,isLw?hTem:minTmp]">{{toFixedNum(info.tem_2m_24h_min,1)}}℃</div>
        <div class="rh"><span class="fa fa-cloud wicon" :class="[isHum?show:hide]"
        ></span><span class="weaValue">{{toFixedNum(info.hum_2m_24h,0)}}%</span></div>
        <div class="wind">
            <span class="fa fa-location-arrow wicon"
                  :class="[info.winddirect_10m_24h!==''?show:hide]"
                  :style="styleObject"
            ></span>
            <span class="weaValue">{{toFixedNum(info.windspeed_10m_24h,1)}}m/s</span>
        </div>
        <div class="rain"><span class="icon-3clear-rain-b wicon" :class="[isRain?show:hide]"
        ></span><span class="weaValue">{{info.rain_24h_total}}mm</span></div>
        <div><span class="hide wicon"
        ></span><span class="weaValue">{{info.pbl_24h}}m</span></div>
        <div class="temIconDiv">
            <span class="temIcon fa fa-thermometer-full fa-2x"></span>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            info: {
                type: Object
            }
        },


        data() {
            return {
                tem: 'tem',
                hTem: 'htem',
                lTem: 'ltem',
                maxTmp: 'maxTmp',
                minTmp: 'minTmp',
                show: 'show',
                hide: 'hide',
                styleObject: {
                    marginRight: '3px',
                    color: '#0ecaf8',
                    transform: 'rotate(0deg)'
                }

            };
        },

        mounted() {
            if (Number(this.toFixedNum(this.info.windspeed_10m_24h, 1)) >= 8) {
                this.styleObject.color = 'green';
            } else if (Number(this.toFixedNum(this.info.windspeed_10m_24h, 1)) <= 2) {
                this.styleObject.color = 'red';
            }
            this.styleObject.transform = 'rotate(' + (Number(this.info.winddirect_10m_24h) - 45+180 ) + 'deg)';
        },

        methods: {
            toFixedNum(value, len) {
                if (value === '')
                    return '';
                else
                    return Number(value).toFixed(len);
            }
        },

        computed: {
            isHt: function () {
                return Number(this.toFixedNum(this.info.tem_2m_24h_max, 1)) >= 38;
            },
            isLw: function () {
                return Number(this.toFixedNum(this.info.tem_2m_24h_max, 1)) <= 0;
            },
            isHum: function () {
                return Number(this.info.hum_2m_24h) >= 70;
            },

            isRain: function () {
                return Number(this.info.rain_24h_total) > 0;
            }
        }

    }
</script>

<style scoped>
    .weatherPane-wrapper {
        color:#fff;
        width: 100%;
        background-color: rgba(20, 79, 122, 0.37);
        /*border: 1px solid rgba(20, 79, 122, 0.37);*/
        position: relative;
    }

    .weatherPane-wrapper > div {
        height: 31px;
        line-height: 31px;
        text-align: center;
        /*padding-top: 4px;*/
        /*padding-bottom: 4px;*/

    }

    .tem {
        font-size: 14px;
        width: 100%;
    }

    .maxTmp {
        /*border-top:1px solid rgba(255,154,0,0.2);*/
        /*border-left:1px solid rgba(255,154,0,0.2);*/
        /*border-right:1px solid rgba(255,154,0,0.2);*/
        background-color: rgba(255, 154, 0, 0.2);
        color: #ff9a00;
    }

    .htem {
        background-color: rgba(255, 154, 0, 0.6);
        color: #ff9a00;
    }

    .ltem {
        background-color: rgba(0, 92, 255, 0.6);
        color: #0ecaf8;
    }

    .minTmp {
        /*border-bottom:1px solid rgba(0,92,255,0.53);*/
        /*border-left:1px solid rgba(0,92,255,0.53);*/
        /*border-right:1px solid rgba(0,92,255,0.53);*/
        background-color: rgba(0, 92, 255, 0.2);
        color: #0ecaf8;
    }

    .show {
        display: inline-block;
    }

    .hide {
        display: none;
    }

    .rh {
        margin-top: 16px;
    }

    .temIconDiv {
        position: absolute;
        left: 10px;
        top: 15px;
    }

    .temIcon {

        color: #ff9a00;

    }

    span.wicon {
        margin-right: 10px !important;
    }

    .weaValue{
        width: 60px;
    }

</style>


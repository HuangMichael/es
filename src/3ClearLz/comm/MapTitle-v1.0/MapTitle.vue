<template>
    <div class="mapTitle">


        <div class="mapTitle-log">
            <img src="./assets/images/logo.png" alt="">
        </div>

        <div class="mapTitle-body">

            <div class="body-top">
                <span class="cityName">{{cityName}}</span>
                <span class="title">{{title}}</span>
            </div>

            <div class="body-bottom">

                <span class="date">{{date}}</span>

            </div>
        </div>

        <div class="triangle">

        </div>

    </div>
</template>

<script>
    export default {
        components: {},

        props: {
            cityName: {
                type: String,
                default: ''
            },
            title: {
                type: String,
                default: ''
            },
            date: {
                type: String,
                default: ''
            }
        },

        data() {
            return {}
        },

        mounted() {

        },

        methods: {}
    }
</script>

<style scoped>
    @import url(./assets/style/style.css);

    .mapTitle {
        font-size: 0;
        color: #fff;
    }

    .mapTitle-log {
        position: relative;
    }

    .mapTitle > div {
        display: inline-block;
    }

    .mapTitle-body {
        height: 59px;
        margin-left: -20px;
        background-image: url("./assets/images/map-title-bg.png");
    }

    .mapTitle-body, .triangle {
        margin-top: 6px;
        vertical-align: top;
    }

    .body-top {
        font-size: 0;
        text-align: center;
        margin-left: 53px;
    }

    .body-top > span.cityName {
        height: 37px;
        font-size: 18px;
        font-weight: bold;
        line-height: 38px;
        margin-right: 12px;
    }

    .body-top > span.title {
        font-size: 16px;
    }

    .triangle {
        height: 59px;
        width: 86px;
        background-image: url("./assets/images/triangle.png");
    }

    .body-bottom {

        text-align: right;
        height: 22px;
        line-height: 22px;
    }

    .body-bottom > span.date {
        font-size: 14px;
        padding-left: 50px;

    }


</style>


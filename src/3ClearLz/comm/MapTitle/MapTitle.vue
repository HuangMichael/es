<template>
    <div class="mapTitle">


        <div class="mapTitle-log">
            {{cityName}}
        </div>

        <div class="mapTitle-body">

            <div class="body-top">
                <span class="title">{{title}}</span>
            </div>

            <div class="body-bottom">
                <span class="date">{{date}}</span>

            </div>
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
        background-color: rgba(0, 0, 0, 0.5);
        position: relative;
        font-size: 18px;
        font-weight: bold;
        height: 48px;
        line-height: 48px;
        padding: 0 15px 0 15px;
        /*width: 48px;*/
        text-align: center;
        box-shadow: 0 0 2px #14d7e1;
        vertical-align: top;
    }

    .mapTitle > div {
        display: inline-block;
    }

    .mapTitle-body {
        line-height: 48px;
        height: 48px;
        /*background-image: url("./assets/images/map-title-bg.png");*/
    }

    .body-top {
        font-size: 0;
        text-align: center;
        height: 29px;
        line-height: 29px;
        padding: 0 50px 0 50px;
        background: rgb(22, 59, 109);
    }

    .body-top > span.title {
        font-size: 14px;
        text-shadow: #000 1px 0 0, #000 0 1px 0, #000 -1px 0 0, #000 0 -1px 0;
    }

    .body-bottom {

        text-align: right;
        height: 19px;
        line-height: 19px;
        background:  linear-gradient(to right, #02a2de 50%, #0255de 100%);
    }

    .body-bottom > span.date {
        font-size: 12px;
        font-weight: bold;
        padding-left: 80px;
        padding-right: 5px;

    }


</style>


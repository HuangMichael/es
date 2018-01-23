<template>
    <div class="weatherPaneTitle-wrapper">
        <div class="rh"><span class="icon"></span>相对湿度</div>
        <div class="wind"><span class="icon"></span>风速风向</div>
        <div class="rain"><span class="icon"></span>累计降水</div>
        <div class="pre"><span class="icon"></span>边界层高度</div>
    </div>
</template>

<script>
    export default {
        props: {},

        data() {
            return {};
        }
    }
</script>

<style scoped>
    .weatherPaneTitle-wrapper {
        width: 100%;
    }

    .weatherPaneTitle-wrapper > div {
        margin-left: 0;
        height: 31px;
        line-height: 31px;
        text-align: left;

        /*padding-top: 4px;*/
        /*padding-bottom: 4px;*/
    }

    .rh {
        padding-top: 78px !important;
    }

    span.icon {
        height: 26px;
        width: 30px;
        margin-right: 6px;
        display: inline-block;
        vertical-align: middle;
    }

    .rh > span.icon {
        background-image: url("./assets/images/hum.png");
    }

    .wind > span.icon {
        background-image: url("./assets/images/wind.png");
    }

    .rain > span.icon {
        background-image: url("./assets/images/rain.png");
    }

    .pre > span.icon {
        background-image: url("./assets/images/pbl.png");
    }


</style>


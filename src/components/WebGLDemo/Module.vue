<template>
    <div class="body-wrap">
        <!--内容区域-->
        <div class="content" :style="{'right':rightPanelWidth+'px'}">

            <el-row style="height: 50%">
                <el-col :span="12" style="height: 100%">
                    <div class="map" id="disTopLeftMap"></div>
                    <canvas id="disTopLeftMapDisMapCanvas"></canvas>
                    <canvas id="disTopLeftMapWindCanvas"></canvas>
                </el-col>

                <el-col :span="12" style="height: 100%">
                    <div class="map" id="disTopRightMap"></div>
                    <canvas id="disTopRightMapDisMapCanvas"></canvas>
                    <canvas id="disTopRightMapWindCanvas"></canvas>
                </el-col>

            </el-row>

            <el-row style="height: 50%;border-top: 1px solid #112b4d;">
                <el-col :span="12" style="height: 100%">
                    <div class="map" id="disBottomLeftMap"></div>
                    <canvas id="disBottomLeftMapDisMapCanvas"></canvas>
                    <canvas id="disBottomLeftMapWindCanvas"></canvas>
                </el-col>

                <el-col :span="12" style="height: 100%">
                    <div class="map" id="disBottomRightMap"></div>
                    <canvas id="disBottomRightMapDisMapCanvas"></canvas>
                    <canvas id="disBottomRightMapWindCanvas"></canvas>
                </el-col>
            </el-row>

            <div class="timeControlDiv">
                <div id="disMapMultiViewControl">

                </div>
            </div>
        </div>
        <!--条件区域-->
        <div class="rightMiniPanel">

            <!--模块条件区域-->
            <div class="condition-wrap">

                <div class="tabDidv">
                    test
                </div>

                <div class="conditionDiv">
                    <div class="panel modelPanel">
                        <panel-select :infos="infos" v-model="domain"
                                      @change="_getCurrData"></panel-select>
                    </div>
                    <div class="regionPanel"></div>
                    <div class="polPanel"></div>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
    import moduleJs from './Module.js';

    export default moduleJs;
</script>

<style scoped>
    @import url(./assets/style/style.css);

    .body-wrap {
        width: 100%;
        height: 100%;
        font-size: 14px;
    }

    .content {
        position: absolute;
        margin: 0;
        left: 0;
        top: 0;
        bottom: 0;
    }

    .map {
        height: 100%;
        width: 100%;
    }

    .timeControlDiv {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
    }

    #disMapMultiViewControl {
        width: 100%;
    }

    #disTopLeftMap {
    }

    #disBottomLeftMap {
    }

    #disTopRightMap {
        border-left: 1px solid #112b4d;
    }

    #disBottomRightMap {
        border-left: 1px solid #112b4d;
    }

    .rightMiniPanel {
        width: 190px;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        border-left: 3px solid #0262dc;
        background-color: #112b4d;
    }

    .condition-wrap {
        width: 100%;
        margin: 9px 12px 0 0;
    }

    .tabDidv {
        background-color: #04cec5;
        width: 32px;
        vertical-align: top;
    }

    .tabDidv, .conditionDiv {
        display: inline-block;
    }

    .panel {
        width: 140px;
    }

    canvas {
        position: relative;
        top: 0;
        left: 0;
        pointer-events: none;

    }

    #disTopLeftMapDisMapCanvas, #disTopRightMapDisMapCanvas, #disBottomLeftMapDisMapCanvas, #disBottomRightMapDisMapCanvas {

        z-index: 260;
    }

    #disTopLeftMapWindCanvas, #disTopRightMapWindCanvas, #disBottomLeftMapWindCanvas, #disBottomRightMapWindCanvas {
        display: block;
        z-index: 280;
        position: absolute;
    }


</style>


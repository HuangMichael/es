<template>
    <div class="body-wrap monitorDisMapWrap">
        <!--内容区域-->
        <div class="content" :style="{'right':rightPanelWidth+'px'}">
            <el-row class="map-row">
                <el-col :span="24" style="height: 100%;width:100%">
                    <div id="monitorDisMapDiv"></div>
                    <div id="monitorTimeControl">
                    </div>

                    <div class="switchDiv">
                        <div class="switchPoint" v-if="polObj.options">
                            <switch-bar :infos="polObj" v-model="polObj.value"
                                        @change="polChange" @statusChange="polStatusChange"></switch-bar>
                        </div>


                        <div :on=true class="switchDisMap" v-if="disMapObj.options">
                            <switch-bar :infos="disMapObj" v-model="disMapObj.value"
                                        @change="weaChange" @statusChange="disStatusChange"></switch-bar>
                        </div>

                        <div class="switchWind" v-if="windObj.options">
                            <switch-bar :infos="windObj" v-model="windObj.value"
                                        @statusChange="windStatusChange"></switch-bar>
                        </div>

                    </div>

                    <div class="titleWrap">
                        <map-title cityName="全国" :title="mapTitle" :date="mapDate"></map-title>
                    </div>

                    <div class="locate">
                        <locate-btn :locations="location" v-model="locate" @change="onLocation"></locate-btn>
                    </div>

                    <div class="legend" v-show="legendOption.length>0">
                        <legend3clear v-for="legend in legendOption" :items="legend"></legend3clear>
                    </div>

                </el-col>
            </el-row>
        </div>
        <!--条件区域-->
        <right-panel :rightPanelWidth="rightPanelWidth" :toggleStatus="toggleStatus" @togglePanel="onTogglePanel">
            <!--习惯配置-->
            <!--<setting-dialog :configJson="config"></setting-dialog>-->

            <div class="condition-wrap">
                <div class="currDescInfo">
                    <span class="descCity">{{currCityName}}</span>
                    <span class="descInfo">空气质量实时数据 {{currMonitorDate}}</span>
                </div>
                <div class="currAQIInfo" :class="currCityInfoObj.levelNum">
                    <div class="aqiValue" :style="{color:currCityInfoObj.color}">{{currCityInfoObj.aqi}}</div>
                    <div class="pol" v-html="currCityInfoObj.pol"></div>
                    <div class="level" :style="{color:currCityInfoObj.color}">{{currCityInfoObj.level}}</div>
                </div>
                <div class="polInfo">
                    <el-row type="flex" justify="space-around" v-if="currCityInfoObj.pols">
                        <el-col :span="4"
                                v-for="item in currCityInfoObj.pols">
                            <pol-info :info="item"></pol-info>
                        </el-col>
                    </el-row>
                </div>
                <div class="cityRankInfo">
                    <div class="orderBtn">
                        <el-radio-group v-model="orderType" @change="setAllCityInfo">
                            <el-radio-button label="0">最优排名</el-radio-button>
                            <el-radio-button label="1">最差排名</el-radio-button>
                        </el-radio-group>
                    </div>


                    <el-table class="monitorMapCityTable" :data="currCityData" @row-click="onRowClick"
                              style="width: 100%" align='center'>

                        <el-table-column v-for='item in fields'
                                         :prop="item.prop"
                                         :label="item.label"
                                         :align="item.align"
                                         :sort=false
                                         :width="item.width">
                            <template scope="scope">
                                <div v-if="scope.column.label=='AQI'" :style="styleObject(scope.row.aqi)">
                                    {{scope.row.aqi}}
                                </div>

                                <div v-else-if="scope.column.property==='primary_pollutant'">
                                    <div v-html="scope.row[scope.column.property]"></div>
                                </div>
                                <div v-else>
                                    {{scope.row[scope.column.property]}}
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </right-panel>
        <img src="static/mask/d01.png" ref="fmasking_d01" style="display:none"/>
        <img src="static/mask/china.png" ref="mmasking_d01" style="display:none"/>
    </div>

</template>

<script>
    import moduleJs from './Module.js';

    export default moduleJs;
</script>

<style scoped lang="css">
    @import url(./assets/style/style.css);

    .body-wrap {
        color: #fff;
        width: 100%;
        height: 100%;
        font-size: 14px;
    }

    .content {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
    }

    .map-row {
        height: 100%;
    }

    .condition-wrap {

    }

    #monitorDisMapDiv {
        width: 100%;
        height: 100%;
    }

    #monitorTimeControl {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        border: 0;
        outline: 0;
        padding: 0;
        margin: 0;
        z-index: 1000
    }


    .titleWrap {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 998;
    }

    .currDescInfo {
        font-size: 0;
        padding-top: 16px;
        padding-left: 24px;
        padding-bottom: 13px;
    }

    .currDescInfo .descCity {
        font-size: 18px;
        margin-right: 12px;
    }

    .currDescInfo .descInfo {
        font-size: 14px;

    }

    .currAQIInfo {
        width: 100%;
        height: 154px;
        text-align: center;
        margin-bottom: 20px;
    }

    .currAQIInfo.level1 {
        background: transparent url("./assets/images/优.png") no-repeat 50% 0;
    }

    .currAQIInfo.level2 {
        background: transparent url("./assets/images/良.png") no-repeat 50% 0;
    }

    .currAQIInfo.level3 {
        background: transparent url("./assets/images/轻度.png") no-repeat 50% 0;
    }

    .currAQIInfo.level4 {
        background: transparent url("./assets/images/中度.png") no-repeat 50% 0;
    }

    .currAQIInfo.level5 {
        background: transparent url("./assets/images/重.png") no-repeat 50% 0;
    }

    .currAQIInfo.level6 {
        background: transparent url("./assets/images/严重.png") no-repeat 50% 0;
    }

    .currAQIInfo.level0 {
        background: transparent url("./assets/images/缺值.png") no-repeat 50% 0;
    }

    .currAQIInfo .aqiValue {
        text-shadow: rgba(4, 231, 225, 0.46) 1px 0 0, rgba(4, 231, 225, 0.46) 0 1px 0, rgba(4, 231, 225, 0.46) -1px 0 0, rgba(4, 231, 225, 0.46) 0 -1px 0;

        font-size: 54px;
        font-family: '黑体,SimHei';
        padding-top: 40px;
    }

    .currAQIInfo .pol {
        font-size: 16px !important;
        font-family: '黑体,SimHei';
    }

    .currAQIInfo .level {
        margin-top: 5px;
    }

    .polInfo {
        /*height: 110px;*/
        margin: 0 4px 0 4px;
        border-top: 1px solid #34435f;
        border-bottom: 1px solid #34435f;
        padding: 16px 0 16px 0;
    }

    .switchDiv {
        position: absolute;
        right: 2px;
        top: 40px;
        z-index: 900;
    }

    .switchDiv > div {
        margin-top: 4px;
    }

    .locate {
        position: absolute;
        right: 2px;
        top: 4px;
        z-index: 600;
    }

    .legend {
        position: absolute;
        right: 12px;
        bottom: 56px;
        z-index: 600;
    }

</style>


<template>
    <div class="body-wrap">
        <!--内容区域-->
        <div class="content" :style="{'right':rightPanelWidth+'px'}">
            <el-row class="el-row-map">
                <el-row :style="{'height':fullViewRow[0]}" v-show="fullViewRow[0]!=='0'">
                    <el-col :span="12" style="height: 100%;position: relative" :style="{'width':fullViewCell[0][0]}"
                            v-show="fullViewCell[0][0]!=='0'">
                        <div class="map" id="disTopLeftMap"></div>
                        <div class="toggleDiv" style="position: absolute;right: 50px;top:10px;z-index:500"
                             v-show="fullViewCell[0][0]!=='0'">
                            <horizon-select :btns="toggleBtnGroups[0]" v-model="toggleBtns[0]"
                                            @change="onToggleChange(0)"></horizon-select>
                        </div>
                        <div class="toolDiv" @click="_changeViewExtent([0,0])">
                        <span :class="['fa', {'fa-expand fa-2x':fullViewCell[0][0]!=='0','fa-compress fa-2x':fullViewCell[0][0]==='100%'}]"
                              style="margin-top: 3px;color:rgba(0,0,0,0.5)"></span>
                        </div>

                        <div class="legend" v-if="legends.length>0">
                            <legend3clear :items="legends[0]"></legend3clear>
                        </div>

                    </el-col>

                    <el-col :span="12" style="height: 100%;position: relative" :style="{'width':fullViewCell[0][1]}"
                            v-show="fullViewCell[0][1]!=='0'">
                        <div class="map" id="disTopRightMap"></div>
                        <div class="toggleDiv" style="position: absolute;right: 50px;top:10px;z-index:500"
                             v-show="fullViewCell[0][1]!=='0'">
                            <horizon-select :btns="toggleBtnGroups[1]" v-model="toggleBtns[1]"
                                            @change="onToggleChange(1)"></horizon-select>
                        </div>
                        <div class="toolDiv" @click="_changeViewExtent([0,1])">
                        <span :class="['fa', {'fa-expand fa-2x':fullViewCell[0][1]!=='0','fa-compress fa-2x':fullViewCell[0][1]==='100%'}]"
                              style="margin-top: 3px;color:rgba(0,0,0,0.5)"></span>
                        </div>

                        <div class="legend" v-if="legends.length>0">
                            <legend3clear :items="legends[1]"></legend3clear>
                        </div>
                    </el-col>

                </el-row>

                <el-row style="border-top: 1px solid #112b4d;" :style="{'height':fullViewRow[1]}"
                        v-show="fullViewRow[1]!=='0'">
                    <el-col :span="12" style="height: 100%;position: relative" :style="{'width':fullViewCell[1][0]}"
                            v-show="fullViewCell[1][0]!=='0'">
                        <div class="map" id="disBottomLeftMap"></div>
                        <div class="toggleDiv" style="position: absolute;right: 50px;top:10px;z-index:500"
                             v-show="fullViewCell[1][0]!=='0'">
                            <horizon-select :btns="toggleBtnGroups[2]" v-model="toggleBtns[2]"
                                            @change="onToggleChange(2)"></horizon-select>
                        </div>
                        <div class="toolDiv" @click="_changeViewExtent([1,0])">
                        <span :class="['fa', {'fa-expand fa-2x':fullViewCell[1][0]!=='0','fa-compress fa-2x':fullViewCell[1][0]==='100%'}]"
                              style="margin-top: 3px;color:rgba(0,0,0,0.5)"></span>
                        </div>
                        <div class="legend" v-if="legends.length>0">
                            <legend3clear :items="legends[2]"></legend3clear>
                        </div>
                    </el-col>

                    <el-col :span="12" style="height: 100%;position: relative" :style="{'width':fullViewCell[1][1]}"
                            v-show="fullViewCell[1][1]!=='0'">
                        <div class="map" id="disBottomRightMap"></div>
                        <div class="toggleDiv" style="position: absolute;right: 50px;top:10px;z-index:500"
                             v-show="fullViewCell[1][1]!=='0'">
                            <horizon-select :btns="toggleBtnGroups[3]" v-model="toggleBtns[3]"
                                            @change="onToggleChange(3)"></horizon-select>
                        </div>
                        <div class="toolDiv" @click="_changeViewExtent([1,1])">
                        <span :class="['fa', {'fa-expand fa-2x':fullViewCell[1][1]!=='0','fa-compress fa-2x':fullViewCell[1][1]==='100%'}]"
                              style="margin-top: 3px;color:rgba(0,0,0,0.5)"></span>
                        </div>
                        <div class="legend" v-if="legends.length>0">
                            <legend3clear :items="legends[3]"></legend3clear>
                        </div>
                    </el-col>
                </el-row>

            </el-row>


            <el-row class="el-row-time">
                <div class="timeControlDiv">

                    <el-date-picker
                            style="width:135px;left: 3px"
                            v-model="pDate"
                            type="date"
                            :editable="false"
                            :clearable="false"
                            :picker-options="pDateOptions"
                            @change="onDateChange"
                            value-format="yyyy-MM-dd"
                            placeholder="选择日期">
                    </el-date-picker>

                    <el-select style="width:80px;left: 3px" @change="onIntervalChange" v-model="time" placeholder="请选择">
                        <el-option
                                v-for="item in timeOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                        >
                        </el-option>
                    </el-select>

                    <div class="dateTypeSelect">
                        <el-radio-group v-model="dateType" @change="dateTypeChange">
                            <el-radio-button label="hour">小时</el-radio-button>
                            <el-radio-button label="day">日均</el-radio-button>
                        </el-radio-group>
                    </div>

                </div>

                <div id="disMapMultiViewDayControl" v-show="isShow.time">

                </div>

                <div id="dateDiv" v-show="!isShow.time&&dateType==='hour'">
                    <date-btns :btns="dateBtns" v-model="currBtnValue" @change="onDateBtnChange"></date-btns>
                </div>
            </el-row>

        </div>

        <!--条件区域-->
        <div class="rightMiniPanel">

            <!--模块条件区域-->
            <div class="condition-wrap">

                <div class="tabDidv">
                    <v-table :tabs="tabs" v-model="tab" @change="onTabChange"></v-table>
                </div>

                <div class="conditionDiv">
                    <div class="panel modelPanel" v-show="isShow.model">
                        <panel-select :infos="models" v-model="model" @change="onModelChange"
                        ></panel-select>
                    </div>
                    <div class="panel regionPanel" v-show="isShow.domain">
                        <panel-select :infos="areas" v-model="area" @change="onRegionChange"
                        ></panel-select>
                    </div>
                    <div class="panel polPanel" v-show="isShow.target">
                        <panel-select :infos="targets" v-model="target" @change="onTargetChange"
                        ></panel-select>
                    </div>
                </div>
            </div>

        </div>

        <img src="static/mask/d01.png" ref="masking_d01" style="display:none"/>
        <img src="static/mask/d02.png" ref="masking_d02" style="display:none"/>
        <img src="static/mask/d03.png" ref="masking_d03" style="display:none"/>
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

    .timeSelect {

    }

    .el-row-map {
        width: 100%;
        height: calc(100% - 53px)
    }

    .el-row-time {

    }

    .timeControlDiv {
        width: 340px;
        height: 55px;
        background-color: rgba(2, 17, 26, 0.6);
        line-height: 53px;
        border-right: 1px solid rgba(2, 17, 26, 0.9);
    }

    .dateTypeSelect {
        display: inline-block;
        margin-left: 3px;
    }

    #disMapMultiViewDayControl, #dateDiv {
        left: 340px;
        position: absolute;
        right: 0;
        z-index: 9999;
        bottom: 0;
        /*background-color: rgba(2, 17, 26, 0.6);*/
        height: 38px;
        border-top: 7px solid rgba(2, 17, 26, 0.7);
        border-bottom: 8px solid rgba(2, 17, 26, 0.7);
    }

    #disTopLeftMap {


    }

    #disBottomLeftMap {
        border-top: 1px solid #112b4d;
    }

    #disTopRightMap {
        border-left: 1px solid #112b4d;
    }

    #disBottomRightMap {
        border-left: 1px solid #112b4d;
        border-top: 1px solid #112b4d;
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
        margin: 0px 12px 0 0;
    }

    .tabDidv {
        vertical-align: top;
    }

    .tabDidv, .conditionDiv {
        display: inline-block;
    }

    .conditionDiv {
        margin-top: 8px;
    }

    .panel {
        width: 140px;
        margin-left: 5px;
    }


    .toolDiv {
        position: absolute;
        right: 10px;
        top: 10px;
        z-index: 999;
        cursor: pointer;
    }

    .legend {
        position: absolute;
        right: 3px;
        bottom: 3px;
        z-index: 600;
    }

</style>


<template>
    <!--条件区域-->
    <div id="right-panel" class="right-panel" :style="{width:rightPanelWidth+'px'}">
        <div class="toggleBtn" v-if="toggle" @click="toggleMenu">
            <i :class='[{"el-icon-arrow-left":status==="close"},{"el-icon-arrow-right":status==="open"}]'></i>
        </div>

        <form class="form-content-wrap" :style="{width:rightPanelWidth+'px'}">
            <slot>
            </slot>
        </form>
    </div>
</template>

<script>
    import moduleJs from './RightPanel.js';

    export default moduleJs;
</script>

<style scoped lang="css">

    .right-panel {
        background-color: #0b2650;
        height: auto;
        position: absolute;
        right: 0;
        top: 0;
        bottom:0;
    }

    .right-panel .toggleBtn {
        cursor: pointer;
        position: absolute;
        left: -24px;
        top: 5px;
        padding: 10px 5px;
        background: #314009;
        display: inline-block;
        border-radius: 10px 0 0 10px;
        z-index: 999;
    }

    i, form {
        margin: 0;
        padding: 0;
        border: 0;
        outline: 0;
        vertical-align: baseline;
    }

    .right-panel .form-content-wrap {
        display: flex;
        -webkit-flex-direction: column;
        flex-direction: column;
        padding: 0;
        overflow: auto;
        height: 100%;
    }
</style>


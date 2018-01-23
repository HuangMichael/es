<template>
    <div class="switchBar" :value="value">
        <div class="btn-switch">
            <div class="switchLabel">
                {{infos.label}}
            </div>
            <el-switch
                    v-model="status"
                    active-color="#13ce66"
                    inactive-color="#5470a2"
                    @change="onStatusChange">
            </el-switch>
        </div>

        <div class="btn-group" v-show="infos.options.length>0">
            <ul>
                <li v-for="(bt,idx) in infos.options" :class="['li-item', {'checked':bt.value===currCheckedValue}]"
                    @click="handleClick(infos.options[idx].value)">
                    <div v-html="handlePolName(bt.label)"></div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import {utils} from "utils/utils";

    export default {
        components: {},

        props: {
            infos: {
                type: Object,
                require: true
            },

            value: {},
        },

        data() {
            return {
                currCheckedValue: this.value,
                status: this.infos.status
            };
        },


        mounted() {
            if (this.value) {
                this.currCheckedValue = this.value;
            }
        },

        watch: {

            value(val) {
                this.currCheckedValue = val;
            },

            currCheckedValue(val) {
                this.$emit('input', val);
                this.$emit('change', val);
            }
        },

        methods: {
            handleClick(newValue) {
                this.currCheckedValue = newValue;
            },

            onStatusChange(status) {
                this.infos.status=status;
                this.$emit('statusChange', status);
            },

            handlePolName(name) {
                return utils.addSubToLabel(name)
            }

        }
    }
</script>

<style scoped>
    @import url(./assets/style/style.css);

    .switchBar {
        font-size: 0;
        color: #fff;
    }

    .btn-switch {
        font-size: 14px;
        padding: 10px;
        text-align: center;
        background-color: rgba(7, 30, 73,1);

    }

    .switchLabel {
        margin-bottom: 8px;
        color: #fff;
    }

    .btn-group {
        background-color: rgba(0, 0, 0, 0.5);
        padding: 8px 0 8px 0;
    }

    .btn-group .li-item {
        list-style: none;
        text-align: center;
        line-height: 24px;
        height: 24px;
        /*padding: 0 2px 0 2px;*/
        margin-top: 5px;
        font-size: 12px;
        cursor: pointer;
    }

    .btn-group .li-item:last-child {

    }

    .btn-group .checked {
        color: #fff;
        background: #029fde;
        background: linear-gradient(to right, #02a2de 50%, #0255de 100%);
    }

    .btn-group .li-item:hover{
        color: #fff;
        background-color: #029fde;
    }

</style>


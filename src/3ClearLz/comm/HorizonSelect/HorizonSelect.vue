<template>
    <div class="hSelect" :value="value">
        <div class="h-select-group" :style="{'background-color':bgColor }">
            <ul>
                <li v-for="(bt,idx) in btns" :class="['li-item', {'checked':bt.value===currCheckedValue}]"
                    :style="itemStyle(bt.value)"
                    @click="handleClick(bt.value)">
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
            btns: {
                type: Array,
                require: true
            },
            selectBarColor: {
                type: String,
                default: "#00b8ff"
            },

            selectFontColor: {
                type: String,
                default: "#fff"
            },

            bgColor: {
                type: String,
                default: 'rgba(0, 0, 0, 0.5)'
            },

            value: {},
        },

        data() {
            return {
                checkStyleObj: {},
                currCheckedValue: this.value
            };
        },

        mounted() {
            if (this.value) {
                this.currCheckedValue = this.value;
            }
        },

        computed: {},

        watch: {

            value(val) {
                this.currCheckedValue = val;
            }
        },

        methods: {

            itemStyle: function (value) {
                if (value === this.currCheckedValue) {
                    return {
                        backgroundColor: this.selectBarColor,
                        color: this.selectFontColor,
                        borderRadius: '10px'
                    };
                }
                else
                    return {};
            },

            handleClick(newValue) {
                this.currCheckedValue = newValue;
                this.$emit('input', newValue);
                this.$emit('change', newValue);
            },

            handlePolName(name) {
                return utils.addSubToLabel(name)
            }
        }
    }
</script>

<style scoped>
    @import url(./assets/style/style.css);

    .hSelect {
        font-size: 0;
        color: #fff;
    }

    .h-select-group {
        background-color: rgba(0, 0, 0, 0.5);
        padding: 4px 0 4px 0;
        font-size: 12px;
        border-radius: 13px;
    }

    .h-select-group .li-item {
        display: inline-block;
        list-style: none;
        text-align: center;
        line-height: 22px;
        height: 22px;
        padding: 0 10px 0 10px;
        font-size: 12px;
        cursor: pointer;
        margin-right: 6px;
    }

    .h-select-group .li-item:last-child {
        margin-right: 8px;
    }

    .h-select-group .li-item:first-child {
        margin-left: 8px;
    }

    .h-select-group .li-item:hover{
        color:#00b8ff;
    }


</style>


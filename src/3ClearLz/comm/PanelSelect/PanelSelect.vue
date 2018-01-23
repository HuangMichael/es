<template>
    <div class="panelSelect" :value="value">
        <div class="panelTitle">
            <div class="titleLabel">
                {{infos.title}}
            </div>
        </div>

        <div class="select-group">
            <ul>
                <li v-for="(bt,idx) in infos.options" :class="['li-item', {'checked':bt.value===currCheckedValue}]"
                    @click="handleClick(infos.options[idx].value)">
                    <span class="checkIcon" v-show="bt.value===currCheckedValue"></span>
                    <div  v-html="handlePolName(bt.label)"></div>
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
                currCheckedValue: this.value
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
            }
        },

        methods: {
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

    .panelSelect {
        font-size: 0;
        color: #04e7e1;
    }

    .panelTitle {
        background-color: #0d3155;
        padding-top: 8px;
        padding-bottom: 8px;
    }

    .titleLabel {
        color: #ffa200;
        font-size: 15px;
        text-align: center;
        font-weight: bold;
    }

    .select-group {
        background-color: rgba(9, 29, 68, 0.78);
        padding: 8px 0 8px 0;
    }

    .select-group .li-item {
        list-style: none;
        text-align: center;
        line-height: 24px;
        height: 24px;
        /*padding: 0 2px 0 2px;*/
        margin-top: 5px;
        font-size: 12px;
        cursor: pointer;
        position: relative;
    }

    .select-group .li-item:last-child {

    }

    .select-group .checked {
        color: #fff;
        background-color: #0d4e7a;
    }

    .select-group .li-item:hover {
        color: #fff;
        background-color: #0d4e7a;
    }

    .checkIcon {
        position: absolute;
        left: 20px;
        background-color: #d30202;
        border-radius: 40px;
        height: 8px;
        width: 8px;
        top: 8px;

    }

</style>


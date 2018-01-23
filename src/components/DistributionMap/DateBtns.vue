<template>
    <div class="dateBtns" :value="value">
        <el-row type="flex" class="row-bg" justify="space-around">
            <el-col class="btn-col" :span="getSpan(btns.length)" v-for="btn in btns">
                <div :class="['btn',{'checked':btn.value===currCheckedValue}]" @click="handleClick(btn.value)">
                    {{btn.label}}
                </div>

            </el-col>
        </el-row>
    </div>
</template>

<script>
    export default {
        props: {
            btns: {
                type: Array,
                required: true,
                default: function () {
                    return []
                }
            },
            value: {
                type: String
            },
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
            },

        },

        methods: {
            handleClick(newValue) {
                this.currCheckedValue = newValue;
                this.$emit('input', newValue);
                this.$emit('change', newValue);
            },

            getSpan(len) {
                return (24 / len) === 0 ? (24 / len) : parseInt(24 / len) + 1;
            }
        }
    }
</script>

<style scoped lang="css">
    .dateBtns {
        font-size: 14px;
        color: #49d9fe;
    }

    .btn {
        cursor: pointer;
        text-align: center;
        border-right: 1px solid #fff;
        height: 38px;
        line-height: 38px;
        background-color: rgba(2, 17, 26, 0.6);
    }

    .btn:hover {
        color: #fff;
        background-color: #0d4e7a;
    }

    .checked {
        color: #fff;
        background-color: #0d4e7a;
    }

    .btn-col:last-child {
        border-right: none;
    }
</style>


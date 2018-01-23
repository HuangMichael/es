import {utils} from "../../utils/utils";
import 'libs/Scrollbar/jquery.mCustomScrollbar.css';
import {scrollbar} from 'libs/Scrollbar/jquery.mCustomScrollbar.js'
import {mousewheel} from 'libs/Scrollbar/jquery.mousewheel.min.js'
export default {
    components: {},

    props: {
        rightPanelWidth: {
            type: Number
        },
        toggleStatus: {
            type: String,
            default: 'open',
            required: false
        }
    },

    data() {
        return {
            win_size: {
                height: '',
            },
            status: this.toggleStatus,
            toggle: this.$$appConfig.layout.rightPanel.toggle
        }
    },

    methods: {

        setSize() {
            // this.win_size.height = this.$$lib_$(window).height()  + "px";
        },

        toggleMenu() {
            this.status = this.status === 'open' ? 'close' : 'open';
            this.$emit('togglePanel', this.status);
            this.$root.eventBus.$emit('toggleMenu');
        },
    },

    created() {
		
        this.setSize();
        this.$nextTick(() => {
            this.$$lib_$("#right-panel").mCustomScrollbar();
        });
        this.$$lib_$(window).resize(() => {
            this.setSize();
           
        });
    }
}

/**
 * Created by <kangming@3clear.com>
 * date: 2017/11/5
 * desc:
 */

const tplFunction = function (h, {node, data, store}) {
    return (<span
        style="flex: 1; display: flex; align-items: center; justify-content: space-between; font-size: 14px; padding-right: 8px;">
                    <span>
                          {data.type === 'station' ?
                              (
                                  <span class={{"bplz-sta-type":true,
                                      "bplz-sta-type-country": data.stype === undefined,
                                      "bplz-sta-type-city": data.stype === '农',
                                      "bplz-sta-type-refer": data.stype === '省',
                                      "bplz-sta-type-bg": data.stype === '创',
                                      "bplz-sta-type-county": data.stype === '质',
                                      "bplz-sta-type-bian": data.stype === '边'
                                  }}>
                             {data.stype === undefined ? '国' : data.stype}
                    </span> ) : ''}

                        <span>{data.label}</span>
                    </span>
                <span>
                </span>
            </span>)
};
export {
    tplFunction
}
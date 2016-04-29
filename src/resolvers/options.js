"use strict";
import {toArray} from "../tutils";

function toOptions(nval) {
    const tnval = typeof nval;
    if (tnval === 'string' || tnval === 'number' || tnval === 'boolean') {
        return {label: nval+'', val: nval+''};
    }

    if (('label' in nval ) && ('val' in nval)) {
        return nval;
    }
    const {label, val, ...rest} = nval;
    if (!val) {
        rest.val = label;
    }
    if (!label) {
        rest.label = val;
    }
    return rest;
}

function asOptions(val) {
    return toArray(val).map(toOptions);
}
export default function options(Clazz, key) {
    Clazz::this.property(key, asOptions);
}
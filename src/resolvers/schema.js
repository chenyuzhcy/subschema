"use strict";

import {prop} from 'subschema-injection/src/util';
import PropTypes from '../PropTypes';
import {toArray, FREEZE_OBJ} from '../tutils';
import {normalizeFieldsets} from './fieldset';
import {loadTemplate} from './template';
/**
 * So a schema can be
 * EX: {
 *   key:'Text'
 * }
 * or
 * {
 *   schema:{
 *     key:'Text'
 *   }
 * }
 * or
 *
 * {
 *   schema:{
 *    f1:'Text',
 *    f2:'Text'
 *   },
 *   fields:['f1']
 *
 * }
 * or
 *
 * {
 *   schema:'Hello'
 * }
 *
 * or
 *
 * 'Hello'
 *
 * @param oschema
 * @param ofields
 * @param ofieldsets
 * @param loader
 * @param orest
 * @returns {*}
 */
export function normalize(oschema, ofields, ofieldsets, {loader}, orest = FREEZE_OBJ) {
    if (oschema == null) {
        return oschema;
    }

    if (typeof oschema === 'string') {
        return normalize(loader.loadSchema(oschema), ofields, ofieldsets, loader, orest);
    }
    //use the overrided fieldsets.
    if (ofields || ofieldsets) {

        if (oschema.schema) {
            let {fields, fieldsets, schema, ...rest} = oschema;
            if (typeof schema === 'string') {
                return normalize(loader.loadSchema(schema), ofields, ofieldsets, loader, rest);
            }
            return {
                ...rest,
                ...normalizeFieldsets(ofieldsets, ofields),
                schema
            }
        } else {
            return {
                ...orest,
                ...normalizeFieldsets(ofieldsets, ofields),
                schema: oschema
            };
        }
    }

    if (oschema.fields || oschema.fieldsets) {
        let {fields, fieldsets, schema, ...rest} = oschema;
        if (typeof schema === 'string') {
            return normalize(schema, fields, fieldsets, loader, rest);
        }
        return {
            ...rest,
            ...normalizeFieldsets(oschema.fieldsets, oschema.fields),
            schema
        }
    }
    //schema without fields, or fieldsets
    if (oschema.schema) {
        let {schema, ...rest} = oschema;
        if (typeof schema === 'string') {
            //ofields and ofields should be null here.
            return normalize(schema, ofields, ofieldsets, loader, rest);
        }
        let fields = Object.keys(schema);
        return {
            ...rest,
            schema,
            fields,
            fieldsets: [{fields}]
        };
    }
    let fields = Object.keys(oschema);
    return {
        ...orest,
        fields,
        fieldsets: [{fields}],
        schema: oschema
    };

}

export const settings = {
    template: 'ObjectTemplate'
};

export function normalizeSchema(oschema, key, props, context) {
    if (oschema == null) return oschema;
    const schema = normalize(oschema, props.fieldsets, props.fields, context);
    if (props.objectTemplate) {
        schema.Template = loadTemplate(props.objectTemplate, key, props, context);
    } else if (schema.template) {
        schema.Template = loadTemplate(schema.template, key, props, context);
    } else if (props.fallbackTemplate) {
        schema.Template = loadTemplate(props.fallbackTemplate, key, props, context);
    } else {
        schema.Template = loadTemplate(settings.template,  key, props, context);
    }
    return schema;
}

function schema(Clazz, key) {
    Clazz.contextTypes.loader = PropTypes.loader;
    Clazz::prop(key, normalizeSchema);
}

schema.normalizeSchema = normalizeSchema;
export default schema;
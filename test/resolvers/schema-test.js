"use strict";
import {loaderFactory, resolvers} from 'subschema';
import expect from 'expect';

const {normalizeSchema  } = resolvers.schema;
//TODO -fix
describe('resolvers/schema', function () {
    const loader = loaderFactory();
    const context = {loader};
    loader.addSchema({
        Address: {
            schema: {
                address: 'Text',
                city: 'Text',
                state: {
                    type: 'Select',
                    options: ['CA', 'FL', 'VA', 'IL']
                },
                zipCode: {
                    type: 'Text',
                    dataType: 'number'
                }
            },
            fields: ['address', 'city', 'state', 'zipCode']
        },
        Contact: {
            schema: {
                name: 'Text',
                primary: {
                    type: 'ToggleObject',
                    subSchema: 'Address',
                    template: 'SimpleTemplate'
                },
                otherAddresses: {
                    canEdit: true,
                    canReorder: true,
                    canDelete: true,
                    canAdd: true,
                    type: 'List',
                    labelKey: 'address',
                    itemType: {
                        type: 'Object',
                        subSchema: 'Address'
                    }
                }
            },
            fields: ['name', 'primary', 'otherAddresses']
        }
    });

    it('should normalize with subSchema with loaders', function () {

        var result = normalizeSchema({subSchema: 'Contact'}, null, {}, context);
        expect(result.fields, 'name', 'primary', 'otherAddresss');
    });

});

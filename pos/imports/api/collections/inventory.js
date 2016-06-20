import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

export const AverageInventories = new Mongo.Collection("pos_averageInventories");


// AverageInventories schema
AverageInventories.schema = new SimpleSchema({
    productId: {
        type: String
    },
    locationId: {
        type: String
    },
    price: {
        type: Number,
        decimal: true
    },
    qty: {
        type: Number
    },
    remainQty: {
        type: Number
    },
    branchId: {
        type: String
    },
    type:{
        type:Number
    }
});

Meteor.startup(function () {
    AverageInventories.itemsSchema.i18n("pos.averageInventory.schema");
    AverageInventories.schema.i18n("pos.averageInventory.schema");
    AverageInventories.attachSchema(AverageInventories.schema);
});

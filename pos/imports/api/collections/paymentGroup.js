import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const PaymentGroups = new Mongo.Collection("pos_paymentGroups");
PaymentGroups.schema = new SimpleSchema({
    name: {
        type: String,
        label: "Name",
        //unique: true,
        max: 200
    },
    numberOfDay:{
        type:Number,
        label:"Number of day"
    },
    description:{
        type:String,
        label:"Description",
        optional:true
    }
});

Meteor.startup(function () {
    PaymentGroups.schema.i18n("pos.paymentGroup.schema");
    PaymentGroups.attachSchema(PaymentGroups.schema);
});
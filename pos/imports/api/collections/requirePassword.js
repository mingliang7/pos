import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';
import {SelectOpts} from '../../../../core/imports/ui/libs/select-opts.js';
// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
export const RequirePassword = new Mongo.Collection("pos_requirePassword");

RequirePassword.schema = new SimpleSchema({
    password: {
        type: String,
        autoform:{
            label: false
        }
    },
    invoiceForm: {
        type: Boolean,
        autoform: {
            type: 'boolean-checkbox'
        }
    },
    saleOrderForm: {
        type: Boolean,
        autoform: {
            type: 'boolean-checkbox'
        }
    },
    branchId: {
        type: [String],
        autoform: {
            type: "universe-select",
            multiple: true,
            options: function () {
                return Meteor.isClient && SelectOpts.branchForCurrentUser(false);
            }
        }
    }
});

RequirePassword.attachSchema(RequirePassword.schema);


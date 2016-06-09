import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const Customers = new Mongo.Collection("pos_customers");

Customers.schema = new SimpleSchema({
    name: {
        type: String
    },
    gender: {
        type: String,
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.gender();
            }
        }
    },
    address: {
        type: String
    },
    telephone: {
        type: String
    },
    email: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        optional: true
    },
    branchId: {
        type: String
    },
    paymentType: {
        type: String,
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.paymentType();
            }
        }
    },
    termId: {
        type: String,
        optional: function () {
            return this.paymentType == "Term";
        },
        label: "Payment Term",
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.term();
            }
        }
    },
    paymentGroupId: {
        type: String,
        optional: function () {
            debugger;
            return this.paymentType == "Group";
        },
        label: "Payment Group",
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.paymentGroup();
            }
        }
    }
});

Meteor.startup(function () {
    Customers.schema.i18n("pos.customer.schema");
    Customers.attachSchema(Customers.schema);
});

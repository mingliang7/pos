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
        type: String,
        optional:true
    },
    email: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        optional: true
    },
    branchId: {
        type: String,
        optional:true
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
        optional: true,
        custom: function () {
            // let paymentType = AutoForm.getFieldValue('paymentType');
            if (this.paymentType == "Term" && !this.isSet && (!this.operator || (this.value === null || this.value === ""))) {
                return "required";
            }
        },
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.term();
            }
        }
    },
    paymentGroupId: {
        type: String,
        optional:true,
        custom: function () {
            // let paymentType = AutoForm.getFieldValue('paymentType');
            if (this.paymentType == "Group" && !this.isSet && (!this.operator || (this.value === null || this.value === ""))) {
                return "required";
            }
        },
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.paymentGroup();
            }
        }
    },
    creditLimit: {
      type: Number,
      decimal: true,
      optional: true,
      autoform: {
          type: 'inputmask',
          inputmaskOptions: function () {
              return inputmaskOptions.currency();
          }
      }
    }
});

Meteor.startup(function () {
    Customers.schema.i18n("pos.customer.schema");
    Customers.attachSchema(Customers.schema);
});

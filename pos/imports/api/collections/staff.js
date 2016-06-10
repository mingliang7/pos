import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const Staffs = new Mongo.Collection("pos_staffs");

Staffs.schema = new SimpleSchema({
    name: {
        type: String,
        label: "Name"
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
    startDate: {
        type: Date,
        label: "Start Date",
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                    pickTime: false
                }
            }
        }
    },
    position: {
        type: String,
        label: "Position",
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.position();
            }
        }
    },
   salary: {
        type: Number,
        label: "Salary",
        decimal: true,
        optional:true
        //regEx: /^[a-z0-9A-Z_]{3,15}$/
    },
    status: {
        type: String,
        label: "Status",
        autoform: {
            type: "select2",
            options: function () {
                return SelectOpts.status();
            }
        }
    },
    address: {
        type: String,
        optional:true
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
        type: String
    }
});

Meteor.startup(function () {
    Staffs.schema.i18n("pos.staff.schema");
    Staffs.attachSchema(Staffs.schema);
});

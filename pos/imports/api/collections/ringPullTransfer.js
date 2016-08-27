import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const RingPullTransfers = new Mongo.Collection("pos_ringPullTransfers");

// RingPullTransfers schema
RingPullTransfers.schema = new SimpleSchema({
    ringPullTransferDate: {
        type: Date,
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY HH:mm:ss',

                },
                value(){
                    let customerId = AutoForm.getFieldValue('customerId');
                    if (customerId) {
                        return moment().toDate();
                    }
                }
            }

        }
    },
    fromUserId: {
        type: String,
        autoValue(){
            if (this.isInsert) {
                return Meteor.userId();
            }
        },
        autoform: {
            type: 'universe-select',
        }
    },
    toUserId: {
        type: String,
        optional: true
    },
    des: {
        type: String,
        optional: true,
        autoform: {
            afFieldInput: {
                type: 'summernote',
                class: 'editor', // optional
                settings: {
                    height: 150,                 // set editor height
                    minHeight: null,             // set minimum height of editor
                    maxHeight: null,             // set maximum height of editor
                    toolbar: [
                        ['font', ['bold', 'italic', 'underline', 'clear']], //['font', ['bold', 'italic', 'underline', 'clear']],
                        ['para', ['ul', 'ol']] //['para', ['ul', 'ol', 'paragraph']],
                        //['insert', ['link', 'picture']], //['insert', ['link', 'picture', 'hr']],
                    ]
                } // summernote options goes here
            }
        }
    },
    fromBranchId: {
        type: String
    },
    toBranchId: {
        type: String,
        label: 'To Branch',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.branch',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Meteor.isClient && Session.get('currentBranch');
                        return {branchId: currentBranch};
                    }
                }
            }
        }
    },
    amount: {
        type: Number,
    }
});

Meteor.startup(function () {
    RingPullTransfers.schema.i18n("pos.ringPullTransfer.schema");
    RingPullTransfers.attachSchema(RingPullTransfers.schema);
});

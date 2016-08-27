import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const ExchangeRingPulls = new Mongo.Collection("pos_exchangeRingPulls");

// ExchangeRingPulls schema
ExchangeRingPulls.schema = new SimpleSchema({
    exchangeRingPullDate: {
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
    customerId: {
        type: String,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Please search .... (Limit 10)',
                optionsMethod: 'pos.selectOptMethods.customer',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Session.get('currentBranch');
                        return {branchId: currentBranch};
                    }
                }
            }
        }
    },
    staffId: {
        type: String,
        autoValue(){
            return Meteor.user()._id;
        }
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
    branchId: {
        type: String
    },
    amount: {
        type: Number,
    }
});

Meteor.startup(function () {
    ExchangeRingPulls.schema.i18n("pos.exchangeRingPull.schema");
    ExchangeRingPulls.attachSchema(ExchangeRingPulls.schema);
});

import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {SelectOpts} from '../../ui/libs/select-opts.js';

export const Adjustments = new Mongo.Collection("pos_adjustments");
// Items sub schema
Adjustments.itemsSchema = new SimpleSchema({
    itemId: {
        type: String
    },
    qtyOnHand: {
        type: Number,
        decimal: true,
    },
    qty: {
        type: Number,
        decimal: true,
    },
    remainQty: {
        type: Number,
        decimal: true
    },
    price: {
        type: Number,
        decimal: true,
        optional: true
    },
    amount: {
        type: Number,
        decimal: true,
        optional: true
    }
});

// Adjustments schema
Adjustments.schema = new SimpleSchema({
    voucherId: {
        type: String,
        optional: true
    },
    adjustmentDate: {
        type: Date,
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY',
                }
            }

        }
    },
    staffId: {
        type: String,
        autoValue(){
            if (this.isInsert) {
                return Meteor.user()._id;
            }
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
    items: {
        type: [Adjustments.itemsSchema]
    },
    total: {
        type: Number,
        decimal: true,
        optional: true,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    },
    branchId: {
        type: String
    },
    status: {
        type: String,
        optional: true
    },
    stockLocationId: {
        type: String,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.stockLocation',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        let currentBranch = Session.get('currentBranch');
                        return {branchId: currentBranch};
                    }
                }
            }
        }
    },
});

Meteor.startup(function () {
    Adjustments.itemsSchema.i18n("pos.adjustment.schema");
    Adjustments.schema.i18n("pos.adjustment.schema");
    Adjustments.attachSchema(Adjustments.schema);
});

import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {ReactiveVar} from 'meteor/reactive-var';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Method
import {itemInfo} from '../../../common/methods/item-info.js';

// Item schema
let defaultPrice = new ReactiveVar(0);
let itemFilterSelector = new ReactiveVar({});
Tracker.autorun(function () {
    if (Session.get('itemFilterState')) {
        itemFilterSelector.set(Session.get('itemFilterState'));
    }
});
export const ItemsSchema = new SimpleSchema({
    itemId: {
        type: String,
        label: 'Item',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                create: true,
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.item',
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        if (!_.isEmpty(itemFilterSelector.get())) {
                            return itemFilterSelector.get();
                        } else {
                            return {scheme: {}};
                        }
                    }
                }
            }
        }
    },
    qty: {
        type: Number,
        label: 'Qty',
        optional: true,
        min: 1,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.integer();
            }
        }
    },
    price: {
        type: Number,
        label: 'Price',
        decimal: true,
        optional: true,
        defaultValue: function () {
            let id = AutoForm.getFieldValue('itemId');
            if (id) {
                itemInfo.callPromise({
                    _id: id
                }).then(function (result) {
                    defaultPrice.set(result.price);
                }).catch(function (err) {
                    console.log(err.message);
                });
            } else {
                defaultPrice.set(0);
            }

            return defaultPrice.get();
        },
        autoform: {
            type: 'inputmask',
            optional: true,
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    },
    amount: {
        type: Number,
        label: 'Amount',
        optional: true,
        decimal: true,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    }
});

export const RingPullItemsSchema = new SimpleSchema({
    itemId: {
        type: String,
        label: 'Item',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                create: true,
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.item',
                optionsMethodParams: function () {
                    return {scheme: {$exists: false}};
                }
            }
        }
    },
    qty: {
        type: Number,
        label: 'Qty',
        optional: true,
        min: 1,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.integer();
            }
        }
    },
    price: {
        type: Number,
        label: 'Price',
        decimal: true,
        optional: true,
        defaultValue: function () {
            let id = AutoForm.getFieldValue('itemId');
            if (id) {
                itemInfo.callPromise({
                    _id: id
                }).then(function (result) {
                    defaultPrice.set(result.price);
                }).catch(function (err) {
                    console.log(err.message);
                });
            } else {
                defaultPrice.set(0);
            }

            return defaultPrice.get();
        },
        autoform: {
            type: 'inputmask',
            optional: true,
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    },
    amount: {
        type: Number,
        label: 'Amount',
        optional: true,
        decimal: true,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    }
});
export const EnterBillItemsSchema = new SimpleSchema({
    itemId: {
        type: String,
        label: 'Item',
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                create: true,
                uniPlaceholder: 'Select One',
                optionsMethod: 'pos.selectOptMethods.item',
                /*optionsMethodParams: function () {
                 if (Meteor.isClient) {
                 if (!_.isEmpty(itemFilterSelector.get())) {
                 return itemFilterSelector.get();
                 } else {
                 return {scheme: {}};
                 }
                 }
                 },*/
                optionsMethodParams: function () {
                    if (Meteor.isClient) {
                        return {
                            $or: [
                                {scheme: {$exists: false}},
                                {scheme: {$size: 0}}
                            ]
                        };
                    }
                }
            }
        }
    },
    qty: {
        type: Number,
        label: 'Qty',
        optional: true,
        min: 1,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.integer();
            }
        }
    },
    price: {
        type: Number,
        label: 'Price',
        decimal: true,
        optional: true,
        defaultValue: function () {
            let id = AutoForm.getFieldValue('itemId');
            if (id) {
                itemInfo.callPromise({
                    _id: id
                }).then(function (result) {
                    defaultPrice.set(result.price);
                }).catch(function (err) {
                    console.log(err.message);
                });
            } else {
                defaultPrice.set(0);
            }

            return defaultPrice.get();
        },
        autoform: {
            type: 'inputmask',
            optional: true,
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    },
    amount: {
        type: Number,
        label: 'Amount',
        optional: true,
        decimal: true,
        autoform: {
            type: 'inputmask',
            inputmaskOptions: function () {
                return inputmaskOptions.currency();
            }
        }
    }
});
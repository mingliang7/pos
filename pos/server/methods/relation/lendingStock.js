import {Meteor} from 'meteor/meteor';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js';
Meteor.methods({
    isLendingStockHasRelation: function (id) {
        let anyInvoice = ReceiveItems.findOne({lendingStockId: id});
        return !!anyInvoice;
    }
});

import {Meteor} from 'meteor/meteor';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js';
Meteor.methods({
    isPrepaidOrderHasRelation: function (id) {
        let anyInvoice = ReceiveItems.findOne({prepaidOrderId: id});
        return !!anyInvoice;
    }
});

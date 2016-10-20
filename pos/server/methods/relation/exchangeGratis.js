import {Meteor} from 'meteor/meteor';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js';
Meteor.methods({
    isExchangeGratisHasRelation: function (id) {
        let anyInvoice = ReceiveItems.findOne({exchangeGratisId: id});
        return !!anyInvoice;
    }
});

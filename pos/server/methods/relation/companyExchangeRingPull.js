import {Meteor} from 'meteor/meteor';
import {ReceiveItems} from '../../../imports/api/collections/receiveItem.js';
Meteor.methods({
    isCompanyExchangeRingPullHasRelation: function (id) {
        let anyInvoice = ReceiveItems.findOne({companyExchangeRingPullId: id});
        return !!anyInvoice;
    }
});

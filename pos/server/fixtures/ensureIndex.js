import {Meteor} from 'meteor/meteor';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {Order} from '../../imports/api/collections/order';
Meteor.startup(function () {
    GroupInvoice._ensureIndex({startDate: 1, endDate: 1, vendorOrCustomerId: 1});
    Order._ensureIndex({'item.itemId': 1});
});
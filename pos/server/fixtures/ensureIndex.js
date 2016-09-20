import {Meteor} from 'meteor/meteor';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {Order} from '../../imports/api/collections/order';
import {Invoices} from '../../imports/api/collections/invoice';
Meteor.startup(function () {
    GroupInvoice._ensureIndex({startDate: 1, endDate: 1, vendorOrCustomerId: 1});
    Order._ensureIndex({'item.itemId': 1});
    Invoices._ensureIndex({invoiceDate: 1, status: 1});
});
import {Meteor} from 'meteor/meteor';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {Order} from '../../imports/api/collections/order';
import {Invoices} from '../../imports/api/collections/invoice';
import {QuantityRangeMapping} from '../../imports/api/collections/quantityRangeMapping';
import {StockAndAccountMapping} from '../../imports/api/collections/stockAndAccountMapping';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';
Meteor.startup(function () {
    GroupInvoice._ensureIndex({startDate: 1, endDate: 1, vendorOrCustomerId: 1});
    Order._ensureIndex({'item.itemId': 1});
    Invoices._ensureIndex({invoiceDate: 1, status: 1});
    QuantityRangeMapping._ensureIndex({startQty: 1, endQty: 1});
    StockAndAccountMapping._ensureIndex({userId: 1, branchId: 1}, {unique: 1, sparse: 1});
    ReceivePayment._ensureIndex({paymentDate: 1, invoiceId: 1}, {unique: 1, sparse: 1});
});
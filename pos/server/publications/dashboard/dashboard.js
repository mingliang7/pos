import {Invoices} from '../../../imports/api/collections/invoice';
import {ReceivePayment} from '../../../imports/api/collections/receivePayment';
import {EnterBills} from '../../../imports/api/collections/enterBill';
import {GroupInvoice} from '../../../imports/api/collections/groupInvoice';
import {PayBills} from '../../../imports/api/collections/payBill';
import {GroupBill} from '../../../imports/api/collections/groupBill';

Meteor.publish('pos.invoiceTransactionIn7days', function invoiceTransactionIn7days(options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        let data = Invoices.find({invoiceType: 'term',invoiceDate: {$gte: startOfWeek, $lte: endOfWeek}}, options);
        return data;
    }
    return this.ready();
});
Meteor.publish('pos.receivePaymentTransactionIn7days', function receivePaymentTransactionIn7days(options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        let data = ReceivePayment.find({paymentDate: {$gte: startOfWeek, $lte: endOfWeek}}, options);

        return data;
    }
    return this.ready();
});
Meteor.publish('pos.enterBillTransactionIn7days', function enterBillTransactionIn7days(options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        let data = EnterBills.find({enterBillDate: {$gte: startOfWeek, $lte: endOfWeek}}, options);
        return data;
    }
    return this.ready();
});
Meteor.publish('pos.groupInvoiceTransactionIn7days', function groupInvoiceTransactionIn7days(options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        let data = GroupInvoice.find({startDate: {$lte: endOfWeek}}, options);
        return data;
    }
    return this.ready();
});
Meteor.publish('pos.payBillTransactionIn7days', function payBillTransactionIn7days(options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        let data = PayBills.find({paymentDate: {$gte: startOfWeek, $lte: endOfWeek}},options);
        console.log(startOfWeek, endOfWeek);
        return data;
    }
    return this.ready();
});
Meteor.publish('pos.groupBillTransactionIn7days', function groupBillTransactionIn7days(options) {
    this.unblock();
    if (this.userId) {
        let startOfWeek = moment().startOf('weeks').toDate();
        let endOfWeek = moment().endOf('weeks').toDate();
        let data = GroupBill.find({startDate: {$gte: startOfWeek, $lte: endOfWeek}},options);
        return data;
    }
    return this.ready();
});
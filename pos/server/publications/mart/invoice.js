import {Invoices} from '../../../imports/api/collections/invoice';
Meteor.publish('pos.martPubInvoiceById', function martPubInvoiceById({invoiceId}) {
    if (this.userId) {
        let invoices = Invoices.find({_id: invoiceId});
        return invoices;
    }
});

Meteor.publish('pos.martPubInvoiceByUnsaved', function martPubInvoiceByUnsaved(selector) {
    if (this.userId) {
        return Invoices.find(selector, {limit: 10});
    }
    return this.ready();
});

Meteor.publish('pos.martPubInvoiceByHolderOrder', function martPubInvoiceByHolderOrder(selector) {
    if (this.userId) {
        return Invoices.find(selector, {limit: 10});
    }
    return this.ready();
});


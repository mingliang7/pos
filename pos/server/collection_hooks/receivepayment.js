import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {Invoices} from '../../imports/api/collections/invoice';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
ReceivePayment.before.insert(function (userId, doc) {
    doc._id = idGenerator.genWithPrefix(ReceivePayment, `${doc.branchId}-`, 9);
});

ReceivePayment.after.update(function (userId, doc) {
    let preDoc = this.previous;
    let selector = {};
    let type = {
        term: doc.paymentType == 'term',
        group: doc.paymentType == 'group'
    };
    if (doc.balanceAmount > 0) {
        ReceivePayment.direct.update(doc._id, {$set: {status: 'partial'}});
        if(type.term){
            selector.$set = {status: 'partial'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: Invoices});
        }else{
            selector.$set = {status: 'partial'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: GroupInvoice});
        }
    } else if (doc.balanceAmount < 0) {
        ReceivePayment.direct.update(doc._id, {$set: {status: 'closed', paidAmount: doc.dueAmount, balanceAmount: 0}});
        if(type.term) {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: Invoices});
        }else{
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: GroupInvoice});
        }
    }
    else {
        ReceivePayment.direct.update(doc._id, {$set: {status: 'closed'}});
        if(type.term) {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: Invoices});
        }else{
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: GroupInvoice});
        }
    }
});

ReceivePayment.after.remove(function(userId, doc) {
    Meteor.call('insertRemovedPayment', doc);
});
function updateInvoiceOrInvoiceGroup({_id, selector,collection}) {
    collection.direct.update(_id, selector);
}
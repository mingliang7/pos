import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {Invoices} from '../../imports/api/collections/invoice';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
import {AccountMapping} from '../../imports/api/collections/accountMapping.js';

ReceivePayment.before.insert(function (userId, doc) {
    console.log(doc._id);
    doc._id = idGenerator.genWithPrefix(ReceivePayment, `${doc.branchId}-`, 9);
});
ReceivePayment.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ReceivePayment";
            let arChartAccount = AccountMapping.findOne({name: 'A/R'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            let saleDiscountChartAccount = AccountMapping.findOne({name: 'Sale Discount'});
            let discountAmount = doc.dueAmount * doc.discount / 100;
            data.total = doc.paidAmount + discountAmount;
            transaction.push({
                account: cashChartAccount.account,
                dr: doc.paidAmount,
                cr: 0,
                drcr: doc.paidAmount
            });
            if (discountAmount > 0) {
                transaction.push({
                    account: saleDiscountChartAccount.account,
                    dr: discountAmount,
                    cr: 0,
                    drcr: discountAmount
                });
            }
            transaction.push({
                account: arChartAccount.account,
                dr: 0,
                cr: doc.paidAmount + discountAmount,
                drcr: -doc.paidAmount + discountAmount
            });
            data.transaction = transaction;
            Meteor.call('insertAccountJournal', data);
            console.log(data);
        }
        //End Account Integration
    });
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
        if (type.term) {
            selector.$set = {status: 'partial'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: Invoices});
        } else {
            selector.$set = {status: 'partial'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: GroupInvoice});
        }
    } else if (doc.balanceAmount < 0) {
        ReceivePayment.direct.update(doc._id, {$set: {status: 'closed', paidAmount: doc.dueAmount, balanceAmount: 0}});
        if (type.term) {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: Invoices});
        } else {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: GroupInvoice});
        }
    }
    else {
        ReceivePayment.direct.update(doc._id, {$set: {status: 'closed'}});
        if (type.term) {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: Invoices});
        } else {
            selector.$set = {status: 'closed'};
            updateInvoiceOrInvoiceGroup({_id: doc.invoiceId, selector, collection: GroupInvoice});
        }
    }
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let transaction = [];
            let data = doc;
            data.type = "ReceivePayment";
            let arChartAccount = AccountMapping.findOne({name: 'A/R'});
            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
            let saleDiscountChartAccount = AccountMapping.findOne({name: 'Sale Discount'});
            let discountAmount = doc.dueAmount * doc.discount / 100;
            data.total = doc.paidAmount + discountAmount;
            transaction.push({
                account: cashChartAccount.account,
                dr: doc.paidAmount,
                cr: 0,
                drcr: doc.paidAmount
            });
            if (discountAmount > 0) {
                transaction.push({
                    account: saleDiscountChartAccount.account,
                    dr: discountAmount,
                    cr: 0,
                    drcr: discountAmount
                });
            }
            transaction.push({
                account: arChartAccount.account,
                dr: 0,
                cr: doc.paidAmount + discountAmount,
                drcr: -doc.paidAmount + discountAmount
            });
            data.transaction = transaction;
            Meteor.call('updateAccountJournal', data);
            console.log(data);
        }
        //End Account Integration
    });
});

ReceivePayment.after.remove(function (userId, doc) {
    Meteor.call('insertRemovedPayment', doc);
    Meteor.defer(function () {
        //Account Integration
        let setting = AccountIntegrationSetting.findOne();
        if (setting && setting.integrate) {
            let data = {_id: doc._id, type: 'ReceivePayment'};
            Meteor.call('removeAccountJournal', data);
        }
        //End Account Integration
    })
});
function updateInvoiceOrInvoiceGroup({_id, selector, collection}) {
    collection.direct.update(_id, selector);
}

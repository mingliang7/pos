import {Item} from '../../imports/api/collections/item';
import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {Penalty} from '../../imports/api/collections/penalty';
import {RemovedInvoice} from '../../imports/api/collections/removedCollection';
import {Reps} from '../../imports/api/collections/rep.js';
import {Customers} from '../../imports/api/collections/customer.js';
import {Invoices} from '../../imports/api/collections/invoice.js';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
import {Journal} from '../../../acc/imports/api/collections/journal.js';
Meteor.methods({
    insertRemovedInvoice(doc){
        if (doc.invoiceType == 'term' && (doc.status == 'partial' || doc.status == 'closed')) {
            ReceivePayment.remove({invoiceId: doc._id});
        }
        doc.status = 'removed';
        doc.removeDate = new Date();
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        RemovedInvoice.insert(doc);
    },
    calculateLateInvoice({invoices}){
        let count = 0;
        let penalty = Penalty.findOne({}, {sort: {_id: -1}}) || {rate: 0, notExist: true};
        let lateInvoices = [];
        let currentDate = moment();
        let calculatePenalty = {};
        invoices.forEach(function (invoice) {
            let invoiceDate = moment(invoice.dueDate);
            let numberOfDayLate = currentDate.diff(invoiceDate, 'days');
            if (numberOfDayLate > 0) {
                count += 1;
                if (invoice.status == 'partial') {
                    let lastReceivePayment = ReceivePayment.findOne({invoiceId: invoice._id}, {sort: {_id: -1}});
                    calculatePenalty[invoice._id] = math.round((lastReceivePayment.balanceAmount * (penalty.rate / 100) * numberOfDayLate), 6);
                } else {
                    calculatePenalty[invoice._id] = math.round((invoice.total * (penalty.rate / 100) * numberOfDayLate), 6);
                }
                lateInvoices.push(invoice._id);
            }
        });
        return {count, lateInvoices, calculatePenalty, penaltyNotExist: penalty.notExist || false};
    },
    invoiceShowItems({doc}){
        doc.staff = Meteor.users.findOne(doc.staffId).username || '';
        let customer = Customers.findOne({_id: doc.customerId});
        doc.customer = customer && customer.name || '';
        doc.items.forEach(function (item) {
            item.name = Item.findOne(item.itemId).name;
        });
        return doc;
    },
    updatedInvoiceInfo(doc){
        let setting = AccountIntegrationSetting.findOne();
        /*customerId
         repId*/
        // let des = "វិក្កយបត្រ អតិថិជនៈ ";
        let description = '';
        let descriptionPayment = '';
        let invoiceJournalSetObj = {};
        if (doc.repId) {
            let rep = Reps.findOne({_id: doc.repId});
            if (rep) {
                doc._rep = {name: rep.name};
            }
        }
        if (doc.customerId) {
            let customer = Customers.findOne({_id: doc.customerId});
            if (customer) {
               // doc._customer = {name: customer.name};
               /* ReceivePayment.direct.update(
                    {invoiceId: doc._id},
                    {$set: {customerId: doc.customerId, '_customer.name': customer.name}},
                    {multi: true});*/
                description = doc.des == "" || doc.des == null ? ("វិក្កយបត្រ អតិថិជនៈ " + customer.name) : doc.des;
                invoiceJournalSetObj.cusAndVenname = customer.name;
                invoiceJournalSetObj.memo = description;
                if (setting && setting.integrate) {
                    let payments = ReceivePayment.find({invoiceId: doc._id});
                    payments.forEach(function (payment) {
                        Journal.direct.update({refId: payment._id, refFrom: "ReceivePayment"},
                            {
                                $set: {
                                    cusAndVenname: customer.name,
                                    memo: "ទទួលការបង់ប្រាក់ពីវិក្កយបត្រៈ " + doc.voucherId

                                }
                            })
                    });
                    Journal.direct.update({refId: doc._id, refFrom: "Invoice"}, {$set: invoiceJournalSetObj});
                }
            }
        }
        Invoices.direct.update(doc._id, {$set: doc});
    },
    getCustomerBalanceForInvoice(customerId){
        let customer = Customers.findOne(customerId);
        let totalAmountDue = 0;
        let selector = {customerId: customerId, status: {$in: ['active', 'partial']}};
        let invoices = (customer && customer.termId) ? Invoices.find(selector) : GroupInvoice.find({
            vendorOrCustomerId: customerId,
            status: {$in: ['active', 'partial']}
        });
        if (invoices.count() > 0) {
            invoices.forEach(function (invoice) {
                let receivePayments = ReceivePayment.find({invoiceId: invoice._id}, {sort: {_id: 1, paymentDate: 1}});
                if (receivePayments.count() > 0) {
                    let lastPayment = _.last(receivePayments.fetch());
                    totalAmountDue += lastPayment.balanceAmount;
                } else {
                    totalAmountDue += invoice.total;
                }
            });
        }
        customer.balance = totalAmountDue;
        return customer;
    }
});
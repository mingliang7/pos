import {ReceivePayment} from '../../imports/api/collections/receivePayment';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
import {Invoices} from '../../imports/api/collections/invoice';
import {Customers} from '../../imports/api/collections/customer';
import {RemovedPayment} from '../../imports/api/collections/removedCollection';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting';
import {AccountMapping} from '../../imports/api/collections/accountMapping';
Meteor.methods({
    insertRemovedPayment(doc) {
        doc.status = 'removed';
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        doc.removeDate = new Date();
        RemovedPayment.insert(doc);
    },
    removedReceivePayment({doc}) {
        let payments = ReceivePayment.find({invoiceId: doc.invoiceId, status: {$ne: 'removed'}});
        let selector = {$set: {status: 'active'}, $unset: {closedAt: ''}};
        let collections = doc.paymentType == 'term' ? Invoices : GroupInvoice;
        if (payments.count() == 1) {
            collections.direct.update(doc.invoiceId, selector)
        } else {
            ReceivePayment.update({
                invoiceId: doc.invoiceId, status: {$ne: 'removed'},
                _id: {$ne: doc._id},
                $or: [
                    {paymentDate: {$gt: doc.paymentDate}},
                    {dueAmount: {$lt: doc.dueAmount}}
                ]
            }, {
                $inc: {dueAmount: doc.paidAmount, balanceAmount: doc.paidAmount},
                $set: {status: 'partial'}
            }, {multi: true});
            selector.$set.status = 'partial';
            selector.$unset.closedAt = '';
            collections.direct.update(doc.invoiceId, selector);
        }
        ReceivePayment.remove({_id: doc._id});
    },
    lookupReceivePaymentObj(id) {
        let customer = ReceivePayment.aggregate([
            {$match: {_id: id}},
            {
                $lookup: {
                    from: 'pos_customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customerDoc'
                }
            },
            {
                $unwind: {
                    path: '$customerDoc',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);
        return customer[0];
    },
    insertReceivePayment({invoicesObj, paymentDate, branch, voucherId}) {
            for (let k in invoicesObj) {
                let selector = {}
                let obj = {
                    invoiceId: k,
                    voucherId: voucherId,
                    paymentDate: paymentDate,
                    paidAmount: invoicesObj[k].receivedPay,
                    penalty: invoicesObj[k].penalty,
                    discount: invoicesObj[k].discount || 0,
                    dueAmount: invoicesObj[k].dueAmount,
                    balanceAmount: invoicesObj[k].dueAmount - invoicesObj[k].receivedPay,
                    customerId: invoicesObj[k].customerId || invoicesObj[k].vendorOrCustomerId,
                    status: invoicesObj[k].dueAmount - invoicesObj[k].receivedPay == 0 ? 'closed' : 'partial',
                    staffId: Meteor.userId(),
                    branchId: branch
                };
                let customer = Customers.findOne(obj.customerId);
                obj.paymentType = customer.termId ? 'term' : 'group';
                ReceivePayment.insert(obj, function (err, res) {
                    if (!err) {
                        //Account Integration
                        obj._id = res;
                        let setting = AccountIntegrationSetting.findOne();
                        if (setting && setting.integrate) {
                            let transaction = [];
                            let data = obj;
                            data.type = "ReceivePayment";
                            let arChartAccount = AccountMapping.findOne({name: 'A/R'});
                            let cashChartAccount = AccountMapping.findOne({name: 'Cash on Hand'});
                            let saleDiscountChartAccount = AccountMapping.findOne({name: 'Sale Discount'});
                            let discountAmount = math.round(obj.dueAmount * obj.discount / 100, 6);
                            data.total = math.round(obj.paidAmount + discountAmount, 6);
                            transaction.push({
                                account: cashChartAccount.account,
                                dr: obj.paidAmount,
                                cr: 0,
                                drcr: obj.paidAmount
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
                                cr: math.round(obj.paidAmount + discountAmount, 6),
                                drcr: -(math.round(obj.paidAmount + discountAmount, 6))
                            });
                            data.transaction = transaction;
                            let customerDoc = Customers.findOne({_id: obj.customerId});
                            if (customerDoc) {
                                data.name = customerDoc.name;
                                data.des = data.des == "" || data.des == null ? ('ទទួលការបង់ប្រាក់ពីវិក្កយបត្រៈ ' + invoicesObj[k].voucherId) : data.des;
                            }
                            data.journalDate = data.paymentDate;
                            insertAccountJournal(data);
                        }
                    }
                });
                if (obj.status == 'closed') {
                    selector.$set = {status: 'closed', closedAt: obj.paymentDate}
                } else {
                    selector.$set = {
                        status: 'partial',
                    };
                }
                if (customer.termId) {
                    Invoices.direct.update(k, selector)
                } else {
                    GroupInvoice.direct.update(k, selector);
                }
            }
            return true;
        }
});


function insertAccountJournal(doc){
    let id;
    let data = {};
    data.journalDate = doc.journalDate;
    data.branchId = doc.branchId;
    data.voucherId = doc.voucherId;
    data.currencyId = doc.currencyId == null ? 'USD' : doc.currencyId;
    data.memo = doc.des == null || doc.des == '' ? 'No Memo' : doc.des;
    data.refId = doc._id;
    data.refFrom = doc.type;
    data.total = doc.total;
    data.transaction = doc.transaction;
    data.cusAndVenname=doc.name;
    Meteor.call('api_journalInsert', data, function (err, res) {
        if (res) {
            id = res;
        }else{
            console.log('----------error in receive payment----------');
            console.log(err.message);
        }
    });
    return id;
}
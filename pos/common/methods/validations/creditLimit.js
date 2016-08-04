import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

//collection
import {ReceivePayment} from '../../../imports/api/collections/receivePayment';
import {Invoices} from '../../../imports/api/collections/invoice';
import {GroupInvoice} from '../../../imports/api/collections/groupInvoice';
export const checkCreditLimit = new ValidatedMethod({
    name: 'pos.checkCreditLimit',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        customerId: {
            type: String
        },
        customerInfo: {
            type: Object,
            blackbox: true
        }
    }).validator(),
    run({customerId, customerInfo})
    {
        if (!this.isSimulation) {
            let total = 0;
            let totalInvoiceOrGroupInvoice = 0;
            let receivePayment = 0;
            if (customerInfo.termId) {
                let invoices = Invoices.aggregate([
                    {
                        $match: {
                            customerId: customerId,
                            paymentGroupId: {$exists: false},
                            status: {$in: ['active']}
                        }
                    },
                    {$group: {_id: null, totalInvoice: {$sum: '$total'}}}
                ]);
                totalInvoiceOrGroupInvoice = _.isUndefined(invoices[0]) ? 0 : invoices[0].totalInvoice;
            } else {
                let groupInvoices = GroupInvoice.aggregate([
                    {
                        $match: {
                            vendorOrCustomerId: customerId,
                            status: {$in: ['active']}
                        }
                    },
                    {$group: {_id: null, totalGroupInvoice: {$sum: '$total'}}}
                ]);
                totalInvoiceOrGroupInvoice = _.isUndefined(groupInvoices[0]) ? 0 : groupInvoices[0].totalGroupInvoice;
            }
            let payment = ReceivePayment.aggregate([
                {$match: {customerId: customerId, status: {$in: ['active', 'partial']}}},
                {$group: {_id: null, totalBalance: {$sum: '$balanceAmount'}}}
            ]);
            receivePayment = _.isUndefined(payment[0]) ? 0 : payment[0].totalBalance;
            return receivePayment + totalInvoiceOrGroupInvoice;
        }
    }
});
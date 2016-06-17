import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
//collection
import {Invoices} from '../../imports/api/collections/invoice.js'
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';
// Check user password
export const receivePayment = new ValidatedMethod({
    name: 'pos.receivePayment',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        invoicesObj: {
            type: Object, blackbox: true
        },
        paymentDate: {type: Date}
    }).validator(),
    run({
        invoicesObj,paymentDate
    }) {
        if (!this.isSimulation) {
            for(let k in invoicesObj){
                let selector = {}
                let obj = {
                    invoiceId: k,
                    paymentDate: paymentDate,
                    paidAmount: invoicesObj[k].receivedPay,
                    dueAmount: invoicesObj[k].dueAmount,
                    balanceAmount: invoicesObj[k].dueAmount - invoicesObj[k].receivedPay,
                    customerId: invoicesObj[k].customerId,
                    status: invoicesObj[k].dueAmount - invoicesObj[k].receivedPay == 0 ? 'closed' : 'partial',
                    staffId: Meteor.userId()
                };
                ReceivePayment.insert(obj);
                obj.status == 'closed' ? selector.$set = {status: 'closed'} : selector.$set = {status: 'partial'};
                Invoices.direct.update(k,selector)
            }
            return true;
        }
    }
});

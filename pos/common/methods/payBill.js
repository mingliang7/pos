import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
//collection
import {EnterBills} from '../../imports/api/collections/enterBill.js'
import {PayBills} from '../../imports/api/collections/payBill.js';
// Check user password
export const payBill = new ValidatedMethod({
    name: 'pos.payBill',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        enterBillsObj: {
            type: Object, blackbox: true
        },
        paymentDate: {type: Date}
    }).validator(),
    run({
        enterBillsObj,paymentDate
    }) {
        if (!this.isSimulation) {
            for(let k in enterBillsObj){
                let selector = {}
                let obj = {
                    billId: k,
                    paymentDate: paymentDate,
                    paidAmount: enterBillsObj[k].receivedPay,
                    dueAmount: enterBillsObj[k].dueAmount,
                    balanceAmount: enterBillsObj[k].dueAmount - enterBillsObj[k].receivedPay,
                    vendorId: enterBillsObj[k].vendorId,
                    status: enterBillsObj[k].dueAmount - enterBillsObj[k].receivedPay == 0 ? 'closed' : 'partial',
                    staffId: Meteor.userId()
                };
                PayBills.insert(obj);
                obj.status == 'closed' ? selector.$set = {status: 'closed'} : selector.$set = {status: 'partial'};
                EnterBills.direct.update(k,selector)
            }
            return true;
        }
    }
});

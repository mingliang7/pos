import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
//collection
import {Order} from '../../imports/api/collections/order.js'
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';
// Check user password
export const amountDue = new ValidatedMethod({
    name: 'pos.amountDue',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        orderId: {
            type: String
        }
    }).validator(),
    run({
        orderId
    }) {
        if (!this.isSimulation) {
            let receivePayment = ReceivePayment.aggregate([{
                $sort: {
                    _id: 1,
                    paymentDate: 1
                }
            }, {
                $group: {
                    _id: '$_id',
                    lastPaymentDate: {
                        $last: "$paymentDate"
                    },
                    dueAmount: {
                        $sum: '$balanceAmount'
                    }
                }
            }]);
            return 11;
        }

    }
});

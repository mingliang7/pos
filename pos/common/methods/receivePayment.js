import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
//collection
import {Order} from '../../imports/api/collections/order.js'
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';
// Check user password
export const customerBalance = new ValidatedMethod({
    name: 'pos.customerBalance',
    validate: new SimpleSchema({
        customerId: {
            type: String
        }
    }).validator(),
    run({
        customerId
    }) {
        if (!this.isSimulation) {
            let totalBalance = 0;
            let orders = Order.find({customerId: customerId, status: 'active'});
            if(orders.count()>0){

            }
            return totalBalance;
        }
    }
});

//import {Meteor} from 'meteor/meteor';
import {Order} from '../../../imports/api/collections/order.js';
import {Invoices} from '../../../imports/api/collections/invoice.js';
import {ReceivePayment} from '../../../imports/api/collections/receivePayment.js'
import {ExchangeRingPulls} from '../../../imports/api/collections/exchangeRingPull'
Meteor.methods({
    isCustomerHasRelation: function (id) {
        let order = Order.findOne({customerId: id});
        let invoice = Invoices.findOne({customerId: id});
        let receivePayment = ReceivePayment.findOne({customerId: id});
        let exchangeRingPull = ExchangeRingPulls.findOne({customerId: id});
        if (order || invoice || receivePayment || exchangeRingPull) {
            return true;
        }
        return false;
    }
});


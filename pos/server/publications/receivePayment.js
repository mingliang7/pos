import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Order} from '../../imports/api/collections/order.js';

Meteor.publish('pos.activeOrder', function posActiveOrder(selector) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        // options: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        let data = Order.find(selector);
        return data;
    }
    return this.ready();
});

import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Invoices} from '../../imports/api/collections/invoice.js';

Meteor.publish('pos.activeInvoices', function posActiveOrder(selector) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        // options: {type: Object, blackbox: true}
    }).validate({selector});
    if (this.userId) {
        let data = Invoices.find(selector);
        return data;
    }
    return this.ready();
});

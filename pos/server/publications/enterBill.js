import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';

// Collection
import {EnterBills} from '../../imports/api/collections/enterBill.js';

Meteor.publish('pos.enterBill', function posEnterBill(selector = {}, options = {}) {
    this.unblock();

    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});

    if (this.userId) {
        let data = EnterBills.find(selector, options);
        return data;
    }

    return this.ready();
});

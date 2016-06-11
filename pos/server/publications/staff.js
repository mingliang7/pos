import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Staffs} from '../../imports/api/collections/staff.js';

Meteor.publish('pos.staff', function posStaff(selector = {}, options = {}) {
    this.unblock();
    new SimpleSchema({
        selector: {type: Object, blackbox: true},
        options: {type: Object, blackbox: true}
    }).validate({selector, options});
    if (this.userId) {
        let data = Staffs.find(selector, options);
        return data;
    }
    return this.ready();
});

// Reactive Table
ReactiveTable.publish("pos.reactiveTable.staff", Staffs);
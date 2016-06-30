import {Meteor} from 'meteor/meteor';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';
Meteor.startup(function () {
    GroupInvoice._ensureIndex({startDate: 1, endDate: 1, vendorOrCustomerId: 1});
});
//import {Meteor} from 'meteor/meteor';
import {Customers} from '../../../imports/api/collections/customer.js'
import {Vendors} from '../../../imports/api/collections/vendor.js'
Meteor.methods({
    isRepHasRelation: function (id) {
        let anyRelation = Vendors.findOne({repId: id}) || Customers.findOne({repId: id});
        return !!anyRelation;
    }
});


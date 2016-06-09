import {Customers} from '../../imports/api/collections/customer.js';

Meteor.methods({
    isPaymentGroupHasRelation: function (id) {
        let customer = Customers.findOne({paymentGroupId: id});
        if (customer) {
            return true;
        }
        return false;
    }
});


import {Vendors} from '../../imports/api/collections/vendor';
Meteor.methods({
    getVendor({vendorId}){
        return Vendors.findOne(vendorId);
    }
});
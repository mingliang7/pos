import {WhiteListCustomer} from '../../imports/api/collections/whiteListCustomer';
Meteor.methods({
    reduceWhiteListCustomerLimitTimeByOne({whiteListCustomer}){
        WhiteListCustomer.direct.update(whiteListCustomer._id, {$inc: {limitTimes: -1}});
    }
});
import {Meteor} from 'meteor/meteor';
import {LocationTransfers} from '../../imports/api/collections/locationTransfer';
Meteor.methods({
    countTransferLocation(branchId){
        return LocationTransfers.find({toBranchId: branchId, pending: true}).count();
    }
});
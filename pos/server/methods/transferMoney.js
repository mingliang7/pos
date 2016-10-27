import {TransferMoney} from '../../imports/api/collections/transferMoney';

Meteor.methods({
    loadMoreTransferMoney({branchId, status, pending}){
        return TransferMoney.find({toBranchId: branchId, pending: pending, status: status}).count();
    },
});
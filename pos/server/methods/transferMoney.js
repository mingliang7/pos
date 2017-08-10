import {TransferMoney} from '../../imports/api/collections/transferMoney';

Meteor.methods({
    loadMoreTransferMoney({branchId, status, pending}){
        return TransferMoney.find({toBranchId: branchId, pending: pending, status: status}).count();
    },
    transferMoneyLookup({doc}){
        let transferMoney = TransferMoney.aggregate([
            {
                $match: {_id: doc._id}
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'toUserId',
                    foreignField: '_id',
                    as: '_toUser'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'fromUserId',
                    foreignField: '_id',
                    as: '_fromUser'
                }
            },
            {
                $lookup: {
                    from: 'core_branch',
                    localField: 'fromBranchId',
                    foreignField: '_id',
                    as: '_fromBranch',
                }
            },
            {
                $lookup: {
                    from: 'core_branch',
                    localField: 'toBranchId',
                    foreignField: '_id',
                    as: '_toBranch',
                }
            },
            {$unwind: {path: '$_toUser', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_fromUser', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_toBranch', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_fromBranch', preserveNullAndEmptyArrays: true}}
        ]);
        return transferMoney[0];
    }
});
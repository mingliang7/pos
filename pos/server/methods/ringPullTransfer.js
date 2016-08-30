import {RingPullTransfers} from '../../imports/api/collections/ringPullTransfer';

Meteor.methods({
    loadMoreRingPull({branchId, status, pending}){
        return RingPullTransfers.find({toBranchId: branchId, pending: pending, status: status}).count();
    },
    lookupRingPull({doc}){
        let ringPull = RingPullTransfers.aggregate([
            {$match: {_id: doc._id}},
            {
                $lookup: {
                    from: "core_branch",
                    localField: "fromBranchId",
                    foreignField: "_id",
                    as: "_fromBranch"
                }
            },
            {
                $lookup: {
                    from: "core_branch",
                    localField: "toBranchId",
                    foreignField: "_id",
                    as: "_toBranch"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "fromUserId",
                    foreignField: "_id",
                    as: "_fromUser"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "toUserId",
                    foreignField: "_id",
                    as: "_toUser"
                }
            },
            {$unwind: {path: '$_fromBranch', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_toBranch', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_fromUser', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_toUser', preserveNullAndEmptyArrays: true}},
        ]);
        return ringPull[0];
    }
});
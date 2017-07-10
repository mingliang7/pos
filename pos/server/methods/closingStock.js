import {ClosingStockBalance} from '../../imports/api/collections/closingStock';
Meteor.methods({
    removeClosingStock({_id, closingDateString, branchId}){
        let currentClosingStock = ClosingStockBalance.findOne({
            branchId,
            closingDateString: {$gt: closingDateString}
        }, {sort: {closingDateString: -1}});
        if (currentClosingStock) {
            throw new Meteor.Error(`Please Remove ${currentClosingStock.closingDateString} first!`);
        } else {
            ClosingStockBalance.remove({_id});
        }
    },
    removeClosingStockByBranch({branchId}){
        ClosingStockBalance.remove({branchId});
    }
});
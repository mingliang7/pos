import  {LendingStocks} from '../../imports/api/collections/lendingStock';
Meteor.methods({
    lendingStockShow({_id}){
        let lendingStock = LendingStocks.aggregate([
            {$match: {_id: _id}},
            {$unwind: {path: '$items', preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "pos_item",
                    localField: "items.itemId",
                    foreignField: "_id",
                    as: "itemDoc"
                }
            },
            {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
            {
                $group: {
                    _id: '$_id',
                    items: {
                        $addToSet: {
                            itemName: '$itemDoc.name',
                            qty: '$items.qty',
                            price: '$items.price',
                            amount: '$items.amount',
                            remainQty: '$items.remainQty'
                        }
                    },
                    vendor: {$last: '$_vendor'},
                    branchId: {$last: '$branchId'},
                    lendingStockDate: {$last: '$lendingStockDate'},
                    status: {$last: '$status'},
                    total: {$last: '$total'},
                    voucherId: {$last: '$voucherId'},
                    sumRemainQty: {$last: 'sumRemainQty'}
                }
            }
        ]);
        if (lendingStock.length > 0) {
            return lendingStock[0];
        }
        return {};
    }
});
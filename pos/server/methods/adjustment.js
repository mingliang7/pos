import {Adjustments} from '../../imports/api/collections/adjustment';
Meteor.methods({
    adjustmentShow({_id}){
        let adjustment = Adjustments.aggregate([
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
                            qtyOnHand: '$items.qtyOnHand',
                            qty: '$items.qty',
                            remainQty: '$items.remainQty',
                            price: '$items.price',
                            amount: '$items.amount',
                        }
                    },
                    branchId: {$last: '$branchId'},
                    adjustmentDate: {$last: '$adjustmentDate'},
                    status: {$last: '$status'},
                    total: {$last: '$total'},
                }
            }
        ]);
        if (adjustment.length > 0) {
            return adjustment[0];
        }
        return {};
    }
});
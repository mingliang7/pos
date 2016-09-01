import {StockAndAccountMapping} from '../../imports/api/collections/stockAndAccountMapping';
Meteor.methods({
    stockAndAccountMappingInfo(selector = {}){
        let stockAndAccountMapping = StockAndAccountMapping.aggregate([
            {$match: selector},
            {
                $unwind: {
                    path: '$stockLocations', preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "pos_stockLocations",
                    localField: "stockLocations",
                    foreignField: "_id",
                    as: "stockLocationsDoc"
                }
            },
            {$unwind: {path: '$stockLocationsDoc', preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDoc"
                }
            },
            {$unwind: {path: '$userDoc', preserveNullAndEmptyArrays: true}},
            {
                $group: {
                    _id: '$_id',
                    username: {
                        $last: '$userDoc.username'
                    },
                    userId: {
                        $last: '$userId'
                    },
                    stockLocations: {
                        $addToSet: {
                            name: '$stockLocationsDoc.name'
                        }
                    }

                }
            }
        ]);
        console.log(stockAndAccountMapping[0]);
        return stockAndAccountMapping[0];
    },
    currentUserStockAndAccountMappingDoc({userId}){
        let userDoc = StockAndAccountMapping.findOne({userId: userId});
        return userDoc;
    }
});
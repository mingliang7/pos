import {StockAndAccountMapping} from '../../imports/api/collections/stockAndAccountMapping';
import {Company} from '../../../core/imports/api/collections/company';
import {AccountIntegrationSetting} from '../../imports/api/collections/accountIntegrationSetting.js';
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
        return stockAndAccountMapping[0];
    },
    currentUserStockAndAccountMappingDoc({userId, branchId}){
        let company = Company.findOne({});
        let userDoc = StockAndAccountMapping.findOne({userId: userId, branchId: branchId}) || {};
        let accountIntegration = AccountIntegrationSetting.findOne();
        userDoc.company = company;
        userDoc.accountIntegrated = accountIntegration.integrate;
        return userDoc;
    }
});
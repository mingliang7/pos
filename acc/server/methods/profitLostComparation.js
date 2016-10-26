import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Journal} from '../../imports/api/collections/journal';
import {CloseChartAccount} from '../../imports/api/collections/closeChartAccount';
import {ChartAccount} from '../../imports/api/collections/chartAccount';

Meteor.methods({
    getProfitLostComparation: function (selector, showNonActive) {
        var result = Journal.aggregate([{
            $unwind: "$transaction"
        }, {
            $match: {
                'transaction.accountDoc.accountTypeId': {$in: ['40', '41', '50', '51']}
            }
        },
            {
                $project: {
                    _id: 1,
                    currencyId: 1,
                    month: {$month: "$journalDate"},
                    year: {$year: "$journalDate"},
                    transaction: {
                        drcr: 1,
                        account: "$transaction.accountDoc._id",
                        code: "$transaction.accountDoc.code",
                        name: "$transaction.accountDoc.name",
                        accountTypeId: "$transaction.accountDoc.accountTypeId",
                        level: "$transaction.accountDoc.level",
                        parent: "$transaction.accountDoc.parentId"

                    },
                    journalDate: 1,

                }
            },
            {
                $group: {
                    _id: {
                        month: "$month",
                        year: "$year",
                        currencyId: "$currencyId",
                        account: "$transaction.account",
                        code: "$transaction.code",
                        name: "$transaction.name",
                        accountTypeId: "$transaction.accountTypeId",
                        level: "$transaction.level",
                        parent: "$transaction.parent"

                    },
                    journalDate: {$last: "$journalDate"},
                    value: {$sum: '$transaction.drcr'}
                }
            },
            {$sort: {journalDate: -1}}

        ]);
        return result;
    },

    getProfitLostGroupByMonth: function (selector, showNonActive) {
        var result = Journal.aggregate([{
            $unwind: "$transaction"
        }, {
            $match: {
                'transaction.accountDoc.accountTypeId': {$in: ['40', '41', '50', '51']}
            }
        },
            {
                $project: {
                    _id: 1,
                    currencyId: 1,
                    month: {$month: "$journalDate"},
                    year: {$year: "$journalDate"},
                    transaction: {
                        drcr: 1
                    },
                    journalDate: 1,
                    accountType: {
                        $cond: [
                            {
                                $or: [
                                    {$eq: ["$transaction.accountDoc.accountTypeId", "40"]},
                                    {$eq: ["$transaction.accountDoc.accountTypeId", '41']}
                                ]
                            }, "Income", "Expense"]
                    }


                }
            },
            {
                $group: {
                    _id: {
                        month: "$month",
                        year: "$year",
                        currencyId: "$currencyId",
                        accountType: "$accountType"
                    },
                    journalDate: {$last: "$journalDate"},
                    value: {$sum: '$transaction.drcr'}
                }
            },
            {$sort: {journalDate: -1}}

        ]);


        


        return result;
    }
})




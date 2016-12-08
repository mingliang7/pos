import {Invoices} from '../../../imports/api/collections/invoice';
Meteor.methods({
    'dashboard.customerTotalCredit'({date}){
        Meteor._sleepForMs(100);
        let obj = {dataByBranches: [], footer: {total: 0, paidAmount: 0, balanceAmount: 0}, branches: []};
        let invoices = Invoices.aggregate([
            {$match: {status: {$in: ["active", "partial"]}, invoiceType: {$ne: 'group'}}},
            {
                $lookup: {
                    from: 'pos_receivePayment',
                    localField: '_id',
                    foreignField: 'invoiceId',
                    as: 'paymentDoc'
                }
            },
            {
                $unwind: {path: '$paymentDoc', preserveNullAndEmptyArrays: true}
            },
            {
                $project: {
                    _id: 1,
                    customerId: 1,
                    total: 1,
                    branchId: 1,
                    paidCount: {
                        $cond: [
                            {
                                $eq: [
                                    {$type: '$paymentDoc'}, 'missing'],
                            },
                            0, 1
                        ]
                    },
                    paidAmount: {
                        $cond: [
                            {
                                $lte: ["$paymentDoc.paymentDate", date]
                            },
                            '$paymentDoc.paidAmount',
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: {invoiceId: '$_id', branchId: '$branchId'},
                    invoiceCount: {$last: 1},
                    paidCount: {$sum: '$paidCount'},
                    total: {$last: '$total'},
                    paidAmount: {$sum: '$paidAmount'}
                }
            },
            {
                $group: {
                    _id: '$_id.branchId',
                    invoiceCount: {$sum: 1},
                    paidCount: {$sum: '$paidCount'},
                    total: {$sum: '$total'},
                    paidAmount: {$sum: '$paidAmount'},
                }
            },
            {
                $project: {
                    _id: 1,
                    invoiceCount: 1,
                    paidCount: 1,
                    total: 1,
                    paidAmount: 1,
                    balanceAmount: {$subtract: ["$total", "$paidAmount"]}
                }
            },
            {
                $lookup: {
                    from: 'core_branch',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'branchDoc'
                }
            },
            {$unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}},
            {$sort: {'branchDoc.khName': 1}},
            {
                $group: {
                    _id: null,
                    branches: {
                        $push: '$branchDoc'
                    },
                    data: {
                        $push: '$$ROOT'
                    },
                    total: {$sum: '$total'},
                    paidAmount: {$sum: '$paidAmount'},
                    balanceAmount: {$sum: '$balanceAmount'}
                }
            }
        ]);
        if (invoices.length > 0) {
            obj.dataByBranches = invoices[0].data;
            obj.branches = invoices[0].branches;
            obj.footer.total = invoices[0].total;
            obj.footer.paidAmoun = invoices[0].paidAmount;
            obj.footer.balanceAmount = invoices[0].balanceAmount;
        }
        return obj;
    },
    'dashboard.dailySale'({date}){
        let obj = {dataByBranches: [], footer: {total: 0, paidAmount: 0, balanceAmount: 0}, branches: []};
        let toDate = moment(date).endOf('days').toDate();
        let fromDate = moment(date).startOf('days').toDate();
        let dailySale = Invoices.aggregate([
            {
                $match: {
                    invoiceDate: {$gte: fromDate, $lte: toDate}, invoiceType: {$ne: 'group'}
                }
            },
            {
                $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
            },
            {
                $lookup: {
                    from: "pos_item",
                    localField: "items.itemId",
                    foreignField: "_id",
                    as: "items.itemsDoc"
                }
            },
            {
                $unwind: {path: '$items.itemsDoc', preserveNullAndEmptyArrays: true}
            },
            {
                $group: {
                    _id: '$branchId',
                    items: {
                        $push: '$items'
                    },
                    total: {$sum: '$total'}
                }
            },
            {
                $lookup: {
                    from: "core_branch",
                    localField: "_id",
                    foreignField: "_id",
                    as: "branchDoc"
                }
            },
            {
                $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
            },
            {$sort: {'branchDoc.khName': 1}},
            {
                $group: {
                    _id: null,
                    branches: {
                      $push: '$branchDoc'
                    },
                    data: {
                        $push: '$$ROOT'
                    },
                    total: {
                        $sum: '$total'
                    }
                }
            }
        ]);
        if (dailySale.length > 0) {
            obj.dataByBranches = dailySale[0].data;
            obj.branches = dailySale[0].branches;
            obj.footer.total = dailySale[0].total;
        }
        return obj;
    }
});
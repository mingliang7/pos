import {Invoices} from '../../../imports/api/collections/invoice';
Meteor.methods({
    'dashboard.customerTotalCredit'({date}){
        Meteor._sleepForMs(2000);
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
                    paidAmount: {
                        $cond: [
                            {
                                $lt: ["$paymentDoc.paymentDate", date]
                            },
                            '$paymentDoc.paidAmount',
                            0
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$branchId',
                    total: {$sum: '$total'},
                    paidAmount: {$sum: '$paidAmount'},
                }
            },
            {
                $project: {
                    _id: 1,
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
    }
});
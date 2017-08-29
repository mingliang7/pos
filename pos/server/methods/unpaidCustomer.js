import {Invoices} from '../../imports/api/collections/invoice';


Meteor.methods({
    showCustomerUnpaid(customerId,queryDate){
        let date = moment(queryDate).endOf('days').toDate();
        let invoices = Invoices.aggregate([
            {
                $match: {customerId: customerId}
            },
            {
                $lookup: {
                    from: 'pos_receivePayment',
                    localField: '_id',
                    foreignField: 'invoiceId',
                    as: 'paymentDoc'
                }
            },

            {
                $project: {
                    _id: 1,
                    customerId: 1,
                    invoiceId: 1,
                    voucherId: 1,
                    invoiceDate: 1,
                    dueDate: 1,
                    total: 1,
                    paymentDoc: {
                        $filter: {
                            input: '$paymentDoc',
                            as: 'payment',
                            cond: {$lte: ['$$payment.paymentDate', date]}
                        }
                    }
                }
            },
            {
                $unwind: {
                    path: '$paymentDoc',
                    preserveNullAndEmptyArrays: true
                }
            },
            {$sort: {'paymentDoc.paymentDate': 1}},
            {
                $project: {
                    _id: 1,
                    voucherId: 1,
                    status: 1,
                    invoiceDate: 1,
                    dueDate: 1,
                    customerId: 1,
                    total: 1,
                    lastPaymentDate: '$paymentDoc.paymentDate',
                    paymentDoc: 1,
                }
            },
            {
                $group: {
                    _id: '$_id',
                    voucherId: {$last: '$voucherId'},
                    status: {$last: '$status'},
                    dueDate: {$last: '$dueDate'},
                    invoiceDoc: {$last: '$$ROOT'},
                    lastPaymentDate: {$last: '$lastPaymentDate'},
                    dueAmount: {
                        $last: '$paymentDoc.dueAmount'
                    },
                    paidAmount: {
                        $last: '$paymentDoc.paidAmount'
                    },
                    paymentDoc: {$last: '$paymentDoc'},
                    total: {$last: '$total'},
                    invoiceDate: {$last: '$invoiceDate'}
                }
            },
            {
                $project: {
                    _id: 1,
                    voucherId: 1,
                    invoice: {$concat: 'Invoice'},
                    invoiceDoc: {
                        customerId: 1,
                        invoiceDate: 1
                    },
                    dueAmount: {
                        $ifNull: ["$dueAmount", "$total"]
                    },
                    paidAmount: {
                        $ifNull: ["$paidAmount", 0]
                    },
                    invoiceDate: 1,
                    dueDate: 1,
                    lastPaymentDate: {
                        $ifNull: ["$lastPaymentDate", "None"]
                    },
                    status: 1,
                    total: '$total'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    invoice: {$last: '$invoice'},
                    voucherId: {$last: '$voucherId'},
                    invoiceDoc: {$last: '$invoiceDoc'},
                    dueAmount: {$last: '$dueAmount'},
                    paidAmount: {$last: '$paidAmount'},
                    balance: {$last: {$subtract: ["$dueAmount", "$paidAmount"]}},
                    invoiceDate: {$last: '$invoiceDate'},
                    dueDate: {$last: '$dueDate'},
                    lastPaymentDate: {$last: '$lastPaymentDate'},
                    status: {$last: '$status'},
                    total: {$last: '$total'}
                }
            },
            {
                $redact: {
                    $cond: {if: {$gt: ['$balance', 0]}, then: '$$KEEP', else: '$$PRUNE'}
                }
            },
            {$sort: {invoiceDate: 1}},
            {
                $group: {
                    _id: '$invoiceDoc.customerId',
                    data: {
                        $push: '$$ROOT'
                    },
                    dueDate: {$last: '$dueDate'},
                    invoiceDate: {$last: '$invoiceDate'},
                    lastPaymentDate: {$last: '$lastPaymentDate'},
                    dueAmountSubTotal: {$sum: '$dueAmount'},
                    paidAmount: {$sum: '$paidAmount'},
                    balance: {$sum: '$balance'}
                }
            },
            {
                $lookup: {
                    from: "pos_customers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customerDoc"
                }
            },
            {
                $unwind: {path: '$customerDoc', preserveNullAndEmptyArrays: true}
            },
            {
                $lookup: {
                    from: "pos_reps",
                    localField: "customerDoc.repId",
                    foreignField: "_id",
                    as: "customerDoc.repDoc"
                }
            },
            {
                $unwind: {path: '$customerDoc.repDoc', preserveNullAndEmptyArrays: true}
            },

            {
                $group: {
                    _id: null,
                    data: {
                        $push: '$$ROOT'
                    },
                    grandDueAmount: {$sum: '$dueAmountSubTotal'},
                    grandPaidAmount: {$sum: '$paidAmount'},
                    grandBalance: {$sum: '$balance'}
                }
            }
        ]);
        return invoices[0] && invoices[0].data && invoices[0].data[0] || null;
    }
});
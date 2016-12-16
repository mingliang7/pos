import {Invoices} from '../../../imports/api/collections/invoice';

Meteor.methods({
    printPayment({invoiceId}){
        let invoice = Invoices.aggregate([
            {$match: {_id: invoiceId}},
            {
                $lookup: {
                    from: "pos_customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "_customer"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "staffId",
                    foreignField: "_id",
                    as: "_staff"
                }
            },
            {$unwind: {path: '$_customer', preserveNullAndEmptyArrays: true}},
            {$unwind: {path: '$_staff', preserveNullAndEmptyArrays: true}},
            {
                $lookup: {
                    from: "pos_receivePayment",
                    localField: "_id",
                    foreignField: "invoiceId",
                    as: "paymentDoc"
                }
            },
            {
                $project: {
                    sale: {
                        _id: '$_id',
                        _customer: '$_customer',
                        _staff: '$_staff',
                        saleDate: '$invoiceDate',
                        total: '$total',
                        subTotal: '$subTotal',
                        discount: '$discount'
                    },
                    saleDetails: '$items',
                    paymentObj: {
                        paidAmount: {$sum: "$paymentDoc.paidAmount"},
                        balanceAmount: {$subtract: ['$total', {$sum: "$paymentDoc.paidAmount"}]}
                    }
                }
            }
        ]);
        if(invoice.length>0) {
            console.log(invoice[0]);
            return invoice[0];
        }
        return [{}];
    }
});
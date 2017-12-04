import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from 'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {Order} from '../../../imports/api/collections/order';
import {Exchange} from '../../../../core/imports/api/collections/exchange';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import {exchangeCoefficient} from '../../../imports/api/libs/exchangeCoefficient';
import ReportFn from "../../../imports/api/libs/report";

export const customerDeposit = new ValidatedMethod({
    name: 'pos.customerDeposit',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {
                totalDue: 0,
                totalPaid: 0,
                totalBalance: 0
            };
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let locationSelector = {
                'customerDoc.locationId': {$ne: ''}
            };
            let branchId = [];
            if (params.branchId) {
                branchId = params.branchId.split(',');
                selector.branchId = {
                    $in: branchId
                };
                selector = ReportFn.checkIfUserHasRights({currentUser: Meteor.userId(), selector});
            }
            if (params.customerId) {
                selector.customerId = params.customerId;
            }
            if (params.reps) {
                selector.repId = params.reps.split(',');
            }
            if (params.locationId) {
                locationSelector = {
                    'customerDoc.locationId': {$eq: params.locationId}
                };
            }
            if(params.status) {
                selector.status = params.status;
            }
            /****** Content *****/
            let orders = Order.aggregate([
                {$match: selector},
                {
                    $lookup: {
                        from: 'pos_invoices',
                        localField: "_id",
                        foreignField: 'saleId',
                        as: 'invoiceDoc'
                    }
                },
                {
                    $lookup: {
                        from: 'pos_customers',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: 'customerDoc'
                    }
                },
                {$unwind: {path: '$customerDoc', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$invoiceDoc', preserveNullAndEmptyArrays: true}},
                {
                    $project: {
                        _id: 1,
                        customerDoc: 1,
                        deposit: 1,
                        total: 1,
                        saleVoucher: {$ifNull: ['$voucherId', '$_id']},
                        invoiceVoucher: {$ifNull: ['$invoiceDoc.voucherId', '$_id']},
                        balance: {
                            $abs: {
                                $subtract: [
                                    '$deposit', {
                                        $sum:
                                            {
                                                $ifNull: ['$invoiceDoc.items.amount', '$deposit']
                                            }
                                    }
                                ]
                            }
                        },
                        totalInInvoice: {
                            $sum: '$invoiceDoc.items.amount'
                        },

                    }
                },
                {$match: locationSelector},
                {
                    $group: {
                        _id: null,
                        data: {
                            $push: '$$ROOT'
                        },
                        total: {$sum: '$total'},
                        totalDeposit: {$sum: '$deposit'},
                        totalInInvoice: {$sum: '$totalInInvoice'},
                        totalBalance: {
                            $sum: {$abs: '$balance'}
                        }
                    }
                }
            ]);
            if (orders.length > 0) {
                data.content = orders[0].data;
                data.footer = {
                    total: orders[0].total,
                    totalDeposit: orders[0].totalDeposit,
                    totalBalance: orders[0].totalBalance,
                    totalInInvoice: orders[0].totalInInvoice
                }
            }
            return data;
        }
    }
});

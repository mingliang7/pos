import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {PrepaidOrders} from '../../../imports/api/collections/prepaidOrder';
import {Item} from '../../../imports/api/collections/item';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
import ReportFn from '../../../imports/api/libs/report';
export const prepaidOrderDetail = new ValidatedMethod({
    name: 'pos.prepaidOrderDetail',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let project = {};
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let branchId = [];
            if(params.branchId) {
                branchId = params.branchId.split(',');
                selector.branchId = {
                    $in: branchId
                };
                selector = ReportFn.checkIfUserHasRights({currentUser: Meteor.userId(), selector});
            }
            selector.status = {$in: ['active', 'closed']};
            if (params.date) {
                let dateAsArray = params.date.split(',');
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
                selector.prepaidOrderDate = {$gte: fromDate, $lte: toDate};
            }
            if (params.vendor && params.vendor != '') {
                selector.vendorId = params.vendor;
            }
            if (params.filter && params.filter != '') {
                let filters = params.filter.split(','); //map specific field
                for (let i = 0; i < filters.length; i++) {
                    data.fields.push({field: correctFieldLabel(filters[i])});
                    data.displayFields.push({field: filters[i]});
                    project[filters[i]] = `$${filters[i]}`;
                    if (filters[i] == 'customerId') {
                        project['_customer'] = '$_customer'
                    }
                }
                data.fields.push({field: 'Total'}); //map total field for default
                data.displayFields.push({field: 'total'});
                project['total'] = '$total'; //get total projection for default
            } else {
                project = {
                    '_id': '$_id',
                    'prepaidOrderDate': '$prepaidOrderDate',
                    'vendor': '$_vendor.name',
                    'status': '$status',
                    'sumRemainQty': '$sumRemainQty',
                    'total': '$total'
                };
                data.fields = [{field: '#ID'}, {field: 'Date'}, {field: 'Vendor'}, {field: 'Tel'},{field: 'Status'}, {field: 'Remain Qty'}, {field: 'Total'}];
                data.displayFields = [{field: '_id'}, {field: 'prepaidOrderDate'}, {field: 'vendor'}, {field: 'telephone'},{field: 'status'}, {field: 'sumRemainQty'}, {field: 'total'}];
            }

            /****** Title *****/
            data.title.company = Company.findOne();

            /****** Content *****/
            let prepaidOrders = PrepaidOrders.aggregate([
                {$match: selector},
                {
                    $lookup: {
                        from: "pos_receiveItems",
                        localField: "_id",
                        foreignField: "prepaidOrderId",
                        as: "receiveItemsDoc"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        vendorId: 1,
                        sumRemainQty: 1,
                        status: 1,
                        branchId: 1,
                        prepaidOrderDate: 1,
                        total: 1,
                        receiveItemsDoc: 1,
                        sumRemainQty: 1,
                        items: 1,
                        receiveItemsDocExist: {
                            $cond: [
                                {
                                    $gt: [{$size: '$receiveItemsDoc'}, 0]
                                },
                                'true',
                                'false'
                            ]
                        }
                    }
                },
                {
                    $unwind: {path: '$receiveItemsDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $unwind: {path: '$receiveItemsDoc.items', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 1,
                        vendorId: 1,
                        branchId: 1,
                        status: 1,
                        prepaidOrderDate: 1,
                        sumRemainQty: 1,
                        total: 1,
                        items: 1,
                        receiveItemsDoc: 1,
                        balance: {
                            $cond: [
                                {
                                    $eq: ["$receiveItemsDocExist", "false"]
                                },
                                {$sum: '$sumRemainQty'},
                                {$sum: '$receiveItemsDoc.items.qty'}
                            ]
                        }
                    }
                },
                {
                    $lookup: {
                        from: "pos_vendors",
                        localField: "vendorId",
                        foreignField: "_id",
                        as: "vendorDoc"
                    }
                },
                {
                    $unwind: {path: '$vendorDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $group: {
                        _id: '$_id',
                        sumRemainQty: {$last: '$sumRemainQty'},
                        status: {$last: '$status'},
                        vendorDoc: {$last: '$vendorDoc'},
                        branchId: {$last: '$branchId'},
                        prepaidOrderDate: {$last: '$prepaidOrderDate'},
                        balance: {$sum: '$balance'},
                        items: {$last: '$items'},
                        total: {$last: '$total'},
                        receiveItemsDoc: {
                            $addToSet: '$receiveItemsDoc.items'
                        }

                    }
                },

            ]);

            prepaidOrders.forEach(function (doc) {
                doc.items.forEach(function (item) {
                    let balance = item.qty;
                    let itemDoc = Item.findOne(item.itemId);
                    let arr = [];
                    arr.push({
                        itemName: itemDoc ? itemDoc.name : '',
                        order: item.qty,
                        receive: 0,
                        balance: item.qty,
                        price: item.price,
                        amount: item.amount
                    });

                    if (doc.receiveItemsDoc.length > 0) {
                        doc.receiveItemsDoc.forEach(function (receiveItem) {
                            if (item.itemId == receiveItem.itemId) {
                                receiveItem.order = 0;
                                receiveItem.receive = receiveItem.qty;
                                receiveItem.balance = balance - receiveItem.qty;
                                receiveItem.amount = (balance - receiveItem.qty) * receiveItem.price;
                                balance = balance - receiveItem.qty
                                arr.push(receiveItem);
                            }
                        });
                    }
                    item.receiveItemsDoc = arr;
                })
            });
            if (prepaidOrders.length > 0) {
                let sortData = _.sortBy(prepaidOrders[0].data, '_id');
                prepaidOrders[0].data = sortData;
                data.content = prepaidOrders;
                // data.footer.total = total[0].total;
                // data.footer.totalRemainQty = total[0].totalRemainQty
            }
            return data
        }
    }
});

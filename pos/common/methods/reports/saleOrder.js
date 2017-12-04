import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from 'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {Order} from '../../../imports/api/collections/order';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';

export const saleOrderReport = new ValidatedMethod({
    name: 'pos.saleOrderReport',
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
            let branch = [];
            let user = Meteor.users.findOne(Meteor.userId());
            // console.log(user);
            // let date = _.trim(_.words(params.date, /[^To]+/g));
            selector.status = {$in: ['active', 'closed']};
            let locationSelector = {
                '_customer.locationId': {$ne: ''}
            };
            if (params.date) {
                let dateAsArray = params.date.split(',')
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
                selector.orderDate = {$gte: fromDate, $lte: toDate};
            }
            if (params.customer && params.customer != '') {
                selector.customerId = params.customer;
            }
            if (params.locationId) {
                locationSelector = {
                    '_customer.locationId': params.locationId
                };
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
                    'orderDate': '$orderDate',
                    'customer': '$_customer.name',
                    'location': {$ifNull: ['$_customer.locationDoc.name', '']},
                    'status': '$status',
                    'deposit': '$deposit',
                    'sumRemainQty': '$sumRemainQty',
                    'total': '$total'
                };
                data.fields = [{field: '#ID'}, {field: 'Date'}, {field: 'Customer'}, {field: 'Location'}, {field: 'Status'}, {field: 'Deposit'}, {field: 'Total'}];
                data.displayFields = [{field: '_id'}, {field: 'orderDate'}, {field: 'customer'}, {field: 'location'}, {field: 'status'}, {field: 'deposit'}, {field: 'total'}];
            }

            /****** Title *****/
            data.title.company = Company.findOne();

            /****** Content *****/
            let saleOrders = Order.aggregate([
                {
                    $match: selector
                }, {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true},

                },
                {
                    $lookup: {
                        from: 'pos_customers',
                        localField: 'customerId',
                        foreignField: '_id',
                        as: '_customer'

                    }
                },
                {
                    $lookup: {
                        from: "pos_item",
                        localField: "items.itemId",
                        foreignField: "_id",
                        as: "itemDoc"
                    }
                },
                {$unwind: {path: '$_customer', preserveNullAndEmptyArrays: true}},
                {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
                {
                    $match: locationSelector
                },
                {
                    $lookup: {
                        from: 'pos_location',
                        localField: '_customer.locationId',
                        foreignField: '_id',
                        as: '_customer.locationDoc'
                    }
                },
                {
                    $unwind: {path: '$_customer.locationDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $group: {
                        _id: '$_id',
                        data: {
                            $addToSet: project
                        },
                        items: {
                            $addToSet: {
                                qty: '$items.qty',
                                price: '$items.price',
                                amount: '$items.amount',
                                itemId: '$items.itemId',
                                itemName: '$itemDoc.name',
                                remainQty: '$items.remainQty'
                            }
                        }
                    }
                }]);
            let total = Order.aggregate(
                [
                    {
                        $match: selector
                    },
                    {
                        $lookup: {
                            from: 'pos_customers',
                            localField: 'customerId',
                            foreignField: '_id',
                            as: '_customer'

                        }
                    },
                    {$unwind: {path: '$_customer', preserveNullAndEmptyArrays: true}},
                    {
                        $match: locationSelector
                    },
                    {
                        $group: {
                            _id: null,
                            totalDeposit: {$sum: '$deposit'},
                            total: {$sum: '$total'},
                            totalRemainQty: {$sum: '$sumRemainQty'}
                        }
                    }
                ]);
            if (saleOrders.length > 0) {
                let sortData = _.sortBy(saleOrders[0].data, '_id');
                saleOrders[0].data = sortData;
                data.content = saleOrders;
                data.footer.total = total[0].total;
                data.footer.totalDeposit = total[0].totalDeposit;
                data.footer.totalRemainQty = total[0].totalRemainQty
            }
            return data
        }
    }
});

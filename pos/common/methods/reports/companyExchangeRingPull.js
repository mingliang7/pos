import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {Company} from '../../../../core/imports/api/collections/company.js';
import {CompanyExchangeRingPulls} from '../../../imports/api/collections/companyExchangeRingPull';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const companyExchangeRingPullReport = new ValidatedMethod({
    name: 'pos.companyExchangeRingPullReport',
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
            if (params.date) {
                let dateAsArray = params.date.split(',')
                let fromDate = moment(dateAsArray[0]).toDate();
                let toDate = moment(dateAsArray[1]).toDate();
                data.title.date = moment(fromDate).format('YYYY-MMM-DD hh:mm a') + ' - ' + moment(toDate).format('YYYY-MMM-DD hh:mm a');
                selector.companyExchangeRingPullDate = {$gte: fromDate, $lte: toDate};
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
                    'companyExchangeRingPullDate': '$companyExchangeRingPullDate',
                    'vendor': '$vendorDoc',
                    'status': '$status',
                    'sumRemainQty': '$sumRemainQty',
                    'total': '$total'
                };
                data.fields = [{field: '#ID'}, {field: 'Date'}, {field: 'Vendor'}, {field: 'Telephone'},{field: 'Status'}];
                data.displayFields = [{field: '_id'}, {field: 'companyExchangeRingPullDate'}, {field: 'vendorName'},{field: 'vendorTelephone'}, {field: 'status'}];
            }

            /****** Title *****/
            data.title.company = Company.findOne();

            /****** Content *****/
            let companyExchangeRinpulls = CompanyExchangeRingPulls.aggregate([
                {
                    $match: selector
                },
                {
                    $lookup: {
                        from: 'pos_vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: 'vendorDoc'
                    }
                },
                {$unwind: {path: '$vendorDoc', preserveNullAndEmptyArrays: true}},
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true},

                }, {
                    $lookup: {
                        from: "pos_item",
                        localField: "items.itemId",
                        foreignField: "_id",
                        as: "itemDoc"
                    }
                },
                {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
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
                                remainQty: '$items.remainQty',
                            }
                        }
                    }
                }]);

            if (companyExchangeRinpulls.length > 0) {
                let sortData = _.sortBy(companyExchangeRinpulls[0].data, '_id');
                companyExchangeRinpulls[0].data = sortData;
                data.content = companyExchangeRinpulls;
            }
            return data
        }
    }
});

import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';

// Collection
import {CompanyExchangeRingPulls} from '../../../imports/api/collections/companyExchangeRingPull';
import {RingPullTransfers} from '../../../imports/api/collections/ringPullTransfer';
import {ExchangeRingPulls} from '../../../imports/api/collections/exchangeRingPull';
import {Item} from '../../../imports/api/collections/item';
import {Branch} from '../../../../core/imports/api/collections/branch';
// lib func
import {correctFieldLabel} from '../../../imports/api/libs/correctFieldLabel';
export const ringpullDetailReport = new ValidatedMethod({
    name: 'pos.ringpullDetailReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let itemSelector = {};
            let companySelector = {};
            let ringpullTransferSelector = {};
            let ringpullTransferInSelector = {};
            let exchangeSelector = {};
            let project = {};
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let branch = [];
            if (params.branchId) {
                companySelector.branchId = params.branchId;
                ringpullTransferSelector.fromBranchId = params.branchId;
                ringpullTransferInSelector.toBranchId = params.branchId;
                exchangeSelector.branchId = params.branchId;
            } else {
                return data;
            }
            if (params.itemId) {
                itemSelector['items.itemId'] = params.itemId;
            } else {
                return data;
            }
            if (params.date) {
                let dateAsArray = params.date.split(',');
                let fromDate = moment(dateAsArray[0]).startOf('days').toDate();
                let toDate = moment(dateAsArray[1]).endOf('days').toDate();
                data.title.branch = Branch.findOne({_id: params.branchId});
                data.title.item = Item.findOne({_id: params.itemId});
                data.title.date = moment(fromDate).format('DD/MM/YYYY') + ' - ' + moment(toDate).format('DD/MM/YYYY');
                companySelector.companyExchangeRingPullDate = {$gte: fromDate, $lte: toDate};
                exchangeSelector.exchangeRingPullDate = {$gte: fromDate, $lte: toDate};
                ringpullTransferSelector.ringPullTransferDate = {$gte: fromDate, $lte: toDate};
            }
            if (params.status) {
                selector.status = {$in: params.status.split(',')}
            }
            let companyExchange = CompanyExchangeRingPulls.aggregate([
                {$match: companySelector},
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $match: itemSelector
                },
                {
                    $lookup: {
                        from: 'pos_item',
                        localField: 'items.itemId',
                        foreignField: '_id',
                        as: 'itemDoc'
                    }
                },
                {
                    $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: 'pos_vendors',
                        localField: 'vendorId',
                        foreignField: '_id',
                        as: 'vendorDoc'
                    }
                },
                {
                    $unwind: {path: '$vendorDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 0,
                        date: '$companyExchangeRingPullDate',
                        inv: '$_id',
                        des: 1,
                        itemDoc: 1,
                        items: 1,
                        name: '$vendorDoc.name',
                        type: {$ifNull: ["$fake", 'out']},
                        exchangeRP: {$ifNull: ["$fake", 0]},
                        cExchangeRP: {$ifNull: ["$items.qty", 0]},
                        transferRP: {$ifNull: ["$fake", 0]},
                        receiveTransfer: {$ifNull: ["$fake", 0]},
                    }
                }
            ]);
            let exchangeRingPull = ExchangeRingPulls.aggregate([
                {$match: exchangeSelector},
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $match: itemSelector
                },
                {
                    $lookup: {
                        from: 'pos_item',
                        localField: 'items.itemId',
                        foreignField: '_id',
                        as: 'itemDoc'
                    }
                },
                {
                    $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
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
                {
                    $project: {
                        date: '$exchangeRingPullDate',
                        inv: '$_id',
                        des: 1,
                        itemDoc: 1,
                        name: '$customerDoc.name',
                        items: 1,
                        type: {$ifNull: ["$fake", 'in']},
                        exchangeRP: {$ifNull: ["$items.qty", 0]},
                        cExchangeRP: {$ifNull: ["$fake", 0]},
                        transferRP: {$ifNull: ["$fake", 0]},
                        receiveTransfer: {$ifNull: ["$fake", 0]},
                    }
                }
            ]);
            let ringPullTransferOut = RingPullTransfers.aggregate([
                {$match: ringpullTransferSelector},
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $match: itemSelector
                },
                {
                    $lookup: {
                        from: 'pos_item',
                        localField: 'items.itemId',
                        foreignField: '_id',
                        as: 'itemDoc'
                    }
                },
                {
                    $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup:{
                        from: 'core_branch',
                        localField: 'fromBranchId',
                        foreignField: '_id',
                        as: 'branchDoc'
                    }
                },
                {
                  $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 0,
                        date: '$ringPullTransferDate',
                        inv: '$_id',
                        des: 1,
                        itemDoc: 1,
                        items: 1,
                        name: '$branchDoc.khName',
                        type: {$ifNull: ["$fake", 'out']},
                        exchangeRP: {$ifNull: ["$fake", 0]},
                        cExchangeRP: {$ifNull: ["$fake", 0]},
                        transferRP: {$ifNull: ["$items.qty", 0]},
                        receiveTransfer: {$ifNull: ["$fake", 0]},
                    }
                }
            ]);
            let ringPullTransferIn = RingPullTransfers.aggregate([
                {$match: ringpullTransferInSelector},
                {
                    $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
                },
                {
                    $match: itemSelector
                },
                {
                    $lookup: {
                        from: 'pos_item',
                        localField: 'items.itemId',
                        foreignField: '_id',
                        as: 'itemDoc'
                    }
                },
                {
                    $unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup:{
                        from: 'core_branch',
                        localField: 'toBranchId',
                        foreignField: '_id',
                        as: 'branchDoc'
                    }
                },
                {
                    $unwind: {path: '$branchDoc', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 0,
                        date: '$ringPullTransferDate',
                        inv: '$_id',
                        des: 1,
                        name: '$branchDoc.khName',
                        itemDoc: 1,
                        items: 1,
                        type: {$ifNull: ["$fake", 'in']},
                        exchangeRP: {$ifNull: ["$fake", 0]},
                        cExchangeRP: {$ifNull: ["$fake", 0]},
                        transferRP: {$ifNull: ["$fake", 0]},
                        receiveTransfer: {$ifNull: ["$items.qty", 0]},
                    }
                }
            ]);
            let ringPullDetails = _.union(companyExchange, exchangeRingPull, ringPullTransferOut, ringPullTransferIn);
            let sortRingPulls = ringPullDetails.sort(compare);
            let totalExchangeRP = 0;
            let totalCompanyExchangeRP = 0;
            let totalTransferOutRP = 0;
            let totalTransferInRP = 0;
            let endingBalance = 0;
            if (sortRingPulls.length > 0) {
                sortRingPulls.forEach(function (doc) {
                    totalExchangeRP += doc.exchangeRP;
                    totalCompanyExchangeRP += doc.cExchangeRP;
                    totalTransferOutRP += doc.transferRP;
                    totalTransferInRP += doc.receiveTransfer;
                    if (doc.type == 'in') {
                        doc.endingBalance = endingBalance + doc.items.qty;
                        endingBalance += doc.items.qty

                    } else {
                        doc.endingBalance = endingBalance - doc.items.qty;
                        endingBalance -= doc.items.qty
                    }
                });
                data.content = sortRingPulls;
            }
            data.footer.totalExchangeRP = totalExchangeRP;
            data.footer.totalCompanyExchangeRP = totalCompanyExchangeRP;
            data.footer.totalTransferOutRP = totalTransferOutRP;
            data.footer.totalTransferInRP = totalTransferInRP;
            data.footer.endingBalance = endingBalance;
            return data
        }
    }
});
function compare(a, b) {
    if (a.date < b.date)
        return -1;
    if (a.date > b.date)
        return 1;
    return 0;
}

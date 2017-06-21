import {Meteor} from 'meteor/meteor';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';
import {ClosingStockBalance} from '../../../imports/api/collections/closingStock';
import ClosingStock from '../../../imports/api/libs/closingStockBalance';
export const closingStockReportMethod = new ValidatedMethod({
    name: 'pos.closingStockReport',
    mixins: [CallPromiseMixin],
    validate: null,
    run(params) {
        if (!this.isSimulation) {
            Meteor._sleepForMs(200);
            let selector = {};
            let itemObj = {};
            let data = {
                title: {},
                fields: [],
                displayFields: [],
                content: [{index: 'No Result'}],
                footer: {}
            };
            let date, branchId;
            if (params.date) {
                date = moment(params.date).endOf('days').toDate();
            }
            if (params.branchId) {
                branchId = params.branchId;
            } else {
                return data;
            }
            console.log(date);
            let lastClosingStockBalance = ClosingStockBalance.findOne({
                branchId: branchId,
                closingDate: {$lte: date}
            }, {sort: {closingDateString: -1}});
            let closingDate = lastClosingStockBalance ? moment(lastClosingStockBalance.closingDate).add(1, 'days').toDate() : undefined;
            let closingStockData = calcStockClosing(date, closingDate, branchId);
            if (lastClosingStockBalance) {
                lastClosingStockBalance.items.forEach(function (item) {
                    console.log(item.balance);
                    if(!itemObj[item.itemId]) {
                        itemObj[item.itemId] = {
                            enterBill: 0,
                            receiveLendingStock: 0,
                            receivePrepaidOrder: 0,
                            receiveCompanyExchangeRingPull: 0,
                            transferIn: 0,
                            lendingStock: 0,
                            invoice: 0,
                            exchangeRingPull: 0,
                            transferOut: 0
                        };
                        itemObj[item.itemId].balance = item.balance;
                        itemObj[item.itemId].qty = item.qty;
                        itemObj[item.itemId].itemId = item.itemId;
                        itemObj[item.itemId].itemDoc = item.itemDoc;
                    }
                });
            }
            closingStockData.forEach(function (closingData) {
                closingData.items.forEach(function (item) {
                    if(!itemObj[item.itemId]) {
                        itemObj[item.itemId] = {
                            enterBill: 0,
                            receiveLendingStock: 0,
                            receivePrepaidOrder: 0,
                            receiveCompanyExchangeRingPull: 0,
                            transferIn: 0,
                            lendingStock: 0,
                            invoice: 0,
                            exchangeRingPull: 0,
                            transferOut: 0
                        };
                        itemObj[item.itemId].qty = Math.abs(item.qty);
                        itemObj[item.itemId].balance = Math.abs(item.qty);
                        itemObj[item.itemId].itemId = item.itemId;
                        itemObj[item.itemId].itemDoc = item.itemDoc;
                    }else{
                        itemObj[item.itemId][item.transactionType] += Math.abs(item.qty);
                    }
                });
            });
            console.log(itemObj);
            // return data;
        }
    }
});

function calcStockClosing(inventoryDate, closingStockDate, branchId) {
    //--------------Stock In--------------------
    let enterBills = ClosingStock.lookupEnterBills({inventoryDate, closingStockDate, branchId});
    let receiveItemLendingStocks = ClosingStock.lookupReceiveItemLendingStocks({
        inventoryDate,
        closingStockDate,
        branchId
    });
    let receiveItemPrepaidOrders = ClosingStock.lookupReceiveItemPrepaidOrders({
        inventoryDate,
        closingStockDate,
        branchId
    });
    let receiveItemRingPulls = ClosingStock.lookupReceiveItemRingPulls({
        inventoryDate,
        closingStockDate,
        branchId
    });
    let transferIns = ClosingStock.lookupLocationTransferIns({inventoryDate, closingStockDate, branchId});
    //--------------Stock Out-------------------
    let lendingStocks = ClosingStock.lookupLendingStocks({inventoryDate, closingStockDate, branchId});
    let invoices = ClosingStock.lookupInvoices({inventoryDate, closingStockDate, branchId});
    let exchangeRingPulls = ClosingStock.lookupExchangeRingPulls({
        inventoryDate,
        closingStockDate,
        branchId
    });
    let transferOuts = ClosingStock.lookupLocationTransferOut({inventoryDate, closingStockDate, branchId});
    let transactions = _.union(enterBills, receiveItemLendingStocks, receiveItemPrepaidOrders, receiveItemRingPulls, transferIns, lendingStocks, invoices, exchangeRingPulls, transferOuts)
    let transactionObj = {};
    let transactionArr = [];
    transactions.forEach(function (transaction) {
        transaction.items.forEach(function (item) {
            if (_.isUndefined(transactionObj[transaction.date])) {
                transactionObj[transaction.date] = {};
                transactionObj[transaction.date] = {
                    date: transaction.date,
                    items: [item]
                };
            } else {
                transactionObj[transaction.date].items.push(item)
            }
        });

    });
    for (let k in transactionObj) {
        transactionArr.push(transactionObj[k]);
    }
    return transactionArr;
}
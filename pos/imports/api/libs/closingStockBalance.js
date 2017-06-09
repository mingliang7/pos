import {InventoryDates} from '../collections/inventoryDate';
import {Branch} from '../../../../core/imports/api/collections/branch';
import {EnterBills} from '../collections/enterBill';
import {LendingStocks} from '../collections/lendingStock';
import {Invoices} from '../collections/invoice';
import {ClosingStockBalance} from '../collections/closingStock';
import {ReceiveItems} from '../collections/receiveItem';
import {LocationTransfers} from '../collections/locationTransfer';
import {ExchangeRingPulls} from '../collections/exchangeRingPull';
export default class ClosingStock {
    static generateClosingStockBalance() {
        Branch.find({}).forEach(function (branch) {
            let branchId = branch._id;
            let closingStockBalance = ClosingStockBalance.findOne({branchId: branch._id}, {sort: {closingDate: -1}});
            let inventory = InventoryDates.findOne({branchId: branch._id});
            let closingStockDate = closingStockBalance ? closingStockBalance.closingDate : null;
            if (inventory) {
                let inventoryDate = moment(inventory.inventoryDate).subtract(1, 'days').toDate();
                //--------------Stock In--------------------
                let enterBills = ClosingStock.lookupEnterBills({inventoryDate, closingStockDate});
                let receiveItemLendingStocks = ClosingStock.lookupReceiveItemLendingStocks({
                    inventoryDate,
                    closingStockDate
                });
                let receiveItemPrepaidOrders = ClosingStock.lookupReceiveItemPrepaidOrders({
                    inventoryDate,
                    closingStockDate
                });
                let receiveItemRingPulls = ClosingStock.lookupReceiveItemRingPulls({inventoryDate, closingStockDate});
                let transferIns = ClosingStock.lookupLocationTransferIns({inventoryDate, closingStockDate, branchId});
                //--------------Stock Out-------------------
                let lendingStocks = ClosingStock.lookupLendingStocks({inventoryDate, closingStockDate});
                let invoices = ClosingStock.lookupInvoices({inventoryDate, closingStockDate});
                let exchangeRingPulls = ClosingStock.lookupExchangeRingPulls({inventoryDate, closingStockDate});
                let transferOuts = ClosingStock.lookupLocationTransferOut({inventoryDate, closingStockDate, branchId});
                let transactions = _.union(enterBills, receiveItemLendingStocks, receiveItemPrepaidOrders, receiveItemRingPulls, transferIns, lendingStocks, invoices, exchangeRingPulls, transferOuts)
                transactions.forEach(function (transaction) {
                    ClosingStock.insertClosingStock(transaction, branchId);
                });
            }
        });
    }

    //enter bill (type in)
    static lookupEnterBills({inventoryDate, closingStockDate}) {
        let selector = {enterBillDate: {$lte: inventoryDate}};
        if (closingStockDate) {
            selector.enterBillDate.$gte = closingStockDate;
        }
        return EnterBills.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$enterBillDate',
            qty: 'qty',
            transactionType: 'enterBill',
            type: 'in'
        }));
    }

    //receive item type lending stock (type in )
    static lookupReceiveItemLendingStocks({inventoryDate, closingStockDate}) {
        let selector = {receiveItemDate: {$lte: inventoryDate}, type: 'LendingStock'};
        if (closingStockDate) {
            selector.receiveItemDate.$gte = closingStockDate;
        }
        return ReceiveItems.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$receiveItemDate',
            qty: 'qty',
            transactionType: 'receiveLendingStock',
            type: 'in'
        }));
    }

    //receive item prepaid order (type in )
    static lookupReceiveItemPrepaidOrders({inventoryDate, closingStockDate}) {
        let selector = {receiveItemDate: {$lte: inventoryDate}, type: 'PrepaidOrder'};
        if (closingStockDate) {
            selector.receiveItemDate.$gte = closingStockDate;
        }
        return ReceiveItems.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$receiveItemDate',
            qty: 'qty',
            transactionType: 'receivePrepaidOrder',
            type: 'in'
        }));
    }

    //receive item company exchange ring pull (type in )
    static lookupReceiveItemRingPulls({inventoryDate, closingStockDate}) {
        let selector = {receiveItemDate: {$lte: inventoryDate}, type: 'CompanyExchangeRingPull'};
        if (closingStockDate) {
            selector.receiveItemDate.$gte = closingStockDate;
        }
        return ReceiveItems.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$receiveItemDate',
            qty: 'qty',
            transactionType: 'receiveCompanyExchangeRingPull',
            type: 'in'
        }));
    }

    //Location Transfer In (type in )
    static lookupLocationTransferIns({inventoryDate, closingStockDate, branchId}) {
        let selector = {locationTransferDate: {$lte: inventoryDate}, toBranchId: branchId, status: 'closed'};
        if (closingStockDate) {
            selector.locationTransferDate.$gte = closingStockDate;
        }
        return LocationTransfers.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$locationTransferDate',
            qty: 'qty',
            transactionType: 'transferIn',
            type: 'in'
        }));
    }

    //lending stock (type out)
    static lookupLendingStocks({inventoryDate, closingStockDate}) {
        let selector = {lendingStockDate: {$lte: inventoryDate}};
        if (closingStockDate) {
            selector.lendingStockDate.$gte = closingStockDate;
        }
        return LendingStocks.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$lendingStockDate',
            qty: 'qty',
            transactionType: 'lendingStock',
            type: 'out'
        }));
    }

    //invoices (type out)
    static lookupInvoices({inventoryDate, closingStockDate}) {
        let selector = {invoiceDate: {$lte: inventoryDate}};
        if (closingStockDate) {
            selector.invoiceDate.$gte = closingStockDate;
        }
        return Invoices.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$invoiceDate',
            qty: 'qty',
            transactionType: 'invoice',
            type: 'out'
        }));
    }

    //exchange Ring pull (type out)
    static lookupExchangeRingPulls({inventoryDate, closingStockDate}) {
        let selector = {exchangeRingPullDate: {$lte: inventoryDate}};
        if (closingStockDate) {
            selector.exchangeRingPullDate.$gte = closingStockDate;
        }
        return ExchangeRingPulls.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$exchangeRingPullDate',
            qty: 'qty',
            transactionType: 'exchangeRingPull',
            type: 'out'
        }));
    }

    //Location Transfer Out (type out )
    static lookupLocationTransferOut({inventoryDate, closingStockDate, branchId}) {
        let selector = {locationTransferDate: {$lte: inventoryDate}, fromBranchId: branchId, status: 'closed'};
        if (closingStockDate) {
            selector.locationTransferDate.$gte = closingStockDate;
        }
        return LocationTransfers.aggregate(this.closingStockQuery({
            selector: selector,
            date: '$locationTransferDate',
            qty: 'qty',
            transactionType: 'transferOut',
            type: 'out'
        }));
    }

    static closingStockQuery({selector, date, qty, transactionType, type}) {
        return [
            {
                $match: selector
            },
            {
                $unwind: {path: '$items', preserveNullAndEmptyArrays: true}
            },
            {
                $group: {
                    _id: {
                        itemId: '$items.itemId',
                        day: {$dayOfMonth: date},
                        month: {$month: date},
                        year: {$year: date}
                    },
                    date: {$last: date},
                    itemId: {$last: "$items.itemId"},
                    qty: {$sum: `$items.${qty}`},
                    amount: {$sum: "$items.amount"},
                    price: {$avg: "$items.price"}
                }
            },
            {
                $lookup: {
                    from: 'pos_item',
                    localField: 'itemId',
                    foreignField: '_id',
                    as: 'itemDoc'
                }
            },
            {$unwind: {path: '$itemDoc', preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    _id: 1,
                    date: {$dateToString: {format: "%Y-%m-%d", date: "$date"}},
                    type: {$ifNull: ["$fake", type]},
                    item: {
                        itemId: '$itemId',
                        itemDoc: '$itemDoc',
                        qty: '$qty',
                        amount: '$amount',
                        price: '$price',
                        transactionType: {$ifNull: ["$fake", transactionType]}
                    }
                }
            },
            {
                $group: {
                    _id: {day: '$_id.day', month: '$_id.month', year: '$_id.year'},
                    date: {$last: '$date'},
                    type: {$last: '$type'},
                    items: {
                        $push: '$item'
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    type: 1,
                    date: 1,
                    items: 1
                }
            }
        ]
    }

    static insertClosingStock(transaction, branchId) {
        let closingStock = ClosingStockBalance.findOne({closingDateString: transaction.date});
        let stockIn = [];
        let stockOut = [];

        if (closingStock) {
            
        } else {
            let balance = 0;
            transaction.items.forEach(function (item) {
                if (transaction.type == 'in') {
                    let stockInObj = stockIn.find(x => x.itemId == item.itemId);
                    if (stockInObj) {
                        stockInObj.transactions.push(item);
                    } else {
                        stockIn.push({itemId: item.itemId, transactions: [item]})
                    }
                    balance += item.qty;
                } else {
                    let stockOutObj = stockOut.find(x => x.itemId == item.itemId);
                    if (stockOutObj) {
                        stockOutObj.transactions.push(item);
                    } else {
                        stockOut.push({itemId: item.itemId, transactions: [item]})

                    }
                    balance -= item.qty
                }
            });
            ClosingStockBalance.insert(
                {
                    closingDateString: transaction.date,
                    closingDate: moment(transaction.date).toDate(),
                    stockIn: stockIn,
                    stockOut: stockOut,
                    branchId: branchId,
                    balance: balance
                }
            )
        }
    }

};

import {Invoices} from '../../api/collections/invoice';
import {Reps} from '../../api/collections/rep';

export default class Mutation {
    static addNewInvoice({obj}) {
        if (obj.flag == 'insert') {
            obj.items = [obj.item];
            Invoices.insert(obj);
        } else {
            let items = [];
            let total = 0;
            let subTotal = 0;
            let currentInvoice = Invoices.findOne({_id: obj._id});
            let existItem = currentInvoice.items.find(item => item.itemId == obj.item.itemId);
            currentInvoice.items.forEach(function (item) {
                if (item.itemId == obj.item.itemId) {
                    item.qty += obj.item.qty;
                    item.amount += obj.item.amount;
                }
                items.push(item);
                subTotal += item.amount;
                total += item.amount;
            });

            if (!existItem) {
                total += obj.item.amount;
                subTotal += obj.item.amount;
                items.push(obj.item)
            }
            Invoices.update({_id: obj._id},
                {
                    $set: {
                        items: items,
                        stockLocationId: currentInvoice.stockLocationId,
                        total: total * (1 - (currentInvoice.discount / 100)),
                        subTotal: subTotal
                    }
                });
        }
    }

    static removeProduct({currentSelectItem, invoiceId}) {
        let items = [];
        let total = 0;
        let currentInvoice = Invoices.findOne(invoiceId);
        currentInvoice.items.forEach(function (item) {
            if (item.itemId != currentSelectItem.itemId) {
                items.push(item);
                total += item.amount;
            }
        });
        Invoices.update({_id: invoiceId},
            {
                $set: {
                    items: items,
                    stockLocationId: currentInvoice.stockLocationId,
                    total: total * (1 - (currentInvoice.discount / 100)),
                    subTotal: total
                }
            });
    }

    static updateProductQty({currentSelectItem, invoiceId}) {
        let total = 0;
        let items = [];
        let currentInvoice = Invoices.findOne(invoiceId);
        total = currentInvoice.total;
        currentInvoice.items.forEach(function (item) {
            if (currentSelectItem.itemId == item.itemId) {
                total -= item.amount;
                item = currentSelectItem;
            }
            items.push(item);
        });
        Invoices.update({_id: invoiceId},
            {
                $set: {
                    items: items,
                    stockLocationId: currentInvoice.stockLocationId,
                    total: (total + currentSelectItem.amount) * (1 - (currentInvoice.discount / 100)),
                    subTotal: total + currentSelectItem.amount
                }
            });
    }

    static insertNewRep({obj}) {
        Reps.insert(obj);
    }
};

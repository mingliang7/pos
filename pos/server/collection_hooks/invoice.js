import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Invoices} from '../../imports/api/collections/invoice.js';
import {Order} from '../../imports/api/collections/order';

//import invoice state
import {invoiceState} from '../../common/globalState/invoice';
//import methods
import {updateItemInSaleOrder} from '../../common/methods/sale-order';
Invoices.before.insert(function (userId, doc) {
    if (doc.total == 0) {
        doc.status = 'closed';
        doc.invoiceType = 'saleOrder'
    } else if (doc.termId) {
        doc.status = 'active';
        doc.invoiceType = 'term'
    } else {
        doc.status == 'active';
        doc.invoiceType = 'group';
    }
    let tmpInvoiceId = doc._id;
    let todayDate = moment().format('YYYYMMDD');
    let prefix = doc.branchId + "-" + todayDate;
    doc._id = idGenerator.genWithPrefix(Invoices, prefix, 4);
    invoiceState.set(tmpInvoiceId, {customerId: doc.customerId, invoiceId: doc._id, total: doc.total});
});

Invoices.after.insert(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let totalRemain = 0;
        if (doc.saleId) {
            doc.items.forEach(function (item) {
                Order.direct.update(
                    {
                        _id: doc.saleId,
                        "items.itemId": item.itemId
                    },
                    {
                        $inc: {
                            sumRemainQty: -item.qty,
                            "items.$.remainQty": -item.qty
                        }
                    });
            });
            let saleOrder = Order.findOne(doc.saleId);
            if (saleOrder.sumRemainQty == 0) {
                Order.direct.update(saleOrder._id, {$set: {status: 'closed'}});
            }
        }
        if (doc.invoiceType == 'group') {
            Meteor.call('pos.generateInvoiceGroup', {doc});
        }
    });
});

//update
Invoices.after.update(function (userId, doc) {
    let preDoc = this.previous;
    if (doc.invoiceType == 'saleOrder') {
        Meteor.defer(function () {
            Meteor._sleepForMs(200);
            recalculateQty({preDoc});
            console.log(doc);

        });
    }
});


//update qty
function updateQtyInSaleOrder({doc}) {
    Meteor._sleepForMs(200);
    doc.items.forEach(function (item) {
        Order.direct.update(
            {_id: doc.saleId, 'item.itemId': item._id},
            {$inc: {'item.$.remainQty': -item.qty, sumRemainQty: -item.qty}}
        )
    });
}
//recalculate qty
function recalculateQty({preDoc}) {
    let updatedFlag;
    preDoc.items.forEach(function (item) {
        Order.direct.update(
            {_id: preDoc.saleId, 'item.itemId': item.itemId},
            {$inc: {'item.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
    return updatedFlag;
}
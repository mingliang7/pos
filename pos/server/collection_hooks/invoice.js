import 'meteor/matb33:collection-hooks';
import {idGenerator} from 'meteor/theara:id-generator';

// Collection
import {Invoices} from '../../imports/api/collections/invoice.js';
import {Order} from '../../imports/api/collections/order';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice';

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
    let type = {
        saleOrder: doc.invoiceType == 'saleOrder',
        term: doc.invoiceType == 'term',
        group: doc.invoiceType == 'group'
    };
    if (type.saleOrder) {
        Meteor.defer(function () {
            recalculateQty(preDoc);
            updateQtyInSaleOrder(doc);
        });
    }else if(type.group) {
        Meteor.defer(function () {
            removeInvoiceFromGroup(preDoc);
            pushInvoiceFromGroup(doc);
            invoiceState.set(doc._id, {customerId: doc.customerId, invoiceId: doc._id, total: doc.total});
        });
    }
});

//remove
Invoices.after.remove(function (userId, doc) {
    Meteor.defer(function () {
        Meteor._sleepForMs(200);
        let type = {
            saleOrder: doc.invoiceType == 'saleOrder',
            term: doc.invoiceType == 'term',
            group: doc.invoiceType == 'group'
        };
        if(type.saleOrder) {
            recalculateQty(doc);
        }else if(type.group) {
            removeInvoiceFromGroup(doc);
            let groupInvoice = GroupInvoice.findOne(doc.paymentGroupId);
            if(groupInvoice.invoices.length <= 0){
                GroupInvoice.direct.remove(doc.paymentGroupId);
            }
        }
    });
});

//update qty
function updateQtyInSaleOrder(doc) {
    Meteor._sleepForMs(200);
    doc.items.forEach(function (item) {
        Order.direct.update(
            {_id: doc.saleId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': -item.qty, sumRemainQty: -item.qty}}
        )
    });
}
//recalculate qty
function recalculateQty(preDoc) {
    Meteor._sleepForMs(200);
    let updatedFlag;
    preDoc.items.forEach(function (item) {
        Order.direct.update(
            {_id: preDoc.saleId, 'items.itemId': item.itemId},
            {$inc: {'items.$.remainQty': item.qty, sumRemainQty: item.qty}}
        ); //re sum remain qty
    });
}

// update group invoice
function removeInvoiceFromGroup(doc) {
    Meteor._sleepForMs(200);
    GroupInvoice.update({_id: doc.paymentGroupId}, {$pull: {invoices: {_id: doc._id}}, $inc: {total: -doc.total}});
}

function pushInvoiceFromGroup(doc) {
    Meteor._sleepForMs(200);
    GroupInvoice.update({_id: doc.paymentGroupId}, {$addToSet: {invoices: doc}, $inc: {total: doc.total}});
}
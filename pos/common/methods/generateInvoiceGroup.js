import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {Customers} from '../../imports/api/collections/customer';
import {Vendors} from '../../imports/api/collections/vendor';
import {GroupInvoice} from '../../imports/api/collections/groupInvoice.js';
import {Invoices} from '../../imports/api/collections/invoice.js';
import {ReceivePayment} from '../../imports/api/collections/receivePayment.js';
//lib func
import {idGenerator} from 'meteor/theara:id-generator';
import {getRange} from '../../imports/api/libs/generateDateRange';
// Check user password
export const generateInvoiceGroup = new ValidatedMethod({
    name: 'pos.generateInvoiceGroup',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        doc: {type: Object, blackbox: true}
    }).validator(),
    run({
        doc
    }) {
        if (!this.isSimulation) {
            if (doc.customerId) {
                let customer = getPaymentGroupInfo(Customers, doc.customerId);
                let range = getRange(doc.invoiceDate, customer.paymentGroup.numberOfDay);
                insertGroupInvoice({collection: Invoices, range: range, doc: doc});
            }
            if (doc.vendorId) {

            }
        }
    }
});

function getPaymentGroupInfo(collection, id) {
    let info = collection.aggregate([{
        $match: {_id: id}
    }, {
        $lookup: {
            from: "pos_paymentGroups",
            localField: "paymentGroupId",
            foreignField: "_id",
            as: "paymentGroup"
        }
    }, {$unwind: '$paymentGroup'}]);
    return info[0];
}

function insertGroupInvoice({collection,range, doc}) {
    let groupInvoice = GroupInvoice.findOne({
        vendorOrCustomerId: doc.customerId,
        startDate:moment(range.startDate).toDate(),
        endDate: moment(range.endDate).toDate()
    });
    if (groupInvoice) {
        var isUpdated = GroupInvoice.update(groupInvoice._id, {$addToSet: {invoices: doc}, $inc: {total: doc.total}});
        if(isUpdated == 1){
            collection.direct.update(doc._id, {$set: {paymentGroupId: groupInvoice._id}});
            doc.paymentGroupId = groupInvoice._id;
            recalculatePaymentAfterInsert({doc});
        }else{
            collection.direct.remove(doc._id);
        }
    } else {
        let genId = idGenerator.genWithPrefix(GroupInvoice, `${doc.branchId}-G`, 9);
        let obj = {
            _id: genId,
            startDate: moment(range.startDate).toDate(),
            endDate: moment(range.endDate).toDate(),
            dueDate: doc.dueDate,
            total: doc.total,
            vendorOrCustomerId: doc.customerId,
            status: 'active',
            invoices: [doc]
        };
        let isInserted = GroupInvoice.insert(obj);
        if(isInserted){
            collection.direct.update(doc._id, {$set: {paymentGroupId: isInserted}});
        }else{
            collection.direct.remove(doc._id);
        }
    }
}


//update payment after insert
function recalculatePaymentAfterInsert({doc}) {
    let invoiceId = doc.paymentGroupId;
    let receivePayment = ReceivePayment.find({invoiceId: invoiceId});
    if (receivePayment.count() > 0) {
        ReceivePayment.update({invoiceId: invoiceId}, {
            $inc: {
                dueAmount: doc.total,
                balanceAmount: doc.total
            }
        }, {multi: true});
        ReceivePayment.direct.remove({invoiceId: invoiceId, dueAmount: {$lte: 0}});
    }
}


export const PayBills = new Mongo.Collection('pos_payBill');
PayBills.schema = new SimpleSchema({
    billId: {
        type: String
    },
    paymentDate: {
        type: Date
    },
    paidAmount: {
        type: Number,
        decimal: true
    },
    dueAmount: {
        type: Number,
        decimal: true
    },
    balanceAmount: {
        type: Number,
        decimal: true
    },
    vendorId: {
        type: String
    },
    status: {
        type: String
    },
    staffId: {
        type: String
    }
});
PayBills.attachSchema(PayBills.schema);

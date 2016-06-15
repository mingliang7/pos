export const ReceivePayment = new Mongo.Collection('receivePayment');
ReceivePayment.schema = new SimpleSchema({
    invoiceId: {
        type: String
    },
    paymentDate: {
        type: Date
    },
    paidAmount: {
        type: Number,
        decimal: true
    },
    owedAmount: {
        type: Number,
        decimal: true
    },
    balanceAmount: {
        type: Number,
        decimal: true
    },
    customerId: {
        type: String
    },
    status: {
        type: String
    },
    staffId: {
        type: String
    }
})
ReceivePayment.attachSchema(ReceivePayment.schema);

//for generate closing stock report
export const ClosingStockBalance = new Mongo.Collection('pos_closingStockBalance');

ClosingStockBalance.schema = new SimpleSchema({
    closingDateString: {
        type: String,
        index: true
    },
    closingDate: {
        type: Date,
        index: true,
    },
    stockIn:{
        type: [Object],
    },
    'stockIn.$': {
        type: Object,
        blackbox: true
    },
    stockOut: {
        type: [Object],
        blackbox: true
    },
    'stockOut.$': {
        type: Object,
        blackbox: true
    },
    branchId: {
        type: String,
        index: true
    }
});


ClosingStockBalance.attachSchema(ClosingStockBalance.schema);
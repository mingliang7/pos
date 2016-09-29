Meteor.methods({
    insertAccountJournal(doc){
        let id;
        let data = {};
        data.journalDate = moment().toDate();
        data.branchId = doc.branchId;
        data.voucherId = doc.voucherId;
        data.currencyId = doc.currencyId;
        data.memo = doc.des == null || doc.des == '' ? 'No Memo' : doc.des;
        data.refId = doc._id;
        data.refFrom = doc.type;
        data.total = doc.total;
        data.transaction = doc.transaction;
        Meteor.call('api_journalInsert', data, function (er, re) {
            if (re) {
                id = re;
            }
        });
        return id;
    },
    updateAccountJournal(doc){
        let isTrue = false;
        let data = {};
        data.journalDate = moment().toDate();
        data.branchId = doc.branchId;
        data.voucherId = doc.voucherId;
        data.currencyId = doc.currencyId;
        data.memo = doc.des == null ? 'No Memo' : doc.des;
        data.refId = doc._id;
        data.refFrom = doc.type;
        data.total = doc.total;
        data.transaction = doc.transaction;
        Meteor.call('api_journalUpdate', data, function (er, re) {
            if (re) {
                isTrue = re;
            }
        });
        return isTrue;
    },
    removeAccountJournal(doc){
        let isTrue = false;
        let refId = doc._id;
        let refFrom = doc.type;
        Meteor.call('api_journalRemove', refId, refFrom, function (er, re) {
            if (er) {
                isTrue = re;
            }
        });
        return isTrue;
    }
});

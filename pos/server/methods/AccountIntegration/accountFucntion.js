Meteor.methods({
    insertAccountJournal(doc){
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
        Meteor.call('api_journalInsert', data);
    },
    updateAccountJournal(doc){
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
        Meteor.call('api_journalUpdate', data);
    },
    removeAccountJournal(doc){
        let refId = doc._id;
        let refFrom = doc.type;
        Meteor.call('api_journalRemove', refId, refFrom);
    }
});

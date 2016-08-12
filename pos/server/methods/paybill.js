import {RemovedPayBill} from '../../imports/api/collections/removedCollection';

Meteor.methods({
    insertRemovedPayBill(doc){
        doc.status = 'removed';
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        RemovedPayBill.insert(doc);
    },
});
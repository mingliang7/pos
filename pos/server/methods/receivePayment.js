import {ReceivePayment} from '../../imports/api/collections/receivePayment';
Meteor.methods({
    insertRemovedPayment(doc){
        doc.status = 'removed';
        doc._id = `${doc._id}R${moment().format('YYYY-MMM-DD-HH:mm')}`;
        ReceivePayment.direct.insert(doc);
    }
});
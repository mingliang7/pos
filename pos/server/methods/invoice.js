import {invoiceState} from '../../common/globalState/invoice';
Meteor.methods({
    getInvoiceId(tmpId){
        Meteor._sleepForMs(1000);
        let invoice = invoiceState.get(tmpId);
        console.log(invoice);
        return invoice;
    }
});
import {invoiceState} from '../../common/globalState/invoice';
import {Customers} from '../../imports/api/collections/customer';
Meteor.methods({
    getInvoiceId(tmpId){
        Meteor._sleepForMs(1000);
        let invoice = invoiceState.get(tmpId);
        console.log(invoice);
        return invoice;
    },
    unsetTerm(id){
        Customers.direct.update(id, {$unset: {termId: '', _term: ''}});
    },
    unsetGroup(id){
        Customers.direct.update(id, {$unset: {paymentGroupId: '', _paymentGroup: ''}});
    }
});
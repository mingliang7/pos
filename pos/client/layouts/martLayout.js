import './martLayout.html';
import {Invoices} from '../../imports/api/collections/invoice';

let tmplLayout = Template.MartLayout;

tmplLayout.onRendered(function () {
    console.log('this is on rendered')
    $(window).keydown(function (e) {
        console.log(e.keyCode)
        if (e.altKey && e.keyCode == 65) {
            FlowRouter.query.set({k: 'barcode'});
        }
        else if (e.altKey && e.keyCode == 83) {
            FlowRouter.query.set({k: 'search'});
        }
        else if (e.altKey && e.keyCode == 123) {
            let invoiceId = FlowRouter.query.get('inv');
            if (invoiceId) {
                let invoice = Invoices.findOne(invoiceId);
                if (invoice) {
                    FlowRouter.go(`/pos/mart-ui/customer/${invoice.customerId}/receive-payment/${invoice._id}`);
                }
            }
        }
        else if(e.keyCode == 13) {
            FlowRouter.query.set({k: 'printPayment'})
        }else if(e.keyCode == 8 && e.altKey) {
            FlowRouter.go('/pos/mart-ui');
        }
    });
});
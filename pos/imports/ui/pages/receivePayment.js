//components

//collections
import {Invoices} from '../../api/collections/invoice';
import {ReceivePayment} from '../../api/collections/receivePayment';
//schema
import {receivePaymentSchema} from '../../api/collections/receivePaymentSchema.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {AutoForm} from 'meteor/aldeed:autoform';
import {receivePayment} from '../../../common/methods/receivePayment';
//page
import './receivePayment.html';
//methods

let indexTmpl = Template.Pos_receivePayment;
Tracker.autorun(function () {
    if (Session.get('customerId')) {
        Meteor.subscribe('pos.activeInvoices', {
            customerId: Session.get('customerId'),
            status: {$in: ['active', 'partial']}
        });
    }
    if (Session.get('invoices')) {
        Meteor.subscribe('pos.receivePayment', {
            invoiceId: {
                $in: Session.get('invoices')
            },
            status: {$in: ['active', 'partial']}
        });
    }
});
indexTmpl.onCreated(function () {
    Session.set('amountDue', 0);
    Session.set('invoicesObjCount', 0);
    Session.set('amount', 0);
    Session.set('invoicesObj', {
        count: 0
    });
    Session.set('balance', 0)
});
indexTmpl.onDestroyed(function () {
    Session.set('invoices', undefined);
    Session.set('amountDue', 0);
    Session.set('amount', 0);
    Session.set('invoicesObj', {
        count: 0
    });
    Session.set('balance', 0)
});
indexTmpl.rendered = function () {
    Session.set('customerId', FlowRouter.getParam('customerId'));
};
indexTmpl.helpers({
    countIsqualSales() {
        let invoicesObj = Session.get('invoicesObj');
        if (Invoices.find().count() != 0 && invoicesObj.count == Invoices.find().count()) {
            return true;
        }
        return false;
    },
    doc() {
        return {
            customerId: FlowRouter.getParam('customerId')
        }
    },
    dueAmount(){
        let total = this.total || 0;
        let lastPayment = getLastPayment(this._id);
        return lastPayment == 0 ? `${numeral(total).format('0,0.00')}` : `${numeral(lastPayment).format('0,0.00')}`;
    },
    schema() {
        return receivePaymentSchema;
    }, 
    invoices() {
        let invoices = Invoices.find({}, {
            sort: {
                _id: 1
            }
        });
        if (invoices.count() > 0) {
            let arr = [];
            invoices.forEach(function (invoice) {
                let lastPayment =getLastPayment(invoice._id);
                arr.push(invoice._id);
                invoice.dueAmount = lastPayment == 0 ? invoice.total : lastPayment;
            });
            Session.set('invoices', arr);
            return invoices;
        }
        return false;
    },
    hasAmount() {
        let amount = Session.get('amount');
        var lastPayment = getLastPayment(this._id);
        if (this.status == 'active' && this.total == amount) { //match due amount with status active
            let saleInvoices = {
                count: 0
            };
            saleInvoices.count += 1;
            this.receivedPay = this.total;
            saleInvoices[this._id] = this;
            saleInvoices[this._id].dueAmount = lastPayment == 0 ? this.total : lastPayment;
            Session.set('invoicesObj', saleInvoices);
            return true;
        }
        if(this.status == 'partial' && lastPayment == amount){ //match due amount with status partial
            let saleInvoices = {
                count: 0
            };
            saleInvoices.count += 1;
            this.receivedPay = lastPayment;
            saleInvoices[this._id] = this;
            saleInvoices[this._id].dueAmount = lastPayment == 0 ? this.total : lastPayment;
            Session.set('invoicesObj', saleInvoices);
            return true;
        }
        return false;
    },
    totalPaid(){
        let totalPaid = 0;
        let invoicesObjObj = Session.get('invoicesObj');
        delete invoicesObjObj.count;
        if (_.isEmpty(invoicesObjObj)) {
            return 0;
        } else {
            for (let k in invoicesObjObj) {
                totalPaid += invoicesObjObj[k].receivedPay
            }
            return totalPaid;
        }
    },
    totalAmountDue(){
        let totalAmountDue = 0;
        let invoices = Invoices.find({})
        if (invoices.count() > 0) {
            invoices.forEach(function (invoices) {
                let receivePayments = ReceivePayment.find({invoiceId: invoices._id}, {sort: {_id: 1, paymentDate: 1}});
                if (receivePayments.count() > 0) {
                    let lastPayment = _.last(receivePayments.fetch());
                    totalAmountDue += lastPayment.balanceAmount;
                } else {
                    totalAmountDue += invoices.total;
                }
            });
        }
        Session.set('balance', numeral(totalAmountDue).format('0,0.00'));
        return totalAmountDue;
    },
    totalOriginAmount(){
        let totalOrigin = 0;
        Invoices.find({}).forEach(function (invoices) {
            totalOrigin += invoices.total;
        });
        return totalOrigin;
    },
    customerBalance(){
        return Session.get('balance');
    },
    total(){
        let lastPayment = getLastPayment(this._id);
        return lastPayment == 0 ? numeral(this.total).format('0,0.00') : numeral(lastPayment).format('0,0.00');
    }
});

indexTmpl.events({
    'change [name="customerId"]' (event, instance) {
        if (event.currentTarget.value != '') {
            clearChecbox();
            Session.set('customerId', event.currentTarget.value);
        }
    },
    'change [name="amount"]' (event, instance) {
        clearChecbox();
        if (event.currentTarget.value != '') {
            Session.set('amount', parseFloat(event.currentTarget.value))
        }
    },
    "keypress [name='amount']" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    },
    'click .select-invoice' (event, instance) {
        var selectedInvoices = Session.get('invoicesObj')
        let lastPayment = getLastPayment(this._id);
        if ($(event.currentTarget).prop('checked')) {
            $(event.currentTarget).parents('.invoice-parents').find('.total').val(lastPayment == 0 ? this.total : lastPayment);
            this.receivedPay = lastPayment == 0 ? this.total : lastPayment;
            selectedInvoices[this._id] = this;
            selectedInvoices[this._id].dueAmount = lastPayment == 0 ? this.total : lastPayment;
            selectedInvoices.count += 1;
            Session.set('invoicesObj', selectedInvoices)
        } else {
            delete selectedInvoices[this._id];
            selectedInvoices.count -= 1;
            $(event.currentTarget).parents('.invoice-parents').find('.total').val('')
            Session.set('invoicesObj', selectedInvoices)
        }
    },
    'click .select-all' (event, instance) {
        clearChecbox();
        if ($(event.currentTarget).prop('checked')) {
            let saleObj = Session.get('invoicesObj');
            let total = []
            let index = 0;
            let invoicesObj = Invoices.find({}, {
                sort: {
                    _id: 1
                }
            });
            invoicesObj.forEach((sale) => {
                let lastPayment = getLastPayment(sale._id);
                sale.dueAmount = lastPayment == 0 ? sale.total : lastPayment;
                sale.receivedPay = lastPayment == 0 ? sale.total : lastPayment; //receive amount of pay
                saleObj[sale._id] = sale;
                total.push(sale.dueAmount);
            })
            saleObj.count = invoicesObj.count();
            Session.set('invoicesObj', saleObj);
            $('.select-invoice').each(function () {
                $(this).prop('checked', true);
                $(this).parents('.invoice-parents').find('.total').val(total[index])
                index++;
            })
        } else {
            clearChecbox()
        }
    },
    'change .total' (event, instance) {
        var selectedInvoices = Session.get('invoicesObj');
        var lastPayment = getLastPayment(this._id);
        if (event.currentTarget.value == '' || event.currentTarget.value == '') {
            if (_.has(selectedInvoices, this._id)) {
                selectedInvoices.count -= 1;
                delete selectedInvoices[this._id];
                Session.set('invoicesObj', selectedInvoices);
                $(event.currentTarget).parents('.invoice-parents').find('.select-invoices').prop('checked', false);
            }
        } else {
            if (!_.has(selectedInvoices, this._id)) {
                selectedInvoices.count += 1;
            }
            selectedInvoices[this._id] = this;
            selectedInvoices[this._id].receivedPay = parseFloat(event.currentTarget.value);
            selectedInvoices[this._id].dueAmount = lastPayment == 0 ? this.total : lastPayment;
            $(event.currentTarget).parents('.invoice-parents').find('.select-invoice').prop('checked', true);
            if(parseFloat(event.currentTarget.value) > selectedInvoices[this._id].dueAmount){ //check if entering payment greater than dueamount
                selectedInvoices[this._id].receivedPay = selectedInvoices[this._id].dueAmount;
                $(event.currentTarget).parents('.invoice-parents').find('.total').val(selectedInvoices[this._id].dueAmount);
            }
            Session.set('invoicesObj', selectedInvoices);
        }
    },
    "keypress .total" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    }
});


function clearChecbox() {
    Session.set('amount', 0); //clear checkbox
    Session.set('invoicesObj', {
        count: 0
    }); //set obj to empty on keychange
    $(".select-invoice").each(function () {
        $(this).prop('checked', false);
        $(this).parents('.invoice-parents').find('.total').val('');
    })
}
function getLastPayment(invoiceId){
    let receivePayments = ReceivePayment.find({invoiceId: invoiceId}, {sort: {_id: 1, paymentDate: 1}});
    if (receivePayments.count() > 0) {
        let lastPayment = _.last(receivePayments.fetch());
        return lastPayment.balanceAmount;
    }
    return 0;
}
let hooksObject = {
    onSubmit(){
        this.event.preventDefault();
        let invoicesObj = Session.get('invoicesObj');
        delete invoicesObj.count;
        if (_.isEmpty(invoicesObj)) {
            swal({
                title: "Warning",
                text: "Your payments can't be blank",
                type: "error",
                confirmButtonClass: "btn-danger",
                showConfirmButton: true,
                timer: 3000
            });
        } else {
            let paymentDate = this.insertDoc.paymentDate || new Date();
            swal({
                title: "Processing Payment..",
                text: "Click OK to continue!",
                type: "info",
                showCancelButton: true,
                closeOnConfirm: false,
                showLoaderOnConfirm: true,
            }, function () {
                receivePayment.callPromise({paymentDate, invoicesObj})
                    .then(function (result) {
                        clearChecbox();
                        console.log(result)
                        swal({
                            title: "Receive Payment",
                            text: "Successfully paid!",
                            type: "success",
                            confirmButtonClass: "btn-success",
                            showConfirmButton: true,
                            timer: 3000
                        });
                    })
                    .catch(function (err) {
                        Session.set('invoicesObj', {count: 0});
                        swal({
                            title: "[Error]",
                            text: err.message,
                            type: "danger",
                            confirmButtonClass: "btn-danger",
                            showConfirmButton: true,
                            timer: 3000
                        });
                    })
            });

        }
        return false;
    },
};

AutoForm.addHooks([
    'Pos_receivePayment'
], hooksObject);

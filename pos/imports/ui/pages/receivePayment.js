//components

//collections
import {Invoices} from '../../api/collections/invoice';
import {GroupInvoice} from '../../api/collections/groupInvoice';
import {ReceivePayment} from '../../api/collections/receivePayment';
import {Customers} from '../../api/collections/customer';
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
        swal({
            title: "Pleas Wait",
            text: "Getting Invoices....", showConfirmButton: false
        });
        Meteor.subscribe('pos.customer', {
            _id: Session.get('customerId')
        });
        let customer = getCustomerInfo(Session.get('customerId'));
        let invoiceSub;
        if (customer && customer.termId) {
            invoiceSub = Meteor.subscribe('pos.activeInvoices', {
                customerId: Session.get('customerId'),
                status: {$in: ['active', 'partial']},
                invoiceType: 'term'
            });
        } else {
            invoiceSub = Meteor.subscribe('pos.activeGroupInvoices', {
                vendorOrCustomerId: Session.get('customerId'),
                status: {$in: ['active', 'partial']}
            });
        }
        if (invoiceSub.ready()) {
            setTimeout(function () {
                swal.close()
            }, 500);
        }
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
    Session.set('discount', {discountIfPaidWithin: 0, discountPerecentages: 0, invoiceId: ''});
    Session.get('disableTerm', false);
    Session.set('invoicesObjCount', 0);
    if (FlowRouter.getParam('invoiceId')) {
        Session.set('invoiceId', FlowRouter.getParam('invoiceId'));
    } else {
        Session.set('invoiceId', 0);
    }
    Session.set('invoicesObj', {
        count: 0
    });
    Session.set('balance', 0)
});
indexTmpl.onDestroyed(function () {
    Session.set('customerId', undefined);
    Session.set('invoices', undefined);
    Session.get('disableTerm', false);
    Session.set('discount', {discountIfPaidWithin: 0, discountPerecentages: 0, invoiceId: ''});
    Session.set('amountDue', 0);
    Session.set('invoiceId', 0);
    Session.set('invoicesObj', {
        count: 0
    });
    Session.set('balance', 0)
});
indexTmpl.rendered = function () {
    Session.set('customerId', FlowRouter.getParam('customerId'));
};
indexTmpl.helpers({
    discount(){
        return checkTerm(this);
    },
    term(){
        try {

            return getCustomerTerm(Session.get('customerId'));

        } catch (e) {

        }

    },
    countIsqualSales() {
        let invoicesObj = Session.get('invoicesObj');
        let customer = Customers.findOne(Session.get('customerId'));
        let collection = (customer && customer.termId) ? Invoices.find() : GroupInvoice.find();
        if (collection.count() != 0 && invoicesObj.count == collection.count()) {
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
        let invoices;
        let customer = getCustomerInfo(Session.get('customerId'));
        if (customer && customer.termId) {
            invoices = Invoices.find({}, {
                sort: {
                    _id: 1
                }
            });
        } else {
            invoices = GroupInvoice.find({}, {sort: {_id: 1}});
        }
        if (invoices.count() > 0) {
            let arr = [];
            invoices.forEach(function (invoice) {
                let lastPayment = getLastPayment(invoice._id);
                arr.push(invoice._id);
                invoice.dueAmount = lastPayment == 0 ? invoice.total : lastPayment;
            });
            Session.set('invoices', arr);
            return invoices;
        }
        return false;
    },
    hasAmount() {
        let _id = Session.get('invoiceId');
        let discount = this.status == 'active' ? checkTerm(this) : 0;
        var lastPayment = getLastPayment(this._id);
        if (this.status == 'active' && (this._id == _id || this.voucherId == _id)) { //match _id with status active
            let saleInvoices = {
                count: 0
            };
            saleInvoices.count += 1;
            let valueAfterDiscount = this.total * (1 - (discount / 100));
            this.receivedPay = valueAfterDiscount;
            this.discount = discount;
            saleInvoices[this._id] = this;
            saleInvoices[this._id].dueAmount = lastPayment == 0 ? valueAfterDiscount : lastPayment;
            Session.set('invoicesObj', saleInvoices);
            return true;
        }
        if (this.status == 'partial' && (this._id == _id || this.voucherId == _id)) { //match _id with status partial
            let saleInvoices = {
                count: 0
            };
            saleInvoices.count += 1;
            this.receivedPay = lastPayment;
            this.discount = 0;
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
        let customer = getCustomerInfo(Session.get('customerId'));
        let invoices = (customer && customer.termId) ? Invoices.find({}) : GroupInvoice.find({});
        if (invoices.count() > 0) {
            invoices.forEach(function (invoice) {
                let receivePayments = ReceivePayment.find({invoiceId: invoice._id}, {sort: {_id: 1, paymentDate: 1}});
                if (receivePayments.count() > 0) {
                    let lastPayment = _.last(receivePayments.fetch());
                    totalAmountDue += lastPayment.balanceAmount;
                } else {
                    totalAmountDue += invoice.total;
                }
            });
        }
        Session.set('balance', numeral(totalAmountDue).format('0,0.00'));
        return totalAmountDue;
    },
    totalActualPay(){
        let totalAmountDue = 0;
        let customer = getCustomerInfo(Session.get('customerId'));
        let invoices = (customer && customer.termId) ? Invoices.find({}) : GroupInvoice.find({});
        if (invoices.count() > 0) {
            invoices.forEach(function (invoice) {
                var discount = invoice.status == 'active' ? checkTerm(invoice) : 0;
                let receivePayments = ReceivePayment.find({invoiceId: invoice._id}, {sort: {_id: 1, paymentDate: 1}});
                if (receivePayments.count() > 0) {
                    let lastPayment = _.last(receivePayments.fetch());
                    totalAmountDue += lastPayment.balanceAmount;
                } else {
                    totalAmountDue += invoice.total * (1 - (discount / 100));
                }
            });
        }
        Session.set('balance', numeral(totalAmountDue).format('0,0.00'));
        return totalAmountDue;
    },
    totalOriginAmount(){
        let totalOrigin = 0;
        let customer = getCustomerInfo(Session.get('customerId'));
        let collection = (customer && customer.termId) ? Invoices.find({}) : GroupInvoice.find({});
        collection.forEach(function (invoices) {
            totalOrigin += invoices.total;
        });
        return totalOrigin;
    },
    customerBalance(){
        return Session.get('balance');
    },
    total(){
        let discount = this.status == 'active' ? checkTerm(this) : 0;
        let valueAfterDiscount = this.total * (1 - (discount / 100));
        let lastPayment = getLastPayment(this._id);
        return lastPayment == 0 ? numeral(valueAfterDiscount).format('0,0.00') : numeral(lastPayment).format('0,0.00');
    },
    originAmount(){
        let lastPayment = getLastPayment(this._id);
        return lastPayment == 0 ? numeral(this.total).format('0,0.00') : numeral(lastPayment).format('0,0.00');

    },
    isInvoiceDate(){
        if (this.invoiceDate) {
            return moment(this.invoiceDate).format('YYYY-MM-DD HH:mm:ss');
        } else {
            let startDate = moment(this.startDate).format('YYYY-MM-DD');
            let endDate = moment(this.endDate).format('YYYY-MM-DD');
            return `${startDate} to ${endDate}`;
        }
    }
});

indexTmpl.events({
    'change .disable-term'(event, instance){
        if ($(event.currentTarget).prop('checked')) {
            Session.set('disableTerm', true);
            Session.set('discount', {discountIfPaidWithin: 0, discountPerecentages: 0})
        } else {
            getCustomerTerm(Session.get('customerId'));
        }
    },
    'change [name="customerId"]' (event, instance) {
        if (event.currentTarget.value != '') {
            clearChecbox();
            Session.set('customerId', event.currentTarget.value);
        }
    },
    'change [name="invoiceId"]' (event, instance) {
        clearChecbox();
        if (event.currentTarget.value != '') {
            Session.set('invoiceId', event.currentTarget.value)
        }
    },
    'click .select-invoice' (event, instance) {
        var selectedInvoices = Session.get('invoicesObj');
        let lastPayment = getLastPayment(this._id);
        var discount = $(event.currentTarget).parents('invoice-parents').find('.discount').val();
        if ($(event.currentTarget).prop('checked')) {
            $(event.currentTarget).parents('.invoice-parents').find('.total').val(lastPayment == 0 ? this.total : lastPayment).change();

        } else {
            delete selectedInvoices[this._id];
            selectedInvoices.count -= 1;
            $(event.currentTarget).parents('.invoice-parents').find('.total').val('');
            Session.set('invoicesObj', selectedInvoices);
        }
    },
    'click .select-all' (event, instance) {
        clearChecbox();
        if ($(event.currentTarget).prop('checked')) {
            let saleObj = Session.get('invoicesObj');
            let total = [];
            let index = 0;
            let customer = getCustomerInfo(Session.get('customerId'));
            let invoicesObj;
            if (customer.termId) {
                invoicesObj = Invoices.find({}, {
                    sort: {
                        _id: 1
                    }
                });
            } else {
                invoicesObj = GroupInvoice.find({}, {sort: {_id: 1}});
            }
            invoicesObj.forEach((sale) => {
                let lastPayment = getLastPayment(sale._id);
                sale.dueAmount = lastPayment == 0 ? sale.total : lastPayment;
                sale.receivedPay = lastPayment == 0 ? sale.total : lastPayment; //receive amount of pay
                saleObj[sale._id] = sale;
                total.push(sale.dueAmount);
            });
            saleObj.count = invoicesObj.count();
            Session.set('invoicesObj', saleObj);
            $('.select-invoice').each(function () {
                $(this).prop('checked', true);
                $(this).parents('.invoice-parents').find('.total').val(total[index]).change()
                index++;
            })
        } else {
            clearChecbox()
        }
    },
    'change .discount'(event, instance){
        let total = this.total;
        let discount = 0;
        if (event.currentTarget.value == '') {
            //trigger change on total
            $(event.currentTarget).parents('.invoice-parents').find('.total').val(total).change();
            $(event.currentTarget).parents('.invoice-parents').find('.actual-pay').text(numeral(total).format('0,0.00')).change();
            $(event.currentTarget).val('0');

        } else {
            //trigger change on total
            let valueAfterDiscount = total * (1 - (parseFloat(event.currentTarget.value) / 100));
            $(event.currentTarget).parents('.invoice-parents').find('.total').val(valueAfterDiscount).change();
            $(event.currentTarget).parents('.invoice-parents').find('.actual-pay').text(numeral(valueAfterDiscount).format('0,0.00')).change();
        }
    },
    "keypress .discount" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    },
    'change .total' (event, instance) {
        var selectedInvoices = Session.get('invoicesObj');
        var lastPayment = getLastPayment(this._id);
        var discount = $(event.currentTarget).parents('.invoice-parents').find('.discount').val(); // get discount
        if (event.currentTarget.value == '' || event.currentTarget.value == '0') {
            if (_.has(selectedInvoices, this._id)) {
                selectedInvoices.count -= 1;
                delete selectedInvoices[this._id];
                Session.set('invoicesObj', selectedInvoices);
                $(event.currentTarget).val('');
                $(event.currentTarget).parents('.invoice-parents').find('.select-invoice').prop('checked', false);
            }
        } else {
            if (!_.has(selectedInvoices, this._id)) {
                selectedInvoices.count += 1;
            }
            selectedInvoices[this._id] = this;
            selectedInvoices[this._id].discount = parseFloat(discount);
            selectedInvoices[this._id].receivedPay = parseFloat(event.currentTarget.value);
            selectedInvoices[this._id].dueAmount = lastPayment == 0 ? this.total * (1 - parseFloat(discount / 100)) : lastPayment;
            $(event.currentTarget).parents('.invoice-parents').find('.select-invoice').prop('checked', true);
            if (parseFloat(event.currentTarget.value) > selectedInvoices[this._id].dueAmount) { //check if entering payment greater than dueamount
                selectedInvoices[this._id].receivedPay = selectedInvoices[this._id].dueAmount;
                $(event.currentTarget).parents('.invoice-parents').find('.total').val(selectedInvoices[this._id].dueAmount);
            }
            Session.set('invoicesObj', selectedInvoices);
            $(event.currentTarget).val(numeral(event.currentTarget.value).format('0,0.00'));
        }
    },
    "keypress .total" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    }
});

//functions
function clearChecbox() {
    Session.set('invoiceId', 0); //clear checkbox
    Session.set('disableTerm', false);
    Session.set('invoiceId', '');
    Session.set('invoicesObj', {
        count: 0
    }); //set obj to empty on keychange
    $(".disable-term").prop('checked', false);
    $(".select-invoice").each(function () {
        $(this).prop('checked', false);
        $(this).parents('.invoice-parents').find('.total').val('');
    })
}
function getLastPayment(invoiceId) {
    let receivePayments = ReceivePayment.find({invoiceId: invoiceId}, {sort: {_id: 1, paymentDate: 1}});
    if (receivePayments.count() > 0) {
        let lastPayment = _.last(receivePayments.fetch());
        return lastPayment.balanceAmount;
    }
    return 0;
}
function checkTerm(self) {
    if (self.status == 'active') {
        let term = Session.get('discount');
        let invoiceDate = self.invoiceDate;
        let dueDate = moment(invoiceDate).add(`${term.discountIfPaidWithin}`, 'days');
        term.invoiceDate = invoiceDate;
        term.dueDate = dueDate;
        if (term.discountIfPaidWithin == 0) {
            return 0;
        }
        if (moment(term.invoiceDate).isSameOrBefore(term.dueDate, 'day')) {
            return term.discountPercentages;
        }
    }
    return 0;

}
function getCustomerTerm(customerId) {
    let customer = getCustomerInfo(customerId);
    if (customer && customer._term) {
        Session.set('discount', {
            discountIfPaidWithin: customer._term.discountIfPaidWithin,
            discountPercentages: customer._term.discountPercentages
        });
        return `Term: ${customer._term.name}`;
    } else {
        Session.set('discount', {discountIfPaidWithin: 0, discountPerecentages: 0, invoiceId: ''});
        return 0;

    }
    return false;
}
function getCustomerInfo(id) {
    return Customers.findOne(id);
}
//autoform hook
let hooksObject = {
    onSubmit(){
        this.event.preventDefault();
        let invoicesObj = Session.get('invoicesObj');
        let branch = Session.get('currentBranch');
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
                receivePayment.callPromise({paymentDate, invoicesObj, branch})
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

//components

//collections
import {EnterBills} from '../../api/collections/enterBill';
import {PayBills} from '../../api/collections/payBill';
//schema
import {payBillSchema} from '../../api/collections/payBillSchema.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {AutoForm} from 'meteor/aldeed:autoform';
// import {receivePayment} from '../../../common/methods/receivePayment';
//page
import './payBill.html';
//methods
import {payBill} from '../../../common/methods/payBill';
let indexTmpl = Template.Pos_payBill;
Tracker.autorun(function () {
    if (Session.get('vendorId')) {
        Meteor.subscribe('pos.activeEnterBills', {
            vendorId: Session.get('vendorId'),
            status: {$in: ['active', 'partial']}
        });
    }
    if (Session.get('enterBills')) {
        Meteor.subscribe('pos.payBills', {
            billId: {
                $in: Session.get('enterBills')
            },
            status: {$in: ['active', 'partial']}
        });
    }
});
indexTmpl.onCreated(function () {
    Session.set('amountDue', 0);
    Session.set('enterBillsObjCount', 0);
    Session.set('amount', 0);
    Session.set('enterBillsObj', {
        count: 0
    });
    Session.set('balance', 0)
});
indexTmpl.onDestroyed(function () {
    Session.set('enterBills', undefined);
    Session.set('amountDue', 0);
    Session.set('amount', 0);
    Session.set('enterBillsObj', {
        count: 0
    });
    Session.set('balance', 0)
});
indexTmpl.rendered = function () {
    Session.set('vendorId', FlowRouter.getParam('vendorId'));
};
indexTmpl.helpers({
    countIsqualSales() {
        let enterBillsObj = Session.get('enterBillsObj');
        if (EnterBills.find().count() != 0 && enterBillsObj.count == EnterBills.find().count()) {
            return true;
        }
        return false;
    },
    doc() {
        return {
            vendorId: FlowRouter.getParam('vendorId')
        }
    },
    dueAmount(){
        let total = this.total || 0;
        let lastPayment = getLastPayment(this._id);
        return lastPayment == 0 ? `${numeral(total).format('0,0.00')}` : `${numeral(lastPayment).format('0,0.00')}`;
    },
    schema() {
        return payBillSchema;
    },
    enterBills() {
        let enterBills = EnterBills.find({}, {
            sort: {
                _id: 1
            }
        });
        debugger
        if (enterBills.count() > 0) {
            let arr = [];
            enterBills.forEach(function (bill) {
                let lastPayment = getLastPayment(bill._id);
                arr.push(bill._id);
                bill.dueAmount = lastPayment == 0 ? bill.total : lastPayment;
            });
            Session.set('enterBills', arr);
            return enterBills;
        }
        return false;
    },
    hasAmount() {
        let amount = Session.get('amount');
        var lastPayment = getLastPayment(this._id);
        if (this.status == 'active' && this.total == amount) { //match due amount with status active
            let saleEnterBills = {
                count: 0
            };
            saleEnterBills.count += 1;
            this.receivedPay = this.total;
            saleEnterBills[this._id] = this;
            saleEnterBills[this._id].dueAmount = lastPayment == 0 ? this.total : lastPayment;
            Session.set('enterBillsObj', saleEnterBills);
            return true;
        }
        if (this.status == 'partial' && lastPayment == amount) { //match due amount with status partial
            let saleEnterBills = {
                count: 0
            };
            saleEnterBills.count += 1;
            this.receivedPay = lastPayment;
            saleEnterBills[this._id] = this;
            saleEnterBills[this._id].dueAmount = lastPayment == 0 ? this.total : lastPayment;
            Session.set('enterBillsObj', saleEnterBills);
            return true;
        }
        return false;
    },
    totalPaid(){
        let totalPaid = 0;
        let enterBillsObjObj = Session.get('enterBillsObj');
        delete enterBillsObjObj.count;
        if (_.isEmpty(enterBillsObjObj)) {
            return 0;
        } else {
            for (let k in enterBillsObjObj) {
                totalPaid += enterBillsObjObj[k].receivedPay
            }
            return totalPaid;
        }
    },
    totalAmountDue(){
        let totalAmountDue = 0;
        let enterBills = EnterBills.find({})
        if (enterBills.count() > 0) {
            enterBills.forEach(function (enterBills) {
                let payBills = PayBills.find({billId: enterBills._id}, {sort: {_id: 1, paymentDate: 1}});
                if (payBills.count() > 0) {
                    let lastPayment = _.last(payBills.fetch());
                    totalAmountDue += lastPayment.balanceAmount;
                } else {
                    totalAmountDue += enterBills.total;
                }
            });
        }
        Session.set('balance', numeral(totalAmountDue).format('0,0.00'));
        return totalAmountDue;
    },
    totalOriginAmount(){
        let totalOrigin = 0;
        EnterBills.find({}).forEach(function (enterBills) {
            totalOrigin += enterBills.total;
        });
        return totalOrigin;
    },
    vendorBalance(){
        return Session.get('balance');
    },
    total(){
        let lastPayment = getLastPayment(this._id);
        return lastPayment == 0 ? numeral(this.total).format('0,0.00') : numeral(lastPayment).format('0,0.00');
    }
});

indexTmpl.events({
    'change [name="vendorId"]' (event, instance) {
        if (event.currentTarget.value != '') {
            clearChecbox();
            Session.set('vendorId', event.currentTarget.value);
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
    'click .select-bill' (event, instance) {
        var selectedEnterBills = Session.get('enterBillsObj')
        let lastPayment = getLastPayment(this._id);
        if ($(event.currentTarget).prop('checked')) {
            $(event.currentTarget).parents('.bill-parents').find('.total').val(lastPayment == 0 ? this.total : lastPayment);
            this.receivedPay = lastPayment == 0 ? this.total : lastPayment;
            selectedEnterBills[this._id] = this;
            selectedEnterBills[this._id].dueAmount = lastPayment == 0 ? this.total : lastPayment;
            selectedEnterBills.count += 1;
            Session.set('enterBillsObj', selectedEnterBills)
        } else {
            delete selectedEnterBills[this._id];
            selectedEnterBills.count -= 1;
            $(event.currentTarget).parents('.bill-parents').find('.total').val('');
            Session.set('enterBillsObj', selectedEnterBills)
        }
    },
    'click .select-all' (event, instance) {
        clearChecbox();
        if ($(event.currentTarget).prop('checked')) {
            let saleObj = Session.get('enterBillsObj');
            let total = []
            let index = 0;
            let enterBillsObj = EnterBills.find({}, {
                sort: {
                    _id: 1
                }
            });
            enterBillsObj.forEach((sale) => {
                let lastPayment = getLastPayment(sale._id);
                sale.dueAmount = lastPayment == 0 ? sale.total : lastPayment;
                sale.receivedPay = lastPayment == 0 ? sale.total : lastPayment; //receive amount of pay
                saleObj[sale._id] = sale;
                total.push(sale.dueAmount);
            })
            saleObj.count = enterBillsObj.count();
            Session.set('enterBillsObj', saleObj);
            $('.select-bill').each(function () {
                $(this).prop('checked', true);
                $(this).parents('.bill-parents').find('.total').val(total[index])
                index++;
            })
        } else {
            clearChecbox();
        }
    },
    'change .total' (event, instance) {
        var selectedEnterBills = Session.get('enterBillsObj');
        var lastPayment = getLastPayment(this._id);
        if (event.currentTarget.value == '' || event.currentTarget.value == '') {
            if (_.has(selectedEnterBills, this._id)) {
                selectedEnterBills.count -= 1;
                delete selectedEnterBills[this._id];
                Session.set('enterBillsObj', selectedEnterBills);
                $(event.currentTarget).parents('.bill-parents').find('.select-enterBills').prop('checked', false);
            }
        } else {
            if (!_.has(selectedEnterBills, this._id)) {
                selectedEnterBills.count += 1;
            }
            selectedEnterBills[this._id] = this;
            selectedEnterBills[this._id].receivedPay = parseFloat(event.currentTarget.value);
            selectedEnterBills[this._id].dueAmount = lastPayment == 0 ? this.total : lastPayment;
            $(event.currentTarget).parents('.bill-parents').find('.select-bill').prop('checked', true);
            if (parseFloat(event.currentTarget.value) > selectedEnterBills[this._id].dueAmount) { //check if entering payment greater than dueamount
                selectedEnterBills[this._id].receivedPay = selectedEnterBills[this._id].dueAmount;
                $(event.currentTarget).parents('.bill-parents').find('.total').val(selectedEnterBills[this._id].dueAmount);
            }
            Session.set('enterBillsObj', selectedEnterBills);
        }
    },
    "keypress .total" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    }
});


function clearChecbox() {
    Session.set('amount', 0); //clear checkbox
    Session.set('enterBillsObj', {
        count: 0
    }); //set obj to empty on keychange
    $(".select-bill").each(function () {
        $(this).prop('checked', false);
        $(this).parents('.bill-parents').find('.total').val('');
    })
}
function getLastPayment(billId) {
    let payBills = PayBills.find({billId: billId}, {sort: {_id: 1, paymentDate: 1}});
    if (payBills.count() > 0) {
        let lastPayment = _.last(payBills.fetch());
        return lastPayment.balanceAmount;
    }
    return 0;
}
let hooksObject = {
    onSubmit(){
        this.event.preventDefault();
        let enterBillsObj = Session.get('enterBillsObj');
        delete enterBillsObj.count;
        if (_.isEmpty(enterBillsObj)) {
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
                payBill.callPromise({paymentDate, enterBillsObj})
                    .then(function (result) {
                        clearChecbox();
                        console.log(result)
                        swal({
                            title: "Pay Bill",
                            text: "Successfully paid!",
                            type: "success",
                            confirmButtonClass: "btn-success",
                            showConfirmButton: true,
                            timer: 3000
                        });
                    })
                    .catch(function (err) {
                        Session.set('enterBillsObj', {count: 0});
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
    'Pos_payBill'
], hooksObject);

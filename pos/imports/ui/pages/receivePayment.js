//components

//collections
import {Order} from '../../api/collections/order.js';
import {ReceivePayment} from '../../api/collections/receivePayment';
//schema
import {receivePaymentSchema} from '../../api/collections/receivePaymentSchema.js';
//page
import './receivePayment.html';
//methods
import {amountDue} from '../../../common/methods/receivePayment.js';

let indexTmpl = Template.Pos_receivePayment;
Tracker.autorun(function () {
    if (Session.get('customerId')) {
        Meteor.subscribe('pos.activeOrder', {
            customerId: Session.get('customerId'),
            status: 'active'
        });
    }
    if (Session.get('orders')) {
        Meteor.subscribe('pos.receivePayment', {
            orderId: {
                $in: Session.get('orders')
            }
        });
    }
});
indexTmpl.onCreated(function () {
    Session.set('totalAmountDue', 0);
    Session.set('amountDue', 0);
    Session.set('salesCount', 0);
    Session.set('amount', 0);
    Session.set('sales', {
        count: 0
    });
    Session.set('balance', 0)
});
indexTmpl.onDestroyed(function () {
    Session.set('orders', undefined);
    Session.set('amountDue', 0);
    Session.set('amount', 0);
    Session.set('totalAmountDue', 0);
    Session.set('sales', {
        count: 0
    });
    Session.set('balance', 0)
});
indexTmpl.rendered = function () {
    Session.set('customerId', FlowRouter.getParam('customerId'));
};
indexTmpl.helpers({
    countIsqualSales() {
        let sales = Session.get('sales');
        if (Order.find().count() != 0 && sales.count == Order.find().count()) {
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
        let receivePayments = ReceivePayment.find({orderId: this._id}, {sort: {_id: 1, paymentDate: 1}});
        if(receivePayments.count> 0){
           let lastPayment =  _.last(receivePayments.fetch());
            totalAmountDue += lastPayment.balance;
            return lastPayment.balance;
        }
        total
        return `${numeral(this.total).format('0,0.00')}`;
    },
    schema() {
        return receivePaymentSchema;
    },
    orders() {
        let orders = Order.find({}, {
            sort: {
                _id: 1
            }
        });
        if (orders.count() > 0) {
            let arr = [];
            orders.forEach(function (order) {
                arr.push(order);
            });
            Session.set('orders', arr);
            return orders;
        }
        return false;
    },
    hasAmount() {
        let amount = Session.get('amount');
        if (this.status == 'partial' || this.status == 'closed' || this.total == amount) {
            let saleOrder = {
                count: 0
            };
            saleOrder.count += 1;
            this.receivedPay = this.total;
            saleOrder[this._id] = this;
            Session.set('sales', saleOrder);
            return true;
        }
        return false;
    },
    totalPaid(){
        let totalPaid = 0;
        let salesObj = Session.get('sales');
        delete salesObj.count;
        if (_.isEmpty(salesObj)) {
            return 0;
        } else {
            for (let k in salesObj) {
                totalPaid += salesObj[k].receivedPay
            }
            return totalPaid;
        }
    }
})

indexTmpl.events({
    'change [name="customerId"]' (event, instance) {
        if (event.currentTarget.value != '') {
            clearChecbox();
            Session.set('customerId', event.currentTarget.value);
        }
    },
    'keyup [name="amount"]' (event, instance) {
        clearChecbox();
        if (event.currentTarget.value != '') {
            Session.set('amount', parseFloat(event.currentTarget.value))
        }
    },
    "keypress [name='amount']" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    },
    'click .select-order' (event, instance) {
        var selectedOrder = Session.get('sales')
        if ($(event.currentTarget).prop('checked')) {
            $(event.currentTarget).parents('.order-parents').find('.total').val(this.total)
            this.receivedPay = this.total;
            selectedOrder[this._id] = this;
            selectedOrder.count += 1;
            Session.set('sales', selectedOrder)
        } else {
            delete selectedOrder[this._id];
            selectedOrder.count -= 1;
            $(event.currentTarget).parents('.order-parents').find('.total').val('')
            Session.set('sales', selectedOrder)
        }
    },
    'click .select-all' (event, instance) {
        clearChecbox();
        if ($(event.currentTarget).prop('checked')) {
            let saleObj = Session.get('sales');
            let total = []
            let index = 0;
            let sales = Order.find({}, {
                sort: {
                    _id: 1
                }
            });
            sales.forEach((sale) => {
                sale.receivedPay = sale.total; //receive amount of pay
                saleObj[sale._id] = sale;
                total.push(sale.total);
            })
            saleObj.count = sales.count();
            Session.set('sales', saleObj);
            $('.select-order').each(function () {
                $(this).prop('checked', true);
                $(this).parents('.order-parents').find('.total').val(total[index])
                index++;
            })
        } else {
            clearChecbox()
        }
    },
    'change .total' (event, instance) {
        var selectedOrder = Session.get('sales');
        if (event.currentTarget.value == '') {
            if (_.has(selectedOrder, this._id)) {
                selectedOrder.count -= 1;
                delete selectedOrder[this._id];
                Session.set('sales', selectedOrder);
                $(event.currentTarget).parents('.order-parents').find('.select-order').prop('checked', false);
            }
        } else {
            if (!_.has(selectedOrder, this._id)) {
                selectedOrder.count += 1;
            }
            selectedOrder[this._id] = this;
            selectedOrder[this._id].receivedPay = parseFloat(event.currentTarget.value);
            $(event.currentTarget).parents('.order-parents').find('.select-order').prop('checked', true);
            Session.set('sales', selectedOrder);
        }
    },
    "keypress .total" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    }
})


function clearChecbox() {
    Session.set('amount', 0); //clear checkbox
    Session.set('sales', {
        count: 0
    }); //set obj to empty on keychange
    $(".select-order").each(function () {
        $(this).prop('checked', false);
        $(this).parents('.order-parents').find('.total').val('');
    })
}

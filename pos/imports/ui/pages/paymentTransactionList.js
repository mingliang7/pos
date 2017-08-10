import { Template } from 'meteor/templating';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Roles } from 'meteor/alanning:roles';
import { alertify } from 'meteor/ovcharik:alertifyjs';
import { sAlert } from 'meteor/juliancwirko:s-alert';
import { fa } from 'meteor/theara:fa-helpers';
import { lightbox } from 'meteor/theara:lightbox-helpers';
import { TAPi18n } from 'meteor/tap:i18n';
import { ReactiveTable } from 'meteor/aslagle:reactive-table';
import { ReactiveMethod } from 'meteor/simple:reactive-method';

// Lib
import { createNewAlertify } from '../../../../core/client/libs/create-new-alertify.js';
import { renderTemplate } from '../../../../core/client/libs/render-template.js';
import { destroyAction } from '../../../../core/client/libs/destroy-action.js';
import { displaySuccess, displayError } from '../../../../core/client/libs/display-alert.js';
import { __ } from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import { ReceivePayment } from '../../api/collections/receivePayment.js';

// Tabular
import { PaymentTransactionListTabular } from '../../../common/tabulars/receivePayment.js';

// Page
import './paymentTransactionList.html';
import { tmpCollection } from '../../api/collections/tmpCollection';
// Declare template
let indexTmpl = Template.Pos_paymentTransaction,
    actionTmpl = Template.Pos_paymentTransactionAction,
    editTmpl = Template.Pos_paymentTransactionEdit,
    showTmpl = Template.Pos_paymentTransactionShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('paymentTransaction', { size: 'lg' });
    createNewAlertify('paymentShow')
    // Reactive table filter

});

indexTmpl.helpers({
    tabularTable() {
        return PaymentTransactionListTabular;
    },
    customerId() {
        let customerId = FlowRouter.query.get('cid');
        return !!customerId;
    },
    selector() {
        let selector = { branchId: Session.get('currentBranch'), status: { $in: ['closed', 'partial'] } };
        let customerId = FlowRouter.query.get('cid');
        if (customerId) {
            selector.customerId = customerId;
        }
        return selector;
    },
    displayCustomerObj() {
        let customerObj = Session.get('customer::customerObj');
        if (customerObj) {
            return `<blockquote style="background: teal;color: white;">
                    Customer &emsp;&emsp;: ${customerObj.name}<br>
                    Balance &emsp;&emsp;&nbsp;&nbsp;&nbsp;: ${numeral(customerObj.balance).format('0,0.00')}
                </blockquote>`
        }
        return ''
    },

});

indexTmpl.onDestroyed(function () {
    tmpCollection.remove({});
});

indexTmpl.events({
    'click .js-update'(event, instance) {
        // alertify.penalty(fa('pencil', TAPi18n.__('pos.penalty.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy'(event, instance) {
        let doc = this;
        swal({
            title: "Are you sure?",
            text: `ធ្វើការលុបវិក័យប័ត្របង់ប្រាក់លេខ  ${this._id}`,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }).then(function () {
            Meteor.call('removedReceivePayment', { doc });
            swal("Deleted!", `វិក័យប័ត្របង់ប្រាក់លេខ ${doc._id} បានលុបដោយជោគជ័យ`, "success");
        });
    },
    'click .js-display'(event, instance) {
        Meteor.call('lookupReceivePaymentObj', this._id, (err, result) => {
            alertify.paymentShow(fa('eyes', 'Show Payment'), renderTemplate(showTmpl, result));
        })
    }
});

// Edit


editTmpl.helpers({

    collection() {
        return ReceivePayment;
    },
    data() {
        let data = this;
        return data;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(() => {
        this.subscribe('pos.penalty', { _id: this.data._id });
    });
});

showTmpl.helpers({
    calcActualDueAmount(dueAmount,discount) {
        let recalDueAmountWithDiscount = dueAmount / (1 - (discount / 100));
        return numeral(recalDueAmountWithDiscount).format('0,0.000');
    }
});

// Hook
let hooksObject = {
    onSuccess(formType, result) {
        if (formType == 'update') {
            alertify.penalty().close();
        } else {
            Session.set('createPenalty', true);
        }
        displaySuccess();
    },
    onError(formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_paymentTransactionListNew',
    'Pos_paymentTransactionListEdit'
], hooksObject);

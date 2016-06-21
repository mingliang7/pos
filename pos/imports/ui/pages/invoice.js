import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {_} from 'meteor/erasaur:meteor-lodash';
import 'meteor/theara:jsonview';
import {TAPi18n} from 'meteor/tap:i18n';
import 'meteor/tap:i18n-ui';


// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import {Invoices} from '../../api/collections/invoice.js';
import {Order} from '../../api/collections/order';

// Tabular
import {InvoiceTabular} from '../../../common/tabulars/invoice.js';

// Page
import './invoice.html';
import './invoice-items.js';
import './info-tab.html';

//methods
import {invoiceInfo} from '../../../common/methods/invoice.js'
import {customerInfo} from '../../../common/methods/customer.js';
//Tracker for customer infomation
Tracker.autorun(function () {
    if (Session.get("getCustomerId")) {
        customerInfo.callPromise({_id: Session.get("getCustomerId")})
            .then(function (result) {
                Session.set('customerInfo', result);
            })
    }
});
// Declare template
let indexTmpl = Template.Pos_invoice,
    actionTmpl = Template.Pos_invoiceAction,
    newTmpl = Template.Pos_invoiceNew,
    editTmpl = Template.Pos_invoiceEdit,
    showTmpl = Template.Pos_invoiceShow,
    listSaleOrder = Template.listSaleOrder;
// Local collection
let itemsCollection = new Mongo.Collection(null);

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('invoice', {size: 'lg'});
    createNewAlertify('invoiceShow',);
    createNewAlertify('listSaleOrder', {size: 'lg'});
});

indexTmpl.helpers({
    tabularTable(){
        return InvoiceTabular;
    },
    selector() {
        return {branchId: Session.get('currentBranch')};
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.invoice(fa('plus', TAPi18n.__('pos.invoice.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        alertify.invoice(fa('pencil', TAPi18n.__('pos.invoice.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        let data = this;
        destroyAction(
            Invoices,
            {_id: data._id},
            {title: TAPi18n.__('pos.invoice.title'), itemTitle: data._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.invoiceShow(fa('eye', TAPi18n.__('pos.invoice.title')), renderTemplate(showTmpl, this));
    },
    'click .js-invoice' (event, instance) {
        let params = {};
        let queryParams = {invoiceId: this._id};
        let path = FlowRouter.path("pos.invoiceReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});

// New
newTmpl.events({
    'change [name=customerId]'(event, instance){
        if (event.currentTarget.value != '') {
            Session.set('getCustomerId', event.currentTarget.value);
            if (FlowRouter.query.get('customerId')) {
                FlowRouter.query.set('customerId', event.currentTarget.value);
            }
        }

    },
    'change .enable-sale-order'(event, instance){
        let customerId = $('[name="customerId"]').val();
        if ($(event.currentTarget).prop('checked')) {
            if (customerId != '') {
                FlowRouter.query.set('customerId', customerId);
                $('.sale-order').addClass('toggle-list');
                alertify.listSaleOrder(fa('', 'Sale Order'), renderTemplate(listSaleOrder));
            } else {
                displayError('Please select customer');
                $(event.currentTarget).prop('checked', false);
            }

        } else {
            FlowRouter.query.unset();
            $('.sale-order').removeClass('toggle-list');
        }
    },
    'click .toggle-list'(event, instance){
        alertify.listSaleOrder(fa('', 'Sale Order'), renderTemplate(listSaleOrder));
    }
});
newTmpl.helpers({
    customerInfo() {
        let customerInfo = Session.get('customerInfo');
        if (!customerInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li>Phone: <b>${customerInfo.telephone ? customerInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${customerInfo.creditLimit ? numeral(customerInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Sale Order to be invoice: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return Invoices;
    },
    itemsCollection(){
        return itemsCollection;
    },
    disabledSubmitBtn: function () {
        let cont = itemsCollection.find().count();
        if (cont == 0) {
            return {disabled: true};
        }

        return {};
    }
});

newTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('customerInfo', undefined);
    Session.set('getCustomerId', undefined);
    FlowRouter.query.unset();
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.invoice', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return Invoices;
    },
    data () {
        let data = Invoices.findOne(this._id);

        // Add items to local collection
        _.forEach(data.items, (value)=> {
            Meteor.call('getItem', value.itemId, function (err, result) {
                value.name = result.name;
                itemsCollection.insert(value);
            })
        });

        return data;
    },
    itemsCollection(){
        return itemsCollection;
    },
    disabledSubmitBtn: function () {
        let cont = itemsCollection.find().count();
        if (cont == 0) {
            return {disabled: true};
        }

        return {};
    }
});

editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
});

// Show
showTmpl.onCreated(function () {
    this.invoice = new ReactiveVar();
    this.autorun(()=> {
        invoiceInfo.callPromise({_id: this.data._id})
            .then((result) => {
                this.invoice.set(result);
            }).catch(function (err) {
                console.log(err.message);
            }
        );
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let key = `pos.invoice.schema.${label}.label`;
        return TAPi18n.__(key);
    },
    invoiceInfo () {

        let invoiceInfo = Template.instance().invoice.get();

        // Use jsonview
        invoiceInfo.jsonViewOpts = {collapsed: true};
        //
        return invoiceInfo;
    }
});
//listSaleOrder
listSaleOrder.helpers({
    saleOrders(){
        return Order.find({status: 'active', customerId: FlowRouter.query.get('customerId')});
    },
    hasSaleOrders(){
        let count = Order.find({status: 'active', customerId: FlowRouter.query.get('customerId')}).count();
        return count > 0;
    }
});
listSaleOrder.events({
    'click .sale-doc'(event,instance){
        itemsCollection.remove({});
        this.items.forEach(function (item) {
            Meteor.call('getItem', item.itemId, function (err, result) {
                item.name = result.name;
                itemsCollection.insert(item);
            });
        });
        alertify.listSaleOrder().close();
    }
});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                items.push(obj);
            });
            doc.items = items;

            return doc;
        },
        update: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                items.push(obj);
            });
            doc.$set.items = items;

            delete doc.$unset;

            return doc;
        }
    },
    onSuccess (formType, result) {
        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});

        alertify.invoice().close();
        // }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_invoiceNew',
    'Pos_invoiceEdit'
], hooksObject);

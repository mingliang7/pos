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
import {Item} from '../../api/collections/item';
import {deletedItem} from './invoice-items';
// Tabular
import {InvoiceTabular} from '../../../common/tabulars/invoice.js';

// Page
import './invoice.html';
import './invoice-items.js';
import './info-tab.html';
import './customer.html';
//methods
import {invoiceInfo} from '../../../common/methods/invoice.js'
import {customerInfo} from '../../../common/methods/customer.js';
import {isGroupInvoiceClosed} from '../../../common/methods/invoiceGroup';

//Tracker for customer infomation
Tracker.autorun(function () {
    if (Session.get("getCustomerId")) {
        customerInfo.callPromise({_id: Session.get("getCustomerId")})
            .then(function (result) {
                Session.set('customerInfo', result);
            })
    }
    if (Session.get('saleOrderItems')) {
        Meteor.subscribe('pos.item', {_id: {$in: Session.get('saleOrderItems')}});
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
    createNewAlertify('customer');
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
        alertify.invoice(fa('cart-arrow-down', TAPi18n.__('pos.invoice.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        if (this.saleId || (this.invoiceType == 'term' && this.status != 'closed')) {
            excuteEditForm(this);
        }
        else if (this.invoiceType == 'term' && this.status == 'closed') {
            swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រលេខ ${this._id} ជាមុនសិន`, "error")
        }
        else if (this.paymentGroupId) {
            Meteor.call('pos.isGroupInvoiceClosed', {_id: this.paymentGroupId}, (err, result)=> {
                if (result.paid) {
                    swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រក្រុមលេខ ${this.paymentGroupId} ជាមុនសិន`, "error")
                } else {
                    excuteEditForm(this);
                }
            });
        }
    },
    'click .js-destroy' (event, instance) {
        let data = this;
        if (this.invoiceType == 'term' && this.status == 'closed') {
            swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រលេខ ${this._id} ជាមុនសិន`, "error")
        }
        else if (this.paymentGroupId) {
            Meteor.call('pos.isGroupInvoiceClosed', {_id: this.paymentGroupId}, (err, result)=> {
                if (result.paid) {
                    swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រក្រុមលេខ ${this.paymentGroupId} ជាមុនសិន`, "error")
                } else {
                    destroyAction(
                        Invoices,
                        {_id: data._id},
                        {title: TAPi18n.__('pos.invoice.title'), itemTitle: data._id}
                    );
                }
            });
        }else{
            destroyAction(
                Invoices,
                {_id: data._id},
                {title: TAPi18n.__('pos.invoice.title'), itemTitle: data._id}
            );
        }
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
//on rendered
newTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
});
// New
newTmpl.events({
    'click .add-new-customer'(event, instance){
        alertify.customer(fa('plus', 'New Customer'), renderTemplate(Template.Pos_customerNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.invoice().close();
    },
    'change [name=customerId]'(event, instance){
        if (event.currentTarget.value != '') {
            Session.set('getCustomerId', event.currentTarget.value);
            if (FlowRouter.query.get('customerId')) {
                FlowRouter.query.set('customerId', event.currentTarget.value);
            }
        }
        Session.set('totalOrder', undefined);

    },
    'change .enable-sale-order'(event, instance){
        itemsCollection.remove({});
        let customerId = $('[name="customerId"]').val();
        if ($(event.currentTarget).prop('checked')) {
            if (customerId != '') {
                FlowRouter.query.set('customerId', customerId);
                $('.sale-order').addClass('toggle-list');
                setTimeout(function () {
                    alertify.listSaleOrder(fa('', 'Sale Order'), renderTemplate(listSaleOrder));
                }, 700)
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
    },
    'change [name="termId"]'(event, instance){
        let customerInfo = Session.get('customerInfo');
        Meteor.call('getTerm', event.currentTarget.value, function (err, result) {
            customerInfo._term.netDueIn = result.netDueIn;
            Session.set('customerInfo', customerInfo);
        });
    }
});
newTmpl.helpers({
    repId(){
        if (Session.get('customerInfo')) {
            try {
                return Session.get('customerInfo').repId;
            } catch (e) {

            }
        }
        return '';
    },
    termId(){
        if (Session.get('customerInfo')) {
            try {
                return Session.get('customerInfo').termId;
            } catch (e) {

            }
        }
        return '';
    },
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    termOption(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().termList) {
            return instance.repOptions.get().termList
        }
        return '';
    },
    totalOrder(){
        let total = 0;
        if (!FlowRouter.query.get('customerId')) {
            itemsCollection.find().forEach(function (item) {
                total += item.amount;
            });
        }
        if (Session.get('totalOrder')) {
            let totalOrder = Session.get('totalOrder');
            return totalOrder;
        }
        return {total};
    },
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
    repId(){
        if (Session.get('customerInfo')) {
            return Session.get('customerInfo').repId;
        }
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
    },
    dueDate(){
        let date = AutoForm.getFieldValue('invoiceDate');
        if (Session.get('customerInfo')) {
            if (Session.get('customerInfo')._term) {
                let term = Session.get('customerInfo')._term;

                let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                console.log(dueDate);
                return dueDate;
            }
        }
        return date;
    },
    isTerm(){
        if (Session.get('customerInfo')) {
            let customerInfo = Session.get('customerInfo');
            if (customerInfo._term) {
                return true;
            }
            return false;
        }
    }
});

newTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('customerInfo', undefined);
    Session.set('getCustomerId', undefined);
    FlowRouter.query.unset();
    Session.set('saleOrderItems', undefined);
    Session.set('totalOrder', undefined);
});

// Edit
editTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    this.isSaleOrder = new ReactiveVar(false);
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
    if (this.data.invoiceType == 'saleOrder') {
        FlowRouter.query.set('customerId', this.data.customerId);
        this.isSaleOrder.set(true);
    }
});


editTmpl.events({
    'click .add-new-customer'(event, instance){
        alertify.customer(fa('plus', 'New Customer'), renderTemplate(Template.Pos_customerNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.invoice().close();
    },
    'change [name=customerId]'(event, instance){
        if (event.currentTarget.value != '') {
            Session.set('getCustomerId', event.currentTarget.value);
            if (FlowRouter.query.get('customerId')) {
                FlowRouter.query.set('customerId', event.currentTarget.value);
            }
        }
        Session.set('totalOrder', undefined);

    },
    'click .toggle-list'(event, instance){
        alertify.listSaleOrder(fa('', 'Sale Order'), renderTemplate(listSaleOrder));
    },
    'change [name="termId"]'(event, instance){
        let customerInfo = Session.get('customerInfo');
        Meteor.call('getTerm', event.currentTarget.value, function (err, result) {
            customerInfo._term.netDueIn = result.netDueIn;
            Session.set('customerInfo', customerInfo);
        });
    }
});
editTmpl.helpers({
    closeSwal(){
        setTimeout(function () {
            swal.close();
        }, 500);
    },
    isSaleOrder(){
        return Template.instance().isSaleOrder.get();
    },
    collection(){
        return Invoices;
    },
    data () {
        let data = this;
        // Add items to local collection
        _.forEach(data.items, (value)=> {
            Meteor.call('getItem', value.itemId, (err, result)=> {
                value.name = result.name;
                value.saleId = this.saleId;
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
    },
    repId(){
        if (Session.get('customerInfo')) {
            try {
                return Session.get('customerInfo').repId;
            } catch (e) {

            }
        }
        return '';
    },
    termId(){
        if (Session.get('customerInfo')) {
            try {
                return Session.get('customerInfo').termId;
            } catch (e) {

            }
        }
        return '';
    },
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    termOption(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().termList) {
            return instance.repOptions.get().termList
        }
        return '';
    },
    totalOrder(){
        let total = 0;
        if (!FlowRouter.query.get('customerId')) {
            itemsCollection.find().forEach(function (item) {
                total += item.amount;
            });
        }
        if (Session.get('totalOrder')) {
            let totalOrder = Session.get('totalOrder');
            return totalOrder;
        }
        return {total};
    },
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
    repId(){
        if (Session.get('customerInfo')) {
            return Session.get('customerInfo').repId;
        }
    },
    collection(){
        return Invoices;
    },
    itemsCollection(){
        return itemsCollection;
    },
    dueDate(){
        let date = AutoForm.getFieldValue('invoiceDate');
        if (Session.get('customerInfo')) {
            if (Session.get('customerInfo')._term) {
                let term = Session.get('customerInfo')._term;

                let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                console.log(dueDate);
                return dueDate;
            }
        }
        return date;
    },
    isTerm(){
        if (Session.get('customerInfo')) {
            let customerInfo = Session.get('customerInfo');
            if (customerInfo._term) {
                return true;
            }
            return false;
        }
    }
});

editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('customerInfo', undefined);
    Session.set('getCustomerId', undefined);
    FlowRouter.query.unset();
    Session.set('saleOrderItems', undefined);
    Session.set('totalOrder', undefined);
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
        let item = [];
        let saleOrders = Order.find({status: 'active', customerId: FlowRouter.query.get('customerId')}).fetch();
        if (deletedItem.find().count() > 0) {
            deletedItem.find().forEach(function (item) {
                console.log(item);
                saleOrders.forEach(function (saleOrder) {
                    saleOrder.items.forEach(function (saleItem) {
                        if (saleItem.itemId == item.itemId) {
                            saleItem.remainQty += item.qty;
                            saleOrder.sumRemainQty += item.qty;
                        }
                    });
                });
            });
        }
        saleOrders.forEach(function (saleOrder) {
            saleOrder.items.forEach(function (saleItem) {
                item.push(saleItem.itemId);
            });
        });
        Session.set('saleOrderItems', item);
        return saleOrders;
    },
    hasSaleOrders(){
        let count = Order.find({status: 'active', customerId: FlowRouter.query.get('customerId')}).count();
        return count > 0;
    },
    getItemName(itemId){
        try {
            return Item.findOne(itemId).name;
        } catch (e) {

        }

    }
});
listSaleOrder.events({
    'click .add-item'(event, instance){
        event.preventDefault();
        let remainQty = $(event.currentTarget).parents('.sale-item-parents').find('.remain-qty').val();
        let saleId = $(event.currentTarget).parents('.sale-item-parents').find('.saleId').text().trim()
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (tmpCollection.length > 0) {
                    let saleIdExist = _.find(tmpCollection, function (o) {
                        return o.saleId == saleId;
                    });
                    if (saleIdExist) {
                        insertSaleOrderItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            saleItem: saleIdExist,
                            saleId: saleId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same saleId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result)=> {
                        this.saleId = saleId;
                        this.qty = parseFloat(remainQty)
                        this.name = result.name;
                        itemsCollection.insert(this);
                    });
                    displaySuccess('Added!')
                }
            } else {
                swal("ប្រកាស!", "មុខទំនិញនេះត្រូវបានកាត់កងរួចរាល់", "info");
            }
        } else {
            swal("Retry!", "ចំនួនមិនអាចអត់មានឬស្មើសូន្យ", "warning");
        }
    },
    'change .remain-qty'(event, instance){
        event.preventDefault();
        let remainQty = $(event.currentTarget).val();
        let saleId = $(event.currentTarget).parents('.sale-item-parents').find('.saleId').text().trim()
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (parseFloat(remainQty) > this.remainQty) {
                    remainQty = this.remainQty;
                    $(event.currentTarget).val(this.remainQty);
                }
                if (tmpCollection.length > 0) {
                    let saleIdExist = _.find(tmpCollection, function (o) {
                        return o.saleId == saleId;
                    });
                    if (saleIdExist) {
                        insertSaleOrderItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            saleItem: saleIdExist,
                            saleId: saleId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same saleId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result)=> {
                        this.saleId = saleId;
                        this.qty = parseFloat(remainQty);
                        this.name = result.name;
                        this.amount = this.qty * this.price;
                        itemsCollection.insert(this);
                    });
                    displaySuccess('Added!')
                }
            } else {
                swal("ប្រកាស!", "មុខទំនិញនេះត្រូវបានកាត់កងរួចរាល់", "info");
            }
        } else {
            swal("Retry!", "ចំនួនមិនអាចអត់មានឬស្មើសូន្យ", "warning");
        }

    }
});


//insert sale order item to itemsCollection
let insertSaleOrderItem = ({self, remainQty, saleItem, saleId}) => {
    Meteor.call('getItem', self.itemId, (err, result)=> {
        self.saleId = saleId;
        self.qty = remainQty;
        self.name = result.name;
        self.amount = self.qty * self.price;
        let getItem = itemsCollection.findOne({itemId: self.itemId});
        if (getItem) {
            if (getItem.qty + remainQty <= self.remainQty) {
                itemsCollection.update(getItem._id, {$inc: {qty: self.qty, amount: self.qty * getItem.price}});
                displaySuccess('Added!')
            } else {
                swal("Retry!", `ចំនួនបញ្ចូលចាស់(${getItem.qty}) នឹងបញ្ចូលថ្មី(${remainQty}) លើសពីចំនួនកម្ម៉ង់ទិញចំនួន ${(self.remainQty)}`, "error");
            }
        } else {
            itemsCollection.insert(self);
            displaySuccess('Added!')
        }
    });
};
function excuteEditForm(doc) {
    swal({
        title: "Pleas Wait",
        text: "Getting Invoices....", showConfirmButton: false
    });
    alertify.invoice(fa('pencil', TAPi18n.__('pos.invoice.title')), renderTemplate(editTmpl, doc)).maximize();
}
// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];

            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                if (obj.saleId) {
                    doc.saleId = obj.saleId;
                }
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
    onSuccess (formType, id) {
        //get invoiceId, total, customerId
        if (formType != 'update') {
            if (!FlowRouter.query.get('customerId')) {
                Meteor.call('getInvoiceId', id, function (err, result) {
                    if (result) {
                        Session.set('totalOrder', result);
                    }
                });
            } else {
                alertify.invoice().close();
            }
        } else {
            alertify.invoice().close();
        }
        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});
        deletedItem.remove({});
        // }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_invoiceNew',
    'Pos_invoiceUpdate'
], hooksObject);

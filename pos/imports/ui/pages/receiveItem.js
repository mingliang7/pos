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
import {ReceiveItems} from '../../api/collections/receiveItem.js';
import {PrepaidOrders} from '../../api/collections/prepaidOrder.js';
import {LendingStocks} from '../../api/collections/lendingStock.js';
import {PrepaidOrderDeletedItem} from './receiveItem-items.js';
import {LendingStockDeletedItem} from './receiveItem-items.js';
import {Item} from '../../api/collections/item';
import {vendorBillCollection} from '../../api/collections/tmpCollection';
// Tabular
import {ReceiveItemTabular} from '../../../common/tabulars/receiveItem.js';

// Page
import './receiveItem.html';
import './receiveItem-items.js';
import './info-tab.html';
//methods
import {ReceiveItemInfo} from '../../../common/methods/receiveItem.js'
import {vendorInfo} from '../../../common/methods/vendor.js';
//Tracker for vendor infomation
//Tracker for vendor infomation
Tracker.autorun(function () {
    if (Session.get("getVendorId")) {
        vendorInfo.callPromise({_id: Session.get("getVendorId")})
            .then(function (result) {
                Session.set('vendorInfo', result);
            })
    }
    if (Session.get('prepaidOrderItems')) {
        Meteor.subscribe('pos.item', {_id: {$in: Session.get('prepaidOrderItems')}});
    }
});
// Declare template
let indexTmpl = Template.Pos_receiveItem,
    actionTmpl = Template.Pos_receiveItemAction,
    newTmpl = Template.Pos_receiveItemNew,
    editTmpl = Template.Pos_receiveItemEdit,
    showTmpl = Template.Pos_receiveItemShow,
    listPrepaidOrder = Template.listPrepaidOrder,
    listLendingStock = Template.listLendingStock;
// Local collection
let itemsCollection = new Mongo.Collection(null);

// Index
Tracker.autorun(function () {
    if (Session.get('vendorId')) {
        vendorInfo.callPromise({_id: Session.get('vendorId')})
            .then(function (result) {
                Session.set('vendorInfo', result);
            })
    }
});

indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('receiveItem', {size: 'lg'});
    createNewAlertify('receiveItemShow');
    createNewAlertify('listPrepaidOrder', {size: 'lg'});
    createNewAlertify('listLendingStock', {size: 'lg'});
    createNewAlertify('vendor');
});

indexTmpl.helpers({
    tabularTable(){
        return ReceiveItemTabular;
    },
    selector() {
        return {status: {$ne: 'removed'}, branchId: Session.get('currentBranch')};
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.receiveItem(fa('plus', TAPi18n.__('pos.receiveItem.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        alertify.receiveItem(fa('pencil', TAPi18n.__('pos.receiveItem.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        let data = this;
        destroyAction(
            ReceiveItems,
            {_id: data._id},
            {title: TAPi18n.__('pos.receiveItem.title'), itemTitle: data._id}
        );
    },
    'click .js-display' (event, instance) {
        swal({
            title: "Pleas Wait",
            text: "Getting Invoices....", showConfirmButton: false
        });
        this.customer = vendorBillCollection.findOne(this.vendorId).name;
        Meteor.call('billShowItems', {doc: this}, function (err, result) {
            swal.close();
            alertify.receiveItemShow(fa('eye', TAPi18n.__('pos.invoice.title')), renderTemplate(showTmpl, result)).maximize();
        });
    },
    'click .js-receiveItem' (event, instance) {
        let params = {};
        let queryParams = {receiveItemId: this._id};
        let path = FlowRouter.path("pos.receiveItemReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});
indexTmpl.onDestroyed(function () {
    vendorBillCollection.remove({});
});
newTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
});
// New
newTmpl.events({
    'change .enable-prepaid-order'(event, instance){
        debugger;
        itemsCollection.remove({});
        let vendorId = $('[name="vendorId"]').val();
        if ($(event.currentTarget).prop('checked')) {
            if (vendorId != '') {
                FlowRouter.query.set('vendorId', vendorId);
                $('.prepaid-order').addClass('toggle-list');
                setTimeout(function () {
                    // alertify.listLendingStock(fa('', 'Lending Stock'), renderTemplate(listLendingStock));
                    alertify.listPrepaidOrder(fa('', 'Prepaid Order'), renderTemplate(listPrepaidOrder));
                }, 700)
            } else {
                displayError('Please select vendor');
                $(event.currentTarget).prop('checked', false);
            }

        } else {
            FlowRouter.query.unset();
            $('.prepaid-order').removeClass('toggle-list');
        }
    },
    'click .toggle-list'(event, instance){
        let receiveType = $('#receive-type').val();
        if (receiveType == 'PrepaidOrder') {
            alertify.listPrepaidOrder(fa('', 'Prepaid Order'), renderTemplate(listPrepaidOrder));
        }
        else if (receiveType == 'LendingStock') {
            alertify.listLendingStock(fa('', 'Lending Stock'), renderTemplate(listLendingStock));
        }
        else if (receiveType == 'RingPull') {

        } else if (receiveType == 'Gratis') {

        } else {
            alertify.warning('Please Select Receive Type');
        }
    },

    'change [name=vendorId]'(event, instance){
        debugger;
        if (event.currentTarget.value != '') {
            Session.set('getVendorId', event.currentTarget.value);
            if (FlowRouter.query.get('vendorId')) {
                FlowRouter.query.set('vendorId', event.currentTarget.value);
            }
        }
        Session.set('totalOrder', undefined);

    },
    'click .go-to-pay-bill'(event, instance){
        alertify.receiveItem().close();
    },
    'click #btn-save-print'(event, instance){
        Session.set('btnType', 'save-print');
    },
    'click #btn-save'(event, instance){
        Session.set('btnType', 'save');
    },
    'click #btn-pay'(event, instance){
        Session.set('btnType', 'pay');
    }
});
newTmpl.helpers({
    totalOrder(){
        let total = 0;
        if (!FlowRouter.query.get('vendorId')) {
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
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    repId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').repId;
            } catch (e) {

            }
        }
        return '';
    },
    termId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').termId;
            } catch (e) {

            }
        }
        return '';
    },
    totalReceiveItem(){
        let total = 0;
        itemsCollection.find().forEach(function (item) {
            total += item.amount;
        });
        return total;
    },
    vendorInfo() {
        let vendorInfo = Session.get('vendorInfo');
        if (!vendorInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li>Phone: <b>${vendorInfo.telephone ? vendorInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${vendorInfo.creditLimit ? numeral(vendorInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Prepaid Order to be receiveItem: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return ReceiveItems;
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
    disabledPayBtn(){
        let cont = itemsCollection.find().count();
        let pay = $('[name="paidAmount"]').val();
        if (cont == 0 || pay == "") {
            return {disabled: true};
        }
        return {};
    },
    isTerm(){
        if (Session.get('vendorInfo')) {
            let vendorInfo = Session.get('vendorInfo');
            if (vendorInfo._term) {
                return true;
            }
            return false;
        }
    },
    dueDate(){
        let date = AutoForm.getFieldValue('receiveItemDate');
        if (Session.get('vendorInfo')) {
            if (Session.get('vendorInfo')._term) {
                let term = Session.get('vendorInfo')._term;

                let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                console.log(dueDate);
                return dueDate;
            }
        }
        return date;
    }
});

newTmpl.onDestroyed(function () {
    debugger;
    // Remove items collection
    itemsCollection.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('vendorId', undefined);
    FlowRouter.query.unset();
    Session.set('prepaidOrderItems', undefined);
    Session.set('totalOrder', undefined);
});
// Edit
editTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    this.isPrepaidOrder = new ReactiveVar(false);
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
    if (this.data.billType == 'prepaidOrder') {
        FlowRouter.query.set('vendorId', this.data.vendorId);
        this.isPrepaidOrder.set(true);
    }
});
editTmpl.events({
    'click #btn-save-print'(event, instance){
        Session.set('btnType', 'save-print');
    },
    'click #btn-save'(event, instance){
        Session.set('btnType', 'save');
    },
    'click #btn-pay'(event, instance){
        Session.set('btnType', 'pay');
    },
    'click .add-new-vendor'(event, instance){
        alertify.vendor(fa('plus', 'New Vendor'), renderTemplate(Template.Pos_vendorNew));
    },
    'click .go-to-pay-bill'(event, instance){
        alertify.invoice().close();
    },
    'change [name=vendorId]'(event, instance){
        if (event.currentTarget.value != '') {
            Session.set('getVendorId', event.currentTarget.value);
            if (FlowRouter.query.get('vendorId')) {
                FlowRouter.query.set('vendorId', event.currentTarget.value);
            }
        }
        Session.set('totalOrder', undefined);
    },
    'click .toggle-list'(event, instance){
        alertify.listPrepaidOrder(fa('', 'Prepaid Order'), renderTemplate(listPrepaidOrder));
    },
    'change [name="termId"]'(event, instance){
        let vendorInfo = Session.get('vendorInfo');
        Meteor.call('getTerm', event.currentTarget.value, function (err, result) {
            vendorInfo._term.netDueIn = result.netDueIn;
            Session.set('vendorInfo', vendorInfo);
        });
    }
});
editTmpl.helpers({
    closeSwal(){
        setTimeout(function () {
            swal.close();
        }, 500);
    },
    isPrepaidOrder(){
        return Template.instance().isPrepaidOrder.get();
    },
    collection(){
        return ReceiveItems;
    },
    data () {
        let data = this;
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
    },
    repId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').repId;
            } catch (e) {

            }
        }
        return '';
    },
    termId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').termId;
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
        if (!FlowRouter.query.get('vendorId')) {
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
    vendorInfo() {
        let vendorInfo = Session.get('vendorInfo');
        if (!vendorInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li>Phone: <b>${vendorInfo.telephone ? vendorInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${vendorInfo.creditLimit ? numeral(vendorInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Prepaid Order to be invoice: <span class="label label-primary">0</span>`
        };
    },
    repId(){
        if (Session.get('vendorInfo')) {
            return Session.get('vendorInfo').repId;
        }
    },
    dueDate(){
        let date = AutoForm.getFieldValue('receiveItemDate');
        if (Session.get('vendorInfo')) {
            if (Session.get('vendorInfo')._term) {
                let term = Session.get('vendorInfo')._term;

                let dueDate = moment(date).add(term.netDueIn, 'days').toDate();
                console.log(dueDate);
                return dueDate;
            }
        }
        return date;
    },
    isTerm(){
        if (Session.get('vendorInfo')) {
            let vendorInfo = Session.get('vendorInfo');
            if (vendorInfo._term) {
                return true;
            }
            return false;
        }
    }
});

editTmpl.onDestroyed(function () {
    debugger;
    // Remove items collection
    itemsCollection.remove({});
});

// Show
showTmpl.onCreated(function () {

});

showTmpl.helpers({
    colorizeType(type) {
        if (type == 'term') {
            return `<label class="label label-info">T</label>`
        }
        return `<label class="label label-success">G</label>`
    },
    colorizeStatus(status){
        if (status == 'active') {
            return `<label class="label label-info">A</label>`
        } else if (status == 'partial') {
            return `<label class="label label-danger">P</label>`
        }
        return `<label class="label label-success">C</label>`
    }
});
showTmpl.events({
    'click .print-bill-show'(event, instance){
        $('#to-print').printThis();
    }
});
// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                if (obj.prepaidOrderId) {
                    doc.prepaidOrderId = obj.prepaidOrderId;
                }
                items.push(obj);
            });
            var btnType = Session.get('btnType');
            if (btnType == "save" || btnType == "save-print") {
                doc.status = "partial";
                doc.paidAmount = 0;
                doc.dueAmount = math.round(doc.total, 2);
            } else if (btnType == "pay") {
                doc.dueAmount = math.round((doc.total - doc.paidAmount), 2);
                if (doc.dueAmount <= 0) {
                    doc.status = "close";
                } else {
                    doc.status = "partial";
                }

            }
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
            var btnType = Session.get('btnType');
            if (btnType == "save" || btnType == "save-print") {
                doc.$set.status = "partial";
                doc.$set.paidAmount = 0;
                doc.$set.dueAmount = math.round(doc.$set.total, 2);
            } else if (btnType == "pay") {
                doc.$set.dueAmount = math.round((doc.$set.total - doc.$set.paidAmount), 2);
                if (doc.$set.dueAmount <= 0) {
                    doc.$set.status = "close";
                } else {
                    doc.$set.status = "partial";
                }
            }
            delete doc.$unset;
            return doc;
        }
    },
    onSuccess (formType, id) {
        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});
        if (formType != 'update') {
            if (!FlowRouter.query.get('vendorId')) {
                Meteor.call('getBillId', id, function (err, result) {
                    if (result) {
                        Session.set('totalOrder', result);
                    }
                });
            } else {
                alertify.receiveItem().close();
            }
        } else {
            alertify.receiveItem().close();
        }
        // }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_receiveItemNew',
    'Pos_receiveItemEdit'
], hooksObject);


//listPrepaidOrder
listPrepaidOrder.helpers({
    prepaidOrders(){
        let item = [];
        let prepaidOrders = PrepaidOrders.find({status: 'active', vendorId: FlowRouter.query.get('vendorId')}).fetch();
        if (PrepaidOrderDeletedItem.find().count() > 0) {
            PrepaidOrderDeletedItem.find().forEach(function (item) {
                console.log(item);
                prepaidOrders.forEach(function (prepaidOrder) {
                    prepaidOrder.items.forEach(function (prepaidOrderItem) {
                        if (prepaidOrderItem.itemId == item.itemId) {
                            prepaidOrderItem.remainQty += item.qty;
                            prepaidOrder.sumRemainQty += item.qty;
                        }
                    });
                });
            });
        }
        prepaidOrders.forEach(function (prepaidOrder) {
            prepaidOrder.items.forEach(function (prepaidOrderItem) {
                item.push(prepaidOrderItem.itemId);
            });
        });
        Session.set('prepaidOrderItems', item);
        return prepaidOrders;
    },
    hasPrepaidOrders(){
        let count = PrepaidOrders.find({status: 'active', vendorId: FlowRouter.query.get('vendorId')}).count();
        return count > 0;
    },
    getItemName(itemId){
        try {
            return Item.findOne(itemId).name;
        } catch (e) {

        }

    }
});
listPrepaidOrder.events({
    'click .add-item'(event, instance){
        event.preventDefault();
        let remainQty = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.remain-qty').val();
        let prepaidOrderId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.prepaidOrderId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (tmpCollection.length > 0) {
                    let prepaidOrderIdExist = _.find(tmpCollection, function (o) {
                        return o.prepaidOrderId == prepaidOrderId;
                    });
                    if (prepaidOrderIdExist) {
                        insertPrepaidOrderItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            prepaidOrderItem: prepaidOrderIdExist,
                            prepaidOrderId: prepaidOrderId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same prepaidOrderId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result)=> {
                        this.prepaidOrderId = prepaidOrderId;
                        this.qty = parseFloat(remainQty);
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
        let prepaidOrderId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.prepaidOrderId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (parseFloat(remainQty) > this.remainQty) {
                    remainQty = this.remainQty;
                    $(event.currentTarget).val(this.remainQty);
                }
                if (tmpCollection.length > 0) {
                    let prepaidOrderIdExist = _.find(tmpCollection, function (o) {
                        return o.prepaidOrderId == prepaidOrderId;
                    });
                    if (prepaidOrderIdExist) {
                        insertPrepaidOrderItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            prepaidOrderItem: prepaidOrderIdExist,
                            prepaidOrderId: prepaidOrderId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same prepaidOrderId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result)=> {
                        this.prepaidOrderId = prepaidOrderId;
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


//insert prepaidOrder order item to itemsCollection
let insertPrepaidOrderItem = ({self, remainQty, prepaidOrderItem, prepaidOrderId}) => {
    Meteor.call('getItem', self.itemId, (err, result)=> {
        self.prepaidOrderId = prepaidOrderId;
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


//listPrepaidOrder
listLendingStock.helpers({
    lendingStocks(){
        let item = [];
        let lendingStocks = LendingStocks.find({status: 'active', vendorId: FlowRouter.query.get('vendorId')}).fetch();
        if (LendingStockDeletedItem.find().count() > 0) {
            LendingStockDeletedItem.find().forEach(function (item) {
                console.log(item);
                lendingStocks.forEach(function (lendingStock) {
                    lendingStock.items.forEach(function (lendingStockItem) {
                        if (lendingStockItem.itemId == item.itemId) {
                            lendingStockItem.remainQty += item.qty;
                            lendingStock.sumRemainQty += item.qty;
                        }
                    });
                });
            });
        }
        lendingStocks.forEach(function (lendingStock) {
            lendingStock.items.forEach(function (lendingStockItem) {
                item.push(lendingStockItem.itemId);
            });
        });
        Session.set('lendingStockItems', item);
        return lendingStocks;
    },
    hasLendingStocks(){
        let count = LendingStocks.find({status: 'active', vendorId: FlowRouter.query.get('vendorId')}).count();
        return count > 0;
    },
    getItemName(itemId){
        try {
            return Item.findOne(itemId).name;
        } catch (e) {

        }

    }
});
listLendingStock.events({
    'click .add-item'(event, instance){
        event.preventDefault();
        let remainQty = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.remain-qty').val();
        let lendingStockId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.lendingStockId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (tmpCollection.length > 0) {
                    let lendingStockIdExist = _.find(tmpCollection, function (o) {
                        return o.lendingStockId == lendingStockId;
                    });
                    if (lendingStockIdExist) {
                        insertLendingStockItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            lendingStockItem: lendingStockIdExist,
                            lendingStockId: lendingStockId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same lendingStockId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result)=> {
                        this.lendingStockId = lendingStockId;
                        this.qty = parseFloat(remainQty);
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
        let lendingStockId = $(event.currentTarget).parents('.prepaid-order-item-parents').find('.lendingStockId').text().trim();
        let tmpCollection = itemsCollection.find().fetch();
        if (remainQty != '' && remainQty != '0') {
            if (this.remainQty > 0) {
                if (parseFloat(remainQty) > this.remainQty) {
                    remainQty = this.remainQty;
                    $(event.currentTarget).val(this.remainQty);
                }
                if (tmpCollection.length > 0) {
                    let lendingStockIdExist = _.find(tmpCollection, function (o) {
                        return o.lendingStockId == lendingStockId;
                    });
                    if (lendingStockIdExist) {
                        insertLendingStockItem({
                            self: this,
                            remainQty: parseFloat(remainQty),
                            lendingStockItem: lendingStockIdExist,
                            lendingStockId: lendingStockId
                        });
                    } else {
                        swal("Retry!", "Item Must be in the same lendingStockId", "warning")
                    }
                } else {
                    Meteor.call('getItem', this.itemId, (err, result)=> {
                        this.lendingStockId = lendingStockId;
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


//insert lendingStock order item to itemsCollection
let insertLendingStockItem = ({self, remainQty, lendingStockItem, lendingStockId}) => {
    Meteor.call('getItem', self.itemId, (err, result)=> {
        self.lendingStockId = lendingStockId;
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
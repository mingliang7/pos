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
import {CompanyExchangeRingPulls} from '../../api/collections/companyExchangeRingPull.js';
import {Order} from '../../api/collections/order';
import {Item} from '../../api/collections/item';
import {deletedItem} from './companyExchangeRingPull-items';
import {VendorNullCollection, nullCollection} from '../../api/collections/tmpCollection';
// Tabular
import {CompanyExchangeRingPullTabular} from '../../../common/tabulars/companyExchangeRingPull.js';

// Page
import './companyExchangeRingPull.html';
import './companyExchangeRingPull-items.js';
import './info-tab.html';
import './vendor.html';
//methods
import {companyExchangeRingPullInfo} from '../../../common/methods/companyExchangeRingPull.js'
import {vendorInfo} from '../../../common/methods/vendor.js';

Tracker.autorun(function () {
    if (Session.get("getVendorId")) {
        vendorInfo.callPromise({_id: Session.get("getVendorId")})
            .then(function (result) {
                Session.set('vendorInfo', result);
            });
    }
});

// Declare template
let indexTmpl = Template.Pos_companyExchangeRingPull,
    actionTmpl = Template.Pos_companyExchangeRingPullAction,
    newTmpl = Template.Pos_companyExchangeRingPullNew,
    editTmpl = Template.Pos_companyExchangeRingPullEdit,
    showTmpl = Template.Pos_companyExchangeRingPullShow;
// Local collection
let itemsCollection = nullCollection;

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('companyExchangeRingPull', {size: 'lg'});
    createNewAlertify('companyExchangeRingPullShow',);
    createNewAlertify('vendor');
});

indexTmpl.helpers({
    tabularTable(){
        return CompanyExchangeRingPullTabular;
    },
    selector() {
        return {status: {$ne: 'removed'}, branchId: Session.get('currentBranch')};
    }
});
indexTmpl.onDestroyed(function () {
    VendorNullCollection.remove({});
});
indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.companyExchangeRingPull(fa('cart-arrow-down', TAPi18n.__('pos.companyExchangeRingPull.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        // if (this.saleId || (this.companyExchangeRingPullType == 'term' && this.status != 'closed')) {
        //     excuteEditForm(this);
        // }
        // else if (this.companyExchangeRingPullType == 'term' && this.status == 'closed') {
        //     // swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រលេខ ${this._id} ជាមុនសិន`, "error")
        //     excuteEditForm(this);
        //
        // }
        // else if (this.paymentGroupId) {
        //     Meteor.call('pos.isGroupCompanyExchangeRingPullClosed', {_id: this.paymentGroupId}, (err, result)=> {
        //         if (result.paid) {
        //             swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រក្រុមលេខ ${this.paymentGroupId} ជាមុនសិន`, "error")
        //         } else {
        //             excuteEditForm(this);
        //         }
        //     });
        // }
        excuteEditForm(this);
    },
    'click .js-destroy' (event, instance) {
        let data = this;
        destroyAction(
            CompanyExchangeRingPulls,
            {_id: data._id},
            {title: TAPi18n.__('pos.companyExchangeRingPull.title'), itemTitle: data._id}
        );
    },
    'click .js-display' (event, instance) {
        swal({
            title: "Pleas Wait",
            text: "Getting CompanyExchangeRingPulls....", showConfirmButton: false
        });
        this.vendor = VendorNullCollection.findOne(this.vendorId).name;
        Meteor.call('companyExchangeRingPullShowItems', {doc: this}, function (err, result) {
            swal.close();
            alertify.companyExchangeRingPullShow(fa('eye', TAPi18n.__('pos.companyExchangeRingPull.title')), renderTemplate(showTmpl, result)).maximize();
        });
    },
    'click .js-companyExchangeRingPull' (event, instance) {
        let params = {};
        let queryParams = {companyExchangeRingPullId: this._id};
        let path = FlowRouter.path("pos.companyExchangeRingPullReportGen", params, queryParams);

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
    'click .add-new-vendor'(event, instance){
        alertify.vendor(fa('plus', 'New Vendor'), renderTemplate(Template.Pos_vendorNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.companyExchangeRingPull().close();
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
});
newTmpl.helpers({
  repId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').repId;
            } catch (e) {

            }
        }
    },
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return [];
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
              <li>Sale Order to be companyExchangeRingPull: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return CompanyExchangeRingPulls;
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
});

newTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('getVendorId', undefined);
    FlowRouter.query.unset();
    Session.set('totalOrder', undefined);
    deletedItem.remove({});
});

// Edit
editTmpl.onCreated(function () {
    this.repOptions = new ReactiveVar();
    Meteor.call('getRepList', (err, result) => {
        this.repOptions.set(result);
    });
});


editTmpl.events({
    'click .add-new-vendor'(event, instance){
        alertify.vendor(fa('plus', 'New Vendor'), renderTemplate(Template.Pos_vendorNew));
    },
    'click .go-to-receive-payment'(event, instance){
        alertify.companyExchangeRingPull().close();
    }
});
editTmpl.helpers({
    closeSwal(){
        setTimeout(function () {
            swal.close();
        }, 500);
    },
    collection(){
        return CompanyExchangeRingPulls;
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
   /* repId(){
        if (Session.get('vendorInfo')) {
            try {
                return Session.get('vendorInfo').repId;
            } catch (e) {

            }
        }
        return '';
    },*/
    options(){
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
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
              <li>Sale Order to be companyExchangeRingPull: <span class="label label-primary">0</span>`
        };
    },
    collection(){
        return CompanyExchangeRingPulls;
    },
    itemsCollection(){
        return itemsCollection;
    },
});

editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('getVendorId', undefined);
    FlowRouter.query.unset();
    Session.set('totalOrder', undefined);
    deletedItem.remove({});
});

// Show
showTmpl.onCreated(function () {
    this.companyExchangeRingPull = new ReactiveVar();
    this.autorun(()=> {
        companyExchangeRingPullInfo.callPromise({_id: this.data._id})
            .then((result) => {
                this.companyExchangeRingPull.set(result);
            }).catch(function (err) {
            }
        );
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let key = `pos.companyExchangeRingPull.schema.${label}.label`;
        return TAPi18n.__(key);
    },
    colorizeType(type) {
        if (type == 'term') {
            return `<label class="label label-info">T</label>`
        }
        return `<label class="label label-success">G</label>`
    },
    colorizeStatus(status){
        if(status == 'active') {
            return `<label class="label label-info">A</label>`
        }else if(status == 'partial') {
            return `<label class="label label-danger">P</label>`
        }
        return `<label class="label label-success">C</label>`
    }
});
showTmpl.events({
    'click .print-companyExchangeRingPull-show'(event,instance){
        $('#to-print').printThis();
    }
});


function excuteEditForm(doc) {
    swal({
        title: "Pleas Wait",
        text: "Getting CompanyExchangeRingPulls....", showConfirmButton: false
    });
    alertify.companyExchangeRingPull(fa('pencil', TAPi18n.__('pos.companyExchangeRingPull.title')), renderTemplate(editTmpl, doc)).maximize();
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
        //get companyExchangeRingPullId, total, vendorId
        if (formType != 'update') {
            if (!FlowRouter.query.get('vendorId')) {
                Meteor.call('getCompanyExchangeRingPullId', id, function (err, result) {
                    if (result) {
                        Session.set('totalOrder', result);
                    }
                });
            } else {
                alertify.companyExchangeRingPull().close();
            }
        } else {
            alertify.companyExchangeRingPull().close();
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
    'Pos_companyExchangeRingPullNew',
    'Pos_companyExchangeRingPullUpdate'
], hooksObject);
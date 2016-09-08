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
import {Order} from '../../api/collections/order.js';
import {nullCollection} from '../../api/collections/tmpCollection';
// Tabular
import {OrderTabular} from '../../../common/tabulars/order.js';
//import tracker
import '../../../imports/api/tracker/creditLimitTracker';
// Page
import './order.html';
import './order-items.js';
import './info-tab.html';
//methods
import {saleOrderInfo} from '../../../common/methods/sale-order.js'
import {customerInfo} from '../../../common/methods/customer.js';
import {isInvoiceExist} from '../../../common/methods/sale-order';
//import tracker
import '../../api/tracker/creditLimitTracker';
//Tracker for customer infomation
Tracker.autorun(function () {
    if (Session.get("saleOrderCustomerId")) {
        customerInfo.callPromise({_id: Session.get("saleOrderCustomerId")})
            .then(function (result) {
                Session.set('customerInfo', result);
            })
    }
});
// Declare template
let indexTmpl = Template.Pos_order,
    actionTmpl = Template.Pos_orderAction,
    newTmpl = Template.Pos_orderNew,
    editTmpl = Template.Pos_orderEdit,
    showTmpl = Template.Pos_orderShow;

// Local collection
let itemsCollection = nullCollection;

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('order', {size: 'lg'});
    createNewAlertify('orderShow',);
});

indexTmpl.helpers({
    tabularTable(){
        return OrderTabular;
    },
    selector() {
        return {branchId: Session.get('currentBranch')};
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.order(fa('plus', TAPi18n.__('pos.order.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        Meteor.call("pos.isInvoiceExist", {_id: this._id}, (err, result)=> {
            if (result.exist) {
                swal('បញ្ជាក់!', `សូមធ្វើការលុប Invoice លេខ​ ${result.invoiceId} ជាមុនសិន!​​​​`, 'error');
            } else {
                alertify.order(fa('pencil', TAPi18n.__('pos.order.title')), renderTemplate(editTmpl, this));
            }
        });
    },
    'click .js-destroy' (event, instance) {
        let data = this;
        Meteor.call("pos.isInvoiceExist", {_id: this._id}, (err, result)=> {
            if (result.exist) {
                swal('បញ្ជាក់!', `សូមធ្វើការលុប Invoice លេខ​ ${result.invoiceId} ជាមុនសិន!​​​​`, 'error');
            } else {
                destroyAction(
                    Order,
                    {_id: data._id},
                    {title: TAPi18n.__('pos.order.title'), itemTitle: data._id}
                );
            }
        });
    },
    'click .js-display' (event, instance) {
        alertify.orderShow(fa('eye', TAPi18n.__('pos.order.title')), renderTemplate(showTmpl, this));
    },
    'click .js-invoice' (event, instance) {
        let params = {};
        let queryParams = {orderId: this._id};
        let path = FlowRouter.path("pos.orderReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});

// New
newTmpl.onCreated(function () {
    Meteor.subscribe('pos.requirePassword', {branchId: {$in: [Session.get('currentBranch')]}});//subscribe require password validation
});
newTmpl.events({
    'change [name=customerId]'(event, instance){
        if (event.currentTarget.value != '') {
            Session.set('saleOrderCustomerId', event.currentTarget.value);
        }
    }
});
newTmpl.helpers({
    customerInfo() {
        let {customerInfo, totalAmountDue, whiteListCustomer} = Session.get('customerInfo');
        let allowOverAmountDue = whiteListCustomer ? whiteListCustomer.limitTimes : 'Not set';
        if (!customerInfo) {
            return {empty: true, message: 'No data available'}
        }

        return {
            fields: `<li><i class="fa fa-phone-square"></i> Phone: <b><span class="label label-success">${customerInfo.telephone ? customerInfo.telephone : ''}</span></b> | </li>
              <!--<li>Opening Balance: <span class="label label-success">0</span></li>-->
              <li><i class="fa fa-credit-card" aria-hidden="true"></i> Credit Limit: <span class="label label-warning">${customerInfo.creditLimit ? numeral(customerInfo.creditLimit).format('0,0.00') : 0}</span> | </li>
              <li><i class="fa fa-money"></i> Balance: <span class="label label-primary">${numeral(totalAmountDue).format('0,0.00')}</span> | 
              <li><i class="fa fa-flag"></i> Allow over amount due: <b class="label label-danger">${allowOverAmountDue}</b> | 
              <li><i class="fa fa-home"></i> Address: <b>${customerInfo.address ? customerInfo.address : 'None'}</b>`
        };
    },
    collection(){
        return Order;
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
    Session.set('saleOrderCustomerId', undefined);
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.order', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return Order;
    },
    data () {
        let data = Order.findOne(this._id);

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
    this.saleOrder = new ReactiveVar();
    this.autorun(()=> {
        saleOrderInfo.callPromise({_id: this.data._id})
            .then((result) => {
                this.saleOrder.set(result);
            }).catch(function (err) {
            }
        );
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let key = `pos.order.schema.${label}.label`;
        return TAPi18n.__(key);
    },
    saleOrderInfo () {

        let saleOrderInfo = Template.instance().saleOrder.get();

        // Use jsonview
        saleOrderInfo.jsonViewOpts = {collapsed: true};
        //
        return saleOrderInfo;
    }
});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                obj.remainQty = obj.qty
                items.push(obj);
            });
            doc.items = items;

            return doc;
        },
        update: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                obj.remainQty = obj.qty
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

        alertify.order().close();
        // }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_orderNew',
    'Pos_orderEdit'
], hooksObject);

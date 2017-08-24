import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from 'meteor/alanning:roles';
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
import {InventoryDates} from '../../api/collections/inventoryDate.js';
import {Adjustments} from '../../api/collections/adjustment.js';
import {Order} from '../../api/collections/order';
import {Item} from '../../api/collections/item';
import {deletedItem} from './adjustment-items';
import {CustomerNullCollection, nullCollection} from '../../api/collections/tmpCollection';
// Tabular
import {AdjustmentTabular} from '../../../common/tabulars/adjustment.js';

// Page
import './adjustment.html';
import './adjustment-items.js';
import './info-tab.html';
import './customer.html';
//methods
import {adjustmentInfo} from '../../../common/methods/adjustment.js'
import {customerInfo} from '../../../common/methods/customer.js';

Tracker.autorun(function () {
    if (Session.get("getCustomerId")) {
        customerInfo.callPromise({_id: Session.get("getCustomerId")})
            .then(function (result) {
                Session.set('customerInfo', result);
            });
    }
});

// Declare template
let indexTmpl = Template.Pos_adjustment,
    actionTmpl = Template.Pos_adjustmentAction,
    newTmpl = Template.Pos_adjustmentNew,
    editTmpl = Template.Pos_adjustmentEdit,
    showTmpl = Template.Pos_adjustmentShow;
// Local collection
let itemsCollection = nullCollection;

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    $(document).on("keydown", "input", function (e) {
        if (e.which == 13)
            e.preventDefault();
    });
    createNewAlertify('adjustment', {size: 'lg'});
    createNewAlertify('adjustmentShow', {size: 'lg'});
    createNewAlertify('customer');
});

indexTmpl.helpers({
    tabularTable() {
        return AdjustmentTabular;
    },
    selector() {
        let selector = {status: {$ne: 'removed'}, branchId: Session.get('currentBranch')};
        let customerId = FlowRouter.query.get('cid');
        if (customerId) {
            selector.customerId = customerId
        }
        return selector;
    },
    customerId(){
        let customerId = FlowRouter.query.get('cid');
        return !!customerId;
    },
    displayCustomerObj() {
        let customerObj = Session.get('customer::customerObj');
        if (customerObj) {
            return `<blockquote style="background: teal;color: white;">
                    Customer &emsp;&emsp;: ${customerObj.name}<br>
                </blockquote>`
        }
        return ''
    },
});
indexTmpl.onDestroyed(function () {
    CustomerNullCollection.remove({});
});
indexTmpl.events({
    'click .js-create'(event, instance) {
        alertify.adjustment(fa('cart-arrow-down', TAPi18n.__('pos.adjustment.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update'(event, instance) {
        // if (this.saleId || (this.adjustmentType == 'term' && this.status != 'closed')) {
        //     excuteEditForm(this);
        // }
        // else if (this.adjustmentType == 'term' && this.status == 'closed') {
        //     // swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រលេខ ${this._id} ជាមុនសិន`, "error")
        //     excuteEditForm(this);
        //
        // }
        // else if (this.paymentGroupId) {
        //     Meteor.call('pos.isGroupAdjustmentClosed', {_id: this.paymentGroupId}, (err, result)=> {
        //         if (result.paid) {
        //             swal("បញ្ជាក់!", `សូមធ្វើការលុបការបង់ប្រាក់សម្រាប់វិក័យប័ត្រក្រុមលេខ ${this.paymentGroupId} ជាមុនសិន`, "error")
        //         } else {
        //             excuteEditForm(this);
        //         }
        //     });
        // }
        let data = this;
        let inventoryDate = InventoryDates.findOne({branchId: data.branchId, stockLocationId: data.stockLocationId});
        let adjustmentDate = moment(data.adjustmentDate).startOf('days').toDate();
        if (inventoryDate && (adjustmentDate < inventoryDate.inventoryDate)) {
            alertify.warning("Can't Remove. Adjustment's Date: " + moment(adjustmentDate).format("DD-MM-YYYY")
                + ". Current Transaction Date: " + moment(inventoryDate.inventoryDate).format("DD-MM-YYYY"))
        } else {
            excuteEditForm(data);
        }
    },
    'click .js-destroy'(event, instance) {
        let data = this;
        let inventoryDate = InventoryDates.findOne({branchId: data.branchId, stockLocationId: data.stockLocationId});
        let adjustmentDate = moment(data.adjustmentDate).startOf('days').toDate();
        if (inventoryDate && (adjustmentDate < inventoryDate.inventoryDate)) {
            alertify.warning("Can't Remove. Adjustment's Date: " + moment(adjustmentDate).format("DD-MM-YYYY")
                + ". Current Transaction Date: " + moment(inventoryDate.inventoryDate).format("DD-MM-YYYY"))
            /* swal({
             title: "Date is less then current Transaction Date!",
             text: "Stock will recalculate on: '" + moment(inventoryDate.inventoryDate).format("DD-MM-YYYY") + "'",
             type: "warning", showCancelButton: true,
             confirmButtonColor: "#DD6B55",
             confirmButtonText: "Yes, Do it!",
             closeOnConfirm: false
             }).then(function () {
             swal.close();
             destroyAction(
             Adjustments,
             {_id: data._id},
             {title: TAPi18n.__('pos.adjustment.title'), itemTitle: data._id}
             );
             }, function (dismiss) {
             if (dismiss === 'cancel') {
             return false;
             }
             });*/
        }
        else {
            destroyAction(
                Adjustments,
                {_id: data._id},
                {title: TAPi18n.__('pos.adjustment.title'), itemTitle: data._id}
            );
        }

    },
    'click .js-display'(event, instance) {
        swal({
            title: "Pleas Wait",
            text: "Getting Adjustments....", showConfirmButton: false
        });
        Meteor.call('adjustmentShow', {_id: this._id}, function (err, result) {
            console.log(result)
            swal.close();
            alertify.adjustmentShow(fa('eye', TAPi18n.__('pos.adjustment.title')), renderTemplate(showTmpl, result)).maximize();
        });
    },
    'click .js-adjustment'(event, instance) {
        let params = {};
        let queryParams = {adjustmentId: this._id};
        let path = FlowRouter.path("pos.adjustmentReportGen", params, queryParams);

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
    'click .save-exchange-ring-pull'() {
        let branchId = Session.get('currentBranch');
        let stockLocationId = $('[name="stockLocationId"]').val();
        let inventoryDate = InventoryDates.findOne({branchId: branchId, stockLocationId: stockLocationId});
        let adjustmentDate = AutoForm.getFieldValue('adjustmentDate', 'Pos_adjustmentNew');
        adjustmentDate = moment(adjustmentDate).startOf('days').toDate();
        if (inventoryDate && (adjustmentDate > inventoryDate.inventoryDate)) {
            swal({
                title: "Date is greater then current Transaction Date!",
                text: "Do You want to continue to process to " + moment(adjustmentDate).format('DD-MM-YYYY')
                + "?\n" + "Current Transaction Date is: '" + moment(inventoryDate.inventoryDate).format("DD-MM-YYYY") + "'",
                type: "warning", showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, Do it!",
                closeOnConfirm: false
            }).then(function () {
                $('#Pos_adjustmentNew').submit();
                swal.close();
            }, function (dismiss) {
                if (dismiss === 'cancel') {
                    return false;
                }
            });
        } else if (inventoryDate && (adjustmentDate < inventoryDate.inventoryDate)) {
            displayError("Date cannot be less than current Transaction Date: " + moment(inventoryDate.inventoryDate).format("DD-MM-YYYY"));
            return false;
        } else {
            $('#Pos_adjustmentNew').submit();
        }
        return false;
    },
    'change [name="stockLocationId"]'(event, instance) {
        debugger;
        let stockLocationId = $(event.currentTarget).val();
        let items = itemsCollection.find().fetch();
        if (items && items.length > 0) {
            Meteor.call('checkStockByLocation', stockLocationId, items, function (error, result) {
                if (!result.isEnoughStock) {
                    itemsCollection.remove({});
                    alertify.warning(result.message);
                }
            });
        }

    },
    'click .add-new-customer'(event, instance) {
        alertify.customer(fa('plus', 'New Customer'), renderTemplate(Template.Pos_customerNew));
    },
    'click .go-to-receive-payment'(event, instance) {
        alertify.adjustment().close();
    },
    'change [name=customerId]'(event, instance) {
        if (event.currentTarget.value != '') {
            Session.set('getCustomerId', event.currentTarget.value);
            if (FlowRouter.query.get('customerId')) {
                FlowRouter.query.set('customerId', event.currentTarget.value);
            }
        }
        Session.set('totalOrder', undefined);
    },
});
newTmpl.helpers({
    repId() {
        if (Session.get('customerInfo')) {
            try {
                return Session.get('customerInfo').repId;
            } catch (e) {

            }
        }
    },
    options() {
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return [];
    },
    totalOrder() {
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
              <li >Credit Limit: <span class="label label-warning">${customerInfo.creditLimit ? numeral(customerInfo.creditLimit).format('0,0.000') : 0}</span></li>
              <li>Sale Order to be adjustment: <span class="label label-primary">0</span>`
        };
    },
    collection() {
        return Adjustments;
    },
    itemsCollection() {
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
    Session.set('customerInfo', undefined);
    Session.set('getCustomerId', undefined);
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
    'change [name="stockLocationId"]'(event, instance) {
        let invoice = instance.data;
        let stockLocationId = $(event.currentTarget).val();
        let items = itemsCollection.find().fetch();

        let newItems = [];
        if (invoice.stockLocationId == stockLocationId) {
            items.forEach(function (item) {
                let oldItem = invoice.items.find(x => x.itemId == item.itemId);
                item.qty -= oldItem == null || oldItem.qty == null ? 0 : oldItem.qty;
                newItems.push(item);
            });
        } else {
            newItems = items;
        }
        if (items && items.length > 0) {
            Meteor.call('checkStockByLocation', stockLocationId, newItems, function (error, result) {
                if (!result.isEnoughStock) {
                    itemsCollection.remove({});
                    alertify.warning(result.message);
                }
            });
        }
    },
    'click .add-new-customer'(event, instance) {
        alertify.customer(fa('plus', 'New Customer'), renderTemplate(Template.Pos_customerNew));
    },
    'click .go-to-receive-payment'(event, instance) {
        alertify.adjustment().close();
    }
});
editTmpl.helpers({
    closeSwal() {
        setTimeout(function () {
            swal.close();
        }, 500);
    },
    collection() {
        return Adjustments;
    },
    data() {
        let data = this;
        // Add items to local collection
        _.forEach(data.items, (value) => {
            Meteor.call('getItem', value.itemId, (err, result) => {
                value.name = result.name;
                value.saleId = this.saleId;
                itemsCollection.insert(value);
            })
        });
        return data;
    },
    adjustmentDate() {
        return this.adjustmentDate;
    },
    itemsCollection() {
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
     if (Session.get('customerInfo')) {
     try {
     return Session.get('customerInfo').repId;
     } catch (e) {

     }
     }
     return '';
     },*/
    options() {
        let instance = Template.instance();
        if (instance.repOptions.get() && instance.repOptions.get().repList) {
            return instance.repOptions.get().repList
        }
        return '';
    },
    totalOrder() {
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
              <li >Credit Limit: <span class="label label-warning">${customerInfo.creditLimit ? numeral(customerInfo.creditLimit).format('0,0.000') : 0}</span></li>
              <li>Sale Order to be adjustment: <span class="label label-primary">0</span>`
        };
    },
    collection() {
        return Adjustments;
    },
    itemsCollection() {
        return itemsCollection;
    },
});

editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('customerInfo', undefined);
    Session.set('getCustomerId', undefined);
    FlowRouter.query.unset();
    Session.set('totalOrder', undefined);
    deletedItem.remove({});
});

// Show
showTmpl.onCreated(function () {
    // this.adjustment = new ReactiveVar();
    // this.autorun(()=> {
    //     adjustmentInfo.callPromise({_id: this.data._id})
    //         .then((result) => {
    //             this.adjustment.set(result);
    //         }).catch(function (err) {
    //         }
    //     );
    // });
});

showTmpl.helpers({
    company() {
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    i18nLabel(label) {
        let key = `pos.adjustment.schema.${label}.label`;
        return TAPi18n.__(key);
    },
    colorizeType(type) {
        if (type == 'term') {
            return `<label class="label label-info">T</label>`
        }
        return `<label class="label label-success">G</label>`
    },
    colorizeStatus(status) {
        if (status == 'active') {
            return `<label class="label label-info">A</label>`
        } else if (status == 'partial') {
            return `<label class="label label-danger">P</label>`
        }
        return `<label class="label label-success">C</label>`
    }
});
showTmpl.events({
    'click .print-adjustment-show'(event, instance) {
        $('#to-print').printThis();
    }
});


function excuteEditForm(doc) {
    swal({
        title: "Pleas Wait",
        text: "Getting Adjustments....", showConfirmButton: false
    });
    alertify.adjustment(fa('pencil', TAPi18n.__('pos.adjustment.title')), renderTemplate(editTmpl, doc)).maximize();
}
// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];

            itemsCollection.find().forEach((obj) => {
                delete obj._id;
                items.push(obj);
            });
            doc.items = items;

            return doc;
        },
        update: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj) => {
                delete obj._id;
                items.push(obj);
            });
            doc.$set.items = items;
            delete doc.$unset;
            return doc;
        }
    },
    onSuccess(formType, id) {
        //get adjustmentId, total, customerId
        if (formType != 'update') {
            if (!FlowRouter.query.get('customerId')) {
                Meteor.call('getAdjustmentId', id, function (err, result) {
                    if (result) {
                        Session.set('totalOrder', result);
                    }
                });
            } else {
                alertify.adjustment().close();
            }
        } else {
            alertify.adjustment().close();
        }
        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});
        deletedItem.remove({});
        // }
        displaySuccess();
    },
    onError(formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_adjustmentNew',
    'Pos_adjustmentUpdate'
], hooksObject);

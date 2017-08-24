import {ReactiveDict} from 'meteor/reactive-dict';
import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from 'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {_} from 'meteor/erasaur:meteor-lodash';
import {$} from 'meteor/jquery';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import 'meteor/theara:template-states';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import {AdjustmentItemsSchema} from '../../api/collections/order-items.js';
import {Adjustments} from '../../api/collections/adjustment.js';
import {Order} from '../../api/collections/order';
// Declare template
// Page
import './adjustment-items.html';
var itemsTmpl = Template.Pos_adjustmentItems,
    actionItemsTmpl = Template.Pos_adjustmentItemsAction,
    editItemsTmpl = Template.Pos_adjustmentItemsEdit;

//methods
import {removeItemInSaleOrder} from '../../../common/methods/sale-order';
// Local collection
var itemsCollection;

export const deletedItem = new Mongo.Collection(null); //export collection deletedItem to adjustment js
Tracker.autorun(function () {
    if (FlowRouter.query.get('customerId')) {
        let sub = Meteor.subscribe('pos.activeSaleOrder', {
            customerId: FlowRouter.query.get('customerId'),
            status: 'active'
        });
        if (!sub.ready()) {
            swal({
                title: "Pleas Wait",
                text: "Getting Order....", showConfirmButton: false
            });
        } else {
            setTimeout(function () {
                swal.close();
            }, 500);
        }

    }
});
itemsTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('item');

    // Data context
    let data = Template.currentData();
    itemsCollection = data.itemsCollection;


    // State
    this.state('amount', 0);

});

itemsTmpl.onRendered(function () {

});

itemsTmpl.helpers({
    notActivatedSaleOrder() {
        if (FlowRouter.query.get('customerId')) {
            return false;
        }
        return true;
    },
    tableSettings: function () {
        let i18nPrefix = 'pos.adjustment.schema';

        reactiveTableSettings.showFilter = false;
        reactiveTableSettings.showNavigation = 'never';
        reactiveTableSettings.showColumnToggles = false;
        reactiveTableSettings.collection = itemsCollection;
        reactiveTableSettings.fields = [{
            key: 'itemId',
            label: __(`${i18nPrefix}.itemId.label`)
        }, {
            key: 'name',
            label: 'Name'
        }, {
            key: 'qtyOnHand',
            label: __(`${i18nPrefix}.qtyOnHand.label`),
        }, {
            key: 'qty',
            label: __(`${i18nPrefix}.qty.label`),
            fn(value, obj, key) {
                return FlowRouter.query.get('customerId') ? value : Spacebars.SafeString(`<input type="number" value=${value} class="item-qty">`);
            }
        }, {
            key: 'remainQty',
            label: __(`${i18nPrefix}.remainQty.label`),
        }, {
            key: '_id',
            label() {
                return fa('bars', '', true);
            },
            headerClass: function () {
                let css = 'text-center col-action-adjustment-item';
                return css;
            },
            tmpl: actionItemsTmpl,
            sortable: false
        }];

        return reactiveTableSettings;
    },
    schema() {
        return AdjustmentItemsSchema;
    },
    disabledAddItemBtn: function () {
        const instance = Template.instance();
        if (instance.state('tmpAmount') <= 0) {
            return {
                disabled: true
            };
        }

        return {};
    },
    total: function () {
        let total = 0;
        let getItems = itemsCollection.find();
        getItems.forEach((obj) => {
            total += obj.amount;
        });
        total = FlowRouter.query.get('customerId') ? 0 : total;
        if (Session.get('getCustomerId')) {
            Session.set('creditLimitAmount', total);
        }
        return total;
    }
});

itemsTmpl.events({
    'change [name="itemId"]': function (event, instance) {
        let itemId = instance.name = event.currentTarget.value;
        if (itemId != "") {
            let stockLocationId = $('[name="stockLocationId"]').val();
            if (stockLocationId == "") {
                alertify.warning("Please choose stock location.");
                return;
            }
            let qty = instance.$('[name="qty"]').val();
            qty = qty == "" ? 1 : parseFloat(qty);
            instance.name = event.currentTarget.selectedOptions[0].text;
            Meteor.call('findItem', itemId, function (error, itemResult) {
                if (itemResult) {
                    let qtyOnHand = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
                    instance.$('[name="qtyOnHand"]').val(qtyOnHand);
                    // instance.$('[name="price"]').val('');
                    instance.$('[name="qty"]').val(qty);
                    instance.$('[name="remainQty"]').val(qtyOnHand + qty);
                }
            });
        }
    },
    'keyup [name="qty"]': function (event, instance) {
        let qty = instance.$('[name="qty"]').val();
        let qtyOnHand = instance.$('[name="qtyOnHand"]').val();
        let remainQty = parseFloat(qtyOnHand) + parseFloat(qty);
        instance.$('[name="remainQty"]').val(remainQty);
    },
    'click .js-add-item': function (event, instance) {
        let itemId = instance.$('[name="itemId"]').val();
        let qty = instance.$('[name="qty"]').val();
        let qtyOnHand = instance.$('[name="qtyOnHand"]').val();
        let remainQty = instance.$('[name="remainQty"]').val();
        if (remainQty == "") {
            alertify.warning('Not Enough Stock for Adjustment.');
            return;
        }
        qty = qty == '' ? 1 : parseFloat(qty);
        qtyOnHand = qtyOnHand == '' ? 1 : parseFloat(qtyOnHand);
        remainQty = remainQty == '' ? 1 : parseFloat(remainQty);
        let stockLocationId = $('[name="stockLocationId"]').val();
        if (stockLocationId == "") {
            alertify.warning("Please choose stock location.");
            return;
        }
        let invoice = instance.view.parentView.parentView._templateInstance.data;
        if (invoice) {
            let soldQty = 0;
            if (stockLocationId == invoice.stockLocationId) {
                let oldItem = invoice.items.find(x => x.itemId == itemId);
                soldQty = oldItem == null || oldItem.qty == null ? 0 : oldItem.qty;
            }
            Meteor.call('findItem', itemId, function (error, itemResult) {
                    let itemOfCollectionNull = itemsCollection.findOne({
                        itemId: itemId
                    });
                    let checkQty = 0;
                    if (itemOfCollectionNull) {
                        checkQty = math.round(qty + parseFloat(itemOfCollectionNull.qty), 6);
                    } else {
                        checkQty = qty;
                    }
                    let qtyOnHand = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
                    let inventoryQty = qtyOnHand - soldQty;
                    if ((inventoryQty + checkQty) >= 0) {
                        let exist = itemsCollection.findOne({
                            itemId: itemId
                        });
                        if (exist) {
                            qty += parseFloat(exist.qty);
                            remainQty = qtyOnHand + qty;
                            itemsCollection.update({
                                _id: exist._id
                            }, {
                                $set: {
                                    qty: qty,
                                    qtyOnHand: qtyOnHand,
                                    remainQty: remainQty
                                }
                            });
                        } else {
                            itemsCollection.insert({
                                itemId: itemId,
                                qty: qty,
                                qtyOnHand: qtyOnHand,
                                remainQty: qtyOnHand + qty,
                                name: instance.name
                            });
                        }
                    }
                    else {
                        alertify.warning('Qty not enough for Adjustment. QtyOnHand is ' + inventoryQty);
                    }

                }
            );
        }
        else {
            Meteor.call('findItem', itemId, function (error, itemResult) {
                let itemOfCollectionNull = itemsCollection.findOne({
                    itemId: itemId
                });
                let checkQty = 0;
                if (itemOfCollectionNull) {
                    checkQty = math.round(qty + parseFloat(itemOfCollectionNull.qty), 6);
                } else {
                    checkQty = qty;
                }
                let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
                if ((inventoryQty + checkQty) >= 0) {
                    let exist = itemsCollection.findOne({
                        itemId: itemId
                    });
                    if (exist) {
                        qty += parseFloat(exist.qty);
                        let remainQty = inventoryQty + qty;
                        itemsCollection.update({
                            _id: exist._id
                        }, {
                            $set: {
                                qty: qty,
                                remainQty: remainQty,
                                qtyOnHand: inventoryQty
                            }
                        });
                    } else {
                        itemsCollection.insert({
                            itemId: itemId,
                            qty: qty,
                            qtyOnHand: inventoryQty,
                            remainQty: inventoryQty + qty,
                            name: instance.name
                        });
                    }

                }
                else {
                    alertify.warning('Qty not enough for Adjustment. QtyOnHand is ' + inventoryQty);
                }

            });
        }
    },
// Reactive table for item
    'click .js-update-item': function (event, instance) {
        alertify.item(fa('pencil', TAPi18n.__('pos.adjustment.schema.itemId.label')), renderTemplate(editItemsTmpl, this));
    }
    ,
    'click .js-destroy-item': function (event, instance) {
        event.preventDefault();
        let itemDoc = this;
        if (AutoForm.getFormId() == "Pos_adjustmentUpdate") { //check if update form
            swal({
                title: "Are you sure?",
                text: "លុបទំនិញមួយនេះ?",
                type: "warning", showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            }).then(
                function () {
                    if (!deletedItem.findOne({itemId: itemDoc.itemId})) {
                        deletedItem.insert(itemDoc);
                    }
                    itemsCollection.remove({itemId: itemDoc.itemId});
                    swal.close();
                });
        } else {
            destroyAction(
                itemsCollection, {
                    _id: this._id
                }, {
                    title: TAPi18n.__('pos.adjustment.schema.itemId.label'),
                    itemTitle: this.itemId
                }
            );
        }

    }
    ,
    'change .item-qty'(event, instance)
    {
        let thisObj = $(event.currentTarget);
        let currentQty = parseFloat(event.currentTarget.value);
        let itemId = $(event.currentTarget).parents('tr').find('.itemId').text();
        let currentItem = itemsCollection.findOne({itemId: itemId});
        let selector = {};
        if (currentQty == "" || currentQty == 0 || currentQty == null) {
            thisObj.val(currentItem.qty);
        } else {
            let invoice = instance.view.parentView.parentView._templateInstance.data;
            let stockLocationId = $('[name="stockLocationId"]').val();
            if (invoice) {
                let soldQty = 0;
                if (stockLocationId == invoice.stockLocationId) {
                    soldQty = invoice.items.find(x => x.itemId == itemId).qty;
                }
                Meteor.call('findItem', itemId, function (error, itemResult) {

                    let qtyOnHand = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId]
                    let inventoryQty = qtyOnHand - soldQty;
                    if ((inventoryQty + currentQty) >= 0) {
                        itemsCollection.update({itemId: itemId}, {
                            $set: {
                                qty: currentQty,
                                qtyOnHand: qtyOnHand,
                                remainQty: qtyOnHand + currentQty,

                            }
                        });
                    }
                    else {
                        thisObj.val(currentItem.qty);
                        alertify.warning('Qty not enough for Adjustment. QtyOnHand is ' + inventoryQty);
                    }

                });
            }
            else {
                Meteor.call('findItem', itemId, function (error, itemResult) {
                    let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId]
                    if ((inventoryQty + currentQty) >= 0) {
                        itemsCollection.update({itemId: itemId}, {
                            $set: {
                                qty: currentQty,
                                qtyOnHand: inventoryQty,
                                remainQty: inventoryQty + currentQty,
                            }
                        });
                    }
                    else {
                        thisObj.val(currentItem.qty);
                        alertify.warning('Qty not enough for Adjustment. QtyOnHand is ' + inventoryQty);
                    }

                });
            }
        }


    }
    ,
// "keypress .item-qty"(evt) {
//     var charCode = (evt.which) ? evt.which : evt.keyCode;
//     return !(charCode > 31 && (charCode < 48 || charCode > 57));
// }
})
;
//destroy
itemsTmpl.onDestroyed(function () {
    Session.set('itemFilterState', {});
});

// Edit
editItemsTmpl.onCreated(function () {
    this.state('amount', 0);

    this.autorun(() => {
        let data = Template.currentData();
        this.state('amount', data.amount);
    });
});

editItemsTmpl.helpers({
    schema() {
        return AdjustmentItemsSchema;
    },
    data: function () {
        let data = Template.currentData();
        return data;
    }
});

editItemsTmpl.events({
    'change [name="itemId"]': function (event, instance) {
        instance.$('[name="qty"]').val('');
        //instance.$('[name="price"]').val('');
        //instance.$('[name="amount"]').val('');
    },
    'keyup [name="qty"],[name="price"]': function (event, instance) {
        let qty = instance.$('[name="qty"]').val();
        let price = instance.$('[name="price"]').val();
        qty = _.isEmpty(qty) ? 0 : parseFloat(qty);
        price = _.isEmpty(price) ? 0 : parseFloat(price);
        let amount = math.round(qty * price, 6);

        instance.state('amount', amount);
    }
});

let hooksObject = {
    onSuccess: function (formType, result) {
        alertify.item().close();
        displaySuccess();
    },
    onError: function (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks(['Pos_adjustmentItemsEdit'], hooksObject);

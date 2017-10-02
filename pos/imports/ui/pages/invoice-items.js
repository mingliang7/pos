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

//methods
import {itemInfo} from '../../../common/methods/item-info';

// Collection
import {ItemsSchema} from '../../api/collections/order-items.js';
import {Invoices} from '../../api/collections/invoice.js';
import {Order} from '../../api/collections/order';
// Declare template
var itemsTmpl = Template.Pos_invoiceItems,
    actionItemsTmpl = Template.Pos_invoiceItemsAction,
    editItemsTmpl = Template.Pos_invoiceItemsEdit;
//methods
import {removeItemInSaleOrder} from '../../../common/methods/sale-order';

let currentItemsInupdateForm = new Mongo.Collection(null);
let tmpDeletedItem = new Mongo.Collection(null); // use to check with credit limit 
// Local collection
var itemsCollection;
export const deletedItem = new Mongo.Collection(null); //export collection deletedItem to invoice js
// Page
import './invoice-items.html';


itemsTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('item');

    // Data context
    let data = Template.currentData();
    itemsCollection = data.itemsCollection;

    // State
    this.state('amount', 0);
    this.defaultPrice = new ReactiveVar(0);
    this.defaultItem = new ReactiveVar();
    this.defaultQty = new ReactiveVar(0);
    this.autorun(() => {
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
        if (this.defaultItem.get() && (this.defaultItem.get() || this.defaultQty.get())) {
            itemInfo.callPromise({
                _id: this.defaultItem.get(),
                customerId: Session.get('getCustomerId'),
                qty: this.defaultQty.get(),
                routeName: FlowRouter.getRouteName(),
                saleType: Session.get('saleType')
            }).then((result) => {
                this.defaultPrice.set(result.price);
            }).catch((err) => {
                console.log(err.message);
            });
        }
    });
});

itemsTmpl.onRendered(function () {

});

itemsTmpl.helpers({
    isRetail() {
        let saleType = Session.get('saleType');
        return saleType === 'retail' ? 'btn-success' : 'btn-default';
    },
    isWholeSale() {
        let saleType = Session.get('saleType');
        return saleType === 'wholeSale' ? 'btn-success' : 'btn-default';
    },
    notActivatedSaleOrder() {
        if (FlowRouter.query.get('customerId')) {
            return false;
        }
        return true;
    },
    tableSettings: function () {
        let i18nPrefix = 'pos.invoice.schema';

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
            key: 'qty',
            label: __(`${i18nPrefix}.qty.label`),
            fn(value, obj, key) {
                return FlowRouter.query.get('customerId') ? value : Spacebars.SafeString(`<input type="text" value=${value} class="item-qty">`);
            }
        }, {
            key: 'price',
            label: __(`${i18nPrefix}.price.label`),
            fn(value, object, key) {
                return numeral(value).format('0,0.000');
            }
        }, {
            key: 'amount',
            label: __(`${i18nPrefix}.amount.label`),
            fn(value, object, key) {
                return numeral(value).format('0,0.000');
            }
        }, {
            key: '_id',
            label() {
                return fa('bars', '', true);
            },
            headerClass: function () {
                let css = 'text-center col-action-invoice-item';
                return css;
            },
            tmpl: actionItemsTmpl,
            sortable: false
        }];

        return reactiveTableSettings;
    },
    schema() {
        return ItemsSchema;
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
        try {
            let total = 0;
            let getItems = itemsCollection.find({});
            getItems.forEach((obj) => {
                total += obj.amount;
            });
            total = FlowRouter.query.get('customerId') ? 0 : total;
            if (Session.get('getCustomerId')) {
                let deletedItemsTotal = 0;
                if (AutoForm.getFormId() == "Pos_invoiceUpdate") {
                    if (currentItemsInupdateForm.find().count() > 0) {
                        currentItemsInupdateForm.find().forEach(function (item) {
                            deletedItemsTotal += item.amount;
                        });
                    }
                }
                Session.set('creditLimitAmount', math.round(total - deletedItemsTotal, 6));
            }
            return total;
        } catch (error) {
            console.log(error.message);
        }
    },
    totalAmount() {
        let instance = Template.instance();
        try {
            return math.round(instance.defaultPrice.get() * instance.defaultQty.get(), 6);
        } catch (error) {
            console.log(error.message)
        }
    },
    price() {
        let instance = Template.instance();
        try {
            return instance.defaultPrice.get();
        } catch (err) {

        }
    },
});

itemsTmpl.events({
    'click .wholeSale'(event, instance) {
        if (Session.get('saleType') === 'retail') { //check if current button is not wholesale
            let itemIds = [];
            let items = itemsCollection.find({}).fetch();
            items.forEach(function (item) {
                itemIds.push(item.itemId);
            });
            Meteor.call('checkItemPriceType', {_id: {$in: itemIds}}, function (err, result) {
                if (!err) {
                    result.forEach(function (i) {
                        items.forEach(function (item) {
                            if (i._id === item.itemId) {
                                itemsCollection.update({_id: item._id}, {
                                    $set: {
                                        price: i.wholeSalePrice,
                                        amount: item.qty * i.wholeSalePrice
                                    }
                                });
                            }
                        });
                    });
                }
            });
            Session.set('saleType', 'wholeSale');
        }
    },
    'click .retail'(event, instance) {
        if (Session.get('saleType') === 'wholeSale') { //check if current button is not retail
            let itemIds = [];
            let items = itemsCollection.find({}).fetch();
            items.forEach(function (item) {
                itemIds.push(item.itemId);
            });
            Meteor.call('checkItemPriceType', {_id: {$in: itemIds}}, function (err, result) {
                if (!err) {
                    result.forEach(function (i) {
                        items.forEach(function (item) {
                            if (i._id === item.itemId) {
                                itemsCollection.update({_id: item._id}, {
                                    $set: {
                                        price: i.price,
                                        amount: item.qty * i.price
                                    }
                                });
                            }
                        });
                    });
                }
            });
            Session.set('saleType', 'retail');
        }
    },
    'change [name="item-filter"]'(event, instance) {
        //filter item in order-item collection
        let currentValue = event.currentTarget.value;
        switch (currentValue) {
            case 'none-scheme':
                Session.set('itemFilterState', {scheme: {$exists: false}});
                break;
            case 'scheme':
                Session.set('itemFilterState', {scheme: {$exists: true}});
                break;
            case 'all':
                Session.set('itemFilterState', {});
                break;
        }

    },
    'change [name="itemId"]': function (event, instance) {
        instance.name = event.currentTarget.selectedOptions[0].text;
        instance.defaultItem.set(event.currentTarget.value);
    },
    'change [name="qty"]'(event, instance) {
        let qty = instance.$('[name="qty"]').val();
        qty = _.isEmpty(qty) ? 0 : parseFloat(qty);
        instance.defaultQty.set(qty);

    },
    'change [name="price"]': function (event, instance) {
        let price = instance.$('[name="price"]').val();
        price = _.isEmpty(price) ? 0 : parseFloat(price);
        instance.defaultPrice.set(price);
    },
    'click .js-add-item': function (event, instance) {
        let itemId = instance.$('[name="itemId"]').val();
        if (itemId == "") {
            alertify.warning('Please choose item.');
            return;
        }
        let qty = instance.$('[name="qty"]').val();
        qty = qty == '' ? 1 : parseFloat(qty);
        let price = parseFloat(instance.$('[name="price"]').val());
        let amount = math.round(qty * price, 6);
        let stockLocationId = $('[name="stockLocationId"]').val();
        if (stockLocationId == "") {
            alertify.warning("Please choose stock location.");
            return;
        }
        let invoice = instance.view.parentView.parentView._templateInstance.data;
        if (invoice) {
            let soldQty = 0;
            //-----------------------
            let docItems = [];
            invoice.items.reduce(function (res, value) {
                if (!res[value.itemId]) {
                    res[value.itemId] = {
                        price: value.price,
                        amount: value.amount,
                        qty: 0,
                        itemId: value.itemId
                    };
                    docItems.push(res[value.itemId])
                } else {
                    res[value.itemId].amount += value.amount;
                }
                res[value.itemId].qty += value.qty;
                return res;
            }, {});
            //-----------------------
            if (stockLocationId == invoice.stockLocationId) {
                let oldItem = docItems.find(x => x.itemId == itemId);
                soldQty = oldItem == null || oldItem.qty == null ? 0 : oldItem.qty;
            }
            Meteor.call('addScheme', {itemId}, function (err, result) {
                if (!_.isEmpty(result[0])) {
                    result.forEach(function (item) {
                        // let schemeItem = itemsCollection.findOne({itemId: item.itemId});
                        // if(schemeItem) {
                        //     let amount = item.price * item.quantity;
                        //     itemsCollection.update({itemId: schemeItem.itemId}, {$inc: {qty: item.quantity, amount: amount}});
                        // }else{
                        Meteor.call('findItem', item.itemId, function (error, itemResult) {
                            let itemOfCollectionNull = itemsCollection.find({
                                itemId: item.itemId
                            });
                            let checkQty = 0;
                            if (itemOfCollectionNull.count() > 0) {
                                let addedQty = 0;
                                itemOfCollectionNull.forEach(function (itemNull) {
                                    addedQty += itemNull.qty;
                                });
                                checkQty = math.round((item.quantity * qty) + addedQty, 6);
                            } else {
                                checkQty = math.round(item.quantity * qty, 6);
                            }
                            let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
                            inventoryQty += soldQty;
                            if (checkQty <= inventoryQty) {
                                itemsCollection.insert({
                                    itemId: item.itemId,
                                    qty: math.round(item.quantity * qty, 6),
                                    price: item.price,
                                    amount: math.round((item.price * item.quantity) * qty, 6),
                                    name: item.itemName
                                });
                            }
                            else {
                                alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                            }
                        });
                        // }
                    });
                }
                else {
                    Meteor.call('findItem', itemId, function (error, itemResult) {
                        let itemOfCollectionNull = itemsCollection.find({
                            itemId: itemId
                        });
                        let checkQty = 0;
                        if (itemOfCollectionNull.count() > 0) {
                            let addedQty = 0;
                            itemOfCollectionNull.forEach(function (itemNull) {
                                addedQty += itemNull.qty;
                            });
                            checkQty = math.round(qty + addedQty, 6);
                        } else {
                            checkQty = qty;
                        }
                        let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
                        inventoryQty += soldQty;
                        if (checkQty <= inventoryQty) {
                            /*  let exist = itemsCollection.findOne({
                             itemId: itemId
                             });
                             if (exist) {
                             qty += parseFloat(exist.qty);
                             amount = math.round(qty * price, 2);
                             itemsCollection.update({
                             _id: exist._id
                             }, {
                             $set: {
                             qty: qty,
                             price: price,
                             amount: amount
                             }
                             });
                             } else {*/
                            itemsCollection.insert({
                                itemId: itemId,
                                qty: qty,
                                price: price,
                                amount: amount,
                                name: instance.name
                            });
                            /*}*/
                        }
                        else {
                            alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                        }
                    });
                }
            });
        }
        else {
            Meteor.call('addScheme', {itemId}, function (err, result) {
                if (!_.isEmpty(result[0])) {
                    result.forEach(function (item) {
                        // let schemeItem = itemsCollection.findOne({itemId: item.itemId});
                        // if(schemeItem) {
                        //     let amount = item.price * item.quantity;
                        //     itemsCollection.update({itemId: schemeItem.itemId}, {$inc: {qty: item.quantity, amount: amount}});
                        // }else{

                        Meteor.call('findItem', item.itemId, function (error, itemResult) {
                            let itemOfCollectionNull = itemsCollection.find({
                                itemId: item.itemId
                            });
                            let checkQty = 0;
                            if (itemOfCollectionNull.count() > 0) {
                                let addedQty = 0;
                                itemOfCollectionNull.forEach(function (itemNull) {
                                    addedQty += itemNull.qty;
                                });
                                checkQty = math.round((item.quantity * qty) + addedQty, 6);
                            } else {
                                checkQty = math.round(item.quantity * qty, 6);
                            }
                            let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
                            if (checkQty <= inventoryQty) {
                                itemsCollection.insert({
                                    itemId: item.itemId,
                                    qty: math.round(item.quantity * qty, 6),
                                    price: item.price,
                                    amount: math.round((item.price * item.quantity) * qty, 6),
                                    name: item.itemName
                                });
                            }
                            else {
                                alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                            }
                            // }
                        });
                    });
                } else {
                    Meteor.call('findItem', itemId, function (error, itemResult) {
                        let itemOfCollectionNull = itemsCollection.find({
                            itemId: itemId
                        });
                        let checkQty = 0;
                        if (itemOfCollectionNull.count() > 0) {
                            let addedQty = 0;
                            itemOfCollectionNull.forEach(function (itemNull) {
                                addedQty += itemNull.qty;
                            });
                            checkQty = math.round(qty + addedQty, 6);
                        } else {
                            checkQty = qty;
                        }
                        let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId];
                        if (checkQty <= inventoryQty) {
                            /*   let exist = itemsCollection.findOne({
                             itemId: itemId
                             });
                             if (exist) {
                             qty += parseFloat(exist.qty);
                             amount = math.round(qty * price, 2);

                             itemsCollection.update({
                             _id: exist._id
                             }, {
                             $set: {
                             qty: qty,
                             price: price,
                             amount: amount
                             }
                             });
                             }
                             else {*/
                            itemsCollection.insert({
                                itemId: itemId,
                                qty: qty,
                                price: price,
                                amount: amount,
                                name: instance.name
                            });
                            /* }*/
                        }
                        else {
                            alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                        }

                    });
                }
            });
        }

    },
    // Reactive table for item
    'click .js-update-item': function (event, instance) {
        alertify.item(fa('pencil', TAPi18n.__('pos.invoice.schema.itemId.label')), renderTemplate(editItemsTmpl, this));
    },
    'click .js-destroy-item': function (event, instance) {
        event.preventDefault();
        let itemDoc = this;
        if (AutoForm.getFormId() == "Pos_invoiceUpdate") { //check if update form

            let isCurrentItemExistInTmpCollection = instance.data.currentItemsCollection.findOne({itemId: this.itemId}); // check if current item collection has wanted remove item
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
                    if (isCurrentItemExistInTmpCollection) {
                        currentItemsInupdateForm.insert(itemDoc);
                    }
                    itemsCollection.remove({itemId: itemDoc.itemId});
                    swal.close();
                });
        } else {
            itemsCollection.remove(this._id);
        }

    },
    'change .item-qty'(event, instance) {
        let thisObj = $(event.currentTarget);
        let price = numeral().unformat(thisObj.parents('tr').find('.price').text());
        let amount = numeral().unformat(thisObj.parents('tr').find('.amount').text());
        let currentQty = parseFloat(event.currentTarget.value);
        let itemId = $(event.currentTarget).parents('tr').find('.itemId').text();
        let currentItem = itemsCollection.findOne({itemId: itemId, price: price, amount: amount});
        let checkQty = 0;
        let itemOfCollectionNull = itemsCollection.find({
            itemId: itemId
        });
        if (itemOfCollectionNull.count() > 0) {
            let addedQty = 0;
            itemOfCollectionNull.forEach(function (itemNull) {
                addedQty += itemNull.qty;
            });
            checkQty = math.round(addedQty - currentItem.qty + currentQty, 6);
        } else {
            checkQty = currentQty;
        }

        let selector = {};
        if (currentQty != '' || currentQty != 0) {
            selector.$set = {
                amount: math.round(currentQty * currentItem.price, 6),
                qty: currentQty
            }
        } else {
            selector.$set = {
                amount: math.round(currentItem.qty * currentItem.price, 6),
                qty: currentItem.qty
            };
            currentQty = currentItem.qty;
            thisObj.val(currentItem.qty);
        }

        let invoice = instance.view.parentView.parentView._templateInstance.data;
        let stockLocationId = $('[name="stockLocationId"]').val();
        if (invoice) {
            let soldQty = 0;
            //-----------------------
            let docItems = [];
            invoice.items.reduce(function (res, value) {
                if (!res[value.itemId]) {
                    res[value.itemId] = {
                        price: value.price,
                        amount: value.amount,
                        qty: 0,
                        itemId: value.itemId
                    };
                    docItems.push(res[value.itemId])
                } else {
                    res[value.itemId].amount += value.amount;
                }
                res[value.itemId].qty += value.qty;
                return res;
            }, {});
            //-----------------------
            if (stockLocationId == invoice.stockLocationId) {
                soldQty = docItems.find(x => x.itemId == itemId).qty;
            }
            Meteor.call('findItem', itemId, function (error, itemResult) {
                let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId]
                inventoryQty += soldQty;
                if (checkQty <= inventoryQty) {
                    itemsCollection.update({itemId: itemId, price: price, amount: amount}, selector);
                }
                else {
                    selector.$set = {
                        amount: math.round(currentItem.qty * currentItem.price, 6),
                        qty: currentItem.qty
                    };
                    itemsCollection.update({itemId: itemId, price: price, amount: amount}, selector);
                    thisObj.val(currentItem.qty);
                    alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                }

            });
        }
        else {
            Meteor.call('findItem', itemId, function (error, itemResult) {
                let inventoryQty = !itemResult.qtyOnHand || (itemResult && itemResult.qtyOnHand[stockLocationId]) == null ? 0 : itemResult.qtyOnHand[stockLocationId]
                if (checkQty <= inventoryQty) {
                    itemsCollection.update({itemId: itemId, price: price, amount: amount}, selector);
                }
                else {
                    selector.$set = {
                        amount: math.round(currentItem.qty * currentItem.price, 6),
                        qty: currentItem.qty
                    };
                    itemsCollection.update({itemId: itemId, price: price, amount: amount}, selector);
                    thisObj.val(currentItem.qty);
                    alertify.warning('Qty not enough for sale. QtyOnHand is ' + inventoryQty);
                }

            });
        }

    },
    // "keypress .item-qty"(evt) {
    //     var charCode = (evt.which) ? evt.which : evt.keyCode;
    //     return !(charCode > 31 && (charCode < 48 || charCode > 57));
    // },
    // 'keypress [name="qty"]'(evt) {
    //     var charCode = (evt.which) ? evt.which : evt.keyCode;
    //     return !(charCode > 31 && (charCode < 48 || charCode > 57));
    // }
});
itemsTmpl.onDestroyed(function () {
    Session.set('itemFilterState', {});
});

let hooksObject = {
    onSubmit: function (insertDoc, updateDoc, currentDoc) {
        this.event.preventDefault();

        // Check old item
        if (insertDoc.itemId == currentDoc.itemId) {
            itemsCollection.update({
                    _id: currentDoc._id
                },
                updateDoc
            );
        } else {
            // Check exist item
            let exist = itemsCollection.findOne({
                _id: insertDoc._id
            });
            if (exist) {
                let newQty = math.round(exist.qty + insertDoc.qty, 6);
                let newPrice = insertDoc.price;
                let newAmount = math.round(newQty * newPrice, 6);

                itemsCollection.update({
                    _id: insertDoc._id
                }, {
                    $set: {
                        qty: newQty,
                        price: newPrice,
                        amount: newAmount
                    }
                });
            } else {
                itemsCollection.remove({
                    _id: currentDoc._id
                });
                itemsCollection.insert(insertDoc);
            }
        }

        this.done();
    },
    onSuccess: function (formType, result) {
        alertify.item().close();
        Template.instance().defaultItem.set(undefined);
        displaySuccess();
    },
    onError: function (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks(['Pos_invoiceItemsEdit'], hooksObject);

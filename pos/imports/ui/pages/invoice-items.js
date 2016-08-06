import {ReactiveDict} from 'meteor/reactive-dict';
import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
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
import {RequirePassword} from '../../api/collections/requirePassword';

import {ItemsSchema} from '../../api/collections/order-items.js';
import {Invoices} from '../../api/collections/invoice.js';
import {Order} from '../../api/collections/order';
// Declare template
var itemsTmpl = Template.Pos_invoiceItems,
    actionItemsTmpl = Template.Pos_invoiceItemsAction;
editItemsTmpl = Template.Pos_invoiceItemsEdit;

//methods
import {removeItemInSaleOrder} from '../../../common/methods/sale-order';
import {checkCreditLimit} from '../../../common/methods/validations/creditLimit.js';

// Local collection
var itemsCollection;
export const deletedItem = new Mongo.Collection(null); //export collection deletedItem to invoice js
Tracker.autorun(function () {
    console.log('tracker always run has ha');
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
    if(Session.get('creditLimitAmount' ||  Session.get('getCustomerId'))) {
        checkCreditLimit.callPromise({customerId: Session.get('getCustomerId'), customerInfo: Session.get('customerInfo'), creditLimitAmount: Session.get('creditLimitAmount')})
            .then(function (result) {
                let customerInfo = Session.get('customerInfo');
                let requirePassword = RequirePassword.findOne({}, {sort:{_id: -1}});
                if (customerInfo.creditLimit && result > customerInfo.creditLimit) {
                    if (requirePassword && requirePassword.invoiceForm &&
                        !_.includes(requirePassword.whiteListCustomer, Session.get('getCustomerId'))) {
                        swal({
                            title: "Password Required!",
                            text: `Balance Amount(${result}) > Credit Limit(${customerInfo.creditLimit}), Ask your Admin for password!`,
                            inputType: "password",
                            type: "input",
                            showCancelButton: true,
                            closeOnConfirm: false,
                            inputPlaceholder: "Type Password"
                        }, function (inputValue) {
                            if (inputValue === false) {
                                $('.reset-button').trigger('click');
                                itemsCollection.remove({});
                                Session.set("getCustomerId", "");
                                Session.set("creditLimitAmount", undefined);
                                return false;
                            }
                            if (inputValue === "") {
                                swal.showInputError("You need to input password!");
                                return false
                            }else{
                                let inputPassword = SHA256(inputValue.trim());
                                if(inputPassword == requirePassword.password){
                                    swal("Message!", "Successfully", "success");
                                    Session.set("creditLimitAmount", undefined);
                                    return false
                                }else{
                                    // $('.reset-button').trigger('click'); //reset from when wrong
                                    // swal("Message!", "Incorrect Password!", "error");
                                    swal.showInputError("Wrong password!");
                                    return false;
                                }
                            }

                        });
                    }
                }
            })
            .catch(function (err) {
                console.log(err);
            })
    }
});
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

});

itemsTmpl.onRendered(function () {

});

itemsTmpl.helpers({
    notActivatedSaleOrder(){
        console.log('inside not activated');
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
            fn(value, obj, key){
                return FlowRouter.query.get('customerId') ? value : Spacebars.SafeString(`<input type="text" value=${value} class="item-qty">`);
            }
        }, {
            key: 'price',
            label: __(`${i18nPrefix}.price.label`),
            fn(value, object, key) {
                return numeral(value).format('0,0.00');
            }
        }, {
            key: 'amount',
            label: __(`${i18nPrefix}.amount.label`),
            fn(value, object, key) {
                return numeral(value).format('0,0.00');
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
        let total = 0;
        let getItems = itemsCollection.find();
        getItems.forEach((obj) => {
            total += obj.amount;
        });
        total = FlowRouter.query.get('customerId') ? 0 : total;
        console.log('in total state');
        Session.set('creditLimitAmount', total);
        return total;
    }
});

itemsTmpl.events({
    'change [name="item-filter"]'(event, instance){
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
        instance.name = event.currentTarget.selectedOptions[0].text.split(' : ')[1];
        instance.$('[name="qty"]').val('');
        // instance.$('[name="price"]').val('');
        instance.$('[name="amount"]').val('');
    },
    'keyup [name="qty"],[name="price"]': function (event, instance) {
        let qty = instance.$('[name="qty"]').val();
        let price = instance.$('[name="price"]').val();
        qty = _.isEmpty(qty) ? 0 : parseInt(qty);
        price = _.isEmpty(price) ? 0 : parseFloat(price);
        let amount = qty * price;

        instance.state('amount', amount);
    },
    'click .js-add-item': function (event, instance) {
        let itemId = instance.$('[name="itemId"]').val();
        let qty = parseInt(instance.$('[name="qty"]').val());
        let price = math.round(parseFloat(instance.$('[name="price"]').val()), 2);
        let amount = math.round(qty * price, 2);
        // Check exist
        Meteor.call('addScheme', {itemId}, function (err, result) {
            if(!_.isEmpty(result[0])) {
                result.forEach(function (item) {
                    // let schemeItem = itemsCollection.findOne({itemId: item.itemId});
                    // if(schemeItem) {
                    //     let amount = item.price * item.quantity;
                    //     itemsCollection.update({itemId: schemeItem.itemId}, {$inc: {qty: item.quantity, amount: amount}});
                    // }else{
                        itemsCollection.insert({
                            itemId: item.itemId,
                            qty: item.quantity * qty,
                            price: item.price,
                            amount: (item.price * item.quantity) * qty,
                            name: item.itemName
                        });
                    // }
                });
            }else{
                let exist = itemsCollection.findOne({
                    itemId: itemId
                });
                if (exist) {
                    qty += parseInt(exist.qty);
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
                } else {
                    itemsCollection.insert({
                        itemId: itemId,
                        qty: qty,
                        price: price,
                        amount: amount,
                        name: instance.name
                    });
                }
            }
        });
    },
    // Reactive table for item
    'click .js-update-item': function (event, instance) {
        alertify.item(fa('pencil', TAPi18n.__('pos.invoice.schema.itemId.label')), renderTemplate(editItemsTmpl, this));
    },
    'click .js-destroy-item': function (event, instance) {
        event.preventDefault();
        let itemDoc = this;
        if (AutoForm.getFormId() == "Pos_invoiceUpdate") { //check if update form
            swal({
                    title: "Are you sure?",
                    text: "លុបទំនិញមួយនេះ?",
                    type: "warning", showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: false
                },
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
                    title: TAPi18n.__('pos.invoice.schema.itemId.label'),
                    itemTitle: this.itemId
                }
            );
        }

    },
    'change .item-qty'(event, instance){
        let currentQty = event.currentTarget.value;
        let itemId = $(event.currentTarget).parents('tr').find('.itemId').text();
        let currentItem = itemsCollection.findOne({itemId: itemId});
        let selector = {};
        if (currentQty != '') {
            selector.$set = {
                amount: currentQty * currentItem.price,
                qty: currentQty
            }
        } else {
            selector.$set = {
                amount: 1 * currentItem.price,
                qty: 1
            }
        }
        itemsCollection.update({itemId: itemId}, selector);
    },
    "keypress .item-qty" (evt) {
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    }
});
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
        return ItemsSchema;
    },
    data: function () {
        let data = Template.currentData();
        return data;
    }
});

editItemsTmpl.events({
    'change [name="itemId"]': function (event, instance) {
        instance.$('[name="qty"]').val('');
        instance.$('[name="price"]').val('');
        instance.$('[name="amount"]').val('');
    },
    'keyup [name="qty"],[name="price"]': function (event, instance) {
        let qty = instance.$('[name="qty"]').val();
        let price = instance.$('[name="price"]').val();
        qty = _.isEmpty(qty) ? 0 : parseInt(qty);
        price = _.isEmpty(price) ? 0 : parseFloat(price);
        let amount = qty * price;

        instance.state('amount', amount);
    }
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
                let newQty = exist.qty + insertDoc.qty;
                let newPrice = insertDoc.price;
                let newAmount = math.round(newQty * newPrice, 2);

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
        displaySuccess();
    },
    onError: function (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks(['Pos_invoiceItemsEdit'], hooksObject);

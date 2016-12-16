import './productUi.html'
import {Template} from 'meteor/templating'
//import collection
import {Item} from '../../../api/collections/item';
import {Invoices} from '../../../api/collections/invoice';
//import resolver
import Resolver from '../../../api/libs/resolver';
let tmplIndex = Template.pos_martProduct;
let productComponentTmpl = Template.pos_martProductComponent;
tmplIndex.onCreated(function () {
    this.queryProduct = new ReactiveVar('');
});
tmplIndex.onRendered(function () {
    $('#mart-barcode').focus();
    this.autorun(() => {
        let k = FlowRouter.query.get('k');
        if (k == 'barcode') {
            $('#mart-barcode').focus()
        } else if (k == 'search') {
            $('#mart-search-product').focus()
        }
        if (this.queryProduct.get) {
            Meteor.subscribe('pos.martProductSearch', {query: this.queryProduct.get(), filter: {limit: 7}});
        }
    })
});

tmplIndex.events({
    'click .view a'() {
        $('.products ul').toggleClass('list')
    },
    'keyup #mart-barcode'(event, instance){
        if (event.which == 13) {
            Meteor.call('mart.findItemByBarcode', {
                barcode: event.currentTarget.value,
                branchId: Session.get('currentBranch')
            }, function (err, result) {
                if (result.exist == 'true' && result.qtyOnHand > 0) {
                    let invoiceId = FlowRouter.query.get('inv');
                    if (invoiceId) {
                        let invoice = Invoices.findOne(invoiceId);
                        if (invoice) {
                            result.invoiceId = invoiceId;
                        } else {
                            FlowRouter.query.unset('inv');
                        }
                    }
                    result.date = moment().toDate();
                    result.userId = Meteor.userId();
                    result.branchId = Session.get('currentBranch');
                    result.product = result.item;
                    Meteor.call('mart.addProductToInvoice', {data: result}, function (err, result) {
                        console.log(result);
                        if (result && result.flag == 'insert') {
                            FlowRouter.query.set({inv: result._id});
                        } else {
                            console.log(err);
                        }
                    });
                }
                else if (result.exist == 'true' && result.qtyOnHand <= 0) {
                    alertify.warning(`${result.item.name} is out of stock`)
                } else {
                    alertify.warning('No Item match!');
                }
            });
            $(event.currentTarget).val('');
        }
    },
    'keyup #mart-search-product'(event, instance){
        let query = event.currentTarget.value;
        instance.queryProduct.set(query)
    },
    'click .addProduct'(event, instance){
        Meteor.call('mart.checkStock', {
            itemId: this.product._id,
            branchId: Session.get('currentBranch')
        }, (err, result) => {
            if (result && result.qty > 0) {
                let invoiceId = FlowRouter.query.get('inv');
                if (invoiceId) {
                    let invoice = Invoices.findOne(invoiceId);
                    if (invoice) {
                        this.invoiceId = invoiceId;
                    } else {
                        FlowRouter.query.unset('inv');
                    }
                }
                this.date = moment().toDate();
                this.userId = Meteor.userId();
                this.branchId = Session.get('currentBranch');
                Meteor.call('mart.addProductToInvoice', {data: this}, function (err, result) {
                    console.log(result);
                    if (result && result.flag == 'insert') {
                        FlowRouter.query.set({inv: result._id});
                    } else {
                        console.log(err);
                    }
                });
            } else if (!result.qty || result && result.qty <= 0) {
                alertify.warning(`${result.name} is out of stock`)
            }
        });
    }
});
tmplIndex.helpers({
    products(){
        let instance = Template.instance();
        let query = instance.queryProduct.get();
        return Resolver.productSearch({query, filter: {limit: 7}});
    },
    productNotZero(){
        let instance = Template.instance();
        let query = instance.queryProduct.get();
        let items = Resolver.productSearch({query, filter: {limit: 7}});
        if (items) {
            return items.count() > 0;
        }
        return false;
    }
});

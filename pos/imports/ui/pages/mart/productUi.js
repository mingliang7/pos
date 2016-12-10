import './productUi.html'
import {Template} from 'meteor/templating'
//import collection
import {Item} from '../../../api/collections/item';
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
    'keyup #mart-search-product'(event, instance){
        let query = event.currentTarget.value;
        instance.queryProduct.set(query)
    },
    'click .addProduct'(event, instance){
        Meteor.call('mart.checkStock', {itemId: this.product._id, branchId: Session.get('currentBranch')}, (err,result) =>{
            if(result && result.qty > 0){
                let invoiceId = FlowRouter.query.get('inv');
                console.log(invoiceId);
                if (invoiceId) {
                    this.invoiceId = invoiceId;
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
            }else if(result && result.qty <=0){
                alertify.error(`${result.name} is out of stock`)
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

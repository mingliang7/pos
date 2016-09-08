//Collections
import {LendingStocks} from '../../../api/collections/lendingStock';
import {Item} from '../../../api/collections/item';
import {itemsCollection} from '../../../api/collections/tmpCollection';
//pages
import './lendingStock.html';
import {vendorInfo} from '../../../../common/methods/vendor.js';
import {ReceiveTypeDeletedItem} from './receiveItem-items.js'
var lendingStockTmpl = Template.listLendingStock;

lendingStockTmpl.helpers({
    lendingStocks(){
        let item = [];
        let lendingStocks = LendingStocks.find({status: 'active', vendorId: FlowRouter.query.get('vendorId')}).fetch();
        if (ReceiveTypeDeletedItem.find().count() > 0) {
            ReceiveTypeDeletedItem.find().forEach(function (item) {
                console.log(item);
                lendingStock.forEach(function (lendingStock) {
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
            console.log(Item.find().fetch());
            return Item.findOne(itemId).name;
        } catch (e) {

        }

    }
});

lendingStockTmpl.events({
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

import {Item} from '../../imports/api/collections/item.js'

Meteor.methods({
    findItem(itemId){
        return Item.findOne(itemId);
    }
});
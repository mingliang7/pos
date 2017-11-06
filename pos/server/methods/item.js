import {Item} from '../../imports/api/collections/item';

Meteor.methods({
    findItemName(id) {
        return Item.findOne(id);
    },
    getOneItem(id) {
        return Item.findOne({_id: id});
    }
});
import {Meteor} from 'meteor/meteor';
import {Item} from '../../../imports/api/collections/item.js';
Meteor.methods({
  getItem: function(id){
    return Item.findOne(id)
  }
})

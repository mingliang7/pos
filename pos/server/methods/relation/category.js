//import {Meteor} from 'meteor/meteor';
import {Categories} from '../../../imports/api/collections/category.js';

Meteor.methods({
    isCategoryHasRelation: function (id) {
        let category = Categories.findOne({parentId:id});
        if(category){
            return true;
        }
        return false;
    }
});


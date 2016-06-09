//import {Meteor} from 'meteor/meteor';
import {Categories} from '../../imports/api/collections/category.js';

Meteor.methods({
    isRelationExist: function (arr) {
        let getArray = arr.constructor === Array ? arr : [];
        let exist = false;
        getArray.forEach(function (obj) {
            //let collection = eval(obj.collection);
            let getRelation = Categories.findOne(obj.selector);
            if (getRelation) {
                exist = true;
                return false;
            }
        });
        return exist;

    }
});


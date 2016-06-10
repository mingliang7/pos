import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {Item} from '../../imports/api/collections/item.js';
import {Units} from '../../imports/api/collections/units.js'
// Check user password
export const itemInfo = new ValidatedMethod({
    name: 'pos.itemInfo',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}) {
        if (!this.isSimulation) {
            let data = Item.findOne(_id);
            return data;
        }
    }
});

export const getUnitName = new ValidatedMethod({
  name: 'pos.unitInfo',
  mixins:[CallPromiseMixin],
  validate: new SimpleSchema({
   sellingUnit: { type: [Object], blackbox: true }
 }).validator(),
  run(data){
    let listUnit = "";
    if(!this.isSimulation){
      if(data.sellingUnit.length > 0){
        data.sellingUnit.forEach((unit)=>{
          listUnit +=  Units.findOne(unit.unitId).name + `, converter: ${unit.converter}`;
        })
      }
      return listUnit;
    }
  }
})

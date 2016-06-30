import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {Vendors} from '../../imports/api/collections/vendor.js';
import {Units} from '../../imports/api/collections/units.js'
// Check user password
export const vendorInfo = new ValidatedMethod({
    name: 'pos.vendorInfo',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}) {
        if (!this.isSimulation) {
            let vendor = Vendors.findOne(_id);
            return vendor;
        }
    }
});
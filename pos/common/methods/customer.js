import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {CallPromiseMixin} from 'meteor/didericis:callpromise-mixin';

// Collection
import {Customers} from '../../imports/api/collections/customer.js';
import {Units} from '../../imports/api/collections/units.js'
// Check user password
export const customerInfo = new ValidatedMethod({
    name: 'pos.customerInfo',
    mixins: [CallPromiseMixin],
    validate: new SimpleSchema({
        _id: {type: String}
    }).validator(),
    run({_id}) {
        if (!this.isSimulation) {
            let customer = Customers.findOne(_id);
            console.log(customer);
            return customer;
        }
    }
});

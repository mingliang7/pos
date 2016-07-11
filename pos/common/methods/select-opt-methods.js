import {Meteor} from 'meteor/meteor';
import {Accounts} from 'meteor/accounts-base';
import {ValidatedMethod} from 'meteor/mdg:validated-method';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {_} from 'meteor/erasaur:meteor-lodash';
import {moment} from  'meteor/momentjs:moment';
import {Branch} from '../../../core/imports/api/collections/branch.js'
// Collection
import {Customers} from '../../imports/api/collections/customer.js';
import {Item} from '../../imports/api/collections/item.js';
import {Order} from '../../imports/api/collections/order.js';
import {Reps} from '../../imports/api/collections/rep.js';
import {StockLocations} from '../../imports/api/collections/stockLocation.js';
import {Vendors} from '../../imports/api/collections/vendor';
import {PaymentGroups} from '../../imports/api/collections/paymentGroup';
import {Terms} from '../../imports/api/collections/terms';
export let SelectOptMethods = {};

SelectOptMethods.stockLocation = new ValidatedMethod({
    name: 'pos.selectOptMethods.stockLocation',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText && params.branchId) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ],
                    branchId: params.branchId
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = StockLocations.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.name;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

SelectOptMethods.rep = new ValidatedMethod({
    name: 'pos.selectOptMethods.rep',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();
            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText && params.branchId) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ],
                    branchId: params.branchId
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Reps.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.name;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

SelectOptMethods.customer = new ValidatedMethod({
    name: 'pos.selectOptMethods.customer',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText && params.branchId) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ],
                    branchId: params.branchId
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Customers.find(selector, {limit: 10});
            data.forEach(function (value) {
                let termOrGroup = value._term ? ` (Term ${value._term.name})` : ` (Group ${value._paymentGroup.name})`;
                let label = value._id + ' : ' + value.name + termOrGroup;
                list.push({label: label, value: value._id});
            });
            return list;
        }
    }
});
SelectOptMethods.vendor = new ValidatedMethod({
    name: 'pos.selectOptMethods.vendor',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText && params.branchId) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ],
                    branchId: params.branchId
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Vendors.find(selector, {limit: 10});
            console.log(data.fetch())
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.name;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

SelectOptMethods.item = new ValidatedMethod({
    name: 'pos.selectOptMethods.item',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;

            if (searchText) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Item.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.name;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

SelectOptMethods.order = new ValidatedMethod({
    name: 'pos.selectOptMethods.order',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;

            if (searchText) {
                selector = {
                    _id: {$regex: searchText, $options: 'i'},
                    branchId: params.branchId
                };
            } else if (values.length) {
                selector = {_id: {$in: values}};
            }

            let data = Order.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value._id + ' | Date: ' + moment(value.orderDate).format('DD/MM/YYYY');
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

SelectOptMethods.user = new ValidatedMethod({
    name: 'pos.selectOptMethods.user',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText && params.branchId) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {username: {$regex: searchText, $options: 'i'}}
                    ],
                    username: {$ne: 'super'}
                };
            } else if (values.length) {
                selector = {_id: {$in: values}, username: {$ne: 'super'}};
            }

            let data = Meteor.users.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value.username;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});
SelectOptMethods.branch = new ValidatedMethod({
    name: 'pos.selectOptMethods.branch',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};
            let data = Branch.find(selector, {limit: 100});
            data.forEach(function (value) {
                let label = value._id + ' : ' + value.enName;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});

SelectOptMethods.paymentGroup = new ValidatedMethod({
    name: 'pos.selectOptMethods.paymentGroup',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText && params.branchId) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}, name: {$ne: 'super'}};
            }

            let data = PaymentGroups.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value.name;
                list.push({label: label, value: value._id});
            });
            
            return list;
        }
    }
});

SelectOptMethods.term = new ValidatedMethod({
    name: 'pos.selectOptMethods.term',
    validate: null,
    run(options) {
        if (!this.isSimulation) {
            this.unblock();

            let list = [], selector = {};
            let searchText = options.searchText;
            let values = options.values;
            let params = options.params || {};

            if (searchText && params.branchId) {
                selector = {
                    $or: [
                        {_id: {$regex: searchText, $options: 'i'}},
                        {name: {$regex: searchText, $options: 'i'}}
                    ]
                };
            } else if (values.length) {
                selector = {_id: {$in: values}, name: {$ne: 'super'}};
            }

            let data = Terms.find(selector, {limit: 10});
            data.forEach(function (value) {
                let label = value.name;
                list.push({label: label, value: value._id});
            });

            return list;
        }
    }
});


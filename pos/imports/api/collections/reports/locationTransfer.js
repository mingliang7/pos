import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {AutoForm} from 'meteor/aldeed:autoform';
import {moment} from 'meteor/momentjs:moment';
import {StockLocations} from '../../collections/stockLocation';
import {SelectOpts} from '../../../../../core/imports/ui/libs/select-opts.js';

export const locationTransferReport = new SimpleSchema({
    fromDate: {
        type: Date,
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY HH:mm:ss',
                    pickTime: true
                }
            }
        }
    },
    toDate: {
        type: Date,
        defaultValue: moment().toDate(),
        autoform: {
            afFieldInput: {
                type: "bootstrap-datetimepicker",
                dateTimePickerOptions: {
                    format: 'DD/MM/YYYY HH:mm:ss',
                    pickTime: true
                }
            }
        }
    },
    fromBranch: {
        type: String,
        optional: true,
        label: function () {
            return TAPi18n.__('core.welcome.branch');
        },
        autoform: {
            type: "universe-select",
            options: function () {
                return Meteor.isClient && SelectOpts.branchForCurrentUser(false);
            },
            afFieldInput: {
                value: function () {
                    return Meteor.isClient && Session.get('currentBranch');
                }
            }
        }
    },
    fromLocation: {
        type: String,
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'All',
            },
            options(){
                let list = [];
                let branchId = AutoForm.getFieldValue('fromBranch') || Meteor.isClient && Session.get('currentBranch') ;
                if (branchId) {
                    var subLocation = Meteor.subscribe('pos.stockLocation', {branchId: branchId}, {});
                    if(subLocation.ready()) {
                        let locations = StockLocations.find({branchId: branchId});
                        locations.forEach(function (location) {
                            list.push({label: `${location._id}: ${location.name}`, value: location._id});
                        });
                        return list;
                    }
                }
                return list;
            }
        }
    },
    toBranch: {
        type: String,
        optional: true,
        label: function () {
            return TAPi18n.__('core.welcome.branch');
        },
        autoform: {
            type: "universe-select",
            options: function () {
                return Meteor.isClient && SelectOpts.branchForCurrentUser(false);
            },
            afFieldInput: {
                uniPlaceholder: 'All',
                value: function () {
                    return Meteor.isClient && Session.get('currentBranch');
                }
            }
        }
    },
    toLocation: {
        type: String,
        optional: true,
        autoform: {
            type: 'universe-select',
            afFieldInput: {
                uniPlaceholder: 'All',
            },
            options(){
                let list = [];
                let branchId = AutoForm.getFieldValue('toBranch') || Meteor.isClient && Session.get('currentBranch') ;
                if (branchId) {
                    var subLocation = Meteor.subscribe('pos.stockLocation', {branchId: branchId}, {});
                    if(subLocation.ready()) {
                        let locations = StockLocations.find({branchId: branchId});
                        locations.forEach(function (location) {
                            list.push({label: `${location._id}: ${location.name}`, value: location._id});
                        });
                        return list;
                    }
                }
                return list;
            }
        }
    },
    filter: {
        type: [String],
        optional: true,
        autoform: {
            type: 'universe-select',
            multiple: true,
            uniPlaceholder: 'All',
            options(){
                return [
                    {
                        label: '#ID',
                        value: '_id'
                    },
                    {
                        label: 'Customer',
                        value: 'customerId'
                    },
                    {
                        label: 'Date',
                        value: 'invoiceDate'
                    },
                    {
                        label: 'Status',
                        value: 'status'
                    }
                ]
            }
        }
    }
});
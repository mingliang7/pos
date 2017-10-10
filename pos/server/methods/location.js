import {Location} from '../../imports/api/collections/location';

Meteor.methods({
    fetchLocationList(forReport) {
        let list = [{label: forReport ? 'All' : '(select one)', value: ''}];
        Location.find({}).forEach(function (doc) {
            list.push({
                label: doc.name,
                value: doc._id
            })
        });
        return list;
    }
});
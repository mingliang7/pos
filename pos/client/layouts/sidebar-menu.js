import {Template} from 'meteor/templating';
import {TAPi18n} from 'meteor/tap:i18n';
import 'meteor/tap:i18n-ui';

// Page
import './sidebar-menu.html';

Tracker.autorun(function () {
    if(Meteor.userId()) {
        Meteor.call('currentUserStockAndAccountMappingDoc', {userId: Meteor.userId()}, function (err, result) {
            Session.set('currentUserStockAndAccountMappingDoc', result);
        });
    }
});
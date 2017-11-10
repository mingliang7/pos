import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from 'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {moment} from 'meteor/momentjs:moment';

// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import {Location} from '../../api/collections/location.js';

// Tabular
import {LocationTabular} from '../../../common/tabulars/location.js';

// Page
import './location.html';

// Declare template
let indexTmpl = Template.Pos_location,
    actionTmpl = Template.Pos_locationAction,
    newTmpl = Template.Pos_locationNew,
    editTmpl = Template.Pos_locationEdit,
    showTmpl = Template.Pos_locationShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('location');
    createNewAlertify('locationShow',);
});


indexTmpl.helpers({
    tabularTable() {
        return LocationTabular;
    }
    // ,
    // selector() {
    //     return {branchId: Session.get('currentBranch')};
    // }
});

indexTmpl.events({
    'click .js-create'(event, instance) {
        alertify.location(fa('plus', 'New Location'), renderTemplate(newTmpl));
    },
    'click .js-update'(event, instance) {
        alertify.location(fa('pencil', 'Edit Location'), renderTemplate(editTmpl, this));
    },
    'click .js-display'(event, instance) {
        alertify.locationShow(fa('eye', 'Show Location'), renderTemplate(showTmpl, this));
    },
    'click .js-destroy'(event, instance) {
        var id = this._id;
        destroyAction(
            Location,
            {_id: id},
            {title: 'Location', itemTitle: id}
        );

    },
});

// New
newTmpl.helpers({
    collection() {
        return Location;
    }
});

// Edit


editTmpl.helpers({
    collection() {
        return Location;
    },
    data() {
        let data = this;
        return data;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(() => {
        this.subscribe('pos.location', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label) {
        let i18nLabel = `pos.location.schema.${label}.label`;
        return i18nLabel;
    },
    data() {
        let data = Location.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess(formType, result) {
        if (formType == 'update') {
            alertify.location().close();
        }
        displaySuccess();
        $('[name="repId"]').val('');
    },
    onError(formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_locationNew',
    'Pos_locationEdit'
], hooksObject);

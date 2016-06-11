import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
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
import {Staffs} from '../../api/collections/staff.js';

// Tabular
import {StaffTabular} from '../../../common/tabulars/staff.js';

// Page
import './staff.html';

// Declare template
let indexTmpl = Template.Pos_staff,
    actionTmpl = Template.Pos_staffAction,
    newTmpl = Template.Pos_staffNew,
    editTmpl = Template.Pos_staffEdit,
    showTmpl = Template.Pos_staffShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('staff', {size: 'lg'});
    createNewAlertify('staffShow',);

    // Reactive table filter
    this.filter = new ReactiveTable.Filter('pos.staffByBranchFilter', ['branchId']);
    this.autorun(()=> {
        this.filter.set(Session.get('currentBranch'));
    });
});

indexTmpl.onDestroyed(()=>{
  ReactiveTable.clearFilters(['pos.staffByBranchFilter']);
})

indexTmpl.helpers({
    tabularTable(){
        return StaffTabular;
    },
    selector() {
        return {branchId: Session.get('currentBranch')};
    },
    tableSettings(){
        let i18nPrefix = 'pos.staff.schema';

        reactiveTableSettings.collection = 'pos.reactiveTable.staff';
        reactiveTableSettings.filters = ['pos.staffByBranchFilter'];
        reactiveTableSettings.fields = [
            {
                key: '_id',
                label: __(`${i18nPrefix}._id.label`),
                sortOrder: 0,
                sortDirection: 'asc'
            },
            {key: 'name', label: __(`${i18nPrefix}.name.label`)},
            {key: 'gender', label: __(`${i18nPrefix}.gender.label`)},
            {key: 'position', label: __(`${i18nPrefix}.position.label`)},
            {key: 'telephone', label: __(`${i18nPrefix}.telephone.label`)},
            {key: 'status', label: __(`${i18nPrefix}.status.label`)},
            {
                key: '_id',
                label(){
                    return fa('bars', '', true);
                },
                headerClass: function () {
                    let css = 'text-center col-action';
                    return css;
                },
                tmpl: actionTmpl, sortable: false
            }
        ];

        return reactiveTableSettings;
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.staff(fa('plus', TAPi18n.__('pos.staff.title')), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.staff(fa('pencil', TAPi18n.__('pos.staff.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            Staffs,
            {_id: this._id},
            {title: TAPi18n.__('pos.staff.title'), itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.staffShow(fa('eye', TAPi18n.__('pos.staff.title')), renderTemplate(showTmpl, this));
    }
});

// New
newTmpl.helpers({
    collection(){
        return Staffs;
    }
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.staff', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return Staffs;
    },
    data () {
        let data = Staffs.findOne(this._id);
        return data;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.staff', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `pos.staff.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = Staffs.findOne(this._id);
        return data;
    }
});

// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.staff().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_staffNew',
    'Pos_staffEdit'
], hooksObject);

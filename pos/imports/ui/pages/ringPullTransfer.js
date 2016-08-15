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
import {RingPullTransfers} from '../../api/collections/ringPullTransfer.js';
import {balanceTmpCollection} from '../../api/collections/tmpCollection';
// Tabular
import {RingPullTransferTabular} from '../../../common/tabulars/ringPullTransfer.js';

// Page
import './ringPullTransfer.html';

// Declare template
let indexTmpl = Template.Pos_ringPullTransfer,
    actionTmpl = Template.Pos_ringPullTransferAction,
    buttonActionTmpl = Template.Pos_ringPullTransferButtonAction,
    newTmpl = Template.Pos_ringPullTransferNew,
    editTmpl = Template.Pos_ringPullTransferEdit,
    showTmpl = Template.Pos_ringPullTransferShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('ringPullTransfer', {size: 'lg'});
    createNewAlertify('ringPullTransferShow');

    // Reactive table filter
    this.filter = new ReactiveTable.Filter('pos.ringPullTransferByBranchFilter', ['branchId']);
    this.autorun(()=> {
        this.filter.set(Session.get('currentBranch'));
    });
});

indexTmpl.onDestroyed(()=> {
    ReactiveTable.clearFilters(['pos.ringPullTransferByBranchFilter']);
    balanceTmpCollection.remove({});
});

indexTmpl.helpers({
    tabularTable(){
        return RingPullTransferTabular;
    },
    selector() {
        return {fromBranchId: Session.get('currentBranch')};
    },
    tableSettings(){
        let i18nPrefix = 'pos.ringPullTransfer.schema';

        reactiveTableSettings.collection = 'pos.reactiveTable.ringPullTransfer';
        reactiveTableSettings.filters = ['pos.ringPullTransferByBranchFilter'];
        reactiveTableSettings.fields = [
            // {
            //     key: '_id',
            //     label: __(`${i18nPrefix}._id.label`),
            //     sortOrder: 0,
            //     sortDirection: 'asc'
            // },
            {key: 'name', label: __(`${i18nPrefix}.name.label`)},
            {key: 'gender', label: __(`${i18nPrefix}.gender.label`)},
            {key: 'telephone', label: __(`${i18nPrefix}.telephone.label`)},
            {key: '_term.name', label: __(`${i18nPrefix}.term.label`)},
            {key: '_paymentGroup.name', label: __(`${i18nPrefix}.paymentGroup.label`)},
            {
                key: '_id',
                label(){
                    return ''
                },
                headerClass: function () {
                    let css = 'col-receive-payment cursor-pointer';
                    return css;
                },
                tmpl: buttonActionTmpl, sortable: false
            },
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
        alertify.ringPullTransfer(fa('plus', TAPi18n.__('pos.ringPullTransfer.title')), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.ringPullTransfer(fa('pencil', TAPi18n.__('pos.ringPullTransfer.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            RingPullTransfers,
            {_id: this._id},
            {title: TAPi18n.__('pos.ringPullTransfer.title'), itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.ringPullTransferShow(fa('eye', TAPi18n.__('pos.ringPullTransfer.title')), renderTemplate(showTmpl, this));
    },
    'click .go-to-receive-payment'(event, instance){
        FlowRouter.go('pos.receivePayment', {ringPullTransferId: this._id});
    }
});

newTmpl.onCreated(function () {
    this.branch = new ReactiveVar();
    Meteor.call('getBranch', Session.get('currentBranch'),(err,result)=> {
        if(result) {
            this.branch.set(result);
        }else{
            console.log(err);
        }
    })
});

// New
newTmpl.helpers({
    fromBranchId(){
        let instance = Template.instance();
        if(instance.branch.get()) {
            return instance.branch.get().enShortName;
        }
        return '';
    },
    collection(){
        return RingPullTransfers;
    }
});
newTmpl.events({
    'change [name="paymentType"]'(event, instance){
        instance.paymentType.set($(event.currentTarget).val());
    }
});

// Edit
editTmpl.onCreated(function () {
    this.paymentType = new ReactiveVar(this.data.paymentType);
    this.autorun(()=> {
        this.subscribe('pos.ringPullTransfer', {_id: this.data._id});
    });
});
editTmpl.events({
    'change [name="paymentType"]'(event, instance){
        instance.paymentType.set($(event.currentTarget).val());
    }
});

editTmpl.helpers({
    collection(){
        return RingPullTransfers;
    },
    data () {
        let data = RingPullTransfers.findOne(this._id);
        return data;
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.ringPullTransfer', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `pos.ringPullTransfer.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = RingPullTransfers.findOne(this._id);
        return data;
    }
});
//receive payment
Template.Pos_ringPullTransferButtonAction.helpers({
    checkIfInvoiced(){
        debugger
    }
});
// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.ringPullTransfer().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_ringPullTransferNew',
    'Pos_ringPullTransferEdit'
], hooksObject);

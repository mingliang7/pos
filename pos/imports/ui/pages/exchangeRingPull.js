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
import {ExchangeRingPulls} from '../../api/collections/exchangeRingPull.js';
import {balanceTmpCollection} from '../../api/collections/tmpCollection';
// Tabular
import {ExchangeRingPullTabular} from '../../../common/tabulars/exchangeRingPull.js';

// Page
import './exchangeRingPull.html';

// Declare template
let indexTmpl = Template.Pos_exchangeRingPull,
    actionTmpl = Template.Pos_exchangeRingPullAction,
    buttonActionTmpl = Template.Pos_exchangeRingPullButtonAction,
    newTmpl = Template.Pos_exchangeRingPullNew,
    editTmpl = Template.Pos_exchangeRingPullEdit,
    showTmpl = Template.Pos_exchangeRingPullShow;


// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('exchangeRingPull', {size: 'lg'});
    createNewAlertify('exchangeRingPullShow');

    // Reactive table filter
    this.filter = new ReactiveTable.Filter('pos.exchangeRingPullByBranchFilter', ['branchId']);
    this.autorun(()=> {
        this.filter.set(Session.get('currentBranch'));
    });
});

indexTmpl.onDestroyed(()=> {
    ReactiveTable.clearFilters(['pos.exchangeRingPullByBranchFilter']);
    balanceTmpCollection.remove({});
});

indexTmpl.helpers({
    tabularTable(){
        return ExchangeRingPullTabular;
    },
    selector() {
        return {branchId: Session.get('currentBranch')};
    },
    tableSettings(){
        let i18nPrefix = 'pos.exchangeRingPull.schema';

        reactiveTableSettings.collection = 'pos.reactiveTable.exchangeRingPull';
        reactiveTableSettings.filters = ['pos.exchangeRingPullByBranchFilter'];
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
        alertify.exchangeRingPull(fa('plus', TAPi18n.__('pos.exchangeRingPull.title')), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        alertify.exchangeRingPull(fa('pencil', TAPi18n.__('pos.exchangeRingPull.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        destroyAction(
            ExchangeRingPulls,
            {_id: this._id},
            {title: TAPi18n.__('pos.exchangeRingPull.title'), itemTitle: this._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.exchangeRingPullShow(fa('eye', TAPi18n.__('pos.exchangeRingPull.title')), renderTemplate(showTmpl, this));
    },
    'click .go-to-receive-payment'(event, instance){
        FlowRouter.go('pos.receivePayment', {exchangeRingPullId: this._id});
    }
});

newTmpl.onCreated(function () {
    this.paymentType = new ReactiveVar();
});

// New
newTmpl.helpers({
    collection(){
        return ExchangeRingPulls;
    },
    isTerm(){
        return Template.instance().paymentType.get() == "Term";
    },
    isGroup(){
        return Template.instance().paymentType.get() == "Group";
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
        this.subscribe('pos.exchangeRingPull', {_id: this.data._id});
    });
});
editTmpl.events({
    'change [name="paymentType"]'(event, instance){
        instance.paymentType.set($(event.currentTarget).val());
    }
});

editTmpl.helpers({
    collection(){
        return ExchangeRingPulls;
    },
    data () {
        let data = ExchangeRingPulls.findOne(this._id);
        return data;
    },
    isTerm(){
        return Template.instance().paymentType.get() == "Term";
    },
    isGroup(){
        return Template.instance().paymentType.get() == "Group";
    }
});

// Show
showTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.exchangeRingPull', {_id: this.data._id});
    });
});

showTmpl.helpers({
    i18nLabel(label){
        let i18nLabel = `pos.exchangeRingPull.schema.${label}.label`;
        return i18nLabel;
    },
    data () {
        let data = ExchangeRingPulls.findOne(this._id);
        return data;
    }
});
//receive payment
Template.Pos_exchangeRingPullButtonAction.helpers({
    checkIfInvoiced(){
        debugger
    }
});
// Hook
let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.exchangeRingPull().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_exchangeRingPullNew',
    'Pos_exchangeRingPullEdit'
], hooksObject);

import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {TAPi18n} from 'meteor/tap:i18n';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';
import {ReactiveMethod} from 'meteor/simple:reactive-method';

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
import {ClosingStockBalance} from '../../api/collections/closingStock.js';

// Tabular
import {ClosingStockBalanceTabular} from '../../../common/tabulars/closingStockList.js';

// Page
import './closingStockList.html';

// Declare template
let indexTmpl = Template.Pos_closingStockList;


// Index
indexTmpl.onCreated(function () {
});

indexTmpl.helpers({
    tabularTable(){
        return ClosingStockBalanceTabular;
    },
    selector() {
        return {
            branchId: Session.get('currentBranch')
        };
    }

});

indexTmpl.events({
    'click .generate-closingStock' (event, instance) {
        $.blockUI();
        Meteor.call("testClosingStock", Session.get('currentBranch'), function (err, result) {
            if (!err) {
                alertify.success(`Generate successfully`);
            }
            $.unblockUI();
        });
    },
    'click .js-destroy'(event, instance){
        Meteor.call('removeClosingStock', {
            branchId: Session.get('currentBranch'),
            _id: this._id,
            closingDateString: this.closingDateString
        }, (err, result) => {
            if (!err) {
                alertify.success(`Remove ${this.closingDateString} successfully`);
            } else {
                alertify.error(err.message);
            }
        });
    },
    'click .js-destroy-all'(event, instance){
        swal({
            title: 'Remove Closing Stock',
            text: `Are you sure to remove all ?`,
            type: 'warning',
            allowEscapeKey: false,
            allowOutsideClick: true,
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonColor: "#dd4b39",
            confirmButtonText: 'Yes, remove all.',
            showCancelButton: true
        }).then(function () {
            $.blockUI();
            Meteor.call('removeClosingStockByBranch', {branchId: Session.get('currentBranch')}, (err, result) => {
                if (!err) {
                    alertify.success(`Remove All in branch ${Session.get('currentBranch')} successfully`);
                }
                $.unblockUI();
            });
        }).done();

    }
});

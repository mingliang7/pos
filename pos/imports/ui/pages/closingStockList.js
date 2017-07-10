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
import {CategoryTabular} from '../../../common/tabulars/category.js';

// Page
import './closingStockList.html';

// Declare template
let indexTmpl = Template.Pos_closingStockList;


// Index
indexTmpl.onCreated(function () {
});

indexTmpl.helpers({
    tabularTable(){
        return CategoryTabular;
    },
    selector() {
        return {
            branchId: Session.get('currentBranch')
        };
    }

});

indexTmpl.events({
    'click .js-create' (event, instance) {
        Session.set('CategoryIdSession', null);
        alertify.category(fa('plus', TAPi18n.__('pos.category.title')), renderTemplate(newTmpl));
    },
    'click .js-update' (event, instance) {
        Session.set('CategoryIdSession', this._id);
        alertify.category(fa('pencil', TAPi18n.__('pos.category.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        var id = this._id;
        Meteor.call('isCategoryHasRelation', id, function (error, result) {
            if (error) {
                alertify.error(error.message);
            } else {
                if (result) {
                    alertify.warning("Data has been used. Can't remove.");
                } else {
                    destroyAction(
                        Categories,
                        {_id: id},
                        {title: TAPi18n.__('pos.category.title'), itemTitle: id}
                    );
                }
            }
        });


    },
    'click .js-display' (event, instance) {
        alertify.categoryShow(fa('eye', TAPi18n.__('pos.category.title')), renderTemplate(showTmpl, this));
    }
});

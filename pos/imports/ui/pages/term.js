
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {Template} from 'meteor/templating';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';
import {AutoForm} from 'meteor/aldeed:autoform';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';

import {Terms} from '../../api/collections/terms.js';
import './term.html';
let indexTmpl = Template.Pos_term,
    insertTmpl = Template.Pos_termNew,
    actionTmpl = Template.Pos_termAction,
    editTmpl = Template.Pos_termEdit,
    showTmpl = Template.Pos_termShow;
// index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('term');
    // Reactive table filter
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.term(fa('plus', 'term'), renderTemplate(insertTmpl));
    }
});

indexTmpl.helpers({
  tableSettings(){
      let i18nPrefix = 'Pos.customer.schema';

      reactiveTableSettings.collection = 'pos.reactiveTable.term';
      reactiveTableSettings.fields = [
          {
              key: '_id',
              label: '_id',
              sortOrder: 0,
              sortDirection: 'asc'
          },
          {key: 'name', label:'Name'},
          {key: 'netDueIn', label:'Net Due In'},
          {key: 'discountPercentages', label: 'Discount Percentages'},
          {key: 'discountIfPaidWithin', label: 'Discount Within'},
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

//insert
insertTmpl.helpers({
    collection(){
        return Terms;
    }
});

//update
editTmpl.helpers({
  collection(){
    return Terms;
  }
})
// actionTmpl
actionTmpl.events({
    'click .js-update'(event,instance){
       alertify.term(fa('pencil', 'Edit Unit'), renderTemplate(editTmpl, this));
    },
    'click .js-display'(event, instance){
      alertify.term(fa('pencil', 'Display'), renderTemplate(showTmpl, this));

    },
    'click .js-destroy'(event, instance) {
        destroyAction(
            Terms,
            {_id: this._id},
            {title: 'Remove Unit', itemTitle: this._id}
        );
    }
})

let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.term().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks([
    'Pos_termNew',
    'Pos_termEdit'
], hooksObject)

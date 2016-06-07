
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

import {Units} from '../../api/collections/units.js';
import './unit.html';
let indexTmpl = Template.Pos_unit,
    insertTmpl = Template.Pos_unitNew,
    actionTmpl = Template.Pos_unitAction,
    editTmpl = Template.Pos_unitEdit,
    showTmpl = Template.Pos_unitShow;
// index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('unit');
    // Reactive table filter
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.unit(fa('plus', 'unit'), renderTemplate(insertTmpl));
    }
});

indexTmpl.helpers({
  tableSettings(){
      let i18nPrefix = 'Pos.customer.schema';

      reactiveTableSettings.collection = 'pos.reactiveTable.unit';
      reactiveTableSettings.fields = [
          {
              key: '_id',
              label: '_id',
              sortOrder: 0,
              sortDirection: 'asc'
          },
          {key: 'name', label:'name'},
          {key: 'description', label: 'Description'},
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
        return Units;
    }
});

//update
editTmpl.helpers({
  collection(){
    return Units;
  }
})
// actionTmpl
actionTmpl.events({
    'click .js-update'(event,instance){
       alertify.unit(fa('pencil', 'Edit Unit'), renderTemplate(editTmpl, this));
    },
    'click .js-display'(event, instance){
      alertify.unit(fa('pencil', 'Display'), renderTemplate(showTmpl, this));

    },
    'click .js-destroy'(event, instance) {
        destroyAction(
            Units,
            {_id: this._id},
            {title: 'Remove Unit', itemTitle: this._id}
        );
    }
})

let hooksObject = {
    onSuccess (formType, result) {
        if (formType == 'update') {
            alertify.unit().close();
        }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};
AutoForm.addHooks([
    'Pos_unitNew',
    'Pos_unitEdit'
], hooksObject)

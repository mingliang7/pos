import {Template} from 'meteor/templating';
import {AutoForm} from 'meteor/aldeed:autoform';
import {Roles} from  'meteor/alanning:roles';
import {alertify} from 'meteor/ovcharik:alertifyjs';
import {sAlert} from 'meteor/juliancwirko:s-alert';
import {fa} from 'meteor/theara:fa-helpers';
import {lightbox} from 'meteor/theara:lightbox-helpers';
import {_} from 'meteor/erasaur:meteor-lodash';
import 'meteor/theara:jsonview';
import {TAPi18n} from 'meteor/tap:i18n';
import 'meteor/tap:i18n-ui';


// Lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
import {destroyAction} from '../../../../core/client/libs/destroy-action.js';
import {displaySuccess, displayError} from '../../../../core/client/libs/display-alert.js';
import {__} from '../../../../core/common/libs/tapi18n-callback-helper.js';

// Component
import '../../../../core/client/components/loading.js';
import '../../../../core/client/components/column-action.js';
import '../../../../core/client/components/form-footer.js';

// Collection
import {EnterBills} from '../../api/collections/enterBill.js';

// Tabular
import {EnterBillTabular} from '../../../common/tabulars/enterBill.js';

// Page
import './enterBill.html';
import './enterBill-items.js';
import './info-tab.html';
//methods
import {EnterBillInfo} from '../../../common/methods/enterBill.js'
import {vendorInfo} from '../../../common/methods/vendor.js';
//Tracker for vendor infomation
Tracker.autorun(function(){
  if(Session.get('vendorId')){
    vendorInfo.callPromise({_id: Session.get('vendorId')})
    .then(function(result){
      Session.set('vendorInfo', result);
    })
  }
});
// Declare template
let indexTmpl = Template.Pos_enterBill,
    actionTmpl = Template.Pos_enterBillAction,
    newTmpl = Template.Pos_enterBillNew,
    editTmpl = Template.Pos_enterBillEdit,
    showTmpl = Template.Pos_enterBillShow;

// Local collection
let itemsCollection = new Mongo.Collection(null);

// Index
indexTmpl.onCreated(function () {
    // Create new  alertify
    createNewAlertify('enterBill', {size: 'lg'});
    createNewAlertify('enterBillShow',);
});

indexTmpl.helpers({
    tabularTable(){
        return EnterBillTabular;
    },
    selector() {
        return {branchId: Session.get('currentBranch')};
    }
});

indexTmpl.events({
    'click .js-create' (event, instance) {
        alertify.enterBill(fa('plus', TAPi18n.__('pos.enterBill.title')), renderTemplate(newTmpl)).maximize();
    },
    'click .js-update' (event, instance) {
        alertify.enterBill(fa('pencil', TAPi18n.__('pos.enterBill.title')), renderTemplate(editTmpl, this));
    },
    'click .js-destroy' (event, instance) {
        let data = this;
        destroyAction(
            EnterBills,
            {_id: data._id},
            {title: TAPi18n.__('pos.enterBill.title'), itemTitle: data._id}
        );
    },
    'click .js-display' (event, instance) {
        alertify.enterBillShow(fa('eye', TAPi18n.__('pos.enterBill.title')), renderTemplate(showTmpl, this));
    },
    'click .js-enterBill' (event, instance) {
        let params = {};
        let queryParams = {enterBillId: this._id};
        let path = FlowRouter.path("pos.enterBillReportGen", params, queryParams);

        window.open(path, '_blank');
    }
});

// New
newTmpl.events({
  'change [name=vendorId]'(event, instance){
    if(event.currentTarget.value != ''){
      Session.set('vendorId', event.currentTarget.value);
    }
  }
})
newTmpl.helpers({
  vendorInfo() {
    let vendorInfo = Session.get('vendorInfo');
    if(!vendorInfo){
      return {empty: true, message: 'No data available'}
    }

    return {
      fields: `<li>Phone: <b>${vendorInfo.telephone ? vendorInfo.telephone : ''}</b></li>
              <li>Opening Balance: <span class="label label-success">0</span></li>
              <li >Credit Limit: <span class="label label-warning">${vendorInfo.creditLimit ? numeral(vendorInfo.creditLimit).format('0,0.00') : 0}</span></li>
              <li>Sale Order to be enterBill: <span class="label label-primary">0</span>`
  };
  },
  collection(){
      return EnterBills;
  },
  itemsCollection(){
      return itemsCollection;
  },
  disabledSubmitBtn: function () {
      let cont = itemsCollection.find().count();
      if (cont == 0) {
          return {disabled: true};
      }

      return {};
  }
});

newTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
    Session.set('vendorInfo', undefined);
    Session.set('vendorId', undefined);
});

// Edit
editTmpl.onCreated(function () {
    this.autorun(()=> {
        this.subscribe('pos.enterBill', {_id: this.data._id});
    });
});

editTmpl.helpers({
    collection(){
        return EnterBills;
    },
    data () {
        let data = EnterBills.findOne(this._id);

        // Add items to local collection
        _.forEach(data.items, (value)=> {
          Meteor.call('getItem', value.itemId, function(err, result){
            value.name = result.name;
            itemsCollection.insert(value);
          })
        });

        return data;
    },
    itemsCollection(){
        return itemsCollection;
    },
    disabledSubmitBtn: function () {
        let cont = itemsCollection.find().count();
        if (cont == 0) {
            return {disabled: true};
        }

        return {};
    }
});

editTmpl.onDestroyed(function () {
    // Remove items collection
    itemsCollection.remove({});
});

// Show
showTmpl.onCreated(function () {
  this.enterBill = new ReactiveVar();
  this.autorun(()=> {
      EnterBillInfo.callPromise({_id: this.data._id})
            .then( (result) => {
              this.enterBill.set(result);
            }).catch(function (err) {
                console.log(err.message);
            }
        );
  });
});

showTmpl.helpers({
    i18nLabel(label){
        let key = `pos.enterBill.schema.${label}.label`;
        return TAPi18n.__(key);
    },
    enterBillInfo () {

        let enterBillInfo = Template.instance().enterBill.get();

        // Use jsonview
        enterBillInfo.jsonViewOpts = {collapsed: true};
        //
        return enterBillInfo;
    }
});

// Hook
let hooksObject = {
    before: {
        insert: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                items.push(obj);
            });
            doc.items = items;

            return doc;
        },
        update: function (doc) {
            let items = [];
            itemsCollection.find().forEach((obj)=> {
                delete obj._id;
                items.push(obj);
            });
            doc.$set.items = items;

            delete doc.$unset;

            return doc;
        }
    },
    onSuccess (formType, result) {
        // if (formType == 'update') {
        // Remove items collection
        itemsCollection.remove({});

        alertify.enterBill().close();
        // }
        displaySuccess();
    },
    onError (formType, error) {
        displayError(error.message);
    }
};

AutoForm.addHooks([
    'Pos_enterBillNew',
    'Pos_enterBillEdit'
], hooksObject);

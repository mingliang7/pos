//component
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify.js';
import {reactiveTableSettings} from '../../../../core/client/libs/reactive-table-settings.js';
import {renderTemplate} from '../../../../core/client/libs/render-template.js';
//page
import './customerDeposit.html';
//import DI
import 'printthis';
//import collection
import {customerDepositSchema} from '../../api/collections/reports/customerDepositSchema';

//methods
import {customerDeposit} from '../../../common/methods/reports/customerDeposit';
//state
let paramsState = new ReactiveVar();
let invoiceData = new ReactiveVar();
//declare template
let indexTmpl = Template.Pos_customerDeposit,
    invoiceDataTmpl = Template.customerDepositData;
Tracker.autorun(function () {
    if (paramsState.get()) {
        swal({
            title: "Pleas Wait",
            text: "Fetching Data....", showConfirmButton: false
        });
        customerDeposit.callPromise(paramsState.get())
            .then(function (result) {
                invoiceData.set(result);
                setTimeout(function () {
                    swal.close()
                }, 200);
            }).catch(function (err) {
            swal.close();
            console.log(err.message);
        })
    }
});

indexTmpl.onCreated(function () {
    createNewAlertify('invoiceReport');
    paramsState.set(FlowRouter.query.params());
    this.locations = new ReactiveVar([]);
    Meteor.call('fetchLocationList', true, (err, result) => {
        if (!err) {
            this.locations.set(result);
        }
    });
});
indexTmpl.helpers({
    schema() {
        return customerDepositSchema;
    },
    locationsOption() {
        let instance = Template.instance();
        return instance.locations.get();
    },
});
indexTmpl.events({
    'click .printReport'(event, instance) {
        window.print();
    }
});
invoiceDataTmpl.onRendered(function () {
    Meteor.setTimeout(function () {
        $("table.fixed-table").fixMe();
    }, 1000)
});
invoiceDataTmpl.helpers({
    no(index) {
        return index + 1;
    },
    company() {
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        return doc.company;
    },
    data() {
        if (invoiceData.get()) {
            return invoiceData.get();
        }
    },
    capitalize(customerName) {
        return _.capitalize(customerName);
    }
});


AutoForm.hooks({
    customerDepositReport: {
        onSubmit(doc) {
            this.event.preventDefault();
            FlowRouter.query.unset();
            let params = {};
            params.type = "active";
            params.branchId = Session.get('currentBranch');
            if (doc.date) {
                let formatDate = moment(doc.date).format('YYYY-MM-DD');
                params.date = `${formatDate}`;
            }
            if (doc.customer) {
                params.customerId = doc.customer
            }
            if (doc.repId) {
                params.reps = doc.repId.join(',');
            }
            if (doc.branchId) {
                params.branchId = doc.branchId.join(',');
            }
            if (doc.locationId) {
                params.locationId = doc.locationId;
            }
            if(doc.status){
                params.status = doc.status;
            }
            FlowRouter.query.set(params);
            paramsState.set(FlowRouter.query.params());
            return false;
        }
    }
});
$.fn.fixMe = function () {
    return this.each(function () {
        var $this = $(this),
            $t_fixed;

        function init() {
            $this.wrap('<div class="container-fix-header" />');
            $t_fixed = $this.clone();
            $t_fixed.find("tbody").remove().end().addClass("fixed").insertBefore($this);
            resizeFixed();
        }

        function resizeFixed() {
            $t_fixed.find("th").each(function (index) {
                $(this).css("width", $this.find("th").eq(index).outerWidth() + "px");
            });
        }

        function scrollFixed() {
            var offset = $(this).scrollTop(),
                tableOffsetTop = $this.offset().top,
                tableOffsetBottom = tableOffsetTop + $this.height() - $this.find("thead").height();
            if (offset < tableOffsetTop || offset > tableOffsetBottom)
                $t_fixed.hide();
            else if (offset >= tableOffsetTop && offset <= tableOffsetBottom && $t_fixed.is(":hidden"))
                $t_fixed.show();
        }

        $(window).resize(resizeFixed);
        $(window).scroll(scrollFixed);
        init();
    });
}
import './printPayment.html';

let indexTmpl = Template.pos_printPayment;

indexTmpl.onCreated(function () {
    $(window).keydown(function (e) {
      if(e.keyCode == 8 && e.altKey) {
            FlowRouter.go('/pos/mart-ui');
        }
    });
    this.printData = new ReactiveVar({});
    this.autorun(() => {
        let inv = FlowRouter.query.get('inv');
        if(inv) {
            Meteor.call('printPayment', {invoiceId: inv},  (err,result) =>{
                if(result) {
                    this.printData.set(result);
                }
            });
        }
    });
});

indexTmpl.helpers({
    data(){
        let instance = Template.instance();
        let data = instance.printData.get();
        let doc = Session.get('currentUserStockAndAccountMappingDoc');
        data.company = doc.company;
        return data;
    },
    hasPayment(paymentObj){
        return !_.isEmpty(paymentObj);
    }
});

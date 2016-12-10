import './martPayment.html';

let indexTmpl = Template.pos_martPayment;

indexTmpl.events({
    'click .done'(event,instance){
        FlowRouter.go('pos.martUi');
    }
});
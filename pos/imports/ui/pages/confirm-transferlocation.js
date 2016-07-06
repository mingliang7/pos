import './confirm-transferlocation.html';

let indexTmpl = Template.Pos_confirmTransferLocation;

indexTmpl.onCreated(function () {
    $('[data-toggle]').on('click', function () {

    });
});

indexTmpl.events({
    'click [data-toggle]'(event,instance){
        toggle = $(event.currentTarget).addClass('active').attr('data-toggle');
        $(event.currentTarget).siblings('[data-toggle]').removeClass('active');
    }
});
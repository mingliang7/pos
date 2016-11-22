import './sale.html'

let indexTmpl = Template.Pos_sale;

indexTmpl.onRendered(function() {
    $(window).keydown(function (e) {
        console.log(e)
        if(e.keyCode == 83 && e.altKey) {
            $('.search').focus();
        }else if(e.keyCode == 67 && e.altKey) {
            $('.barcode').focus();
        }
    });
   $('.barcode').focus();
});
import './productUi.html'
import {Template} from 'meteor/templating'
let tmplIndex = Template.pos_martProduct;

tmplIndex.onRendered(function () {
    $('#mart-barcode').focus();
    this.autorun(() => {
        let k = FlowRouter.query.get('k');
        if (k == 'barcode') {
            $('#mart-barcode').focus()
        } else if (k == 'search') {
            $('#mart-search-product').focus()
        }
    })
});

tmplIndex.events({
    'click .view a'() {
        $('.products ul').toggleClass('list')
    }
});

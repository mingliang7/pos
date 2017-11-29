import './resetData.html';
import {Pos_resetDataSchema} from '../../api/collections/resetData';

Template.Pos_resetData.helpers({
    schema() {
        return Pos_resetDataSchema;
    }
});
Template.Pos_resetData.events({});

AutoForm.hooks({
    resetData: {
        onSubmit(doc) {
            this.event.preventDefault();
            swal({
                title: "Reset Data?",
                text: "Click OK to continue!",
                type: "info",
                showCancelButton: true,
                closeOnConfirm: false,
                showLoaderOnConfirm: true,
            }).then(function () {
                Meteor.call(doc.resetOptions, (err, result) => {
                    if (!err) {
                        swal({
                            title: "Reset Data",
                            text: "Successfully reset",
                            type: "success",
                            confirmButtonClass: "btn-success",
                            showConfirmButton: true,
                            timer: 3000
                        });
                    } else {
                        swal({
                            title: "[Error]",
                            text: err.message,
                            type: "danger",
                            confirmButtonClass: "btn-danger",
                            showConfirmButton: true,
                            timer: 3000
                        });
                    }
                });
            });

        }
    }
});
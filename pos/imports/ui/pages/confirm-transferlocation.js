//page
import './confirm-transferlocation.html';
//lib
import {createNewAlertify} from '../../../../core/client/libs/create-new-alertify';
import {renderTemplate} from '../../../../core/client/libs/render-template';
//collection
import {LocationTransfers} from '../../api/collections/locationTransfer';
//methods
let indexTmpl = Template.Pos_confirmTransferLocation,
    transferInfo = Template.transferInfo;
let transferState = new ReactiveVar(true);
let transferCount = new ReactiveVar();
let playNotification = new buzz.sound('/notification-sounds/unique-notification.mp3');
Tracker.autorun(function () {
    if (Session.get('currentBranch')) {
        let subscription = Meteor.subscribe('pos.activeLocationTransfers', {toBranchId: Session.get('currentBranch')});
        if (!subscription.ready()) {
            swal({
                title: "Please Wait",
                text: "Fetching Data....", showConfirmButton: false
            });
        } else {
            setTimeout(function () {
                swal.close()
            }, 200);

        }
    }
});
indexTmpl.onCreated(function () {
    createNewAlertify('locationTransfer', {size: 'lg'});
    Meteor.call('countTransferLocation', Session.get('currentBranch'), function(err,result) {
        if(result) {
            transferCount.set(result);
        }
    })
});

indexTmpl.helpers({
    transferRequest(){
        let locationTransfers = LocationTransfers.find({
            toBranchId: Session.get('currentBranch'),
            pending: transferState.get()
        });
        return locationTransfers;
    },
    isNotEmpty(){
        let locationTransfers = LocationTransfers.find({toBranchId: Session.get('currentBranch')});
        return locationTransfers.count() > 0;
    },
    playNotificationSound(){
        let count = transferCount.get();
        let locationTransfers = LocationTransfers.find({toBranchId: Session.get('currentBranch')});
        console.log(locationTransfers.count() > count);
        console.log(locationTransfers.count());
        console.log(count);
        if (locationTransfers.count() > count) {
            playNotification.play();
        }
    }
});
indexTmpl.events({
    'click [data-toggle]'(event, instance){
        toggle = $(event.currentTarget).addClass('active').attr('data-toggle');
        $(event.currentTarget).siblings('[data-toggle]').removeClass('active');
    },
    'click .pending'(event, instance){
        transferState.set(true);
    },
    'click .accepted'(event, instance){
        transferState.set(false);
    },
    'click .cursor-pointer'(event, instance){
        Meteor.call('pos.locationTransferInfo', {_id: this._id}, function (err, result) {
            if (result) {
                alertify.locationTransfer(fa('eye', 'Showing Transfer'), renderTemplate(transferInfo, result));
            }
            if (err) {
                console.log(err);
            }
        });
    }
});

transferInfo.helpers({
    capitalize(name){
        return _.capitalize(name);
    }
});
transferInfo.events({
    'click .printTransfer'(event, instance){
        $('#to-print').printThis();
    }
});

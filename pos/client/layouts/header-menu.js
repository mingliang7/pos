import './header-menu.html';
import {ReactiveVar} from 'meteor/reactive-var';
//collection
import {LocationTransfers} from '../../imports/api/collections/locationTransfer';
let indexTmpl = Template.Pos_headerMenu;
let playNotification = new buzz.sound('/notification-sounds/unique-notification.mp3');
indexTmpl.onCreated(function () {
    this.transferCount = new ReactiveVar();
    Meteor.call('countTransferLocation', Session.get('currentBranch'), (err, result)=> {
        if (result) {
            this.transferCount.set(result);
        }
    });
    this.autorun(function () {
        if (Session.get('currentBranch')) {
            let subscription = Meteor.subscribe('pos.activeLocationTransfers',
                {
                    toBranchId: Session.get('currentBranch'),
                    pending: true,
                    status: 'active'
                });

        }
    });
});

indexTmpl.helpers({
    count(){
        let collectionCount = LocationTransfers.find({toBranchId: Session.get('currentBranch'), pending: true}).count();
        let instance = Template.instance();
        let count = instance.transferCount.get();
        if (collectionCount > count) {
            playNotification.play();
        }
        return collectionCount;
    },
    transferRequest(){
        let locationTransfers = LocationTransfers.find({
            toBranchId: Session.get('currentBranch'),
            pending: true
        });
        return locationTransfers;
    }
});
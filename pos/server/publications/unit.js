import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Units} from '../../imports/api/collections/units.js';



// Reactive Table
ReactiveTable.publish("pos.reactiveTable.unit", Units);

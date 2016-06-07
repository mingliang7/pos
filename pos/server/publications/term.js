import {Meteor} from 'meteor/meteor';
import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {ReactiveTable} from 'meteor/aslagle:reactive-table';

// Collection
import {Terms} from '../../imports/api/collections/terms.js';



// Reactive Table
ReactiveTable.publish("pos.reactiveTable.term", Terms);

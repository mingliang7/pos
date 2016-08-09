import {Mongo} from 'meteor/mongo';


export const tmpCollection = new Mongo.Collection(null);
export const nullCollection = new Mongo.Collection(null);
export const balanceTmpCollection = new Mongo.Collection(null);
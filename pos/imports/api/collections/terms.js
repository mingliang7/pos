export const Terms = new Mongo.Collection('terms');
Terms.schema = new SimpleSchema({
  name:{
    type:String,
    label:"Name"
  },
  netDueIn:{
    type: Number
  },
  discountPercentages: {
    type: Number,
    decimal: true
  },
  discountIfPaidWithin: {
    type: Number
  }
});

Terms.attachSchema(Terms.schema);

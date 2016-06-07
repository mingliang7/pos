export const Terms = new Mongo.Collection('terms')
Terms.schema = new SimpleSchema({
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
})


Terms.attachSchema(Terms.schema);

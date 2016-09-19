import {Template} from  'meteor/templating';
import {TAPi18n} from 'meteor/tap:i18n';

// Chart js
import Chart from 'chart.js';

// Highcharts
import Highcharts from 'highcharts';
// Load module after Highcharts is loaded
require('highcharts/modules/exporting')(Highcharts);

// Method

// Page
import './home.html';

// Declare template
let indexTmpl = Template.Pos_home;

indexTmpl.onCreated(function () {
    this.isLoading = new ReactiveVar(true);
});

indexTmpl.onRendered(function () {
    this.autorun(()=> {
        Meteor.call('posChart', {} ,function(err,result){
                // let orders =[
                //     {name: 'Mon', y: 1900},
                //     {name: 'Tue', y: 1500},
                //     {name: 'Wed', y: 2200},
                //     {name: 'Thu', y: 1700},
                //     {name: 'Fri', y: 3000},
                //     {name: 'Sat', y: 2500}
                // ];

                let chartOpts = {
                    chart: {
                        type: 'column'
                    },
                    title: {
                        text: 'Monthly Invoice'
                    },
                    subtitle: {
                        text: `${result.company}`
                    },
                    xAxis: {
                        type: 'category'
                    },
                    yAxis: {
                        title: {
                            text: 'Amount'
                        }

                    },
                    legend: {
                        enabled: false
                    },
                    plotOptions: {
                        series: {
                            borderWidth: 0,
                            dataLabels: {
                                enabled: true,
                                format: '{point.y:.2f}$'
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                        pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}$</b><br/>'
                    },

                    series: [{
                        name: 'AMOUNT',
                        colorByPoint: true,
                        data: result.invoices
                    }],
                };

                this.$('#container').highcharts(chartOpts);

                // Stop loading
                this.isLoading.set(false);


        });
    });


    // var ctx = document.getElementById("myChart");
    // var myChart = new Chart(ctx, {
    //     type: 'bar',
    //     data: {
    //         labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
    //         datasets: [{
    //             label: '# of Votes',
    //             data: [12, 19, 3, 5, 2, 3],
    //             backgroundColor: [
    //                 'rgba(255, 99, 132, 0.2)',
    //                 'rgba(54, 162, 235, 0.2)',
    //                 'rgba(255, 206, 86, 0.2)',
    //                 'rgba(75, 192, 192, 0.2)',
    //                 'rgba(153, 102, 255, 0.2)',
    //                 'rgba(255, 159, 64, 0.2)'
    //             ],
    //             borderColor: [
    //                 'rgba(255,99,132,1)',
    //                 'rgba(54, 162, 235, 1)',
    //                 'rgba(255, 206, 86, 1)',
    //                 'rgba(75, 192, 192, 1)',
    //                 'rgba(153, 102, 255, 1)',
    //                 'rgba(255, 159, 64, 1)'
    //             ],
    //             borderWidth: 1
    //         }]
    //     },
    //     options: {
    //         scales: {
    //             yAxes: [{
    //                 ticks: {
    //                     beginAtZero:true
    //                 }
    //             }]
    //         }
    //     }
    // });
});

indexTmpl.helpers({
    isLoading(){
        return Template.instance().isLoading.get();
    }
});

indexTmpl.events({

});

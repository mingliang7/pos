import './martLayout.html';


let tmplLayout = Template.MartLayout;

tmplLayout.onRendered(function(){
    console.log('this is on rendered')
     $(window).keydown(function(e){
         console.log(e.keyCode)
        if(e.altKey && e.keyCode == 65){
          FlowRouter.query.set({k: 'barcode'}); 
        }
        if(e.altKey && e.keyCode == 83){
            FlowRouter.query.set({k: 'search'});
        }
    });
});
  var act_scr1;
 var act_scr2;
 var r1;
 var r2;
       function update_ratings(r1,r2,winner)
        {

 	var exp_scr1=Math.pow(10,(r1/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
 	var exp_scr2=Math.pow(10,(r2/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
        if (winner=1)
        { act_scr1=1;
          act_scr2=0;}
        else if (winner=2)
        {  act_scr=0;
            act_scr2=1; }
        else 
        { act_scr1=act_scr2=0.5}
        
 	r1=r1+32*(act_scr1-exp_scr1);
 	r2=r2+32*(act_scr2-exp_scr2);
        var ratings=[r1,r2];
        return ratings;
 	}
function display_rates(){
  var rating_array = update_ratings(1000,2000,1);
document.writeln("new score of player1 = "+rating_array[0]);
document.writeln("<br></br>");
document.writeln("new score of player2 = "+rating_array[1]);

}

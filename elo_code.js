 var act_scr1=1;
 var act_scr2=0;
 var r1=1000;
 var r2=2000;

 	var exp_scr1=Math.pow(10,(r1/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
 	var exp_scr2=Math.pow(10,(r2/400))/(Math.pow(10,(r1/400))+Math.pow(10,(r2/400)));
 	r1=r1+32*(act_scr1-exp_scr1);
 	r2=r2+32*(act_scr2-exp_scr2);
 	
function display_rates(){
document.writeln("new score of player1 = "+r1);
document.writeln("<br></br>");
document.writeln("new score of player2 = "+r2);

}
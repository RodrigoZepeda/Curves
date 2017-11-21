var margin = {top: 10, right: 10, bottom: 10, left: 10}, //See https://bl.ocks.org/mbostock/3019563
padding = {top: 30, right: 30, bottom: 60, left: 60},
maxwindow = Math.max(Math.min(document.getElementById("myfigure").clientWidth, document.getElementById("myfigure").clientHeight), 600);
outerHeight  = maxwindow,
outerWidth   = maxwindow,
innerWidth   = outerWidth - margin.left - margin.right,
innerHeight  = outerHeight - margin.top - margin.bottom,
width        = innerWidth - padding.left - padding.right,
height       = innerHeight - padding.top - padding.bottom,
transit = {};
rini_load = 50;
rout_load = 150;
d_load = rini_load;
stop    = false;
var Xscale, Yscale, axisX, axisY, moving_point, moving_circle, moving_center, inner_center, inner_circle, connector, pointsize, x1, x2, y1, y2, scaler;
y1 = 0;
y2 = 0;
var epsilon = 1.e-16;


window.onload = function(){ 

    //From https://stackoverflow.com/questions/4777077/removing-elements-by-class-name
    function removeElementsByClass(className){
        var elements = document.getElementsByClassName(className);
        while(elements.length > 0){
            elements[0].parentNode.removeChild(elements[0]);
        }
    }
    
    //From https://stackoverflow.com/questions/4652468/is-there-a-javascript-function-that-reduces-a-fraction
    // Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
    function reduce(numerator,denominator){
        var gcd = function gcd(a,b){
        return b ? gcd(b, a%b) : a;
        };
        gcd = gcd(numerator,denominator);
        return [numerator/gcd, denominator/gcd];
    }

    var line = d3.line()
    .x(function(d){ return Xscale(d.x); })
    .y(function(d){ return Yscale(d.y); });

    //Get inputed variables
    checkvals();

    function addSvg(id){
        
        // Create svg margins
        var outer = d3.select('#' + id).append('svg')
        .attr('width', outerWidth)
        .attr('height', outerHeight);
    
        var inner = outer.append("g")
        .attr("transform", "translate(" + padding.left + "," + padding.top + ")");

        return {inner: inner, outer: outer};
    };
    
    function inputing(rout_id, rin_id, speed_id, d_id, npoints_id, pause_id, btn_class, restart_id){

         //Update speed
        document.getElementById(speed_id).onchange = function() {
            speed = Number(document.getElementById(speed_id).value);
        };

        //Update number of points
        document.getElementById(rout_id).onchange = function() {
            restartcycle();
        };

        document.getElementById(rout_id).onclick = function(){
            document.getElementById(pause_id).className = btn_class;
        };
    
        //Update number of points
        document.getElementById(d_id).onchange = function() {
            restartcycle();
        };

        //Update number of points
        document.getElementById(rin_id).onchange = function() {
            restartcycle();
        };

        document.getElementById(rin_id).onclick = function(){
            document.getElementById(pause_id).className = btn_class;
        };
    
        //Update number of points
        document.getElementById(npoints_id).onchange = function() {
            restartcycle();
        };

        document.getElementById(npoints_id).onclick = function(){
            document.getElementById(pause_id).className = btn_class;
        };

        //Update distance from second circle
        document.getElementById(d_id).onchange = function() {
            restartcycle();
        };

        //Restart
        document.getElementById(restart_id).onclick = function(){
            restartcycle();
        };
    };
   
    function hiding(axis_id, pointer_id, circ1_id, circ2_id){

        document.getElementById(axis_id).onchange = function() {
            if (document.getElementById(axis_id).checked){
                axisshow (1);
            } else {
                axisshow (0)
            }
        };

        document.getElementById(pointer_id).onchange = function() {
            if (document.getElementById(pointer_id).checked){
                pointershow(1);
            } else {
                pointershow(0);
            }
        };

        document.getElementById(circ1_id).onchange = function() {
            if (document.getElementById(circ1_id).checked){
                innershow(1);
            } else {
                innershow(0);
            }
        };

        document.getElementById(circ2_id).onchange = function() {
            if (document.getElementById(circ2_id).checked){
            outershow(1);
            } else {
            outershow(0);
            }
        };
    };
    
    function innershow (k){
        d3.select(".innercircle").style("opacity", k);
        d3.select(".centerout").style("opacity", k);
        d3.select(".rotationaxis").style("opacity", Number(d3.select(".outercircle").style("opacity"))*Number(d3.select(".innercircle").style("opacity")));
    };

    function outershow (k){
        d3.select(".outercircle").style("opacity", k);
        d3.select(".centerin").style("opacity", k);
        d3.select(".connector").style("opacity", Number(d3.select(".outercircle").style("opacity"))*Number(d3.select(".orbitcircle").style("opacity")));
        d3.select(".rotationaxis").style("opacity", Number(d3.select(".outercircle").style("opacity"))*Number(d3.select(".innercircle").style("opacity")));
    };

    function pointershow (k){
        d3.select(".orbitcircle").style("opacity", k);
        d3.select(".connector").style("opacity", Number(d3.select(".outercircle").style("opacity"))*Number(d3.select(".orbitcircle").style("opacity")));
    };

    function axisshow (k){
        d3.select("#xaxis").style("opacity", k);
        d3.select("#yaxis").style("opacity", k);
    };

    function getdomain(rin, rout){
        if (rin > 0 && rout > 0){
            domain = rout + 2*rin + d;
        } else if (rin < 0 && rout > 0 ){
            domain = rout + rin + d;
        } else if (rin < 0 && rout < 0){
            domain = rout + rin + d;
        } else {
            domain = rout + rin + d;
        }

        return domain;
    }
  
    function pausebutton (pauseref, inner){
        document.getElementById(pauseref).onclick = function(){
            stop = !stop;
            if (!stop){
                document.getElementById(pauseref).textContent = "Pause";
                transit = mytransition(transit.i, transit.x, transit.y, inner, transit.x, transit.y, true);
            } else {
                document.getElementById(pauseref).textContent = "Play";
            }
        };
    }
   
    function checkvals(){

        if (rout != Number(document.getElementById("rout").value)){
            rout  = Number(document.getElementById("rout").value);
        };
        
        if (rin != Number(document.getElementById("rin").value)){
            rin   = Number(document.getElementById("rin").value);
        };

        if (d != Number(document.getElementById("d").value)){
            d   = Number(document.getElementById("d").value);
        };
        
        if (npoints != Number(document.getElementById("npoints").value)){
            npoints = Number(document.getElementById("npoints").value);
        };

        if (speed != Number(document.getElementById("speed").value)){
            speed   = Number(document.getElementById("speed").value);
        };

        if (rin == 0 || rout == 0){
            alert("Cannot handle 0 radii. Restoring default.");
            rin  = rini_load;
            document.getElementById("rin").value = rini_load;
            rout = rout_load;
            document.getElementById("rin").value = rout_load;
        };

        //Update starting points
        x1 = rout + rin;
        x2 = (rout + rin) - d;
        
        px1 = rin;

        //Update function domain
        domain = 2*Math.max(Math.abs(rout),Math.abs(rin)) + Math.min(Math.abs(rout), Math.abs(rin)) + Math.abs(d);
        
        //Update point sizes
        scaler = 0.5*width/domain;
        if (rout != rin){
            pointsize = 0.2*width*Math.min(Math.min(Math.abs(rin),Math.abs(rout)), Math.abs(x1))/domain
        } else {
            pointsize = 20;
        };
    };

    function restartcycle (){

        //Check options
        checkvals();

        stop = true;
        window.setTimeout(function() { 

            //Delete previous path
            removeElementsByClass("orbit")
            
            //Axis update
            Xscale.domain([-domain, domain]);
            Yscale.domain([-domain, domain]);

            axisX.call(d3.axisBottom(Xscale));
            axisY.call(d3.axisLeft(Yscale));

            connector.transition()
            .attr("d", line([{x: x1, y: y1}, {x: x2, y: y2}]))

            rotationaxis.transition()
            .attr("d", line([{x: x1, y: y1}, {x: 0, y: 0}]))

            moving_circle.transition()
                .attr("r", scaler*Math.abs(rin))
                .attr("cx", Xscale(x1))
                .attr("cy", Yscale(y1));  
            
            moving_center.transition()
                .attr("r", pointsize)
                .attr("cx", Xscale(x1))
                .attr("cy", Yscale(y1)); 

            moving_point.transition()
                .attr("r",  pointsize)
                .attr("cx", Xscale(x2))
                .attr("cy", Yscale(y2));                  
                
            inner_center.transition()    
                .attr("r",  pointsize)
                .attr("cx",Xscale(0))
                .attr("cy",Yscale(0));
            
            inner_circle.transition()
                .attr("r", scaler*Math.abs(rout))
                .attr("cx",Xscale(0))
                .attr("cy",Yscale(0));

            transit = {i: 0, x: x2, y: y2};  
            
            document.getElementById("pause").textContent = "Play";
            document.getElementById("pause").className = "btn btn-primary btn-sm";

            document.getElementById("outerhide").checked = true;
            document.getElementById("innerhide").checked = true;
            document.getElementById("axishide").checked = true;
            document.getElementById("pointerhide").checked = true;

            outershow(1);
            innershow(1);
            pointershow(1);
            axisshow(1);

        }, 1.5*speed);
    }


   function getAxis(inner){

        //X.axis
        Xscale = d3.scaleLinear()
        .domain([-domain, domain])
        .range([0, width]);
            
        axisX  = inner.append("g")
            .attr("transform", "translate(" + 0 + "," + height/2 + ")")
            .attr("id","xaxis")
            .call(d3.axisBottom(Xscale));               

        //Y-axis
        Yscale = d3.scaleLinear()
            .domain([-domain, domain])
            .range([height, 0]);
            
        axisY = inner.append("g")
            .attr("transform", "translate(" + width/2 + "," + 0 + ")")
            .attr("id","yaxis")
            .call(d3.axisLeft(Yscale)); 
   };

   function addElements(inner){
        
        inner_center = inner.append("circle")
        .attr("r", pointsize)
        .attr("class","centerout")
        .attr("cx", Xscale(0))
        .attr("cy", Yscale(0));

        inner_circle = inner.append("circle")
        .attr("r", scaler*Math.abs(rout)) 
        .attr("class","innercircle")
        .attr("cx",Xscale(0))
        .attr("cy",Yscale(0));

        connector = inner.append("path")
        .attr("d", line([{x: Math.abs(x1), y: y1}, {x: x2, y: y2}]))
        .attr("class","connector");

        rotationaxis = inner.append("path")
        .attr("d", line([{x: Math.abs(x1), y: y1}, {x: x2, y: y2}]))
        .attr("class","rotationaxis");

        moving_circle = inner.append("circle")
            .attr("r", scaler*Math.abs(rin))
            .attr("class","outercircle")
            .attr("cx", Xscale(Math.abs(x1)))
            .attr("cy", Yscale(y1));

        moving_point = inner.append("circle")
            .attr("r", pointsize)
            .attr("class","orbitcircle")
            .attr("cx", Xscale(x2))
            .attr("cy", Yscale(y2));        

        moving_center = inner.append("circle")
            .attr("r", pointsize)
            .attr("class","centerin")
            .attr("cx", Xscale(Math.abs(x1)))
            .attr("cy", Yscale(y1));

   };

   function start(rini_load, rout_load, d_load){
        var svgchar = addSvg("myfigure")
        document.getElementById("rin").value = rini_load;
        document.getElementById("rout").value = rout_load;
        document.getElementById("d").value = d_load;
        inputing("rout","rin","speed","d","npoints","pause", "btn btn-primary btn-sm disabled", "restart");
        hiding("axishide","pointerhide","innerhide","outerhide");
        getAxis(svgchar.inner);
        addElements(svgchar.inner);
        pausebutton("pause", svgchar.inner);
        transit = mytransition(0, x2, y2, svgchar.inner, x2, y2, true);
   };
   
   start(rini_load, rout_load, d_load);

    function mytransition(i, xpast, ypast, inner, initialx, initialy, flag) {
        var x, y, xpast, ypast, r, k, j, reduc, xcirc, ycirc, alpha;
        alpha = i*(2*Math.PI)/npoints;
        r     = rout + rin;
        reduc = reduce(rout, rin);
        k     = Math.max(reduc[0], reduc[1]);
        xcirc = r*Math.cos(alpha);
        ycirc = r*Math.sin(alpha);
        x     = xcirc - d*Math.cos((rout/rin + 1)*(alpha));
        y     = ycirc - d*Math.sin((rout/rin + 1)*(alpha));
        
        //Stop drawing if returned to origin
        if (flag){
            inner.append("path")
                .data([[[Xscale(xpast), Yscale(ypast)], [Xscale(x),Yscale(y)]]])
                .attr("d", d3.line().curve(d3.curveCardinal))
                .attr("class", "orbit")
        };

        //Change flag
        if (flag && (Math.abs(initialx - x) < epsilon) && (Math.abs(initialy - y) < epsilon) && (i > npoints)){
            flag = false;  
            console.log("stopped");  
            console.log("initialx =" + initialx);  
            console.log("initialy =" + initialy);  
            console.log("x =" + x);  
            console.log("y =" + y); 
            i = 0;
        }
        
        //console.log("i = " + i);  
        rotationaxis.transition()
            .duration(speed)
            .ease(d3.easeLinear)
            .attr("d", line([{x: xcirc, y: ycirc}, {x: 0, y: 0}]))

        connector.transition()
            .duration(speed)
            .ease(d3.easeLinear)
            .attr("d", line([{x: xcirc, y: ycirc}, {x: x, y: y}]))
           

        moving_circle.transition()
            .duration(speed)
            .ease(d3.easeLinear)
            .attr("cx", Xscale(xcirc))
            .attr("cy", Yscale(ycirc));  

        moving_point.transition()
            .duration(speed)
            .ease(d3.easeLinear)
            .attr("cx", Xscale(x))
            .attr("cy", Yscale(y));

        moving_center.transition()
            .duration(speed)
            .ease(d3.easeLinear)
            .attr("cx", Xscale(xcirc))
            .attr("cy", Yscale(ycirc));   
        

        if (!stop){
            window.setTimeout(function() {  transit = mytransition(i + 1, x, y, inner, initialx, initialy, flag) }, speed);
        } else {
            return {i: i, x: x, y: y};
        };            
    };
};
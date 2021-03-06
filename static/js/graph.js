queue()
        .defer(d3.csv, "data/clinics.csv")
        .await(makeGraphs);



//*************************************************************************************************
// Crossfilter Function   
function makeGraphs(error, clinicData) {
        // create our crossfilter dimensions
        var ndx = crossfilter(clinicData);
        
        


        clinicData.forEach(function (d) {
                
                d.time = +d.aveWaitingTime;
                d.routine = +d.routineAppointments;
                d.urgent = +d.urgentAppointments;
                d.doctors = parseInt(+d['staff/doctors']);
                d.nurses = parseInt(+d['staff/nurses']);
                d.councillors = parseInt(+d['staff/councillors']);
                d.consultants = parseInt(+d['staff/consultants']);
                
                
                
                
        });

// show our chart objects
        show_facility_type_selector(ndx);
        show_facility_name_selector(ndx);
        show_urgent_pie_type(ndx);
        show_routine_pie_type(ndx);        
        show_number_staff(ndx);
        show_average_waiting_time(ndx);
        show_urgentAppointments_number(ndx);
        show_routineAppointments_number(ndx);
        
        

        console.log(clinicData);
        dc.renderAll();


}
//*************************************************************************************************
// Medical facility selector switch (shows number of facilities in the dropdown)
function show_facility_type_selector(ndx) {


        dim = ndx.dimension(dc.pluck('type'));
        group = dim.group()
        dc.selectMenu("#service_type_selector")
                .dimension(dim)
                .group(group)
                .promptText('All Sites');
                
}
//*************************************************************************************************
// Medical facility name selector switch (shows specific facility in the dropdown)

function show_facility_name_selector(ndx) {
        dim = ndx.dimension(dc.pluck('name'));
        group = dim.group()
        dc.selectMenu("#facility_name_selector")
                .dimension(dim)
                .group(group)
                .promptText('Site Names');
}
//*************************************************************************************************
//Total routine appointments
function show_routineAppointments_number(ndx){
        var routineDim = ndx.dimension(dc.pluck('select_all'));

        var totalRoutineAppointments = routineDim.group().reduceSum(dc.pluck('routine'));      
       
        dc.numberDisplay("#routine_appointments")
                .formatNumber(d3.format(",f"))
                .group(totalRoutineAppointments);
                
}
//*************************************************************************************************
//Total urgent appointments
function show_urgentAppointments_number(ndx){
        var urgentDim = ndx.dimension(dc.pluck('select_all'));

        var totalUrgentAppointments = urgentDim.group().reduceSum(dc.pluck('urgent'));      
       
        dc.numberDisplay("#urgent_appointments")
                .formatNumber(d3.format(",f"))
                .group(totalUrgentAppointments);
                

}

//*************************************************************************************************
// Count of all the urgent appointments at facilities in a pie-chart 

function show_urgent_pie_type(ndx) {
        var urgentDim = ndx.dimension(dc.pluck('type'));

        var totalUrgentAppointments = urgentDim.group().reduceSum(dc.pluck('urgent'));
        dc.pieChart("#urgent_type_pie")
                .height(180)
                .radius(100)
                .dimension(urgentDim)
                .group(totalUrgentAppointments)
                .transitionDuration(1500)
                .innerRadius(20);                            
                

}
//*************************************************************************************************
// Count of all the routine appointments at facilities in a pie-chart 

function show_routine_pie_type(ndx) {
        var routineDim = ndx.dimension(dc.pluck('type'));

        var totalRoutineAppointments = routineDim.group().reduceSum(dc.pluck('routine')); 
        dc.pieChart("#routine_type_pie")
                .height(180)
                .radius(100)
                .dimension(routineDim)
                .group(totalRoutineAppointments)
                .transitionDuration(1500)
                .innerRadius(20);                
                

}
//*************************************************************************************************
// Number of staff per facility 
function show_number_staff(ndx) {

        var doctors_dim = ndx.dimension(dc.pluck('type'));
        var nurses_dim = ndx.dimension(dc.pluck('type'));
        var counsellors_dim = ndx.dimension(dc.pluck('type'));
        var consultants_dim = ndx.dimension(dc.pluck('type'));


        var number_of_doctors = doctors_dim.group().reduceSum(dc.pluck('doctors'));
        var number_of_nurses = nurses_dim.group().reduceSum(dc.pluck('nurses'));
        var number_of_counsellors = counsellors_dim.group().reduceSum(dc.pluck('councillors'));
        var number_of_consultants = consultants_dim.group().reduceSum(dc.pluck('consultants'));

        var stackedChart = dc.barChart("#staff_numbers");
        stackedChart
                .width(540)
                .height(250)
                .margins({
                        top: 10,
                        right: 50,
                        bottom: 30,
                        left: 50
                })
                .dimension(doctors_dim)
                .group(number_of_doctors, "Doctors")
                .stack(number_of_nurses, "Nurses")
                .stack(number_of_counsellors, "Councillors")
                .stack(number_of_consultants, "Consultants")
                .transitionDuration(500)
                .renderLabel(true)
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .legend(dc.legend().x(445).y(0).itemHeight(15).gap(5))
                .margins({
                        top: 10,
                        right: 100,
                        bottom: 30,
                        left: 30
                })
                .elasticY(true)
                .elasticX(true)
                .xAxisLabel("Facility")
                .yAxisLabel("Staff")
                .yAxis().ticks(10);

}
//*************************************************************************************************
// Patient waiting time
function show_average_waiting_time(ndx) {


        var waitingTimeDim = ndx.dimension(dc.pluck('type'));
        var averageWaitingTimeByClinic = waitingTimeDim.group().reduce(add_item, remove_item, initialise);

        function add_item(p, v) {
                p.count++;
                p.total += v.time;
                p.average = p.total / p.count;
                return p;
        }

        function remove_item(p, v) {
                p.count--;
                if (p.count == 0) {
                        p.total = 0;
                        p.average = 0;
                } else {
                        p.total -= v.time;
                        p.average = p.total / p.count;
                }
                return p;
        }

        function initialise() {
                return {
                        count: 0,
                        total: 0,
                        average: 0
                };
        }
        

        dc.barChart("#ave_waiting_times")
                .width(480)
                .height(250)
                .margins({
                        top: 10,
                        right: 50,
                        bottom: 30,
                        left: 50
                })
                .dimension(waitingTimeDim)
                .group(averageWaitingTimeByClinic, 'Ave Waiting Time')
                .valueAccessor(function (d) {
                        return d.value.average;
                })
                .transitionDuration(500)
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .elasticY(true)
                .elasticX(true)
                .xAxisLabel("Facility")
                .yAxisLabel("Minutes")
                .yAxis().ticks();
}

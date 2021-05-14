<h2>Specialization</h2>

<div class="row mB24">
	<div class="col-xs-12 col-sm-6">
		 <div id="canvas-holder">
				<canvas id="chart-area" width="260" height="260"></canvas>
		</div>
	</div>
	<div class="col-xs-12 col-sm-6">
         <ul class="chart-legend">
            <li><label id="auto-repair"></label>
				<p>Auto repair</p>
            </li>
            <li><label id="restoration"></label>
				<p>Restoration Jobs</p>
            </li>
            <li><label id="auto-body"></label>
				<p>Auto body</p>
            </li>
            <li><label id="roadside"></label>
				<p>Roadside assistance</p>
            </li>
       </ul>
   </div>
</div>			

<script type="text/javascript">
    var pieData = [
        {
            value: 300,
            color:"#edc240",
            highlight: "#FF5A5E",
            label: "Auto Repair"
        },
        {
            value: 50,
            color: "#4da74d",
            highlight: "#5AD3D1",
            label: "Auto Body"
        },
        {
            value: 100,
            color: "#129ff3",
            highlight: "#FFC870",
            label: "Roadside assistance"
        },
        {
            value: 120,
            color: "#cb4b4b",
            highlight: "#616774",
            label: "Restoration Jobs"
        }

    ];

    window.onload = function(){
        var ctx = document.getElementById("chart-area").getContext("2d");
        window.myPie = new Chart(ctx).Pie(pieData);
    };

</script>
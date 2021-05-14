<?php include("header.php"); ?>

<div class="container">

	<div class="row">

		<div class="col-xs-12 col-sm-3">
			<?php include("menu-left.php"); ?>

				<div class="row">
					<div class="col-super-x-12">
						<?php include("calendar.php"); ?>

						<!-- Only else id for stars(Good W3C). Right id file online-costumers.php -->
						<?php include("online-customers-left.php"); ?>
					</div>
				</div>
		</div>

		<div class="col-xs-12 col-super-x-9 col-sm-6">


			<div class="row">
				<div class="col-xs-12">
					<h2>Disputes</h2>

<div class="table-responsive">
<table class="table table-striped">
		<thead>
			<tr>
				<th>Date</th>
				<th>Project</th>
				<th>Mechanic</th>
				<th>Amount</th>
				<th>Status</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>07/10/2015</td>
				<td>2000 Ford Escrot<br />Transmission</td>
				<td><div class="h4-in-table">Richard Hartzell</div></td>
				<td>$1000</td>
				<td>Resolved</td>
			</tr>
			<tr>
				<td>07/05/2015</td>
				<td>2002 Ford focus<br />Transmission</td>
				<td><div class="h4-in-table">Angelina Jole</div></td>
				<td>$2000</td>
				<td>Mechfinder Response Pending</td>
			</tr>
			<tr>
				<td>07/01/2015</td>
				<td>BMW M3<br />Transmission</td>
				<td><div class="h4-in-table">Bratt Pitt</div></td>
				<td>$1000</td>
				<td>Mechanic Response Pending</td>
			</tr>
			<tr>
				<td>07/10/2015</td>
				<td>2000 Ford Escrot<br />Transmission</td>
				<td><div class="h4-in-table">Richard Hartzell</div></td>
				<td>$1000</td>
				<td>Customer Response Pending</td>
			</tr>
		</tbody>
</table>
</div>

				</div>
			</div>



		</div>

		<div class="col-xs-12 col-super-x-0 col-sm-3">
			<?php include("calendar.php"); ?>

			<?php include("online-customers.php"); ?>
		</div>

	</div>

</div>

<?php include("footer.php"); ?>

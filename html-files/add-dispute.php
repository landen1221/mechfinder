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
	
			<h2>New Dispute</h2>
			
				<div class="post-a-project-form">
				
				
					<div><label>Select project to dispute</label><select name="#">
								<option >BMW M3 Transmission</option>
								<option >Ford Escrot Transmission</option>
								<option >Establishment car alarm</option>
								<option >Oil change</option>
								</select>
					</div>
					
					<div><label>Select user</label><select name="#">
								<option >Brat Pitt</option>
								<option >Angelina Jolie</option>
								<option >John Carter</option>
								<option >Mel Gibson</option>
								</select>
					</div>					
				
				</div>
				
	
<div class="table-dispute">	
						<label>Select the milestone(s) you wish to dispute:</label>
				
					
<div class="table-responsive">
					<table class="table table-striped">
							<tbody>
								<tr>
									<td><input type="checkbox" name="#" /></td>
									<td>&#x24;900,00</td>
									<td>phase 2 (USD) (Partial Realase 2) (USD)</td>
								</tr>
								<tr>
									<td><input type="checkbox" name="#" /></td>
									<td>&#x24;1,500,00</td>
									<td>phase 2 (USD)</td>
								</tr>
								<tr>
									<td><strong>Total</strong></td>
									<td><strong>&#x24;2,400,00</strong></td>
									<td></td>
								</tr>
							</tbody>
					</table>	
</div>						
		
</div>		
		

<div class="dispute-textarea">		
	<label>Describe the reason for yout dispute in detail:</label>
	<textarea></textarea>
</div>						
						
<div class="dispute-add-file">						
		<label>You may attach documentation to support your case:</label>
			<button class="btn btn-success">
				Add Files
			</button>
</div>						
				
				
<div class="final-dispute">				
		<label>Total amount in dispute: &#x24;900 USD</label>
						
		<strong>Offer the amount you are prepared to accept:</strong><br />
		<strong style="font-size: 20px;">&#x24;</strong> <input type="text" name="#" /> Please enter an amount between &#x24;0.01 and &#x24;900.<br /><br />
						
		You may Decrease your offer in the future but you may not raise it.<br /><br />
						
		<button class="btn btn-success">
				Create new Dispute
		</button>
</div>			
				
				 
		</div>
		
		<div class="col-xs-12 col-super-x-0 col-sm-3">
			<?php include("calendar.php"); ?>
			
			<?php include("online-customers.php"); ?>
		</div>
		
	</div>

</div>

<?php include("footer.php"); ?>

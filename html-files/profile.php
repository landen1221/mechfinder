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
				
<ul class="nav projects-tabs" role="tablist">
    <li role="presentation"><a href="#mechanic-Info" aria-controls="mechanic-Info" role="tab" data-toggle="tab">Mechanic Info</a></li>
    <li role="presentation" class="active"><a href="#basic-info" aria-controls="basic-info" role="tab" data-toggle="tab">Basic Info</a></li>
	<li role="presentation"><a href="#payment-methods" aria-controls="payment-methods" role="tab" data-toggle="tab">Payment Methods</a></li>
	<li role="presentation"><a href="#withdraw-funds" aria-controls="withdraw-funds" role="tab" data-toggle="tab">Withdraw Funds</a></li>
	<li role="presentation"><a href="#my-transactions" aria-controls="my-transactions" role="tab" data-toggle="tab">My Transactions</a></li>
	<li role="presentation"><a href="#photo-album" aria-controls="photo-album" role="tab" data-toggle="tab">Photo Album</a></li>
</ul>		
				
				
<div class="tab-content">
    <div role="tabpanel" class="tab-pane" id="mechanic-Info">				
					<?php include("mechanic-Info.php"); ?>
	</div>	
	<div role="tabpanel" class="tab-pane active" id="basic-info">	
					<?php include("basic-info.php"); ?>
	</div>
	<div role="tabpanel" class="tab-pane" id="payment-methods">	
					<?php include("payment-methods.php"); ?>
	</div>
	<div role="tabpanel" class="tab-pane" id="withdraw-funds">	
					<?php include("withdraw-funds.php"); ?>
	</div>
	<div role="tabpanel" class="tab-pane" id="my-transactions">		
					<?php include("my-transactions.php"); ?>
	</div>
	<div role="tabpanel" class="tab-pane" id="photo-album">
					<?php include("photo-album.php"); ?>
	</div>
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

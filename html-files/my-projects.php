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
			<div class="col-xs-12 col-sm-6">
				<h1 class="h1-my-projects">My Projects</h1>
			</div>	
				
			<div class="col-xs-12 col-sm-6">
				<ul class="nav nav-myprojects" role="tablist">				
					<li role="presentation" class="active"><a href="#your-bids" aria-controls="your-bids" role="tab" data-toggle="tab">Your Bids</a></li>
					<li role="presentation"><a href="#looking-to-hire" aria-controls="looking-to-hire" role="tab" data-toggle="tab">Looking To Hire</a></li>
				</ul>
			</div>			
		</div>

		
		
		<div class="row">
				<div class="col-xs-12">
<div class="tab-content">	
<div role="tabpanel" class="tab-pane active" id="your-bids">		
				
<ul class="nav projects-tabs" role="tablist">
    <li role="presentation" class="active"><a href="#open-projects" aria-controls="open-projects" role="tab" data-toggle="tab">Open Projects <span>5</span></a></li>
    <li role="presentation"><a href="#assigned-projects" aria-controls="assigned-projects" role="tab" data-toggle="tab">Assigned Projects</a></li>
	<li role="presentation"><a href="#finished-projects" aria-controls="finished-projects" role="tab" data-toggle="tab">Finished Projects<span>1</span></a></li>
	<li role="presentation"><a href="#canceled-rojects" aria-controls="canceled-rojects" role="tab" data-toggle="tab">Canceled Projects</a></li>
</ul>					
			
<div class="tab-content">
    <div role="tabpanel" class="tab-pane active" id="open-projects">
		<?php include("open-projects.php"); ?>
	</div>
    <div role="tabpanel" class="tab-pane" id="assigned-projects">
		<?php include("assigned-projects.php"); ?>
	</div>
	<div role="tabpanel" class="tab-pane" id="finished-projects">
		<?php include("finished-projects.php"); ?>
	</div>
	<div role="tabpanel" class="tab-pane" id="canceled-rojects">
		<?php include("canceled-projects.php"); ?>
	</div>
</div>			

</div>
<div role="tabpanel" class="tab-pane" id="looking-to-hire">

<ul class="nav projects-tabs" role="tablist">
    <li role="presentation" class="active"><a href="#looking-open-projects" aria-controls="looking-open-projects" role="tab" data-toggle="tab">Open Projects<span>2</span></a></li>
    <li role="presentation"><a href="#looking-assigned-projects" aria-controls="looking-assigned-projects" role="tab" data-toggle="tab">Assigned Projects</a></li>
	<li role="presentation"><a href="#looking-finished-projects" aria-controls="looking-finished-projects" role="tab" data-toggle="tab">Finished Projects</a></li>
	<li role="presentation"><a href="#looking-canceled-projects" aria-controls="looking-canceled-projects" role="tab" data-toggle="tab">Canceled Projects</a></li>
</ul>

<div class="tab-content">
    <div role="tabpanel" class="tab-pane active" id="looking-open-projects">
		<?php include("looking-open-projects.php"); ?>
	</div>
    <div role="tabpanel" class="tab-pane" id="looking-assigned-projects">
		<?php include("looking-assigned-projects.php"); ?>
	</div>
	<div role="tabpanel" class="tab-pane" id="looking-finished-projects">
		<?php include("looking-finished-projects.php"); ?>
	</div>
	<div role="tabpanel" class="tab-pane" id="looking-canceled-projects">
		<?php include("looking-canceled-projects.php"); ?>
	</div>
</div>	
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

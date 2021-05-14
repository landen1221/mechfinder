<?php include("header.php"); ?>

<div class="container">

	<div class="row">
		
		<div class="col-xs-12">

			<div class="row">
			
				<div class="col-xs-12">
					<div class="info-page-content"><h1>Mechanic Profile</h1></div>
				</div>
				
			
				<div class="col-xs-12">
					<div class="row mB24 mobileMB0">
						<div class="col-xs-12 col-sm-5 col-md-4">
							
							<div class="customer-profile-new">
								<div class="row">
									<div class="col-xs-5">
										<img class="img-profile" src="http://lorempixel.com/130/130/" alt="" />
									</div>
									<div class="col-xs-7">
										<div class="user-profile-stars">
											<form action="#">
												<label class="star-counter"> 24</label>
												<input class="star star-5" id="star-251" type="radio" name="star">
												<label class="star star-5" for="star-251"></label>
												<input class="star star-4" id="star-241" type="radio" name="star">
												<label class="star star-4" for="star-241"></label>
												<input class="star star-3" id="star-231" type="radio" name="star">
												<label class="star star-3" for="star-231"></label>
												<input class="star star-2" id="star-221" type="radio" name="star">
												<label class="star star-2" for="star-221"></label>
												<input class="star star-1" id="star-211" type="radio" name="star">
												<label class="star star-1" for="star-211"></label>
											</form>
										</div>
										
										
										<h3>John Carter</h3>
										<p id="customer-location">Apple Valley, NY</p>
										
										<div class="contact-profile">
											<button class="chat">CHAT</button>
											<a class="msg" href="#"><img src="images/message.png" alt="" /></a>
											<a class="user1" href="#"><img src="images/friends.png" alt="" /></a>
										</div>
									</div>
								</div>
							</div>	
											
						</div>
						
						<div class="col-xs-12 col-sm-7 col-md-8">
						
							<div class="row user-details">
								<div class="col-xs-12 col-md-6">
								<p><strong>Company Name:</strong> John Carter</p>
								</div>
								
								<div class="col-xs-12 col-md-6">
									<p><strong>Years in Business:</strong> 5</p>
								</div>
								
								<div class="col-xs-12 col-md-6">
									<p><strong>Phone Number:</strong><button class="reveal">Reveal For $9.95</button></p>
								</div>

								<div class="col-xs-12 col-md-6">
									<p><strong>Location:</strong>Mineapolis, MN 55401</p>
								</div>
								
								<div class="col-xs-12 col-md-6">
									<p><strong>Education/Certification:</strong> ACE Master Mechanic</p>
								</div>
								
								<div class="col-xs-12 col-sm-6 col-md-3">
									<p><strong>Graduated:</strong> 2008</p>
								</div>
								
								<div class="col-xs-12 col-sm-6 col-md-3">
									<p><strong>From:</strong> Penn Foster</p>
								</div>
													
							</div> 
							
						</div>
						
						<div class="col-xs-12">
							<div class="row user-details2">
								<div class="col-xs-12 col-sm-5 col-md-4">
									<?php include("hours-of-operation.php"); ?>
								</div>
								
								<div class="col-xs-12 col-sm-7 col-md-8">

										<h2>Mechanic Info</h2>
										<p>body work needed done new headlight , grill , needs new hood , radiator is leaking please check the body work needed done new headlight , grill , needs new hood , radiator is leaking please check the
										</p>
			
									<?php include("specialization.php"); ?>
		
								</div>
							</div>	
						</div>
					</div>
				</div>
			
				<div class="col-xs-12">
								
					<?php include("completed-projects-mechanic.php"); ?>
					
					<?php include("gallery.php"); ?> 

				</div>

				</div>
			
			
			</div>
		</div>
		
	</div>

</div>

<?php include("footer.php"); ?>
